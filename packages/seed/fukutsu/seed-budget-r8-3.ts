import type { AdminClient } from "../shared/helper";

/**
 * 令和8年度予算（主要事業）のデータ。
 *
 * 出典: 福津市 令和8年度 主要事業の概要（P.4〜40）
 *   https://www.city.fukutsu.lg.jp/material/files/group/13/R8_syuyoujigyounogaiyou.pdf
 *
 * 原本に載っている37事業をすべて掲載する。原本の目次と同じ4グループに分け、
 * 事業ごとの「テーマ別目標像」をまちづくり基本構想のタグとして付けている。
 * （目次の番号1〜40は事業の通し番号ではなくページ番号。事業数は37件）
 *
 * 【金額】原本の「前年度予算額」「本年度予算額」欄の数値を千円単位でそのまま転記。
 * 転記の妥当性は、災害復旧関連4事業の合計（421,935千円）が予算書の
 * 「災害復旧費」423,410千円とほぼ一致することで確認している。
 *
 * 【説明文】原本の「事業の目的・背景」「事業の内容」をもとにAIが要約したもの。
 * 評価や解釈は加えず、書かれている事実だけを抜き出している。
 */

export const BUDGET_R8_3_SOURCE_URL =
  "https://www.city.fukutsu.lg.jp/material/files/group/13/R8_syuyoujigyounogaiyou.pdf";

/** まちづくり基本構想の「テーマ別目標像」。原本の表記に合わせる */
const T = {
  kyoiku: "共育：誰もが「未来の創り手」として育つまち",
  chiikiJichi: "地域自治：人がつながり活躍する共助のまち",
  anzen: "安全安心：安全・安心・快適に住み続けられるまち",
  kankyo: "環境保全：自然・歴史・景観などの資源が守られ生かされるまち",
  sangyo: "地域産業：地域の産業が経済を支えるまち",
  kanko: "観光振興：福津の魅力を生かした持続可能な観光のまち",
  keikaku: "計画推進：まちづくり計画推進にあたっての基本的な考え方",
} as const;

type SeedInitiative = {
  title: string;
  /** 本年度（令和8年度）予算額。千円単位 */
  budgetAmount: number;
  /** 前年度（令和7年度）予算額。千円単位 */
  prevBudgetAmount: number;
  basicPlanTheme: string;
  description: string;
  /** 出典PDFの該当ページ */
  sourcePage: number;
};

type SeedTheme = {
  title: string;
  initiatives: SeedInitiative[];
};

