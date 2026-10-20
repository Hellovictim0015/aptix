import { cookies } from "next/headers";
import { getAuthFromCookieStore } from "@/lib/auth";
import { query } from "@/lib/db";
import { completeDeletionRequest } from "@/lib/accountDeletion";

// PUT { action: "approve" | "reject", note? }
// approve → permanently deletes the student's account and data.
// reject  → keeps the account (note explains why, e.g. duplicate request).
export async function PUT(request, { params }) {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const note = String(body.note || "").trim().slice(0, 500) || null;

  if (body.action === "approve") {
    try {
      await completeDeletionRequest(Number(id), note);
    } catch (err) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    return Response.json({ ok: true });
  }

  if (body.action === "reject") {
    const result = await query(
      "UPDATE account_deletion_requests SET status = 'rejected', processed_at = NOW(), admin_note = ? WHERE id = ? AND status = 'pending'",
      [note, id]
    );
    if (result.affectedRows === 0) return Response.json({ error: "Request is no longer pending" }, { status: 400 });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "action must be approve or reject" }, { status: 400 });
}
