import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";
import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { BillTypeBadge } from "@/features/bills/client/components/bill-list/bill-type-badge";
import { CompactBillCard } from "@/features/bills/client/components/bill-list/compact-bill-card";
import { searchBills } from "@/features/bills/server/loaders/search-bills";
import {
  BILL_TYPE_ORDER,
  getBillTypeMeta,
} from "@/features/bills/shared/utils/bill-type";
import { QuestionSearchResultCard } from "@/features/general-questions/server/components/question-search-result-card";
import { searchGeneralQuestions } from "@/features/general-questions/server/loaders/search-general-questions";

export const metadata: Metadata = {
  title: "議会の記録を検索",
  alternates: { canonical: "/search" },
  description:
    "福津市議会に提出された議案・発議・請願と、議員が行った一般質問を、キーワードや会期から探せます。",
};

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** URLのクエリは配列で来ることがあるので、必ず1つの文字列にそろえる */
function toSingle(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

const RESULT_OPTIONS = [
  { value: "", label: "すべて" },
  { value: "passed", label: "可決・採択" },
  { value: "failed", label: "否決・不採択" },
];

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const filters = {
    keyword: toSingle(params.q),
    sessionSlug: toSingle(params.session),
    billType: toSingle(params.type),
    result: toSingle(params.result),
    tag: toSingle(params.tag),
  };

  const difficultyLevel = await getDifficultyLevel();
  const [{ bills, totalCount, sessionOptions, tagOptions }, questionResult] =
    await Promise.all([
      searchBills(filters, difficultyLevel),
      searchGeneralQuestions({
        keyword: filters.keyword,
        sessionSlug: filters.sessionSlug,
      }),
    ]);

  const hasFilter =
    filters.keyword !== "" ||
    filters.sessionSlug !== "" ||
    filters.billType !== "" ||
    filters.result !== "" ||
    filters.tag !== "";

  /*
   * 一般質問は、種別・議決結果・分野といった議案だけの条件が指定されているときは
   * 出さない。議案を絞り込んでいるのに一般質問だけ全件並ぶと結果が読めなくなる。
   */
  const showQuestions =
    filters.billType === "" && filters.result === "" && filters.tag === "";
  const questions = showQuestions ? questionResult.questions : [];

  // キーワードを入れずに開いたときは、議案の一覧だけを出して画面を静かに保つ
  const listQuestions = filters.keyword !== "" ? questions : [];

  // 抜粋のどこが検索に当たったのかを示すために、検索語をそのまま渡す
  const searchKeywords = filters.keyword
    .replace(/　/g, " ")
    .split(" ")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  return (
    <Container className="py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-mirai-text">議会の記録を検索</h1>
        <p className="mt-2 text-sm leading-relaxed text-mirai-text-secondary">
          {siteConfig.councilName}
          に提出された議案・発議・請願と、議員が行った一般質問を探せます。正式名称だけでなく、わかりやすい見出しや要約、会議録のやり取りの中身も検索の対象です。
        </p>
      </div>

      {/*
        JavaScriptが動かない環境でも使えるよう、素のGETフォームにしている。
        検索条件がURLに残るので、結果をそのまま人に共有できる利点もある。
      */}
      <form
        method="get"
        className="rounded-xl border border-border bg-card p-4 sm:p-5"
      >
        <label htmlFor="q" className="block text-sm font-bold text-mirai-text">
          キーワード
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filters.keyword}
            placeholder="例：福間南、いじめ、補正予算"
            className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-mirai-text placeholder:text-mirai-text-placeholder focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90"
          >
            <Search className="h-4 w-4" />
            検索
          </button>
        </div>
        <p className="mt-1.5 text-xs text-mirai-text-muted">
          スペースで区切ると、すべての語を含むものを探します。
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SelectField
            id="session"
            label="議会"
            defaultValue={filters.sessionSlug}
            options={[
              { value: "", label: "すべて" },
              ...sessionOptions.map((s) => ({ value: s.slug, label: s.name })),
            ]}
          />
          <SelectField
            id="type"
            label="種別"
            defaultValue={filters.billType}
            options={[
              { value: "", label: "すべて" },
              ...BILL_TYPE_ORDER.map((key) => ({
                value: key,
                label: getBillTypeMeta(key).label,
              })),
            ]}
          />
          <SelectField
            id="result"
            label="議決結果"
            defaultValue={filters.result}
            options={RESULT_OPTIONS}
          />
          <SelectField
            id="tag"
            label="分野"
            defaultValue={filters.tag}
            options={[
              { value: "", label: "すべて" },
              ...tagOptions.map((t) => ({ value: t, label: t })),
            ]}
          />
        </div>

        {hasFilter && (
          <div className="mt-3">
            <Link
              href="/search"
              className="text-xs font-bold text-primary-accent hover:opacity-70"
            >
              条件をすべて解除する
            </Link>
          </div>
        )}
      </form>

      {/* 種別の凡例。カードに出るバッジそのものを並べて、色と意味を結びつける */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {BILL_TYPE_ORDER.map((key) => (
          <span key={key} className="flex items-center gap-1.5">
            <BillTypeBadge billType={key} />
            <span className="text-xs text-mirai-text-secondary">
              {getBillTypeMeta(key).description}
            </span>
          </span>
        ))}
      </div>

      <p className="mt-6 text-sm text-mirai-text-secondary">
        {hasFilter ? (
          <>
            議案{" "}
            <span className="font-bold text-mirai-text">{bills.length}件</span>
            {filters.keyword !== "" && (
              <>
                {" ／ "}一般質問{" "}
                <span className="font-bold text-mirai-text">
                  {listQuestions.length}件
                </span>
              </>
            )}
            {" が見つかりました"}
          </>
        ) : (
          <>
            掲載中の議案
            <span className="font-bold text-mirai-text">{totalCount}件</span>
            をすべて表示しています。キーワードを入れると一般質問も一緒に探します。
          </>
        )}
      </p>

      {bills.length === 0 && listQuestions.length === 0 ? (
        <div className="mt-6 rounded-lg bg-mirai-surface-grouped px-4 py-8 text-center">
          <p className="text-sm text-mirai-text-secondary">
            条件に合う記録が見つかりませんでした。
          </p>
          <p className="mt-1 text-xs text-mirai-text-muted">
            キーワードを短くするか、絞り込みを外してお試しください。
          </p>
        </div>
      ) : (
        <>
          {bills.length > 0 && (
            <section className="mt-4">
              <h2 className="mb-2 text-sm font-bold text-mirai-text">
                議案・発議・請願（{bills.length}件）
              </h2>
              <ul className="flex flex-col gap-3">
                {bills.map((bill) => (
                  <li key={bill.id}>
                    <Link href={`/bills/${bill.id}`} className="block">
                      <CompactBillCard bill={bill} />
                    </Link>
                    {bill.council_session?.name && (
                      <p className="mt-1 pl-1 text-xs text-mirai-text-muted">
                        {bill.council_session.name}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/*
            議案に出てこない話題が一般質問では議論されていることが多い。
            「東福間」のように議案が0件でも一般質問が複数ある語があるため、
            議案が見つからなくても必ずこちらを出す
          */}
          {listQuestions.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-2 text-sm font-bold text-mirai-text">
                一般質問（{listQuestions.length}件）
              </h2>
              <ul className="flex flex-col gap-3">
                {listQuestions.map((question) => (
                  <li key={question.id}>
                    <QuestionSearchResultCard
                      question={question}
                      keywords={searchKeywords}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </Container>
  );
}

function SelectField({
  id,
  label,
  defaultValue,
  options,
}: {
  id: string;
  label: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-mirai-text">
        {label}
      </label>
      <select
        id={id}
        name={id}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-mirai-text focus:border-primary focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
