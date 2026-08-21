-- Migration 0037: Collaborate Module (Colabora / Postulaciones y Skills)

-- 1. Register 'colabora' admin module
INSERT INTO admin_modules (name, slug, description)
SELECT 'Colabora', 'colabora', 'Gestión del programa de colaboración comunitaria, roles/skills y bandeja de postulaciones recibidas.'
 WHERE NOT EXISTS (SELECT 1 FROM admin_modules WHERE slug = 'colabora');

-- 2. Register permissions: create, read, update, delete for 'colabora' module
INSERT INTO admin_permissions (module_id, action, name)
SELECT m.id, a.action, m.slug || ':' || a.action
  FROM admin_modules m
  CROSS JOIN (
    SELECT 'create' AS action UNION ALL SELECT 'read' UNION ALL SELECT 'update' UNION ALL SELECT 'delete'
  ) AS a
 WHERE m.slug = 'colabora'
   AND NOT EXISTS (
     SELECT 1 FROM admin_permissions p
      WHERE p.module_id = m.id AND p.action = a.action
   );

-- 3. Grant full permissions on 'colabora' module to Administrador role
INSERT INTO admin_role_permissions (role_id, permission_id, parent, quota, translate_manual, translate_ai)
SELECT r.id, p.id, 1, NULL, 1, 1
  FROM admin_roles r
  JOIN admin_permissions p ON p.module_id = (SELECT id FROM admin_modules WHERE slug = 'colabora')
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
   AND p.module_id = (SELECT id FROM admin_modules WHERE slug = 'colabora')
   AND NOT EXISTS (
     SELECT 1 FROM admin_user_permissions up
      WHERE up.user_id = u.id AND up.permission_id = p.id
   );

-- 5. Create collaborate_skills table (perfil / especialidad de colaboración)
CREATE TABLE IF NOT EXISTS collaborate_skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT 'ic-book2', -- ic-book2 | ic-share | ic-search | ic-play | ic-sparkles | ic-world
  badge_color TEXT NOT NULL DEFAULT 'accent', -- accent | secondary | primary | warning | info
  status TEXT NOT NULL DEFAULT 'active', -- active | hidden
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_collaborate_skills_slug ON collaborate_skills(slug);
CREATE INDEX IF NOT EXISTS idx_collaborate_skills_status ON collaborate_skills(status);

-- 6. Create collaborate_skill_locales table
CREATE TABLE IF NOT EXISTS collaborate_skill_locales (
  skill_id INTEGER NOT NULL REFERENCES collaborate_skills(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  dek TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (skill_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_collaborate_skill_locales_locale ON collaborate_skill_locales(locale);

-- 7. Create collaborate_page_locales table (Hero, encabezados y textos de /colabora)
CREATE TABLE IF NOT EXISTS collaborate_page_locales (
  locale TEXT PRIMARY KEY,
  eyebrow TEXT NOT NULL DEFAULT 'Colabora',
  title TEXT NOT NULL DEFAULT 'AfroUp se construye en comunidad',
  lead TEXT NOT NULL DEFAULT 'Aporta tu talento: cada artículo, traducción o ilustración amplía el acceso al conocimiento afro.',
  form_title TEXT NOT NULL DEFAULT 'Cuéntanos de ti',
  form_note TEXT NOT NULL DEFAULT 'Te respondemos en menos de 72 horas. Las colaboraciones publicadas se remuneran.',
  og_json TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. Create collaborate_submissions table (Bandeja de postulantes)
CREATE TABLE IF NOT EXISTS collaborate_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role_wanted TEXT NOT NULL,
  skill_id INTEGER REFERENCES collaborate_skills(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  portfolio_url TEXT,
  status TEXT NOT NULL DEFAULT 'unread', -- unread | read | contacted | archived
  notes TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_collab_sub_status ON collaborate_submissions(status);
CREATE INDEX IF NOT EXISTS idx_collab_sub_created_at ON collaborate_submissions(created_at DESC);

-- 9. Seed collaborate_page_locales
INSERT INTO collaborate_page_locales (
  locale, eyebrow, title, lead, form_title, form_note, og_json, updated_at
) VALUES (
  'es',
  'Colabora',
  'AfroUp se construye en comunidad',
  'Aporta tu talento: cada artículo, traducción o ilustración amplía el acceso al conocimiento afro.',
  'Cuéntanos de ti',
  'Te respondemos en menos de 72 horas. Las colaboraciones publicadas se remuneran.',
  json_object('title', 'Colabora con AfroUp', 'description', 'Suma tu talento a la comunidad AfroUp: redacción, traducción, investigación, diseño y multimedia.'),
  datetime('now')
), (
  'en',
  'Collaborate',
  'AfroUp is built in community',
  'Contribute your talent: every article, translation, or illustration expands access to Afro-descendant knowledge.',
  'Tell us about yourself',
  'We reply within 72 hours. Published contributions are compensated.',
  json_object('title', 'Collaborate with AfroUp', 'description', 'Join the AfroUp community: writing, translation, research, design, and media.'),
  datetime('now')
)
ON CONFLICT(locale) DO NOTHING;

-- 10. Seed initial default skills
INSERT INTO collaborate_skills (id, slug, icon, badge_color, status, sort_order, created_at, updated_at)
VALUES
(1, 'escribe', 'ic-book2', 'accent', 'active', 1, datetime('now'), datetime('now')),
(2, 'traduce', 'ic-share', 'secondary', 'active', 2, datetime('now'), datetime('now')),
(3, 'investiga', 'ic-search', 'primary', 'active', 3, datetime('now'), datetime('now')),
(4, 'crea', 'ic-play', 'accent', 'active', 4, datetime('now'), datetime('now'))
ON CONFLICT(id) DO NOTHING;

-- 11. Seed localized titles & descriptions for skills
INSERT INTO collaborate_skill_locales (skill_id, locale, title, dek, updated_at)
VALUES
(1, 'es', 'Escribe', 'Artículos, reseñas y crónicas sobre cultura afro.', datetime('now')),
(1, 'en', 'Write', 'Articles, reviews, and essays on Afro-descendant culture.', datetime('now')),
(2, 'es', 'Traduce', 'Lleva el contenido a EN, PT y FR para toda la diáspora.', datetime('now')),
(2, 'en', 'Translate', 'Translate content into EN, PT, and FR for the global diaspora.', datetime('now')),
(3, 'es', 'Investiga', 'Fuentes, archivo y verificación de datos.', datetime('now')),
(3, 'en', 'Research', 'Sources, archives, and historical data verification.', datetime('now')),
(4, 'es', 'Crea', 'Ilustración, video y diseño para los contenidos.', datetime('now')),
(4, 'en', 'Create', 'Illustration, video, and design for digital content.', datetime('now'))
ON CONFLICT(skill_id, locale) DO NOTHING;
