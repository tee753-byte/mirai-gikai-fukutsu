import type { Metadata } from "next";
import { AboutScorePage } from "@/features/jimu-jigyo/server/components/about-score-page";

export const metadata: Metadata = {
  title: "この分析の見方について｜事務事業評価",
};

export default function Page() {
  return <AboutScorePage />;
}
