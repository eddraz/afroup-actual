-- Admin RBAC: modules, permissions (create/read/update/delete per module),
-- roles (group of permissions), and admin_users with direct per-user permissions.
-- The final source for a user's effective permissions is admin_user_permissions.
CREATE TABLE admin_modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE admin_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER NOT NULL REFERENCES admin_modules(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete')),
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_admin_permissions_module_action ON admin_permissions (module_id, action);

CREATE TABLE admin_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE admin_role_permissions (
  role_id INTEGER NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role_id INTEGER REFERENCES admin_roles(id) ON DELETE SET NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE admin_user_permissions (
  user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, permission_id)
);

-- Seed modules that mirror the existing admin sections.
INSERT INTO admin_modules (name, slug, description) VALUES
  ('Artículos', 'articulos', 'Editorial: borradores, revisión y publicación.'),
  ('Comentarios', 'comentarios', 'Cola de moderación y respuestas.'),
  ('Proyectos', 'proyectos', 'Proyectos aliados y presupuesto.'),
  ('Usuarios', 'usuarios', 'Cuentas públicas y permisos admin.'),
  ('Módulos', 'modulos', 'Catálogo de módulos del sistema.'),
  ('Permisos', 'permisos', 'Acciones por módulo: crear, leer, actualizar, borrar.'),
  ('Roles', 'roles', 'Agrupadores de permisos.');

-- Generate the four base permissions per module.
INSERT INTO admin_permissions (module_id, action, name)
SELECT m.id, a.action, m.slug || ':' || a.action
FROM admin_modules m
CROSS JOIN (
  VALUES ('create'), ('read'), ('update'), ('delete')
) AS a(action);

-- Default roles.
INSERT INTO admin_roles (name, description) VALUES
  ('Administrador', 'Acceso total al panel de administración.'),
  ('Editor', 'Crear, leer y actualizar contenido editorial.'),
  ('Moderador', 'Leer y moderar comentarios.');

-- Administrator = every permission.
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r
CROSS JOIN admin_permissions p
WHERE r.name = 'Administrador';

-- Editor: read/update/create on articulos + read on comentarios + read on proyectos.
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r
JOIN admin_permissions p ON p.module_id IN (
  SELECT id FROM admin_modules WHERE slug IN ('articulos', 'comentarios', 'proyectos')
)
WHERE r.name = 'Editor' AND p.action IN ('read', 'update', 'create');

-- Moderator: read/update on comentarios + read on articulos.
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r
JOIN admin_permissions p ON p.module_id IN (
  SELECT id FROM admin_modules WHERE slug IN ('comentarios', 'articulos')
)
WHERE r.name = 'Moderador' AND p.action IN ('read', 'update');