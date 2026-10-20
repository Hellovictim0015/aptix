// Seeds the first admin account. Safe to re-run: resets the password if the
// account already exists.
// Usage: node db/seed.js
require("dotenv").config({ path: ".env.local" });
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "aptilearn",
  });

  const adminEmail = (process.env.ADMIN_SEED_EMAIL || "admin@aptilearn.com").toLowerCase();
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || "Admin@12345";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const [existing] = await conn.execute("SELECT id FROM admins WHERE email = ?", [adminEmail]);
  if (existing.length === 0) {
    await conn.execute(
      "INSERT INTO admins (email, password_hash, name) VALUES (?, ?, ?)",
      [adminEmail, passwordHash, "Super Admin"]
    );
    console.log(`Created admin: ${adminEmail}`);
  } else {
    await conn.execute("UPDATE admins SET password_hash = ? WHERE email = ?", [passwordHash, adminEmail]);
    console.log(`Admin already existed, password reset: ${adminEmail}`);
  }

  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
