type PreviewItem = {
  path: string;
  label: string;
  description: string;
};

type PreviewGroup = {
  name: string;
  items: PreviewItem[];
};

export const previewRegistry: PreviewGroup[] = [
  {
    name: "UI Primitives",
    items: [
      {
        path: "/dev/ui",
        label: "UI Components",
        description: "Button, Badge, Card, SpeechBubble",
      },
    ],
  },
  {
    name: "Bills",
    items: [
      {
        path: "/dev/features/bills/bill-card",
        label: "BillCard",
        description: "法案カードコンポーネント",
      },
      {
        path: "/dev/features/bills/bill-status-badge",
        label: "BillStatusBadge",
        description: "法案ステータスバッジ全バリアント",
      },
      {
        path: "/dev/features/bills/thumbnail-mapping",
        label: "サムネイル割り当て",
        description: "議案ごとにどの画像が出るかの一覧（目視確認用）",
      },
    ],
  },
  {
    name: "General Questions",
    items: [
      {
        path: "/dev/features/general-questions/chat-style",
        label: "チャット形式（案）",
        description: "質問・答弁をLINE風バブルで表示",
      },
      {
        path: "/dev/features/general-questions/overview",
        label: "概観ビュー（案）",
        description: "テーマタグで絞り込み、全議員の質問を俯瞰",
      },
      {
        path: "/dev/features/general-questions/topics-d",
        label: "テーマ別：市民向けキャッチー型",
        description: "市の方針を先に・大きく。カテゴリカラー",
      },
      {
        path: "/dev/features/general-questions/card-banner-prototype",
        label: "一般質問カードにバナー画像（案）",
        description: "山本祐平議員の3件で試作。議案カードの画像を流用",
      },
    ],
  },
  {
    name: "Interview",
    items: [
      {
        path: "/dev/features/interview/consent-modal",
        label: "ConsentModal",
        description: "AIインタビュー同意モーダル",
      },
      {
        path: "/dev/features/interview/public-consent-modal",
        label: "PublicConsentModal",
        description: "インタビュー公開設定モーダル",
      },
    ],
  },
];
