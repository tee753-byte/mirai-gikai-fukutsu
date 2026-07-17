"""
令和8年度当初予算概要 PDF（277131.pdf）パーサー
プレゼン形式の1事業1カード構造を解析してJSONに変換する。

Usage:
  python3 tools/budget-pdf/parse_summary.py <pdf_path> [page_from] [page_to]
"""
import json
import re
import sys
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextBox, LTTextLine

# ページレイアウト定数
PAGE_W = 737
PAGE_H = 567
Y_SECTION_MAX  = 80    # セクションヘッダーの最大y（ページ上部）
Y_SECTION2_MAX = 150   # サブセクションヘッダーの最大y
H_SECTION = 22         # セクションヘッダーの最小高さ
H_SECTION2 = 17        # サブセクションヘッダーの最小高さ
H_ITEM = 14            # 事業行の最小高さ
H_DESC = 9             # 説明行の最小高さ
X_PAGE_NUM = 700       # ページ番号のx座標（除外）

# 金額パターン
PAT_AMOUNT = re.compile(
    r'(?:（|\[2月補正\]\s*)?(\d[\d,]*)\s*億\s*(\d[\d,]*)?\s*万円'
    r'|(?:\[2月補正\]\s*)?(\d[\d,]*)\s*万円'
    r'|(?:\[2月補正\]\s*)?(\d[\d,]*)\s*億円'
)
PAT_COST_NAME = re.compile(r'[（(]([^）)]{3,60})[）)]')
PAT_IS_2GATSU = re.compile(r'[（\[［]2月補正[）\]］]')
PAT_BUDGET_LINE = re.compile(r'万円|億円|融資枠')


def parse_amount_yen(text):
    """テキストから当初予算金額を万円単位で返す。2月補正の前にある金額を優先。"""
    # 2月補正マーカーより前のテキストに当初予算がある場合はそちらを使う
    pat_2g = re.compile(r'[（\[［]2月補正[）\]］]')
    m2g = pat_2g.search(text)
    search_text = text[:m2g.start()] if m2g else text

    def extract_from(t):
        # 億+万 パターン: "1億217万円"
        m = re.search(r'(\d[\d,]*)\s*億\s*(\d[\d,]*)\s*万円', t)
        if m:
            oku = int(re.sub(r',', '', m.group(1)))
            man = int(re.sub(r',', '', m.group(2))) if m.group(2) else 0
            return oku * 10000 + man
        # 億のみ: "3億円"
        m = re.search(r'(\d[\d,]*)\s*億円', t)
        if m:
            return int(re.sub(r',', '', m.group(1))) * 10000
        # 万円のみ: "1,128万円"
        m = re.search(r'(\d[\d,]*)\s*万円', t)
        if m:
            return int(re.sub(r',', '', m.group(1)))
        return None

    result = extract_from(search_text)
    if result is None and m2g:
        # 当初予算がない場合は2月補正分を使う
        result = extract_from(text[m2g.end():])
    return result


def extract_cost_name(text):
    """テキストから（費用名）を抽出"""
    # 「融資枠」パターンは費用名ではない
    text_no_kinyu = re.sub(r'融資枠[^（]*', '', text)
    m = PAT_COST_NAME.search(text_no_kinyu)
    return m.group(1).strip() if m else None


def extract_elements(pdf_path, page_from=5, page_to=999):
    """PDFから全テキスト要素を (y_abs, x0, x1, height, text) で返す"""
    elements = []
    for i, page in enumerate(extract_pages(pdf_path), 1):
        if i < page_from or i > page_to:
            continue
        h = page.height
        y_offset = (i - page_from) * (PAGE_H + 10)
        for el in page:
            if isinstance(el, LTTextBox):
                for line in el:
                    if isinstance(line, LTTextLine):
                        t = line.get_text().strip()
                        if not t:
                            continue
                        x0 = round(line.x0, 1)
                        x1 = round(line.x1, 1)
                        line_h = round(line.y1 - line.y0, 1)
                        y_abs = round(y_offset + (h - line.y1), 1)
                        elements.append((y_abs, x0, x1, line_h, i, t))
    elements.sort()
    return elements


