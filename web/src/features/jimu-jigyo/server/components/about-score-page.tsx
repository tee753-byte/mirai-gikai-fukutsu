import "server-only";
import Link from "next/link";

/** 分析の見方（/jimu-jigyo/about-score） */
export function AboutScorePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-sm text-mirai-text-secondary">
      <div>
        <h1 className="text-2xl font-bold text-mirai-text">
          この分析の見方について
        </h1>
        <p className="mt-2">
          このページは、福岡県が公表する行政評価（事務事業評価）の評価書と概要一覧をもとに、各事業の状況を可視化した参考資料です。県による評価そのものではなく、公開データを機械的に整理・分析したものです。
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-mirai-text">見直し区分</h2>
        <p>
          県の評価書における各事業の今後の方向性です。「継続（拡充・改善・一部改善・縮小）」「終了（完了・再構築・廃止）」の区分をそのまま表示しています。カード・フィルタの主軸として用いています。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-mirai-text">
          KPI・予算・効率の3軸分析
        </h2>
        <p>
          評価書の数値をもとに、独自に前年度からの変化方向（↑改善／↓悪化／→横ばい）を算出したものです。閾値は±5%としています。
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <span className="font-medium text-mirai-text">KPI</span>
            ：主たる成果指標の実績値の前年度比。達成率（実績÷目標）も併記します。
          </li>
          <li>
            <span className="font-medium text-mirai-text">予算</span>
            ：決算歳出の前年度比。翌年度の当初予算の方向も併せて示します。過年度の決算が評価書に揃わない事業では「―」と表示されます。
          </li>
          <li>
            <span className="font-medium text-mirai-text">効率</span>
            ：成果指標の達成率平均を決算歳出で割った「コスト効率」の前年度比。指標・決算が揃う事業でのみ算出します。
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-mirai-text">データの制約</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            県の事務事業評価は毎年一部の事業が対象です。過年度の評価書と突合できた事業のみ、決算ベースの予算推移を複数年分表示できます。
          </li>
          <li>
            評価書の「事業概要」は図表が中心のため、一部は概要一覧の記述で補完しています。正確な内容は各事業の原本PDFをご確認ください。
          </li>
        </ul>
      </section>

      <Link
        href="/jimu-jigyo/r7"
        className="inline-block text-primary underline"
      >
        ← 事務事業評価の一覧へ戻る
      </Link>
    </div>
  );
}
