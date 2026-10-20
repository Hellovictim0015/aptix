import { requireBearerAuth } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { DELETION_GRACE_DAYS, deletionRequestJson, getPendingDeletionRequest } from "@/lib/accountDeletion";

// GET → the student's pending deletion request (or null).
export async function GET(request) {
  const auth = await requireBearerAuth(request, "user");
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const pending = await getPendingDeletionRequest(auth.id);
  return Response.json({ request: deletionRequestJson(pending), grace_days: DELETION_GRACE_DAYS });
}

// POST { reason? } → submit a deletion request; admin deletes within 7 days.
export async function POST(request) {
  const auth = await requireBearerAuth(request, "user");
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await queryOne("SELECT id, phone, email FROM users WHERE id = ?", [auth.id]);
  if (!user) return Response.json({ error: "Account not found" }, { status: 404 });

  const existing = await getPendingDeletionRequest(user.id);
  if (existing) return Response.json({ request: deletionRequestJson(existing), already_requested: true });

  const body = await request.json().catch(() => ({}));
  const reason = String(body.reason || "").trim().slice(0, 500) || null;

  const result = await query(
    `INSERT INTO account_deletion_requests (user_id, phone, email, reason, scheduled_for)
     VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
    [user.id, user.phone, user.email, reason, DELETION_GRACE_DAYS]
  );
  const created = await queryOne(
    "SELECT id, status, reason, requested_at, scheduled_for FROM account_deletion_requests WHERE id = ?",
    [result.insertId]
  );
  return Response.json({ request: deletionRequestJson(created) }, { status: 201 });
}

// DELETE → the student changed their mind; cancel the pending request.
export async function DELETE(request) {
  const auth = await requireBearerAuth(request, "user");
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await query(
    "UPDATE account_deletion_requests SET status = 'cancelled', processed_at = NOW() WHERE user_id = ? AND status = 'pending'",
    [auth.id]
  );
  return Response.json({ ok: true });
}
