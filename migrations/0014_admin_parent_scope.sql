-- Scope admin users to their creator and allow explicit CRUD grants on the parent.
ALTER TABLE admin_users ADD COLUMN created_by INTEGER;
CREATE INDEX idx_admin_users_created_by ON admin_users (created_by);

UPDATE admin_users
   SET created_by = (SELECT MIN(id) FROM admin_users)
 WHERE id != (SELECT MIN(id) FROM admin_users);

CREATE TABLE admin_parent_grants (
  child_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  parent_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (child_id, parent_id, action),
  CHECK (child_id != parent_id)
);

CREATE INDEX idx_admin_parent_grants_parent ON admin_parent_grants (parent_id);
CREATE INDEX idx_admin_parent_grants_child ON admin_parent_grants (child_id);
