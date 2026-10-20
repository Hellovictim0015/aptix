import { getPool, queryOne } from "@/lib/db";

// Students ask for deletion from the app; an admin reviews and deletes the
// account within this many days.
export const DELETION_GRACE_DAYS = 7;

export async function getPendingDeletionRequest(userId) {
  return queryOne(
    `SELECT id, status, reason, requested_at, scheduled_for FROM account_deletion_requests
     WHERE user_id = ? AND status = 'pending' ORDER BY id DESC LIMIT 1`,
    [userId]
  );
}

// Shape sent to the app.
export function deletionRequestJson(row) {
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    reason: row.reason,
    requested_at: row.requested_at,
    scheduled_for: row.scheduled_for,
  };
}

// Permanently deletes the user behind a pending request and marks the request
// completed, atomically. FK ON DELETE CASCADE removes purchases, progress and
// test attempts; payment_orders are kept (user_id → NULL) for tax records, and
// the request row keeps its phone/email snapshot.
export async function completeDeletionRequest(requestId, adminNote = null) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(
      "SELECT * FROM account_deletion_requests WHERE id = ? FOR UPDATE",
      [requestId]
    );
    const req = rows[0];
    if (!req) throw new Error("Request not found");
    if (req.status !== "pending") throw new Error(`Request is already ${req.status}`);

    await conn.execute(
      "UPDATE account_deletion_requests SET status = 'completed', processed_at = NOW(), admin_note = ? WHERE id = ?",
      [adminNote, requestId]
    );
    if (req.user_id) await conn.execute("DELETE FROM users WHERE id = ?", [req.user_id]);

    await conn.commit();
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}
