import { cookies } from "next/headers";
import { getAuthFromCookieStore } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

const STATUSES = ["pending", "completed", "rejected", "cancelled"];

export async function GET(request) {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const status = new URL(request.url).searchParams.get("status") || "pending";
  const filter = STATUSES.includes(status) ? status : "pending";

  const [requests, counts] = await Promise.all([
    query(
      `SELECT r.*, (r.scheduled_for < NOW()) AS overdue,
         (SELECT COUNT(*) FROM course_purchases p WHERE p.user_id = r.user_id) AS purchase_count
       FROM account_deletion_requests r
       WHERE r.status = ?
       ORDER BY ${filter === "pending" ? "r.scheduled_for ASC" : "r.processed_at DESC"}
       LIMIT 200`,
      [filter]
    ),
    queryOne(
      `SELECT
         COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
         COUNT(CASE WHEN status = 'pending' AND scheduled_for < NOW() THEN 1 END) AS overdue,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed
       FROM account_deletion_requests`
    ),
  ]);

  return Response.json({
    requests: requests.map((r) => ({ ...r, overdue: Boolean(r.overdue) })),
    counts,
  });
}
