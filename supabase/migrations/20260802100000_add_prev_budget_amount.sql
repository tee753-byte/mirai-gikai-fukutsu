-- 事業ごとの前年度予算額を保存する。
-- 「何にいくら使うか」だけでなく「去年と比べてどう変わったか」を市民に見せるため。
-- 単位は budget_amount と同じ千円。
alter table budget_initiatives
  add column if not exists prev_budget_amount bigint;

comment on column budget_initiatives.prev_budget_amount is
  '前年度の予算額（千円）。資料に前年度欄がない場合は null';

-- badge に「縮小」を追加する。
-- 予算が減った事業も市民にとっては重要な情報で、新規・拡充だけを見せると
-- 増えたものばかりが目立つ偏った見え方になるため。
alter table budget_initiatives
  drop constraint if exists budget_initiatives_badge_check;

alter table budget_initiatives
  add constraint budget_initiatives_badge_check
  check (badge in ('new', 'expanded', 'continued', 'reduced'));
