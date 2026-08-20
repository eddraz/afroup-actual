-- Unify public and admin identity into one `users` table.
-- Public ids stay. Admin ids never become users.id. Remap admin FKs through admin_id_map.
-- Do not apply this migration remotely until the Worker that reads `users` is deployed.
PRAGMA foreign_keys = OFF;

CREATE TABLE admin_id_map (
  admin_id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  verified_at TEXT,
  bio TEXT,
  avatar_url TEXT,
  role_id INTEGER REFERENCES admin_roles(id) ON DELETE SET NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  invite_pending INTEGER NOT NULL DEFAULT 0 CHECK (invite_pending IN (0, 1)),
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO users (
  id, name, email, password_hash, verified_at, bio, avatar_url,
  role_id, is_active, invite_pending, created_by, created_at, updated_at
)
SELECT
  id, name, email, password_hash, verified_at, bio, avatar_url,
  NULL, 1, 0, NULL, created_at, updated_at
FROM afroup_users;

INSERT INTO admin_id_map (admin_id, user_id)
SELECT a.id, p.id
  FROM admin_users a
  JOIN afroup_users p ON p.email = a.email;

-- Email match keeps the public hash: password_hash = afroup_users.password_hash
UPDATE users
   SET password_hash = (
         SELECT password_hash FROM afroup_users WHERE afroup_users.id = users.id
       ),
       role_id = (
         SELECT a.role_id FROM admin_users a WHERE a.email = users.email
       ),
       is_active = (
         SELECT a.is_active FROM admin_users a WHERE a.email = users.email
       ),
       invite_pending = CASE
         WHEN (SELECT afroup_users.verified_at FROM afroup_users WHERE afroup_users.id = users.id) IS NOT NULL THEN 0
         ELSE (SELECT a.invite_pending FROM admin_users a WHERE a.email = users.email)
       END,
       created_by = (
         SELECT a.created_by FROM admin_users a WHERE a.email = users.email
       )
 WHERE email IN (SELECT email FROM admin_users);

-- Invite-only admins get a new users.id after every existing public or admin id.
INSERT INTO users (
  id, name, email, password_hash, verified_at, bio, avatar_url,
  role_id, is_active, invite_pending, created_by, created_at, updated_at
)
SELECT
  (
    SELECT MAX(bound) FROM (
      SELECT COALESCE(MAX(id), 0) AS bound FROM afroup_users
      UNION ALL
      SELECT COALESCE(MAX(id), 0) AS bound FROM admin_users
    )
  ) + (
    SELECT COUNT(*)
      FROM admin_users other
     WHERE NOT EXISTS (
       SELECT 1 FROM afroup_users matched WHERE matched.email = other.email
     )
       AND other.id <= a.id
  ),
  a.name,
  a.email,
  a.password_hash,
  NULL,
  NULL,
  NULL,
  a.role_id,
  a.is_active,
  a.invite_pending,
  a.created_by,
  a.created_at,
  a.updated_at
  FROM admin_users a
 WHERE NOT EXISTS (
   SELECT 1 FROM afroup_users matched WHERE matched.email = a.email
 );

INSERT INTO admin_id_map (admin_id, user_id)
SELECT a.id, u.id
  FROM admin_users a
  JOIN users u ON u.email = a.email
 WHERE NOT EXISTS (
   SELECT 1 FROM admin_id_map mapped WHERE mapped.admin_id = a.id
 );

UPDATE users
   SET created_by = NULL
 WHERE created_by IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM admin_id_map m WHERE m.admin_id = users.created_by
   );

UPDATE users
   SET created_by = (
     SELECT m.user_id
       FROM admin_id_map m
      WHERE m.admin_id = users.created_by
   )
 WHERE created_by IS NOT NULL;

DELETE FROM admin_parent_grants
 WHERE child_id NOT IN (SELECT admin_id FROM admin_id_map)
    OR parent_id NOT IN (SELECT admin_id FROM admin_id_map)
    OR child_id = parent_id;

DELETE FROM admin_user_permissions
 WHERE user_id NOT IN (SELECT admin_id FROM admin_id_map);

DELETE FROM admin_user_invitations
 WHERE user_id NOT IN (SELECT admin_id FROM admin_id_map);

CREATE TABLE admin_user_permissions_new (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
  parent INTEGER NOT NULL DEFAULT 0 CHECK (parent IN (0, 1)),
  quota INTEGER,
  translate TEXT NOT NULL DEFAULT 'none' CHECK (translate IN ('none', 'manual', 'ai')),
  translate_manual INTEGER NOT NULL DEFAULT 0 CHECK (translate_manual IN (0, 1)),
  translate_ai INTEGER NOT NULL DEFAULT 0 CHECK (translate_ai IN (0, 1)),
  PRIMARY KEY (user_id, permission_id)
);

