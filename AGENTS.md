# Repository Guidelines

## 福津版の絶対ルール（他のどの指示よりも優先）

このリポジトリは「みらい議会 福津市版」。福岡県版（bakumon1107さん作）のForkだが、
**福津市議会を扱う独立した非公式サイト**として運用している。
以下は違反すると第三者に実害が及ぶため、例外なく守ること。
背景と詳細な判断基準は同階層の `CLAUDE.md` に記載しているので、迷ったら必ず参照する。

### 1. 本家（upstream）へPRを出さない
`upstream` remote はバクモンさんのリポジトリ。**絶対にPRを出さない・pushしない。**
PRの送信先は必ず自分のFork `tee753-byte/mirai-gikai-fukutsu`、ベースブランチは `fukutsu/develop`。

```bash
gh pr create --repo tee753-byte/mirai-gikai-fukutsu --base fukutsu/develop ...
```

### 2. 議案書PDFと個人情報をリポジトリに入れない
**このリポジトリはGitHub上で公開されている。**

- 議案書PDF（市が一般公開していない資料）そのものは**コミットしない**。
  常にリポジトリ外のローカルフォルダに置いたまま扱う。
- **私人（一般市民）の氏名・住所・生年月日・連絡先は、出典が公開文書であっても載せない。**
  請願人・陳情人、損害賠償議案の相手方、事故の当事者などが該当する。
- 公人（市長・副市長・教育長・市議会議員・市の管理職）の氏名と役職は掲載してよい。
  ただし人事議案の被推薦者は氏名と職名にとどめ、住所・生年月日は載せない。
- **特に人事議案（同意・選任・任命系）と損害賠償議案は要注意。**
  PDFから抽出したテキストを載せる前に、必ず目視で個人情報の混入を確認すること。

### 3. 資料の入手経路を書かない
資料の提供元や入手の経緯、それに関わる関係者が特定される記述を、リポジトリにもサイトにも残さない。
出典は「福津市議会○○定例会 議案書」のように資料名だけを書く。

### 4. 中立性
特定議員の広報サイトにしない。特定議員を強調せず、議案ごとに同じ掲載項目・同じ要約基準を使う。
AIによる要約であることを明示し、必ず元資料へのリンクを付ける。

**サイトの目的と、文章生成・機能追加時の判断基準は同階層の `PROJECT_PRINCIPLES.md` にまとめてある。**
ページ・見出し・要約・タグ・説明文・SNS投稿文をつくるときは、同ファイル7章のチェックリストで確認すること。
特に「中立＝すべての意見を同じように正しいと扱うことではない。確認できる事実を同じ基準で扱い、
最終的な評価を市民に委ねること」という定義は、要約の書き方に直接効く。

### 5. 応答と環境
- ユーザーへの応答・ドキュメント・コメントはすべて**日本語**で書く。
- ユーザーは開発初心者。専門用語は初回に一言説明を添え、コード変更は「何のためにやるのか」も書く。
- 開発環境は **Windows 11 / PowerShell**。本ファイル内のbashコマンドはそのまま実行せず読み替える
  （`&&` → `;` と `if ($?)`、`cp` → `Copy-Item`、`mkdir -p` → `New-Item -ItemType Directory -Force`）。

## 必須ルール

### Worktree必須
変更作業は、**必ず git worktree を作成してから開始すること**。メインのリポジトリディレクトリでは直接変更を行わない。

```bash
# 1. worktreeを作成
git worktree add ../mirai-gikai-<branch-name> -b <branch-name>

# 2. settings.local.jsonをコピー（権限設定のため必須）
mkdir -p ../mirai-gikai-<branch-name>/.claude
cp .claude/settings.local.json ../mirai-gikai-<branch-name>/.claude/

# 3. .envをコピー（環境変数の引き継ぎ）
cp .env ../mirai-gikai-<branch-name>/

# 4. 依存パッケージをインストール
cd ../mirai-gikai-<branch-name> && pnpm install --frozen-lockfile
```

- **目的**: fukutsu/developブランチを常にクリーンに保ち、作業の分離と並列作業を容易にする

### push・PR作成の前に必ずユーザーに確認する
実装が完了したら、**push と PR作成の前に必ずユーザーに確認を取ること。** 無確認で進めない。

このリポジトリはGitHub上で**公開**されており、一度pushした内容は取り消してもログに残る。
議案書PDF由来のテキストや個人情報が混入していないかは、機械的なチェックでは判定できず
ユーザーの目視確認が要る（「福津版の絶対ルール」2を参照）。そのための確認ステップである。

