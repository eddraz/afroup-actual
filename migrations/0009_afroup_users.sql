-- AfroUp public-site accounts (separate from legacy admin_sessions).
-- Each user starts unverified and gets a single-use token mailed to them.
CREATE TABLE afroup_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_afroup_users_email ON afroup_users (email);

CREATE TABLE afroup_email_verifications (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES afroup_users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  consumed_at TEXT
);

CREATE INDEX idx_afroup_email_verifications_user ON afroup_email_verifications (user_id);