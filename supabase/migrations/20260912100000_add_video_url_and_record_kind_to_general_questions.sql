-- general_questions に録画URLと、レコード種別を追加する。
--
-- 【video_url】
-- 福津市議会は一般質問・総括質疑の録画を議員ごとのページ（gikaifukutsu.org）で
-- 公開している。会議録の公開まで3か月ほど空くため、その間だけでも録画への
-- リンクを出せるようにする。文字起こしはしない方針（fukutsu-publication-stages）
-- は変えず、あくまで市の公式録画への外部リンクを1本添えるだけ。
alter table public.general_questions
  add column video_url text;

-- 【record_kind】
-- 定例会ごとの登壇状況（星取表）は、今の任期の全期間を並べる設計だが、
-- 令和5年3月〜令和7年3月の9回分は当サイトに質問内容そのものを載せていない
-- （議案データが無く、掲載3段階の対象外）。星取表には「誰が登壇したか」
-- だけが必要なため、要旨・トピックを持たない軽いレコードを作れるようにする。
--
-- 'question'         … 通常の一般質問・総括質疑（要旨・トピックあり、記事として掲載）
-- 'attendance_only'  … 星取表のためだけの記録（登壇した事実のみ。記事としては出さない）
--
-- 既存の行はすべて 'question' として扱う（default）。
alter table public.general_questions
  add column record_kind text not null default 'question';

alter table public.general_questions
  add constraint general_questions_record_kind_check
  check (record_kind in ('question', 'attendance_only'));
