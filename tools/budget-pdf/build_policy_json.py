"""
全ポリシーの予算施策体系JSONを一括生成するスクリプト。
1ポリシー1JSONで全取り組み事項を出力。measure_title はベストエフォートで付与。

Usage:
  python3 tools/budget-pdf/build_policy_json.py
  python3 tools/budget-pdf/build_policy_json.py policy1  # 特定ポリシーのみ
"""
import json
import re
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from generate_json import generate  # type: ignore

# ======== 定数 ========
OUTDIR = Path("docs/data")

# Policy 2 の measure 境界（abs_y の開始値、測定値ベース）
# abs_y = (pdf_page - 1) * 850 + local_y
P2_MEASURE_RANGES = [
    (    0,   1862, "中小企業の振興"),
    ( 1863,   6887, "農林水産業の振興"),
    ( 6888,   9210, "地域と調和した観光産業の振興"),
    ( 9211,  10732, "雇用対策の充実、魅力ある職場づくり"),
    (10733,  13739, "健康づくり、安心で質の高い医療の提供"),
    (13740,  14823, "スポーツ立県福岡の実現"),
    (14824,  16734, "文化芸術の振興"),
    (16735,  17900, "ジェンダー平等の社会づくり"),
    (17901,  21758, "高齢者、障がいのある人への支援"),
    (21759,  22604, "社会的・経済的に厳しい状況にある方への支援"),
    (22605,  24355, "外国人材に選ばれる地域づくり・人権が尊重される心豊かな社会づくり"),
    (24356,  26676, "安全で安心して暮らせる地域づくり"),
    (26677,  27900, "地域の活力向上"),
    (27901,  29291, "共助社会づくり、生涯学習の推進"),
    (29292,  34677, "快適な環境の維持、保全"),
    (34678,  36331, "教育の充実"),
    (36332,  38299, "出会い・結婚・出産・子育て支援"),
    (38300, 999999, "きめ細かな対応が必要な子どもの支援"),
]


def assign_measure(abs_y, ranges):
    for y0, y1, title in ranges:
        if y0 <= abs_y <= y1:
            return title
    return "（未分類）"


def clean_items(items, measure_ranges=None):
    """事項リストを後処理してクリーニング"""
    import re as _re
    cleaned = []
    for item in items:
        # 課名から科目番号を除去
        if item.get("division"):
            item["division"] = _re.sub(r'[\d０-９\s]+$', '', item["division"].strip()).strip()
            if not item["division"]:
                item["division"] = None
        # 名前の (債務負担行為) プレフィックスを除去
        item["name"] = _re.sub(r'^\(債務負担行為\)\s*|^（債務負担行為）\s*', '', item["name"])
        # measure_title を付与
        if measure_ranges is not None:
            item["measure_title"] = assign_measure(item.get("_abs_y", 0), measure_ranges)
        cleaned.append(item)
    return cleaned


# ======== ポリシー定義 ========
POLICIES = {
    "policy1": {
        "number": 1,
        "title": "世界を視野に、未来を見据えて成長し、発展する",
        "pdf_key": "p1",
        "pages": (1, 9),
        "measure_ranges": None,  # Policy 1は別途measure JSONで管理済み
    },
    "policy2": {
        "number": 2,
        "title": "誰もが住み慣れたところで働き、長く元気に暮らし、子どもを安心して産み育てることができる",
        "pdf_key": "p2",
        "pages": (1, 46),
        "measure_ranges": P2_MEASURE_RANGES,
    },
    "policy3": {
        "number": 3,
        "title": "感染症や災害に負けない強靭な社会をつくる",
        "pdf_key": "p3",
        "pages": (1, 99),
        "measure_ranges": None,
    },
    "policy4": {
        "number": 4,
        "title": "将来の発展を支える基盤をつくる",
        "pdf_key": "p4",
        "pages": (1, 99),
        "measure_ranges": None,
    },
    "policy-plan": {
        "number": None,
        "title": "計画推進の基盤づくり",
        "pdf_key": "pp",
        "pages": (1, 99),
        "measure_ranges": None,
    },
}

# PDFキャッシュパスのマッピング（WebFetchでキャッシュ済みのパス）
# 実行前に環境変数 BUDGET_PDF_P1 〜 BUDGET_PDF_PP で指定するか、引数で渡す
PDF_ENV_KEYS = {
    "p1": "BUDGET_PDF_P1",
    "p2": "BUDGET_PDF_P2",
    "p3": "BUDGET_PDF_P3",
    "p4": "BUDGET_PDF_P4",
    "pp": "BUDGET_PDF_PP",
}


