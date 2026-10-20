import { cookies } from "next/headers";
import { getAuthFromCookieStore } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

export async function GET(request, { params }) {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { topicId } = await params;
  const topic = await queryOne(
    `SELECT t.*, c.title AS course_title, c.id AS course_id
     FROM topics t JOIN courses c ON c.id = t.course_id WHERE t.id = ?`,
    [topicId]
  );
  if (!topic) return Response.json({ error: "Topic not found" }, { status: 404 });

  const content = await queryOne(
    "SELECT content_json, content_json_hi, updated_at FROM topic_contents WHERE topic_id = ?",
    [topicId]
  );
  const mcqs = await query("SELECT * FROM mcqs WHERE topic_id = ? ORDER BY id ASC", [topicId]);

  function safeParse(json) {
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  return Response.json({
    topic,
    content: safeParse(content?.content_json),
    content_hi: safeParse(content?.content_json_hi),
    mcqs,
  });
}

export async function PUT(request, { params }) {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { topicId } = await params;
  const body = await request.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  if (!title) return Response.json({ error: "Title is required" }, { status: 400 });

  await query("UPDATE topics SET title = ? WHERE id = ?", [title, topicId]);
  const topic = await queryOne("SELECT * FROM topics WHERE id = ?", [topicId]);
  return Response.json({ topic });
}

export async function DELETE(request, { params }) {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { topicId } = await params;
  await query("DELETE FROM topics WHERE id = ?", [topicId]);
  return Response.json({ ok: true });
}
