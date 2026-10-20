import { query, queryOne } from "@/lib/db";

export async function getSetting(key) {
  const row = await queryOne("SELECT `value` FROM settings WHERE `key` = ?", [key]);
  return row ? row.value : null;
}

export async function setSetting(key, value) {
  await query(
    "INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
    [key, value]
  );
}

export async function getAllSettings() {
  const rows = await query("SELECT `key`, `value` FROM settings");
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
