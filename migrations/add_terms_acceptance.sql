-- Terms and Conditions acceptance tracking.
-- Normally applied automatically by backend/db.php (ensure_schema).
-- Run manually only if you prefer explicit migrations.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS terms_version VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS terms_accepted_at DATETIME DEFAULT NULL;
