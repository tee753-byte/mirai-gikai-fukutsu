import {
  bills,
  tags,
  councilSessions,
  factions,
  committees,
  createFactionStances,
  createBillsTags,
  createInterviewConfig,
  createInterviewQuestions,
  createInterviewSessions,
  createInterviewMessages,
  createInterviewReports,
  createDemoSession,
  createDemoMessages,
  createDemoReport,
  createAdditionalDemoSessions,
  createAdditionalDemoMessages,
  createAdditionalDemoReports,
  DEMO_REPORT_ID,
  DEMO_REPORT_ID_WORK,
  DEMO_REPORT_ID_DAILY,
  DEMO_REPORT_ID_CITIZEN,
} from "./data";
import { createBillContents } from "./bill-contents-data";
import {
  createShippingBillInterviewConfig,
  createShippingBillQuestions,
  createShippingBillSessions,
  createShippingBillMessages,
  createShippingBillReports,
} from "./shipping-bill-data";
import { createAdminClient, clearAllData } from "../shared/helper";
import { generalQuestionsBySession } from "../fukutsu/general-questions-data";
import { R8_3_SESSION_SLUG } from "../fukutsu/bills-r8-3";
import { seedBillsR8_3 } from "../fukutsu/seed-bills-r8-3";
import {
  PLAIN_TEXTS as PLAIN_TEXTS_R7_12,
  R7_12_SESSION_SLUG,
  R7_12_SOURCE_URL,
  decidedAt as decidedAtR7_12,
  sanitizeR7_12Debates,
  submittedAt as submittedAtR7_12,
} from "../fukutsu/bills-r7-12";
import {
  PLAIN_TEXTS as PLAIN_TEXTS_R8_1,
  R8_1_SESSION_SLUG,
  R8_1_SOURCE_URL,
  decidedAt as decidedAtR8_1,
  submittedAt as submittedAtR8_1,
} from "../fukutsu/bills-r8-1";
import {
  PLAIN_TEXTS as PLAIN_TEXTS_R8_2,
  R8_2_SESSION_SLUG,
  R8_2_SOURCE_URL,
  decidedAt as decidedAtR8_2,
  submittedAt as submittedAtR8_2,
} from "../fukutsu/bills-r8-2";
import { seedBillsForSession } from "../fukutsu/seed-bills-common";
import r7_12BillVotes from "../fukutsu/data/r7-12-bill-votes.json" with {
  type: "json",
};
import r8_1BillVotes from "../fukutsu/data/r8-1-bill-votes.json" with {
  type: "json",
};
import r8_2BillVotes from "../fukutsu/data/r8-2-bill-votes.json" with {
  type: "json",
};
import { seedMemberVotes } from "../fukutsu/seed-member-votes";
import { seedMemberVotesR7_12 } from "../fukutsu/seed-member-votes-r7-12";

