---
name: committee-minutes-ai
description: 委員会議事録の「わかりやすい表現」「会議・議題の要約」をAI生成してDBに反映する。委員会アーカイブ（/committees）のコンテンツ作成を依頼されたら使用。
---

# 委員会議事録のわかりやすい表現・要約生成スキル

委員会議事録アーカイブ（`/committees` ページ群）の市民向けコンテンツを生成し、DBに反映する手順。設計の背景は `docs/20260718_1330_委員会議事録アーカイブ設計.md` を参照。

## 全体像

```
docs/data/committee-minutes/<年>/<開催日>_<スラッグ>_<DocumentID>.json  ← スクレイパー出力（原文）
        ↓ ①このスキルでAI生成
docs/data/committee-minutes/<年>/ai/<DocumentID>.json                 ← パッチファイル
        ↓ ②ユーザー確認（必須！）
        ↓ ③適用スクリプト
committee_meetings.summary / committee_meeting_topics.summary / speeches[].simpleText
```

- 生成済み・未生成の確認: `ls docs/data/committee-minutes/2026/ai/` と元データの差分を見る
- 会議の規模は元JSONの `speechCount` で分かる。**300発言超の予算特別委員会は1会議ずつ**、常任委は数会議まとめてでよい

## ① パッチファイルの生成

元JSON（`speeches` 配列）を読み、以下の形式で `ai/<DocumentID>.json` を作る：

```json
{
  "documentId": 6618,
  "meetingSummary": "会議全体の要約（2〜3文）",
  "topicSummaries": [{ "topicOrder": 1, "summary": "議題の要約（2〜4文）" }],
  "speechSimpleTexts": [{ "voiceNo": 1, "simpleText": "わかりやすい表現の本文" }]
}
```

- `topicSummaries` は DB の `committee_meeting_topics`（`topic_order`）に対応。議題一覧は元JSONからは分からないため、`curl` でローカルDB REST（`committee_meeting_topics?select=topic_order,title&...`）を引くか、`docker exec supabase_db_mirai-gikai-fukuoka-pref psql` で確認する
- `speechSimpleTexts` は**指名だけの発言**（「山田空港事業課長。」のような発言。UIで▷表示になる）**を除く全発言**に付ける

### 文体ルール（最重要）

1. **政治に詳しくない中学生でも伝わる**表現。専門用語には短い説明を添える（例:「BRT案（バスを専用道路で走らせる案）」「平成筑豊鉄道（筑豊地域を走るローカル鉄道）」）
2. です・ます調で統一。原文の一人称・立場（委員長/委員/県の担当者）を保つ
3. **数値は必ず原文と照合**する。漢数字は算用数字に直す（二千六百十八万人→約2,618万人）
4. **〔「なし」と呼ぶ者がある〕などの場内の様子の行はそのまま残す**（改行して独立行に）。UIが中央のシステムメッセージとして表示する
5. 中国語簡体字・繁体字（议・务・该 等）を混入させない
6. 要約は「何が報告され、何が決まり、どんな質問が出たか」を優先。結論を先に

## ② ユーザー確認（スキップ禁止）

CLAUDE.md「AI生成コンテンツのDB更新ルール」に従い、**DB反映前に必ず生成内容を提示して承認を得る**。提示時は自己レビュー（日本語の自然さ・数値の整合・文字コード）の結果も添える。全文が長い場合は、会議全体要約＋議題要約＋simpleTextの代表例を示し、パッチファイルのパスを案内する。

## ③ DB反映

```bash
cd packages/seed
npx tsx --env-file=../../.env fukuoka/apply-committee-ai-content.ts
```

- `ai/` ディレクトリの**全ファイル**を毎回処理する（再実行は冪等・上書き）
- ローカルpref DBの接続は `.env`（port 54531）経由。本番反映はPRマージ後に `.env.production` で別途指示を受けてから

## ④ 検証

```bash
cd /path/to/worktree && npx dotenv -e .env -- pnpm --filter web dev  # port 3002
```

- `/committees/<slug>/<DocumentID>` … 全体要約（ヘッダー内）と議題要約が出るか
- `/committees/<slug>/<DocumentID>/transcript` … デフォルト（わかりやすい表現）で「準備中」の注記が消え、simpleTextが表示されるか。「詳しく（原文）」との切替も確認

## 関連ファイル

- スクレイパー: `packages/seed/fukuoka/scrape-committee-minutes.ts`（再取得・翌年分は `--year`）
- 初回シード: `packages/seed/fukuoka/seed-committee-meetings.ts`（議題の機械抽出込み）
- AI反映: `packages/seed/fukuoka/apply-committee-ai-content.ts`
- 表示ロジック: `web/src/features/committee-minutes/`（正規化・チャット表示・議題分割）

## 既知の注意点

- 発言者名が「◯堀\n大助委員」のように改行で分断された過去データは、表示側（`normalize-speeches.ts`）で修復される。パッチ生成時は文脈から正しい発言者（この例では堀大助委員＝委員）として扱うこと
- 予算特別委員会の部局別審査日は議題が「◯款…の審査」1件のみ。質疑が多いので、simpleTextは1問1答の対応関係が崩れないよう順に処理する
- 議題ゼロの会議（正副委員長互選など）は `topicSummaries: []` とし、`meetingSummary` に手続き内容を1文で書く
