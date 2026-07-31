-- 福津市版で追加するテーブル。
--
-- 背景:
-- 福津市議会の採決はすべて起立採決で、会議録には〔起　　立〕→「賛成多数であります」
-- としか残らない。どの議員が起立したかの氏名は会議録に一切記録されていない。
-- そのため議員個人の賛否は、
--   1) 賛成討論・反対討論をした議員（会議録に氏名が残る）      → bill_debates
--   2) 議会中継の録画を目視で確認して分かった賛否（手入力）    → bill_member_votes
-- の2系統に分けて持つ。出所が違うものを混ぜないための分割。

-- 採決のとり方。議員個人の賛否が分からないことを画面で正しく説明するために持つ
alter table bills add column if not exists vote_method text;

comment on column bills.vote_method is
  '採決のとり方: majority=賛成多数 / minority=賛成少数 / chairDecision=可否同数で議長裁決 / noObjection=異議なし';

-- 賛成討論・反対討論（会議録から抽出。氏名は会議録に残っている確実な事実）
create table if not exists bill_debates (
  id            uuid primary key default gen_random_uuid(),
  bill_id       uuid not null references bills(id) on delete cascade,
  stance        text not null check (stance in ('for', 'against')),
  speaker_name  text not null,
  speaker_number text,
  speaker_party text,
  summary       text,
  raw_text      text,
  speech_order  int not null default 1,
  created_at    timestamptz not null default now()
);

alter table bill_debates enable row level security;
create index if not exists bill_debates_bill_id_idx on bill_debates(bill_id);

-- 発議の提出者・賛成者（会議録の提案理由説明に氏名が読み上げられる）
create table if not exists bill_sponsors (
  id           uuid primary key default gen_random_uuid(),
  bill_id      uuid not null references bills(id) on delete cascade,
  role         text not null check (role in ('proposer', 'seconder')),
  member_name  text not null,
  member_party text,
  sort_order   int not null default 1,
  created_at   timestamptz not null default now()
);

alter table bill_sponsors enable row level security;
create index if not exists bill_sponsors_bill_id_idx on bill_sponsors(bill_id);
alter table bill_sponsors
  add constraint bill_sponsors_bill_id_member_name_key unique (bill_id, member_name);

-- 議員別の賛否。会議録には無いため、議会中継の録画を目視で確認して入れる。
-- source_note に「いつ・何を見て確認したか」を必ず書き、画面にも出す。
create table if not exists bill_member_votes (
  id           uuid primary key default gen_random_uuid(),
  bill_id      uuid not null references bills(id) on delete cascade,
  member_name  text not null,
  member_party text,
  vote         text not null check (vote in ('for', 'against', 'absent', 'chair')),
  source_note  text not null,
  created_at   timestamptz not null default now()
);

alter table bill_member_votes enable row level security;
create index if not exists bill_member_votes_bill_id_idx on bill_member_votes(bill_id);
alter table bill_member_votes
  add constraint bill_member_votes_bill_id_member_name_key unique (bill_id, member_name);

comment on column bill_member_votes.vote is
  'for=賛成 / against=反対 / absent=欠席・退席 / chair=議長（採決に加わらない）';
comment on column bill_member_votes.source_note is
  '確認方法の出典。例: 議会中継の録画を目視で確認（2026-07-30時点）';
