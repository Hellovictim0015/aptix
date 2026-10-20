import { cookies } from "next/headers";
import { getAuthFromCookieStore } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { loadCombos, parseComboInput } from "@/lib/combos";

export async function GET() {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const combos = await loadCombos();
  return Response.json({ combos });
}

export async function POST(request) {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const input = await parseComboInput(body);
  if (input.error) return Response.json({ error: input.error }, { status: 400 });
  const active = body.active !== false;

  const conn = await getPool().getConnection();
  let comboId;
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute(
      "INSERT INTO course_combos (course_count, combo_price, label, active) VALUES (?, ?, ?, ?)",
      [input.courseIds.length, input.comboPrice, input.label, active]
    );
    comboId = result.insertId;
    for (const courseId of input.courseIds) {
      await conn.execute("INSERT INTO combo_courses (combo_id, course_id) VALUES (?, ?)", [comboId, courseId]);
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }

  const [combo] = await loadCombos({ comboId });
  return Response.json({ combo }, { status: 201 });
}
