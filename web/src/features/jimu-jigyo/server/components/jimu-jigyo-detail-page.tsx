import "server-only";
import { ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { BudgetBarChart } from "../../client/components/budget-bar-chart";
import { DirectionBadge } from "../../client/components/direction-badge";
import { KpiTrendChart } from "../../client/components/kpi-trend-chart";
import { ReviewCategoryBadge } from "../../client/components/review-category-badge";
import type {
  JimuJigyoRecord,
  PrefKpiItem,
  ReiwaYear,
} from "../../shared/types/jimu-jigyo";
import { normalizePdfText } from "../../shared/utils/normalize-pdf-text";

type Props = {
  record: JimuJigyoRecord;
  basePath: string;
  difficulty: DifficultyLevelEnum;
};

const PDF_BASE = "https://www.pref.fukuoka.lg.jp/uploaded/life";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card border border-mirai-border rounded-lg p-5 space-y-3">
      <h2 className="text-base font-bold text-mirai-text">{title}</h2>
      {children}
    </section>
  );
}

function kpiYears(kpi: PrefKpiItem): ReiwaYear[] {
  return [
    ...new Set([
      ...Object.keys(kpi.目標 ?? {}),
      ...Object.keys(kpi.実績 ?? {}),
    ]),
  ]
    .filter((k): k is ReiwaYear => /^R\d+$/.test(k))
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}

