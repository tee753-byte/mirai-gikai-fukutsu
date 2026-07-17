---
name: deploy
description: 本番反映手順（migration→Vercel）。「本番に反映して」「デプロイして」の際に必ず参照。グローバルのdeployスキル（develop→main前提）はこのリポジトリには適用しない。
---

# 本番反映

## このリポジトリの値（地域固有・ここだけ差し替え可能）

このスキルの仕組みの説明は全地域リポジトリ共通。地域固有の値は**この節にのみ**書く。
別地域リポジトリへコピーする場合はこの節と `deploy_web.yml` の整合を必ず確認すること。

| 項目 | 値 |
|---|---|
| 統合ブランチ（デプロイ元） | `fukuoka-pref/develop`（CLAUDE.mdの「ベースブランチ」と同一） |
| Supabaseプロジェクト名 | `mirai-gikai-fukuoka-pref Project` |
| mainブランチ | **存在しない**（develop→mainのフローは無い） |

## 自動経路（通常はこれだけ）

```text
PRを統合ブランチにマージ
  → GitHub Actions「Migrate DB then Deploy Web」が起動
     1. supabase db push --include-all   … 未適用migrationを本番DBへ
     2. 成功したら Vercel Deploy Hook    … webを再ビルド・公開
```

- Secretは **Production Environment** に4つ（`SUPABASE_ACCESS_TOKEN` /
  `SUPABASE_DB_PASSWORD` / `SUPABASE_PROJECT_REF` / `WEB_VERCEL_DEPLOY_HOOK_URL`）。
  Repository secrets ではないので注意
- 手動で走らせたいときは `gh workflow run deploy_web.yml`（workflow_dispatch）
- 実行確認: `gh run list --workflow=deploy_web.yml --limit 3`

## やってはいけないこと

- **Vercel Hook を直接叩かない**。migrationを飛ばしてビルドだけ走り、
  スキーマ不整合のビルド失敗や「seed前の古いビルドが公開されたまま」の状態を作る
- **`supabase config push` を復活させない**。`config.toml` はローカル用の値
  （`site_url = http://127.0.0.1:3000` 等）を持ち、本番に流すと認証リダイレクトが
  localhostに書き換わって壊れる（ワークフローから削除済み。経緯は PR #21）
- migrationのSQLに `drop` / `truncate` / 既存データへの `delete` を含めない
  （必要な場合は必ずユーザー確認を経る）

## seedは自動で走らない

ワークフローが流すのは**migrationだけ**。データ投入（seed）は手動で行う:

```bash
# 実行前に必ず投入内容・件数をユーザーに提示して承認を得る（本番書き込みのため）
cd packages/seed
node --import=tsx/esm --env-file=<本番用env> fukuoka/<seedスクリプト>.ts
```

- 本番用envは `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` のみの一時ファイルを作り、
  **使用後に必ず削除**する
- seed後にそのデータを読むページ（`generateStaticParams` / sitemap 等）がある場合は
  **Vercelの再デプロイが必要**（seed→ビルドの順序が重要。「seed前のビルドを踏んで
  詳細ページが500」という事故が実際に起きた）

## migration履歴がズレたとき

`supabase db push --dry-run` で
`Remote migration versions not found in local migrations directory` が出たら、
本番に手動適用された記録がリポジトリに無い状態。

1. 中身を確認: Management API で `supabase_migrations.schema_migrations` の
   `statements` を読む（PostgRESTからは見えないスキーマのため）:

   ```bash
   set -a; . ./.env.production; set +a
   curl -s -X POST "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/query" \
     -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
     -d '{"query":"select version, name, statements from supabase_migrations.schema_migrations order by version desc limit 5;"}'
   ```
2. 同じ変更がリポジトリ側に別タイムスタンプで存在し、かつ冪等なら
   `supabase migration repair --status reverted <version>` で帳簿だけ修正する
   （SQLは実行されない。データ・スキーマは変わらない）
3. 判断に迷う内容なら**必ずユーザーに提示してから**進める

実例: `20260531000000`（answer_raw_text追加の手動適用記録）を repair で解消（2026-07-15）。

## 本番の状態確認（読み取り）

接続情報は `.env.production` から読み込む（値をハードコードしない）。
**書き込み前に、Supabaseプロジェクト名が冒頭の「このリポジトリの値」と一致することを
確認する**（地域リポジトリの取り違えで別地域の本番に書く事故を防ぐ）:

```bash
set -a; . ./.env.production; set +a
curl -s "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | jq -r '.name'
```