def parse(pdf_path, page_from=5, page_to=49):
    elements = extract_elements(pdf_path, page_from, page_to)

    cards = []
    current_section = ""
    current_subsection = ""
    current_card = None
    in_keizoku = False  # <継続事業> ブロック内フラグ

    def save_card():
        if current_card and current_card.get("title"):
            cards.append(current_card.copy())

    for y_abs, x0, x1, line_h, page_num, text in elements:
        # ページ番号を除外（右端の短い数字）
        if x0 > X_PAGE_NUM:
            continue
        # フッター・ヘッダー系の除外
        if text in {"令和８年２月", "福   岡   県"}:
            continue

        y_local = y_abs % (PAGE_H + 10)  # ページ内の相対y

        # ---- セクションヘッダー検出 ----
        # 上部大きいフォント
        is_main_section = (line_h >= H_SECTION and y_local <= Y_SECTION_MAX and x0 < 400)
        is_sub_section = (
            line_h >= H_SECTION2 and y_local <= Y_SECTION2_MAX + 50
            and not PAT_BUDGET_LINE.search(text)
            and not text.startswith('・')
            and not text.startswith('■')
            and len(text) > 10
            and '万円' not in text and '億円' not in text
        )

        if is_main_section and not PAT_BUDGET_LINE.search(text):
            save_card()
            current_card = None
            current_section = text.strip()
            current_subsection = ""
            continue

        if is_sub_section and y_local < Y_SECTION2_MAX:
            save_card()
            current_card = None
            current_subsection = text.strip()
            continue

        # ■ 小見出し（ページ内区切り）
        if text.startswith('■'):
            current_subsection = text.lstrip('■').strip()
            in_keizoku = False  # 新しい小見出しでリセット
            continue

        # <継続事業> マーカー
        if '<継続事業>' in text or '＜継続事業＞' in text:
            in_keizoku = True
            continue

        # 新規セクション・サブセクションが来たらリセット
        if is_main_section or (is_sub_section and y_local < Y_SECTION2_MAX):
            in_keizoku = False

        # ---- 説明行を先に処理（万円が含まれていても事業行と誤判定しないため）----
        if text.startswith('・') or text.startswith('○'):
            if current_card:
                current_card["descriptions"].append(
                    text.lstrip('・').lstrip('○').strip()
                )
            continue

        # ※注記・①②③... → 説明の追加情報として取り込む
        is_note = text.startswith('※') or (text and '①' <= text[0] <= '⑳')
        if is_note:
            if current_card:
                current_card["descriptions"].append(text.strip())
            continue

        # ---- 事業行の検出 ----
        # タイトル候補（金額・費用名・補正マークを除去した残り）を事前計算
        candidate_title = re.sub(r'\s*\[2月補正\]\s*', '', text)
        candidate_title = re.sub(r'\s*[\d,]+\s*億?\s*[\d,]*\s*万円.*', '', candidate_title)
        candidate_title = re.sub(r'\s*[\d,]+\s*億円.*', '', candidate_title)
        candidate_title = re.sub(r'\s*総融資枠.*', '', candidate_title)
        candidate_title = re.sub(r'[（(][^）)]{3,60}[）)]', '', candidate_title).strip()

        # 「予算＋費用名のみ」行 → 現在のカードに補完（x位置を問わず）
        if PAT_BUDGET_LINE.search(text) and len(candidate_title) < 5 and current_card:
            if current_card.get('budget_manyen') is None:
                current_card['budget_manyen'] = parse_amount_yen(text)
            if PAT_IS_2GATSU.search(text):
                current_card['is_2gatsu_hose'] = True
            if current_card.get('cost_name') is None:
                cost = extract_cost_name(text)
                if cost:
                    current_card['cost_name'] = cost
            continue

        # 「融資枠N億円」形式の特殊カード → 前のカードを確定し、融資枠カードとして新規作成
        if '総融資枠' in text or ('融資枠' in text and '億円' in text and len(candidate_title) < 20):
            save_card()
            # タイトル部分（「総融資枠...」より前のテキスト）
            loan_title = re.sub(r'\s*総融資枠.*', '', text)
            loan_title = re.sub(r'\s*融資枠.*', '', loan_title).strip()
            # 融資枠の金額（億円単位）
            m_loan = re.search(r'総?融資枠\s*([\d,]+)\s*億円', text)
            loan_manyen = int(re.sub(r',','',m_loan.group(1))) * 10000 if m_loan else None
            current_card = {
                "section": current_section,
                "subsection": current_subsection,
                "title": loan_title or text.strip(),
                "budget_manyen": loan_manyen,
                "is_2gatsu_hose": bool(PAT_IS_2GATSU.search(text)),
                "is_keizoku": in_keizoku,
                "cost_name": extract_cost_name(text),
                "descriptions": [],
                "_page": page_num,
            }
            continue

        if PAT_BUDGET_LINE.search(text) or (line_h >= H_ITEM and x0 < 200 and not text.startswith('・')):
            # 新しい事業カード開始
            has_amount = PAT_BUDGET_LINE.search(text) is not None

            if has_amount:
                save_card()
                amount = parse_amount_yen(text)
                cost_name = extract_cost_name(text)
                is_2gatsu = bool(PAT_IS_2GATSU.search(text))

                # タイトル部分（金額・費用名・補正マークを除去）
                title = text
                title = re.sub(r'\s*\[2月補正\]\s*', ' ', title)
                title = re.sub(r'\s*（2月補正）\s*', ' ', title)
                title = re.sub(r'\s*\d[\d,]*\s*億?\s*\d*\s*万円.*', '', title)
                title = re.sub(r'\s*\d[\d,]*\s*億円.*', '', title)
                title = re.sub(r'\s*\d[\d,]*\s*億\s*$', '', title)  # 末尾の「N億」を除去
                title = re.sub(r'\s*融資枠.*', '', title)
                title = re.sub(r'[（(][^）)]{3,60}[）)]', '', title)
                title = title.strip()

                # 金額が2月補正のみか当初のみか両方か
                amounts = {}
                # 当初予算分と2月補正分を分けて取得
                # "[2月補正] N万円" の前にある金額 → 当初
                m_toho = re.search(r'(\d[\d,]*(?:億\d[\d,]*)?)\s*万円(?!\s*\[)', text)
                m_hose = re.search(r'\[2月補正\]\s*(\d[\d,]*(?:億\d[\d,]*)?\s*万円|\d[\d,]*億円)', text)

                current_card = {
                    "section": current_section,
                    "subsection": current_subsection,
                    "title": title,
                    "budget_manyen": amount,
                    "is_2gatsu_hose": is_2gatsu,
                    "is_keizoku": in_keizoku,
                    "cost_name": cost_name,
                    "descriptions": [],
                    "_page": page_num,
                }
            elif current_card is None and line_h >= H_ITEM:
                # 金額なしの見出し行（まだ金額が来ていない → 次の行と結合するケース）
                current_card = {
                    "section": current_section,
                    "subsection": current_subsection,
                    "title": text.strip(),
                    "budget_manyen": None,
                    "is_2gatsu_hose": False,
                    "is_keizoku": in_keizoku,
                    "cost_name": None,
                    "descriptions": [],
                    "_page": page_num,
                }
            continue

        # 画像キャプション除外（＜...＞）
        if text.startswith('＜') or text.startswith('<'):
            continue

        # ---- 費用名の続き行（（費用名）が次の行にある場合）----
        if current_card and (text.startswith('（') or text.startswith('(')) and current_card.get("cost_name") is None:
            cost = extract_cost_name(text)
            if cost:
                current_card["cost_name"] = cost
                if current_card.get("budget_manyen") is None:
                    amt = parse_amount_yen(text)
                    if amt:
                        current_card["budget_manyen"] = amt
            continue

        # ---- 説明行 ----
        if text.startswith('・') or text.startswith('○'):
            if current_card:
                current_card["descriptions"].append(
                    text.lstrip('・').lstrip('○').strip()
                )
            continue

        # ---- 説明の続き行（インデントされた折り返し）----
        # ※ や ①②... や 【...】 は新しいアイテムとして扱い連結しない
        is_new_note = (
            text.startswith('※')
            or (text and '①' <= text[0] <= '⑳')
            or (text.startswith('【') and '】' in text)
        )
        if current_card and x0 > 40 and not PAT_BUDGET_LINE.search(text) and line_h < H_ITEM:
            if not is_new_note and current_card["descriptions"]:
                current_card["descriptions"][-1] += text
            elif is_new_note:
                current_card["descriptions"].append(text.strip())
            continue

    save_card()

    # 後処理: budget_manyen が None の不完全カードを除去
    cards = [c for c in cards if c.get("title") and len(c["title"]) >= 4]

    # _page を除去
    for c in cards:
        c.pop("_page", None)

    return cards


if __name__ == "__main__":
    pdf = sys.argv[1] if len(sys.argv) > 1 else None
    if not pdf:
        print("Usage: python3 parse_summary.py <pdf_path>", file=sys.stderr)
        sys.exit(1)

    pg_from = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    pg_to   = int(sys.argv[3]) if len(sys.argv) > 3 else 49

    cards = parse(pdf, pg_from, pg_to)

    print(json.dumps({
        "fiscal_year": 2026,
        "source": "令和8年度当初予算の概要",
        "cards": cards,
    }, ensure_ascii=False, indent=2))
