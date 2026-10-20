import { cookies } from "next/headers";
import { getAuthFromCookieStore } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { saveUploadedImage } from "@/lib/upload";
import { uniqueSlug } from "@/lib/slug";

export async function GET(request, { params }) {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const course = await queryOne("SELECT * FROM courses WHERE id = ?", [id]);
  if (!course) return Response.json({ error: "Course not found" }, { status: 404 });

  const topics = await query(
    `SELECT t.*, (SELECT COUNT(*) FROM mcqs m WHERE m.topic_id = t.id) AS mcq_count
     FROM topics t WHERE t.course_id = ? ORDER BY t.sort_order ASC, t.id ASC`,
    [id]
  );

  return Response.json({ course, topics });
}

export async function PUT(request, { params }) {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await queryOne("SELECT * FROM courses WHERE id = ?", [id]);
  if (!existing) return Response.json({ error: "Course not found" }, { status: 404 });

  const contentType = request.headers.get("content-type") || "";
  let fields = {};
  let file = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    fields = Object.fromEntries(formData.entries());
    file = formData.get("image");
  } else {
    fields = await request.json().catch(() => ({}));
  }

  const title = fields.title !== undefined ? String(fields.title).trim() : existing.title;
  const seoTitle = fields.seo_title !== undefined ? String(fields.seo_title).trim() || null : existing.seo_title;
  const seoDescription =
    fields.seo_description !== undefined ? String(fields.seo_description).trim() || null : existing.seo_description;
  const keywords = fields.keywords !== undefined ? String(fields.keywords).trim() || null : existing.keywords;
  const tags = fields.tags !== undefined ? String(fields.tags).trim() || null : existing.tags;
  const status = fields.status === "published" || fields.status === "draft" ? fields.status : existing.status;
  const price = fields.price !== undefined ? Math.max(0, Number(fields.price) || 0) : existing.price;

  let slug = existing.slug;
  if (fields.slug !== undefined && String(fields.slug).trim() && String(fields.slug).trim() !== existing.slug) {
    slug = await uniqueSlug(String(fields.slug).trim(), async (candidate) => {
      const row = await queryOne("SELECT id FROM courses WHERE slug = ? AND id != ?", [candidate, id]);
      return Boolean(row);
    });
  }

  let imagePath = existing.image;
  if (file && typeof file.arrayBuffer === "function" && file.size > 0) {
    try {
      imagePath = await saveUploadedImage(file, "courses");
    } catch (err) {
      return Response.json({ error: err.message }, { status: 400 });
    }
  }

  await query(
    `UPDATE courses SET title = ?, slug = ?, image = ?, seo_title = ?, seo_description = ?, keywords = ?, tags = ?, price = ?, status = ?
     WHERE id = ?`,
    [title, slug, imagePath, seoTitle, seoDescription, keywords, tags, price, status, id]
  );

  const course = await queryOne("SELECT * FROM courses WHERE id = ?", [id]);
  return Response.json({ course });
}

export async function DELETE(request, { params }) {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await query("DELETE FROM courses WHERE id = ?", [id]);
  return Response.json({ ok: true });
}
