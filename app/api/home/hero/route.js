import { requireBearerAuth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request) {
  const user = await requireBearerAuth(request, "user");
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const banners = await query("SELECT * FROM hero_banners ORDER BY sort_order ASC, id ASC");
  return Response.json({ banners });
}
