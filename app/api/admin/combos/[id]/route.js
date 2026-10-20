import { cookies } from "next/headers";
import { getAuthFromCookieStore } from "@/lib/auth";
import { getPool, query, queryOne } from "@/lib/db";
import { loadCombos, parseComboInput } from "@/lib/combos";

// Two shapes: `{ active }` alone just toggles visibility; otherwise the full
// combo (course_ids, combo_price, label) is replaced.
export async function PUT(request, { params }) {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await queryOne("SELECT * FROM course_combos WHERE id = ?", [id]);
  if (!existing) return Response.json({ error: "Combo not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const active = body.active !== undefined ? Boolean(body.active) : Boolean(existing.active);

  if (body.course_ids === undefined) {
    await query("UPDATE course_combos SET active = ? WHERE id = ?", [active, id]);
  } else {
    const input = await parseComboInput(body);
    if (input.error) return Response.json({ error: input.error }, { status: 400 });

    const conn = await getPool().getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        "UPDATE course_combos SET course_count = ?, combo_price = ?, label = ?, active = ? WHERE id = ?",
        [input.courseIds.length, input.comboPrice, input.label, active, id]
      );
      await conn.execute("DELETE FROM combo_courses WHERE combo_id = ?", [id]);
      for (const courseId of input.courseIds) {
        await conn.execute("INSERT INTO combo_courses (combo_id, course_id) VALUES (?, ?)", [id, courseId]);
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback().catch(() => {});
      throw err;
    } finally {
      conn.release();
    }
  }

  const [combo] = await loadCombos({ comboId: Number(id) });
  return Response.json({ combo });
}

export async function DELETE(request, { params }) {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await query("DELETE FROM course_combos WHERE id = ?", [id]);
  return Response.json({ ok: true });
}
