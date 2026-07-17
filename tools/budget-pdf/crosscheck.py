"""
JSON vs PDF クロスチェッカー v3（AI不使用）

アルゴリズム:
  1. pdfminer で LTTextLine を (y, x, text) に変換
  2. 「当年度予算額（括弧なし数字）」を事項の区切りとして使う
     → 各事項の名前・[新]・前年予算は、直前の当年予算から次の当年予算の間に集まる
  3. JSON の各事項と突き合わせて差分を報告

Usage:
  python3 crosscheck.py [pdf] [json] [page_from=1] [page_to=2]
"""
import json
import re
import sys
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextBox, LTTextLine

# ======== カラム X 座標（pdfminer 左下原点を上下反転した座標系）========
X_ITEM   = (155, 260)   # 事項名（260以上はX_BUDGETと重複するため除外）
X_NEW    = (140, 156)   # [新] マーク
X_BUDGET = (260, 300)   # 予算額列（前年括弧付き＋当年）
X_IGNORE = (300, 600)   # 説明テキスト（無視）

PAT_PREV_MIXED = re.compile(r'\([\s]*([\d,]+)[\s]*\)')           # 括弧あり → 前年度
PAT_CURR = re.compile(r'^([\d,]+)(?:\s|$)')                      # 先頭が数字 → 当年度（後続テキストも許容）


def parse_amount(s):
    return int(re.sub(r'[,\s]', '', s))


def extract_lines(pdf_path, page_from, page_to):
    """指定ページ範囲の LTTextLine を (y, x, text) で返す（y は上→下昇順）"""
    lines = []
    for i, page in enumerate(extract_pages(pdf_path), 1):
        if i < page_from:
            continue
        if i > page_to:
            break
        height = page.height
        y_offset = (i - page_from) * 850   # ページ間オフセット
        for el in page:
            if isinstance(el, LTTextBox):
                for line in el:
                    if isinstance(line, LTTextLine):
                        text = line.get_text().strip()
                        if not text:
                            continue
                        x = round(line.x0, 1)
                        y = round(y_offset + (height - line.y1), 1)
                        lines.append((y, x, text))
    lines.sort()
    return lines


HEADER_PATTERNS = {'事　　項　　名', '課　名', '予　算　額', '区分', '説　　　　　　　　　　明',
                   '款', '項', '目', '（単位：千円）'}

def is_item_name_text(text):
    """事項名として有効なテキストか判定"""
    if text in HEADER_PATTERNS or '事　　項' in text or '課　名' in text or '予　算　額' in text:
        return False
    if re.fullmatch(r'[\d\s]+', text):   # 科目番号のみ
        return False
    if re.fullmatch(r'\([\s\d,]+\)', text):  # 前年予算のみ
        return False
    # 前年予算が先頭に混入している場合（例: "(468,558)英語教育充実費"）→ 除去後チェック
    clean = re.sub(r'^\([\s\d,]+\)\s*', '', text)
    return bool(clean) and len(clean) >= 3


def strip_prev_from_item(text):
    """事項名テキスト先頭の前年予算を除去して返す"""
    return re.sub(r'^\([\s\d,]+\)\s*', '', text)


def parse_items_from_lines(lines):
    """
    当年度予算額（X_BUDGET列の括弧なし数字）を区切りとして、
    各事項 {name, budget_prev, budget_current, is_new} を生成する。
    """
    items = []

    # 現在処理中の事項バッファ
    buf_parts   = []   # 事項名パーツ
    buf_is_new  = False
    buf_prev    = None

    def flush(curr_val):
        """バッファをフラッシュして事項を確定"""
        if not buf_parts:
            return
        name = ''.join(buf_parts)
        # 空行や区分ラベルを除外
        if len(name) < 4:
            return
        items.append({
            'name': name,
            'budget_prev': buf_prev,
            'budget_current': curr_val,
            'is_new': buf_is_new,
        })

    for y, x, text in lines:
        # 説明テキスト・金額列は完全スキップ
        if x >= X_IGNORE[0]:
            continue

        # [新] マーク
        if X_NEW[0] <= x < X_NEW[1] and text == '[新]':
            buf_is_new = True
            continue

        # 事項名列
        if X_ITEM[0] <= x < X_ITEM[1]:
            clean = strip_prev_from_item(text)
            if is_item_name_text(text) and clean:
                buf_parts.append(clean)
            continue

        # 予算額列
        if X_BUDGET[0] <= x < X_BUDGET[1]:
            # 当年度予算（括弧なし数字） → 事項の区切り
            m_curr = PAT_CURR.match(text)
            if m_curr:
                try:
                    val = parse_amount(m_curr.group(1))
                    if val > 0:
                        flush(val)
                        buf_parts  = []
                        buf_is_new = False
                        buf_prev   = None
                except Exception:
                    pass
                continue

            # 前年度予算（括弧付き）
            m_prev = PAT_PREV_MIXED.search(text)
            if m_prev:
                try:
                    buf_prev = parse_amount(m_prev.group(1))
                except Exception:
                    pass
            continue

    return items


