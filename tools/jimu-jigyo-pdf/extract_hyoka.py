"""事務事業評価書（様式1号）5分冊PDF → items.json（266事業）

使い方:
  python3 extract_hyoka.py <PDF1> [<PDF2> ...] > items.json

各事業シート（「（様式１号）」で始まるページから次のシートまで、通常2ページ）から
ヘッダ・総合計画位置づけ・成果指標表・事業費表・見直し区分・自由記述を抽出する。

抽出方式のポイント:
- 成果指標表・事業費表は罫線が画像化されたシートがあり find_tables が不安定なため、
  単語座標から年度列（X）×行ラベル（Y）のグリッドを復元する
- 見直し区分の選択印は「矩形罫線の囲み」（縦線分ペア）と「楕円カーブ」の2方式が
  混在するため、両方をマーク候補として選択肢語との重なりで判定する
"""

import json
import re
import sys
import unicodedata

import pdfplumber

from common import BUREAUS, normalize_text, parse_amount

# ---------------------------------------------------------------- 正規化

def norm(s):
    if s is None:
        return None
    return unicodedata.normalize("NFKC", s)


def squash(s):
    """空白全除去（アンカー・ラベル照合用）"""
    return re.sub(r"\s+", "", norm(s) or "")


# ---------------------------------------------------------------- 自由記述の区切り

ANCHORS = [
    ("ねらい目的", r"^[1１]\s*事業のねらい・目的"),
    ("事業概要", r"^[2２]\s*事業概要"),
    ("成果指標セクション", r"^[3３]\s*成果指標及び進捗状況"),
    # ページ跨ぎで見出しが折り返す場合があるため前方一致（】まで要求しない）
    ("成果指標設定根拠", r"^【成果指標の設定根拠"),
    ("目標値設定根拠", r"^【目標値の設定根拠"),
    # 「【」直後の改行や原典誤植（「R6度」）があるため【任意・年任意
    ("実績評価と要因", r"^【?R\d+年?度の実績値に対する評価"),
    ("目標見直し", r"^（上記を踏まえた、?目標値の見直し"),
    ("効率化工夫", r"^【効率的な事業の実施"),
    ("事業費セクション", r"^[4４]\s*事業費（千円）"),
    ("見直しセクション", r"^[5５]\s*見直しの内容"),
    ("見直し理由", r"^【上記の理由】"),
    ("見直し内容", r"^【見直し内容】"),
]

FREE_TEXT_KEYS = {
    "ねらい目的",
    "成果指標セクション",
    "成果指標設定根拠",
    "目標値設定根拠",
    "実績評価と要因",
    "目標見直し",
    "効率化工夫",
    "見直し理由",
    "見直し内容",
}

# KPI・事業費グリッドの行ラベル語
KIND_SET = {"目標", "実績", "決算", "見込", "参考", "計画"}

REVIEW_MAJORS = ["継続", "終了"]
REVIEW_MINORS = ["拡充", "改善", "一部改善", "縮小", "完了", "再構築", "廃止"]

YEAR_PAT = re.compile(r"^R\d+$")

# KPI表ヘッダ行の見出し語（「成果指標」「指標（福岡県総合計画）」等の変種がある）
KPI_HEADER_PAT = re.compile(r"指標")

# 領域終端となるアンカー行（squash後の前方一致）
BOUNDARY_PAT = re.compile(
    r"^(【成果指標の設定根拠】|【目標値の設定根拠】|【?R\d+年?度の実績値|"
    r"（上記を踏まえた|【効率的な事業|[4４]事業費|[5５]見直しの内容|【上記の理由】|【見直し内容】)"
)


# ---------------------------------------------------------------- シート分割


def iter_sheets(pdf):
    """様式1号マーカーでページ群に分割して yield (start_pageno, [pages])"""
    groups = []
    for i, page in enumerate(pdf.pages):
        text = page.extract_text() or ""
        if "様式1号" in squash(text)[:40]:
            groups.append([i])
        elif groups:
            groups[-1].append(i)
    for g in groups:
        yield g[0] + 1, [pdf.pages[i] for i in g]


