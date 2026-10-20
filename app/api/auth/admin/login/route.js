import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { queryOne } from "@/lib/db";
import { signToken, cookieOptions, COOKIE_NAMES } from "@/lib/auth";
import { isValidEmail } from "@/lib/validate";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, password } = body || {};
  if (!isValidEmail(email) || !password) {
    return Response.json({ error: "Please provide email and password" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const admin = await queryOne("SELECT id, email, password_hash, name FROM admins WHERE email = ?", [normalizedEmail]);

  if (!admin) {
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, admin.password_hash);
  if (!isValid) {
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await signToken({ role: "admin", id: admin.id, email: admin.email, name: admin.name });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAMES.admin, token, cookieOptions());

  return Response.json({ admin: { id: admin.id, email: admin.email, name: admin.name } });
}
