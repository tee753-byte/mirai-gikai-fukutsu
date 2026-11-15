import type { Metadata } from "next";
import { Container } from "@/components/layouts/container";
import {
  LegalList,
  LegalPageLayout,
  LegalParagraph,
  LegalSectionTitle,
} from "@/components/layouts/legal-page-layout";
import { siteConfig } from "@/config/site.config";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: `${siteConfig.siteName}のプライバシーポリシー`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      className="bg-transparent pt-24 md:pt-12"
      title="プライバシーポリシー"
      description={`${siteConfig.siteName}における個人情報の取り扱いについてご説明します。`}
    >
      <Container className="space-y-8">
        <section className="space-y-4">
          <LegalSectionTitle>1. 個人情報の定義</LegalSectionTitle>
          <LegalParagraph>
            個人情報とは、以下のような情報により特定の個人を識別することができるものを指します。
          </LegalParagraph>
          <LegalList
            items={[
              "氏名、年齢、性別、住所、電話番号、職業、メールアドレス",
              "個人ごとに割り当てられたIDやパスワード、その他識別可能な記号など",
              "単体では個人の特定ができないものの、他の情報と容易に照合することができ、個人を特定できる情報",
            ]}
          />
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>2. 個人情報の収集目的と使用範囲</LegalSectionTitle>
          <LegalParagraph>
            個人情報をご提供いただく際には、ユーザーの同意に基づいて行うことを原則とし、無断で収集・利用することはありません。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>3. 第三者への情報提供について</LegalSectionTitle>
          <LegalParagraph>
            以下のいずれかに該当する場合を除き、利用者から提供された個人情報を第三者に開示・提供することはありません。
          </LegalParagraph>
          <LegalList
            items={[
              "利用者本人の同意がある場合",
              "利用者個人が識別されない形（他の情報と照合しても個人を特定できない場合）で提供する場合",
              "法令に基づく開示請求があった場合",
              "不正アクセスや規約違反など、利用者本人による違反が確認された場合",
              "第三者に対して不利益を与えると判断された場合",
              "公共の利益や利用者本人の利益のために必要と判断された場合",
            ]}
          />
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>4. 安全管理措置について</LegalSectionTitle>
          <LegalParagraph>
            個人情報の適切な管理を行うために、責任者を定めた上で、厳正な管理・監督体制を構築しています。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>5. Cookie（クッキー）について</LegalSectionTitle>
          <LegalParagraph>
            Cookieとは、サーバーが利用者の識別を目的として、利用者のブラウザに送信し、端末に保存される情報です。
          </LegalParagraph>
          {/*
            以前はGoogleアナリティクスを「使用しています」と書いていたが、本番には
            測定IDを設定しておらず実際には動いていなかった（2026-11-15、外部レビューで
            指摘・Vercelの環境変数で確認）。実態に合わせて書き直した。導入するときは
            先にここを書き戻すこと。
          */}
          <LegalParagraph>
            当ウェブサイトでは、Googleアナリティクスなど、Cookieを使って閲覧者を追跡するアクセス解析ツールは使用していません。導入する場合は、事前にこのページでお知らせします。なお、「説明をもっと詳しく」の表示切り替えを覚えておくためにCookieを使っていますが、閲覧者の識別には使用していません。
          </LegalParagraph>
          <LegalParagraph>
            アクセス解析には、当ウェブサイトを提供しているVercel社の機能（Vercel
            Web Analytics および Speed
            Insights）を使用しています。どのページがどれだけ閲覧されたか、ページの表示速度などを把握するためのもので、Cookieは使用せず、閲覧者個人を特定する情報も収集しません。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>6. 個人情報の保管期間</LegalSectionTitle>
          <LegalParagraph>
            取得した個人情報は、利用目的の達成に必要な期間保管した後、適切な方法により廃棄・削除いたします。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>
            7. プライバシーポリシーの改訂と通知について
          </LegalSectionTitle>
          <LegalParagraph>
            このプライバシーポリシーは、必要に応じて内容の見直しを行い、改訂されることがあります。その際、個別の通知は行いませんので、最新の情報については当ウェブサイトをご確認ください。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>8. 個人情報に関するお問い合わせ</LegalSectionTitle>
          <LegalParagraph>
            個人情報の確認・修正・削除・利用停止等をご希望される場合は、下記のお問い合わせ窓口までご連絡ください。なお、ご請求内容がご本人によるものであることが確認できた場合に限り、必要な調査を行い、その結果に基づき適切な対応を行います。
          </LegalParagraph>
          <LegalParagraph>お問い合わせ窓口</LegalParagraph>
          <LegalParagraph>
            {siteConfig.operator.name} 個人情報保護管理責任者
          </LegalParagraph>
          <LegalParagraph>
            {siteConfig.operator.contactUrl ? (
              <a
                href={siteConfig.operator.contactUrl}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                {siteConfig.operator.contactUrl}
              </a>
            ) : (
              <span>準備中です。公開までに問い合わせ窓口を設置します。</span>
            )}
          </LegalParagraph>
        </section>
      </Container>
    </LegalPageLayout>
  );
}
