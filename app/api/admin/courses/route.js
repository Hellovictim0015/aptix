import { cookies } from "next/headers";
import { getAuthFromCookieStore } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { saveUploadedImage } from "@/lib/upload";
import { uniqueSlug } from "@/lib/slug";

export async function GET() {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const courses = await query(
    `SELECT c.*, (SELECT COUNT(*) FROM topics t WHERE t.course_id = c.id) AS topic_count
     FROM courses c ORDER BY c.created_at DESC`
  );
  return Response.json({ courses });
}

export async function POST(request) {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const title = String(formData.get("title") || "").trim();
  const seoTitle = String(formData.get("seo_title") || "").trim();
  const seoDescription = String(formData.get("seo_description") || "").trim();
  const keywords = String(formData.get("keywords") || "").trim();
  const tags = String(formData.get("tags") || "").trim();
  const status = formData.get("status") === "published" ? "published" : "draft";
  const slugInput = String(formData.get("slug") || "").trim();
  const price = Math.max(0, Number(formData.get("price")) || 0);
  const file = formData.get("image");

  if (!title) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }

  const slug = await uniqueSlug(slugInput || title, async (candidate) => {
    const row = await queryOne("SELECT id FROM courses WHERE slug = ?", [candidate]);
    return Boolean(row);
  });

  let imagePath = null;
  if (file && typeof file.arrayBuffer === "function" && file.size > 0) {
    try {
      imagePath = await saveUploadedImage(file, "courses");
    } catch (err) {
      return Response.json({ error: err.message }, { status: 400 });
    }
  }

  const result = await query(
    `INSERT INTO courses (title, slug, image, seo_title, seo_description, keywords, tags, price, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, slug, imagePath, seoTitle || null, seoDescription || null, keywords || null, tags || null, price, status]
  );

  const course = await queryOne("SELECT * FROM courses WHERE id = ?", [result.insertId]);
  return Response.json({ course }, { status: 201 });
}