def printed_pageno(page):
    """ページ下部の印字ページ番号（純数字の最終行）"""
    text = page.extract_text() or ""
    for line in reversed(text.splitlines()):
        s = re.sub(r"\s+", "", line)  # 「38 9」のように桁間に空白が入る分冊がある
        if re.fullmatch(r"\d{1,4}", s):
            return int(s)
    return None


# ---------------------------------------------------------------- 単語行グリッド


def group_lines(words, tol=4.0):
    """単語をY座標で行にまとめる。行は上から順、行内は左から順"""
    lines = []
    for w in sorted(words, key=lambda w: (w["top"], w["x0"])):
        placed = False
        for ln in lines:
            if abs(ln["top"] - w["top"]) <= tol:
                ln["words"].append(w)
                ln["top"] = min(ln["top"], w["top"])
                placed = True
                break
        if not placed:
            lines.append({"top": w["top"], "words": [w]})
    lines.sort(key=lambda ln: ln["top"])
    for ln in lines:
        ln["words"].sort(key=lambda w: w["x0"])
        ln["text"] = squash("".join(w["text"] for w in ln["words"]))
    return lines


def line_center_y(line):
    ys = [(w["top"] + w["bottom"]) / 2 for w in line["words"]]
    return sum(ys) / len(ys)


def xc(w):
    return (w["x0"] + w["x1"]) / 2


# ---------------------------------------------------------------- ヘッダ・総合計画（find_tablesで安定）


def _next_value(flat, i):
    """i番目のラベルセルの次の非空セル（結合表でNoneが挟まる変種に対応）"""
    for j in range(i + 1, len(flat)):
        if squash(flat[j]):
            return flat[j]
    return ""


def split_bureau(joined):
    """'福祉労働部こども未来課…' のように部と課が連結した文字列を分割"""
    s = re.sub(r"\s+", "", joined)
    for b in BUREAUS:
        if s.startswith(b):
            rest = s[len(b):]
            # 「福祉労働部労働局」のように局まで含む部局名を優先しているため、
            # 残りが空なら課室なし
            return b, (rest or None)
    return s or None, None


def parse_header_table(rows):
    flat = [norm(c) if c else "" for c in rows[0]]
    name = bureau = kashitsu = start_year = None
    for i, cell in enumerate(flat):
        key = squash(cell)
        if re.fullmatch(r"事.名", key) and name is None:
            name = re.sub(r"\s+", "", _next_value(flat, i)) or None
        elif key in ("部課(室)", "部課（室）"):
            joined = "".join(
                p.strip() for p in _next_value(flat, i).split("\n") if p.strip()
            )
            if joined:
                bureau, kashitsu = split_bureau(joined)
        elif key == "事業開始年度":
            start_year = squash(_next_value(flat, i)) or None
    return name, bureau, kashitsu, start_year


def parse_sogo_keikaku(rows):
    result = {"柱": None, "中項目": None, "小項目": None, "具体的な取組": None}
    label_map = {
        "4つの柱": "柱",
        "中項目": "中項目",
        "小項目": "小項目",
        "具体的な取組": "具体的な取組",
    }
    for row in rows:
        cells = [norm(c) if c else "" for c in row]
        for i, cell in enumerate(cells):
            key = squash(cell)
            if key in label_map:
                for j in range(i + 1, min(i + 4, len(cells))):
                    cand = " ".join(cells[j].split("\n")).strip()
                    if cand and not re.fullmatch(r"[\d\s]+", cand):
                        result[label_map[key]] = re.sub(r"\s+", "", cand)
                        break
    return result


