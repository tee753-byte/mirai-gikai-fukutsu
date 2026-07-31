import { type NextRequest, NextResponse } from "next/server";
import {
  DIFFICULTY_COOKIE_NAME,
  DIFFICULTY_COOKIE_OPTIONS,
  type DifficultyLevelEnum,
  VALID_DIFFICULTY_LEVELS,
} from "./features/bill-difficulty/shared/types";
import {
  createUnauthorizedResponse,
  getBasicAuthConfig,
  validateBasicAuth,
} from "./lib/basic-auth";

export function middleware(request: NextRequest) {
  // /dev routes: 本番では404、開発ではauthスキップ
  if (request.nextUrl.pathname.startsWith("/dev")) {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.rewrite(new URL("/not-found", request.url));
    }
    return NextResponse.next();
  }

  const response = _handleDifficultyCookie(request);

  const authConfig = getBasicAuthConfig();

  // Basic認証の設定がない場合はスキップ
  if (!authConfig) {
    return response;
  }

  // 静的アセット（config.matcherで除外済み）以外は全リクエストを認証対象にする。
  // HTML/API/RSC/sitemap等を問わず保護し、User-Agent偽装による回避を防ぐ。
  if (validateBasicAuth(request, authConfig)) {
    return response;
  }

  return createUnauthorizedResponse();
}

// _next の静的アセット・画像最適化・favicon以外は全て認証対象にする
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

/**
 * 有効な難易度レベルかチェック
 */
export function isValidDifficultyLevel(
  value: string | null
): value is DifficultyLevelEnum {
  if (!value) return false;
  return VALID_DIFFICULTY_LEVELS.includes(value as DifficultyLevelEnum);
}

/**
 * URLパラメータからdifficultyを取得し、Cookieにセット
 */
function _handleDifficultyCookie(request: NextRequest): NextResponse {
  const { searchParams } = new URL(request.url);
  const difficulty = searchParams.get("difficulty");

  const response = NextResponse.next();

  // 有効なdifficulty値の場合、Cookieにセット
  if (isValidDifficultyLevel(difficulty)) {
    response.cookies.set(
      DIFFICULTY_COOKIE_NAME,
      difficulty,
      DIFFICULTY_COOKIE_OPTIONS
    );
  }

  return response;
}
