/**
 * seed-press-conferences.ts
 *
 * 福岡県知事定例記者会見データをDBに投入する。
 *
 * 使い方:
 *   tsx --env-file=../../.env fukuoka/seed-press-conferences.ts
 */

import { createAdminClient } from "../shared/helper";

type TurnInput = {
  speaker: "governor" | "reporter";
  speaker_name: string | null;
  content: string;
};

type ItemInput = {
  item_type: "announcement" | "qa";
  order_index: number;
  title: string;
  summary: string | null;
  turns: TurnInput[];
};

type PressConferenceInput = {
  slug: string;
  title: string;
  held_at: string;
  youtube_url: string | null;
  status: "published";
  items: ItemInput[];
};

const pressConferences: PressConferenceInput[] = [
  {
    slug: "2026-05-12",
    title: "令和8年5月 知事定例記者会見",
    held_at: "2026-05-12",
    youtube_url: null,
    status: "published",
    items: [
      {
        item_type: "announcement",
        order_index: 0,
        title: "「よかパパ料理・育児セミナー」を開催します",
        summary:
          "育休取得予定または子育て中の男性を対象に「よかパパ料理・育児セミナー」を開催。ママが「パパにやってほしい家事」第1位は料理だが、パパの料理実施率（46.2%）とママの認識（31.1%）にズレがある。セミナーではワンパン料理・取り分け離乳食・育児ワークを実施。県内15地域で順次開催、参加費無料（6月27日〜7月5日の日程決定）。知事も7月4日のももち文化センターでの料理教室に参加予定。",
        turns: [],
      },
      {
        item_type: "qa",
        order_index: 1,
        title: "育児研修の具体的内容",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speaker_name: null,
            content:
              "育児研修について、具体的にどういう知識が習得できるのか教えてください。",
          },
          {
            speaker: "governor",
            speaker_name: "子育て支援課",
            content:
              "参加者が自分の性格で気になる点を含めてブレインストーミングし、「ママがイラッとするシチュエーション」を具体的に理解した上で、対応方法を学ぶ形式を採用しています。",
          },
        ],
      },
      {
        item_type: "qa",
        order_index: 2,
        title: "県が男性育児を推進する必要性",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speaker_name: null,
            content:
              "産院や民間団体でも同様のセミナーを実施していますが、県が推進する必要性は何ですか。",
          },
          {
            speaker: "governor",
            speaker_name: null,
            content:
              "少子化対策として、ワンオペでは女性が活躍できません。男女がパートナーとして「とも家事、とも育児」を行うことが重要です。育休取得率の上昇を目指していますが、「取るだけ育休」では意味がない。実際のスキル習得を通じて、育休の実質化を図る必要があります。",
          },
        ],
      },
      {
        item_type: "qa",
        order_index: 3,
        title: "男性育休取得率と目標値",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speaker_name: null,
            content: "県内企業の育休取得率は具体的に何%ですか。",
          },
          {
            speaker: "governor",
            speaker_name: null,
            content:
              "県の調査では現在49.5%です。1ヶ月以上の取得は58.1%。前年度は50%を超えていたため若干下降しましたが、基調としては上昇傾向にあります。",
          },
          {
            speaker: "reporter",
            speaker_name: null,
            content: "目標値は何%ですか。",
          },
          {
            speaker: "governor",
            speaker_name: null,
            content: "令和11年度で85%を目標としています。",
          },
        ],
      },
      {
        item_type: "qa",
        order_index: 4,
        title: "九州新幹線西九州ルートと南ルート",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speaker_name: null,
            content:
              "佐賀県知事が南ルート（佐賀空港周辺含む）での環境評価を要望したとの報道がありますが、知事のお考えは。",
          },
          {
            speaker: "governor",
            speaker_name: null,
            content:
              "佐賀県に確認したところ、特定ルートを要求したわけではなく、広く幅を持った議論を求めたとの回答でした。国交省事務次官は南ルートについて「軟弱地盤で施工困難かつ事業費が高額化する」と指摘しています。福岡県を経由するルートであれば本県にも大きな負担が生じるため、南ルートが検討されるなら本県の意向確認が必要と考えています。現時点では佐賀県・国交省からの連絡はありません。",
          },
        ],
      },
      {
        item_type: "qa",
        order_index: 5,
        title: "部課長会パーティー券購入問題の調査状況",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speaker_name: null,
            content:
              "ヒアリングの実施状況と今後の通知・研修の予定を教えてください。",
          },
          {
            speaker: "governor",
            speaker_name: null,
            content:
              "地方公務員法や政治資金規正法との適合性について調査中です。対象者が多いため完了まで時間を要する見込みですが、ヒアリング完了を待たずに一定の方向性が見えれば、5月中に総務部長通知を発出する予定です。併せて職階別研修で徹底を図る方針です。",
          },
        ],
      },
      {
        item_type: "qa",
        order_index: 6,
        title: "イラン情勢への県の対応",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speaker_name: null,
            content: "現在の影響と今後の対応策を教えてください。",
          },
          {
            speaker: "governor",
            speaker_name: null,
            content:
              "経済活動全般に徐々に影響が出始めています。相談窓口に10件程度の相談が寄せられており、資金繰り対策として「低利の緊急経済対策資金」を案内しています。5月1日には価格転嫁の無料相談窓口を開設し、公共工事では単品スライド条項を適切に適用中です。国の動向を注視しながら、商工団体などの声を把握し臨機応変に対応していきます。",
          },
        ],
      },
      {
        item_type: "qa",
        order_index: 7,
        title: "副首都構想のプロジェクトチーム進捗",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speaker_name: null,
            content: "法案成立を目指すなか、県の検討状況を教えてください。",
          },
          {
            speaker: "governor",
            speaker_name: null,
            content:
              "現在法案骨子段階で、与党・国会審議を見守る必要があります。前進点として「特別区設置が必須でなく、県と市の連携協約で代替可能」と判明しました。「東京一極集中の是正」「多極分散型経済圏の構築」を狙いとして、高島福岡市長、武内北九州市長と「3者で一緒に取りに行く」と意思確認済みです。県がイニシアチブを取ることが重要で、具体的な連携協約の内容は法案化プロセスを見守りながら検討します。",
          },
        ],
      },
      {
        item_type: "qa",
        order_index: 8,
        title: "九州新幹線南ルート検討時の県の意向表明",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speaker_name: null,
            content:
              "南ルート検討の際に県の意向を確認すべきとの発言は、佐賀県や国交省に伝えていますか。",
          },
          {
            speaker: "governor",
            speaker_name: null,
            content:
              "未伝達です。今日ここで初めて話しました。ただし、福岡県内での環境アセス実施となれば当然県にも事前連絡があると考えています。",
          },
        ],
      },
      {
        item_type: "qa",
        order_index: 9,
        title: "副首都構想の申請主体と3者協議",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speaker_name: null,
            content: "申請は県が核となるのですか。",
          },
          {
            speaker: "governor",
            speaker_name: null,
            content:
              "現在の法案骨子では「道府県が対象」となっているため、県が主体となります。",
          },
          {
            speaker: "reporter",
            speaker_name: null,
            content: "北九州市、福岡市と何回協議を重ねましたか。",
          },
          {
            speaker: "governor",
            speaker_name: null,
            content:
              "3人の直接面談は昨年11月の政府予算要望時が主ですが、電話などでの個別協議は随時実施しています。",
          },
          {
            speaker: "reporter",
            speaker_name: null,
            content: "連携協約の具体的内容の検討は進んでいますか。",
          },
          {
            speaker: "governor",
            speaker_name: null,
            content:
              "大阪府の事例を参考に勉強中ですが、それが必ずしも法案になるとは限りません。国案が固まった後、より詳しく話し合う予定です。",
          },
        ],
      },
      {
        item_type: "qa",
        order_index: 10,
        title: "令和8年度市場公募債の発行戦略",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speaker_name: null,
            content:
              "中東情勢による金利上昇を背景に、令和8年度の市場公募債発行方針は。20年債・5年債・10年債の各年限別発行額と、フレックス枠の活用方針、知事から財政課への指示内容を教えてください。",
          },
          {
            speaker: "governor",
            speaker_name: null,
            content:
              "不安定な金利環境を踏まえ、20年債の固定発行は予定せず、5年債・10年債の固定年限発行を昨年比減額し、フレックス枠を全体の約64%に増額して金利動向に対応します。4月6日に10年国債が27年ぶりに2.4%超となったため、直ちに財政課に「可能な限り前倒し発行」を指示しました。4月債は当初計画（5年債100億円・10年債100億円）を大幅に上回る実績（5年債300億円・10年債400億円）となり、5月にはグリーンボンド200億円発行予定です。今後も日銀会合動向やマーケットニーズを見極め機動的に対応します。",
          },
        ],
      },
      {
        item_type: "qa",
        order_index: 11,
        title: "バス事故を踏まえた県立学校への安全対策",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speaker_name: null,
            content:
              "磐越自動車道のマイクロバス事故を踏まえ、県内の対策について教えてください。",
          },
          {
            speaker: "governor",
            speaker_name: null,
            content:
              "生徒の安全・生命保護が最優先です。教育委員会と連携し、貸切バス使用時は基本を公共交通機関利用とし、やむを得ない場合は国交省ガイドに準拠して安全性を確認するよう指導しています。また学校ベースの貸切バスについては学校長判断のもと、教員または保護者の引率・保険契約確認・運転者の違反歴確認・保護者承諾・天候確認を実施するよう対応しています。4月8日午前に県立学校長にメールで注意喚起を実施しました。",
          },
        ],
      },
      {
        item_type: "qa",
        order_index: 12,
        title: "県立学校のバス使用実態調査",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speaker_name: null,
            content:
              "新潟県は実態調査を実施していますが、福岡県の状況は。",
          },
          {
            speaker: "governor",
            speaker_name: "体育スポーツ健康課",
            content:
              "緊急調査を実施しました。昨年度実績は、貸切バス使用：2,454件、自校バスや保護者会等バス使用：1,143件でした。件数の多寡については比較対象がないため「多い」とは評価しておらず、県立全体で毎年同規模の遠征・大会参加が行われていると認識しています。",
          },
        ],
      },
      {
        item_type: "qa",
        order_index: 13,
        title: "マイクロバス運転者対策",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speaker_name: null,
            content:
              "ドライバーの問題点や改善策の検討状況を教えてください。",
          },
          {
            speaker: "governor",
            speaker_name: "体育スポーツ健康課",
            content:
              "現段階で注意喚起を実施中です。国も通知発出予定との報道があり、それを踏まえた県教委の新通知発出を検討する予定です。",
          },
        ],
      },
      {
        item_type: "qa",
        order_index: 14,
        title: "副首都構想と規制緩和・税制優遇への期待",
        summary: null,
        turns: [
          {
            speaker: "reporter",
            speaker_name: null,
            content:
              "東京一極集中是正に向けた規制緩和や税制優遇に期待しているのですか。",
          },
          {
            speaker: "governor",
            speaker_name: null,
            content:
              "もちろんです。企業が福岡に本社機能を移すには「経済的合理性」が必要で、規制緩和・税制優遇・その他支援策が必須です。首都中枢機能代替地域と異なり、副首都指定ではこれらの手当てが手厚くなると期待しており、副首都指定に手を挙げる大きな意味があります。",
          },
        ],
      },
    ],
  },
];

