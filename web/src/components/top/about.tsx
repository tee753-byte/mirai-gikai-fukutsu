import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site.config";
import { LinkButton } from "./link-button";

export function About() {
  return (
    <div id="about" className="py-10 scroll-mt-24">
      <div className="flex flex-col gap-4">
        {/* ヘッダー */}
        <div className="flex flex-col gap-4">
          <h2>
            <Image
              src="/icons/about-typography.svg"
              alt="About"
              width={143}
              height={36}
              priority
            />
          </h2>
          <p className="text-sm font-bold text-primary-accent">
            {siteConfig.siteName}とは
          </p>
        </div>

        {/* コンテンツ */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h3 className="text-2xl font-bold leading-[43.2px]">
              市議会での議論を
              <br />
              できる限りわかりやすく
            </h3>
            <p className="text-[15px] leading-[28px] text-black">
              {siteConfig.siteName}は、{siteConfig.siteDescription}
              。市民の意見を政治に届けることを目指して、継続的にアップデートしていきます。
            </p>
            {/*
              情報が3段階で増えていくことを先に伝えておく。
              「なぜ議論の中身がまだ載っていないのか」という疑問への答えになる。
              所要期間や選定基準の細部はFAQ側に譲り、ここは短く保つ。
              会議録・議会だよりが揃ったタイミングはLINE・SNSでお知らせする運用。
            */}
            <p className="text-[13px] leading-relaxed text-[#404040]">
              議案は提出され次第、議案書に書かれた提案理由までを速報として掲載します。
              その後、{siteConfig.councilName}
              の会議録が公開されると審議の内容を、議会だよりが発行されると議員ごとの賛否を加えていきます。
            </p>
          </div>

          {/* もっと詳しく知るボタン */}
          {siteConfig.externalLinks.aboutNote && (
            <LinkButton
              href={siteConfig.externalLinks.aboutNote}
              icon={{
                src: "/icons/note-icon.png",
                alt: "note",
                width: 25,
                height: 25,
              }}
            >
              {siteConfig.siteName}とは
            </LinkButton>
          )}

          {/* 非公式運営時: 帰属・免責表記 */}
          {!siteConfig.features.showTeamMiraiSection && (
            <div className="flex flex-col gap-4 pt-2 border-t border-gray-200">
              <div className="flex flex-col gap-2 text-[13px] leading-relaxed text-[#404040]">
                <p>
                  このサイトは「チームみらい」開発の「みらい議会」をベースに作成しています。
                </p>

                {/*
                  政党「チームみらい」のサイトへのリンクは置かない。
                  このサイトは市議会全体を同じ基準で扱う中立の非公式サイトで、
                  特定の政党の入口を持つとその立場と読まれてしまうため。
                  元になったソフトウェアの出どころを示す下のリンクは残す。
                */}
                <div className="flex flex-col gap-4">
                  <LinkButton
                    href="https://gikai.team-mir.ai/"
                    icon={{
                      src: "/icons/interview-icon-3.svg",
                      alt: "",
                      width: 18,
                      height: 17,
                    }}
                  >
                    本家「みらい議会」（国会版）を見に行く
                  </LinkButton>
                </div>
              </div>

              <div className="flex flex-col gap-1 text-[13px] leading-relaxed text-[#404040]">
                <p>
                  このサイトは「チームみらい」の公式ではない、非公式のサイトです。
                  <br />
                  また、{siteConfig.cityName}および{siteConfig.councilName}が
                  運営する公式サイトでもありません。
                </p>
                <p>
                  ご意見や不具合等がございましたら、党公式や
                  {siteConfig.councilName}へのご連絡ではなく、
                  <br />
                  運営者の
                  {siteConfig.operator.contactUrl ? (
                    <Link
                      href={siteConfig.operator.contactUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 hover:opacity-70 transition-opacity"
                    >
                      {siteConfig.operator.name}
                    </Link>
                  ) : (
                    <span>{siteConfig.operator.name}</span>
                  )}
                  にご連絡お願いします。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
