import { requireBearerAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request) {
  const user = await requireBearerAuth(request, "user");
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const progress = await query(
    `SELECT p.status, p.updated_at, t.id AS topic_id, t.title AS topic_title,
       c.id AS course_id, c.title AS course_title
     FROM topic_progress p
     JOIN topics t ON t.id = p.topic_id
     JOIN courses c ON c.id = t.course_id
     WHERE p.user_id = ?
     ORDER BY p.updated_at DESC`,
    [user.id]
  );

  const totals = await query(
    `SELECT c.id AS course_id, COUNT(*) AS total_topics
     FROM topics t JOIN courses c ON c.id = t.course_id
     WHERE t.content_status = 'ready' GROUP BY c.id`
  );

  return Response.json({ progress, totals });
}

export async function POST(request) {
  const user = await requireBearerAuth(request, "user");
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const topicId = Number(body.topic_id);
  const status = body.status === "completed" ? "completed" : "in_progress";
  if (!topicId) return Response.json({ error: "topic_id is required" }, { status: 400 });

  await query(
    `INSERT INTO topic_progress (user_id, topic_id, status) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE status = IF(status = 'completed', status, VALUES(status))`,
    [user.id, topicId, status]
  );

  return Response.json({ ok: true });
}