async function seedPressConferences() {
  const supabase = createAdminClient();
  console.log("🌱 Starting press conference seeding...");

  try {
    for (const pc of pressConferences) {
      console.log(`\n📰 Processing: ${pc.title} (${pc.slug})`);

      const { data: existing } = await supabase
        .from("press_conferences")
        .select("id")
        .eq("slug", pc.slug)
        .maybeSingle();

      if (existing) {
        console.log(`  ⏭️  Already exists, skipping.`);
        continue;
      }

      const { data: insertedPc, error: pcError } = await supabase
        .from("press_conferences")
        .insert({
          slug: pc.slug,
          title: pc.title,
          held_at: pc.held_at,
          youtube_url: pc.youtube_url,
          status: pc.status,
        })
        .select("id")
        .single();

      if (pcError || !insertedPc) {
        throw new Error(`Failed to insert press conference: ${pcError?.message}`);
      }

      console.log(`  ✅ Inserted press conference: ${insertedPc.id}`);

      for (const item of pc.items) {
        const { data: insertedItem, error: itemError } = await supabase
          .from("press_conference_items")
          .insert({
            press_conference_id: insertedPc.id,
            item_type: item.item_type,
            order_index: item.order_index,
            title: item.title,
            summary: item.summary,
          })
          .select("id")
          .single();

        if (itemError || !insertedItem) {
          throw new Error(
            `Failed to insert item "${item.title}": ${itemError?.message}`
          );
        }

        if (item.turns.length > 0) {
          const turnsToInsert = item.turns.map((turn, idx) => ({
            press_conference_item_id: insertedItem.id,
            speaker: turn.speaker,
            speaker_name: turn.speaker_name,
            content: turn.content,
            order_index: idx,
          }));

          const { error: turnsError } = await supabase
            .from("press_conference_turns")
            .insert(turnsToInsert);

          if (turnsError) {
            throw new Error(
              `Failed to insert turns for "${item.title}": ${turnsError.message}`
            );
          }
        }

        console.log(
          `  📝 Item: ${item.title} (${item.turns.length} turns)`
        );
      }
    }

    console.log("\n🎉 Press conference seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding press conferences:", error);
    process.exit(1);
  }
}

seedPressConferences();