async function seedDatabase() {
  const supabase = createAdminClient();
  console.log("🌱 Starting database seeding...");

  try {
    await clearAllData(supabase);

    // Insert tags
    console.log("🏷️  Inserting tags...");
    const { data: insertedTags, error: tagsError } = await supabase
      .from("tags")
      .insert(tags)
      .select("id, label");

    if (tagsError) {
      throw new Error(`Failed to insert tags: ${tagsError.message}`);
    }

    if (!insertedTags) {
      throw new Error("No tags were inserted");
    }

    console.log(`✅ Inserted ${insertedTags.length} tags`);

    // Insert council sessions
    console.log("🏛️  Inserting council sessions...");
    const { data: insertedCouncilSessions, error: councilSessionsError } =
      await supabase
        .from("council_sessions")
        .insert(councilSessions)
        .select("id, slug");

    if (councilSessionsError) {
      throw new Error(
        `Failed to insert council sessions: ${councilSessionsError.message}`
      );
    }

    if (!insertedCouncilSessions) {
      throw new Error("No council sessions were inserted");
    }

    console.log(
      `✅ Inserted ${insertedCouncilSessions.length} council sessions`
    );

    // Insert committees
    console.log("🏢 Inserting committees...");
    const { data: insertedCommittees, error: committeesError } = await supabase
      .from("committees")
      .insert(committees)
      .select("id, name");

    if (committeesError) {
      throw new Error(
        `Failed to insert committees: ${committeesError.message}`
      );
    }

    if (!insertedCommittees) {
      throw new Error("No committees were inserted");
    }

    console.log(`✅ Inserted ${insertedCommittees.length} committees`);

    // Insert factions
    console.log("🏛️  Inserting factions...");
    const { data: insertedFactions, error: factionsError } = await supabase
      .from("factions")
      .insert(factions)
      .select("id, name");

    if (factionsError) {
      throw new Error(
        `Failed to insert factions: ${factionsError.message}`
      );
    }

    if (!insertedFactions) {
      throw new Error("No factions were inserted");
    }

    console.log(`✅ Inserted ${insertedFactions.length} factions`);

    // Insert bills
    console.log("📄 Inserting bills...");
    const { data: insertedBills, error: billsError } = await supabase
      .from("bills")
      .insert(bills)
      .select("id, name");

    if (billsError) {
      throw new Error(`Failed to insert bills: ${billsError.message}`);
    }

    if (!insertedBills) {
      throw new Error("No bills were inserted");
    }

    console.log(`✅ Inserted ${insertedBills.length} bills`);

    // 議案を定例会に紐付ける
    // 福津版の bills は全件が councilSessions[0]（令和8年6月定例会）のものなので、
    // まとめて先頭の定例会に紐付ける。
    // 会期をまたいで議案を入れる場合は、data.ts 側に会期を持たせる形に変更すること。
    const currentSessionId = insertedCouncilSessions[0]?.id;
    if (currentSessionId) {
      for (const bill of insertedBills) {
        await supabase
          .from("bills")
          .update({ council_session_id: currentSessionId })
          .eq("id", bill.id);
      }
      console.log(
        `🔗 Linked ${insertedBills.length} bills to the current council session`
      );
    }

    // 令和8年3月定例会の議案（会議録から作成）
    // 議決結果・討論・提出者・賛成者まで入るため、上の6月定例会分とは別の流れで入れる。
    const r8_3Session = insertedCouncilSessions.find(
      (s) => s.slug === R8_3_SESSION_SLUG
    );
    if (r8_3Session) {
      console.log("📄 Inserting r8-3 bills...");
      await seedBillsR8_3(
        supabase,
        r8_3Session.id,
        new Map(insertedTags.map((t) => [t.label, t.id])),
        new Map(insertedCommittees.map((c) => [c.name, c.id]))
      );
    } else {
      console.log(
        `⚠️ Council session "${R8_3_SESSION_SLUG}" not found. Skipped its bills.`
      );
    }

    // 令和7年12月定例会・令和8年1月/2月臨時会の議案（会議録から作成）
    const tagIdByLabel = new Map(insertedTags.map((t) => [t.label, t.id]));
    const committeeIdByName = new Map(
      insertedCommittees.map((c) => [c.name, c.id])
    );

    const sessionsToSeed = [
      {
        slug: R7_12_SESSION_SLUG,
        label: "r7-12",
        // biome-ignore lint/suspicious/noExplicitAny: JSON importの型をBillVoteRecord[]に合わせるための簡易キャスト
        votes: sanitizeR7_12Debates(r7_12BillVotes as any),
        plainTexts: PLAIN_TEXTS_R7_12,
        sourceUrl: R7_12_SOURCE_URL,
        decidedAt: decidedAtR7_12,
        submittedAt: submittedAtR7_12,
      },
      {
        slug: R8_1_SESSION_SLUG,
        label: "r8-1",
        votes: r8_1BillVotes,
        plainTexts: PLAIN_TEXTS_R8_1,
        sourceUrl: R8_1_SOURCE_URL,
        decidedAt: decidedAtR8_1,
        submittedAt: submittedAtR8_1,
      },
      {
        slug: R8_2_SESSION_SLUG,
        label: "r8-2",
        votes: r8_2BillVotes,
        plainTexts: PLAIN_TEXTS_R8_2,
        sourceUrl: R8_2_SOURCE_URL,
        decidedAt: decidedAtR8_2,
        submittedAt: submittedAtR8_2,
      },
    ] as const;

    for (const s of sessionsToSeed) {
      const session = insertedCouncilSessions.find((cs) => cs.slug === s.slug);
      if (!session) {
        console.log(
          `⚠️ Council session "${s.slug}" not found. Skipped its bills.`
        );
        continue;
      }
      console.log(`📄 Inserting ${s.label} bills...`);
      await seedBillsForSession({
        supabase,
        sessionId: session.id,
        tagIdByLabel,
        committeeIdByName,
        slugLabel: s.label,
        // biome-ignore lint/suspicious/noExplicitAny: JSON importの型をBillVoteRecord[]に合わせるための簡易キャスト
        votes: s.votes as any,
        plainTexts: s.plainTexts,
        sourceUrl: s.sourceUrl,
        decidedAt: s.decidedAt,
        submittedAt: s.submittedAt,
      });
    }

    // 議員別の賛否（福津市議会だよりの賛否表から作成。r8-1・r8-2・r8-3が対象）
    console.log("🗳️  Inserting member votes...");
    const memberVoteSessionIds = [R8_1_SESSION_SLUG, R8_2_SESSION_SLUG, R8_3_SESSION_SLUG]
      .map((slug) => insertedCouncilSessions.find((cs) => cs.slug === slug)?.id)
      .filter((id): id is string => Boolean(id));
    const memberVotesCount = await seedMemberVotes(supabase, memberVoteSessionIds);
    console.log(`✅ Inserted ${memberVotesCount} bill member votes`);

    // 議員別の賛否（福津市議会だより84号の賛否表から作成。r7-12が対象）
    const r7_12SessionId = insertedCouncilSessions.find(
      (cs) => cs.slug === R7_12_SESSION_SLUG
    )?.id;
    const memberVotesR7_12Count = r7_12SessionId
      ? await seedMemberVotesR7_12(supabase, [r7_12SessionId])
      : 0;
    console.log(
      `✅ Inserted ${memberVotesR7_12Count} bill member votes (r7-12)`
    );

    // 一般質問（福津市議会）
    // 令和8年6月定例会は一般質問PDFから作成しており、答弁は議事録の公開後に追加する。
    // 令和8年3月定例会は会議録から質問・答弁の両方を作成している。
    console.log("🙋 Inserting general questions...");
    let insertedGeneralQuestionsCount = 0;

    for (const session of generalQuestionsBySession) {
      const questionsSession = insertedCouncilSessions.find(
        (s) => s.slug === session.session_slug
      );

      if (!questionsSession) {
        console.log(
          `⚠️ Council session "${session.session_slug}" not found. Skipped its general questions.`
        );
        continue;
      }

      // 会議録から取り出したやり取り全文を氏名で突き合わせる。
      // 会議録は「山本祐平」、シードは「山本 祐平」と全角スペースの有無が違うため、
      // 空白を除いた形をキーにする。
      const stripSpaces = (name: string) => name.replace(/[\s　]/g, "");
      const transcriptByName = new Map(
        (session.transcripts ?? []).map((t) => [
          stripSpaces(t.questioner_name),
          t,
        ])
      );

      const rows = session.questions.map((q) => ({
        council_session_id: questionsSession.id,
        questioner_name: q.questioner_name,
        questioner_party: q.questioner_party,
        question_order: q.question_order,
        session_day: q.session_day ?? 1,
        summary: q.summary,
        topics: q.topics,
        raw_text:
          transcriptByName.get(stripSpaces(q.questioner_name))?.raw_text ?? null,
        source_url: session.source_url,
        publish_status: "published",
      }));

      // 突き合わせできなかったやり取りがあれば、氏名の表記ゆれを疑う
      const matched = rows.filter((r) => r.raw_text !== null).length;
      const expected = transcriptByName.size;
      if (matched !== expected) {
        console.log(
          `⚠️ "${session.session_slug}": やり取り全文 ${expected} 件のうち ${matched} 件しか議員に紐づきませんでした。氏名の表記を確認してください。`
        );
      }

      const { data: insertedQuestions, error: questionsError } = await supabase
        .from("general_questions")
        .insert(rows)
        .select("id");

      if (questionsError) {
        throw new Error(
          `Failed to insert general questions for "${session.session_slug}": ${questionsError.message}`
        );
      }

      insertedGeneralQuestionsCount += insertedQuestions?.length ?? 0;
    }

    console.log(
      `✅ Inserted ${insertedGeneralQuestionsCount} general questions`
    );

    // Insert bill_contents
    console.log("📚 Inserting bill contents...");
    const billContents = createBillContents(insertedBills);

    const { data: insertedContents, error: contentsError } = await supabase
      .from("bill_contents")
      .insert(billContents)
      .select("id");

    if (contentsError) {
      throw new Error(
        `Failed to insert bill contents: ${contentsError.message}`
      );
    }

    if (!insertedContents) {
      throw new Error("No bill contents were inserted");
    }

    console.log(`✅ Inserted ${insertedContents.length} bill contents`);

    // Insert faction_stances (みらい会派の見解)
    console.log("🎯 Inserting faction stances...");
    const miraiFaction = insertedFactions.find((f) => f.name === "mirai");
    let insertedStancesCount = 0;

    if (miraiFaction) {
      const factionStances = createFactionStances(
        insertedBills,
        miraiFaction.id
      );

      const { data: insertedStances, error: stancesError } = await supabase
        .from("faction_stances")
        .insert(factionStances)
        .select("id");

      if (stancesError) {
        throw new Error(
          `Failed to insert faction stances: ${stancesError.message}`
        );
      }

      if (insertedStances) {
        insertedStancesCount = insertedStances.length;
      }
    }

    console.log(`✅ Inserted ${insertedStancesCount} faction stances`);

    // Insert bills_tags (関連付け)
    console.log("🔗 Inserting bills-tags relations...");
    const billsTags = createBillsTags(insertedBills, insertedTags);

    const { data: insertedBillsTags, error: billsTagsError } = await supabase
      .from("bills_tags")
      .insert(billsTags)
      .select();

    if (billsTagsError) {
      throw new Error(
        `Failed to insert bills-tags relations: ${billsTagsError.message}`
      );
    }

    if (!insertedBillsTags) {
      throw new Error("No bills-tags relations were inserted");
    }

    console.log(`✅ Inserted ${insertedBillsTags.length} bills-tags relations`);

    // Insert interview config (for first bill)
    console.log("💬 Inserting interview config...");
    const interviewConfigData = createInterviewConfig(insertedBills);
    let insertedQuestionsCount = 0;
    let insertedSessionsCount = 0;
    let insertedMessagesCount = 0;
    let insertedReportsCount = 0;

    if (interviewConfigData) {
      const { data: insertedConfig, error: configError } = await supabase
        .from("interview_configs")
        .insert(interviewConfigData)
        .select("id")
        .single();

      if (configError) {
        throw new Error(
          `Failed to insert interview config: ${configError.message}`
        );
      }

      if (insertedConfig) {
        console.log(`✅ Inserted interview config`);

        // Insert interview questions
        console.log("❓ Inserting interview questions...");
        const questionsData = createInterviewQuestions(insertedConfig.id);

        const { data: insertedQuestions, error: questionsError } =
          await supabase
            .from("interview_questions")
            .insert(questionsData)
            .select("id");

        if (questionsError) {
          throw new Error(
            `Failed to insert interview questions: ${questionsError.message}`
          );
        }

        if (insertedQuestions) {
          insertedQuestionsCount = insertedQuestions.length;
          console.log(
            `✅ Inserted ${insertedQuestionsCount} interview questions`
          );
        }

        // Insert interview sessions
        console.log("🗣️ Inserting interview sessions...");
        const sessionsData = createInterviewSessions(insertedConfig.id);

        const { data: insertedSessions, error: sessionsError } = await supabase
          .from("interview_sessions")
          .insert(sessionsData)
          .select("id");

        if (sessionsError) {
          throw new Error(
            `Failed to insert interview sessions: ${sessionsError.message}`
          );
        }

        if (insertedSessions && insertedSessions.length > 0) {
          insertedSessionsCount = insertedSessions.length;
          console.log(
            `✅ Inserted ${insertedSessionsCount} interview sessions`
          );

          // Insert interview messages
          console.log("💬 Inserting interview messages...");
          const sessionIds = insertedSessions.map((s) => s.id);
          const messagesData = createInterviewMessages(sessionIds);

          const { data: insertedMessages, error: messagesError } =
            await supabase
              .from("interview_messages")
              .insert(messagesData)
              .select("id");

          if (messagesError) {
            throw new Error(
              `Failed to insert interview messages: ${messagesError.message}`
            );
          }

          if (insertedMessages) {
            insertedMessagesCount = insertedMessages.length;
            console.log(
              `✅ Inserted ${insertedMessagesCount} interview messages`
            );
          }

          // Insert interview reports
          console.log("📊 Inserting interview reports...");
          const reportsData = createInterviewReports(sessionIds);

          const { data: insertedReports, error: reportsError } = await supabase
            .from("interview_report")
            .insert(reportsData)
            .select("id");

          if (reportsError) {
            throw new Error(
              `Failed to insert interview reports: ${reportsError.message}`
            );
          }

          if (insertedReports) {
            insertedReportsCount = insertedReports.length;
            console.log(
              `✅ Inserted ${insertedReportsCount} interview reports`
            );
          }

          // Insert demo session, messages, and report with fixed IDs
          console.log("🎯 Inserting demo data with fixed IDs...");

          const demoSession = createDemoSession(insertedConfig.id);
          const { error: demoSessionError } = await supabase
            .from("interview_sessions")
            .insert(demoSession);

          if (demoSessionError) {
            throw new Error(
              `Failed to insert demo session: ${demoSessionError.message}`
            );
          }

          const demoMessages = createDemoMessages();
          const { error: demoMessagesError } = await supabase
            .from("interview_messages")
            .insert(demoMessages);

          if (demoMessagesError) {
            throw new Error(
              `Failed to insert demo messages: ${demoMessagesError.message}`
            );
          }

          const demoReport = createDemoReport();
          const { error: demoReportError } = await supabase
            .from("interview_report")
            .insert(demoReport);

          if (demoReportError) {
            throw new Error(
              `Failed to insert demo report: ${demoReportError.message}`
            );
          }

          console.log(`✅ Inserted demo data`);
          console.log(
            `   Demo report URL: /report/${DEMO_REPORT_ID}/chat-log`
          );

          // Insert additional demo sessions, messages, and reports (for 4 role types)
          console.log(
            "🎭 Inserting additional demo data for all role types..."
          );

          const additionalDemoSessions = createAdditionalDemoSessions(
            insertedConfig.id
          );
          const { error: additionalSessionsError } = await supabase
            .from("interview_sessions")
            .insert(additionalDemoSessions);

          if (additionalSessionsError) {
            throw new Error(
              `Failed to insert additional demo sessions: ${additionalSessionsError.message}`
            );
          }

          const additionalDemoMessages = createAdditionalDemoMessages();
          const { error: additionalMessagesError } = await supabase
            .from("interview_messages")
            .insert(additionalDemoMessages);

          if (additionalMessagesError) {
            throw new Error(
              `Failed to insert additional demo messages: ${additionalMessagesError.message}`
            );
          }

          const additionalDemoReports = createAdditionalDemoReports();
          const { error: additionalReportsError } = await supabase
            .from("interview_report")
            .insert(additionalDemoReports);

          if (additionalReportsError) {
            throw new Error(
              `Failed to insert additional demo reports: ${additionalReportsError.message}`
            );
          }

          console.log(
            `✅ Inserted additional demo data for all 4 role types`
          );
          console.log(
            `   subject_expert: /report/${DEMO_REPORT_ID}/chat-log`
          );
          console.log(
            `   work_related: /report/${DEMO_REPORT_ID_WORK}/chat-log`
          );
          console.log(
            `   daily_life_affected: /report/${DEMO_REPORT_ID_DAILY}/chat-log`
          );
          console.log(
            `   general_citizen: /report/${DEMO_REPORT_ID_CITIZEN}/chat-log`
          );
        }
      }
    } else {
      console.log("⚠️ Skipped interview config (no bills found)");
    }

    // === 船荷証券法案のインタビューデータ（トピック解析テスト用）===
    console.log("🚢 Inserting shipping bill interview data...");
    const shippingConfig = createShippingBillInterviewConfig(insertedBills);
    let shippingSessionsCount = 0;
    let shippingReportsCount = 0;

    if (shippingConfig) {
      const { data: insertedShippingConfig, error: shippingConfigError } =
        await supabase
          .from("interview_configs")
          .insert(shippingConfig)
          .select("id")
          .single();

      if (shippingConfigError) {
        throw new Error(
          `Failed to insert shipping bill config: ${shippingConfigError.message}`
        );
      }

      if (insertedShippingConfig) {
        // Questions
        const shippingQuestions = createShippingBillQuestions(
          insertedShippingConfig.id
        );
        const { error: sqError } = await supabase
          .from("interview_questions")
          .insert(shippingQuestions);
        if (sqError) {
          throw new Error(
            `Failed to insert shipping questions: ${sqError.message}`
          );
        }

        // Sessions (100件)
        const shippingSessions = createShippingBillSessions(
          insertedShippingConfig.id
        );
        const { data: insertedShippingSessions, error: ssError } =
          await supabase
            .from("interview_sessions")
            .insert(shippingSessions)
            .select("id");
        if (ssError) {
          throw new Error(
            `Failed to insert shipping sessions: ${ssError.message}`
          );
        }

        if (insertedShippingSessions) {
          shippingSessionsCount = insertedShippingSessions.length;
          const shippingSessionIds = insertedShippingSessions.map(
            (s) => s.id
          );

          // Messages
          const shippingMessages =
            createShippingBillMessages(shippingSessionIds);
          const { error: smError } = await supabase
            .from("interview_messages")
            .insert(shippingMessages);
          if (smError) {
            throw new Error(
              `Failed to insert shipping messages: ${smError.message}`
            );
          }

          // Reports (100件、各3 opinions)
          const shippingReports =
            createShippingBillReports(shippingSessionIds);
          const { data: insertedShippingReports, error: srError } =
            await supabase
              .from("interview_report")
              .insert(shippingReports)
              .select("id");
          if (srError) {
            throw new Error(
              `Failed to insert shipping reports: ${srError.message}`
            );
          }

          if (insertedShippingReports) {
            shippingReportsCount = insertedShippingReports.length;
          }
        }

        console.log(
          `✅ Shipping bill: ${shippingSessionsCount} sessions, ${shippingReportsCount} reports (each with 3 opinions)`
        );
      }
    }

    console.log("🎉 Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`  Council Sessions: ${insertedCouncilSessions.length}`);
    console.log(`  Committees: ${insertedCommittees.length}`);
    console.log(`  Factions: ${insertedFactions.length}`);
    console.log(`  Tags: ${insertedTags.length}`);
    console.log(`  Bills: ${insertedBills.length}`);
    console.log(`  Bill Contents: ${insertedContents.length}`);
    console.log(`  Faction Stances: ${insertedStancesCount}`);
    console.log(`  Bills-Tags Relations: ${insertedBillsTags.length}`);
    console.log(`  Interview Config: ${interviewConfigData ? 1 : 0}`);
    console.log(`  Interview Questions: ${insertedQuestionsCount}`);
    console.log(`  Interview Sessions: ${insertedSessionsCount}`);
    console.log(`  Interview Messages: ${insertedMessagesCount}`);
    console.log(`  Interview Reports: ${insertedReportsCount}`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
