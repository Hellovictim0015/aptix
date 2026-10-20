import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return encoder.encode(secret);
}

export const COOKIE_NAMES = {
  admin: "aptilearn_admin_token",
};

const TOKEN_EXPIRY = {
  admin: "1d",
  user: "30d",
};

export async function signToken({ role, id, email, name, phone }) {
  return new SignJWT({ role, id, email, name, ...(phone ? { phone } : {}) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY[role] || "1d")
    .sign(getSecret());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

const isProd = process.env.NODE_ENV === "production";

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  };
}

// Reads and verifies the auth cookie for a given role from a Next.js Route Handler
// (request.cookies) or from the `cookies()` store in a Server Component.
export async function getAuthFromCookieStore(cookieStore, role) {
  const cookie = cookieStore.get(COOKIE_NAMES[role]);
  if (!cookie?.value) return null;
  const payload = await verifyToken(cookie.value);
  if (!payload || payload.role !== role) return null;
  return payload;
}

// Convenience for Route Handlers: pass the incoming `request` (NextRequest).
export async function requireAuth(request, role) {
  return getAuthFromCookieStore(request.cookies, role);
}

// The Flutter app has no cookie jar wired up, so student-facing routes are
// authenticated via a plain `Authorization: Bearer <token>` header instead.
export async function requireBearerAuth(request, role) {
  const header = request.headers.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== role) return null;
  return payload;
}
