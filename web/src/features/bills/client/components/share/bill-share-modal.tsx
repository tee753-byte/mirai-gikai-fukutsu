"use client";

import { Check, Link2 } from "lucide-react";
import Image from "next/image";
import type { KeyboardEvent, MouseEvent } from "react";
import { useEffect, useState } from "react";
import {
  copyShareUrl,
  shareNative,
  shareOnFacebook,
  shareOnLine,
  shareOnThreads,
  shareOnTwitter,
} from "@/features/bills/client/utils/share-handlers";

interface BillShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareMessage: string;
  shareUrl: string;
  thumbnailUrl?: string | null;
}

export function BillShareModal({
  isOpen,
  onClose,
  shareMessage,
  shareUrl,
  thumbnailUrl,
}: BillShareModalProps) {
  // コピーできたことを知らせる表示。数秒で元に戻す
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return;
    const timer = setTimeout(() => setIsCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [isCopied]);

  // モーダルを閉じたら次に開いたときのために状態を戻す
  useEffect(() => {
    if (!isOpen) setIsCopied(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const ok = await copyShareUrl(shareUrl);
    setIsCopied(ok);
  };

  // 共有ボタンの設定
  const shareButtons = [
    {
      name: "X (Twitter)",
      iconPath: "/icons/sns/icon_x.png",
      onClick: () => shareOnTwitter(shareMessage, shareUrl),
    },
    {
      name: "Facebook",
      iconPath: "/icons/sns/icon_facebook.png",
      onClick: () => shareOnFacebook(shareUrl),
    },
    {
      // LINEにはパソコン版アプリがあり、共有リンクはブラウザからでも動く。
      // 市民に広く届けるうえで有力な経路なので、パソコンでも隠さない
      name: "LINE",
      iconPath: "/icons/sns/icon_line.png",
      onClick: () => shareOnLine(shareMessage, shareUrl),
    },
    {
      name: "Threads",
      iconPath: "/icons/sns/icon_threads.png",
      onClick: () => shareOnThreads(shareMessage, shareUrl),
      className: "md:hidden",
    },
    {
      name: "共有",
      iconPath: "/icons/share-general.png",
      onClick: () => shareNative(shareMessage, shareUrl),
      className: "md:hidden",
    },
  ];

  const handleBackgroundClick = (e: MouseEvent<HTMLDivElement>) => {
    // 背景クリック時のみモーダルを閉じる
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleBackgroundKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Escapeキーでモーダルを閉じる
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-3"
      onClick={handleBackgroundClick}
      onKeyDown={handleBackgroundKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white rounded-2xl p-7 w-[370px] max-w-full flex flex-col items-center gap-9">
        {/* タイトル */}
        <h2 className="text-xl font-bold text-gray-800 text-center w-full">
          記事を共有する
        </h2>

        {/* サムネイル画像エリア */}
        {thumbnailUrl && (
          <div className="w-full h-[180px] relative rounded-md overflow-hidden">
            <Image
              src={thumbnailUrl}
              alt="記事のサムネイル"
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* シェアセクション */}
        <div className="flex flex-col items-center gap-4 w-full">
          <p className="text-base font-bold text-gray-800 text-center">
            シェアして市議会の議論をオープンに
          </p>

          {/*
            リンクのコピー。メール・LINEのグループ・自治会の連絡など、
            SNS以外で回すときに使うため、アイコンではなく文字のボタンにして
            他より押しやすくしている
          */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-800 px-6 py-3 text-base font-bold text-gray-800 hover:bg-mirai-surface-grouped"
          >
            {isCopied ? (
              <>
                <Check className="h-5 w-5" />
                コピーしました
              </>
            ) : (
              <>
                <Link2 className="h-5 w-5" />
                リンクをコピー
              </>
            )}
          </button>
          {/* 読み上げソフトにもコピーできたことを伝える */}
          <span aria-live="polite" className="sr-only">
            {isCopied ? "リンクをコピーしました" : ""}
          </span>

          {/* SNSアイコン */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {shareButtons.map((button) => (
              <button
                key={button.name}
                type="button"
                onClick={button.onClick}
                className={`w-12 h-12 flex items-center justify-center ${
                  button.className || ""
                }`}
              >
                <Image
                  src={button.iconPath}
                  alt={button.name}
                  width={48}
                  height={48}
                  className="w-12 h-12"
                />
              </button>
            ))}
          </div>
        </div>

        {/* 閉じるボタン */}
        <button
          type="button"
          onClick={onClose}
          className="w-[287px] max-w-full rounded-full px-6 py-3 font-bold text-base bg-mirai-gradient text-gray-800 border border-gray-800"
        >
          このまま閉じる
        </button>
      </div>
    </div>
  );
}