def parse_sogo_keikaku_words(page):
    """罫線が崩れたシート向けの単語座標フォールバック。

    「4つ/の柱」「中項目」「小項目」「具体的/な取組」ラベル語の位置から
    右側・上下帯のゾーンを切って本文を集める。
    """
    words = page.extract_words()

    def find(label):
        for w in words:
            if squash(w["text"]) == label:
                return w
        return None

    hashira = find("4つ") or find("の柱")
    naka = find("中項目")
    sho = find("小項目")
    gutai = find("具体的") or find("な取組")
    if not (naka and sho):
        return None
    anchor = None
    for w in words:
        if squash(w["text"]).startswith("事業のねらい"):
            anchor = w
            break
    block_top = min(x["top"] for x in (hashira, naka, sho, gutai) if x) - 24
    block_bottom = (anchor["top"] - 4) if anchor else sho["bottom"] + 60
    upper = (block_top, sho["top"] - 6)
    lower = (sho["top"] - 6, block_bottom)

    def zone_text(x0, x1, y0, y1):
        zw = [
            w
            for w in words
            if x0 <= xc(w) <= x1 and y0 <= (w["top"] + w["bottom"]) / 2 <= y1
        ]
        lines = group_lines(zw)
        parts = []
        for ln in lines:
            t = squash("".join(w["text"] for w in ln["words"]))
            t = re.sub(r"^\d+\s*", "", t)
            if t:
                parts.append(t)
        return "".join(parts) or None

    right_edge = page.width - 50
    result = {"柱": None, "中項目": None, "小項目": None, "具体的な取組": None}
    if hashira and naka:
        result["柱"] = zone_text(hashira["x1"] + 2, naka["x0"] - 2, *upper)
    if naka:
        result["中項目"] = zone_text(naka["x1"] + 2, right_edge, *upper)
    if sho and gutai:
        result["小項目"] = zone_text(sho["x1"] + 2, gutai["x0"] - 2, *lower)
    if gutai:
        result["具体的な取組"] = zone_text(gutai["x1"] + 2, right_edge, *lower)
    if not any(result.values()):
        return None
    return result


# ---------------------------------------------------------------- 成果指標（単語グリッド）


def find_kpi_regions(lines):
    """ヘッダ行（指標見出し + R\\d+列）を検出し (header_line_idx, years) を返す"""
    regions = []
    for i, ln in enumerate(lines):
        year_words = [w for w in ln["words"] if YEAR_PAT.match(squash(w["text"])) or squash(w["text"]) == "累計"]
        has_label = any(KPI_HEADER_PAT.search(squash(w["text"])) for w in ln["words"])
        if has_label and len([w for w in year_words if YEAR_PAT.match(squash(w["text"]))]) >= 2:
            years = sorted(
                [(squash(w["text"]), xc(w), w["x0"]) for w in year_words],
                key=lambda t: t[1],
            )
            regions.append((i, years))
    return regions


