-- ================================================================
-- BuyShare v2 – Database Setup
-- Usage: mysql -u root -p < database.sql
-- Then:  npm install && npm start
-- Server auto-seeds passwords on first start:
--   admin@buyshare.rw    → admin123
--   manager@bk.rw        → manager123
--   investor@example.rw  → investor123
-- ================================================================

CREATE DATABASE IF NOT EXISTS buyshare_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE buyshare_db;

-- ── BANKS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banks (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  code       VARCHAR(20)  UNIQUE NOT NULL,
  country    VARCHAR(100) DEFAULT 'Rwanda',
  is_active  TINYINT(1)   DEFAULT 1,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code)
) ENGINE=InnoDB;

-- ── USERS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  full_name      VARCHAR(100) NOT NULL,
  email          VARCHAR(150) UNIQUE NOT NULL,
  phone          VARCHAR(25),
  password_hash  VARCHAR(255) NOT NULL DEFAULT 'PENDING',
  role           ENUM('admin','bank_manager','investor') NOT NULL DEFAULT 'investor',
  bank_id        INT DEFAULT NULL,
  is_active      TINYINT(1)   DEFAULT 1,
  login_attempts INT          DEFAULT 0,
  locked_until   DATETIME     DEFAULT NULL,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE SET NULL,
  INDEX idx_email (email),
  INDEX idx_role  (role)
) ENGINE=InnoDB;

-- ── SHARES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shares (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  bank_id          INT  NOT NULL,
  share_name       VARCHAR(150) NOT NULL,
  total_shares     INT  NOT NULL DEFAULT 0,
  available_shares INT  NOT NULL DEFAULT 0,
  price_per_share  DECIMAL(15,2) NOT NULL,
  currency         VARCHAR(10)  DEFAULT 'RWF',
  status           ENUM('active','inactive') DEFAULT 'active',
  description      TEXT,
  created_by       INT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (bank_id)    REFERENCES banks(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_bank_status (bank_id, status)
) ENGINE=InnoDB;

-- ── PURCHASE REQUESTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_requests (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  investor_id     INT  NOT NULL,
  share_id        INT  NOT NULL,
  quantity        INT  NOT NULL,
  price_per_share DECIMAL(15,2) NOT NULL,
  total_amount    DECIMAL(15,2) NOT NULL,
  amount_enc      TEXT DEFAULT NULL,
  status          ENUM('pending','approved','rejected') DEFAULT 'pending',
  rejection_reason TEXT DEFAULT NULL,
  reviewed_by     INT  DEFAULT NULL,
  reviewed_at     DATETIME NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (investor_id) REFERENCES users(id),
  FOREIGN KEY (share_id)    REFERENCES shares(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_investor (investor_id),
  INDEX idx_status   (status)
) ENGINE=InnoDB;

-- ── NOTIFICATIONS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT  NOT NULL,
  title      VARCHAR(200) NOT NULL,
  message    TEXT NOT NULL,
  type       ENUM('info','success','warning','danger') DEFAULT 'info',
  is_read    TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read)
) ENGINE=InnoDB;

-- ── AUDIT LOG ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT,
  action     VARCHAR(100) NOT NULL,
  entity     VARCHAR(50),
  entity_id  INT,
  details    TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user   (user_id),
  INDEX idx_action (action)
) ENGINE=InnoDB;

-- ================================================================
-- SEED DATA (passwords are set automatically by server on startup)
-- ================================================================

-- Banks
INSERT IGNORE INTO banks (name, code, country) VALUES
  ('Bank of Kigali',     'BK',   'Rwanda'),
  ('Equity Bank Rwanda', 'EBR',  'Rwanda'),
  ('I&M Bank Rwanda',    'IMB',  'Rwanda'),
  ('Cogebanque',         'CGB',  'Rwanda'),
  ('NCBA Bank Rwanda',   'NCBA', 'Rwanda');

-- Users (password_hash = 'PENDING' → server replaces on startup)
INSERT IGNORE INTO users (full_name, email, phone, password_hash, role, bank_id) VALUES
  ('System Admin',     'admin@buyshare.rw',    '+250788000001', 'PENDING', 'admin',        NULL),
  ('Jean Pierre (BK)', 'manager@bk.rw',        '+250788000002', 'PENDING', 'bank_manager', 1),
  ('Alice (Equity)',   'manager@equity.rw',    '+250788000003', 'PENDING', 'bank_manager', 2),
  ('Alexis Habimana',  'investor@example.rw',  '+250788000004', 'PENDING', 'investor',     NULL),
  ('Diane Mukamana',   'diane@example.rw',     '+250788000005', 'PENDING', 'investor',     NULL);

-- Shares
INSERT IGNORE INTO shares (bank_id, share_name, total_shares, available_shares, price_per_share, currency, status, description, created_by) VALUES
  (1, 'BK Ordinary Shares',   10000, 7500, 350.00, 'RWF', 'active',   'Bank of Kigali ordinary shares', 2),
  (1, 'BK Preferred Shares',   5000, 3200, 500.00, 'RWF', 'active',   'BK preferred shares with dividend priority', 2),
  (2, 'Equity Rwanda Shares',  8000, 6000, 280.00, 'RWF', 'active',   'Equity Bank growth shares', 3),
  (2, 'EBR Growth Fund',       3000, 1500, 420.00, 'RWF', 'active',   'EBR high-growth investment shares', 3),
  (3, 'I&M Bank Shares',       6000, 4800, 310.00, 'RWF', 'active',   'I&M Bank Rwanda shares', 2),
  (4, 'Cogebanque Shares',     4000,    0, 195.00, 'RWF', 'inactive', 'Currently suspended', 2);
