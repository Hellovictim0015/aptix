-- Aptilearn database schema (MySQL, raw SQL, no ORM)
-- Safe to re-run: uses CREATE TABLE IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(191) NOT NULL DEFAULT 'Admin',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Generic key/value store for admin-configurable settings (e.g. the OpenAI API key).
CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` TEXT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Home-screen hero carousel slides, shown in sort_order on the app's home page.
CREATE TABLE IF NOT EXISTS hero_banners (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  image VARCHAR(500) NULL,
  seo_title VARCHAR(255) NULL,
  seo_description VARCHAR(500) NULL,
  keywords VARCHAR(500) NULL,
  tags VARCHAR(500) NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  status ENUM('draft','published') NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS topics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  content_status ENUM('pending','generating','ready','failed') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_course_slug (course_id, slug),
  CONSTRAINT fk_topics_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One reading-material document per topic (English + Hindi). Regenerating replaces it.
-- content/content_hi hold legacy free-form markdown; content_json/content_json_hi hold the
-- structured { definition, key_points, real_life_example, formulas, examples, tips, mistakes }
-- shape used by the tabbed Learn/Formulas/Examples/Tips admin view.
CREATE TABLE IF NOT EXISTS topic_contents (
  topic_id INT PRIMARY KEY,
  content MEDIUMTEXT NULL,
  content_hi MEDIUMTEXT NULL,
  content_json MEDIUMTEXT NULL,
  content_json_hi MEDIUMTEXT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_topic_contents_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mcqs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  topic_id INT NOT NULL,
  question TEXT NOT NULL,
  option_a VARCHAR(500) NOT NULL,
  option_b VARCHAR(500) NOT NULL,
  option_c VARCHAR(500) NOT NULL,
  option_d VARCHAR(500) NOT NULL,
  correct_option ENUM('a','b','c','d') NOT NULL,
  explanation TEXT NULL,
  question_hi TEXT NULL,
  option_a_hi VARCHAR(500) NULL,
  option_b_hi VARCHAR(500) NULL,
  option_c_hi VARCHAR(500) NULL,
  option_d_hi VARCHAR(500) NULL,
  explanation_hi TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mcqs_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
  INDEX idx_mcqs_topic (topic_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Combo/bundle pricing: buying `course_count` courses together costs `combo_price`
-- instead of the sum of their individual prices. Managed entirely from admin.
CREATE TABLE IF NOT EXISTS course_combos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_count INT NOT NULL,
  combo_price DECIMAL(10,2) NOT NULL,
  label VARCHAR(255) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- The exact courses included in each combo bundle (course_combos.course_count
-- is kept in sync with the number of rows here).
CREATE TABLE IF NOT EXISTS combo_courses (
  combo_id INT NOT NULL,
  course_id INT NOT NULL,
  PRIMARY KEY (combo_id, course_id),
  CONSTRAINT fk_combo_courses_combo FOREIGN KEY (combo_id) REFERENCES course_combos(id) ON DELETE CASCADE,
  CONSTRAINT fk_combo_courses_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Student accounts (passwordless, OTP-based). `locked_device_id` is informational only;
-- the actual per-course device lock lives on course_purchases.
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(15) NULL UNIQUE,
  email VARCHAR(191) NULL UNIQUE,
  name VARCHAR(191) NULL,
  status ENUM('active','blocked') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One-time-passwords for student login (sent on WhatsApp to `phone`; `email`
-- is only used by older email-based accounts).
CREATE TABLE IF NOT EXISTS otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(15) NULL,
  email VARCHAR(191) NULL,
  purpose ENUM('user_login','account_delete') NOT NULL DEFAULT 'user_login',
  otp_hash VARCHAR(255) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME NULL,
  last_sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otps_email_purpose (email, purpose)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One row per user+course purchase. `device_id` is the device the course was
-- first opened on; when the admin's device-lock setting is on, content/MCQ
-- access is restricted to this device.
CREATE TABLE IF NOT EXISTS course_purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  device_id VARCHAR(191) NULL,
  price_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_order_id INT NULL,
  purchased_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_course (user_id, course_id),
  CONSTRAINT fk_purchases_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_purchases_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One row per Razorpay order created for a purchase (single course or combo).
-- `course_ids` is a comma-separated list so a combo purchase can be verified
-- and turned into multiple course_purchases rows atomically on success.
CREATE TABLE IF NOT EXISTS payment_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  razorpay_order_id VARCHAR(191) NOT NULL UNIQUE,
  razorpay_payment_id VARCHAR(191) NULL,
  combo_id INT NULL,
  course_ids VARCHAR(500) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  device_id VARCHAR(191) NULL,
  status ENUM('created','paid','failed') NOT NULL DEFAULT 'created',
  failure_reason VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Per-user, per-topic reading progress (drives "My Learning" and the home progress bar).
CREATE TABLE IF NOT EXISTS topic_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  topic_id INT NOT NULL,
  status ENUM('in_progress','completed') NOT NULL DEFAULT 'in_progress',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_topic (user_id, topic_id),
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One row per completed practice/test attempt (drives "Tests" / "Test History").
CREATE TABLE IF NOT EXISTS test_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  topic_id INT NOT NULL,
  total_questions INT NOT NULL,
  attempted_count INT NOT NULL,
  correct_count INT NOT NULL,
  time_taken_seconds INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attempts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempts_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
  INDEX idx_attempts_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Student "delete my account" requests. Admin reviews them and deletes the
-- account within 7 days (scheduled_for). phone/email are snapshots so the
-- record survives after the user row is deleted (user_id becomes NULL).
CREATE TABLE IF NOT EXISTS account_deletion_requests (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