def find_pdf(pdf_key):
    """PDFパスを環境変数またはキャッシュから取得"""
    env_key = PDF_ENV_KEYS[pdf_key]
    if env_key in os.environ:
        return os.environ[env_key]
    # フォールバック: ハードコードされたキャッシュパスを探す
    cache_dir = Path.home() / ".claude/projects"
    pdfs = list(cache_dir.glob("**/tool-results/webfetch-*.pdf"))
    if pdfs:
        # 最新のものを返す（複数ある場合）
        pdfs.sort(key=lambda p: p.stat().st_mtime, reverse=True)
        return str(pdfs[0])
    return None


def build_policy(policy_key, pdf_path):
    """1ポリシー分のJSONを生成して保存"""
    cfg = POLICIES[policy_key]
    pg_from, pg_to = cfg["pages"]
    measure_ranges = cfg["measure_ranges"]

    print(f"  Generating items from pages {pg_from}-{pg_to}...")
    items = generate(pdf_path, pg_from, pg_to)
    print(f"  Raw items: {len(items)}")

    # abs_y をアイテムに保存して measure 分類に使う
    # （generate() が abs_y を返さないため、sort_order を abs_y の代替として使えないが
    #   measure_ranges は sort_order ではなく abs_y ベース → ここでは近似として sort_order を使わない）
    # measure_ranges がある場合は generate を全ページ対象で再実行して abs_y 付きで取得
    if measure_ranges:
        items_with_y = _generate_with_abs_y(pdf_path, pg_from, pg_to)
        for item, (abs_y, _) in zip(items, items_with_y):
            item["measure_title"] = assign_measure(abs_y, measure_ranges)
        items = clean_items(items, measure_ranges=None)  # measure_title は付与済み
    else:
        items = clean_items(items)

    result = {
        "fiscal_year": 2026,
        "policy": {
            "number": cfg["number"],
            "title": cfg["title"],
        },
        "items": items,
    }

    out_path = OUTDIR / f"{policy_key}-all.json"
    OUTDIR.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"  Saved: {out_path} ({len(items)} items)")
    return len(items)


def _generate_with_abs_y(pdf_path, page_from, page_to):
    """generate() と同じロジックで (abs_y, item_name) のリストを返す（境界特定用）"""
    from generate_json import extract_lines, is_item_text, strip_prev, PAT_PREV_MIXED, PAT_CURR, parse_amount
    import re as _re

    X_ITEM = (155, 260)
    X_NEW = (140, 156)
    X_BUDGET = (260, 300)

    lines = extract_lines(pdf_path, page_from, page_to)

    result = []
    buf_parts = []
    buf_start_y = None
    buf_is_new = False
    buf_prev = None

    def flush(curr_val, curr_y):
        if not buf_parts:
            return
        name = ''.join(buf_parts)
        name = _re.sub(r'[\d,]{7,}$', '', name).strip()
        if len(name) >= 3:
            result.append((buf_start_y or curr_y, name))

    for y, x, text in lines:
        if x >= 300:
            continue
        if X_NEW[0] <= x < X_NEW[1] and text == '[新]':
            buf_is_new = True
            continue
        if X_ITEM[0] <= x < X_ITEM[1]:
            clean = strip_prev(text)
            if is_item_text(text) and clean:
                if buf_start_y is None:
                    buf_start_y = y
                buf_parts.append(clean)
            continue
        if X_BUDGET[0] <= x < X_BUDGET[1]:
            m_curr = PAT_CURR.match(text)
            if m_curr:
                try:
                    val = parse_amount(m_curr.group(1))
                    if val > 0:
                        flush(val, y)
                        buf_parts = []
                        buf_start_y = None
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

    return result


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else None
    policies_to_build = [target] if target else list(POLICIES.keys())

    for policy_key in policies_to_build:
        if policy_key not in POLICIES:
            print(f"Unknown policy: {policy_key}")
            continue

        cfg = POLICIES[policy_key]
        env_key = PDF_ENV_KEYS[cfg["pdf_key"]]
        pdf_path = os.environ.get(env_key)

        if not pdf_path:
            print(f"[SKIP] {policy_key}: set {env_key} to PDF path")
            continue
        if not Path(pdf_path).exists():
            print(f"[SKIP] {policy_key}: PDF not found at {pdf_path}")
            continue

        print(f"\n=== {policy_key}: {cfg['title'][:40]}... ===")
        count = build_policy(policy_key, pdf_path)
        print(f"  Done: {count} items total")
