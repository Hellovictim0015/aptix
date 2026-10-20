// Creates/updates all tables from schema.sql. Safe to re-run.
// Usage: node db/setup.js
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function main() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  const dbName = process.env.DB_NAME || "aptilearn";
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.changeUser({ database: dbName });

  await conn.query(schema);
  console.log(`Schema applied to database "${dbName}".`);
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
