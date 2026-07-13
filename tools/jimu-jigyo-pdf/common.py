"""事務事業評価PDF抽出の共通ヘルパー（AI不使用）"""

import re
import unicodedata

# 福岡県の部局（概要一覧・様式1号の「担当部局」「部」欄に現れる名称）
# 前方一致で部局行を判定する。長い名称を先に置くこと。
BUREAUS = [
    "総務部防災危機管理局",
    "企画・地域振興部空港政策局",
    "人づくり・県民生活部スポーツ局",
    "保健医療介護部がん感染症疾病対策局",
    "商工部観光局",
    "福祉労働部労働局",
    "総務部",
    "企画・地域振興部",
    "人づくり・県民生活部",
    "保健医療介護部",
    "福祉労働部",
    "環境部",
    "商工部",
    "農林水産部",
    "県土整備部",
    "建築都市部",
    "会計管理局",
    "教育庁",
    "警察本部",
    "人事委員会",
    "監査委員",
    "労働委員会",
    "議会事務局",
]

# 見直し区分の語彙（様式1号5「見直しの内容」の選択肢）
REVIEW_MAJOR = ["継続", "終了"]
REVIEW_MINOR = ["拡充", "改善", "一部改善", "縮小", "完了", "再構築", "廃止"]

# 親部局（フィルタ・年度間マッチングの集約単位。県の組織順）
PARENT_BUREAUS = [
    "総務部",
    "企画・地域振興部",
    "人づくり・県民生活部",
    "保健医療介護部",
    "福祉労働部",
    "環境部",
    "商工部",
    "農林水産部",
    "県土整備部",
    "建築都市部",
    "教育庁",
    "警察本部",
]


def parent_bureau(name):
    """'商工部観光局' → '商工部'。未知の部局はそのまま返す"""
    if not name:
        return None
    for p in PARENT_BUREAUS:
        if name.startswith(p):
            return p
    return name


def normalize_text(s):
    """全角英数字→半角、空白正規化。漢字かなはそのまま"""
    if s is None:
        return None
    s = unicodedata.normalize("NFKC", s)
    s = re.sub(r"[ \t　]+", " ", s)
    return s.strip()


def normalize_name(s):
    """事業名の照合用正規化（空白・改行を全除去）"""
    if s is None:
        return ""
    s = unicodedata.normalize("NFKC", s)
    return re.sub(r"\s+", "", s)


def parse_amount(s):
    """'9,750' → 9750。数値でなければ None"""
    if s is None:
        return None
    s = normalize_text(s).replace(",", "").replace(" ", "")
    if re.fullmatch(r"-?\d+", s):
        return int(s)
    return None


def split_bureau_lines(lines):
    """セル内の複数行を (事業名, 部局, 課室) に分割する。

    部局名（BUREAUS前方一致）が現れた行を境に、
    前=事業名（複数行連結）、当該行=部局、後続=課室 とする。
    """
    bureau_idx = None
    for i, line in enumerate(lines):
        stripped = re.sub(r"\s+", "", line)
        if any(stripped.startswith(b) for b in BUREAUS):
            bureau_idx = i
            break
    if bureau_idx is None:
        return "".join(lines).strip(), None, None
    name = "".join(lines[:bureau_idx]).strip()
    rest = re.sub(r"\s+", "", "".join(lines[bureau_idx:]))
    bureau = next(b for b in BUREAUS if rest.startswith(b))
    kashitsu = rest[len(bureau):] or None
    return name, bureau, kashitsu


def parse_review_category(raw):
    """'継続（縮小）' → ('継続', '縮小')。パース不能は (None, None)"""
    if raw is None:
        return None, None
    s = re.sub(r"\s+", "", unicodedata.normalize("NFKC", raw))
    s = s.replace("(", "（").replace(")", "）")
    m = re.fullmatch(r"(継続|終了)（(.+?)）", s)
    if not m:
        if s in REVIEW_MAJOR:
            return s, None
        return None, None
    major, minor = m.group(1), m.group(2)
    if minor not in REVIEW_MINOR:
        return major, None
    return major, minor
