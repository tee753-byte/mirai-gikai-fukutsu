# みらい議会＠福津市

公開URL: https://mirai-gikai-fukutsu.jp

## 注意事項

- このプロジェクトは「チームみらい」が開発・運営している「みらい議会」
  （[福岡県版](https://github.com/bakumon1107/mirai-gikai-fukuoka-pref)、作者: バクモンさん）をForkして開発した、
  福津市議会の議案・議決結果などを分かりやすく伝える**非公式**サイトです。
- 福津市・福津市議会が運営する公式サイトではありません。
- ここでの不具合や気になる点についての問い合わせは、党公式や福津市議会ではなく
  開発担当者にご連絡ください。
- サイトの目的と、掲載・編集の判断基準は
  [運営・編集方針](PROJECT_PRINCIPLES.md) にまとめています。

## 他地方議会向けForkガイド

- 他の市議会・県議会等のバージョンを作成したい場合は、
  以下のドキュメントを参考にすると早いと思います
  [fork手順](docs/kawasaki/20260304_1000_別地域向けfork手順.md)

---

# みらい議会

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/team-mirai-volunteer/mirai-gikai)
[![codecov](https://codecov.io/gh/team-mirai/mirai-gikai/branch/develop/graph/badge.svg)](https://codecov.io/gh/team-mirai/mirai-gikai)

## セットアップ

```bash
# Supabaseの起動
npx supabase start

# 環境変数の設定（必要に応じて.envの内容を変更してください）
cp .env.example .env

# パッケージインストール
pnpm install

# SupabaseのDB初期化, 開発用シードデータのセットアップ
pnpm db:reset

# サーバー起動
pnpm dev
```

## マイグレーション

```bash
# マイグレーションファイル生成
npx supabase migration new マイグレーション名

# マイグレーション実行 & 型ファイル更新
pnpm db:migrate
```

## Adminユーザーの作成

1. Supabase Studio上で Authentication > Add User からユーザーを作成
2. Supabase Studio上で以下のSQLを実行

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"roles": ["admin"]}'::jsonb
WHERE email = '<1で作成したユーザーのemail>';
```

> [!NOTE]
> 開発環境では、seedデータによって、`email: admin@example.com, password: admin123456` のAdminユーザーが作成されます。

## 本番デプロイ

[公開デプロイ手順書](docs/fukuoka/20260330_1500_公開デプロイ手順書.md) を参照してください
（Fork元の福岡市版向けの手順書ですが、Supabase/Vercelのデプロイ手順自体は地域を問わず共通です）。
