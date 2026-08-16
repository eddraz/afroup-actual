-- Per-locale public bios, plus a translation module that gates AI use.
CREATE TABLE afroup_user_bios (
  user_id INTEGER NOT NULL REFERENCES afroup_users(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, locale)
);

CREATE INDEX idx_afroup_user_bios_locale ON afroup_user_bios (locale);

INSERT INTO afroup_user_bios (user_id, locale, body, updated_at)
SELECT id, 'es', bio, updated_at
  FROM afroup_users
 WHERE bio IS NOT NULL AND trim(bio) != '';

INSERT INTO admin_modules (name, slug, description) VALUES
  ('Traducción', 'traduccion', 'Traducir textos del sitio a mano o con IA.');

INSERT INTO admin_permissions (module_id, action, name)
SELECT m.id, a.action, m.slug || ':' || a.action
  FROM admin_modules m
  CROSS JOIN (
    SELECT 'create' AS action UNION ALL SELECT 'read' UNION ALL SELECT 'update' UNION ALL SELECT 'delete'
  ) AS a
 WHERE m.slug = 'traduccion';

-- create = translate with AI, update = write translations by hand.
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
  FROM admin_roles r
  JOIN admin_permissions p ON p.module_id = (SELECT id FROM admin_modules WHERE slug = 'traduccion')
 WHERE r.name = 'Administrador';
