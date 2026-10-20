import { requireBearerAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request) {
  const user = await requireBearerAuth(request, "user");
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const courses = await query(
    `SELECT id, title, slug, seo_description, keywords, tags, price,
       (SELECT COUNT(*) FROM topics t WHERE t.course_id = c.id AND t.content_status = 'ready') AS topic_count
     FROM courses c WHERE c.status = 'published' ORDER BY c.created_at ASC`
  );
  return Response.json({ courses });
}
