import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// subfolder must be one of the whitelisted upload buckets.
const ALLOWED_SUBFOLDERS = new Set(["courses", "hero"]);

// Saves a File (from a parsed FormData) to uploads/<subfolder>/, returns the public URL path.
export async function saveUploadedImage(file, subfolder) {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("No file provided");
  }
  if (!ALLOWED_SUBFOLDERS.has(subfolder)) {
    throw new Error("Invalid upload destination");
  }
  if (!ALLOWED_TYPES[file.type]) {
    throw new Error("Unsupported file type. Allowed: JPG, PNG, WEBP, GIF");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("File too large. Maximum size is 5MB");
  }

  const dir = path.join(UPLOAD_ROOT, subfolder);
  await mkdir(dir, { recursive: true });

  const ext = ALLOWED_TYPES[file.type];
  const filename = `${randomUUID()}.${ext}`;
  const filePath = path.join(dir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return `/uploads/${subfolder}/${filename}`;
}
