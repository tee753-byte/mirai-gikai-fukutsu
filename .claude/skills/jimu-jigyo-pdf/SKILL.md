---
name: jimu-jigyo-pdf
description: 福岡県の行政評価PDF（事務事業評価書・概要一覧・公共事業再評価総括表）から事務事業評価JSONを生成・検証するスキル。「事務事業評価データを更新して」「R8年度の評価書をデータ化して」等で使用。
---

# 事務事業評価PDFデータ化スキル

福岡県が公表する行政評価PDF（AI不使用・pdfplumber座標ベース）から
`docs/data/jimu-jigyo/<year>/` のJSONを生成し、独立2ソース間の全件突合で検証する。

## 年度の指定（最初に決めること）

対象年度スラッグ `<year>`（例: `r7`, `r8`）を決め、**出力先は必ず
`docs/data/jimu-jigyo/<year>/`** にする（既存年度のディレクトリを上書きしない）。

- 最新年度のPDF URLは公表ページ
  https://www.pref.fukuoka.lg.jp/contents/gyouseihyouka-01.html から取得する
  （`curl` でHTMLを取得し `<a href="/uploaded/life/..._misc.pdf">` を抽出。
  分冊構成・件数は年度で変わるため、リンクテキストの部局名とページ範囲を確認する）
- 過年度は https://www.pref.fukuoka.lg.jp/gyosei-shiryo/gyouseihyoukarepo-to-0N.html
  （N=3〜が令和3年度〜）
- 下表のURLは**令和7年度の実績**。他年度ではURLもファイル数も異なる

## データソース（令和7年度の実績）

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
# 0. 対象年度を決める（例）
YEAR=r7
mkdir -p docs/data/jimu-jigyo/$YEAR

# 1. PDFをスクラッチディレクトリにダウンロード（リポジトリにはコミットしない）
#    --fail がないとエラーページを.pdfとして保存してしまう
curl --fail --location --silent --show-error <URL> -o <名前>.pdf

# 2. 概要一覧を抽出
python3 tools/jimu-jigyo-pdf/extract_gaiyou.py gaiyou-ichiran.pdf \
  > docs/data/jimu-jigyo/$YEAR/gaiyou.json

# 3. 様式1号の分冊を抽出（分冊の順序＝概要一覧のNo順で指定すること）
python3 tools/jimu-jigyo-pdf/extract_hyoka.py somu.pdf hoken.pdf kankyo.pdf norin.pdf kyoiku.pdf \
  > docs/data/jimu-jigyo/$YEAR/items.json

# 4. 公共事業再評価総括表を抽出
python3 tools/jimu-jigyo-pdf/extract_saihyoka.py soukatsu.pdf \
  > docs/data/jimu-jigyo/$YEAR/saihyoka.json

# 5. 全件突合検証（FAILが0であることを必ず確認。exit code 1 = FAILあり）
python3 tools/jimu-jigyo-pdf/crosscheck.py \
  docs/data/jimu-jigyo/$YEAR/gaiyou.json \
  docs/data/jimu-jigyo/$YEAR/items.json \
  docs/data/jimu-jigyo/$YEAR/saihyoka.json
```

各extractスクリプトはWARNをstderrに出す。WARNが出たら該当ページをpdfplumberで
目視確認し、様式変種ならパーサを直す（勘で握りつぶさない）。

## 過年度データと年度間マッチング

```bash
# 過年度（例: R6）の様式1号を抽出 → docs/data/jimu-jigyo/r6/items.json
python3 tools/jimu-jigyo-pdf/extract_hyoka.py <R6分冊...> > docs/data/jimu-jigyo/r6/items.json

# 最新年度↔過年度の事業対応表を生成（overridesは手動マッピング、無ければ {} ）
python3 tools/jimu-jigyo-pdf/match_years.py \
  docs/data/jimu-jigyo/r7/items.json \
  docs/data/jimu-jigyo/r6/items.json \
  docs/data/jimu-jigyo/matching-overrides.json \
  > docs/data/jimu-jigyo/matching.json
