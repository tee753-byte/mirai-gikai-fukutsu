import type { Database } from "@mirai-gikai/supabase";

type BillInsert = Database["public"]["Tables"]["bills"]["Insert"];
type FactionStanceInsert =
  Database["public"]["Tables"]["faction_stances"]["Insert"];
type TagInsert = Database["public"]["Tables"]["tags"]["Insert"];
type BillsTagsInsert = Database["public"]["Tables"]["bills_tags"]["Insert"];
type CouncilSessionInsert =
  Database["public"]["Tables"]["council_sessions"]["Insert"];
type FactionInsert = Database["public"]["Tables"]["factions"]["Insert"];
type CommitteeInsert = Database["public"]["Tables"]["committees"]["Insert"];
type InterviewConfigInsert =
  Database["public"]["Tables"]["interview_configs"]["Insert"];
type InterviewQuestionInsert =
  Database["public"]["Tables"]["interview_questions"]["Insert"];
type InterviewSessionInsert =
  Database["public"]["Tables"]["interview_sessions"]["Insert"];
type InterviewMessageInsert =
  Database["public"]["Tables"]["interview_messages"]["Insert"];
type InterviewReportInsert =
  Database["public"]["Tables"]["interview_report"]["Insert"];

// 定例会データ（福津市議会）
// 出典: https://www.city.fukutsu.lg.jp/gikai/nittei/index.html
export const councilSessions: CouncilSessionInsert[] = [
  {
    name: "令和8年 6月定例会",
    slug: "r8-6",
    council_url: "https://www.city.fukutsu.lg.jp/gikai/nittei/2_7/19863.html",
    start_date: "2026-06-08",
    end_date: "2026-06-23",
    is_active: true,
  },
  {
    name: "令和8年 4月臨時会",
    slug: "r8-4",
    council_url: "https://www.city.fukutsu.lg.jp/gikai/nittei/2_7/19631.html",
    start_date: "2026-04-24",
    end_date: "2026-04-24",
    is_active: false,
  },
  {
    name: "令和8年 3月定例会",
    slug: "r8-3",
    council_url: "https://www.city.fukutsu.lg.jp/gikai/nittei/2_7/19269.html",
    start_date: "2026-02-27",
    end_date: "2026-03-24",
    is_active: false,
  },
  {
    name: "令和8年 2月臨時会",
    slug: "r8-2",
    council_url: "https://www.city.fukutsu.lg.jp/gikai/nittei/2_7/19232.html",
    start_date: "2026-02-20",
    end_date: "2026-02-20",
    is_active: false,
  },
  {
    name: "令和8年 1月臨時会",
    slug: "r8-1",
    council_url: "https://www.city.fukutsu.lg.jp/gikai/nittei/2_7/18960.html",
    start_date: "2026-01-13",
    end_date: "2026-01-13",
    is_active: false,
  },
  {
    name: "令和7年 12月定例会",
    slug: "r7-12",
    council_url: "https://www.city.fukutsu.lg.jp/gikai/nittei/2_6/18700.html",
    start_date: "2025-11-26",
    end_date: "2025-12-11",
    is_active: false,
  },
  {
    name: "令和7年 9月定例会",
    slug: "r7-9",
    council_url: "https://www.city.fukutsu.lg.jp/gikai/nittei/2_6/18281.html",
    start_date: "2025-09-01",
    end_date: "2025-09-24",
    is_active: false,
  },
  {
    name: "令和7年 6月定例会",
    slug: "r7-6",
    council_url: "https://www.city.fukutsu.lg.jp/gikai/nittei/2_6/17865.html",
    start_date: "2025-06-06",
    end_date: "2025-06-30",
    is_active: false,
  },
];

