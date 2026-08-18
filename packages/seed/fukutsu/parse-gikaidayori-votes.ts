/**
 * 市議会だよりPDFの「賛否一覧表」から、議員別の賛否を読み取る。
 *
 * 【前提】このファイルが扱えるのは、PDFに文字データ（テキスト層）が入っている号だけ。
 * 82号（令和7年6月定例会）は文字データがあり、○●がそのまま文字として取れる。
 * 一方、84号・85号は全ページがスキャン画像でテキスト層が無く、この方法では1文字も
 * 取れない（そちらは目視またはピクセル解析で読み取った結果を data/*-votes.json に置いている）。
 *
 * 【入力】poppler の pdftotext に -bbox-layout を付けて出した XHTML。
 *   pdftotext -bbox-layout 06-07Pgikaidayori82.pdf out.xml
 * 1文字ずつの座標が入っているので、表の格子を座標から組み立て直せる。
 *
 * 【表の作り】（82号 6-7ページ見開きの例）
 *   ・○●が縦16列×横10行の格子に並ぶ。1列が議員1人、1行が案件1件。
 *   ・議員名は格子のすぐ上に、姓と名が別の語として縦に2段で置かれる。
 *   ・議長の列だけ○●が1つも無い（表決に参加しないため）。列そのものは名前だけ存在する。
 *   ・案件名と議決結果は、格子の左側に行ごとに置かれる。
 *     案件名が長いと2行に折り返され、行の中心に対して上下に散る。
 */

/** pdftotext -bbox-layout の1語 */
export type BBoxWord = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  text: string;
};

/** 賛否表の凡例。○=賛成 ●=反対 ー=欠席 ＊=棄権 */
const MARK_CHARS = new Set(["○", "●", "ー", "―", "－", "‐", "＊", "*"]);

export type VoteMark = "賛成" | "反対" | "欠席" | "棄権";

function toVoteMark(char: string): VoteMark {
  if (char === "○") return "賛成";
  if (char === "●") return "反対";
  if (char === "＊" || char === "*") return "棄権";
  return "欠席";
}

/** 賛否表1行ぶん。data/<slug>-votes.json の1要素と同じ形 */
export type GikaidayoriVoteRow = {
  /** 例: "6月定例会" */
  session: string;
  /** 議決結果。例: "可決" "否決" "同意" "採択" */
  result: string;
  /** 賛否表に印刷された案件名（議案番号ではない） */
  title: string;
  /** 議員名 → 賛否。議長は null */
  votes: Record<string, VoteMark | null>;
};

/** pdftotext -bbox-layout の出力から <word> を全部拾う */
export function parseBBoxWords(xml: string): BBoxWord[] {
  const RE =
    /<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([\s\S]*?)<\/word>/g;
  const words: BBoxWord[] = [];
  let m: RegExpExecArray | null;
  while ((m = RE.exec(xml)) !== null) {
    words.push({
      x0: Number(m[1]),
      y0: Number(m[2]),
      x1: Number(m[3]),
      y1: Number(m[4]),
      text: decodeEntities(m[5]),
    });
  }
  return words;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * 数値の並びを、間隔がしきい値より離れたところで区切ってまとめる。
 * 同じ列（行）にある記号は座標がわずかにずれるため、そのままでは列数を数えられない。
 */
function cluster(values: number[], gap: number): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const groups: number[][] = [];
  for (const v of sorted) {
    const last = groups[groups.length - 1];
    if (last && v - last[last.length - 1] <= gap) last.push(v);
    else groups.push([v]);
  }
  return groups.map((g) => g.reduce((a, b) => a + b, 0) / g.length);
}

function nearest(values: number[], target: number): number {
  return values.reduce((a, b) =>
    Math.abs(b - target) < Math.abs(a - target) ? b : a
  );
}

export type VoteGrid = {
  /** 記号の列の中心x（左から順）。議員1人ぶん */
  columnX: number[];
  /** 記号の行の中心y（上から順）。案件1件ぶん */
  rowY: number[];
  /** [行][列] の記号。空欄は null */
  marks: (VoteMark | null)[][];
};

/**
 * ○●の格子を座標から組み立てる。
 *
 * 記号は表の中だけに出るとは限らない（本文中の「ー」など）ので、
 * 同じ行に何個並んでいるかを見て、いちばん大きな塊だけを表とみなす。
 */
export function buildVoteGrid(words: BBoxWord[]): VoteGrid {
  const markWords = words.filter(
    (w) => w.text.length === 1 && MARK_CHARS.has(w.text)
  );

  // 行にまとめ、記号が3個以上並んでいる行だけを表の行とみなす
  const rowCandidates = cluster(
    markWords.map((w) => w.y0),
    6
  );
  const rows = rowCandidates.filter(
    (y) => markWords.filter((w) => Math.abs(w.y0 - y) <= 6).length >= 3
  );

  const inTable = markWords.filter((w) =>
    rows.some((y) => Math.abs(w.y0 - y) <= 6)
  );
  const columns = cluster(
    inTable.map((w) => w.x0),
    6
  );

  const marks: (VoteMark | null)[][] = rows.map(() =>
    columns.map(() => null)
  );
  for (const w of inTable) {
    const r = rows.indexOf(nearest(rows, w.y0));
    const c = columns.indexOf(nearest(columns, w.x0));
    marks[r][c] = toVoteMark(w.text);
  }

  return { columnX: columns, rowY: rows, marks };
}

