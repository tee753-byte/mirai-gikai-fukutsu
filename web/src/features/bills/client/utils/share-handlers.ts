import { siteConfig } from "@/config/site.config";

export function shareOnTwitter(message: string, url: string) {
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    message
  )}&url=${encodeURIComponent(url)}`;
  window.open(shareUrl, "_blank", "noopener,noreferrer");
}

export function shareOnFacebook(url: string) {
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    url
  )}`;
  window.open(shareUrl, "_blank", "noopener,noreferrer");
}

export function shareOnLine(message: string, url: string) {
  const text = `${message} ${url}`;
  const shareUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
  window.open(shareUrl, "_blank", "noopener,noreferrer");
}

export function shareOnThreads(message: string, url: string) {
  const text = `${message} ${url}`;
  const shareUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(
    text
  )}`;
  window.open(shareUrl, "_blank", "noopener,noreferrer");
}

/**
 * 記事のURLをクリップボードにコピーする。
 *
 * 市議会の情報はSNSより、メール・LINEのグループ・自治会の連絡などで
 * 回ることが多い。そのときに必要なのは「URLをコピーする」だけなので、
 * SNSの共有ボタンと並べて置いている。
 *
 * 本文は付けずURLだけをコピーする（ボタンの表記が「リンクをコピー」のため）。
 * @returns コピーできたら true
 */
export async function copyShareUrl(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error("Failed to copy:", error);
    return false;
  }
}

export async function shareNative(message: string, url: string) {
  // Web Share API が利用可能な場合
  if (navigator.share) {
    try {
      await navigator.share({
        title: siteConfig.siteName,
        text: message,
        url: url,
      });
    } catch (error) {
      // ユーザーがキャンセルした場合は何もしない
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Error sharing:", error);
      }
    }
  } else {
    // フォールバック: URLをクリップボードにコピー
    try {
      await navigator.clipboard.writeText(`${message} ${url}`);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }
}
