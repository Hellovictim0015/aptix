import { cookies } from "next/headers";
import { getAuthFromCookieStore } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { uniqueSlug } from "@/lib/slug";
import { getOpenAIConfig, generateCourseTopics } from "@/lib/openai";

export const maxDuration = 120;

export async function POST(request, { params }) {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const course = await queryOne("SELECT * FROM courses WHERE id = ?", [id]);
  if (!course) return Response.json({ error: "Course not found" }, { status: 404 });

  const { apiKey, model } = await getOpenAIConfig();
  if (!apiKey) {
    return Response.json(
      { error: "No OpenAI API key configured. Add one in Admin → Settings first." },
      { status: 400 }
    );
  }

  const courseDescription = [course.seo_description, course.keywords, course.tags].filter(Boolean).join(", ");

  let topicTitles;
  try {
    topicTitles = await generateCourseTopics({
      apiKey,
      model,
      courseTitle: course.title,
      courseDescription,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }

  if (topicTitles.length === 0) {
    return Response.json({ error: "AI did not return any topics. Try again." }, { status: 502 });
  }

  const existing = await query("SELECT slug FROM topics WHERE course_id = ?", [id]);
  const existingSlugs = new Set(existing.map((t) => t.slug));
  const maxOrder = await queryOne("SELECT COALESCE(MAX(sort_order), 0) AS n FROM topics WHERE course_id = ?", [id]);

  let order = maxOrder.n;
  const created = [];
  for (const title of topicTitles) {
    const slug = await uniqueSlug(title, async (candidate) => existingSlugs.has(candidate));
    existingSlugs.add(slug);
    order += 1;
    const result = await query("INSERT INTO topics (course_id, title, slug, sort_order) VALUES (?, ?, ?, ?)", [
      id,
      title,
      slug,
      order,
    ]);
    created.push({ id: result.insertId, title, slug });
  }

  return Response.json({ topics: created });
}