// 会派データ（福津市議会 2026年7月時点）
// 出典: https://www.city.fukutsu.lg.jp/gikai/kosei/2352.html
// 掲載基準は全会派で統一する（特定の会派・議員を強調しない）
export const factions: FactionInsert[] = [
  {
    name: "mimoza",
    display_name: "ミモザの会",
    sort_order: 1,
    is_active: true,
  },
  {
    name: "komei",
    display_name: "公明党",
    sort_order: 2,
    is_active: true,
  },
  {
    name: "kyosan",
    display_name: "日本共産党",
    sort_order: 3,
    is_active: true,
  },
  {
    name: "shinseikai",
    display_name: "新政会",
    sort_order: 4,
    is_active: true,
  },
  {
    name: "seiwakai",
    display_name: "福津誠和会",
    sort_order: 5,
    is_active: true,
  },
  {
    name: "minna-no-koe",
    display_name: "みんなの声によるみんなの会",
    sort_order: 6,
    is_active: true,
  },
  {
    name: "mushozoku",
    display_name: "無所属",
    sort_order: 7,
    is_active: true,
  },
];

// 委員会データ（福津市議会 常任委員会）
// 出典: https://www.city.fukutsu.lg.jp/gikai/kosei/2351.html
// 議会運営委員会・議会広報調査特別委員会は議案審査を行わないため含めない
export const committees: CommitteeInsert[] = [
  {
    name: "総務文教委員会",
    description:
      "総務部、経営企画部、教育部、会計課、監査事務局などについての審査",
    sort_order: 1,
    is_active: true,
  },
  {
    name: "市民福祉委員会",
    description: "市民生活部、健康福祉部、こども家庭部についての審査",
    sort_order: 2,
    is_active: true,
  },
  {
    name: "建設環境委員会",
    description:
      "市民共働部、経済産業部、都市整備部、農業委員会事務局についての審査",
    sort_order: 3,
    is_active: true,
  },
];

// タグデータ（福津市議会の議案構成に合わせた分類）
// 本番DBの tags テーブルと一致させること（管理画面から追加・改名されることがあるため、
// 定期的に本番の内容と突き合わせて更新する）
export const tags: TagInsert[] = [
  {
    label: "予算・財政",
    description: "予算、決算、税、財産の取得や処分に関する議案",
    featured_priority: 1,
  },
  {
    label: "子育て・教育",
    description: "子育て支援、学童保育、学校教育に関する議案",
    featured_priority: 2,
  },
  {
    label: "まちづくり",
    description: "漁港・道路・公共インフラなど、まちづくりに関する議案",
    featured_priority: 3,
  },
  {
    label: "議会・行政のしくみ",
    description: "議会の制度、職員の給与、行政組織に関する議案",
    featured_priority: 4,
  },
  {
    label: "意見書・決議",
    description: "国や県などに対して議会の意思を伝える意見書・決議",
    featured_priority: 5,
  },
  {
    label: "施設・使用料",
    description: "市有施設の使用料改定に関する議案",
    featured_priority: 6,
  },
  {
    label: "防災",
    description: "防災、災害復旧に関する議案",
    featured_priority: 7,
  },
];

// 議案データ（令和8年6月定例会・全11件）
// 出典: 会期日程表 https://www.city.fukutsu.lg.jp/material/files/group/20/kaikinitteihyo080616.pdf
//       議決結果 https://www.city.fukutsu.lg.jp/material/files/group/20/giketukekka0806.pdf
// いずれも議決年月日は令和8年6月23日（status_noteに記載）。
// published_at は画面上「提出」として表示されるため、議決日ではなく上程日を入れる。
// 議案第47〜52号は初日（6/8）に一括上程。発議第2〜6号は最終日（6/23）に追加議案として上程された。
// ※福津市は議案書そのものを公開していないため、原本リンクは定例会ページ（議決結果PDFを含む）を指す。
const SESSION_R8_6_URL =
  "https://www.city.fukutsu.lg.jp/gikai/nittei/2_7/19863.html";
const SUBMITTED_AT_INITIAL = "2026-06-08T00:00:00+09:00";
const SUBMITTED_AT_ADDITIONAL = "2026-06-23T00:00:00+09:00";
// 注目の議案は「議会の判断が分かれたもの（否決）」で機械的に決める。
// 特定の議員や政策分野を目立たせないため、人が選ぶ運用にはしない（fukutsu/seed-bills-r8-3.ts と同じ方針）。

