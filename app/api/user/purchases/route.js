import { requireBearerAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request) {
  const user = await requireBearerAuth(request, "user");
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const purchases = await query(
    `SELECT p.id, p.price_paid, p.purchased_at, c.id AS course_id, c.title AS course_title
     FROM course_purchases p JOIN courses c ON c.id = p.course_id
     WHERE p.user_id = ? ORDER BY p.purchased_at DESC`,
    [user.id]
  );

  return Response.json({ purchases });
}
