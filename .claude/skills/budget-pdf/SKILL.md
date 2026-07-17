---
name: budget-pdf
description: 福岡県予算編成概要PDFから取り組み事項JSON（施策体系カードデータ）を生成・検証するスキル
---

# Budget PDF → JSON 生成スキル

予算施策体系PDFから取り組み事項の JSON を自動生成し、AI不使用のクロスチェックで品質を担保する。

## 使い方

```
/budget-pdf                          # インタラクティブに進める
/budget-pdf <PDFパス> <page_from> <page_to> <y_start> <y_end> <出力ファイル名>
```

引数が揃っている場合はそのまま実行、不足していれば対話的に確認する。

## ツール

```
tools/budget-pdf/generate_json.py   # PDF → JSON 自動生成（AI不使用、pdfminer座標ベース）
tools/budget-pdf/crosscheck.py      # JSON vs PDF クロスチェック（AI不使用）
```

## PDF一覧（令和8年度）

| 政策 | PDF URL |
|------|---------|
| 1: 世界を視野に... | https://www.pref.fukuoka.lg.jp/uploaded/attachment/277214.pdf |
| 2: 誰もが住み慣れた... | https://www.pref.fukuoka.lg.jp/uploaded/attachment/278133.pdf |
| 3: 感染症・災害... | https://www.pref.fukuoka.lg.jp/uploaded/attachment/277217.pdf |
| 4: 将来の発展... | https://www.pref.fukuoka.lg.jp/uploaded/attachment/277218.pdf |
| 計画推進 | https://www.pref.fukuoka.lg.jp/uploaded/attachment/277220.pdf |

## ワークフロー

### Step 1: PDF 取得

WebFetch でダウンロードし、キャッシュパスを確認する。

```bash
# キャッシュ済みPDFのパスを特定
ls ~/.claude/projects/*/tool-results/webfetch-*.pdf | tail -5
```

### Step 2: ページ境界の特定

対象テーマがどのページ・Y座標範囲にあるかを確認する。

```bash
python3 - <<'EOF'
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextBox, LTTextLine
PDF = "<PDFパス>"
PAGE_FROM = 1  # 起点ページ（オフセット基準）
for i, page in enumerate(extract_pages(PDF), 1):
    h = page.height
    offset = (i - PAGE_FROM) * 850
    for el in page:
        if isinstance(el, LTTextBox):
            for line in el:
                if isinstance(line, LTTextLine):
                    t = line.get_text().strip()
                    if t and 155 <= line.x0 <= 260:
                        abs_y = round(h - line.y1 + offset, 0)
                        print(f"p{i} abs={abs_y:.0f}: {t}")
EOF
```

テーマの開始事項と終了事項の abs_y から `y_start` / `y_end` を決める。

### Step 3: JSON ドラフト自動生成

```bash
python3 tools/budget-pdf/generate_json.py \
  <PDF> <page_from> <page_to> <y_start> <y_end> \
  | python3 -c "
import json, sys, re
d = json.load(sys.stdin)
d['measure']['title'] = '<テーマ名>'
d['policy']['number'] = <政策番号>
for it in d['items']:
    # 課名に混入した科目番号を除去
    it['division'] = re.sub(r'[０-９0-9\s]+$', '', it['division'].strip()).strip()
    # 事項名の債務負担行為プレフィックスを除去
    it['name'] = re.sub(r'^\(債務負担行為\)\s*|^（債務負担行為）\s*', '', it['name'])
print(json.dumps(d, ensure_ascii=False, indent=2))
" > docs/data/<filename>.json
```

### Step 4: 手動修正チェックリスト

生成後に以下を確認・修正する:

- [ ] `measure.title` を正しいテーマ名に更新
- [ ] `division` に科目番号が残っていないか（例: `交通政策課２４４` → `交通政策課`）
- [ ] `name` に `(債務負担行為)` が残っていないか
- [ ] `（債務負担行為）` だけの名前の事項 → `元の事項名（債務負担行為）` にリネームして残す
- [ ] `budget_prev=null` の事項 → `y_start` を 10〜15 下げて再生成
- [ ] 名前が途中で切れている事項 → `y_end` を広げて再生成
- [ ] `is_new` が正しいか（PDF上の[新]マークと照合）

### Step 5: クロスチェック

```bash
python3 tools/budget-pdf/crosscheck.py \
  <PDF> docs/data/<filename>.json <page_from> <page_to>
```

結果の解釈:
- `[OK]` : PDF と一致 ✓
- `[WARN] 事項名が不一致` : パーサー限界か実際の誤りか確認
- `[WARN] budget_*` : 予算額の誤り → JSON を修正
- `[WARN] is_new` : [新]フラグの誤り → JSON を修正
- `[INFO]` : PDF にあるがJSON未照合 → 次テーマのデータなら正常

### Step 6: 既知のパーサー限界（許容 WARN）

| パターン | 対処 |
|---------|------|
| `(債務負担行為)` が item 名に混入 | JSON側の正しい名前で許容 |
| 債務負担行為エントリの名前不一致 | 手動リネームしているため許容 |
| 一部 budget_current が明細金額を誤検出 | JSON側の正しい値で許容 |

## ファイル命名規則

```
docs/data/policy<N>-measure<M>-<slug>.json
```

例:
- `policy1-measure5-digital-shakai.json`
- `policy2-measure8-chusho-kigyo.json`
