"""公共事業再評価に関する総括表（様式3号）PDF → saihyoka.json

使い方:
  python3 extract_saihyoka.py <総括表PDF> > saihyoka.json

列: 担当部課名 / 事業名称 / 事業期間 / 市町村・地区等名 /
    事業の目的・概要・進捗 / 事業費（千円: 上段=R7年度までの事業費、
    下段（）=事業期間における総事業費） / 再評価 / 理由
"""

import json
import re
import sys

import pdfplumber

from common import normalize_text, parse_amount


def norm_multiline(cell):
    if not cell:
        return None
    text = "\n".join(
        ln.strip() for ln in normalize_text(cell).split("\n") if ln.strip()
    )
    return text or None


def norm_joined(cell):
    """改行を除去して1行に連結（事業名称・部課名向け）"""
    if not cell:
        return None
    return re.sub(r"\s+", "", normalize_text(cell)) or None


def parse_costs(cell):
    """'1,252,300\\n（1,460,000）' → (1252300, 1460000)"""
    if not cell:
        return None, None
    s = normalize_text(cell)
    m_total = re.search(r"[（(]\s*([\d,]+)\s*[)）]", s)
    total = parse_amount(m_total.group(1)) if m_total else None
    s_wo = re.sub(r"[（(][\d,\s]*[)）]", "", s)
    m_sofar = re.search(r"[\d,]{4,}", s_wo)
    so_far = parse_amount(m_sofar.group(0)) if m_sofar else None
    return so_far, total


def parse_progress(cell):
    """目的・概要セルから進捗率（'事業進捗率 86％' 等）を抜き出す"""
    if not cell:
        return None
    m = re.search(r"進捗率[^\d]{0,15}([\d.]+)\s*[%％]", normalize_text(cell))
    return float(m.group(1)) if m else None


def extract(pdf_path):
    items = []
    warns = []
    with pdfplumber.open(pdf_path) as pdf:
        for pageno, page in enumerate(pdf.pages, 1):
            for table in page.find_tables():
                for row in table.extract():
                    if not row or len(row) < 8:
                        continue
                    first = norm_joined(row[0]) or ""
                    if first in ("担当部課名", ""):
                        # ヘッダ行 or 前行の続き（部課名空欄の続き行は結合済み前提）
                        continue
                    name = norm_joined(row[1])
                    if not name:
                        continue
                    so_far, total = parse_costs(row[5])
                    item = {
                        "担当部課": first,
                        "事業名称": name,
                        "事業期間": norm_joined(row[2]),
                        "市町村地区": norm_multiline(row[3]),
                        "目的概要": norm_multiline(row[4]),
                        "進捗率": parse_progress(row[4]),
                        "事業費": {
                            "R7まで_千円": so_far,
                            "総事業費_千円": total,
                        },
                        "再評価結果": (norm_joined(row[6]) or "").rstrip(".。・･")
                        or None,
                        "理由": norm_multiline(row[7]),
                        "page": pageno,
                    }
                    if so_far is None and total is None:
                        warns.append(f"{name}: 事業費をパースできません: {row[5]!r}")
                    if not item["再評価結果"]:
                        warns.append(f"{name}: 再評価結果が空です")
                    items.append(item)
    return items, warns


def main():
    if len(sys.argv) < 2:
        print(__doc__, file=sys.stderr)
        sys.exit(1)
    items, warns = extract(sys.argv[1])
    for w in warns:
        print(f"WARN: {w}", file=sys.stderr)
    print(f"抽出件数: {len(items)}", file=sys.stderr)
    print(json.dumps(items, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
