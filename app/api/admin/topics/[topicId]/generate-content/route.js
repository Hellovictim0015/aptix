import { cookies } from "next/headers";
import { after } from "next/server";
import { getAuthFromCookieStore } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import {
  getOpenAIConfig,
  generateTopicStructuredContent,
  generateTopicMcqBatch,
  translateMcqBatchToHindi,
} from "@/lib/openai";

// Generation (notes in 2 languages + 100 MCQs + Hindi translation) takes several
// minutes — far longer than nginx's 60s proxy timeout. So POST only starts the
// job and returns at once; the work runs in `after()` and the admin page polls
// GET /api/admin/topics/[topicId] until content_status is 'ready' or 'failed'.
export const maxDuration = 900;

const TOTAL_MCQS = 100;
const BATCH_SIZE = 20;
const BATCH_LABELS = ["easy-to-moderate", "moderate", "moderate-to-hard", "hard", "mixed exam-style"];
// A job "generating" for longer than this is assumed dead (e.g. server restart).
const STALE_MINUTES = 20;

export async function POST(request, { params }) {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { topicId } = await params;
  const topic = await queryOne(
    `SELECT t.*, c.title AS course_title,
       (t.generation_started_at > NOW() - INTERVAL ${STALE_MINUTES} MINUTE) AS recently_started
     FROM topics t JOIN courses c ON c.id = t.course_id WHERE t.id = ?`,
    [topicId]
  );
  if (!topic) return Response.json({ error: "Topic not found" }, { status: 404 });

  if (topic.content_status === "generating" && topic.recently_started) {
    return Response.json({ ok: true, status: "generating", already_running: true }, { status: 202 });
  }

  const { apiKey, model } = await getOpenAIConfig();
  if (!apiKey) {
    return Response.json(
      { error: "No OpenAI API key configured. Add one in Admin → Settings first." },
      { status: 400 }
    );
  }

  await query(
    "UPDATE topics SET content_status = 'generating', generation_error = NULL, generation_started_at = NOW() WHERE id = ?",
    [topicId]
  );

  after(() => runGeneration({ topicId, topic, apiKey, model }));

  return Response.json({ ok: true, status: "generating" }, { status: 202 });
}

async function runGeneration({ topicId, topic, apiKey, model }) {
  try {
    const [contentEn, contentHi] = await Promise.all([
      generateTopicStructuredContent({
        apiKey,
        model,
        courseTitle: topic.course_title,
        topicTitle: topic.title,
        language: "english",
      }),
      generateTopicStructuredContent({
        apiKey,
        model,
        courseTitle: topic.course_title,
        topicTitle: topic.title,
        language: "hindi",
      }),
    ]);

    await query(
      `INSERT INTO topic_contents (topic_id, content_json, content_json_hi) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE content_json = VALUES(content_json), content_json_hi = VALUES(content_json_hi)`,
      [topicId, JSON.stringify(contentEn), JSON.stringify(contentHi)]
    );

    const allMcqs = [];
    const askedQuestions = [];
    let remaining = TOTAL_MCQS;
    let batchIndex = 0;

    while (remaining > 0) {
      const count = Math.min(BATCH_SIZE, remaining);
      const label = BATCH_LABELS[batchIndex % BATCH_LABELS.length];
      const batch = await generateTopicMcqBatch({
        apiKey,
        model,
        courseTitle: topic.course_title,
        topicTitle: topic.title,
        count,
        batchLabel: label,
        avoidQuestions: askedQuestions,
      });
      for (const m of batch) {
        allMcqs.push(m);
        askedQuestions.push(m.question);
      }
      remaining -= count;
      batchIndex += 1;
    }

    if (allMcqs.length === 0) {
      throw new Error("AI did not return any MCQs. Try again.");
    }

    const translatedMcqs = [];
    for (let i = 0; i < allMcqs.length; i += BATCH_SIZE) {
      const chunk = allMcqs.slice(i, i + BATCH_SIZE);
      try {
        const translated = await translateMcqBatchToHindi({ apiKey, model, mcqs: chunk });
        translatedMcqs.push(...translated);
      } catch {
        // If a translation batch fails, keep the English MCQs and leave Hindi fields empty.
        translatedMcqs.push(...chunk.map((m) => ({ ...m, question_hi: null, options_hi: null, explanation_hi: null })));
      }
    }

    await query("DELETE FROM mcqs WHERE topic_id = ?", [topicId]);
    for (const m of translatedMcqs) {
      await query(
        `INSERT INTO mcqs
           (topic_id, question, option_a, option_b, option_c, option_d, correct_option, explanation,
            question_hi, option_a_hi, option_b_hi, option_c_hi, option_d_hi, explanation_hi)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          topicId,
          m.question,
          m.options.a,
          m.options.b,
          m.options.c,
          m.options.d,
          m.correct,
          m.explanation || null,
          m.question_hi || null,
          m.options_hi?.a || null,
          m.options_hi?.b || null,
          m.options_hi?.c || null,
          m.options_hi?.d || null,
          m.explanation_hi || null,
        ]
      );
    }

    await query(
      "UPDATE topics SET content_status = 'ready', generation_error = NULL WHERE id = ?",
      [topicId]
    );

  } catch (err) {
    console.error(`AI generation failed for topic ${topicId}:`, err);
    await query("UPDATE topics SET content_status = 'failed', generation_error = ? WHERE id = ?", [
      String(err?.message || err).slice(0, 500),
      topicId,
    ]).catch(() => {});
  }
}
