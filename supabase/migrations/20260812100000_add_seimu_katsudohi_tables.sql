-- 政務活動費の見える化。会派・無会派議員1件×年度1件＝1行の収支報告書と、
-- その9費目（研究研修費/調査旅費/会議費/資料作成費/資料購入費/広報費/事務費/人件費/その他）の内訳。
--
-- 出典: 福津市議会「政務活動費の公開」ページ（市が自ら公開しているPDF）
--   https://www.city.fukutsu.lg.jp/gikai/koho/2369.html
--
-- council_sessions へのFKにはしない。政活費の「年度」は議会の会期概念とは
-- 一致しないため、独立したテキストスラッグ（fiscal_year_slug）で表現する。
create table seimu_katsudohi_reports (
  id uuid primary key default gen_random_uuid(),
  fiscal_year_slug text not null,        -- 例: "r7"（URL用）
  fiscal_year_label text not null,       -- 例: "令和7年度"
  group_type text not null check (group_type in ('caucus', 'independent_member')),
  group_name text not null,              -- 会派名 or 議員氏名
  group_slug text not null,              -- URL用
  member_names text[] not null,          -- 所属議員名（無会派は自分の氏名1件の配列）
  income_amount bigint not null,         -- 1 収入（交付額、円）
  expenditure_total bigint not null,     -- 2 支出 合計（円。内訳の合計から機械計算）
  balance_amount bigint not null,        -- 3 残額（円）
  source_url text not null,              -- 収支報告書PDFへの直リンク
  publish_status text not null default 'draft' check (publish_status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fiscal_year_slug, group_slug)
);
alter table seimu_katsudohi_reports enable row level security;

create table seimu_katsudohi_expenditure_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references seimu_katsudohi_reports(id) on delete cascade,
  category text not null check (category in (
    'research_training',     -- 研究研修費
    'research_travel',       -- 調査旅費
    'meeting',                -- 会議費
    'material_preparation',  -- 資料作成費
    'material_purchase',     -- 資料購入費
    'pr',                     -- 広報費
    'office',                  -- 事務費
    'personnel',                -- 人件費
    'other'                     -- その他
  )),
  amount bigint not null default 0,     -- 円。原本が空欄の場合は0
  note text,                            -- 手書き備考（内訳メモ）
  sort_order integer not null,          -- 原本の表の掲載順（0〜8固定。中立性とは無関係）
  created_at timestamptz not null default now(),
  unique (report_id, category)
);
alter table seimu_katsudohi_expenditure_items enable row level security;
create index seimu_katsudohi_expenditure_items_report_id_idx
  on seimu_katsudohi_expenditure_items(report_id);
