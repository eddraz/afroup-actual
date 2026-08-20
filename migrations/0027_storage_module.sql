-- Storage R2 module registration and RBAC permissions
INSERT INTO admin_modules (name, slug, description)
SELECT 'Almacenamiento R2', 'almacenamiento', 'Gestión de buckets y objetos R2 de Cloudflare.'
 WHERE NOT EXISTS (SELECT 1 FROM admin_modules WHERE slug = 'almacenamiento');

INSERT INTO admin_permissions (module_id, action, name)
SELECT m.id, a.action, m.slug || ':' || a.action
  FROM admin_modules m
  CROSS JOIN (
    SELECT 'create' AS action UNION ALL SELECT 'read' UNION ALL SELECT 'update' UNION ALL SELECT 'delete'
  ) AS a
 WHERE m.slug = 'almacenamiento'
   AND NOT EXISTS (
     SELECT 1 FROM admin_permissions p
      WHERE p.module_id = m.id AND p.action = a.action
   );

INSERT OR IGNORE INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
  FROM admin_roles r
  JOIN admin_permissions p ON p.module_id = (SELECT id FROM admin_modules WHERE slug = 'almacenamiento')
 WHERE r.name = 'Administrador';

INSERT OR IGNORE INTO admin_user_permissions (user_id, permission_id)
SELECT u.id, p.id
  FROM users u
  JOIN admin_roles r ON r.id = u.role_id AND r.name = 'Administrador'
  JOIN admin_permissions p ON p.module_id = (SELECT id FROM admin_modules WHERE slug = 'almacenamiento');
