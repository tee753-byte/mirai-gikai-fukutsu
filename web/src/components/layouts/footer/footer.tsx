"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site.config";
import { isInterviewPage } from "@/lib/page-layout-utils";
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
