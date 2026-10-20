import { cookies } from "next/headers";
import { getAuthFromCookieStore } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { saveUploadedImage } from "@/lib/upload";

export async function GET() {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const banners = await query("SELECT * FROM hero_banners ORDER BY sort_order ASC, id ASC");
  return Response.json({ banners });
}

export async function POST(request) {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const title = String(formData.get("title") || "").trim();
  const subtitle = String(formData.get("subtitle") || "").trim();
  const bgType = formData.get("bg_type") === "image" ? "image" : "color";
  const bgColor = String(formData.get("bg_color") || "#0E9E91").trim();
  const textColor = String(formData.get("text_color") || "#FFFFFF").trim();
  const buttonBgColor = String(formData.get("button_bg_color") || "#FFFFFF").trim();
  const buttonTextColor = String(formData.get("button_text_color") || "#0E9E91").trim();
  const file = formData.get("bg_image");

  if (!title) return Response.json({ error: "Title is required" }, { status: 400 });

  let imagePath = null;
  if (file && typeof file.arrayBuffer === "function" && file.size > 0) {
    try {
      imagePath = await saveUploadedImage(file, "hero");
    } catch (err) {
      return Response.json({ error: err.message }, { status: 400 });
    }
  }

  const maxOrder = await queryOne("SELECT COALESCE(MAX(sort_order), -1) AS n FROM hero_banners");

  const result = await query(
    `INSERT INTO hero_banners
       (title, subtitle, bg_type, bg_color, bg_image, text_color, button_bg_color, button_text_color, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, subtitle || null, bgType, bgColor, imagePath, textColor, buttonBgColor, buttonTextColor, maxOrder.n + 1]
  );

  const banner = await queryOne("SELECT * FROM hero_banners WHERE id = ?", [result.insertId]);
  return Response.json({ banner }, { status: 201 });
}
