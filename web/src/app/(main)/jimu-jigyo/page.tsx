import type { Metadata } from "next";
import { JimuJigyoArchivePage } from "@/features/jimu-jigyo/server/components/jimu-jigyo-archive-page";

export const metadata: Metadata = {
  title: "事務事業評価",
  description:
    "福岡県の行政評価（事務事業評価）をもとに、各事業の見直し区分・KPI・予算・効率の動向を可視化します。",
};

export default function Page() {
  return <JimuJigyoArchivePage />;
}