export function JimuJigyoDetailPage({ record, basePath, difficulty }: Props) {
  const { analysis } = record;
  const sogo = record.総合計画位置づけ;
  const pdf = record.出典?.pdf;
  const aiGaiyou = difficulty === "normal" ? (record.ai概要 ?? null) : null;

  // 概要版（難易度「ふつう」かつAI概要あり）:
  // 原文の転載を避け、AIによる平易な文章とグラフだけで構成する
  if (aiGaiyou) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        <div className="text-xs text-mirai-text-muted">
          <Link href={basePath} className="hover:underline">
            事務事業評価
          </Link>
          <span className="mx-1">/</span>
          <span>{record.部局}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-mirai-text">
              {record.事業名}
            </h1>
            <ReviewCategoryBadge
              major={record.見直し.大区分}
              minor={record.見直し.小区分}
              size="md"
            />
          </div>
          <p className="text-sm text-mirai-text-muted">
            {record.部局}
            {record.課室 && ` ${record.課室}`}
            {record.事業開始年度 && ` · ${record.事業開始年度}開始`}
          </p>
        </div>

        <Section title="どんな事業？">
          <p className="text-sm text-mirai-text-secondary leading-relaxed">
            {aiGaiyou.事業説明}
          </p>
        </Section>

        {record.成果指標.length > 0 && (
          <Section title="成果指標の推移">
            <div className="space-y-6">
              {record.成果指標.map((kpi, i) => (
                <div key={`${kpi.内容}-${i}`} className="space-y-2">
                  <h3 className="text-sm font-medium text-mirai-text">
                    {kpi.内容}
                  </h3>
                  <KpiTrendChart kpi={kpi} />
                </div>
              ))}
            </div>
          </Section>
        )}

        {record.事業費?.年度別 && (
          <Section title="事業費の推移（千円）">
            <BudgetBarChart data={record} />
          </Section>
        )}

        <Section title="数字から見える動き">
          <p className="text-sm text-mirai-text-secondary leading-relaxed">
            {aiGaiyou.推移の解説}
          </p>
          <div className="space-y-3 border-t border-mirai-border pt-3">
            <AnalysisRow
              label="KPI"
              direction={analysis.kpi.direction}
              changeRate={analysis.kpi.changeRate}
              text={analysis.kpi.text}
            />
            <AnalysisRow
              label="予算"
              direction={analysis.budget.direction}
              changeRate={analysis.budget.changeRate}
              text={analysis.budget.text}
            />
            <AnalysisRow
              label="効率"
              direction={analysis.efficiency.direction}
              changeRate={analysis.efficiency.changeRate}
              text={analysis.efficiency.text}
            />
          </div>
        </Section>

        <Section title="見直しの方向性">
          <p className="text-sm text-mirai-text-secondary leading-relaxed">
            {aiGaiyou.見直しの意味}
          </p>
        </Section>

        <AiDisclaimer />

        {pdf && (
          <a
            href={`${PDF_BASE}/${pdf}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" aria-hidden />
            評価書の原本（PDF）を見る
            {record.出典?.印字ページ && `（P${record.出典.印字ページ}）`}
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
      {/* パンくず */}
      <div className="text-xs text-mirai-text-muted">
        <Link href={basePath} className="hover:underline">
          事務事業評価
        </Link>
        <span className="mx-1">/</span>
        <span>{record.部局}</span>
      </div>

      {/* ヘッダー */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-mirai-text">
            {record.事業名}
          </h1>
          <ReviewCategoryBadge
            major={record.見直し.大区分}
            minor={record.見直し.小区分}
            size="md"
          />
        </div>
        <p className="text-sm text-mirai-text-muted">
          {record.部局}
          {record.課室 && ` ${record.課室}`}
          {record.事業開始年度 && ` · ${record.事業開始年度}開始`}
        </p>
      </div>

      {/* 事業のねらい・概要 */}
      {(record.ねらい目的 || record.概要一覧?.事業の内容) && (
        <Section title="事業のねらい・概要">
          {record.ねらい目的 && (
            <p className="text-sm text-mirai-text-secondary whitespace-pre-line">
              {normalizePdfText(record.ねらい目的)}
            </p>
          )}
          {record.概要一覧?.事業の内容 && (
            <p className="text-sm text-mirai-text-secondary whitespace-pre-line border-t border-mirai-border pt-2">
              {normalizePdfText(record.概要一覧.事業の内容)}
            </p>
          )}
        </Section>
      )}

      {/* 総合計画位置づけ */}
      {sogo && (sogo.柱 || sogo.中項目) && (
        <Section title="総合計画上の位置づけ">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {sogo.柱 && <Row label="4つの柱" value={sogo.柱} />}
            {sogo.中項目 && <Row label="中項目" value={sogo.中項目} />}
            {sogo.小項目 && <Row label="小項目" value={sogo.小項目} />}
            {sogo.具体的な取組 && (
              <Row label="具体的な取組" value={sogo.具体的な取組} />
            )}
          </dl>
        </Section>
      )}

      {/* 成果指標 */}
      {record.成果指標.length > 0 ? (
        <Section title="成果指標の推移">
          <div className="space-y-6">
            {record.成果指標.map((kpi, i) => (
              <div key={`${kpi.内容}-${i}`} className="space-y-2">
                <h3 className="text-sm font-medium text-mirai-text">
                  {kpi.内容}
                </h3>
                <KpiTable kpi={kpi} />
                <KpiTrendChart kpi={kpi} />
              </div>
            ))}
          </div>
          {record.成果指標設定根拠 && (
            <p className="text-xs text-mirai-text-muted whitespace-pre-line border-t border-mirai-border pt-2">
              <span className="font-medium">設定根拠：</span>
              {normalizePdfText(record.成果指標設定根拠)}
            </p>
          )}
          {record.実績評価と要因 && (
            <p className="text-xs text-mirai-text-muted whitespace-pre-line">
              <span className="font-medium">実績評価と要因：</span>
              {normalizePdfText(record.実績評価と要因)}
            </p>
          )}
        </Section>
      ) : (
        record.進捗状況テキスト && (
          <Section title="進捗状況">
            <p className="text-sm text-mirai-text-secondary whitespace-pre-line">
              {normalizePdfText(record.進捗状況テキスト)}
            </p>
          </Section>
        )
      )}

      {/* 事業費 */}
      {record.事業費?.年度別 && (
        <Section title="事業費の推移（千円）">
          <BudgetBarChart data={record} />
          {record.事業費.人件費 && (
            <p className="text-xs text-mirai-text-muted">
              ※
              人件費は事業費（歳出）と別掲。棒グラフは歳出（一般財源＋特定財源）を示します。
            </p>
          )}
          {record.効率化工夫 && (
            <p className="text-xs text-mirai-text-muted whitespace-pre-line border-t border-mirai-border pt-2">
              <span className="font-medium">効率化の工夫：</span>
              {normalizePdfText(record.効率化工夫)}
            </p>
          )}
        </Section>
      )}

      {/* 3軸分析 */}
      <Section title="KPI・予算・効率の動向">
        <div className="space-y-3">
          <AnalysisRow
            label="KPI"
            direction={analysis.kpi.direction}
            changeRate={analysis.kpi.changeRate}
            text={analysis.kpi.text}
          />
          <AnalysisRow
            label="予算"
            direction={analysis.budget.direction}
            changeRate={analysis.budget.changeRate}
            text={analysis.budget.text}
          />
          <AnalysisRow
            label="効率"
            direction={analysis.efficiency.direction}
            changeRate={analysis.efficiency.changeRate}
            text={analysis.efficiency.text}
          />
        </div>
      </Section>

      {/* 見直しの内容（県の判断）。事業の中身・実績・費用を示した後に結論を置く */}
      <Section title="見直しの内容">
        <div className="text-sm text-mirai-text-secondary space-y-2">
          {record.見直し.理由 && (
            <p className="whitespace-pre-line">
              <span className="font-medium text-mirai-text">理由：</span>
              {normalizePdfText(record.見直し.理由)}
            </p>
          )}
          {record.見直し.内容 && (
            <p className="whitespace-pre-line">
              <span className="font-medium text-mirai-text">内容：</span>
              {normalizePdfText(record.見直し.内容)}
            </p>
          )}
        </div>
      </Section>

      {/* 原本PDF */}
      {pdf && (
        <a
          href={`${PDF_BASE}/${pdf}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ExternalLink className="w-4 h-4" aria-hidden />
          評価書の原本（PDF）を見る
          {record.出典?.印字ページ && `（P${record.出典.印字ページ}）`}
        </a>
      )}
    </div>
  );
}

