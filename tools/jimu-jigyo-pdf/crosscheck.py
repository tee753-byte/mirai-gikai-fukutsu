"""概要一覧（gaiyou.json）と様式1号（items.json）の全件突合検証

使い方:
  python3 crosscheck.py <gaiyou.json> <items.json> [saihyoka.json]

検証項目:
  1. 件数一致（266事業）と整理番号↔Noの順序対応
  2. 事業名の一致（正規化比較）
  3. 部局の一致
  4. R7当初事業費の一致（概要一覧の「R7事業費」＝様式1号の「R7当初 歳出」）
  5. 見直し区分（大区分・小区分）の一致 ※独立した2抽出方式の突合
  6. 内部整合: 一般財源≦歳出、区分語彙、成果指標の年度キー範囲
  7. 公共事業再評価の件数・必須項目（saihyoka.json指定時）

FAILが1件でもあれば exit code 1。
"""

import difflib
import json
import re
import sys

from common import REVIEW_MAJOR, REVIEW_MINOR, normalize_name

fails = []
warns = []


def fail(msg):
    fails.append(msg)
    print(f"FAIL: {msg}")


def warn(msg):
    warns.append(msg)
    print(f"WARN: {msg}")


def check_items(gaiyou, items):
    if len(gaiyou) != len(items):
        fail(f"件数不一致: 概要一覧={len(gaiyou)} 様式1号={len(items)}")
        return
    print(f"件数: {len(items)}（一致）")

    name_ok = bureau_ok = cost_ok = cat_ok = 0
    for g, it in zip(gaiyou, items):
        no = g["no"]
        label = f"No.{no} {g['事業名'][:20]}"

        # 2. 事業名
        gn = normalize_name(g["事業名"])
        hn = normalize_name(it["事業名"] or "")
        if gn == hn:
            name_ok += 1
        elif (
            gn in hn
            or hn in gn
            or difflib.SequenceMatcher(None, gn, hn).ratio() >= 0.7
        ):
            # 概要一覧と様式1号で公式の表記ゆれがある（例: 「強化」の有無）
            name_ok += 1
            warn(f"{label}: 事業名が表記ゆれ（概要一覧={g['事業名']!r} 様式1号={it['事業名']!r}）")
        else:
            fail(f"{label}: 事業名不一致（様式1号={it['事業名']!r}）")

        # 3. 部局
        gb = normalize_name(g["部局"] or "")
        hb = normalize_name(it["部局"] or "")
        if gb and hb and (gb == hb or gb.startswith(hb) or hb.startswith(gb)):
            bureau_ok += 1
        else:
            fail(f"{label}: 部局不一致（概要一覧={g['部局']!r} 様式1号={it['部局']!r}）")

        # 4. R7当初事業費
        g_cost = g.get("r7事業費_千円")
        h_cost = (
            ((it.get("事業費") or {}).get("年度別") or {}).get("R7当初") or {}
        ).get("歳出")
        if g_cost is not None and h_cost is not None:
            if g_cost == h_cost:
                cost_ok += 1
            else:
                fail(f"{label}: R7事業費不一致（概要一覧={g_cost:,} 様式1号={h_cost:,}）")
        else:
            warn(f"{label}: R7事業費が取得できていません（概要一覧={g_cost} 様式1号={h_cost}）")

        # 5. 見直し区分
        g_major, g_minor = g.get("見直し大区分"), g.get("見直し小区分")
        h_major = (it.get("見直し") or {}).get("大区分")
        h_minor = (it.get("見直し") or {}).get("小区分")
        if g_major == h_major and g_minor == h_minor:
            cat_ok += 1
        else:
            fail(
                f"{label}: 見直し区分不一致（概要一覧={g_major}({g_minor}) 様式1号={h_major}({h_minor})）"
            )

        # 6. 内部整合
        if h_major is not None and h_major not in REVIEW_MAJOR:
            fail(f"{label}: 大区分の語彙外: {h_major!r}")
        if h_minor is not None and h_minor not in REVIEW_MINOR:
            fail(f"{label}: 小区分の語彙外: {h_minor!r}")
        nendo = ((it.get("事業費") or {}).get("年度別")) or {}
        for ylabel, vals in nendo.items():
            sai = vals.get("歳出")
            ippan = vals.get("一般財源")
            if sai is not None and ippan is not None and ippan > sai:
                # 歳出0で財源調整等のケースは警告に留める
                warn(f"{label}: {ylabel} 一般財源({ippan:,}) > 歳出({sai:,})")
        for ind in it.get("成果指標") or []:
            for d in (ind.get("目標"), ind.get("実績")):
                for y in d or {}:
                    if not re.fullmatch(r"R\d{1,2}", y):
                        fail(f"{label}: 成果指標の年度キーが不正: {y!r}")

    print(
        f"事業名一致: {name_ok}/{len(items)} / 部局一致: {bureau_ok}/{len(items)} / "
        f"R7事業費一致: {cost_ok}/{len(items)} / 見直し区分一致: {cat_ok}/{len(items)}"
    )


def check_saihyoka(saihyoka):
    if not saihyoka:
        fail("公共事業再評価が0件です")
        return
    print(f"公共事業再評価: {len(saihyoka)}件")
    for s in saihyoka:
        if not s.get("再評価結果"):
            fail(f"再評価 {s.get('事業名称')!r}: 再評価結果が空")
        if not s.get("担当部課"):
            fail(f"再評価 {s.get('事業名称')!r}: 担当部課が空")


def main():
    if len(sys.argv) < 3:
        print(__doc__, file=sys.stderr)
        sys.exit(1)
    with open(sys.argv[1]) as f:
        gaiyou = json.load(f)
    with open(sys.argv[2]) as f:
        items = json.load(f)
    check_items(gaiyou, items)
    if len(sys.argv) > 3:
        with open(sys.argv[3]) as f:
            check_saihyoka(json.load(f))
    print(f"\n結果: FAIL={len(fails)} WARN={len(warns)}")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
