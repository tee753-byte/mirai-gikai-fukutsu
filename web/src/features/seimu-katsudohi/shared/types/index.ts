import type { Database } from "@mirai-gikai/supabase";

export type SeimuKatsudohiReport =
  Database["public"]["Tables"]["seimu_katsudohi_reports"]["Row"];
export type SeimuKatsudohiExpenditureItem =
  Database["public"]["Tables"]["seimu_katsudohi_expenditure_items"]["Row"];

export type SeimuKatsudohiReportWithItems = SeimuKatsudohiReport & {
  items: SeimuKatsudohiExpenditureItem[];
};
