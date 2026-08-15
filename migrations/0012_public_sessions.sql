-- Public-site sessions and profile fields for /cuenta.
ALTER TABLE afroup_users ADD COLUMN bio TEXT;
ALTER TABLE afroup_users ADD COLUMN avatar_url TEXT;

CREATE TABLE afroup_sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES afroup_users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_afroup_sessions_user ON afroup_sessions (user_id);
CREATE INDEX idx_afroup_sessions_expires ON afroup_sessions (expires_at);
