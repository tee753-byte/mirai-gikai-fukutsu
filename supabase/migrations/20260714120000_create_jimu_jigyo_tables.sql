-- 事務事業評価（福岡県 行政評価）テーブル群
-- raw_data JSONB 中心の設計。フロントは createAdminClient() 経由で参照する
-- （RLSは有効化のみ・ポリシー無し = デフォルト全拒否）

-- 部局マスタ（親部局12分類。フィルタ・表示順に使用）
create table jimu_jigyo_bureaus (
  code text primary key,
  name text not null unique,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table jimu_jigyo_bureaus enable row level security;

-- 事業マスタ（年度をまたいで同一の「事業」を表す。slugはURLに使用）
create table jimu_jigyo_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  bureau_code text not null references jimu_jigyo_bureaus(code) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_jimu_jigyo_items_bureau on jimu_jigyo_items(bureau_code);
alter table jimu_jigyo_items enable row level security;

-- 年度別評価（様式1号1シート = 1行。raw_dataに抽出済み全項目を保持）
create table jimu_jigyo_evaluations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references jimu_jigyo_items(id) on delete cascade,
  fiscal_year integer not null check (fiscal_year between 2022 and 2032),
  raw_data jsonb not null,
  -- SQLでの集計・検証用（見直し区分の分布確認等）
  review_major text generated always as (raw_data->'見直し'->>'大区分') stored,
  review_minor text generated always as (raw_data->'見直し'->>'小区分') stored,
  source_pdf text,
  source_page integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, fiscal_year)
);
create index idx_jimu_jigyo_evaluations_fy on jimu_jigyo_evaluations(fiscal_year);
alter table jimu_jigyo_evaluations enable row level security;

-- 公共事業再評価（様式3号総括表 = 事務事業評価とは別の評価類型）
create table jimu_jigyo_reevaluations (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  fiscal_year integer not null check (fiscal_year between 2022 and 2032),
  raw_data jsonb not null,
  source_pdf text,
  source_page integer,
  created_at timestamptz not null default now(),
  unique (slug, fiscal_year)
);
alter table jimu_jigyo_reevaluations enable row level security;