def check(pdf_path, json_path, page_from=1, page_to=2):
    lines = extract_lines(pdf_path, page_from, page_to)
    pdf_items = parse_items_from_lines(lines)

    with open(json_path) as f:
        data = json.load(f)
    json_items = data['items']

    print(f"PDF抽出事項数: {len(pdf_items)}  JSON事項数: {len(json_items)}")
    print("=" * 72)

    warns = 0
    matched_pdf_ids = set()

    for ji, jitem in enumerate(json_items):
        jname = jitem['name']

        # 最良マッチ: 事項名の先頭8文字が一致 or 主要キーワードが含まれる
        key = jname[:8]
        candidates = [
            (i, p) for i, p in enumerate(pdf_items)
            if i not in matched_pdf_ids and (key in p['name'] or p['name'][:8] in jname)
        ]

        if not candidates:
            # フォールバック: 長い共通部分文字列
            candidates = [
                (i, p) for i, p in enumerate(pdf_items)
                if i not in matched_pdf_ids and any(
                    len(chunk) >= 5 and chunk in p['name']
                    for chunk in [jname[k:k+8] for k in range(0, len(jname)-4, 4)]
                )
            ]

        if not candidates:
            print(f"[WARN] #{ji+1} PDFに見つからない: 「{jname}」")
            warns += 1
            continue

        # y座標順で最初のものを採用（PDF上の出現順に対応）
        pid, p = candidates[0]
        matched_pdf_ids.add(pid)

        issues = []

        # 事項名チェック（スペース正規化して比較）
        def normalize(s):
            # 全角英数字→半角に統一（ＯＰＥＮとOPENを同一視）
            s = s.translate(str.maketrans(
                '０１２３４５６７８９ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ',
                '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
            ))
            # 改行由来のスペース抜け対策: 小文字→大文字境界（IgniteCanpass → Ignite Canpass）
            s = re.sub(r'([a-z])([A-Z])', r'\1 \2', s)
            # アルファベット↔日本語境界
            s = re.sub(r'([a-zA-Z])([^\s\-a-zA-Z])', r'\1 \2', s)
            s = re.sub(r'([^\s\-a-zA-Z])([a-zA-Z])', r'\1 \2', s)
            return re.sub(r'\s+', ' ', s).strip()

        if normalize(p['name']) != normalize(jname):
            issues.append(f"事項名\n    PDF=「{p['name']}」\n    JSON=「{jname}」")

        # 前年度予算
        jp_prev = jitem.get('budget_prev')
        pp_prev = p.get('budget_prev')
        if pp_prev is not None and jp_prev != pp_prev:
            issues.append(f"budget_prev: JSON={jp_prev:,}  PDF={pp_prev:,}")

        # 当年度予算
        jp_curr = jitem.get('budget_current')
        pp_curr = p.get('budget_current')
        if pp_curr is not None and jp_curr != pp_curr:
            issues.append(f"budget_current: JSON={jp_curr:,}  PDF={pp_curr:,}")

        # 新規フラグ
        j_new = jitem.get('is_new', False)
        p_new = p.get('is_new', False)
        if p_new != j_new:
            issues.append(f"is_new: JSON={j_new}  PDF={p_new}")

        if issues:
            print(f"[WARN] #{ji+1} 「{jname}」")
            for iss in issues:
                print(f"         → {iss}")
            warns += 1
        else:
            new_mark = " [新]" if j_new else ""
            print(f"[OK]  #{ji+1}{new_mark} 「{jname}」  ({jp_prev})→{jp_curr}")

    print("=" * 72)
    print(f"OK: {len(json_items)-warns}  WARN: {warns}  / {len(json_items)}件")

    # PDF に存在してJSON で未照合の事項
    extras = [(i, p) for i, p in enumerate(pdf_items) if i not in matched_pdf_ids]
    if extras:
        print(f"\n[INFO] PDFにあるがJSONで未照合の事項 ({len(extras)}件):")
        for _, p in extras:
            print(f"  - ({p['budget_prev']})→{p['budget_current']} 「{p['name']}」")


if __name__ == '__main__':
    PDF     = sys.argv[1] if len(sys.argv) > 1 else \
              "/home/tajuu/.claude/projects/-home-tajuu-bakumon1107-mirai-gikai-fukuoka-pref/6c05557b-ec3f-4aa3-9269-e085e85fb0bd/tool-results/webfetch-1780112809397-unc1t9.pdf"
    JSON    = sys.argv[2] if len(sys.argv) > 2 else \
              "/home/tajuu/bakumon1107/mirai-gikai-fukuoka-pref/docs/data/policy1-measure1-jinzai-ikusei.json"
    PG_FROM = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    PG_TO   = int(sys.argv[4]) if len(sys.argv) > 4 else 2

    check(PDF, JSON, PG_FROM, PG_TO)
