import { cookies } from "next/headers";
import { getAuthFromCookieStore } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export async function GET() {
  const admin = await getAuthFromCookieStore(await cookies(), "admin");
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [courses, topics, mcqs] = await Promise.all([
    queryOne("SELECT COUNT(*) AS n FROM courses"),
    queryOne("SELECT COUNT(*) AS n FROM topics"),
    queryOne("SELECT COUNT(*) AS n FROM mcqs"),
  ]);

  return Response.json({ courses: courses.n, topics: topics.n, mcqs: mcqs.n });
}
