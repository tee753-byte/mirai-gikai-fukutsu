import "server-only";
import Link from "next/link";
import { JimuJigyoCard } from "../../client/components/jimu-jigyo-card";
import { JimuJigyoSearchForm } from "../../client/components/jimu-jigyo-search-form";
import { getBudgetTimeline } from "../../shared/utils/budget-accessor";
import { BUREAUS } from "../../shared/utils/bureau";
import {
  countByBureau,
  countByCategory,
  filterRecords,
} from "../../shared/utils/filter";
import {
  buildCategorySlug,
  parseCategorySlug,
  REVIEW_MAJORS,
  REVIEW_MINORS_BY_MAJOR,
} from "../../shared/utils/review-category";
import {
  getYearMeta,
  type JimuJigyoYear,
  loadJimuJigyoList,
} from "../loaders/load-jimu-jigyo-list";
import { loadSaiHyokaList } from "../loaders/load-saihyoka-list";
import { SaiHyokaSection } from "./saihyoka-section";

type SearchParams = {
  bureau?: string;
  category?: string;
  q?: string;
  view?: string;
};

type Props = {
  year: JimuJigyoYear;
  basePath: string;
  searchParams: SearchParams;
};

function buildHref(
  basePath: string,
  params: Record<string, string | undefined>
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function Pill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`text-xs px-3 py-1 rounded-full border whitespace-nowrap transition-colors ${
        active
          ? "bg-mirai-text text-white border-mirai-text"
          : "bg-card border-mirai-border text-mirai-text-secondary hover:border-mirai-text"
      }`}
    >
      {children}
    </Link>
  );
}

export async function JimuJigyoListPage({
  year,
  basePath,
  searchParams,
}: Props) {
  const meta = getYearMeta(year);
  const allRecords = await loadJimuJigyoList(year);
  const view = searchParams.view === "saihyoka" ? "saihyoka" : "jimu";

  // 再評価タブ
  if (view === "saihyoka") {
    const saihyoka = await loadSaiHyokaList(year);
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <ListHeader meta={meta} basePath={basePath} total={allRecords.length} />
        <Tabs
          basePath={basePath}
          view="saihyoka"
          jimuCount={allRecords.length}
          saihyokaCount={saihyoka.length}
        />
        <SaiHyokaSection records={saihyoka} />
      </div>
    );
  }

  const filter = {
    bureau: searchParams.bureau,
    category: searchParams.category,
    q: searchParams.q,
  };
  const filtered = filterRecords(allRecords, filter);
  const hasFilter = Boolean(filter.bureau || filter.category || filter.q);

  const bureauCounts = countByBureau(allRecords);
  const { major: majorCounts, minor: minorCounts } =
    countByCategory(allRecords);
  const parsedCategory = parseCategorySlug(filter.category);

  // サマリー
  const totalOku =
    Math.round(
      allRecords.reduce((sum, r) => {
        const timeline = getBudgetTimeline(r);
        const latest = timeline.filter((t) => t.種別 === "決算").at(-1);
        return sum + (latest?.歳出 ?? 0);
      }, 0) / 10000
    ) / 10; // 千円合計 → 億円（小数1桁）
  const kpiUp = allRecords.filter(
    (r) => r.analysis.kpi.direction === "up"
  ).length;
  const kpiDown = allRecords.filter(
    (r) => r.analysis.kpi.direction === "down"
  ).length;

  const saihyoka = await loadSaiHyokaList(year);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <ListHeader meta={meta} basePath={basePath} total={allRecords.length} />

      {/* サマリー */}
      <div className="bg-card border border-mirai-border rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <SummaryCell value={allRecords.length} label="総事業数" />
        <SummaryCell value={majorCounts.継続 ?? 0} label="継続" />
        <SummaryCell value={majorCounts.終了 ?? 0} label="終了" />
        <SummaryCell
          value={`${totalOku.toLocaleString()}億円`}
          label="決算歳出合計"
        />
      </div>

      <Tabs
        basePath={basePath}
        view="jimu"
        jimuCount={allRecords.length}
        saihyokaCount={saihyoka.length}
      />

      {/* 検索 */}
      <JimuJigyoSearchForm
        action={basePath}
        defaultValue={filter.q}
        hidden={{ bureau: filter.bureau, category: filter.category }}
      />

      {/* 部局フィルタ（横スクロール1行→sm以上で折り返し） */}
      <div>
        <p className="text-xs text-mirai-text-muted mb-1">部局</p>
        <div className="flex sm:flex-wrap gap-2 overflow-x-auto pb-1 -mb-1">
          <Pill
            href={buildHref(basePath, {
              category: filter.category,
              q: filter.q,
            })}
            active={!filter.bureau}
          >
            全て
          </Pill>
          {BUREAUS.map((b) => (
            <Pill
              key={b.code}
              href={buildHref(basePath, {
                bureau: b.code,
                category: filter.category,
                q: filter.q,
              })}
              active={filter.bureau === b.code}
            >
              {b.name} {bureauCounts[b.code] ?? 0}
            </Pill>
          ))}
        </div>
      </div>

      {/* 見直し区分フィルタ（大区分→小区分の2段） */}
      <div>
        <p className="text-xs text-mirai-text-muted mb-1">見直し区分</p>
        <div className="flex flex-wrap gap-2 items-center">
          <Pill
            href={buildHref(basePath, { bureau: filter.bureau, q: filter.q })}
            active={!filter.category}
          >
            全て {allRecords.length}
          </Pill>
          {REVIEW_MAJORS.map((mj) => (
            <Pill
              key={mj}
              href={buildHref(basePath, {
                bureau: filter.bureau,
                category: buildCategorySlug(mj),
                q: filter.q,
              })}
              active={parsedCategory?.major === mj && !parsedCategory?.minor}
            >
              {mj} {majorCounts[mj] ?? 0}
            </Pill>
          ))}
        </div>
        {parsedCategory && (
          <div className="flex flex-wrap gap-2 items-center mt-2 pl-3 border-l-2 border-mirai-border">
            {REVIEW_MINORS_BY_MAJOR[parsedCategory.major].map((mn) => (
              <Pill
                key={mn}
                href={buildHref(basePath, {
                  bureau: filter.bureau,
                  category: buildCategorySlug(parsedCategory.major, mn),
                  q: filter.q,
                })}
                active={parsedCategory.minor === mn}
              >
                {mn} {minorCounts[`${parsedCategory.major}:${mn}`] ?? 0}
              </Pill>
            ))}
          </div>
        )}
      </div>

      {/* 件数＋クリア */}
      <div className="flex items-center gap-3 text-sm text-mirai-text-secondary">
        <span>
          {filtered.length}件
          {filtered.length !== allRecords.length &&
            `（全${allRecords.length}件中）`}
        </span>
        {hasFilter && (
          <Link href={basePath} className="text-primary underline text-xs">
            条件をクリア ×
          </Link>
        )}
        <span className="ml-auto text-xs text-mirai-text-muted">
          KPI改善 {kpiUp} / 悪化 {kpiDown}
        </span>
      </div>

      {/* カードグリッド */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <JimuJigyoCard
              key={r.id}
              record={r}
              basePath={basePath}
              budgetYear={year}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-mirai-text-muted">
          <p>条件に一致する事業がありません。</p>
          <Link href={basePath} className="text-primary underline text-sm">
            条件をクリア
          </Link>
        </div>
      )}
    </div>
  );
}