/** AI生成コンテンツの注意書き（概要版のみ表示） */
function AiDisclaimer() {
  return (
    <p className="flex items-start gap-1.5 text-xs text-mirai-text-muted">
      <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden />
      この概要は、県の評価書をもとにAIが分かりやすく書き直したものです。正確な原文は、表示切替の「難しい」または原本PDFでご確認ください。
    </p>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-mirai-text-muted">{label}</dt>
      <dd className="text-mirai-text-secondary">{value}</dd>
    </div>
  );
}

function AnalysisRow({
  label,
  direction,
  changeRate,
  text,
}: {
  label: string;
  direction: JimuJigyoRecord["analysis"]["kpi"]["direction"];
  changeRate: number | null;
  text: string;
}) {
  return (
    <div className="space-y-1">
      <DirectionBadge
        label={label}
        direction={direction}
        changeRate={changeRate}
      />
      <p className="text-sm text-mirai-text-secondary pl-9">{text}</p>
    </div>
  );
}

function KpiTable({ kpi }: { kpi: PrefKpiItem }) {
  const years = kpiYears(kpi);
  if (years.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse min-w-full">
        <thead>
          <tr className="text-mirai-text-muted">
            <th className="text-left font-medium pr-3 py-1"> </th>
            {years.map((y) => (
              <th key={y} className="px-2 py-1 text-right font-medium">
                {y}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(["目標", "実績"] as const).map((kind) => (
            <tr key={kind} className="border-t border-mirai-border">
              <td className="pr-3 py-1 text-mirai-text-muted">{kind}</td>
              {years.map((y) => (
                <td
                  key={y}
                  className="px-2 py-1 text-right text-mirai-text-secondary"
                >
                  {kpi[kind]?.[y] != null ? String(kpi[kind]?.[y]) : "―"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