export const bills: BillInsert[] = [
  {
    name: "令和8年度福津市一般会計補正予算（第1号）について",
    bill_number: "議案第47号",
    bill_type: "bill",
    status: "approved",
    status_note: "本会議で可決（令和8年6月23日）",
    published_at: SUBMITTED_AT_INITIAL,
    publish_status: "published",
    is_featured: false,
    source_url: SESSION_R8_6_URL,
  },
  {
    name: "令和8年度福津市介護保険事業特別会計補正予算（第1号）について",
    bill_number: "議案第48号",
    bill_type: "bill",
    status: "approved",
    status_note: "本会議で可決（令和8年6月23日）",
    published_at: SUBMITTED_AT_INITIAL,
    publish_status: "published",
    is_featured: false,
    source_url: SESSION_R8_6_URL,
  },
  {
    name: "福津市特別職の職員で常勤のものの給与及び旅費に関する条例を改正することについて",
    bill_number: "議案第49号",
    bill_type: "bill",
    status: "rejected",
    status_note: "本会議で否決（令和8年6月23日）",
    published_at: SUBMITTED_AT_INITIAL,
    publish_status: "published",
    is_featured: true,
    source_url: SESSION_R8_6_URL,
  },
  {
    name: "福津市税条例を改正することについて",
    bill_number: "議案第50号",
    bill_type: "bill",
    status: "approved",
    status_note: "本会議で可決（令和8年6月23日）",
    published_at: SUBMITTED_AT_INITIAL,
    publish_status: "published",
    is_featured: false,
    source_url: SESSION_R8_6_URL,
  },
  {
    name: "福津市学童保育所条例を改正することについて",
    bill_number: "議案第51号",
    bill_type: "bill",
    status: "approved",
    status_note: "本会議で可決（令和8年6月23日）",
    published_at: SUBMITTED_AT_INITIAL,
    publish_status: "published",
    is_featured: false,
    source_url: SESSION_R8_6_URL,
  },
  {
    name: "財産の取得について",
    bill_number: "議案第52号",
    bill_type: "bill",
    status: "approved",
    status_note: "本会議で可決（令和8年6月23日）",
    published_at: SUBMITTED_AT_INITIAL,
    publish_status: "published",
    is_featured: false,
    source_url: SESSION_R8_6_URL,
  },
  {
    name: "福津市議会基本条例の制定について",
    bill_number: "発議第2号",
    bill_type: "member_bill",
    status: "approved",
    status_note: "本会議で可決（令和8年6月23日）",
    published_at: SUBMITTED_AT_ADDITIONAL,
    publish_status: "published",
    is_featured: false,
    source_url: SESSION_R8_6_URL,
  },
  {
    name: "福津市議会会議規則を改正することについて",
    bill_number: "発議第3号",
    bill_type: "member_bill",
    status: "approved",
    status_note: "本会議で可決（令和8年6月23日）",
    published_at: SUBMITTED_AT_ADDITIONAL,
    publish_status: "published",
    is_featured: false,
    source_url: SESSION_R8_6_URL,
  },
  {
    name: "非核三原則の堅持を求める意見書の提出について",
    bill_number: "発議第4号",
    bill_type: "opinion",
    status: "approved",
    status_note: "本会議で可決（令和8年6月23日）",
    published_at: SUBMITTED_AT_ADDITIONAL,
    publish_status: "published",
    is_featured: false,
    source_url: SESSION_R8_6_URL,
  },
  {
    name: "ホルムズ海峡情勢の影響から市民生活と地域経済を守るための対策を求める意見書の提出について",
    bill_number: "発議第5号",
    bill_type: "opinion",
    status: "approved",
    status_note: "本会議で可決（令和8年6月23日）",
    published_at: SUBMITTED_AT_ADDITIONAL,
    publish_status: "published",
    is_featured: false,
    source_url: SESSION_R8_6_URL,
  },
  {
    name: "ゆたかな学びの実現・教職員定数改善をはかるための、令和9年度政府予算に係る意見書の提出について",
    bill_number: "発議第6号",
    bill_type: "opinion",
    status: "approved",
    status_note: "本会議で可決（令和8年6月23日）",
    published_at: SUBMITTED_AT_ADDITIONAL,
    publish_status: "published",
    is_featured: false,
    source_url: SESSION_R8_6_URL,
  },
];

