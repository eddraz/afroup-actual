-- Single-use password reset tokens for public-site accounts.
CREATE TABLE afroup_password_resets (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES afroup_users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_afroup_password_resets_user ON afroup_password_resets (user_id);
CREATE INDEX idx_afroup_password_resets_expires ON afroup_password_resets (expires_at);
