import { cookies } from "next/headers";
import { getAuthFromCookieStore } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { saveUploadedImage } from "@/lib/upload";

export async function PUT(request, { params }) {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await queryOne("SELECT * FROM hero_banners WHERE id = ?", [id]);
  if (!existing) return Response.json({ error: "Banner not found" }, { status: 404 });

  const contentType = request.headers.get("content-type") || "";
  let fields = {};
  let file = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    fields = Object.fromEntries(formData.entries());
    file = formData.get("bg_image");
  } else {
    fields = await request.json().catch(() => ({}));
  }

  const title = fields.title !== undefined ? String(fields.title).trim() : existing.title;
  const subtitle = fields.subtitle !== undefined ? String(fields.subtitle).trim() || null : existing.subtitle;
  const bgType = fields.bg_type === "image" || fields.bg_type === "color" ? fields.bg_type : existing.bg_type;
  const bgColor = fields.bg_color !== undefined ? String(fields.bg_color).trim() : existing.bg_color;
  const textColor = fields.text_color !== undefined ? String(fields.text_color).trim() : existing.text_color;
  const buttonBgColor =
    fields.button_bg_color !== undefined ? String(fields.button_bg_color).trim() : existing.button_bg_color;
  const buttonTextColor =
    fields.button_text_color !== undefined ? String(fields.button_text_color).trim() : existing.button_text_color;
  const sortOrder = fields.sort_order !== undefined ? Number(fields.sort_order) : existing.sort_order;

  let imagePath = existing.bg_image;
  if (file && typeof file.arrayBuffer === "function" && file.size > 0) {
    try {
      imagePath = await saveUploadedImage(file, "hero");
    } catch (err) {
      return Response.json({ error: err.message }, { status: 400 });
    }
  }

  await query(
    `UPDATE hero_banners
     SET title = ?, subtitle = ?, bg_type = ?, bg_color = ?, bg_image = ?, text_color = ?,
         button_bg_color = ?, button_text_color = ?, sort_order = ?
     WHERE id = ?`,
    [title, subtitle, bgType, bgColor, imagePath, textColor, buttonBgColor, buttonTextColor, sortOrder, id]
  );

  const banner = await queryOne("SELECT * FROM hero_banners WHERE id = ?", [id]);
  return Response.json({ banner });
}

export async function DELETE(request, { params }) {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await query("DELETE FROM hero_banners WHERE id = ?", [id]);
  return Response.json({ ok: true });
}