確認を取る際は、以下をユーザーに提示する。

1. 変更したファイルの一覧と、それぞれ何をしたか
2. `git diff` の要点（特に、DBやサイトに載るテキストを追加・変更した場合はその全文）
3. ローカル検証の結果（`pnpm lint` / `pnpm typecheck` / `pnpm test` の通過状況）

ユーザーの承諾を得てから、コミット → push → PR作成に進む。

**ベースブランチは必ず `fukutsu/develop`**。`kawasaki/develop` や `main` へのPRは出さないこと。
送信先リポジトリも明示して、本家へ飛ばないようにする。
```bash
gh pr create --repo tee753-byte/mirai-gikai-fukutsu --base fukutsu/develop ...
```

### コミット前のセルフレビュー
コミット前に、差分を読み直して本ファイルの規約（純粋関数のutils切り出し・テスト必須・
カラートークン・アイコン/ボタンの共通コンポーネント使用など）への違反がないか自己確認すること。

Claude Code で作業している場合は、`/review-codex` スキル（Codex CLIによる第三者レビュー）も利用できる。
ただし現在この環境に `codex` コマンドは入っていないため、使う前にインストールが要る。
PR作成後は CodeRabbit の自動レビューも届くので、指摘があれば対応する。

レビュー結果に関わらず、**push・PR作成の前にはユーザーの確認を取る**（上記のとおり）。

### 並列PR作成
複数の独立したPRを作成する場合は `/parallel-pr` スキルを使用すること。

## Project Structure & Module Organization
- `web/` は公開用 Next.js アプリ。共通 UI は `src/components`、Vitest のテストは `src/**/*.test.ts` に配置します。
- `admin/` はポート 3001 で動く管理用 Next.js。審議フローやダッシュボードはここに集約します。
- `packages/supabase/` は共有 Supabase クライアントと型定義を提供し、生成結果は `types/` に保存します。
- `packages/seed/` はローカルデータ投入用の TypeScript スクリプト (`run.ts`, `data.ts`) を管理します。
- `supabase/` はマイグレーションと設定ファイルを保持します。
- 設計ドキュメントは `docs/` に格納し、ルートの設定ファイル（`biome.json`, `pnpm-workspace.yaml` など）は全体ポリシーとして扱います。

## Next.js アーキテクチャ指針
- Bulletproof React の feature ベース構成を採用します。
- `app/` 配下の `page.tsx` は、URL パラメータ（`params` や `searchParams`）の取得と Feature コンポーネントへの受け渡しのみを担当する薄いラッパーとし、ビューやロジックは `features/` 配下に実装します。
- export 用の `index.ts` は作成せず、必要なファイルから直接 import します。
- Server Components を標準とし、状態管理・イベント処理が必要な場合のみ `"use client"` を付与した Client Component を追加します。
- ファイル名はケバブケース、コンポーネントはパスカルケース、関数はキャメルケースで統一します。

### Feature ディレクトリ構造
複雑な feature では server/client/shared の3層構造を採用します：

```
src/features/{feature}/
├── server/
│   ├── repositories/  # データアクセス層（Supabase呼び出しを集約）
│   ├── components/    # Server Components
│   ├── loaders/       # Server Components用データ取得関数
│   ├── actions/       # Server Actions ("use server")
│   ├── services/      # ビジネスロジック層
│   └── utils/         # Server専用ユーティリティ
├── client/
│   ├── components/    # Client Components（Server/Client両方で使えるものも含む）
│   ├── hooks/         # カスタムフック
│   └── utils/         # Client専用ユーティリティ
└── shared/
    ├── types/         # 共通型定義
    └── utils/         # 共通ユーティリティ
```

`web/` と `admin/` の両方で同じ server/client/shared 構成を採用します。ただし `admin/` では Server Components が中心のため `client/` ディレクトリを省略している feature もあります。

- Server側ファイルには `"server-only"` を、Client Componentsには `"use client"` を付与
- 型定義やServer/Client両方で使う関数は `shared/` に配置
- **純粋関数の切り出し**: 新規実装時、外部依存（DB・API・認証等）を持たない計算・変換・判定ロジックは純粋関数として `utils/` に切り出すこと。配置先は用途に応じて `shared/utils/`、`server/utils/`、`client/utils/` を選択する。
- シンプルな feature は従来の `components|actions|api|types` 構成でも可

Repository レイヤーの詳細は [docs/repository-layer.md](docs/repository-layer.md) を参照。