def parse_kpi_region(lines, start_idx, years, end_idx):
    """ヘッダ行の次〜end_idx の行から指標を復元する"""
    first_year_x0 = years[0][2]
    year_centers = [(label, cx) for label, cx, _ in years]

    def year_of(w):
        cx_w = xc(w)
        best = min(year_centers, key=lambda t: abs(t[1] - cx_w))
        return best[0]

    indicators = []
    current = None
    pending_labels = []

    def new_indicator(label_words):
        nonlocal current
        current = {
            "内容": squash("".join(label_words)),
            "目標": {},
            "実績": {},
            "参考": {},
            "累計": {},
            "_rows": [],
        }
        indicators.append(current)

    for ln in lines[start_idx + 1 : end_idx]:
        kind_words = [
            w
            for w in ln["words"]
            if squash(w["text"]) in KIND_SET and xc(w) < first_year_x0
        ]
        label_words = [
            w
            for w in ln["words"]
            if xc(w) < first_year_x0 - 5 and w not in kind_words
        ]
        value_words = [
            w for w in ln["words"] if xc(w) >= first_year_x0 - 5 and w not in kind_words
        ]

        if kind_words:
            kind = squash(kind_words[0]["text"])
            labels_txt = [w["text"] for w in label_words]
            if current is None:
                new_indicator(pending_labels + labels_txt)
            elif kind == "目標":
                if pending_labels or labels_txt or current["目標"]:
                    new_indicator(pending_labels + labels_txt)
                # else: 同一指標内の目標行の続き（まれ）
            elif kind == "実績":
                if not current["実績"]:
                    # 直前指標の実績行。ラベルは指標名の続き
                    if pending_labels or labels_txt:
                        current["内容"] += squash("".join(pending_labels + labels_txt))
                else:
                    new_indicator(pending_labels + labels_txt)
            else:
                # 決算・見込等の参考行。新しいラベルがあれば別指標として扱う
                if pending_labels or labels_txt:
                    new_indicator(pending_labels + labels_txt)
            pending_labels = []
            row_y = line_center_y(ln)
            current["_rows"].append((kind, row_y))
            for w in value_words:
                y = year_of(w)
                _put_kpi_value(current, kind, y, w["text"])
        elif value_words and not label_words and current:
            # 値の続き行（例: '(R8.1月末)'）: 最も近い既存行に連結
            for w in value_words:
                if not current["_rows"]:
                    continue
                wy = (w["top"] + w["bottom"]) / 2
                kind = min(current["_rows"], key=lambda r: abs(r[1] - wy))[0]
                y = year_of(w)
                _put_kpi_value(current, kind, y, w["text"], append=True)
        elif label_words:
            pending_labels.extend(w["text"] for w in label_words)

    # 末尾に残ったラベルは直前指標名の続きとみなす
    if pending_labels and current is not None:
        current["内容"] += squash("".join(pending_labels))

    for ind in indicators:
        ind.pop("_rows", None)
        for k in ("目標", "実績", "参考", "累計"):
            if not ind[k]:
                ind[k] = None
    return [ind for ind in indicators if ind["内容"] or ind["目標"] or ind["実績"]]


def _put_kpi_value(ind, kind, year_label, text, append=False):
    text = normalize_text(text)
    if year_label == "累計":
        target = ind["累計"]
        key = kind
    elif kind == "目標":
        target, key = ind["目標"], year_label
    elif kind == "実績":
        target, key = ind["実績"], year_label
    else:
        target = ind["参考"].setdefault(kind, {})
        key = year_label
    if append and key in target:
        target[key] = f"{target[key]} {text}"
    elif key in target:
        target[key] = f"{target[key]} {text}"
    else:
        target[key] = text


def parse_kpi_page(page):
    words = page.extract_words()
    lines = group_lines(words)
    regions = find_kpi_regions(lines)
    indicators = []
    for ri, (idx, years) in enumerate(regions):
        end_idx = len(lines)
        # 次のヘッダ行 or 境界アンカー行まで
        for j in range(idx + 1, len(lines)):
            if BOUNDARY_PAT.match(lines[j]["text"]):
                end_idx = j
                break
            if ri + 1 < len(regions) and j >= regions[ri + 1][0]:
                end_idx = regions[ri + 1][0]
                break
        indicators.extend(parse_kpi_region(lines, idx, years, end_idx))
    return indicators


# ---------------------------------------------------------------- 事業費（単語グリッド）


