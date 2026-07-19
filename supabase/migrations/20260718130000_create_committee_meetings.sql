-- 委員会議事録アーカイブ用テーブル
--
-- committees には現在常任委員会8つのみ登録されているため、区分カラムを追加する。
-- 特別委員会等の行追加はシード（Phase 2）で行う。
alter table committees add column committee_type text not null default 'standing'
  check (committee_type in ('standing', 'special', 'budget', 'audit', 'management'));

-- committee_meetings: 委員会の開催1回分（会議録検索システムの「本文」1文書に対応）
create table committee_meetings (
  id uuid primary key default gen_random_uuid(),
  -- 特別委員会など committees 未登録の会議もあるため nullable
  committee_id uuid references committees(id),
  -- 開催時点の委員会名（改組前の旧名称のことがある）
  committee_name text not null,
  -- 同一系統の委員会を名称変更をまたいで束ねるスラッグ
  committee_slug text not null,
  meeting_date date not null,
  title text not null,
  -- 会議録検索システムの DocumentID（再取得時の重複防止キー）
  source_document_id integer not null unique,
  source_url text not null,
  -- 会議全体のAI要約（Phase 2で生成）
  summary text,
  -- 発言単位の構造化データ [{voiceNo, speakerLabel, speakerType, text}]
  speeches jsonb not null default '[]'::jsonb,
  -- 会議録原文の全文
  raw_text text not null,
  publish_status text not null default 'draft'
    check (publish_status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table committee_meetings enable row level security;

create index committee_meetings_committee_id_idx
  on committee_meetings(committee_id);
create index committee_meetings_slug_date_idx
  on committee_meetings(committee_slug, meeting_date desc);

create trigger update_committee_meetings_updated_at
  before update on committee_meetings
  for each row execute function update_updated_at_column();

-- committee_meeting_topics: 会議内の議題1件分
create table committee_meeting_topics (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references committee_meetings(id) on delete cascade,
  topic_order integer not null,
  title text not null,
  -- 議題の市民向け要約（Phase 2で生成）
  summary text,
  -- 質疑の流れの要約（Phase 2で生成）
  discussion_summary text,
  -- 発言者一覧 [{label}]
  speakers jsonb not null default '[]'::jsonb,
  -- この議題に対応する発言範囲（committee_meetings.speeches の voiceNo）
  start_voice_no integer,
  end_voice_no integer,
  -- 議案カード連携（常任委の付託議案審査。Phase 3でマッチング）
  bill_id uuid references bills(id) on delete set null,
  -- 予算概要連携（部局単位。Phase 3でマッチング）
  budget_overview_id uuid references budget_overviews(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (meeting_id, topic_order)
);

alter table committee_meeting_topics enable row level security;

create index committee_meeting_topics_meeting_id_idx
  on committee_meeting_topics(meeting_id);
create index committee_meeting_topics_bill_id_idx
  on committee_meeting_topics(bill_id);
create index committee_meeting_topics_budget_overview_id_idx
  on committee_meeting_topics(budget_overview_id);

create trigger update_committee_meeting_topics_updated_at
  before update on committee_meeting_topics
  for each row execute function update_updated_at_column();
