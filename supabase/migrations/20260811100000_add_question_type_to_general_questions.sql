-- general_questions に質問種別を追加する。
--
-- 【背景】
-- 福津市議会の3月定例会には、市長の施政方針・予算編成に対する「総括質疑」がある
-- （一般質問とは別枠。会派単位で代表1名が登壇する）。これまでは一般質問しか
-- 記録しておらず、総括質疑を行った議員がその会期に何も質問していないように
-- 見えてしまっていた。テーブルの形（議員・要旨・トピック）は一般質問と同じ
-- ため、テーブルは分けず種別列だけを足す。
alter table public.general_questions
  add column question_type text not null default 'general';

alter table public.general_questions
  add constraint general_questions_question_type_check
  check (question_type in ('general', 'sokatsu_shitsugi'));
