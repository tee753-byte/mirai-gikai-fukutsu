import type { AdminClient } from "../shared/helper";

/**
 * 令和8年度予算（主要事業）のプロトタイプ用データ。
 *
 * 出典: 福津市 令和8年度 主要事業の概要
 *   https://www.city.fukutsu.lg.jp/material/files/group/13/R8_syuyoujigyounogaiyou.pdf
 *   （目次の「1. 災害に強く、安心して暮らせるまちづくり」グループ、P.4〜8の5事業）
 *
 * 全40事業のうち、まず数件で通しで動かす方針にもとづき5件のみ掲載する。
 * 事業費（前年度・本年度）は原本の「事業費の内訳」表の数値（千円単位）をそのまま転記。
 * 「事業の目的・背景」「事業の内容」の説明文は、原文をもとにAIが要約したもの
 * （評価や解釈は加えず、事実のみを抜き出している）。
 */

export const BUDGET_R8_3_SOURCE_URL =
  "https://www.city.fukutsu.lg.jp/material/files/group/13/R8_syuyoujigyounogaiyou.pdf";

type SeedInitiative = {
  title: string;
  /** 千円単位（原本の「事業費の内訳」表と同じ単位） */
  budgetAmount: number;
  basicPlanTheme: string;
  description: string;
  /** 出典PDFの該当ページ */
  sourcePage: number;
};

const DISASTER_PREVENTION_INITIATIVES: SeedInitiative[] = [
  {
    title: "災害救助事業",
    budgetAmount: 1913,
    basicPlanTheme: "安全安心：安全・安心・快適に住み続けられるまち",
    description:
      "住居を失った被災者に、災害救助法にもとづく応急仮設住宅（賃貸型）を提供する事業。令和6年の台風第10号や令和7年8月の豪雨による被災世帯3世帯が対象で、家賃や共益費などの契約に不可欠な費用を負担する。救助期間は最長2年。",
    sourcePage: 4,
  },
  {
    title: "消防自動車購入事業",
    budgetAmount: 24030,
    basicPlanTheme: "安全安心：安全・安心・快適に住み続けられるまち",
    description:
      "市内11分団に配備する計20台の消防自動車を、概ね1年に1台のペースで更新する事業。2017年の法改正で普通免許保持者が運転できない大型車両が出てきたため、全団員が運転できる3.5トン未満の車両への切り替えを進めている。令和8年度は第2分団の車両1台を更新する。",
    sourcePage: 5,
  },
  {
    title: "地区防災マップ作成事業",
    budgetAmount: 3165,
    basicPlanTheme: "安全安心：安全・安心・快適に住み続けられるまち",
    description:
      "地域ごとの地区防災マップ・地区防災計画が未整備な状況を受け、郷づくり協議会や自治会単位で順次作成する事業。住民参加のグループワークやまちあるきで自然災害リスクを把握し、専門家の意見も反映する。令和8年度はまず宮司地域で作成する。",
    sourcePage: 6,
  },
  {
    title: "防災事業",
    budgetAmount: 599,
    basicPlanTheme: "安全安心：安全・安心・快適に住み続けられるまち",
    description:
      "防災計画・マニュアルの整備、防災啓発研修や災害訓練、備蓄品購入などを行う事業。地域防災推進委員への講座を2回、市職員向け防災研修を1回実施するほか、防災行政無線の内容を電話で聞けるテレフォンサービスや、防災情報サイト「防災すまっぽん」を運営する。",
    sourcePage: 7,
  },
  {
    title: "自主防災用機械器具設備購入補助事業",
    budgetAmount: 889,
    basicPlanTheme: "安全安心：安全・安心・快適に住み続けられるまち",
    description:
      "自治会が所有する有線・無線放送などの消防施設の新設・更新費用の一部を補助する事業（放送施設は20%以内、消防機器・資機材は70%以内）。令和8年度は要望のあった津丸区・生家区・福間松原区の3地域を対象に実施する。",
    sourcePage: 8,
  },
];

export async function seedBudgetR8_3(
  supabase: AdminClient,
  councilSessionId: string
): Promise<{ overviewCount: number; themeCount: number; initiativeCount: number }> {
  const { data: overview, error: overviewError } = await supabase
    .from("budget_overviews")
    .insert({
      council_session_id: councilSessionId,
      department_name: "令和8年度 主要事業",
      department_slug: "shuyo-jigyo",
      direction:
        "令和8年度「主要事業の概要」に掲載されている40事業のうち、防災関連の5事業をプロトタイプとして掲載しています（説明文はAIが原文をもとに要約。詳細は原本PDFでご確認ください）。",
      total_budget: 33625791,
      source_url: BUDGET_R8_3_SOURCE_URL,
      publish_status: "published",
      sort_order: 0,
    })
    .select("id")
    .single();

  if (overviewError || !overview) {
    throw new Error(
      `Failed to insert budget overview: ${overviewError?.message}`
    );
  }

  const { data: theme, error: themeError } = await supabase
    .from("budget_themes")
    .insert({
      overview_id: overview.id,
      title: "災害に強く、安心して暮らせるまちづくり",
      sort_order: 0,
    })
    .select("id")
    .single();

  if (themeError || !theme) {
    throw new Error(`Failed to insert budget theme: ${themeError?.message}`);
  }

  const { data: initiatives, error: initiativesError } = await supabase
    .from("budget_initiatives")
    .insert(
      DISASTER_PREVENTION_INITIATIVES.map((initiative, index) => ({
        theme_id: theme.id,
        title: initiative.title,
        budget_amount: initiative.budgetAmount,
        basic_plan_theme: initiative.basicPlanTheme,
        description: initiative.description,
        sort_order: index,
      }))
    )
    .select("id");

  if (initiativesError) {
    throw new Error(
      `Failed to insert budget initiatives: ${initiativesError.message}`
    );
  }

  return {
    overviewCount: 1,
    themeCount: 1,
    initiativeCount: initiatives?.length ?? 0,
  };
}
