import { query } from "@/lib/db";

// Loads combos with the courses each one includes and the sum of those
// courses' individual prices (`original_price`) for showing the saving.
// `publicOnly` hides inactive combos and any combo containing an unpublished
// course, so students are never offered something they can't get.
export async function loadCombos({ publicOnly = false, comboId = null } = {}) {
  const where = [];
  const params = [];
  if (publicOnly) where.push("cc.active = 1");
  if (comboId) {
    where.push("cc.id = ?");
    params.push(comboId);
  }
  const combos = await query(
    `SELECT cc.* FROM course_combos cc ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY cc.combo_price ASC, cc.id ASC`,
    params
  );
  if (combos.length === 0) return [];

  const ids = combos.map((c) => c.id);
  const rows = await query(
    `SELECT x.combo_id, c.id, c.title, c.image, c.price, c.status
     FROM combo_courses x JOIN courses c ON c.id = x.course_id
     WHERE x.combo_id IN (${ids.map(() => "?").join(",")})
     ORDER BY c.title ASC`,
    ids
  );

  const byCombo = new Map(ids.map((id) => [id, []]));
  for (const r of rows) {
    byCombo.get(r.combo_id).push({ id: r.id, title: r.title, image: r.image, price: Number(r.price), status: r.status });
  }

  return combos
    .map((c) => {
      const courses = byCombo.get(c.id);
      return {
        ...c,
        active: Boolean(c.active),
        combo_price: Number(c.combo_price),
        course_count: courses.length,
        original_price: courses.reduce((sum, x) => sum + x.price, 0),
        courses,
      };
    })
    .filter((c) => !publicOnly || (c.courses.length >= 2 && c.courses.every((x) => x.status === "published")));
}

// Validates admin input and returns { courseIds, comboPrice, label } or { error }.
export async function parseComboInput(body) {
  const courseIds = Array.isArray(body.course_ids)
    ? [...new Set(body.course_ids.map(Number))].filter((n) => Number.isInteger(n) && n > 0)
    : [];
  const comboPrice = Number(body.combo_price);
  const label = String(body.label || "").trim() || null;

  if (courseIds.length < 2) return { error: "Select at least 2 courses for a combo" };
  if (!comboPrice || comboPrice <= 0) return { error: "Combo price must be greater than 0" };

  const found = await query(
    `SELECT id FROM courses WHERE id IN (${courseIds.map(() => "?").join(",")})`,
    courseIds
  );
  if (found.length !== courseIds.length) return { error: "One or more selected courses no longer exist" };

  return { courseIds, comboPrice, label };
}