/**
 * 格子のすぐ上にある議員名を、列に割り当てて読む。
 *
 * 議員名は姓と名で語が分かれ、同じxに縦2段で置かれる（「大山」「隆之」）。
 * 「井手口忠信」のように1語で入っているものもあるので、xが同じものを
 * y順につないで氏名にする。
 *
 * 議長の列は記号が無いため列として検出されない。列の間隔ぶんだけ右に
 * 名前が続いていれば、それを議長として拾う。
 */
export function readMemberNames(
  words: BBoxWord[],
  grid: VoteGrid
): { names: string[]; chairName: string | null } {
  const top = Math.min(...grid.rowY);
  // 表のすぐ上にある語が議員名。姓と名で2段になるので、2段ぶん入る高さを見る
  const headerWords = words.filter(
    (w) => w.y1 <= top + 2 && w.y1 > top - 75 && w.x0 > grid.columnX[0] - 20
  );

  const pitch =
    grid.columnX.length > 1
      ? (grid.columnX[grid.columnX.length - 1] - grid.columnX[0]) /
        (grid.columnX.length - 1)
      : 0;
  // 名前は記号よりわずかに右に置かれている。ずれを列ごとに吸収する
  const columnCenters = [
    ...grid.columnX,
    grid.columnX[grid.columnX.length - 1] + pitch,
  ];

  const byColumn = columnCenters.map(() => [] as BBoxWord[]);
  for (const w of headerWords) {
    const idx = columnCenters.findIndex((x) => Math.abs(w.x0 - x) <= pitch / 2);
    if (idx >= 0) byColumn[idx].push(w);
  }

  const names = byColumn.map((ws) =>
    ws
      .sort((a, b) => a.y0 - b.y0)
      .map((w) => w.text)
      .join("")
      .replace(/[\s　]/g, "")
  );

  const chairName = names[names.length - 1] || null;
  return { names: names.slice(0, grid.columnX.length), chairName };
}

/**
 * 格子の左側にある案件名と議決結果を、行に割り当てて読む。
 *
 * 案件名が長いと2行に折り返され、記号の行の上下にはみ出す。行の高さは
 * 一定ではない（折り返した行だけ広い）ので、幅を決め打ちで区切るのではなく
 * 「いちばん近い行」に割り当てる。表の外にある見出しや本文を巻き込まないよう、
 * 上下は記号1行ぶんだけはみ出したところで打ち切る。
 *
 * 議決結果はいちばん左の列にあるので、x座標がもっとも小さい語を採る。
 */
export function readRowLabels(
  words: BBoxWord[],
  grid: VoteGrid
): { title: string; result: string }[] {
  const left = Math.min(...grid.columnX);
  const centers = grid.rowY.map((y) => y + 5);
  const rowHeight =
    centers.length > 1
      ? (centers[centers.length - 1] - centers[0]) / (centers.length - 1)
      : 12;

  const labelWords = words.filter(
    (w) =>
      w.x1 < left - 5 &&
      (w.y0 + w.y1) / 2 > centers[0] - rowHeight * 0.7 &&
      (w.y0 + w.y1) / 2 < centers[centers.length - 1] + rowHeight * 0.7
  );
  const resultX = Math.min(...labelWords.map((w) => w.x0));

  return centers.map((center) => {
    const band = labelWords
      .filter((w) => nearest(centers, (w.y0 + w.y1) / 2) === center)
      .sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);

    const result = band.find((w) => Math.abs(w.x0 - resultX) < 5);
    const title = band
      .filter((w) => w !== result)
      .map((w) => w.text)
      .join("");

    return { title, result: result?.text ?? "" };
  });
}

/**
 * 賛否表を丸ごと読み取る。
 *
 * @param sessionLabel data/*-votes.json の session に入れる会期の呼び名（例: "6月定例会"）
 */
export function parseGikaidayoriVotes(
  xml: string,
  sessionLabel: string
): GikaidayoriVoteRow[] {
  const words = parseBBoxWords(xml);
  const grid = buildVoteGrid(words);
  const { names, chairName } = readMemberNames(words, grid);
  const labels = readRowLabels(words, grid);

  return grid.marks.map((row, r) => {
    const votes: Record<string, VoteMark | null> = {};
    row.forEach((mark, c) => {
      votes[names[c]] = mark;
    });
    if (chairName) votes[chairName] = null;

    return {
      session: sessionLabel,
      result: labels[r].result,
      title: labels[r].title,
      votes,
    };
  });
}
