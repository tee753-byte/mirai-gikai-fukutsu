/**
 * 令和5年3月〜令和7年3月（9回の定例会）の登壇記録と、
 * 既に投入済みの定例会（令和7年6月〜令和8年6月）の録画リンク。
 *
 * 出どころ: 福津市議会「議員名から選ぶ」ページの、議員ごとの録画一覧
 * （https://www.city.fukutsu.lg.jp/gikai/koho/ 配下、17名ぶん）。
 * 2026年9月に全ページを確認して書き出した。
 *
 * 【qType の決め方】
 * 市の録画ファイル名自体に「一般質問」「総括質疑」の区別が入っている
 * （例: 令和8年第3回定例会080309総括質疑01尾島武弘議員.mp4）。推測せず、
 * このファイル名の表記をそのまま使っている。
 *
 * 【1人1セッション1行にしている理由】
 * 同じ日に複数の質問事項を通告している議員も多いが、録画は1本の動画に
 * まとまっており、星取表・録画リンクのどちらにも複数行は要らない。
 * 代表として、そのセッションでリンクが確認できた最初の行を採用した。
 *
 * 【対象外】
 * 高山賢二議員（議長）… 議長在任中は一般質問・総括質疑を行わないため対象外。
 * 福井崇郎氏（現市長）… 市議時代の記録は本ファイルの対象外
 *   （在任期間中の登壇記録は別途 FORMER_COUNCIL_MEMBERS 側の課題として残っている。
 *   [[fukutsu-attendance-matrix]] 参照）。
 */

/** 令和8年9月定例会の録画一覧ページ（福津市議会）。9月1日分の個別録画の代わりに使う */
const R8_9_DAY1_RECORDINGS_PAGE =
  "https://www.city.fukutsu.lg.jp/gikai/koho/20465.html";

export type AttendanceRecordingEntry = {
  /** 氏名（空白なし）。general_questions.questioner_name と突き合わせるときは
   *  stripSpaces() した形で比較する */
  name: string;
  qType: "general" | "sokatsu_shitsugi";
  videoUrl: string;
  /** 収録日（ISO 8601）。星取表には使わないが、出典の裏取り用に残す */
  date: string;
};

/**
 * 定例会スラッグ（会期一覧に合わせた r{年}-{月} 形式）ごとの登壇記録。
 *
 * r5-3 〜 r7-3 の9回は、このサイトにまだ議案データが無く記事化していない
 * （星取表専用の attendance_only レコードとして投入する）。
 * r7-6 以降は既に一般質問を記事として掲載済みなので、ここでは録画URLの
 * 補完だけに使う（[[fukutsu-attendance-matrix]] [[fukutsu-publication-stages]]）。
 */