/** 原本の目次と同じ4グループ */
const BUDGET_THEMES: SeedTheme[] = [
  {
    title: "1．災害に強く、安心して暮らせるまちづくり",
    initiatives: [
      {
        title: "災害救助事業",
        budgetAmount: 1913,
        prevBudgetAmount: 569,
        basicPlanTheme: T.anzen,
        description:
          "住居を失った被災者に、災害救助法にもとづく応急仮設住宅（賃貸型）を提供する事業。令和6年の台風第10号や令和7年8月の豪雨による被災世帯3世帯が対象で、家賃や共益費などの契約に不可欠な費用を負担する。救助期間は最長2年。",
        sourcePage: 4,
      },
      {
        title: "消防自動車購入事業",
        budgetAmount: 24030,
        prevBudgetAmount: 22880,
        basicPlanTheme: T.anzen,
        description:
          "市内11分団に配備する計20台の消防自動車を、概ね1年に1台のペースで更新する事業。2017年の法改正で普通免許保持者が運転できない大型車両が出てきたため、全団員が運転できる3.5トン未満の車両への切り替えを進めている。令和8年度は第2分団の車両1台を更新する。",
        sourcePage: 5,
      },
      {
        title: "地区防災マップ作成事業",
        budgetAmount: 3165,
        prevBudgetAmount: 0,
        basicPlanTheme: T.anzen,
        description:
          "地域ごとの地区防災マップ・地区防災計画が未整備な状況を受け、郷づくり協議会や自治会単位で順次作成する事業。住民参加のグループワークやまちあるきで自然災害リスクを把握し、専門家の意見も反映する。令和8年度はまず宮司地域で作成する。",
        sourcePage: 6,
      },
      {
        title: "防災事業",
        budgetAmount: 599,
        prevBudgetAmount: 3133,
        basicPlanTheme: T.anzen,
        description:
          "防災計画・マニュアルの整備、防災啓発研修や災害訓練、備蓄品購入などを行う事業。地域防災推進委員への講座を2回、市職員向け防災研修を1回実施するほか、防災行政無線の内容を電話で聞けるテレフォンサービスや、防災情報サイト「防災すまっぽん」を運営する。",
        sourcePage: 7,
      },
      {
        title: "自主防災用機械器具設備購入補助事業",
        budgetAmount: 889,
        prevBudgetAmount: 576,
        basicPlanTheme: T.anzen,
        description:
          "自治会が所有する有線・無線放送などの消防施設の新設・更新費用の一部を補助する事業（放送施設は20%以内、消防機器・資機材は70%以内）。令和8年度は要望のあった津丸区・生家区・福間松原区の3地域を対象に実施する。",
        sourcePage: 8,
      },
      {
        title: "市営住宅災害復旧事業",
        budgetAmount: 25000,
        prevBudgetAmount: 0,
        basicPlanTheme: T.keikaku,
        description:
          "令和7年8月の大雨で崩落した五反田市営住宅の法面（幅約60m、高さ約6〜2m）を復旧し、倒壊したフェンス（延長約50m）を設置し直す事業。法面には土留めがなく、高低差が最大6m程度あるため転落の危険が生じていた。再発防止としてブロック積みによる土留めを行う。",
        sourcePage: 9,
      },
      {
        title: "農村地域防災減災事業",
        budgetAmount: 26175,
        prevBudgetAmount: 5060,
        basicPlanTheme: T.anzen,
        description:
          "市内93か所の農業用防災重点ため池について、劣化状況調査・耐震診断調査を行い、防災工事の必要性を判断する事業。多くは江戸時代以前の築造で100年以上が経過し、漏水やひび割れが進行している。令和8年度は劣化状況調査9か所と耐震診断調査3か所を実施し、令和8年度末までに劣化状況調査63/93、耐震診断調査15/93を完了する予定。",
        sourcePage: 10,
      },
      {
        title: "県営水利施設整備負担事業",
        budgetAmount: 4257,
        prevBudgetAmount: 0,
        basicPlanTheme: T.anzen,
        description:
          "津屋崎地区・勝浦地区の排水機場の改修・更新を福岡県が行うにあたり、市が事業費の25%を負担する事業。両地区は農地が海の満潮水面より低く、雨水を強制排水しなければ冠水被害が出る。施設は整備後約45年が経過し経年劣化による不具合が出ている。令和8年度は県が測量設計業務を実施する。",
        sourcePage: 11,
      },
      {
        title: "県営ため池整備負担事業",
        budgetAmount: 38561,
        prevBudgetAmount: 38558,
        basicPlanTheme: T.sangyo,
        description:
          "調査で工事が必要と判断された農業用ため池について、福岡県が行う防災工事（老朽化・地震・豪雨対策）の費用を市が一部負担する事業。令和8年度は尻長下・広光ため池と奥野ため池の2地区3ため池が対象。市の負担割合は計画概要書作成費50%、事業採択後の事業費20%（緊急を要すると国・県が認めた場合は15%）。",
        sourcePage: 12,
      },
      {
        title: "農業用施設災害復旧事業",
        budgetAmount: 24954,
        prevBudgetAmount: 2023,
        basicPlanTheme: T.sangyo,
        description:
          "自然災害で被災した農業用施設を、その後の営農や市民生活に支障が出ないよう復旧する事業。令和7年8月の豪雨災害の復旧が続いており、令和8年度の営農への影響を軽減するため早期復旧を進める。国の災害復旧事業認定を得た農業用ため池は実施設計業務を進め、早期の工事着手を目指す。",
        sourcePage: 13,
      },
      {
        title: "道路橋梁災害復旧事業",
        budgetAmount: 197249,
        prevBudgetAmount: 2547,
        basicPlanTheme: T.anzen,
        description:
          "令和7年8月の大雨で被災した道路・橋梁を復旧する事業。単に元に戻すのではなく、コンクリート積擁壁を新たに設置するなど再度の災害を防ぐ工法を用いる。山手線、導本下・大石線、本木・古賀市線、本木川1号橋のほか、市道等4路線の復旧工事と、市道1路線の設計業務を行う。",
        sourcePage: 14,
      },
      {
        title: "河川災害復旧事業",
        budgetAmount: 174732,
        prevBudgetAmount: 1047,
        basicPlanTheme: T.anzen,
        description:
          "令和7年8月の大雨で被災した河川を復旧する事業。道路橋梁と同じく、コンクリート積擁壁の設置など再度の災害を防ぐ工法を用いる。奴山川・須多田川・在自川・桜川の復旧工事を行う。",
        sourcePage: 15,
      },
      {
        title: "雨水浸水対策事業",
        budgetAmount: 71400,
        prevBudgetAmount: 9785,
        basicPlanTheme: T.anzen,
        description:
          "下水道による浸水対策の計画を段階的に立てる事業。雨水総合管理計画で定めた浸水対策実施区域を対象に、ハード面の対策と、ハード・ソフトを組み合わせた対策を検討し、財政計画を立案する。あわせて既存の雨水排水施設の情報を下水道台帳に反映し、内水ハザードマップを増刷する。",
        sourcePage: 16,
      },
    ],
  },
  {
    title: "2．次世代を育む教育環境の整備",
    initiatives: [
      {
        title: "新設小学校道路整備事業",
        budgetAmount: 96000,
        prevBudgetAmount: 21000,
        basicPlanTheme: T.anzen,
        description:
          "宮司小学校（仮称）への通学路の安全性を高め、防災拠点としてのアクセス性を確保する事業。三辻川5号橋の架替工事と、宮司50号線の道路拡幅を行う。令和8年度は宮司50号線の拡幅設計業務・用地鑑定業務と、三辻川5号橋の架替工事を実施する。",
        sourcePage: 17,
      },
      {
        title: "新設小学校環境整備事業（備品・消耗品調達）",
        budgetAmount: 173838,
        prevBudgetAmount: 0,
        basicPlanTheme: T.kyoiku,
        description:
          "宮司小学校（仮称）の令和9年4月開校に向けて、必要な備品等を順次発注・購入・搬入する事業。福間小学校・津屋崎小学校・福間中学校の過大規模を緩和するため宮司地区に新設する小学校の、開校準備の一環。",
        sourcePage: 18,
      },
      {
        title: "新設小学校ＩＣＴ環境整備事業",
        budgetAmount: 43407,
        prevBudgetAmount: 0,
        basicPlanTheme: T.kyoiku,
        description:
          "宮司小学校（仮称）の令和9年4月開校に向けて、校内学習LANと液晶プロジェクター等のICT機器を整備する事業。国のGIGAスクール構想にもとづき、児童の情報活用能力を育成する学習環境を整える。整備後の保守も含む。",
        sourcePage: 19,
      },
      {
        title: "学校教育施設長寿命化計画策定事業",
        budgetAmount: 9281,
        prevBudgetAmount: 0,
        basicPlanTheme: T.kyoiku,
        description:
          "老朽化が進む学校施設全体について、長期的な整備計画を策定する事業。市内には昭和40年代から50年代に建設された建物が含まれる。令和2年3月の「福津市学校施設等長寿命化計画」をもとに、今後の児童生徒数の推移を見据えた大規模改修・改築・減築の必要性を検討し、学習環境の確保と財政負担の平準化を図る。",
        sourcePage: 20,
      },
      {
        title: "福間小学校整備改修事業",
        budgetAmount: 99438,
        prevBudgetAmount: 108478,
        basicPlanTheme: T.kyoiku,
        description:
          "福間小学校の児童数増加による教室不足に対応するため設置した仮設校舎の賃借料を支払う事業。仮設校舎は鉄骨造2階建・延床面積1,408.84㎡（普通教室7教室ほか）で、契約期間は令和5年10月1日から令和9年3月31日まで。宮司小学校（仮称）開校後の令和9年4月以降に解体・撤去する。",
        sourcePage: 21,
      },
      {
        title: "福間南小学校整備改修事業",
        budgetAmount: 78639,
        prevBudgetAmount: 27698,
        basicPlanTheme: T.kyoiku,
        description:
          "過大規模校である福間南小学校のリース校舎（鉄骨造2階建・延床面積346.06㎡、普通教室4教室）の賃借料を支払うとともに、家庭科室を設置し、校舎中央棟・南棟の8か所に残る和式トイレを洋式化する事業。教室不足への対応で家庭科室が失われ、校内で調理実習ができない状態になっていた。リース校舎は令和10年3月末の契約期間終了後、市に無償譲渡される。",
        sourcePage: 22,
      },
      {
        title: "津屋崎中学校整備改修事業",
        budgetAmount: 476657,
        prevBudgetAmount: 49984,
        basicPlanTheme: T.kyoiku,
        description:
          "宮司小学校（仮称）の卒業生の進学先となる津屋崎中学校で、生徒数の大幅な増加と国が進める中学校35人学級制に対応するため校舎を増築する事業。第一期増築工事（鉄骨造3階建・延床面積約2,200㎡、普通教室10教室ほか）を令和8〜9年度の2か年で行い、第二期（同2階建・約1,400㎡、普通教室8教室ほか）を令和10〜11年度に行う予定。既存校舎の改修も併せて実施する。",
        sourcePage: 23,
      },
      {
        title: "新設小学校建設事業",
        budgetAmount: 3644531,
        prevBudgetAmount: 1807975,
        basicPlanTheme: T.kyoiku,
        description:
          "福間小学校・津屋崎小学校の過大規模を緩和するため、宮司地区に小学校を新設する事業。敷地約29,000㎡に、鉄筋コンクリート造一部鉄骨造3階建・延床面積約9,600㎡（校舎約8,300㎡、体育館約1,300㎡）を整備し、普通教室24教室・特別支援教室10教室ほかを設ける。令和8年度に造成工事と建設工事を完成させ、令和9年4月に開校する予定。",
        sourcePage: 24,
      },
      {
        title: "新設小学校開校準備事業",
        budgetAmount: 3877,
        prevBudgetAmount: 828,
        basicPlanTheme: T.kyoiku,
        description:
          "宮司小学校（仮称）の開校準備を進める事業。保護者・地域の代表者・学校教職員・学識経験者で構成する「新設小学校開校準備委員会」を6回開催し、校章・校歌などを検討する。あわせて、慣れ親しんだ学校を離れる児童の精神的な負担を軽減するため、児童の親睦を深める交流会等も行う。",
        sourcePage: 25,
      },
    ],
  },
  {
    title: "3．人も企業も行政も「稼ぐ」まちづくり",
    initiatives: [
      {
        title: "企業版ふるさとづくり寄附金促進事業",
        budgetAmount: 2200,
        prevBudgetAmount: 1000,
        basicPlanTheme: T.keikaku,
        description:
          "企業版ふるさと納税による寄附を集める事業。令和7年度から委託業者によるマッチング支援を実施しており、令和8年度は支援を拡大して目標額を1,000万円に設定する。市公式ホームページ等での地方創生事業のPRも継続し、これまで寄附した企業や市に縁のある企業に働きかける。",
        sourcePage: 26,
      },
      {
        title: "創業支援事業",
        budgetAmount: 3250,
        prevBudgetAmount: 3000,
        basicPlanTheme: T.sangyo,
        description:
          "福津市商工会の個別相談支援を修了した人が市内で創業する場合に、事業所賃料・改装費・広告費・機械設備等の経費を補助する事業（補助率1/2、上限20万円）。あわせて、創業を目指す人と既に創業した人・支援機関・専門家が意見交換する「創業サロン」を実施する。交付を受けた人は市商工会に加入し、継続して経営支援を受ける。",
        sourcePage: 27,
      },
      {
        title: "商工会補助事業",
        budgetAmount: 21348,
        prevBudgetAmount: 17348,
        basicPlanTheme: T.sangyo,
        description:
          "中小企業支援団体である福津市商工会に補助を行う事業。商工会の組織機能・情報化・総合振興対策等に要する経費の一部を補助する。あわせて、原油価格高騰や物価上昇の影響を受ける事業者への支援として、プレミアム付き商品券の発行費用を補助する（令和8年度は販売額1億円・発行額1億2,000万円、プレミアム率20%。令和7年度は販売額7,000万円・発行額8,400万円）。",
        sourcePage: 28,
      },
      {
        title: "共働のふるさとづくり寄附金促進事業",
        budgetAmount: 140773,
        prevBudgetAmount: 168441,
        basicPlanTheme: T.keikaku,
        description:
          "ふるさと納税の寄附を募り、返礼品として寄附額の3割以内の地場産品を提供する事業。令和5年度の制度改正により寄附獲得が難しくなっており、寄附額は令和4年度の約6億4,673万円から令和6年度は約2億4,947万円まで減少している。令和8年度は2億5,000万円を想定し、業務委託内容を見直して返礼品の拡充・サイトの充実・広告PRを包括的に行う。",
        sourcePage: 29,
      },
    ],
  },
  {
    title: "4．その他",
    initiatives: [
      {
        title: "こども誰でも通園制度実施事業",
        budgetAmount: 19448,
        prevBudgetAmount: 0,
        basicPlanTheme: T.kyoiku,
        description:
          "保育所等を利用していない生後6か月〜満3歳未満の児童を、就労要件を問わず月10時間以内で預けられるようにする国の制度を実施する事業。市では保育所の待機児童が多く私立保育所での実施が難しいため、公立の大和保育所が基幹保育所として先行実施し、会計年度任用職員1名を配置する。私立保育所での実施（広域利用を含む）には委託料を支払う。",
        sourcePage: 30,
      },
      {
        title: "学童保育所整備事業",
        budgetAmount: 206581,
        prevBudgetAmount: 14360,
        basicPlanTheme: T.kyoiku,
        description:
          "宮司小学校（仮称）の令和9年4月開校に合わせ、学校敷地内に学童保育所を新設する事業。軽量鉄骨造2階建・延床面積350.64㎡で、定員35人×4支援単位（受入総数140人）。令和8年6月頃に着工し、令和9年2月末竣工、同年4月1日開所の予定。",
        sourcePage: 31,
      },
      {
        title: "津屋崎地区観光施設整備事業",
        budgetAmount: 584,
        prevBudgetAmount: 766,
        basicPlanTheme: T.kanko,
        description:
          "市が令和2年12月に取得した旧魚正（旅館業を営んでいた建物・土地）を、民間事業者へ条件付きで有償譲渡する準備を進める事業。建物は築40年以上で大規模改修が必要なため、市が改修して使うのは現実的でないと判断した。令和8年度は不動産鑑定評価を行って譲渡価格を検討し、サウンディングを通じて「観光に資する利活用」の譲渡条件を検討する。",
        sourcePage: 32,
      },
      {
        title: "東福間駅周辺地域団地再生事業",
        budgetAmount: 404716,
        prevBudgetAmount: 43512,
        basicPlanTheme: T.anzen,
        description:
          "東福間駅周辺を地域拠点として整備する事業。平成28年に市議会が採択した請願と、令和2年策定の「東福間駅周辺地域にぎわい再生計画」にもとづく。令和7年度から続く東福間口駅前広場の工事を継続し、令和8年度は若木台口駅前広場と東福間第1公園の工事に着手する。東福間第1公園はインクルーシブな公園づくりを目指す。",
        sourcePage: 33,
      },
      {
        title: "立地適正化計画策定事業",
        budgetAmount: 13953,
        prevBudgetAmount: 0,
        basicPlanTheme: T.anzen,
        description:
          "将来の人口減少を見据え、居住や都市機能の誘導によるコンパクトなまちづくりを進めるための計画を策定する事業。令和9年度末で期間が終わる「第2次福津市都市計画マスタープラン」の改訂と並行し、令和8〜9年度の2か年で策定する。令和8年度は現状分析・市民アンケート・地区別意見交換会・災害リスク分析などを行い、基本方針をとりまとめる。",
        sourcePage: 34,
      },
      {
        title: "共働推進事業",
        budgetAmount: 357,
        prevBudgetAmount: 281,
        basicPlanTheme: T.chiikiJichi,
        description:
          "郷づくり推進協議会を主体とする地域自治を支援する事業。平成19年度に始まった郷づくりの取り組みでは、担い手の循環が進まず活動者の固定化・高齢化が課題になっている。令和8年度は共働推進会議を4回開催して郷づくり推進条例（仮称）の制定等を審議し、人財育成や収益事業の導入に向けた講座等を6回開催する。",
        sourcePage: 35,
      },
      {
        title: "環境基本計画策定事業",
        budgetAmount: 473,
        prevBudgetAmount: 12287,
        basicPlanTheme: T.kankyo,
        description:
          "令和8年度で計画期間が終わる第2次福津市環境基本計画（生物多様性ふくつプランを含む）の次期計画を策定する事業。令和7〜8年度の2か年で第3次計画を策定する。環境審議会を1回、環境基本計画策定委員会を3回開催し、第2次計画の点検・評価を行いながら素案を作り、パブリックコメントを経て年度末の策定を目指す。",
        sourcePage: 36,
      },
      {
        title: "こども未来プロジェクト（福津未来文庫事業）",
        budgetAmount: 1150,
        prevBudgetAmount: 0,
        basicPlanTheme: T.kyoiku,
        description:
          "市長給与の10%削減により捻出される財源を活用し、児童・生徒向けの図書を通常の配当に加えて調達する事業。調達した図書は「福津未来文庫」として、他の図書と識別できる形で各校の図書室に設置する。3年間で全校に行き渡らせる計画で、令和8年度は福間小・福間南小・津屋崎小・福間中が対象。",
        sourcePage: 37,
      },
      {
        title: "小学校給食費負担軽減事業",
        budgetAmount: 286000,
        prevBudgetAmount: 0,
        basicPlanTheme: T.kyoiku,
        description:
          "保護者が負担している小学校の給食費（食材費）を市が補助する事業。令和8年4月から県を通じて配分される給食費負担軽減交付金（仮称）の創設を受けて実施する。補助基準額は「5月1日時点の在籍児童数×5,200円×11月」。",
        sourcePage: 38,
      },
      {
        title: "こども未来プロジェクト（TEENチャレンジプロジェクト事業）",
        budgetAmount: 104,
        prevBudgetAmount: 0,
        basicPlanTheme: T.kyoiku,
        description:
          "市長給与の10%削減により捻出される財源を活用し、福津市で育った子どもたちが市に貢献する事業やイベントを生み出す場づくりと後方支援を行う事業。3年計画で、令和8年度は市出身の高校生等によるプロジェクト実行委員会を設置し、内容を構想・検討する。",
        sourcePage: 39,
      },
      {
        title: "教育総合計画策定事業",
        budgetAmount: 825,
        prevBudgetAmount: 4073,
        basicPlanTheme: T.kyoiku,
        description:
          "教育基本法第17条第2項にもとづき、市が目指す教育の姿と取り組むべき施策をまとめる計画を策定する事業。「第2期福津市教育総合計画」は令和8年度が最終年度にあたる。中学生・高校生・教職員・地域住民が参加するワークショップで出た意見を踏まえ、教育懇話会での審議を経て令和8年度末までに次期計画を策定する。",
        sourcePage: 40,
      },
    ],
  },
];