def parse_budget_page(page):
    words = page.extract_words()
    lines = group_lines(words)
    header_idx = None
    money_cols = []  # (label, x_center)
    hr_cols = []
    for i, ln in enumerate(lines):
        mc = [
            (squash(w["text"]), xc(w))
            for w in ln["words"]
            if re.fullmatch(r"R\d+(決算|当初)", squash(w["text"]))
        ]
        if len(mc) >= 2:
            header_idx = i
            money_cols = sorted(mc, key=lambda t: t[1])
            jin = [w for w in ln["words"] if squash(w["text"]) == "人件費"]
            if jin:
                jx = xc(jin[0])
                hr_cols = sorted(
                    [
                        (squash(w["text"]), xc(w))
                        for w in ln["words"]
                        if YEAR_PAT.fullmatch(squash(w["text"])) and xc(w) > jx
                    ],
                    key=lambda t: t[1],
                )
            break
    if header_idx is None:
        return None

    # 補正列（例: 「R7.2月補正」が2行に分かれてヘッダに載る変種）を動的に追加
    for j in range(max(0, header_idx - 1), min(len(lines), header_idx + 2)):
        for w in lines[j]["words"]:
            if "補正" not in squash(w["text"]):
                continue
            cx_w = xc(w)
            if any(abs(cx_w - c) < 15 for _, c in money_cols):
                continue
            label_parts = []
            for k in range(max(0, header_idx - 1), min(len(lines), header_idx + 2)):
                for w2 in lines[k]["words"]:
                    if abs(xc(w2) - cx_w) < 22:
                        label_parts.append((lines[k]["top"], squash(w2["text"])))
            label = "".join(t for _, t in sorted(label_parts)) or "補正"
            money_cols.append((label, cx_w))
    money_cols.sort(key=lambda t: t[1])

    all_cols = [(lbl, cx, "money") for lbl, cx in money_cols] + [
        (lbl, cx, "hr") for lbl, cx in hr_cols
    ]

    budget = {}
    jinkenhi = {}
    pending = None  # ラベル行が折り返して値が次行に来る変種（例: （うち一般/財源）/値）
    for ln in lines[header_idx + 1 : header_idx + 10]:
        if BOUNDARY_PAT.match(ln["text"]):
            break
        text = ln["text"]
        has_number = any(
            re.fullmatch(r"[-−▲]?[\d,]+", squash(w["text"])) for w in ln["words"]
        )
        if "歳出" in text:
            money_key, hr_key = "歳出", "時間"
        elif "うち一般" in text:
            money_key, hr_key = "一般財源", "千円"
        elif text.startswith("時間"):
            money_key, hr_key = None, "時間"
        elif text.startswith("人件費") or text.startswith("(千円)"):
            money_key, hr_key = None, "千円"
        elif has_number and pending:
            money_key, hr_key = pending
        else:
            continue
        if not has_number:
            pending = (money_key, hr_key)
            continue
        pending = None
        for w in ln["words"]:
            raw = squash(w["text"])
            if not re.fullmatch(r"[-−▲]?[\d,]+", raw):
                continue
            cx_w = xc(w)
            lbl, col_x, coltype = min(all_cols, key=lambda t: abs(t[1] - cx_w))
            if abs(col_x - cx_w) > 30:
                continue  # どの列にも属さない数値（脚注等）は捨てる
            amount = parse_amount(raw.replace("▲", "-").replace("−", "-"))
            if coltype == "money" and money_key:
                budget.setdefault(lbl, {})[money_key] = amount
            elif coltype == "hr" and hr_key:
                jinkenhi.setdefault(lbl, {})[hr_key] = amount
    if not budget:
        return None
    return {"年度別": budget, "人件費": jinkenhi or None}


# ---------------------------------------------------------------- 見直し区分（囲み枠・楕円検出）


def mark_bboxes(page):
    """選択印候補のbbox。分冊・シートにより描画方式が異なる:
    - 楕円カーブ / 1オブジェクトの小矩形（枠・塗り）
    - 細い縦線分4本で構成された囲み枠（ペアから矩形を復元）
    - 丸印スタンプの小画像
    """
    boxes = []
    vsegs = []
    for o in page.curves + page.rects:
        w = o["x1"] - o["x0"]
        h = o["bottom"] - o["top"]
        if 10 <= w <= 250 and 6 <= h <= 30:
            boxes.append((o["x0"], o["top"], o["x1"], o["bottom"]))
    for o in page.images:
        w = o["x1"] - o["x0"]
        h = o["bottom"] - o["top"]
        if 15 <= w <= 150 and 8 <= h <= 40:
            boxes.append((o["x0"], o["top"], o["x1"], o["bottom"]))
    hsegs = []
    for o in page.rects + page.lines:
        w = o["x1"] - o["x0"]
        h = o["bottom"] - o["top"]
        if h > 5 and w < 3:
            vsegs.append(o)
        elif w > 5 and h < 3:
            hsegs.append(o)
    # 縦線分ペア + それを繋ぐ横線分（枠の上辺 or 下辺）がある場合のみ枠とみなす。
    # 総当たりペアだけだと「隣り合う枠の右端×左端」の偽ボックスができ、
    # 間にある選択肢を誤検出する（somu p27 で実際に発生）。
    for a in vsegs:
        for b in vsegs:
            dx = b["x0"] - a["x1"]
            if not (10 <= dx <= 250):
                continue
            y_top = max(a["top"], b["top"])
            y_bottom = min(a["bottom"], b["bottom"])
            if y_bottom - y_top <= 6:
                continue
            connected = any(
                hs["x0"] <= a["x0"] + 4
                and hs["x1"] >= b["x1"] - 4
                and (
                    abs(hs["top"] - y_top) < 4 or abs(hs["bottom"] - y_bottom) < 4
                )
                for hs in hsegs
            )
            if connected:
                boxes.append((a["x0"], y_top, b["x1"], y_bottom))
    return boxes


