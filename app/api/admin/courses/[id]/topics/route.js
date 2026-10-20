import { cookies } from "next/headers";
import { getAuthFromCookieStore } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { uniqueSlug } from "@/lib/slug";

export async function POST(request, { params }) {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const course = await queryOne("SELECT id FROM courses WHERE id = ?", [id]);
  if (!course) return Response.json({ error: "Course not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  if (!title) return Response.json({ error: "Title is required" }, { status: 400 });

  const slug = await uniqueSlug(title, async (candidate) => {
    const row = await queryOne("SELECT id FROM topics WHERE course_id = ? AND slug = ?", [id, candidate]);
    return Boolean(row);
  });

  const maxOrder = await queryOne("SELECT COALESCE(MAX(sort_order), 0) AS n FROM topics WHERE course_id = ?", [id]);

  const result = await query("INSERT INTO topics (course_id, title, slug, sort_order) VALUES (?, ?, ?, ?)", [
    id,
    title,
    slug,
    maxOrder.n + 1,
  ]);

  const topic = await queryOne("SELECT * FROM topics WHERE id = ?", [result.insertId]);
  return Response.json({ topic }, { status: 201 });
}
