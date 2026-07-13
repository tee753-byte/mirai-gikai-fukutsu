"""年度間マッチング: R7事業 ↔ 過年度（R6）事業の対応表を作る

使い方:
  python3 match_years.py <r7-items.json> <r6-items.json> [overrides.json] > matching.json

マッチング戦略（上から順に適用）:
  1. override  — overrides.json の手動指定（r7整理番号 → r6整理番号 | null）
  2. exact     — 親部局＋正規化事業名の完全一致
  3. name      — 正規化事業名のみの完全一致（部局再編をまたぐ事業）
  4. similar   — 同一親部局内で類似度最大（SequenceMatcher ratio >= 0.82、
                 かつ2位との差 >= 0.04 の一意な最良のみ）
  5. none      — 対応なし（R7新規事業等。予算推移が3点に縮退するだけで表示は破綻しない）

検証: マッチした組の「R7当初予算」（R6評価書の翌年度当初 vs R7評価書の当年度当初）の
一致率を報告する。不一致は組み替え・補正の可能性もあるためWARN扱い。
"""

import difflib
import json
import sys

from common import normalize_name, parent_bureau


def name_key(item):
    return normalize_name(item.get("事業名") or "")


def budget_of(item, col):
    return (((item.get("事業費") or {}).get("年度別")) or {}).get(col, {}).get("歳出")


def build_matching(r7_items, r6_items, overrides):
    r6_by_no = {it["整理番号"]: it for it in r6_items}

    # インデックス構築
    exact_index = {}
    name_index = {}
    for it in r6_items:
        key = (parent_bureau(it.get("部局")), name_key(it))
        exact_index.setdefault(key, []).append(it)
        name_index.setdefault(name_key(it), []).append(it)

    used_r6 = {}
    results = []
    warns = []

    def take(r7, r6, method, score=None):
        no6 = r6["整理番号"] if r6 else None
        if r6 is not None:
            if no6 in used_r6:
                warns.append(
                    f"R6 No.{no6} {r6['事業名']!r} が複数のR7事業に対応"
                    f"（No.{used_r6[no6]} と No.{r7['整理番号']}）"
                )
            used_r6[no6] = r7["整理番号"]
        results.append(
            {
                "r7整理番号": r7["整理番号"],
                "r7事業名": r7["事業名"],
                "r6整理番号": no6,
                "r6事業名": r6["事業名"] if r6 else None,
                "method": method,
                **({"score": round(score, 3)} if score is not None else {}),
            }
        )

    for r7 in r7_items:
        no7 = str(r7["整理番号"])
        # 1. override
        if no7 in overrides:
            target = overrides[no7]
            r6 = r6_by_no.get(target) if target is not None else None
            if target is not None and r6 is None:
                warns.append(f"override先 R6 No.{target} が存在しません（R7 No.{no7}）")
            take(r7, r6, "override")
            continue
        # 2. exact（親部局＋事業名）
        key = (parent_bureau(r7.get("部局")), name_key(r7))
        cands = exact_index.get(key, [])
        if len(cands) == 1:
            take(r7, cands[0], "exact")
            continue
        if len(cands) > 1:
            warns.append(f"R7 No.{no7} {r7['事業名']!r}: exact候補が複数（先頭を採用）")
            take(r7, cands[0], "exact")
            continue
        # 3. 事業名のみ完全一致（部局再編またぎ）
        cands = name_index.get(name_key(r7), [])
        if len(cands) == 1:
            take(r7, cands[0], "name")
            continue
        # 4. 同一親部局内の類似度
        pb = parent_bureau(r7.get("部局"))
        n7 = name_key(r7)
        scored = []
        for it in r6_items:
            if parent_bureau(it.get("部局")) != pb:
                continue
            ratio = difflib.SequenceMatcher(None, n7, name_key(it)).ratio()
            scored.append((ratio, it))
        scored.sort(key=lambda t: -t[0])
        if scored and scored[0][0] >= 0.82 and (
            len(scored) < 2 or scored[0][0] - scored[1][0] >= 0.04
        ):
            take(r7, scored[0][1], "similar", scored[0][0])
            continue
        # 5. none
        take(r7, None, "none")

    return results, warns


def validate_budget_overlap(results, r7_items, r6_items):
    """R6評価書のR7当初 と R7評価書のR7当初 の一致率を検証"""
    r7_by_no = {it["整理番号"]: it for it in r7_items}
    r6_by_no = {it["整理番号"]: it for it in r6_items}
    checked = agree = 0
    warns = []
    for m in results:
        if m["r6整理番号"] is None:
            continue
        b7 = budget_of(r7_by_no[m["r7整理番号"]], "R7当初")
        b6 = budget_of(r6_by_no[m["r6整理番号"]], "R7当初")
        if b7 is None or b6 is None:
            continue
        checked += 1
        if b7 == b6:
            agree += 1
        else:
            warns.append(
                f"R7当初不一致 [{m['method']}] R7 No.{m['r7整理番号']} "
                f"{m['r7事業名'][:24]!r}: R7評価書={b7:,} R6評価書={b6:,}"
            )
    return checked, agree, warns


def main():
    if len(sys.argv) < 3:
        print(__doc__, file=sys.stderr)
        sys.exit(1)
    with open(sys.argv[1]) as f:
        r7_items = json.load(f)
    with open(sys.argv[2]) as f:
        r6_items = json.load(f)
    overrides = {}
    if len(sys.argv) > 3:
        with open(sys.argv[3]) as f:
            overrides = json.load(f)

    results, warns = build_matching(r7_items, r6_items, overrides)
    checked, agree, budget_warns = validate_budget_overlap(
        results, r7_items, r6_items
    )

    import collections

    stats = collections.Counter(m["method"] for m in results)
    for w in warns + budget_warns:
        print(f"WARN: {w}", file=sys.stderr)
    print(
        f"マッチ内訳: {dict(stats)} / R6側未使用: "
        f"{len(r6_items) - len({m['r6整理番号'] for m in results if m['r6整理番号']})}件",
        file=sys.stderr,
    )
    print(
        f"R7当初予算の重複記載一致: {agree}/{checked}"
        f"（{100 * agree / checked:.1f}%）" if checked else "予算検証対象なし",
        file=sys.stderr,
    )
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
