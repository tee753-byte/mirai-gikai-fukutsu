import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import {
  LegalPageLayout,
  LegalParagraph,
  LegalSectionTitle,
} from "@/components/layouts/legal-page-layout";
import { JsonLd } from "@/components/seo/json-ld";
import { buildFaqSchema } from "@/lib/structured-data";
import { siteConfig } from "@/config/site.config";

export const metadata: Metadata = {
  title: "よくあるご質問",
  description: `${siteConfig.siteName}に関するよくあるご質問`,
  alternates: { canonical: "/faq" },
};

type FaqItem = {
  question: string;
  /** 画面に表示する回答。リンクなどを含められる */
  answer: React.ReactNode;
  /**
   * 検索エンジンに渡す回答（構造化データ用）。
   * answer はReactの要素なので、そのままではJSONにできない。
   * 同じ内容をタグなしの文章で書いたものをここに置く。
   */
  answerText: string;
};

const isAiChatEnabled =
  siteConfig.features.aiChat || siteConfig.features.aiInterview;

const faqs: FaqItem[] = [
  {
    question: `${siteConfig.siteName}とは何ですか？`,
    answer: (
      <>
        {siteConfig.siteDescription}
        。議案の情報収集や解説にAIを活用し、市民の皆さまが議会の動向を把握しやすくすることを目的としています。
      </>
    ),
    answerText: `${siteConfig.siteDescription}。議案の情報収集や解説にAIを活用し、市民の皆さまが議会の動向を把握しやすくすることを目的としています。`,
  },
  {
    question: "チームみらいの公式サービスですか？",
    answer: (
      <>
        いいえ、{siteConfig.siteName}
        はチームみらいの公式サービスではありません。「チームみらい」が開発・公開した「みらい議会」をベースに、有志が独自に運営している非公式サービスです。
        <br />
        また、{siteConfig.cityName}および{siteConfig.councilName}
        が運営する公式サイトでもありません。掲載内容について
        {siteConfig.councilName}へお問い合わせいただいてもお答えできません。
        <br />
        ご意見・不具合等は、チームみらい公式や{siteConfig.councilName}
        ではなく、運営者（
        {siteConfig.operator.contactUrl ? (
          <Link
            href={siteConfig.operator.contactUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            {siteConfig.operator.name}
          </Link>
        ) : (
          <span>{siteConfig.operator.name}</span>
        )}
        ）にご連絡ください。
      </>
    ),
    answerText: `いいえ、${siteConfig.siteName}はチームみらいの公式サービスではありません。「チームみらい」が開発・公開した「みらい議会」をベースに、有志が独自に運営している非公式サービスです。また、${siteConfig.cityName}および${siteConfig.councilName}が運営する公式サイトでもありません。掲載内容について${siteConfig.councilName}へお問い合わせいただいてもお答えできません。ご意見・不具合等は、チームみらい公式や${siteConfig.councilName}ではなく、運営者（${siteConfig.operator.name}）にご連絡ください。`,
  },
  {
    question: "議案の情報はどこから取得していますか？",
    answer: (
      <>
        <Link
          href={siteConfig.councilBillsDetailUrl}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          {siteConfig.councilName}公式サイト
        </Link>
        に公開されている情報をもとに掲載しています。最新情報や正確な内容については公式サイトをご確認ください。
      </>
    ),
    answerText: `${siteConfig.councilName}公式サイトに公開されている情報をもとに掲載しています。最新情報や正確な内容については公式サイトをご確認ください。`,
  },
  {
    question: "AIによる解説・回答は正確ですか？",
    answer:
      "AIが生成する解説・回答は参考情報であり、正確性・完全性・最新性を保証するものではありません。重要な判断の際は必ず公式情報をご確認ください。",
    answerText:
      "AIが生成する解説・回答は参考情報であり、正確性・完全性・最新性を保証するものではありません。重要な判断の際は必ず公式情報をご確認ください。",
  },
  {
    question: "個人情報はどのように扱われますか？",
    answer: (
      <>
        詳細は
        <Link href="/privacy" className="underline underline-offset-2">
          プライバシーポリシー
        </Link>
        をご確認ください。
        {isAiChatEnabled &&
          "AIチャット・インタビュー機能への入力内容には個人情報を含めないようお願いします。"}
      </>
    ),
    answerText: `詳細はプライバシーポリシーをご確認ください。${
      isAiChatEnabled
        ? "AIチャット・インタビュー機能への入力内容には個人情報を含めないようお願いします。"
        : ""
    }`,
  },
  {
    question: "不具合や意見はどこに連絡すればいいですか？",
    answer: (
      <>
        運営者（
        {siteConfig.operator.contactUrl ? (
          <Link
            href={siteConfig.operator.contactUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            {siteConfig.operator.name}
          </Link>
        ) : (
          <span>{siteConfig.operator.name}</span>
        )}
        ）までご連絡ください。なお、チームみらいの公式窓口や
        {siteConfig.councilName}への連絡はご遠慮ください。
        <br />
        掲載内容はAIによる要約を含みます。誤りを見つけられた場合も、この窓口までお知らせください。
      </>
    ),
    answerText: `運営者（${siteConfig.operator.name}）までご連絡ください。なお、チームみらいの公式窓口や${siteConfig.councilName}への連絡はご遠慮ください。掲載内容はAIによる要約を含みます。誤りを見つけられた場合も、この窓口までお知らせください。`,
  },
  ...(isAiChatEnabled
    ? [
        {
          question: "AIアシスタントとの対話履歴はサーバー上に残りますか？",
          answer: (
            <>
              AIアシスタントとの対話内容（質問や回答など）をサーバー上に保管しています。これは、以下の目的のために行っています。
              <ul>
                <li>・サービス品質の向上（回答内容の改善・バグ修正など）</li>
                <li>・不正利用やシステム障害の検知・防止</li>
              </ul>
              また、将来的には、対話履歴をもとに以下のような機能を提供する可能性があります。
              <ul>
                <li>
                  ・利用者ごとの対話継続性の確保（過去の質問内容を踏まえた応答）
                </li>
                <li>・パーソナライズされた体験（おすすめ議案の提示など）</li>
              </ul>
              保存されたデータは、厳重なセキュリティのもと管理され、第三者に提供されることはありません。
            </>
          ),
          answerText:
            "AIアシスタントとの対話内容（質問や回答など）をサーバー上に保管しています。目的はサービス品質の向上と、不正利用やシステム障害の検知・防止です。将来的には、利用者ごとの対話継続性の確保やパーソナライズされた体験の提供に使う可能性があります。保存されたデータは厳重なセキュリティのもと管理され、第三者に提供されることはありません。",
        } satisfies FaqItem,
      ]
    : []),
  {
    question: "「注目の議案」はどのような基準で選ばれているのでしょうか？",
    answer: (
      <>
        議案の内容や報道の状況などを見ながら、注目度の高い議案を開発者で選定しています。
      </>
    ),
    answerText:
      "議案の内容や報道の状況などを見ながら、注目度の高い議案を開発者で選定しています。",
  },
  {
    question: "「トピックス」はどのような基準で選ばれているのでしょうか？",
    answer: (
      <>
        次のいずれかに当てはまるものを取り上げています。
        <ul>
          <li>
            ・{siteConfig.councilName}
            の判断が分かれたもの（否決・不採択、賛否が割れた採決）
          </li>
          <li>
            ・市民の負担や暮らしに直接関わるもの（使用料、税、子育て、学校、災害）
          </li>
          <li>・市が方針を変えた、または見送ったもの</li>
        </ul>
      </>
    ),
    answerText: `次のいずれかに当てはまるものを取り上げています。${siteConfig.councilName}の判断が分かれたもの（否決・不採択、賛否が割れた採決）、市民の負担や暮らしに直接関わるもの（使用料、税、子育て、学校、災害）、市が方針を変えた、または見送ったもの。`,
  },
  {
    question: "ふりがな（ルビ）はどのようにふっているのですか？",
    answer: (
      <>
        ふりがな（ルビ）は、一般財団法人ルビ財団の「ルビフルボタン」というサービスを使用して、自動で表示しています。
        固有名詞などふりがなが不正確な箇所については、今後手動で正しいふりがなに変更していく予定です。
      </>
    ),
    answerText:
      "ふりがな（ルビ）は、一般財団法人ルビ財団の「ルビフルボタン」というサービスを使用して、自動で表示しています。固有名詞などふりがなが不正確な箇所については、今後手動で正しいふりがなに変更していく予定です。",
  },
];

export default function FaqPage() {
  return (
    <LegalPageLayout
      title="よくあるご質問"
      description={`${siteConfig.siteName}に関するよくあるご質問をまとめています。`}
      className="pt-24 md:pt-12"
    >
      {/* 検索結果に質問と回答が出ることがある。画面には何も出ない */}
      <JsonLd
        data={buildFaqSchema(
          faqs.map((faq) => ({
            question: faq.question,
            answer: faq.answerText,
          }))
        )}
      />

      <Container className="space-y-10">
        {faqs.map((faq) => (
          <section key={faq.question} className="space-y-3">
            <LegalSectionTitle>{faq.question}</LegalSectionTitle>
            <LegalParagraph>{faq.answer}</LegalParagraph>
          </section>
        ))}
      </Container>
    </LegalPageLayout>
  );
}
