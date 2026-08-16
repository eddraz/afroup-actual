-- Each assigned permission can grant parent access and a numeric record limit.
ALTER TABLE admin_user_permissions ADD COLUMN parent INTEGER NOT NULL DEFAULT 0 CHECK (parent IN (0, 1));
ALTER TABLE admin_user_permissions ADD COLUMN quota INTEGER;

ALTER TABLE admin_role_permissions ADD COLUMN parent INTEGER NOT NULL DEFAULT 0 CHECK (parent IN (0, 1));
ALTER TABLE admin_role_permissions ADD COLUMN quota INTEGER;

-- Move the previous parent-user grants onto the Usuarios permission cells.
INSERT OR IGNORE INTO admin_user_permissions (user_id, permission_id, parent, quota)
SELECT g.child_id, p.id, 1, NULL
  FROM admin_parent_grants g
  JOIN admin_modules m ON m.slug = 'usuarios'
  JOIN admin_permissions p ON p.module_id = m.id AND p.action = g.action;

UPDATE admin_user_permissions
   SET parent = 1
 WHERE EXISTS (
   SELECT 1
     FROM admin_parent_grants g
     JOIN admin_modules m ON m.slug = 'usuarios'
     JOIN admin_permissions p ON p.module_id = m.id AND p.action = g.action
    WHERE g.child_id = admin_user_permissions.user_id
      AND p.id = admin_user_permissions.permission_id
 );
