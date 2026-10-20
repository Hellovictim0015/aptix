import { cookies } from "next/headers";
import { getAuthFromCookieStore } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const admin = await getAuthFromCookieStore(cookieStore, "admin");
  if (!admin) return Response.json({ error: "Not authenticated" }, { status: 401 });
  return Response.json({ admin });
}