```

**重要な前提: 県の事務事業評価は毎年「一部の事業」だけが対象**（R7=266事業、
R6=201事業で、両年度とも評価されたのは53事業のみ）。過年度突合で予算推移を
延長できるのはこの重なり分だけで、それ以外はR7評価書由来の3点
（R6決算/R7当初/R8当初）のままとなる。これはデータ側の制約であり正常。

### 過年度を広げても増えない（2026-07-15 実測・再検討不要）

「もっと過去の年度を取れば推移が延びるのでは」と考えたくなるが、**実測の結果、
効果はほぼゼロ**。事業名の重複を年度ペアで数えた値:

| 年度ペア | 距離 | 重複事業数 |
|---|---|---|
| R7 ∩ R6 | 隣接 | 49 |
| R6 ∩ R5 | 隣接 | 52 |
| **R7 ∩ R5** | **2年離れ** | **1** |

R6∩R5 が52件あることから **R5の抽出自体は健全**（隣接年度とは正常に重なる）と確認済み。
そのうえで R7∩R5 が1件しかない、つまり**県の評価サイクル上、2年離れると重複が消える**。

サイトはR7の266事業を表示するため、その予算履歴を伸ばせるのは「R7を含む冊」＝実質R6のみ。
**R5・R4・R3を取り込んでも表示対象はほぼ増えないので、やらないこと**（現状の53事業が
R7ベース表示の実質上限）。R4/R3はさらに年が離れるため、より少なくなる。

### R5以前のCID復号（必要になった場合のみ）

R5以前は ToUnicode 欠落のサブセットフォントのため、pdfplumber は文字を
`(cid:15910)` の形でしか返さない。ただし**復号は可能**（「復号不能」は誤り）:

- サブセット化時にグリフ番号が元の MS ゴシック／明朝のまま維持されているため、
  元フォントの cmap から GID→Unicode を逆引きすれば復元できる（OCR不要・非AI）。
  実測の復号率は **98.9%（1,313文字中1,298文字／R5総務部分冊の1ページ）**。
  例: `(cid:15910)`→`（`、`(cid:7517)`→`様`
- 元フォントは Windows 同梱。WSL2 なら `/mnt/c/Windows/Fonts/msgothic.ttc`（0番=MS Gothic、
  2番=MS PGothic）、`msmincho.ttc`（0番=MS Mincho）。`fontTools` の `getBestCmap()` と
  `getGlyphID()` で逆引き表を作り、`page.chars[i]["text"]` を書き換えれば
  extract_text/extract_words/find_tables はそのまま動く
- `getBestCmap()` は「Unicode→グリフ名」なので、逆引き表は**反転して作る**。
  複数のUnicodeが同一グリフを指す場合があるため、**最初に現れたもの
  （＝コードポイントの小さい方）を採用**する（`setdefault` 相当）
- **例外**: R5の農林水産部・県土整備部・建築都市部の分冊（716126_62029375）は Type3フォントで、
  **この分冊には ToUnicode CMap が無いためこの方法では復号できない**（OCR以外に手段がない）。
  Type3全般が復号不能なわけではなく、ToUnicode CMap を持つType3なら抽出できる

上記の通り取り込む価値がないため実装はしていない。将来どうしても必要になった場合の参考。

- マッチ方式は override → exact（親部局＋正規化名）→ name → similar（同一親部局内
  ratio≥0.82かつ一意）→ none。R7時点の実績: exact 49 / similar 4 / none 213
- 検証として「R7当初」の重複記載（R6評価書の翌年度当初 vs R7評価書の当年度当初）を
  突合する。不一致WARNは組み替え・補正によるものがあり、seedでは**最新年度評価書の
  値を正**とし、過年度評価書からは重複しない年度（R5決算・R6当初）だけを取り込む

### 過年度PDFの既知の制約

| 年度 | 事象 | 対応 |
|---|---|---|
| R6 | 概要一覧PDFが rotation=270 の回転ページで、表の抽出が困難 | 概要一覧はスキップ。検証は年度間の当初予算突合で代替 |
| R6 | 約10シートが文字レイヤーのないスキャン画像（印字ページ85-91等） | OCRなしでは抽出不可。該当事業は突合対象外（201事業中191件を抽出） |
| R5以前 | ToUnicode 欠落のサブセットフォントで文字が `(cid:N)` でしか取れない | 復号は可能（上記「R5以前のCID復号」）。ただし取り込む価値がないため未実装（上記「過年度を広げても増えない」）。予算推移は R5決算・R6当初・R6決算・R7当初・R8当初 の**5点**（R5〜R8の4年度スパン）で確定 |

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
