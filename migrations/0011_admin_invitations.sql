-- Make password_hash nullable so the admin can create a user without a password.
-- The invitee completes the registration via the email link.
PRAGMA foreign_keys = OFF;

CREATE TABLE admin_users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role_id INTEGER REFERENCES admin_roles(id) ON DELETE SET NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  invite_pending INTEGER NOT NULL DEFAULT 1 CHECK (invite_pending IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO admin_users_new (id, name, email, password_hash, role_id, is_active, invite_pending, created_at, updated_at)
SELECT id, name, email, password_hash, role_id, is_active, 0, created_at, updated_at FROM admin_users;

DROP TABLE admin_users;
ALTER TABLE admin_users_new RENAME TO admin_users;

CREATE INDEX idx_admin_users_email ON admin_users (email);
CREATE INDEX idx_admin_users_invite_pending ON admin_users (invite_pending);

PRAGMA foreign_keys = ON;

-- Single-use tokens for the invitee to set their password.
CREATE TABLE admin_user_invitations (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_admin_user_invitations_user ON admin_user_invitations (user_id);