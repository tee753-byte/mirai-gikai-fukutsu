"""
PDFから取り組み事項JSONを自動生成するスクリプト（AI不使用）

使い方:
  python3 generate_json.py <pdf> <page_from> <page_to> [y_start] [y_end]

  y_start/y_end: ページ内の対象Y座標範囲（省略時はページ全体）
                 ページをまたぐ場合は page_offset=850px で自動計算

出力: JSON を stdout に出力
"""
import json
import re
import sys
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextBox, LTTextLine

# カラムX座標
X_ITEM   = (155, 260)
X_NEW    = (140, 156)
X_BUDGET = (260, 300)
X_DEPT   = (62,  105)
X_ACCT   = (105, 155)

PAT_PREV_MIXED = re.compile(r'\([\s]*([\d,]+)[\s]*\)')
PAT_CURR       = re.compile(r'^([\d,]+)(?:\s|$)')
PAT_NUM_ONLY   = re.compile(r'^[\d\s]+$')

PAGE_HEIGHT = 850  # ページオフセット（近似）


def parse_amount(s):
    return int(re.sub(r'[,\s]', '', s))


HEADER_TOKENS = {
    '事　　項　　名', '課　名', '予　算　額', '説　　　　　　　　　　明',
    '区分', '款', '項', '目', '（単位：千円）',
    # Policy2 PDF 固有のアノテーション行
    '予算表示', '事項表示', '新規表示', '区分表示課表示',
    '事項新規事項表示', '新規表示説明', '予算額',
}

def is_item_text(text):
    if text in HEADER_TOKENS:
        return False
    if any(tok in text for tok in ('事　　項　　名', '課　名', '予　算　額')):
        return False
    if re.fullmatch(r'\([\s\d,]+\)', text):
        return False
    if PAT_NUM_ONLY.match(text):
        return False
    clean = re.sub(r'^\([\s\d,]+\)\s*', '', text)
    if not clean or len(clean) < 3:
        return False
    # ○ で始まる説明行は除外
    if clean.startswith('○') or clean.startswith('・'):
        return False
    return True


def strip_prev(text):
    return re.sub(r'^\([\s\d,]+\)\s*', '', text)


def extract_lines(pdf_path, page_from, page_to):
    lines = []
    for i, page in enumerate(extract_pages(pdf_path), 1):
        if i < page_from or i > page_to:
            continue
        h = page.height
        y_off = (i - page_from) * PAGE_HEIGHT
        for el in page:
            if isinstance(el, LTTextBox):
                for line in el:
                    if isinstance(line, LTTextLine):
                        t = line.get_text().strip()
                        if t:
                            lines.append((
                                round(y_off + (h - line.y1), 1),
                                round(line.x0, 1),
                                t
                            ))
    lines.sort()
    return lines


def generate(pdf_path, page_from, page_to, y_start=0, y_end=999999):
    lines = extract_lines(pdf_path, page_from, page_to)
    lines = [(y, x, t) for y, x, t in lines if y_start <= y <= y_end]

    items = []
    buf_parts = []
    buf_is_new = False
    buf_prev = None
    last_dept = None
    last_acct = None

    def flush(curr_val):
        if not buf_parts:
            return
        name = ''.join(buf_parts)
        # 末尾に混入した予算額（7文字以上の数字列）を除去
        name = re.sub(r'[\d,]{7,}$', '', name).strip()
        if len(name) < 3:
            return
        items.append({
            "sort_order": len(items) + 1,
            "division": last_dept,
            "account_raw": last_acct,
            "name": name,
            "budget_prev": buf_prev,
            "budget_current": curr_val,
            "is_new": buf_is_new,
            "details": []
        })

    for y, x, text in lines:
        if x >= 300:
            continue

        # 部署名
        if X_DEPT[0] <= x < X_DEPT[1]:
            stripped = text.replace(' ', '')
            if not PAT_NUM_ONLY.match(stripped) and '課　名' not in stripped and len(stripped) >= 2:
                last_dept = stripped
            continue

        # 科目
        if X_ACCT[0] <= x < X_ACCT[1]:
            nums = re.findall(r'\d+', text)
            if nums:
                last_acct = text.strip()
            continue

        # [新]
        if X_NEW[0] <= x < X_NEW[1] and text == '[新]':
            buf_is_new = True
            continue

        # 事項名
        if X_ITEM[0] <= x < X_ITEM[1]:
            clean = strip_prev(text)
            if is_item_text(text) and clean:
                buf_parts.append(clean)
            continue

        # 予算額
        if X_BUDGET[0] <= x < X_BUDGET[1]:
            m_curr = PAT_CURR.match(text)
            if m_curr:
                try:
                    val = parse_amount(m_curr.group(1))
                    if val > 0:
                        flush(val)
                        buf_parts = []
                        buf_is_new = False
                        buf_prev = None
                except Exception:
                    pass
                continue
            m_prev = PAT_PREV_MIXED.search(text)
            if m_prev:
                try:
                    buf_prev = parse_amount(m_prev.group(1))
                except Exception:
                    pass
            continue

    # アカウント番号をパース
    for item in items:
        raw = item.pop('account_raw', None)
        nums = re.findall(r'\d+', raw) if raw else []
        item['account_chapter'] = int(nums[0]) if len(nums) > 0 else None
        item['account_section'] = int(nums[1]) if len(nums) > 1 else None
        item['account_item']    = int(nums[2]) if len(nums) > 2 else None

    return items


if __name__ == '__main__':
    pdf      = sys.argv[1]
    pg_from  = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    pg_to    = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    y_start  = float(sys.argv[4]) if len(sys.argv) > 4 else 0
    y_end    = float(sys.argv[5]) if len(sys.argv) > 5 else 999999

    items = generate(pdf, pg_from, pg_to, y_start, y_end)

    result = {
        "fiscal_year": 2026,
        "policy": {"number": 1, "title": "世界を視野に、未来を見据えて成長し、発展する"},
        "measure": {"title": "（要記入）"},
        "items": items
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