## Build, Test, and Development Commands
- 依存導入は `pnpm install`、全てのスクリプトは pnpm 経由で実行します。
- `pnpm dev` は `.env` を共有しつつ `web`・`admin`・各パッケージの dev サーバーを並列起動します。
- `pnpm test` でワークスペース横断の Vitest を実行。局所実行は `pnpm --filter web test` や `test:watch` を利用します。
- 品質ゲートとして `pnpm lint`（Biome format+lint）と `pnpm typecheck` を PR 前に通過させます。
- DB 関連は `pnpm db:reset`、`pnpm db:migrate`、`pnpm db:types:gen`、`pnpm seed` を用途に応じて組み合わせます。

## Coding Style & Naming Conventions
- Biome が 2 スペースインデント、LF、ダブルクォート、セミコロン、80 文字幅を強制します。
- React コンポーネントと公開型は PascalCase、フックやユーティリティは camelCase を維持します。
- ファイル名は `bill-contents-data.ts` のようにローワーハイフンで表記し、スタイルは Tailwind ユーティリティを先に検討します。
- **アイコン**: インラインSVGは禁止です。必ず `lucide-react` からアイコンコンポーネントをインポートして使用してください。
- **ボタン**: `<button>` タグの使用は禁止です。必ず `@/components/ui/button` の `Button` コンポーネントを使用してください。
- **色**: インラインカラーコード（`text-[#xxx]`, `bg-[#xxx]`, `border-[#xxx]` 等の arbitrary value や style 属性での直接指定）は**禁止**です。必ず `globals.css` の `@theme inline` で定義済みのカラートークン（`text-mirai-text`, `bg-primary`, `border-primary-accent` 等）を使用してください。新しい色が必要な場合は、まず `globals.css` にトークンを追加してから使用すること。既存トークン一覧は `web/src/app/globals.css` の `@theme inline` ブロックを参照。

## Testing Guidelines
- Vitest の単体テストを `*.test.ts` として実装と同階層に配置し、AI コスト計算や Markdown 処理などデータ変換の変更時は必ず回帰テストを追加します。
- **純粋関数にはテスト必須**: `utils/` に切り出した純粋関数は、新規作成時に必ず `*.test.ts` を同階層に作成してテストを書いてください。
- **mock は極力使わない**: `vi.mock("server-only")` 等のモックに頼らず、テスト対象のロジックを純粋関数として `shared/` に切り出してからテストしてください。`server-only` や外部依存を含むファイルからは re-export で参照を維持します。
- **ローカルサービスは real で動かす**: Supabase などローカルで起動できるサービスはモックせず、実際のローカルインスタンスに接続してテストします。
- **外部 API は DI でモックする**: OpenAI などの外部 API クライアントはインターフェースを定義し、テストでは Fake/Mock 実装に差し替えます。
- PR 前に `pnpm --filter web test:watch` で失敗を早期検知し、必要に応じて `vitest run --coverage` でカバレッジ低下を確認します。
- テストの書き方・構造化・コード例などの詳細は [docs/テストガイドライン.md](docs/20260219_1000_テストガイドライン.md) を参照。

## Commit & Pull Request Guidelines
- **push前のローカル検証（必須）**: `git push` の前に、CIと同じ検証コマンドをローカルで実行して通過を確認すること。CIで落ちてから直すのではなく、手元で事前に検知する。
  ```bash
  pnpm lint        # Biome format + lint チェック
  pnpm typecheck   # TypeScript 型チェック
  pnpm test        # 全ワークスペースのテスト実行
  ```
