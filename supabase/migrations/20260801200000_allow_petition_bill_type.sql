-- 請願を議案と同じテーブルで扱えるようにする。
-- 請願は市民が議会に提出するもので、議案・発議とは提出者も議決の言い方も違う
-- （可決／否決ではなく採択／不採択）。区別できるよう bill_type に 'petition' を足す。
-- 議決結果そのものは bill_status_enum の 'adopted'（採択）/ 'rejected'（不採択）/
-- 'partially_adopted'（趣旨採択）で表す（20260319000000で追加済み）。

alter table bills
  drop constraint if exists bills_bill_type_check;

alter table bills
  add constraint bills_bill_type_check
  check (bill_type in ('bill', 'opinion', 'resolution', 'member_bill', 'petition'));