export const ATTENDANCE_RECORDINGS: Record<string, AttendanceRecordingEntry[]> = {
  "r5-3": [
    { name: "山本祐平", qType: "general", date: "2023-03-16", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第2回定例会050316一般質問09山本祐平議員.mp4" },
    { name: "石田まなみ", qType: "general", date: "2023-03-15", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第2回定例会050315一般質問08石田まなみ議員.mp4" },
    { name: "戸田進一", qType: "general", date: "2023-03-15", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第2回定例会050315一般質問05戸田進一議員.mp4" },
    { name: "井手口忠信", qType: "general", date: "2023-03-14", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第2回定例会050314一般質問01井手口忠信議員.mp4" },
    { name: "中村晶代", qType: "general", date: "2023-03-14", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第2回定例会050314一般質問04中村晶代議員.mp4" },
    { name: "岩下豊", qType: "general", date: "2023-03-15", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第2回定例会050315一般質問07岩下豊議員.mp4" },
    { name: "中村清隆", qType: "general", date: "2023-03-16", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第2回定例会050316一般質問10中村清隆議員.mp4" },
    { name: "榎本博", qType: "general", date: "2023-03-15", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第2回定例会050315一般質問06榎本博議員.mp4" },
    { name: "中村恵輔", qType: "general", date: "2023-03-14", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第2回定例会050314一般質問03中村恵輔議員.mp4" },
    { name: "大山隆之", qType: "general", date: "2023-03-14", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第2回定例会050314一般質問02大山隆之議員.mp4" },
    { name: "秦浩", qType: "sokatsu_shitsugi", date: "2023-03-03", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第2回定例会050303総括質疑02秦浩議員.mp4" },
    { name: "尾島武弘", qType: "sokatsu_shitsugi", date: "2023-03-03", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第2回定例会050303総括質疑01尾島武弘議員.mp4" },
    { name: "豆田優子", qType: "sokatsu_shitsugi", date: "2023-03-03", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第2回定例会050303総括質疑03豆田優子議員.mp4" },
    { name: "佐伯美保", qType: "general", date: "2023-03-16", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第2回定例会050316一般質問11佐伯美保議員.mp4" },
  ],
  "r5-6": [
    { name: "山本祐平", qType: "general", date: "2023-06-19", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第4回定例会050619一般質問12山本祐平議員.mp4" },
    { name: "石田まなみ", qType: "general", date: "2023-06-16", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第4回定例会050616一般質問08石田まなみ議員.mp4" },
    { name: "戸田進一", qType: "general", date: "2023-06-16", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第4回定例会050616一般質問05戸田進一議員.mp4" },
    { name: "井手口忠信", qType: "general", date: "2023-06-16", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第4回定例会050616一般質問06井手口忠信議員.mp4" },
    { name: "中村晶代", qType: "general", date: "2023-06-13", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第4回定例会050613一般質問04中村晶代議員.mp4" },
    { name: "岩下豊", qType: "general", date: "2023-06-20", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第4回定例会050620一般質問13岩下豊議員.mp4" },
    { name: "中村清隆", qType: "general", date: "2023-06-13", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第4回定例会050613一般質問03中村清隆議員.mp4" },
    { name: "榎本博", qType: "general", date: "2023-06-16", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第4回定例会050616一般質問07榎本博議員.mp4" },
    { name: "中村恵輔", qType: "general", date: "2023-06-20", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第4回定例会050620一般質問14中村恵輔議員.mp4" },
    { name: "大山隆之", qType: "general", date: "2023-06-19", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第4回定例会050619一般質問11大山隆之議員.mp4" },
    { name: "秦浩", qType: "general", date: "2023-06-13", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第4回定例会050613一般質問01秦浩議員.mp4" },
    { name: "尾島武弘", qType: "general", date: "2023-06-20", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第4回定例会050620一般質問15尾島武弘議員.mp4" },
    { name: "豆田優子", qType: "general", date: "2023-06-19", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第4回定例会050619一般質問10豆田優子議員.mp4" },
    { name: "倉元敏徳", qType: "general", date: "2023-06-19", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第4回定例会050619一般質問09倉元敏徳議員.mp4" },
    { name: "佐伯美保", qType: "general", date: "2023-06-20", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第4回定例会050620一般質問16佐伯美保議員.mp4" },
  ],
  "r5-9": [
    { name: "山本祐平", qType: "general", date: "2023-09-04", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第5回定例会050904一般質問13山本祐平議員.mp4" },
    { name: "石田まなみ", qType: "general", date: "2023-08-31", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第5回定例会050831一般質問07石田まなみ議員.mp4" },
    { name: "戸田進一", qType: "general", date: "2023-08-30", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第5回定例会050830一般質問03戸田進一議員.mp4" },
    { name: "井手口忠信", qType: "general", date: "2023-08-30", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第5回定例会050830一般質問04井手口忠信議員.mp4" },
    { name: "中村晶代", qType: "general", date: "2023-09-04", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第5回定例会050904一般質問14中村晶代議員.mp4" },
    { name: "岩下豊", qType: "general", date: "2023-08-31", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第5回定例会050831一般質問06岩下豊議員.mp4" },
    { name: "中村清隆", qType: "general", date: "2023-08-30", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第5回定例会050830一般質問01中村清隆議員.mp4" },
    { name: "榎本博", qType: "general", date: "2023-08-30", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第5回定例会050830一般質問02榎本博議員.mp4" },
    { name: "中村恵輔", qType: "general", date: "2023-09-01", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第5回定例会050901一般質問09中村恵輔議員.mp4" },
    { name: "大山隆之", qType: "general", date: "2023-08-31", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第5回定例会050831一般質問05大山隆之議員.mp4" },
    { name: "尾島武弘", qType: "general", date: "2023-09-01", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第5回定例会050901一般質問10尾島武弘議員.mp4" },
    { name: "豆田優子", qType: "general", date: "2023-09-01", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第5回定例会050901一般質問11豆田優子議員.mp4" },
    { name: "佐伯美保", qType: "general", date: "2023-09-04", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第5回定例会050904一般質問15佐伯美保議員.mp4" },
    { name: "米山信", qType: "general", date: "2023-08-31", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第5回定例会050831一般質問08米山信議員.mp4" },
  ],
  "r5-12": [
    { name: "山本祐平", qType: "general", date: "2023-11-27", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第6定例会051127一般質問11山本祐平議員.mp4" },
    { name: "石田まなみ", qType: "general", date: "2023-11-22", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第6定例会051122一般質問02石田まなみ議員.mp4" },
    { name: "戸田進一", qType: "general", date: "2023-11-28", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第6定例会051128一般質問14戸田進一議員.mp4" },
    { name: "井手口忠信", qType: "general", date: "2023-11-24", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第6定例会051124一般質問05井手口忠信議員.mp4" },
    { name: "中村晶代", qType: "general", date: "2023-11-24", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第6定例会051124一般質問07中村晶代議員.mp4" },
    { name: "岩下豊", qType: "general", date: "2023-11-27", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第6定例会051127一般質問10岩下豊議員.mp4" },
    { name: "中村清隆", qType: "general", date: "2023-11-27", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第6定例会051127一般質問09中村清隆議員.mp4" },
    { name: "榎本博", qType: "general", date: "2023-11-22", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第6定例会051122一般質問03榎本博議員.mp4" },
    { name: "中村恵輔", qType: "general", date: "2023-11-28", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第6定例会051128一般質問16中村恵輔議員.mp4" },
    { name: "大山隆之", qType: "general", date: "2023-11-24", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第6定例会051124一般質問06大山隆之議員.mp4" },
    { name: "秦浩", qType: "general", date: "2023-11-22", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第6定例会051122一般質問01秦浩議員.mp4" },
    { name: "尾島武弘", qType: "general", date: "2023-11-28", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第6定例会051128一般質問15尾島武弘議員.mp4" },
    { name: "豆田優子", qType: "general", date: "2023-11-28", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第6定例会051128一般質問13豆田優子議員.mp4" },
    { name: "倉元敏徳", qType: "general", date: "2023-11-22", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第6定例会051122一般質問04倉元敏徳議員.mp4" },
    { name: "佐伯美保", qType: "general", date: "2023-11-24", videoUrl: "https://gikaifukutsu.org/vod/R5/令和5年第6定例会051124一般質問08佐伯美保議員.mp4" },
  ],
  "r6-3": [
    { name: "山本祐平", qType: "general", date: "2024-03-19", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第2回定例会060319一般質問11山本祐平議員.mp4" },
    { name: "石田まなみ", qType: "general", date: "2024-03-19", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第2回定例会060319一般質問09石田まなみ議員.mp4" },
    { name: "戸田進一", qType: "sokatsu_shitsugi", date: "2024-03-04", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第2回定例会060304総括質疑04戸田進一議員.mp4" },
    { name: "井手口忠信", qType: "general", date: "2024-03-18", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第2回定例会060318一般質問05井手口忠信議員.mp4" },
    { name: "中村晶代", qType: "general", date: "2024-03-18", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第2回定例会060318一般質問06中村晶代議員.mp4" },
    { name: "岩下豊", qType: "general", date: "2024-03-18", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第2回定例会060318一般質問08岩下豊議員.mp4" },
    { name: "中村清隆", qType: "general", date: "2024-03-13", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第2回定例会060313一般質問01中村清隆議員.mp4" },
    { name: "榎本博", qType: "sokatsu_shitsugi", date: "2024-03-04", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第2回定例会060304総括質疑03榎本博議員.mp4" },
    { name: "中村恵輔", qType: "general", date: "2024-03-13", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第2回定例会060313一般質問03中村恵輔議員.mp4" },
    { name: "大山隆之", qType: "general", date: "2024-03-13", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第2回定例会060313一般質問04大山隆之議員.mp4" },
    { name: "秦浩", qType: "general", date: "2024-03-13", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第2回定例会060313一般質問02秦浩議員.mp4" },
    { name: "尾島武弘", qType: "sokatsu_shitsugi", date: "2024-02-29", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第2回定例会060229総括質疑02尾島武弘議員.mp4" },
    { name: "豆田優子", qType: "sokatsu_shitsugi", date: "2024-03-04", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第2回定例会060304総括質疑05豆田優子議員.mp4" },
    { name: "倉元敏徳", qType: "sokatsu_shitsugi", date: "2024-02-29", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第2回定例会060229総括質疑01倉元敏徳議員.mp4" },
    { name: "佐伯美保", qType: "general", date: "2024-03-18", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第2回定例会060318一般質問07佐伯美保議員.mp4" },
  ],
  "r6-6": [
    { name: "山本祐平", qType: "general", date: "2024-06-10", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第4回定例会060610一般質問01山本祐平議員.mp4" },
    { name: "石田まなみ", qType: "general", date: "2024-06-05", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第4回定例会060605一般質問04石田まなみ議員.mp4" },
    { name: "戸田進一", qType: "general", date: "2024-06-07", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第4回定例会060607一般質問02戸田進一議員.mp4" },
    { name: "井手口忠信", qType: "general", date: "2024-06-04", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第4回定例会060604一般質問03井手口忠信議員.mp4" },
    { name: "中村晶代", qType: "general", date: "2024-06-05", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第4回定例会060605一般質問03中村晶代議員.mp4" },
    { name: "岩下豊", qType: "general", date: "2024-06-07", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第4回定例会060607一般質問03岩下豊議員.mp4" },
    { name: "中村清隆", qType: "general", date: "2024-06-07", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第4回定例会060607一般質問01中村清隆議員.mp4" },
    { name: "榎本博", qType: "general", date: "2024-06-04", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第4回定例会060604一般質問02榎本博議員.mp4" },
    { name: "中村恵輔", qType: "general", date: "2024-06-05", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第4回定例会060605一般質問01中村恵輔議員.mp4" },
    { name: "大山隆之", qType: "general", date: "2024-06-05", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第4回定例会060605一般質問02大山隆之議員.mp4" },
    { name: "秦浩", qType: "general", date: "2024-06-04", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第4回定例会060604一般質問01秦浩議員.mp4" },
    { name: "豆田優子", qType: "general", date: "2024-06-07", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第4回定例会060607一般質問04豆田優子議員.mp4" },
    { name: "倉元敏徳", qType: "general", date: "2024-06-04", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第4回定例会060604一般質問04倉元敏徳議員.mp4" },
    { name: "佐伯美保", qType: "general", date: "2024-06-10", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第4回定例会060610一般質問03佐伯美保議員.mp4" },
  ],
  "r6-9": [
    { name: "山本祐平", qType: "general", date: "2024-09-02", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第5回定例会060902一般質問09山本祐平議員.mp4" },
    { name: "石田まなみ", qType: "general", date: "2024-08-29", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第5回定例会060829一般質問07石田まなみ議員.mp4" },
    { name: "戸田進一", qType: "general", date: "2024-09-03", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第5回定例会060903一般質問16戸田進一議員.mp4" },
    { name: "井手口忠信", qType: "general", date: "2024-08-29", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第5回定例会060829一般質問05井手口忠信議員.mp4" },
    { name: "中村晶代", qType: "general", date: "2024-09-02", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第5回定例会060902一般質問12中村晶代議員.mp4" },
    { name: "岩下豊", qType: "general", date: "2024-09-03", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第5回定例会060903一般質問14岩下豊議員.mp4" },
    { name: "中村清隆", qType: "general", date: "2024-08-28", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第5回定例会060828一般質問01中村清隆議員.mp4" },
    { name: "榎本博", qType: "general", date: "2024-08-28", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第5回定例会060828一般質問04榎本博議員.mp4" },
    { name: "中村恵輔", qType: "general", date: "2024-08-28", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第5回定例会060828一般質問03中村恵輔議員.mp4" },
    { name: "大山隆之", qType: "general", date: "2024-08-28", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第5回定例会060828一般質問02大山隆之議員.mp4" },
    { name: "秦浩", qType: "general", date: "2024-08-29", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第5回定例会060829一般質問06秦浩議員.mp4" },
    { name: "尾島武弘", qType: "general", date: "2024-09-03", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第5回定例会060903一般質問15尾島武弘議員.mp4" },
    { name: "豆田優子", qType: "general", date: "2024-09-02", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第5回定例会060902一般質問11豆田優子議員.mp4" },
    { name: "佐伯美保", qType: "general", date: "2024-08-29", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第5回定例会060829一般質問08佐伯美保議員.mp4" },
    { name: "米山信", qType: "general", date: "2024-09-02", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第5回定例会060902一般質問10米山信議員.mp4" },
  ],
  "r6-12": [
    { name: "山本祐平", qType: "general", date: "2024-11-22", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第6回定例会061122一般質問01山本祐平議員.mp4" },
    { name: "石田まなみ", qType: "general", date: "2024-11-25", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第6回定例会061125一般質問02石田まなみ議員.mp4" },
    { name: "戸田進一", qType: "general", date: "2024-11-25", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第6回定例会061125一般質問01戸田進一議員.mp4" },
    { name: "井手口忠信", qType: "general", date: "2024-11-22", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第6回定例会061122一般質問03井手口忠信議員.mp4" },
    { name: "中村晶代", qType: "general", date: "2024-11-25", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第6回定例会061125一般質問03中村晶代議員.mp4" },
    { name: "岩下豊", qType: "general", date: "2024-11-26", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第6回定例会061126一般質問01岩下豊議員.mp4" },
    { name: "中村清隆", qType: "general", date: "2024-11-21", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第6回定例会061121一般質問03中村清隆議員.mp4" },
    { name: "榎本博", qType: "general", date: "2024-11-21", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第6回定例会061121一般質問04榎本博議員.mp4" },
    { name: "中村恵輔", qType: "general", date: "2024-11-21", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第6回定例会061121一般質問02中村恵輔議員.mp4" },
    { name: "大山隆之", qType: "general", date: "2024-11-22", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第6回定例会061122一般質問02大山隆之議員.mp4" },
    { name: "秦浩", qType: "general", date: "2024-11-21", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第6回定例会061121一般質問01秦浩議員.mp4" },
    { name: "尾島武弘", qType: "general", date: "2024-11-26", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第6回定例会061126一般質問02尾島武弘議員.mp4" },
    { name: "豆田優子", qType: "general", date: "2024-11-25", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第6回定例会061125一般質問04豆田優子議員.mp4" },
    { name: "倉元敏徳", qType: "general", date: "2024-11-22", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第6回定例会061122一般質問04倉元敏徳議員.mp4" },
    { name: "佐伯美保", qType: "general", date: "2024-11-26", videoUrl: "https://gikaifukutsu.org/vod/R6/令和6年第6回定例会061126一般質問03佐伯美保議員.mp4" },
  ],
  "r7-3": [
    { name: "山本祐平", qType: "general", date: "2025-03-24", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第3回定例会070324一般質問01山本祐平議員.mp4" },
    { name: "石田まなみ", qType: "general", date: "2025-03-25", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第3回定例会070325一般質問03石田まなみ議員.mp4" },
    { name: "戸田進一", qType: "general", date: "2025-03-24", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第3回定例会070324一般質問02戸田進一議員.mp4" },
    { name: "井手口忠信", qType: "general", date: "2025-03-25", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第3回定例会070325一般質問01井手口忠信議員.mp4" },
    { name: "中村晶代", qType: "general", date: "2025-03-26", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第3回定例会070326一般質問03中村晶代議員.mp4" },
    { name: "岩下豊", qType: "general", date: "2025-03-25", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第3回定例会070325一般質問04岩下豊議員.mp4" },
    { name: "中村清隆", qType: "general", date: "2025-03-24", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第3回定例会070324一般質問03中村清隆議員.mp4" },
    { name: "榎本博", qType: "general", date: "2025-03-26", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第3回定例会070326一般質問02榎本博議員.mp4" },
    { name: "中村恵輔", qType: "general", date: "2025-03-25", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第3回定例会070325一般質問02中村恵輔議員.mp4" },
    { name: "大山隆之", qType: "general", date: "2025-03-24", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第3回定例会070324一般質問04大山隆之議員.mp4" },
    { name: "尾島武弘", qType: "general", date: "2025-03-26", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第3回定例会070326一般質問04尾島武弘議員.mp4" },
    { name: "豆田優子", qType: "general", date: "2025-03-26", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第3回定例会070326一般質問01豆田優子議員.mp4" },
  ],

  // ここから下は既に一般質問を記事として掲載済みの定例会。
  // 星取表用のレコードは作らず、既存の general_questions に video_url を
  // 補完するためだけに使う（seed-general-questions.ts）。
  "r7-6": [
    { name: "山本祐平", qType: "general", date: "2025-06-24", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第5回定例会070624一般質問01山本祐平議員.mp4" },
    { name: "石田まなみ", qType: "general", date: "2025-06-25", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第5回定例会070625一般質問02石田まなみ議員.mp4" },
    { name: "戸田進一", qType: "sokatsu_shitsugi", date: "2025-06-17", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第5回定例会070617総括質疑03戸田進一議員.mp4" },
    { name: "井手口忠信", qType: "general", date: "2025-06-25", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第5回定例会070625一般質問03井手口忠信.mp4" },
    { name: "中村晶代", qType: "sokatsu_shitsugi", date: "2025-06-18", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第5回定例会070618総括質疑03中村晶代議員.mp4" },
    { name: "岩下豊", qType: "general", date: "2025-06-26", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第5回定例会070626一般質問01岩下豊議員.mp4" },
    { name: "中村清隆", qType: "general", date: "2025-06-25", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第5回定例会070625一般質問01中村清隆議員.mp4" },
    { name: "榎本博", qType: "sokatsu_shitsugi", date: "2025-06-18", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第5回定例会070618総括質疑01榎本博議員.mp4" },
    { name: "中村恵輔", qType: "general", date: "2025-06-24", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第5回定例会070624一般質問02中村恵輔議員.mp4" },
    { name: "大山隆之", qType: "general", date: "2025-06-24", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第5回定例会070624一般質問03大山隆之議員.mp4" },
    { name: "秦浩", qType: "sokatsu_shitsugi", date: "2025-06-17", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第5回定例会070617総括質疑01秦浩議員.mp4" },
    { name: "尾島武弘", qType: "sokatsu_shitsugi", date: "2025-06-17", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第5回定例会070617総括質疑02尾島武弘議員.mp4" },
    { name: "豆田優子", qType: "sokatsu_shitsugi", date: "2025-06-18", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第5回定例会070618総括質疑02豆田優子議員.mp4" },
    { name: "倉元敏徳", qType: "general", date: "2025-06-26", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第5回定例会070626一般質問02倉元敏徳議員.mp4" },
    { name: "佐伯美保", qType: "general", date: "2025-06-26", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第5回定例会070626一般質問03佐伯美保議員.mp4" },
  ],
  "r7-9": [
    { name: "山本祐平", qType: "general", date: "2025-09-04", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第6回定例会070904一般質問03山本祐平議員.mp4" },
    { name: "石田まなみ", qType: "general", date: "2025-09-04", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第6回定例会070904一般質問01石田まなみ議員.mp4" },
    { name: "戸田進一", qType: "general", date: "2025-09-05", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第6回定例会070905一般質問02戸田進一議員.mp4" },
    { name: "井手口忠信", qType: "general", date: "2025-09-02", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第6回定例会070902一般質問03井手口忠信議員.mp4" },
    { name: "中村晶代", qType: "general", date: "2025-09-03", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第6回定例会070903一般質問03中村晶代議員.mp4" },
    { name: "岩下豊", qType: "general", date: "2025-09-03", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第6回定例会070903一般質問02岩下豊議員.mp4" },
    { name: "中村清隆", qType: "general", date: "2025-09-02", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第6回定例会070902一般質問02中村清隆議員.mp4" },
    { name: "榎本博", qType: "general", date: "2025-09-02", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第6回定例会070902一般質問04榎本博議員.mp4" },
    { name: "中村恵輔", qType: "general", date: "2025-09-05", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第6回定例会070905一般質問01中村恵輔議員.mp4" },
    { name: "秦浩", qType: "general", date: "2025-09-02", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第6回定例会070902一般質問01秦浩議員.mp4" },
    { name: "豆田優子", qType: "general", date: "2025-09-03", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第6回定例会070903一般質問01豆田優子議員.mp4" },
    { name: "倉元敏徳", qType: "general", date: "2025-09-04", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第6回定例会070904一般質問02倉元敏徳議員.mp4" },
    { name: "佐伯美保", qType: "general", date: "2025-09-05", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第6回定例会070905一般質問03佐伯美保議員.mp4" },
  ],
  "r7-12": [
    { name: "山本祐平", qType: "general", date: "2025-11-27", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第7回定例会071127一般質問02山本祐平議員.mp4" },
    { name: "石田まなみ", qType: "general", date: "2025-11-27", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第7回定例会071127一般質問04石田まなみ議員.mp4" },
    { name: "戸田進一", qType: "general", date: "2025-12-01", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第7回定例会071201一般質問03戸田進一議員.mp4" },
    { name: "井手口忠信", qType: "general", date: "2025-11-28", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第7回定例会071128一般質問02井手口忠信議員.mp4" },
    { name: "中村晶代", qType: "general", date: "2025-12-02", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第7回定例会071202一般質問03中村晶代議員.mp4" },
    { name: "岩下豊", qType: "general", date: "2025-12-01", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第7回定例会071201一般質問04岩下豊議員.mp4" },
    { name: "中村清隆", qType: "general", date: "2025-12-01", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第7回定例会071201一般質問01中村清隆議員.mp4" },
    { name: "榎本博", qType: "general", date: "2025-11-28", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第7回定例会071128一般質問03榎本博議員.mp4" },
    { name: "中村恵輔", qType: "general", date: "2025-11-28", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第7回定例会071128一般質問01中村恵輔議員.mp4" },
    { name: "大山隆之", qType: "general", date: "2025-11-27", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第7回定例会071127一般質問03大山隆之議員.mp4" },
    { name: "秦浩", qType: "general", date: "2025-11-27", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第7回定例会071127一般質問01秦浩議員.mp4" },
    { name: "尾島武弘", qType: "general", date: "2025-12-02", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第7回定例会071202一般質問04尾島武弘議員.mp4" },
    { name: "豆田優子", qType: "general", date: "2025-12-01", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第7回定例会071201一般質問02豆田優子議員.mp4" },
    { name: "倉元敏徳", qType: "general", date: "2025-12-02", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第7回定例会071202一般質問02倉元敏徳議員.mp4" },
    { name: "佐伯美保", qType: "general", date: "2025-12-02", videoUrl: "https://gikaifukutsu.org/vod/R7/令和7年第7回定例会071202一般質問01佐伯美保議員.mp4" },
  ],
  "r8-3": [
    { name: "山本祐平", qType: "general", date: "2026-03-23", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第3回定例会080323一般質問01山本祐平議員.mp4" },
    { name: "秦浩", qType: "general", date: "2026-03-23", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第3回定例会080323一般質問02秦浩議員.mp4" },
    { name: "中村恵輔", qType: "general", date: "2026-03-23", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第3回定例会080323一般質問03中村恵輔議員.mp4" },
    { name: "井手口忠信", qType: "general", date: "2026-03-23", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第3回定例会080323一般質問04井手口忠信議員.mp4" },
    { name: "大山隆之", qType: "general", date: "2026-03-24", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第3回定例会080324一般質問01大山隆之議員.mp4" },
    { name: "中村清隆", qType: "general", date: "2026-03-24", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第3回定例会080324一般質問02中村清隆議員.mp4" },
    { name: "榎本博", qType: "general", date: "2026-03-24", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第3回定例会080324一般質問03榎本博議員.mp4" },
    { name: "石田まなみ", qType: "general", date: "2026-03-24", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第3回定例会080324一般質問04石田まなみ議員.mp4" },
    { name: "佐伯美保", qType: "general", date: "2026-03-25", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第3回定例会080325一般質問01佐伯美保議員.mp4" },
    { name: "中村晶代", qType: "general", date: "2026-03-25", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第3回定例会080325一般質問02中村晶代議員.mp4" },
    { name: "岩下豊", qType: "general", date: "2026-03-25", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第3回定例会080325一般質問03岩下豊議員.mp4" },
    { name: "戸田進一", qType: "general", date: "2026-03-25", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第3回定例会080325一般質問04戸田進一議員.mp4" },
    { name: "尾島武弘", qType: "sokatsu_shitsugi", date: "2026-03-09", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第3回定例会080309総括質疑01尾島武弘議員.mp4" },
    { name: "倉元敏徳", qType: "sokatsu_shitsugi", date: "2026-03-09", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第3回定例会080309総括質疑02倉元敏徳議員.mp4" },
    { name: "豆田優子", qType: "sokatsu_shitsugi", date: "2026-03-09", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第3回定例会080309総括質疑03豆田優子議員.mp4" },
  ],
  "r8-6": [
    { name: "山本祐平", qType: "general", date: "2026-06-10", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第5回定例会080610一般質問04山本祐平議員.mp4" },
    { name: "石田まなみ", qType: "general", date: "2026-06-10", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第5回定例会080610一般質問03石田まなみ議員.mp4" },
    { name: "戸田進一", qType: "general", date: "2026-06-12", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第5回定例会080612一般質問02戸田進一議員.mp4" },
    { name: "井手口忠信", qType: "general", date: "2026-06-09", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第5回定例会080609一般質問03井手口忠信議員.mp4" },
    { name: "中村晶代", qType: "general", date: "2026-06-11", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第5回定例会080611一般質問01中村晶代議員.mp4" },
    { name: "岩下豊", qType: "general", date: "2026-06-11", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第5回定例会080611一般質問02岩下豊議員.mp4" },
    { name: "中村清隆", qType: "general", date: "2026-06-09", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第5回定例会080609一般質問02中村清隆議員.mp4" },
    { name: "榎本博", qType: "general", date: "2026-06-10", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第5回定例会080610一般質問02榎本博議員.mp4" },
    { name: "中村恵輔", qType: "general", date: "2026-06-12", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第5回定例会080612一般質問01中村恵輔議員.mp4" },
    { name: "大山隆之", qType: "general", date: "2026-06-09", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第5回定例会080609一般質問04大山隆之議員.mp4" },
    { name: "秦浩", qType: "general", date: "2026-06-09", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第5回定例会080609一般質問01秦浩議員.mp4" },
    { name: "尾島武弘", qType: "general", date: "2026-06-11", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第5回定例会080611一般質問04尾島武弘議員.mp4" },
    { name: "豆田優子", qType: "general", date: "2026-06-11", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第5回定例会080611一般質問03豆田優子議員.mp4" },
    { name: "倉元敏徳", qType: "general", date: "2026-06-10", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第5回定例会080610一般質問01倉元敏徳議員.mp4" },
    { name: "佐伯美保", qType: "general", date: "2026-06-12", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第5回定例会080612一般質問03佐伯美保議員.mp4" },
  ],
  // 9月1日（一般質問1日目）の4人は、市の議員別ページから個別の録画ファイルにリンクされて
  // いるが、そのファイル自体が録画サーバーに無い（2026-11-14に確認、404）。1日分の
  // 録画（前半・後半）はあるものの、誰がどちらに入っているかは見ないと分からないため、
  // 推測で選ばず、両方が並ぶ市の9月定例会の録画ページにリンクしている。
  // 個別ファイルが復旧したら差し替え、backfill-question-video-urls.ts で本番を更新する。
  "r8-9": [
    { name: "中村清隆", qType: "general", date: "2026-09-01", videoUrl: R8_9_DAY1_RECORDINGS_PAGE },
    { name: "秦浩", qType: "general", date: "2026-09-01", videoUrl: R8_9_DAY1_RECORDINGS_PAGE },
    { name: "大山隆之", qType: "general", date: "2026-09-01", videoUrl: R8_9_DAY1_RECORDINGS_PAGE },
    { name: "中村恵輔", qType: "general", date: "2026-09-01", videoUrl: R8_9_DAY1_RECORDINGS_PAGE },
    { name: "井手口忠信", qType: "general", date: "2026-09-02", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第6回定例会080902一般質問01井手口忠信議員.mp4" },
    { name: "石田まなみ", qType: "general", date: "2026-09-02", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第6回定例会080902一般質問02石田まなみ議員.mp4" },
    { name: "榎本博", qType: "general", date: "2026-09-02", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第6回定例会080902一般質問03榎本博議員.mp4" },
    { name: "倉元敏徳", qType: "general", date: "2026-09-02", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第6回定例会080902一般質問04倉元敏徳議員.mp4" },
    { name: "豆田優子", qType: "general", date: "2026-09-03", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第6回定例会080903一般質問01豆田優子議員.mp4" },
    { name: "中村晶代", qType: "general", date: "2026-09-03", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第6回定例会080903一般質問02中村晶代議員.mp4" },
    { name: "山本祐平", qType: "general", date: "2026-09-03", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第6回定例会080903一般質問03山本祐平議員.mp4" },
    { name: "尾島武弘", qType: "general", date: "2026-09-03", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第6回定例会080903一般質問04尾島武弘議員.mp4" },
    { name: "岩下豊", qType: "general", date: "2026-09-04", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第6回定例会080904一般質問01岩下豊議員.mp4" },
    { name: "佐伯美保", qType: "general", date: "2026-09-04", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第6回定例会080904一般質問02佐伯美保議員.mp4" },
    { name: "戸田進一", qType: "general", date: "2026-09-04", videoUrl: "https://gikaifukutsu.org/vod/R8/令和8年第6回定例会080904一般質問03戸田進一議員.mp4" },
  ],
};

/** 星取表専用（記事化していない）9定例会のスラッグ */
export const ATTENDANCE_ONLY_SESSION_SLUGS = [
  "r5-3",
  "r5-6",
  "r5-9",
  "r5-12",
  "r6-3",
  "r6-6",
  "r6-9",
  "r6-12",
  "r7-3",
] as const;