def detect_review_marks(page):
    text = page.extract_text() or ""
    if not re.search(r"[5５]\s*見直しの内容", norm(text)):
        return None, None, False
    words = page.extract_words()
    anchor = None
    for w in words:
        if squash(w["text"]) == "見直しの内容":
            anchor = w
            break
    if anchor is None:
        return None, None, False
    band_top, band_bottom = anchor["bottom"], anchor["bottom"] + 90

    options = []
    for w in words:
        if not (band_top <= w["top"] <= band_bottom):
            continue
        t = squash(w["text"])
        for opt in REVIEW_MAJORS + REVIEW_MINORS:
            if t == opt or t.startswith(opt + "(") or t.startswith(opt + "（"):
                char_w = (w["x1"] - w["x0"]) / max(len(w["text"]), 1)
                options.append(
                    {
                        "opt": opt,
                        "level": "major" if opt in REVIEW_MAJORS else "minor",
                        "x0": w["x0"],
                        "x1": w["x0"] + char_w * len(opt),
                        "top": w["top"],
                        "bottom": w["bottom"],
                    }
                )
                break

    boxes = [
        (bx0, bt, bx1, bb)
        for bx0, bt, bx1, bb in mark_bboxes(page)
        if bt < band_bottom and bb > band_top
    ]
    major = minor = None
    for o in sorted(options, key=lambda o: (o["top"], o["x0"])):
        core_w = o["x1"] - o["x0"]
        for bx0, bt, bx1, bb in boxes:
            y_ov = min(bb, o["bottom"]) - max(bt, o["top"])
            x_ov = min(bx1, o["x1"]) - max(bx0, o["x0"])
            if y_ov > (o["bottom"] - o["top"]) * 0.5 and x_ov > core_w * 0.6:
                if o["level"] == "major" and major is None:
                    major = o["opt"]
                elif o["level"] == "minor" and minor is None:
                    minor = o["opt"]
                break
    return major, minor, True


# ---------------------------------------------------------------- 自由記述


def extract_free_texts(pages):
    lines = []
    for page in pages:
        for line in (page.extract_text() or "").splitlines():
            lines.append(norm(line))
    lines = [ln for ln in lines if not re.fullmatch(r"[\d\s]{1,7}", ln)]
    text = "\n".join(lines)
    positions = []
    for key, pat in ANCHORS:
        m = re.search(pat, text, re.MULTILINE)
        if m:
            positions.append((m.start(), m.end(), key))
    positions.sort()
    out = {}
    for idx, (start, end, key) in enumerate(positions):
        if key not in FREE_TEXT_KEYS:
            continue
        next_start = positions[idx + 1][0] if idx + 1 < len(positions) else len(text)
        chunk = text[end:next_start].strip()
        # 折り返した見出しの残り（「…とその要因】」等）を除去
        chunk = re.sub(r"^[^\n】]{0,15}】\s*", "", chunk)
        chunk = re.sub(r"\n{2,}", "\n", chunk)
        out[key] = chunk or None
    return out


# ---------------------------------------------------------------- シート解析