// 議案とタグの関連付け
export function createBillsTags(
  insertedBills: { id: string; name: string }[],
  insertedTags: { id: string; label: string }[]
): Omit<BillsTagsInsert, "id" | "created_at">[] {
  const billTagMap: { [billName: string]: string[] } = {
    "令和8年度福津市一般会計補正予算（第1号）について": ["予算・財政"],
    "令和8年度福津市介護保険事業特別会計補正予算（第1号）について": [
      "予算・財政",
      "まちづくり",
    ],
    "福津市特別職の職員で常勤のものの給与及び旅費に関する条例を改正することについて":
      ["議会・行政のしくみ"],
    "福津市税条例を改正することについて": ["予算・財政"],
    "福津市学童保育所条例を改正することについて": ["子育て・教育"],
    "財産の取得について": ["予算・財政"],
    "福津市議会基本条例の制定について": ["議会・行政のしくみ"],
    "福津市議会会議規則を改正することについて": ["議会・行政のしくみ"],
    "非核三原則の堅持を求める意見書の提出について": ["意見書・決議"],
    "ホルムズ海峡情勢の影響から市民生活と地域経済を守るための対策を求める意見書の提出について":
      ["意見書・決議"],
    "ゆたかな学びの実現・教職員定数改善をはかるための、令和9年度政府予算に係る意見書の提出について":
      ["意見書・決議", "子育て・教育"],
  };

  const billsTags: Omit<BillsTagsInsert, "id" | "created_at">[] = [];

  for (const bill of insertedBills) {
    const tagLabels = billTagMap[bill.name] || [];
    for (const tagLabel of tagLabels) {
      const tag = insertedTags.find((t) => t.label === tagLabel);
      if (tag) {
        billsTags.push({
          bill_id: bill.id,
          tag_id: tag.id,
        });
      }
    }
  }

  return billsTags;
}

// 会派見解データ
//
// 福津市議会は議決結果を「可決／否決」のみ公表しており、会派ごとの賛否は公開されていない。
// 推測で賛否を書くことは中立性を損なうため、福津版では会派見解を登録しない。
// （run.ts 側は name が "mirai" の会派が存在するときだけ登録する実装のため、
//   福津版の会派構成では自動的にスキップされる）
const factionStancesData: Omit<
  FactionStanceInsert,
  "bill_id" | "faction_id"
>[] = [];

export function createFactionStances(
  insertedBills: { id: string; name: string }[],
  miraiFactionId: string
): FactionStanceInsert[] {
  return factionStancesData.map((stance, index) => ({
    ...stance,
    bill_id: insertedBills[index]?.id || "",
    faction_id: miraiFactionId,
  }));
}

// インタビュー設定を作成（最初の議案用）
export function createInterviewConfig(
  insertedBills: { id: string; name: string }[]
): Omit<InterviewConfigInsert, "id" | "created_at" | "updated_at"> | null {
  const targetBill = insertedBills[0];
  if (!targetBill) return null;

  return {
    bill_id: targetBill.id,
    name: "デフォルト設定",
    status: "public",
    themes: ["賛否", "理由"],
    knowledge_source: `この議案についてあなたの意見を聞かせてください。`,
  };
}

// インタビュー質問を作成
export function createInterviewQuestions(
  interviewConfigId: string
): Omit<InterviewQuestionInsert, "id" | "created_at" | "updated_at">[] {
  return [
    {
      interview_config_id: interviewConfigId,
      question: "この議案に賛成ですか？反対ですか？",
      follow_up_guide: "ユーザーの立場を明確にしてください。",
      quick_replies: ["賛成", "反対", "どちらでもない"],
      question_order: 1,
    },
    {
      interview_config_id: interviewConfigId,
      question: "その理由を教えてください。",
      follow_up_guide: "具体的な理由を引き出してください。",
      quick_replies: null,
      question_order: 2,
    },
  ];
}

