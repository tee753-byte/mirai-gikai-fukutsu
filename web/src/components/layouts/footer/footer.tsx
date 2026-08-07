"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site.config";
import { isInterviewPage } from "@/lib/page-layout-utils";
import { SITE_SNS_LINKS } from "@/lib/site-sns-links";
import { policyLinks, primaryLinks } from "./footer.config";

export function Footer() {
  const pathname = usePathname();

  if (isInterviewPage(pathname)) {
    return null;
  }

  return (
    <footer className="bg-mirai-gradient text-slate-900">
      <div className="mx-auto flex w-full max-w-[500px] flex-col items-center px-6 py-14 pb-20 text-center">
        {siteConfig.features.showTeamMiraiSection && <FooterLogoSection />}
        <FooterLineSection />
        <FooterSnsSection />
        <FooterPrimaryLinks />
        <FooterPolicies />
        <FooterDisclaimer />
        {siteConfig.features.showTeamMiraiSection && <FooterCopyright />}
      </div>
    </footer>
  );
}

function FooterLogoSection() {
  return (
    <div className="flex flex-col items-center text-center mb-9">
      <Link href="/" aria-label={`${siteConfig.siteName} トップページ`}>
        <Image
          src="/img/logo.svg"
          alt={siteConfig.siteName}
          width={150}
          height={128}
          className="h-auto"
        />
      </Link>
    </div>
  );
}

/**
 * このサイト自身のSNSアカウント（X / Instagram / Threads / Facebook）へのリンク。
 *
 * 政党「チームみらい」本体のアカウントではなく、このサイト専用のアカウント
 * （表示名はいずれも「みらい議会＠福津市 🔎 非公式」）に飛ぶ。特定の議員・会派・
 * 政党の広報にならないよう、このサイトの発信という位置づけを崩さないこと。
 * LINEの直後に置く。登録の負担が軽く一次チャネルになるLINEを先に見せ、
 * 他サービスへの導線であるこちらは後ろに回している。
 */
function FooterSnsSection() {
  return (
    <div className="w-full mb-6 flex flex-wrap items-center justify-center gap-4">
      {SITE_SNS_LINKS.map((link) => (
        <a
          key={link.key}
          href={link.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`${siteConfig.siteName}の${link.name}`}
          className="transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          <Image
            src={link.iconPath}
            alt=""
            width={28}
            height={28}
            className={
              link.hasBorder
                ? "rounded-full border border-mirai-border-light"
                : ""
            }
          />
        </a>
      ))}
    </div>
  );
}

/**
 * LINE公式アカウントの友だち追加。
 *
 * 規約リンクの列に混ぜると埋もれるため、独立したブロックとして先頭に置く。
 * 説明文で配信の頻度を約束しないこと（「更新のたびに通知」「毎週」等と書かない）。
 * 無料枠は月200通で、これは「友だち数×配信回数」で消費されるため、
 * 友だちが増えるほど送れる回数が減る。約束すると守れなくなり、ブロックされて次が届かなくなる。
 */
function FooterLineSection() {
  if (!siteConfig.externalLinks.line) {
    return null;
  }

  return (
    <div className="w-full mb-8 flex flex-col items-center gap-2">
      <a
        href={siteConfig.externalLinks.line}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center rounded-full bg-[#06C755] px-7 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        LINEで友だち追加
      </a>
      <p className="text-[11px] text-slate-600">
        {siteConfig.councilName}の動きを不定期にお届けします
      </p>
    </div>
  );
}

function FooterPrimaryLinks() {
  return (
    <nav aria-label="主要リンク" className="w-full mb-5">
      {/*
        項目が増えて折り返すようになったため、縦積み／横並びの切り替えをやめて
        常に折り返しありの横並びにする。項目の途中で改行されると
        「議案を検／索」のように読めなくなるので、リンクは折り返さない
      */}
      <ul className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-[13px] font-semibold text-slate-800">
        {primaryLinks.map((link, index) => (
          <li key={link.label} className="flex items-center gap-2">
            <Link
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noreferrer" : undefined}
              className="whitespace-nowrap transition-colors hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              {link.label}
            </Link>
            {/* 区切りのパイプ。装飾なので読み上げ対象から外す */}
            {index < primaryLinks.length - 1 && (
              <span aria-hidden="true" className="text-slate-400">
                ｜
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * 規約・FAQなどの補助的なリンク。
 *
 * 上段（サイトの主要ページ）と同じ見た目にすると役割の差が分からないため、
 * こちらは区切り線の下に置き、細く・小さく・薄い色にして一段下げて見せる。
 * 区切りもパイプではなく余白でとる。
 */
function FooterPolicies() {
  return (
    <div className="w-full border-t border-slate-900/10 pt-4 mb-4">
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] font-normal text-slate-600">
        {policyLinks.map((policy) => (
          <li key={policy.label}>
            <Link
              href={policy.href}
              target={policy.external ? "_blank" : undefined}
              rel={policy.external ? "noreferrer" : undefined}
              className="whitespace-nowrap underline underline-offset-2 decoration-slate-400 transition-colors hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              {policy.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterDisclaimer() {
  return (
    <p className="text-[11px] text-slate-500 text-center mt-1 mb-3">
      このサービスは政党チームみらいが運営しているものではありません
      <br />
      {siteConfig.cityName}・{siteConfig.councilName}の公式サイトでもありません
    </p>
  );
}

function FooterCopyright() {
  return (
    <div className="text-center text-sm font-medium text-slate-800">
      © 2025 Team Mirai All rights Reserved
    </div>
  );
}
