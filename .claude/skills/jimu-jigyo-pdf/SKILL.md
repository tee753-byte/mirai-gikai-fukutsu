---
name: jimu-jigyo-pdf
description: 福岡県の行政評価PDF（事務事業評価書・概要一覧・公共事業再評価総括表）から事務事業評価JSONを生成・検証するスキル。「事務事業評価データを更新して」「R8年度の評価書をデータ化して」等で使用。
---

# 事務事業評価PDFデータ化スキル

福岡県が公表する行政評価PDF（AI不使用・pdfplumber座標ベース）から
`docs/data/jimu-jigyo/<year>/` のJSONを生成し、独立2ソース間の全件突合で検証する。

## データソース（令和7年度）

公表ページ: https://www.pref.fukuoka.lg.jp/contents/gyouseihyouka-01.html

| 資料 | URL | 用途 |
|---|---|---|
| 行政評価概要一覧 | /uploaded/life/810515_62838386_misc.pdf | 266事業の要約表（クロスチェックの独立ソース・事業概要/ねらいの表示用テキスト） |
| 事務事業評価書P77-181（総務部、企画・地域振興部、人づくり・県民生活部） | /uploaded/life/810515_62838387_misc.pdf | 様式1号本体 |
| 同P182-297（保健医療介護部、福祉労働部） | /uploaded/life/810515_62838388_misc.pdf | 〃 |
| 同P298-433（環境部、商工部） | /uploaded/life/810515_62838389_misc.pdf | 〃 |
| 同P434-527（農林水産部、県土整備部、建築都市部） | /uploaded/life/810515_62838390_misc.pdf | 〃 |
| 同P528-610（教育庁、警察本部） | /uploaded/life/810515_62838391_misc.pdf | 〃 |
| 公共事業再評価に関する総括表 | /uploaded/life/810515_62838394_misc.pdf | 様式3号（47事業） |

過年度: 令和6年度 https://www.pref.fukuoka.lg.jp/gyosei-shiryo/gyouseihyoukarepo-to-06.html（-03〜-05が令和3〜5年度）

## ワークフロー

```bash
# 1. PDFをスクラッチディレクトリにダウンロード（リポジトリにはコミットしない）
curl -s <URL> -o <名前>.pdf

# 2. 概要一覧を抽出（266件）
python3 tools/jimu-jigyo-pdf/extract_gaiyou.py gaiyou-ichiran.pdf > docs/data/jimu-jigyo/r7/gaiyou.json

# 3. 様式1号5分冊を抽出（266件、分冊の順序＝概要一覧のNo順で指定すること）
python3 tools/jimu-jigyo-pdf/extract_hyoka.py somu.pdf hoken.pdf kankyo.pdf norin.pdf kyoiku.pdf \
  > docs/data/jimu-jigyo/r7/items.json

# 4. 公共事業再評価総括表を抽出
python3 tools/jimu-jigyo-pdf/extract_saihyoka.py soukatsu.pdf > docs/data/jimu-jigyo/r7/saihyoka.json

# 5. 全件突合検証（FAILが0であることを必ず確認。exit code 1 = FAILあり）
python3 tools/jimu-jigyo-pdf/crosscheck.py \
  docs/data/jimu-jigyo/r7/gaiyou.json \
  docs/data/jimu-jigyo/r7/items.json \
  docs/data/jimu-jigyo/r7/saihyoka.json
```

各extractスクリプトはWARNをstderrに出す。WARNが出たら該当ページをpdfplumberで
目視確認し、様式変種ならパーサを直す（勘で握りつぶさない）。

## 検証の考え方

概要一覧と様式1号は**独立に作られた公式資料**なので、両者から別々に抽出して
事業名・部局・R7当初事業費・見直し区分の4項目を266件全件突合する。
パーサの構造ずれ（ページ境界の取り違え・列ずれ）はここで必ず検出される。

- 見直し区分は、様式1号側は「選択肢語を囲む印」の図形検出、概要一覧側はテキスト。
  完全に独立した2方式なので一致すれば信頼できる
- 事業名の「表記ゆれWARN」（両資料で公式表記が異なる）は許容。様式1号側を正とする

## 既知のパーサー限界・原典由来のWARN（R7時点）

| 事象 | 件数 | 対応 |
|---|---|---|
| 指標表が画像埋め込みで抽出不可（No.237 ふくおか学力アップ推進事業） | 1 | seed時に概要一覧の「主な指標の状況」で代替表示 |
| 指標が表でなく自由記述（No.26等）→ `進捗状況テキスト` に格納 | 17 | UI側はテキスト表示にフォールバック |
| 概要一覧と様式1号で事業名の公式表記が異なる（WARN） | 5 | 様式1号を正とする |
| 原典自体の記載で一般財源＞歳出（No.108のR8当初） | 1 | 原典に忠実に保持 |
| 補正予算列がある変種（No.198「R7.2月補正」） | 1 | 動的列検出で対応済み |

## 様式1号の描画方式バリエーション（extract_hyoka.py が対応済み）

- 見直し区分の選択印: ①細線4本の矩形枠 ②楕円カーブ ③1オブジェクトの小矩形 ④画像スタンプ
  — 枠復元は「縦線分ペア＋それを繋ぐ横線分」を要求（総当たりペアは隣接枠間の偽ボックスを作る）
- 罫線が画像化されたシートがあるため、成果指標表・事業費表は find_tables ではなく
  単語座標グリッド（年度列X×行ラベルY）で復元する
- ヘッダの「事 業 名」が「事 行 名」になっている等のフォント化け → 正規表現 `事.名` で吸収
- 部と課が同一セルに連結される変種 → `common.BUREAUS` の前方一致で分割
- ページ跨ぎでセクション見出しが折り返す/「R6度」等の原典誤植 → アンカーは前方一致

## 出力ファイル

- `items.json` — 様式1号全項目（事業名/部局/課室/開始年度/総合計画位置づけ/ねらい目的/
  成果指標(目標・実績のR2〜R12年度別)/進捗状況テキスト/設定根拠/実績評価と要因/効率化工夫/
  事業費(R6決算・R7当初・R8当初＋補正、歳出・一般財源・人件費)/見直し(大区分・小区分・理由・内容)/出典）
- `gaiyou.json` — 概要一覧（no/事業名/部局/課室/r7事業費_千円/ねらい目的/事業の内容/主な指標の状況/見直し区分）
- `saihyoka.json` — 公共事業再評価（担当部課/事業名称/事業期間/市町村地区/目的概要/進捗率/事業費/再評価結果/理由）

いずれも数値は千円単位のint、指標値は原文文字列を保持（「調査中」「9億」等があるため）。
