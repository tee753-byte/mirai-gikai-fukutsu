-- 福津市「まちづくり基本構想」7つのテーマのうち、その事業がどれに該当するかを保持する。
-- 福津市版の「主要事業の概要」PDFでは、事業ごとに「テーマ別目標像」としてこの7分類のいずれかが
-- 記載されているため、カード表示のタグとして使う。
alter table budget_initiatives
  add column basic_plan_theme text;
