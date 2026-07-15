import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  action: string;
  defaultValue?: string;
  hidden?: Record<string, string | undefined>;
};

/** JS不要のGETフォーム検索。他フィルタ条件は hidden で維持する */
export function JimuJigyoSearchForm({ action, defaultValue, hidden }: Props) {
  return (
    <form method="get" action={action} className="flex gap-2 items-center">
      {Object.entries(hidden ?? {}).map(([name, value]) =>
        value ? (
          <input key={name} type="hidden" name={name} value={value} />
        ) : null
      )}
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mirai-text-muted"
          aria-hidden
        />
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder="事業名・課室で検索"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-mirai-border bg-card text-mirai-text placeholder:text-mirai-text-placeholder focus:outline-none focus:border-primary"
        />
      </div>
      <Button type="submit" variant="outline" size="sm">
        検索
      </Button>
    </form>
  );
}
