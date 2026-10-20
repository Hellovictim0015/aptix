import { requireBearerAuth } from "@/lib/auth";
import { query } from "@/lib/db";
import { loadCombos } from "@/lib/combos";

export async function GET(request) {
  const user = await requireBearerAuth(request, "user");
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [combos, owned] = await Promise.all([
    loadCombos({ publicOnly: true }),
    query("SELECT course_id FROM course_purchases WHERE user_id = ?", [user.id]),
  ]);
  const ownedIds = new Set(owned.map((r) => r.course_id));

  return Response.json({
    combos: combos.map((c) => {
      const courses = c.courses.map(({ status, ...x }) => ({ ...x, owned: ownedIds.has(x.id) }));
      return {
        id: c.id,
        label: c.label,
        combo_price: c.combo_price,
        original_price: c.original_price,
        course_count: c.course_count,
        courses,
        owned_all: courses.every((x) => x.owned),
        owned_any: courses.some((x) => x.owned),
      };
    }),
  });
}
