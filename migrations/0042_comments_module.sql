-- Migration 0042: Comentarios Module (cola de moderación de comentarios)

-- 1. The 'comentarios' admin module is already registered by 0010; only ensure its
--    permissions and grants exist (safe no-op when 0010 already seeded them).

-- 2. Register permissions: create, read, update, delete for 'comentarios' module
INSERT INTO admin_permissions (module_id, action, name)
SELECT m.id, a.action, m.slug || ':' || a.action
  FROM admin_modules m
  CROSS JOIN (
    SELECT 'create' AS action UNION ALL SELECT 'read' UNION ALL SELECT 'update' UNION ALL SELECT 'delete'
  ) AS a
 WHERE m.slug = 'comentarios'
   AND NOT EXISTS (
     SELECT 1 FROM admin_permissions p
      WHERE p.module_id = m.id AND p.action = a.action
   );

-- 3. Grant full permissions on 'comentarios' module to Administrador role
INSERT INTO admin_role_permissions (role_id, permission_id, parent, quota, translate_manual, translate_ai)
SELECT r.id, p.id, 1, NULL, 1, 1
  FROM admin_roles r
  JOIN admin_permissions p ON p.module_id = (SELECT id FROM admin_modules WHERE slug = 'comentarios')
 WHERE r.name = 'Administrador'
   AND NOT EXISTS (
     SELECT 1 FROM admin_role_permissions rp
      WHERE rp.role_id = r.id AND rp.permission_id = p.id
   );

-- 4. Grant direct permissions to active administrator users
INSERT INTO admin_user_permissions (user_id, permission_id, parent, quota, translate_manual, translate_ai)
SELECT u.id, p.id, 1, NULL, 1, 1
  FROM users u
  CROSS JOIN admin_permissions p
 WHERE u.email IN ('jenniffer@afroup.com', 'tantaroth@gmail.com', 'tantaorth@gmail.com')
   AND p.module_id = (SELECT id FROM admin_modules WHERE slug = 'comentarios')
   AND NOT EXISTS (
     SELECT 1 FROM admin_user_permissions up
      WHERE up.user_id = u.id AND up.permission_id = p.id
   );

-- 5. Create user_comments table (name kept as `user_comments` for the /admin COUNT(*) fallback)
CREATE TABLE IF NOT EXISTS user_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER REFERENCES articles(id) ON DELETE SET NULL,
  article_title TEXT NOT NULL DEFAULT '',
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'Anónimo',
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','reported','rejected')),
  admin_reply TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_user_comments_status_created ON user_comments (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_comments_article_created ON user_comments (article_id, created_at DESC);

-- 6. Seed the four moderation-queue rows matching the current /admin/comentarios mock.
--    `article_id` stays NULL until comments are attached to real articles; titles are snapshots.
INSERT OR IGNORE INTO user_comments (id, article_id, article_title, user_id, author_name, body, status, admin_reply, created_at, updated_at)
VALUES
  (
    1,
    NULL,
    'Voces de la diáspora',
    NULL,
    'Anónimo',
    'Excelente entrevista, me hizo reflexionar sobre mi propia historia y raíces familiares.',
    'reported',
    '',
    datetime('now', '-4 minutes'),
    datetime('now', '-4 minutes')
  ),
  (
    2,
    NULL,
    'Afrofuturismo: imaginar el mañana',
    NULL,
    'Laura G.',
    '¿Dónde consigo el libro que mencionan en el segundo párrafo? Me interesa mucho.',
    'pending',
    '',
    datetime('now', '-22 minutes'),
    datetime('now', '-22 minutes')
  ),
  (
    3,
    NULL,
    'Trenzas como mapas de resistencia',
    NULL,
    'Andrés M.',
    'Comparte información valiosa e histórica. Lo voy a usar como material en mi clase universitaria.',
    'approved',
    '',
    datetime('now', '-1 hour'),
    datetime('now', '-1 hour')
  ),
  (
    4,
    NULL,
    'Quilombos y palenques: territorios de libertad',
    NULL,
    'Sofía R.',
    'Falta profundizar en el contexto histórico sobre la Nueva Granada y las rutas de escape.',
    'pending',
    '',
    datetime('now', '-2 hours'),
    datetime('now', '-2 hours')
  );
