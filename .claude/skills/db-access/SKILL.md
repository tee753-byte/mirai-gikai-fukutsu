---
name: db-access
description: 本番DB・ローカルDB接続の規約。DBデータを参照・更新する際に必ず確認すること。
---

# DB接続規約

## 重要：ローカルAdminは本番DBに接続済み

ローカルの Admin アプリは `.env.production` を使って**本番 Supabase DB** に接続している。

## 接続先はハードコードせず、必ず `.env.production` から読む

**このリポジトリの本番は `.env.production` の `SUPABASE_URL` が正**。

以前このスキルには本番URLが直接書かれていたが、**実在するどのプロジェクトとも一致しない古い値**
だった。ドキュメントにURLを書くと実態とズレたときに気づけず、**別のDBを操作する事故**につながる。

```bash
# 値を画面に出さずに読み込む
set -a; . ./.env.production; set +a
```

**mirai-gikai は地域ごとに別プロジェクトが並存している**（福岡県版／福岡市版／安芸高田市版…）。
それぞれ別のクローンに別の `.env.production` があり、**リポジトリを間違えると平然と別地域の本番に繋がる**。
書き込み前には必ず接続先を確認すること。

### 接続先の確認方法（書き込み前に必須）

```bash
# 1. プロジェクト名で確認（最も確実。地域名が入っている）
curl -s "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | jq -r '.name'

# 2. データで確認（上が使えないとき）
curl -s "$SUPABASE_URL/rest/v1/bills?select=name&limit=2" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
# → 県版なら議案名が「福岡県○○条例」等になっている
```

## DBを操作する際のルール

- DB の確認・更新は**本番 URL に対して行う**（ローカルの `127.0.0.1` は使わない）
- REST API でアクセスする場合は `.env.production` の `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` を使用
- `npx supabase db query` ではなく `curl` + REST API で本番 DB に直接クエリする
- **本番への書き込み（INSERT/UPDATE/DELETE・migration適用）は、必ずユーザーの確認を経てから実行する**

## 接続例

```bash
# council_sessions 一覧取得
curl -s "$SUPABASE_URL/rest/v1/council_sessions?select=*" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

環境変数は `.env.production` から読み込むこと。

## PostgRESTから見えないものを読みたいとき

`supabase_migrations` スキーマなどは REST API に露出していないため、Management API を使う。

```bash
curl -s -X POST "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"query":"select version, name from supabase_migrations.schema_migrations order by version desc limit 5;"}'
```

## トラブルシュート

- **`No API key found in request` が返る / 変数が空になる**: `.env.production` の**変数名**を疑う。
  過去に `SUPABASE_SERVICｓE_ROLE_KEY`（全角の「ｓ」が混入）で読み込めていなかった実績がある。
  非ASCIIの混入行はこれで検出できる:
  ```bash
  grep -nP '^[^=]*[^\x00-\x7F][^=]*=' .env.production
  ```
