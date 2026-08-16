-- Public-site language catalog. Spanish and English are pillars.
CREATE TABLE site_languages (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  is_visible INTEGER NOT NULL DEFAULT 0 CHECK (is_visible IN (0, 1)),
  is_pillar INTEGER NOT NULL DEFAULT 0 CHECK (is_pillar IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE site_language_dictionaries (
  code TEXT PRIMARY KEY REFERENCES site_languages(code) ON DELETE CASCADE,
  dictionary TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO site_languages (code, name, native_name, is_visible, is_pillar, sort_order) VALUES
  ('es', 'Spanish', 'Español', 1, 1, 1),
  ('en', 'English', 'English', 1, 1, 2);

INSERT INTO admin_modules (name, slug, description) VALUES
  ('Idiomas', 'idiomas', 'Idiomas visibles del sitio público.');

INSERT INTO admin_permissions (module_id, action, name)
SELECT m.id, a.action, m.slug || ':' || a.action
  FROM admin_modules m
  CROSS JOIN (
    SELECT 'create' AS action UNION ALL SELECT 'read' UNION ALL SELECT 'update' UNION ALL SELECT 'delete'
  ) AS a
 WHERE m.slug = 'idiomas';

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
  FROM admin_roles r
  JOIN admin_permissions p ON p.module_id = (SELECT id FROM admin_modules WHERE slug = 'idiomas')
 WHERE r.name = 'Administrador';
