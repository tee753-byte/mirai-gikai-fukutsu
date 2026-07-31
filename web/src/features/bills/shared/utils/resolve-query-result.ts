/**
 * Supabaseのクエリ結果から、正常な「0件」とDBエラーを区別して取り出す。
 * エラーを空配列にすり替えると、画面側で「該当者なし」と「取得できていない」の
 * 区別がつかなくなるため、エラー時は必ず throw する。
 */
export function resolveQueryResult<T>(
  result: { data: T[] | null; error: { message: string } | null },
  context: string
): T[] {
  if (result.error) {
    throw new Error(`Failed to fetch ${context}: ${result.error.message}`);
  }

  return result.data ?? [];
}