def parse_sheet(pageno, pages, pdf_name):
    warns = []
    first = pages[0]

    name = bureau = kashitsu = start_year = None
    sogo = None

    for t in first.find_tables():
        grid = t.extract()
        if not grid or not grid[0] or not grid[0][0]:
            continue
        cells_flat = {squash(c) for row in grid for c in row if c}
        if name is None and any(re.fullmatch(r"事.名", c) for c in cells_flat):
            name, bureau, kashitsu, start_year = parse_header_table(grid)
        if sogo is None and cells_flat & {"4つの柱", "小項目", "中項目"}:
            cand = parse_sogo_keikaku(grid)
            if any(cand.values()):
                sogo = cand
    if sogo is None or not all(sogo.values()):
        cand = parse_sogo_keikaku_words(first)
        if cand:
            if sogo is None:
                sogo = cand
            else:
                for k, v in cand.items():
                    if not sogo.get(k):
                        sogo[k] = v

    indicators = []
    for page in pages:
        indicators.extend(parse_kpi_page(page))

    budget = None
    for page in pages:
        budget = parse_budget_page(page)
        if budget:
            break

    major = minor = None
    for page in pages:
        mj, mn, found_section = detect_review_marks(page)
        if found_section:
            major, minor = mj, mn
            break
    # 小区分のみに丸印があるシートは大区分を小区分から推論する
    if major is None and minor is not None:
        major = "終了" if minor in ("完了", "再構築", "廃止") else "継続"

    texts = extract_free_texts(pages)

    # 指標表がなく自由記述で進捗を記載するシートがある（例: 総務部No.26）
    shinchoku_text = None
    if not indicators:
        shinchoku_text = texts.get("成果指標セクション")

    if name is None:
        warns.append("事業名が取得できません")
    if major is None:
        warns.append("見直し大区分（囲み枠）を検出できません")
    if not indicators and not shinchoku_text:
        warns.append("成果指標が0件です（進捗状況テキストもなし）")
    if budget is None or not budget.get("年度別"):
        warns.append("事業費が取得できません")
    if sogo is None:
        warns.append("総合計画位置づけが取得できません")

    item = {
        "事業名": name,
        "部局": bureau,
        "課室": kashitsu,
        "事業開始年度": start_year,
        "総合計画位置づけ": sogo,
        "ねらい目的": texts.get("ねらい目的"),
        "成果指標": indicators,
        "進捗状況テキスト": shinchoku_text,
        "成果指標設定根拠": texts.get("成果指標設定根拠"),
        "目標値設定根拠": texts.get("目標値設定根拠"),
        "実績評価と要因": texts.get("実績評価と要因"),
        "目標見直し": texts.get("目標見直し"),
        "効率化工夫": texts.get("効率化工夫"),
        "事業費": budget,
        "見直し": {
            "大区分": major,
            "小区分": minor,
            "理由": texts.get("見直し理由"),
            "内容": texts.get("見直し内容"),
        },
        "出典": {
            "pdf": pdf_name,
            "印字ページ": printed_pageno(first),
            "pdfページ": pageno,
        },
    }
    return item, warns


def main():
    if len(sys.argv) < 2:
        print(__doc__, file=sys.stderr)
        sys.exit(1)
    all_items = []
    total_warns = 0
    for pdf_path in sys.argv[1:]:
        pdf_name = pdf_path.rsplit("/", 1)[-1]
        with pdfplumber.open(pdf_path) as pdf:
            for pageno, pages in iter_sheets(pdf):
                item, warns = parse_sheet(pageno, pages, pdf_name)
                item["整理番号"] = len(all_items) + 1
                all_items.append(item)
                for w in warns:
                    total_warns += 1
                    print(
                        f"WARN [{pdf_name} p{pageno} No.{item['整理番号']} {item['事業名']}]: {w}",
                        file=sys.stderr,
                    )
    print(f"抽出件数: {len(all_items)} / WARN: {total_warns}", file=sys.stderr)
    print(json.dumps(all_items, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
