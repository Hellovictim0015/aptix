// Safely evolves an already-running database: adds new columns if missing.
// Safe to re-run. Usage: node db/migrate.js
require("dotenv").config({ path: ".env.local" });
const mysql = require("mysql2/promise");

async function columnExists(conn, table, column) {
  const [rows] = await conn.execute(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].cnt > 0;
}

async function tableExists(conn, table) {
  const [rows] = await conn.execute(
    `SELECT COUNT(*) AS cnt FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return rows[0].cnt > 0;
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "aptilearn",
  });

  if (!(await columnExists(conn, "topic_contents", "content_hi"))) {
    await conn.execute(`ALTER TABLE topic_contents ADD COLUMN content_hi MEDIUMTEXT NULL AFTER content`);
    console.log("Added topic_contents.content_hi");
  }
  if (!(await columnExists(conn, "topic_contents", "content_json"))) {
    await conn.execute(`ALTER TABLE topic_contents ADD COLUMN content_json MEDIUMTEXT NULL AFTER content_hi`);
    console.log("Added topic_contents.content_json");
  }
  if (!(await columnExists(conn, "topic_contents", "content_json_hi"))) {
    await conn.execute(`ALTER TABLE topic_contents ADD COLUMN content_json_hi MEDIUMTEXT NULL AFTER content_json`);
    console.log("Added topic_contents.content_json_hi");
  }

  const mcqHiColumns = [
    ["question_hi", "TEXT NULL AFTER explanation"],
    ["option_a_hi", "VARCHAR(500) NULL AFTER question_hi"],
    ["option_b_hi", "VARCHAR(500) NULL AFTER option_a_hi"],
    ["option_c_hi", "VARCHAR(500) NULL AFTER option_b_hi"],
    ["option_d_hi", "VARCHAR(500) NULL AFTER option_c_hi"],
    ["explanation_hi", "TEXT NULL AFTER option_d_hi"],
  ];
  for (const [column, def] of mcqHiColumns) {
    if (!(await columnExists(conn, "mcqs", column))) {
      await conn.execute(`ALTER TABLE mcqs ADD COLUMN ${column} ${def}`);
      console.log(`Added mcqs.${column}`);
    }
  }

  if (!(await columnExists(conn, "courses", "price"))) {
    await conn.execute(`ALTER TABLE courses ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER tags`);
    console.log("Added courses.price");
  }

  const [otpPurposeCol] = await conn.execute(
    `SELECT COLUMN_TYPE AS type FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'otps' AND COLUMN_NAME = 'purpose'`
  );
  if (otpPurposeCol.length && !otpPurposeCol[0].type.includes("account_delete")) {
    await conn.execute(
      `ALTER TABLE otps MODIFY COLUMN purpose ENUM('user_login','account_delete') NOT NULL DEFAULT 'user_login'`
    );
    console.log("Widened otps.purpose to include account_delete");
  }

  if (!(await tableExists(conn, "hero_banners"))) {
    await conn.execute(`
      CREATE TABLE hero_banners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255) NULL,
        bg_type ENUM('color','image') NOT NULL DEFAULT 'color',
        bg_color VARCHAR(20) NULL,
        bg_image VARCHAR(500) NULL,
        text_color VARCHAR(20) NULL,
        button_bg_color VARCHAR(20) NULL,
        button_text_color VARCHAR(20) NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("Created hero_banners");

    // Carry the old single-hero settings (if any admin had configured them) into slide 1.
    const [rows] = await conn.execute(
      "SELECT `key`, `value` FROM settings WHERE `key` LIKE 'hero_%'"
    );
    const old = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    await conn.execute(
      `INSERT INTO hero_banners (title, subtitle, bg_type, bg_color, bg_image, sort_order)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [
        old.hero_title || "Prepare Smarter\nNot Harder",
        old.hero_subtitle || "Learn Today Achieve Tomorrow",
        old.hero_bg_type || "color",
        old.hero_bg_color || "#0E9E91",
        old.hero_bg_image || null,
      ]
    );
    await conn.execute(
      `INSERT INTO hero_banners (title, subtitle, bg_type, bg_color, sort_order) VALUES (?, ?, ?, ?, 1)`,
      ["Practice Every Day", "Build the habit that gets you selected", "color", "#6D5DF6"]
    );
    await conn.execute(
      `INSERT INTO hero_banners (title, subtitle, bg_type, bg_color, sort_order) VALUES (?, ?, ?, ?, 2)`,
      ["Track Your Progress", "See exactly where you stand, topic by topic", "color", "#FF6B35"]
    );
    console.log("Seeded 3 starter hero banners");
  }

  if (!(await tableExists(conn, "course_combos"))) {
    await conn.execute(`
      CREATE TABLE course_combos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_count INT NOT NULL,
        combo_price DECIMAL(10,2) NOT NULL,
        label VARCHAR(255) NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("Created course_combos");
  }

  if (!(await tableExists(conn, "payment_orders"))) {
    await conn.execute(`
      CREATE TABLE payment_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        razorpay_order_id VARCHAR(191) NOT NULL UNIQUE,
        razorpay_payment_id VARCHAR(191) NULL,
        course_ids VARCHAR(500) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        device_id VARCHAR(191) NULL,
        status ENUM('created','paid','failed') NOT NULL DEFAULT 'created',
        failure_reason VARCHAR(255) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_payment_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("Created payment_orders");
  }

  if (!(await columnExists(conn, "course_purchases", "payment_order_id"))) {
    await conn.execute(`ALTER TABLE course_purchases ADD COLUMN payment_order_id INT NULL AFTER price_paid`);
    console.log("Added course_purchases.payment_order_id");
  }

  if (!(await columnExists(conn, "payment_orders", "failure_reason"))) {
    await conn.execute(`ALTER TABLE payment_orders ADD COLUMN failure_reason VARCHAR(255) NULL AFTER status`);
    console.log("Added payment_orders.failure_reason");
  }

  const [comboIdx] = await conn.execute(
    `SELECT COUNT(*) AS cnt FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'course_combos' AND INDEX_NAME = 'uniq_course_count'`
  );
  if (comboIdx[0].cnt > 0) {
    await conn.execute(`ALTER TABLE course_combos DROP INDEX uniq_course_count`);
    console.log("Dropped course_combos.uniq_course_count (combos now list their own courses)");
  }

  if (!(await tableExists(conn, "combo_courses"))) {
    await conn.execute(`
      CREATE TABLE combo_courses (
        combo_id INT NOT NULL,
        course_id INT NOT NULL,
        PRIMARY KEY (combo_id, course_id),
        CONSTRAINT fk_combo_courses_combo FOREIGN KEY (combo_id) REFERENCES course_combos(id) ON DELETE CASCADE,
        CONSTRAINT fk_combo_courses_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("Created combo_courses");
  }

  if (!(await columnExists(conn, "payment_orders", "combo_id"))) {
    await conn.execute(`ALTER TABLE payment_orders ADD COLUMN combo_id INT NULL AFTER razorpay_payment_id`);
    console.log("Added payment_orders.combo_id");
  }

  // WhatsApp OTP login: students sign in with a phone number instead of email.
  if (!(await columnExists(conn, "users", "phone"))) {
    await conn.execute(`ALTER TABLE users ADD COLUMN phone VARCHAR(15) NULL UNIQUE AFTER id`);
    await conn.execute(`ALTER TABLE users MODIFY COLUMN email VARCHAR(191) NULL`);
    console.log("Added users.phone, made users.email optional");
  }
  if (!(await columnExists(conn, "otps", "phone"))) {
    await conn.execute(`ALTER TABLE otps ADD COLUMN phone VARCHAR(15) NULL AFTER id`);
    await conn.execute(`ALTER TABLE otps MODIFY COLUMN email VARCHAR(191) NULL`);
    await conn.execute(`ALTER TABLE otps ADD INDEX idx_otps_phone (phone, purpose)`);
    console.log("Added otps.phone, made otps.email optional");
  }

  if (!(await tableExists(conn, "account_deletion_requests"))) {
    await conn.execute(`
      CREATE TABLE account_deletion_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        phone VARCHAR(15) NULL,
        email VARCHAR(191) NULL,
        reason VARCHAR(500) NULL,
        status ENUM('pending','cancelled','rejected','completed') NOT NULL DEFAULT 'pending',
        requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        scheduled_for DATETIME NOT NULL,
        processed_at DATETIME NULL,
        admin_note VARCHAR(500) NULL,
        INDEX idx_deletion_status (status, scheduled_for),
        CONSTRAINT fk_deletion_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("Created account_deletion_requests");
  }

  // Keep payment records (tax/accounting) when a student deletes their account.
  const [poFk] = await conn.execute(
    `SELECT DELETE_RULE AS rule FROM information_schema.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_payment_orders_user'`
  );
  if (poFk.length && poFk[0].rule !== "SET NULL") {
    await conn.execute(`ALTER TABLE payment_orders DROP FOREIGN KEY fk_payment_orders_user`);
    await conn.execute(`ALTER TABLE payment_orders MODIFY COLUMN user_id INT NULL`);
    await conn.execute(
      `ALTER TABLE payment_orders ADD CONSTRAINT fk_payment_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`
    );
    console.log("payment_orders now kept (user_id set NULL) when a user is deleted");
  }

  // AI generation now runs in the background; the admin page polls status.
  if (!(await columnExists(conn, "topics", "generation_error"))) {
    await conn.execute(`ALTER TABLE topics ADD COLUMN generation_error VARCHAR(500) NULL AFTER content_status`);
    await conn.execute(`ALTER TABLE topics ADD COLUMN generation_started_at DATETIME NULL AFTER generation_error`);
    console.log("Added topics.generation_error, topics.generation_started_at");
  }

  console.log("Migration complete.");
  await conn.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
