import path from "path";
import { readFile, stat } from "fs/promises";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

// Serves files from the ROOT project's uploads/ directory (outside of frontend public/),
// e.g. GET /uploads/courses/<file>.jpg
export async function GET(request, { params }) {
  const { path: segments } = await params;
  if (!Array.isArray(segments) || segments.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  // Resolve and verify the path stays inside uploads/ (prevent path traversal).
  const requestedPath = path.join(UPLOAD_ROOT, ...segments);
  const resolved = path.resolve(requestedPath);
  if (!resolved.startsWith(path.resolve(UPLOAD_ROOT) + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(resolved).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const stats = await stat(resolved);
    if (!stats.isFile()) return new Response("Not found", { status: 404 });

    const buffer = await readFile(resolved);
    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
