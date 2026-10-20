import { requireBearerAuth } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

export async function GET(request, { params }) {
  const user = await requireBearerAuth(request, "user");
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const course = await queryOne("SELECT id, title, price FROM courses WHERE id = ? AND status = 'published'", [id]);
  if (!course) return Response.json({ error: "Course not found" }, { status: 404 });

  const purchase = await queryOne("SELECT id FROM course_purchases WHERE user_id = ? AND course_id = ?", [
    user.id,
    id,
  ]);

  const topics = await query(
    `SELECT t.id, t.title, t.slug, t.sort_order,
       (SELECT COUNT(*) FROM mcqs m WHERE m.topic_id = t.id) AS mcq_count,
       p.status AS progress_status
     FROM topics t
     LEFT JOIN topic_progress p ON p.topic_id = t.id AND p.user_id = ?
     WHERE t.course_id = ? AND t.content_status = 'ready'
     ORDER BY t.sort_order ASC, t.id ASC`,
    [user.id, id]
  );

  return Response.json({
    course: { id: course.id, title: course.title, price: Number(course.price) },
    purchased: Number(course.price) === 0 || Boolean(purchase),
    topics,
  });
}