INSERT INTO admin_user_permissions_new (
  user_id, permission_id, parent, quota, translate, translate_manual, translate_ai
)
SELECT m.user_id, p.permission_id, p.parent, p.quota, p.translate, p.translate_manual, p.translate_ai
  FROM admin_user_permissions p
  JOIN admin_id_map m ON m.admin_id = p.user_id;

DROP TABLE admin_user_permissions;
ALTER TABLE admin_user_permissions_new RENAME TO admin_user_permissions;

CREATE TABLE admin_user_invitations_new (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO admin_user_invitations_new (token, user_id, expires_at, consumed_at, created_at)
SELECT i.token, m.user_id, i.expires_at, i.consumed_at, i.created_at
  FROM admin_user_invitations i
  JOIN admin_id_map m ON m.admin_id = i.user_id;

DROP TABLE admin_user_invitations;
ALTER TABLE admin_user_invitations_new RENAME TO admin_user_invitations;
CREATE INDEX idx_admin_user_invitations_user ON admin_user_invitations (user_id);

CREATE TABLE admin_parent_grants_new (
  child_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (child_id, parent_id, action),
  CHECK (child_id != parent_id)
);

INSERT INTO admin_parent_grants_new (child_id, parent_id, action, created_at)
SELECT mc.user_id, mp.user_id, g.action, MIN(g.created_at)
  FROM admin_parent_grants g
  JOIN admin_id_map mc ON mc.admin_id = g.child_id
  JOIN admin_id_map mp ON mp.admin_id = g.parent_id
 WHERE mc.user_id != mp.user_id
 GROUP BY mc.user_id, mp.user_id, g.action;

DROP TABLE admin_parent_grants;
ALTER TABLE admin_parent_grants_new RENAME TO admin_parent_grants;
CREATE INDEX idx_admin_parent_grants_parent ON admin_parent_grants (parent_id);
CREATE INDEX idx_admin_parent_grants_child ON admin_parent_grants (child_id);

CREATE TABLE afroup_sessions_new (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO afroup_sessions_new (token, user_id, expires_at, created_at)
SELECT token, user_id, expires_at, created_at
  FROM afroup_sessions;

DROP TABLE afroup_sessions;
ALTER TABLE afroup_sessions_new RENAME TO afroup_sessions;
CREATE INDEX idx_afroup_sessions_user ON afroup_sessions (user_id);
CREATE INDEX idx_afroup_sessions_expires ON afroup_sessions (expires_at);

CREATE TABLE afroup_email_verifications_new (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  consumed_at TEXT
);

INSERT INTO afroup_email_verifications_new (token, user_id, expires_at, consumed_at)
SELECT token, user_id, expires_at, consumed_at
  FROM afroup_email_verifications;

DROP TABLE afroup_email_verifications;
ALTER TABLE afroup_email_verifications_new RENAME TO afroup_email_verifications;
CREATE INDEX idx_afroup_email_verifications_user ON afroup_email_verifications (user_id);

CREATE TABLE afroup_password_resets_new (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO afroup_password_resets_new (token, user_id, expires_at, consumed_at, created_at)
SELECT token, user_id, expires_at, consumed_at, created_at
  FROM afroup_password_resets;

DROP TABLE afroup_password_resets;
ALTER TABLE afroup_password_resets_new RENAME TO afroup_password_resets;
CREATE INDEX idx_afroup_password_resets_user ON afroup_password_resets (user_id);
CREATE INDEX idx_afroup_password_resets_expires ON afroup_password_resets (expires_at);

CREATE TABLE afroup_user_bios_new (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, locale)
);

INSERT INTO afroup_user_bios_new (user_id, locale, body, updated_at)
SELECT user_id, locale, body, updated_at
  FROM afroup_user_bios;

DROP TABLE afroup_user_bios;
ALTER TABLE afroup_user_bios_new RENAME TO afroup_user_bios;
CREATE INDEX idx_afroup_user_bios_locale ON afroup_user_bios (locale);

CREATE INDEX idx_users_invite_pending ON users (invite_pending);
CREATE INDEX idx_users_created_by ON users (created_by);

UPDATE admin_modules
   SET slug = 'users'
 WHERE slug = 'usuarios'
   AND name = 'Usuarios';

UPDATE admin_permissions
   SET name = 'users:' || action
 WHERE module_id = (SELECT id FROM admin_modules WHERE slug = 'users');

INSERT OR IGNORE INTO admin_user_permissions (user_id, permission_id)
SELECT u.id, p.id
  FROM users u
  JOIN admin_permissions p ON p.name IN ('users:read', 'users:update');

DELETE FROM sqlite_sequence WHERE name = 'users';
INSERT INTO sqlite_sequence (name, seq)
SELECT 'users', COALESCE(MAX(id), 0) FROM users;

DROP TABLE admin_id_map;
DROP TABLE afroup_users;
DROP TABLE admin_users;

PRAGMA foreign_keys = ON;
