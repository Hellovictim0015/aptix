import { requireBearerAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request) {
  const user = await requireBearerAuth(request, "user");
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const attempts = await query(
    `SELECT a.*, t.title AS topic_title, c.title AS course_title
     FROM test_attempts a
     JOIN topics t ON t.id = a.topic_id
     JOIN courses c ON c.id = t.course_id
     WHERE a.user_id = ? ORDER BY a.created_at DESC`,
    [user.id]
  );

  return Response.json({ attempts });
}

export async function POST(request) {
  const user = await requireBearerAuth(request, "user");
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const topicId = Number(body.topic_id);
  const totalQuestions = Number(body.total_questions);
  const attemptedCount = Number(body.attempted_count);
  const correctCount = Number(body.correct_count);
  const timeTakenSeconds = Number(body.time_taken_seconds) || 0;

  if (!topicId || !totalQuestions) {
    return Response.json({ error: "topic_id and total_questions are required" }, { status: 400 });
  }

  await query(
    `INSERT INTO test_attempts (user_id, topic_id, total_questions, attempted_count, correct_count, time_taken_seconds)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [user.id, topicId, totalQuestions, attemptedCount || 0, correctCount || 0, timeTakenSeconds]
  );

  await query(
    `INSERT INTO topic_progress (user_id, topic_id, status) VALUES (?, ?, 'completed')
     ON DUPLICATE KEY UPDATE status = 'completed'`,
    [user.id, topicId]
  );

  return Response.json({ ok: true });
}