// インタビューセッションを作成（5パターン × 20回 = 100件）
export function createInterviewSessions(
  interviewConfigId: string
): Omit<InterviewSessionInsert, "id" | "created_at" | "updated_at">[] {
  const now = new Date();
  const sessions: Omit<
    InterviewSessionInsert,
    "id" | "created_at" | "updated_at"
  >[] = [];

  // 20回ループして100件作成
  for (let i = 0; i < 20; i++) {
    const baseOffset = i * 86400000 * 3; // 3日ずつずらす

    // パターン1: 完了 + レポートあり（賛成）
    sessions.push({
      interview_config_id: interviewConfigId,
      user_id: `00000000-0000-0000-0000-${String(i * 5 + 1).padStart(12, "0")}`,
      started_at: new Date(
        now.getTime() - baseOffset - 3600000
      ).toISOString(),
      completed_at: new Date(
        now.getTime() - baseOffset - 3000000
      ).toISOString(),
    });

    // パターン2: 完了 + レポートあり（反対）
    sessions.push({
      interview_config_id: interviewConfigId,
      user_id: `00000000-0000-0000-0000-${String(i * 5 + 2).padStart(12, "0")}`,
      started_at: new Date(
        now.getTime() - baseOffset - 7200000
      ).toISOString(),
      completed_at: new Date(
        now.getTime() - baseOffset - 6600000
      ).toISOString(),
    });

    // パターン3: 完了 + レポートあり（中立）
    sessions.push({
      interview_config_id: interviewConfigId,
      user_id: `00000000-0000-0000-0000-${String(i * 5 + 3).padStart(12, "0")}`,
      started_at: new Date(
        now.getTime() - baseOffset - 10800000
      ).toISOString(),
      completed_at: new Date(
        now.getTime() - baseOffset - 10200000
      ).toISOString(),
    });

    // パターン4: 完了したけどレポート未作成
    sessions.push({
      interview_config_id: interviewConfigId,
      user_id: `00000000-0000-0000-0000-${String(i * 5 + 4).padStart(12, "0")}`,
      started_at: new Date(
        now.getTime() - baseOffset - 14400000
      ).toISOString(),
      completed_at: new Date(
        now.getTime() - baseOffset - 13800000
      ).toISOString(),
    });

    // パターン5: 進行中（未完了、レポートなし）
    sessions.push({
      interview_config_id: interviewConfigId,
      user_id: `00000000-0000-0000-0000-${String(i * 5 + 5).padStart(12, "0")}`,
      started_at: new Date(
        now.getTime() - baseOffset - 1800000
      ).toISOString(),
      completed_at: null,
    });
  }

  return sessions;
}

// インタビューメッセージを作成（5パターンをループ）
export function createInterviewMessages(
  sessionIds: string[]
): Omit<InterviewMessageInsert, "id" | "created_at">[] {
  const conversations = [
    // パターン1: 賛成（完了 + レポートあり）
    [
      {
        role: "assistant" as const,
        content: "この議案に賛成ですか？反対ですか？",
      },
      { role: "user" as const, content: "賛成です" },
      {
        role: "assistant" as const,
        content: "その理由を教えてください。",
      },
      {
        role: "user" as const,
        content:
          "なぜなら賛成だからです。市民のためになると思います。",
      },
      {
        role: "assistant" as const,
        content:
          "ありがとうございました。ご意見を承りました。",
      },
    ],
    // パターン2: 反対（完了 + レポートあり）
    [
      {
        role: "assistant" as const,
        content: "この議案に賛成ですか？反対ですか？",
      },
      { role: "user" as const, content: "反対です" },
      {
        role: "assistant" as const,
        content: "その理由を教えてください。",
      },
      {
        role: "user" as const,
        content: "財源が不明確だと思います。",
      },
      {
        role: "assistant" as const,
        content:
          "ありがとうございました。ご意見を承りました。",
      },
    ],
    // パターン3: どちらでもない（完了 + レポートあり）
    [
      {
        role: "assistant" as const,
        content: "この議案に賛成ですか？反対ですか？",
      },
      {
        role: "user" as const,
        content: "どちらでもないです",
      },
      {
        role: "assistant" as const,
        content: "その理由を教えてください。",
      },
      {
        role: "user" as const,
        content: "もっと情報が必要だと思います。",
      },
      {
        role: "assistant" as const,
        content:
          "ありがとうございました。ご意見を承りました。",
      },
    ],
    // パターン4: 完了したけどレポート未作成
    [
      {
        role: "assistant" as const,
        content: "この議案に賛成ですか？反対ですか？",
      },
      { role: "user" as const, content: "賛成です" },
      {
        role: "assistant" as const,
        content: "その理由を教えてください。",
      },
      {
        role: "user" as const,
        content: "良い議案だと思います。",
      },
      {
        role: "assistant" as const,
        content:
          "ありがとうございました。ご意見を承りました。",
      },
    ],
    // パターン5: 進行中（途中で離脱）
    [
      {
        role: "assistant" as const,
        content: "この議案に賛成ですか？反対ですか？",
      },
      {
        role: "user" as const,
        content: "うーん、ちょっと考えさせてください",
      },
    ],
  ];

  const messages: Omit<
    InterviewMessageInsert,
    "id" | "created_at"
  >[] = [];

  sessionIds.forEach((sessionId, sessionIndex) => {
    // 5パターンをループ
    const patternIndex = sessionIndex % 5;
    const conversation = conversations[patternIndex];
    conversation.forEach((msg) => {
      messages.push({
        interview_session_id: sessionId,
        role: msg.role,
        content: msg.content,
      });
    });
  });

  return messages;
}

