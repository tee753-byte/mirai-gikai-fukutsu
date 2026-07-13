"""行政評価概要一覧PDF → gaiyou.json（事務事業評価266件の要約表）

使い方:
  python3 extract_gaiyou.py <概要一覧PDF> > gaiyou.json

概要一覧の「１ 事務事業評価一覧」表（No/事業名・担当部局/R7事業費/
事業のねらい・目的/事業の内容/主な指標の状況/見直し区分）を抽出する。
「２ 政策事前評価一覧」以降は対象外。
"""

import json
import re
import sys

import pdfplumber

from common import (
    normalize_text,
    parse_amount,
    parse_review_category,
    split_bureau_lines,
)

HEADER_FIRST_CELLS = {"No.", "No", "№"}


def cell_lines(cell):
    if not cell:
        return []
    return [ln for ln in cell.split("\n") if ln.strip()]


def extract(pdf_path):
    rows_out = []
    warns = []
    with pdfplumber.open(pdf_path) as pdf:
        for pageno, page in enumerate(pdf.pages, 1):
            text = page.extract_text() or ""
            head = text.replace("　", "").replace(" ", "")[:40]
            if "政策事前評価一覧" in head:
                break
            if "事務事業評価一覧" not in head and not rows_out:
                continue  # 表紙・目次
            tables = page.find_tables()
            if not tables:
                continue
            for table in tables:
                for row in table.extract():
                    if not row or len(row) < 7:
                        continue
                    no_cell = normalize_text(row[0]) if row[0] else None
                    if no_cell in HEADER_FIRST_CELLS:
                        continue
                    if no_cell and re.fullmatch(r"\d+", no_cell):
                        name, bureau, kashitsu = split_bureau_lines(
                            cell_lines(row[1])
                        )
                        raw_category = normalize_text(
                            (row[6] or "").replace("\n", "")
                        )
                        major, minor = parse_review_category(raw_category)
                        item = {
                            "no": int(no_cell),
                            "事業名": normalize_text(name),
                            "部局": bureau,
                            "課室": kashitsu,
                            "r7事業費_千円": parse_amount(row[2]),
                            "ねらい目的": normalize_text(row[3]),
                            "事業の内容": normalize_text(row[4]),
                            "主な指標の状況": normalize_text(row[5]),
                            "見直し区分": raw_category,
                            "見直し大区分": major,
                            "見直し小区分": minor,
                            "page": pageno,
                        }
                        if bureau is None:
                            warns.append(f"No.{no_cell}: 部局を判定できません: {row[1]!r}")
                        if item["r7事業費_千円"] is None:
                            warns.append(f"No.{no_cell}: 事業費をパースできません: {row[2]!r}")
                        if major is None:
                            warns.append(f"No.{no_cell}: 見直し区分をパースできません: {row[6]!r}")
                        rows_out.append(item)
                    elif rows_out and not no_cell:
                        # No空欄 = 前行の続き（ページまたぎ等）: テキスト列を連結
                        prev = rows_out[-1]
                        for idx, key in [
                            (3, "ねらい目的"),
                            (4, "事業の内容"),
                            (5, "主な指標の状況"),
                        ]:
                            extra = normalize_text(row[idx])
                            if extra:
                                prev[key] = ((prev[key] or "") + "\n" + extra).strip()
    return rows_out, warns


def main():
    if len(sys.argv) < 2:
        print(__doc__, file=sys.stderr)
        sys.exit(1)
    items, warns = extract(sys.argv[1])
    for w in warns:
        print(f"WARN: {w}", file=sys.stderr)
    nos = [it["no"] for it in items]
    expected = list(range(1, len(items) + 1))
    if nos != expected:
        missing = sorted(set(expected) - set(nos))
        print(f"WARN: No.が連番になっていません（欠落候補: {missing[:10]}）", file=sys.stderr)
    print(f"抽出件数: {len(items)}", file=sys.stderr)
    print(json.dumps(items, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