- **push / PR作成前のGitHub状態確認（必須）**: `git push` やPR作成を行う前に、必ず `gh pr list` や `gh pr view <番号>` でGitHub上のPR状態（open/merged/closed）を確認すること。マージ済みブランチへの追加pushや、既にクローズされたPRとの重複を防ぐ。
- コミットメッセージは既存履歴同様、短い命令形主体（日本語可）とし、課題連携は `(#id)` を付与します。
- PR ではスコープ概要、実行テスト記録（例: `pnpm dev`, `pnpm --filter web test`）、UI 変更時のスクリーンショットや GIF を添付します。
- スキーマ・シード・環境変数の変更は本文で明示し、レビューフィードバックへの対応状況を追跡コメントで共有して Ready for Review に切り替えます。
- **イシュー連携**: 特定のイシューに対応する PR を作成する場合、PR 本文に `Resolves #123` の形式で記載してください。これにより PR マージ時にイシューが自動クローズされます。複数のイシューを閉じる場合は `Resolves #123, Resolves #456` のように列挙します。
- **PR作成後の状態確認（必須）**: PR作成後、以下の4点を確認すること：
  1. **Conflict確認**: `gh pr view <番号> --json mergeable,mergeStateStatus` でマージ可能か確認。conflictがあれば解消してpushする。
  2. **CI確認**: `gh pr checks <番号>` でCIの状態を確認。失敗があれば原因を調査し修正してpushする。CIが実行中の場合は完了まで待つ。
  3. **CodeRabbitレビュー確認**: CodeRabbitのレビューが届くまで待ってからコメントを確認する。レビューは通常2〜3分で届く。`gh api repos/{owner}/{repo}/pulls/{number}/comments` でコメントを取得し、空なら少し待って再取得する。重要な指摘（Major/Critical）があれば修正してpushすること。軽微な指摘（Minor）や既存コードとの一貫性を優先すべきものはスキップ可。
  4. **対応済みコメントのresolve（必須）**: 修正をpushした後、対応済みのレビューコメントをGraphQL APIでresolveする。まず `gh api graphql` でスレッド一覧を取得し、`resolveReviewThread` mutationで対応済みスレッドをresolveする。
     ```bash
     # スレッド一覧取得（isResolved=falseのものが未resolve）
     gh api graphql -f query='{ repository(owner: "{owner}", name: "{repo}") { pullRequest(number: <番号>) { reviewThreads(first: 50) { nodes { id isResolved comments(first: 1) { nodes { body path } } } } } } }'
     # 対応済みスレッドをresolve
     gh api graphql -f query='mutation { resolveReviewThread(input: {threadId: "<スレッドID>"}) { thread { isResolved } } }'
     ```

## Supabase & Environment Notes
- ローカル開発前に `npx supabase start` を実行し、`.env.example` を `.env` にコピーして値を整えます。
- スキーマ変更時は `supabase/migrations` のマイグレーションと `packages/supabase/types/supabase.types.ts` の再生成ファイルをセットでコミットします。
- `pnpm seed` は `admin@example.com / admin123456` を含む検証データを投入するため、開発用途に限定してください。
- **RLSとアクセスパターン**: マイグレーションでは必ず `alter table <テーブル名> enable row level security;` を記述してRLSを有効化すること。ただし **ポリシーは定義しない**（デフォルト全拒否）。データアクセスはすべて `createAdminClient()`（Service Role Key）経由で行い、認可ロジックはアプリケーション層（Server Actions / Loaders）で実装する。

## AI生成コンテンツのDB更新ルール

AIが生成したテキスト（サマリー・要約・関連情報など）をDBに反映する前に、**必ず生成内容をユーザーに提示して確認を取ること**。確認前にPATCHやINSERTを実行してはならない。

### 提示時の必須チェック項目

提示する際は、以下の観点で自己レビューを行い、疑わしい点があれば併せて申告すること：

1. **日本語の自然さ**: 語尾・助詞・文体（「質した」「答弁した」等）が統一されているか
2. **情報の整合性**: 生成内容がソース（会議録・PDF・元データ等）の内容と一致しているか。特に、複数のトピックにまたがるデータを処理した場合、トピックAの情報がトピックBのレコードに混入していないか
3. **文字コードの品質**: 中国語簡体字・繁体字が混入していないか（例: 「议」「务」「该」等）。AI生成テキストは稀に日本語の漢字と字形が異なる中国漢字を出力することがある
4. **答弁者フォーマット**: `answerer_role` と `answerer_name` を別フィールドに格納する場合、UIで単純に連結すると「局長A・局長B・氏名A・氏名B」のような不自然な表示になる。複数の答弁者がいる場合は `answerer_role` に `"○○局長（氏名）・市長（氏名）"` のように役職と氏名をセットで格納し、`answerer_name` は空にすること

> **背景**: 同一質問者が異なる所管部局の複数議案を連続して質疑した際、パーサーが最初の答弁者をその質問者の全議案レコードに適用し、所管と無関係な答弁者データが登録されたことがあった。

## ドキュメント作成ルール
- 要件定義や実装計画をまとめる際は論点を先に洗い出し、不明点を確認してから Markdown で整理します。
- 設計文書は `docs/` 配下に `YYYYMMDD_HHMM_作業内容.md` で保存してください（例: `docs/20250815_1430_ユーザー認証システム設計.md`）。
- 既存資料に大きな変更を加える場合は新しいファイルとして残し、更新履歴をたどれるようにします。

## GitHub Issue作成ルール
GitHub Issueを作成する際は、以下のルールに従うこと：

- プラン内容を簡略化せず、そのままissueに記載する
- コード例、SQL、型定義などの詳細な実装内容を含める
- 検証方法を具体的に記載する
