import { cookies } from "next/headers";
import { getAuthFromCookieStore } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

const STATUSES = ["created", "paid", "failed"];

export async function GET(request) {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = (searchParams.get("q") || "").trim();

  const where = [];
  const params = [];
  if (STATUSES.includes(status)) {
    where.push("po.status = ?");
    params.push(status);
  }
  if (search) {
    where.push("(u.phone LIKE ? OR u.email LIKE ? OR po.razorpay_order_id LIKE ? OR po.razorpay_payment_id LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [payments, summary] = await Promise.all([
    query(
      `SELECT po.id, po.razorpay_order_id, po.razorpay_payment_id, po.course_ids, po.amount, po.status,
         po.failure_reason, po.created_at, u.email, u.phone,
         (SELECT GROUP_CONCAT(c.title ORDER BY c.title SEPARATOR ', ') FROM courses c
            WHERE FIND_IN_SET(c.id, po.course_ids)) AS course_titles
       FROM payment_orders po
       LEFT JOIN users u ON u.id = po.user_id
       ${whereSql}
       ORDER BY po.created_at DESC
       LIMIT 200`,
      params
    ),
    queryOne(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'paid' THEN amount END), 0) AS revenue,
         COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid_count,
         COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed_count,
         COUNT(CASE WHEN status = 'created' THEN 1 END) AS pending_count
       FROM payment_orders`
    ),
  ]);

  return Response.json({ payments, summary });
}