export async function seedBudgetR8_3(
  supabase: AdminClient,
  councilSessionId: string
): Promise<{
  overviewCount: number;
  themeCount: number;
  initiativeCount: number;
}> {
  const initiativeTotal = BUDGET_THEMES.reduce(
    (sum, t) => sum + t.initiatives.length,
    0
  );

  const { data: overview, error: overviewError } = await supabase
    .from("budget_overviews")
    .insert({
      council_session_id: councilSessionId,
      department_name: "令和8年度 主要事業",
      department_slug: "shuyo-jigyo",
      direction: `令和8年度「主要事業の概要」に掲載されている${initiativeTotal}事業をすべて掲載しています。分類は原本の目次にそろえ、事業ごとのタグはまちづくり基本構想の「テーマ別目標像」です（説明文はAIが原文をもとに要約。詳細は原本PDFでご確認ください）。`,
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

  let initiativeCount = 0;

  for (const [themeIndex, seedTheme] of BUDGET_THEMES.entries()) {
    const { data: theme, error: themeError } = await supabase
      .from("budget_themes")
      .insert({
        overview_id: overview.id,
        title: seedTheme.title,
        sort_order: themeIndex,
      })
      .select("id")
      .single();

    if (themeError || !theme) {
      throw new Error(`Failed to insert budget theme: ${themeError?.message}`);
    }

    const { data: initiatives, error: initiativesError } = await supabase
      .from("budget_initiatives")
      .insert(
        seedTheme.initiatives.map((initiative, index) => ({
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

    initiativeCount += initiatives?.length ?? 0;
  }

  return {
    overviewCount: 1,
    themeCount: BUDGET_THEMES.length,
    initiativeCount,
  };
}