// インタビューレポートを作成（パターン1,2,3のみ = 5の倍数で0,1,2番目）
export function createInterviewReports(
  sessionIds: string[]
): Omit<
  InterviewReportInsert,
  "id" | "created_at" | "updated_at"
>[] {
  const reportTemplates = [
    {
      stance: "for" as const,
      summary:
        "この議案に賛成。市民のためになると考えている。",
      role: "general_citizen" as const,
      role_description: "議案の内容に賛同する市民",
      opinions: [
        { title: "賛成理由", content: "市民のためになる" },
      ],
    },
    {
      stance: "against" as const,
      summary: "財源の不明確さを理由に反対。",
      role: "work_related" as const,
      role_description: "財政面を懸念する市民",
      opinions: [
        { title: "反対理由", content: "財源が不明確" },
      ],
    },
    {
      stance: "neutral" as const,
      summary:
        "判断するにはより多くの情報が必要と考えている。",
      role: "subject_expert" as const,
      role_description: "慎重な判断を求める市民",
      opinions: [
        { title: "態度保留理由", content: "情報不足" },
      ],
    },
  ];

  const reports: Omit<
    InterviewReportInsert,
    "id" | "created_at" | "updated_at"
  >[] = [];

  // パターン1,2,3（5の倍数で0,1,2番目）のみレポートを作成
  sessionIds.forEach((sessionId, index) => {
    const patternIndex = index % 5;
    if (patternIndex < 3) {
      const loopIndex = Math.floor(index / 5);
      reports.push({
        interview_session_id: sessionId,
        ...reportTemplates[patternIndex],
        is_public_by_user: loopIndex < 5, // 最初の5件は公開
      });
    }
  });

  return reports;
}

// デモ用の固定ID
export const DEMO_SESSION_ID =
  "00000000-0000-0000-0000-000000000001";
export const DEMO_REPORT_ID =
  "00000000-0000-0000-0000-000000000001";

// 4種類のロールを確認するためのデモ用ID
export const DEMO_SESSION_ID_WORK =
  "00000000-0000-0000-0000-000000000002";
export const DEMO_SESSION_ID_DAILY =
  "00000000-0000-0000-0000-000000000003";
export const DEMO_SESSION_ID_CITIZEN =
  "00000000-0000-0000-0000-000000000004";
export const DEMO_REPORT_ID_WORK =
  "00000000-0000-0000-0000-000000000002";
export const DEMO_REPORT_ID_DAILY =
  "00000000-0000-0000-0000-000000000003";
export const DEMO_REPORT_ID_CITIZEN =
  "00000000-0000-0000-0000-000000000004";

// デモ用のインタビューセッション（公開、固定ID）
export function createDemoSession(
  interviewConfigId: string
): InterviewSessionInsert {
  const now = new Date();
  return {
    id: DEMO_SESSION_ID,
    interview_config_id: interviewConfigId,
    user_id: "00000000-0000-0000-0000-000000000000",
    started_at: new Date(now.getTime() - 3600000).toISOString(),
    completed_at: new Date(now.getTime() - 3000000).toISOString(),
  };
}

