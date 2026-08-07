import Image from "next/image";
import { getBills } from "@/features/bills/server/loaders/get-bills";
import {
  getKeywordThumbnail,
  getTagThumbnail,
} from "@/features/bills/shared/utils/tag-thumbnail";

/**
 * 議案カードの画像の割り当てを、まとめて目視確認するための開発用ページ。
 *
 * カードを1枚ずつめくって見ると80件で心が折れるので、
 * 「議案名 → どの段階で決まったか → どの画像か」を1つの表にして出す。
 * 同じ画像が続いている箇所も色で分かるようにしている。
 *
 * /dev 以下は本番のサイトには出ない（robots も noindex）。
 */

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  title: string;
  tags: string[];
  src: string | undefined;
  /** どの段階で決まったか */
  source: "個別" | "キーワード" | "タグ" | "なし";
};

export default async function ThumbnailMappingPage() {
  const bills = await getBills();

  const rows: Row[] = bills.map((bill) => {
    const title = bill.bill_content?.title ?? "";
    const tags = (bill.tags ?? []).map((t) => t.label);

    if (bill.thumbnail_url) {
      return {
        id: bill.id,
        name: bill.name,
        title,
        tags,
        src: bill.thumbnail_url,
        source: "個別",
      };
    }
    const keyword = getKeywordThumbnail(bill.name, title);
    if (keyword) {
      return {
        id: bill.id,
        name: bill.name,
        title,
        tags,
        src: keyword,
        source: "キーワード",
      };
    }
    const tagSrc = getTagThumbnail(bill.tags, bill.name);
    return {
      id: bill.id,
      name: bill.name,
      title,
      tags,
      src: tagSrc,
      source: tagSrc ? "タグ" : "なし",
    };
  });

  // 同じ画像が何件に使われているか。多いものほど「同じ写真が並ぶ」問題が大きい
  const countBySrc = new Map<string, number>();
  for (const row of rows) {
    const key = row.src ?? "(画像なし)";
    countBySrc.set(key, (countBySrc.get(key) ?? 0) + 1);
  }
  const duplicates = [...countBySrc.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">議案サムネイルの割り当て確認</h1>
        <p className="mt-2 text-sm text-mirai-text-secondary">
          全{rows.length}件。「キーワード」で決まったものが増えるほど、
          同じ写真が並ぶ問題が減る。
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="font-bold">画像ごとの使用件数（多い順）</h2>
        <ul className="text-sm space-y-1">
          {duplicates.map(([src, count]) => (
            <li key={src} className="flex items-center gap-2">
              <span
                className={
                  count >= 5 ? "font-bold text-red-700" : "text-mirai-text"
                }
              >
                {count}件
              </span>
              <span className="text-mirai-text-secondary">{src}</span>
              {count >= 5 && (
                <span className="text-xs text-red-700">← 要分割</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold">議案ごとの割り当て</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">画像</th>
                <th className="p-2">決め方</th>
                <th className="p-2">議案名</th>
                <th className="p-2">タグ</th>
                <th className="p-2">パス</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b align-top">
                  <td className="p-2">
                    {row.src ? (
                      <Image
                        src={row.src}
                        alt=""
                        width={64}
                        height={40}
                        className="object-cover rounded"
                      />
                    ) : (
                      <span className="text-xs text-red-700">なし</span>
                    )}
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <span
                      className={
                        row.source === "キーワード"
                          ? "font-bold text-green-700"
                          : "text-mirai-text-secondary"
                      }
                    >
                      {row.source}
                    </span>
                  </td>
                  <td className="p-2">
                    <div>{row.name}</div>
                    <div className="text-xs text-mirai-text-secondary">
                      {row.title}
                    </div>
                  </td>
                  <td className="p-2 text-xs whitespace-nowrap">
                    {row.tags.join(", ")}
                  </td>
                  <td className="p-2 font-mono text-xs">{row.src ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