function ListHeader({
  meta,
  total,
}: {
  meta: ReturnType<typeof getYearMeta>;
  basePath: string;
  total: number;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-mirai-text">事務事業評価</h1>
      <p className="text-sm text-mirai-text-secondary mt-1">
        {meta.label}｜{total}事業の見直し状況とKPI・予算・効率を分析します。
      </p>
      <div className="mt-2">
        <Link
          href="/jimu-jigyo/about-score"
          className="text-sm text-primary underline"
        >
          この分析の見方について →
        </Link>
      </div>
      <div className="mt-4 p-3 bg-mirai-surface-warm border border-mirai-border rounded-lg text-xs text-mirai-text-secondary">
        ⚠️
        このページは県の行政評価公表データをもとにした参考分析です。事業の優劣を断定するものではありません。
      </div>
    </div>
  );
}

function SummaryCell({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div>
      <p className="text-2xl font-bold text-mirai-text">{value}</p>
      <p className="text-xs text-mirai-text-muted">{label}</p>
    </div>
  );
}

function Tabs({
  basePath,
  view,
  jimuCount,
  saihyokaCount,
}: {
  basePath: string;
  view: "jimu" | "saihyoka";
  jimuCount: number;
  saihyokaCount: number;
}) {
  const tab = (target: "jimu" | "saihyoka", label: string, count: number) => {
    const active = view === target;
    const href = target === "jimu" ? basePath : `${basePath}?view=saihyoka`;
    return (
      <Link
        href={href}
        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
          active
            ? "border-primary text-mirai-text"
            : "border-transparent text-mirai-text-muted hover:text-mirai-text"
        }`}
      >
        {label}（{count}）
      </Link>
    );
  };
  return (
    <div className="flex gap-2 border-b border-mirai-border">
      {tab("jimu", "事務事業評価", jimuCount)}
      {tab("saihyoka", "公共事業再評価", saihyokaCount)}
    </div>
  );
}