// デモ用のインタビューメッセージ
export function createDemoMessages(): Omit<
  InterviewMessageInsert,
  "id" | "created_at"
>[] {
  return [
    {
      interview_session_id: DEMO_SESSION_ID,
      role: "assistant",
      content:
        "こんにちは！本日はインタビューにご協力いただきありがとうございます。\n\n福岡市議会で審議されている議案について、市民の皆さまのご意見をお聞かせください。この議案について、どのようにお考えですか？",
    },
    {
      interview_session_id: DEMO_SESSION_ID,
      role: "user",
      content:
        "市政のデジタル化や、ムダの削減を達成して欲しい",
    },
    {
      interview_session_id: DEMO_SESSION_ID,
      role: "assistant",
      content:
        "なるほど。市政のデジタル化を通じて、行政サービスの効率化と市民の利便性向上を期待されているということですね。とても重要な指摘だと思います。\n\n具体的に、福岡市のどのような行政手続きや窓口サービスがデジタル化されると良いとお考えですか？",
    },
    {
      interview_session_id: DEMO_SESSION_ID,
      role: "user",
      content:
        "市役所の窓口手続きのオンライン化や、行政文書のデジタル化が進むと市民にとって便利になると期待しています。",
    },
    {
      interview_session_id: DEMO_SESSION_ID,
      role: "assistant",
      content:
        "ありがとうございました。ご意見を承りました。",
    },
  ];
}

// デモ用のインタビューレポート（固定ID）
export function createDemoReport(): InterviewReportInsert {
  return {
    id: DEMO_REPORT_ID,
    interview_session_id: DEMO_SESSION_ID,
    stance: "neutral",
    summary: "期待と懸念両方がある",
    role: "subject_expert",
    role_description:
      "福岡市在住の会社員\n行政手続きの煩雑さを日常的に感じている",
    opinions: [
      {
        title:
          "市政のデジタル化や、ムダの削減を達成して欲しい",
        content:
          "市役所の窓口手続きのオンライン化や、行政文書のデジタル化が進むと市民にとって便利になると期待している。",
      },
    ],
    is_public_by_user: true,
  };
}

// 追加のデモ用セッション（3種類のロール確認用）
export function createAdditionalDemoSessions(
  interviewConfigId: string
): InterviewSessionInsert[] {
  const now = new Date();
  return [
    {
      id: DEMO_SESSION_ID_WORK,
      interview_config_id: interviewConfigId,
      user_id: "00000000-0000-0000-0000-000000000010",
      started_at: new Date(now.getTime() - 7200000).toISOString(),
      completed_at: new Date(now.getTime() - 6600000).toISOString(),
    },
    {
      id: DEMO_SESSION_ID_DAILY,
      interview_config_id: interviewConfigId,
      user_id: "00000000-0000-0000-0000-000000000011",
      started_at: new Date(now.getTime() - 10800000).toISOString(),
      completed_at: new Date(now.getTime() - 10200000).toISOString(),
    },
    {
      id: DEMO_SESSION_ID_CITIZEN,
      interview_config_id: interviewConfigId,
      user_id: "00000000-0000-0000-0000-000000000012",
      started_at: new Date(now.getTime() - 14400000).toISOString(),
      completed_at: new Date(now.getTime() - 10200000).toISOString(),
    },
  ];
}

// 追加のデモ用メッセージ（3種類のロール確認用）
export function createAdditionalDemoMessages(): Omit<
  InterviewMessageInsert,
  "id" | "created_at"
>[] {
  return [
    // work_related セッション用
    {
      interview_session_id: DEMO_SESSION_ID_WORK,
      role: "assistant",
      content:
        "こんにちは！本日はインタビューにご協力いただきありがとうございます。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_WORK,
      role: "user",
      content:
        "子どもの医療費負担が大きいので、この議案には賛成です。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_WORK,
      role: "assistant",
      content:
        "子育て世帯としてのお立場からのご意見ですね。具体的にどのような影響がありますか？",
    },
    {
      interview_session_id: DEMO_SESSION_ID_WORK,
      role: "user",
      content:
        "共働きで子ども2人を育てていますが、医療費の自己負担が家計を圧迫しています。助成拡充で少しでも負担が減れば助かります。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_WORK,
      role: "assistant",
      content:
        "ありがとうございました。ご意見を承りました。",
    },
    // daily_life_affected セッション用
    {
      interview_session_id: DEMO_SESSION_ID_DAILY,
      role: "assistant",
      content:
        "こんにちは！本日はインタビューにご協力いただきありがとうございます。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_DAILY,
      role: "user",
      content:
        "子どもが小さいので、医療費の負担が軽くなるのは嬉しいです。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_DAILY,
      role: "assistant",
      content:
        "生活への影響が大きいとのことですね。どのような場面で医療費の負担を感じますか？",
    },
    {
      interview_session_id: DEMO_SESSION_ID_DAILY,
      role: "user",
      content:
        "風邪や怪我で小児科にかかることが多く、月に何回も通院することがあります。自己負担が積み重なると大変です。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_DAILY,
      role: "assistant",
      content:
        "ありがとうございました。ご意見を承りました。",
    },
    // general_citizen セッション用
    {
      interview_session_id: DEMO_SESSION_ID_CITIZEN,
      role: "assistant",
      content:
        "こんにちは！本日はインタビューにご協力いただきありがとうございます。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_CITIZEN,
      role: "user",
      content:
        "財源が気になりますが、子育て支援として医療費助成は必要だと思います。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_CITIZEN,
      role: "assistant",
      content:
        "財源と子育て支援のバランスを考えていらっしゃるのですね。どのような点が気になりますか？",
    },
    {
      interview_session_id: DEMO_SESSION_ID_CITIZEN,
      role: "user",
      content:
        "他の行政サービスとのバランスも考えつつ、子育て世帯への支援として医療費助成は拡充すべきだと思います。",
    },
    {
      interview_session_id: DEMO_SESSION_ID_CITIZEN,
      role: "assistant",
      content:
        "ありがとうございました。ご意見を承りました。",
    },
  ];
}

// 追加のデモ用レポート（3種類のロール確認用）
export function createAdditionalDemoReports(): InterviewReportInsert[] {
  return [
    {
      id: DEMO_REPORT_ID_WORK,
      interview_session_id: DEMO_SESSION_ID_WORK,
      stance: "for",
      summary:
        "子育て世帯として医療費負担軽減のため賛成",
      role: "work_related",
      role_description:
        "福岡市在住の共働き世帯\n子ども2人\n医療費の負担を日常的に感じている",
      opinions: [
        {
          title: "子どもの医療費負担が大きい",
          content:
            "共働きで子ども2人を育てているが、医療費の自己負担が家計を圧迫している。助成拡充で負担が減れば助かる。",
        },
      ],
      is_public_by_user: true,
    },
    {
      id: DEMO_REPORT_ID_DAILY,
      interview_session_id: DEMO_SESSION_ID_DAILY,
      stance: "for",
      summary:
        "子育て中の保護者として医療費負担軽減を期待",
      role: "daily_life_affected",
      role_description:
        "福岡市在住の主婦\n小さい子ども2人の子育て中\n医療費の自己負担を日常的に感じている",
      opinions: [
        {
          title: "子どもの医療費負担が大きい",
          content:
            "風邪や怪我で小児科にかかることが多く、月に何回も通院する。自己負担が積み重なると家計に影響が大きい。",
        },
      ],
      is_public_by_user: true,
    },
    {
      id: DEMO_REPORT_ID_CITIZEN,
      interview_session_id: DEMO_SESSION_ID_CITIZEN,
      stance: "neutral",
      summary:
        "財源と子育て支援のバランスを考慮して判断",
      role: "general_citizen",
      role_description:
        "福岡市在住の会社員\n子育て支援に関心あり\n市の財政にも関心がある",
      opinions: [
        {
          title: "財源と子育て支援のバランス",
          content:
            "他の行政サービスとのバランスも考えつつ、子育て世帯への支援として医療費助成は拡充すべきと考える。",
        },
      ],
      is_public_by_user: true,
    },
  ];
}
