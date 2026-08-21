-- Register 'contacto' admin module
INSERT INTO admin_modules (name, slug, description)
SELECT 'Contacto', 'contacto', 'Gestión de información de contacto de la página y bandeja de mensajes recibidos.'
 WHERE NOT EXISTS (SELECT 1 FROM admin_modules WHERE slug = 'contacto');

-- Register permissions: create, read, update, delete for 'contacto' module
INSERT INTO admin_permissions (module_id, action, name)
SELECT m.id, a.action, m.slug || ':' || a.action
  FROM admin_modules m
  CROSS JOIN (
    SELECT 'create' AS action UNION ALL SELECT 'read' UNION ALL SELECT 'update' UNION ALL SELECT 'delete'
  ) AS a
 WHERE m.slug = 'contacto'
   AND NOT EXISTS (
     SELECT 1 FROM admin_permissions p
      WHERE p.module_id = m.id AND p.action = a.action
   );

-- Grant full permissions on 'contacto' module to Administrador role
INSERT INTO admin_role_permissions (role_id, permission_id, parent, quota, translate_manual, translate_ai)
SELECT r.id, p.id, 1, NULL, 1, 1
  FROM admin_roles r
  JOIN admin_permissions p ON p.module_id = (SELECT id FROM admin_modules WHERE slug = 'contacto')
 WHERE r.name = 'Administrador'
   AND NOT EXISTS (
     SELECT 1 FROM admin_role_permissions rp
      WHERE rp.role_id = r.id AND rp.permission_id = p.id
   );

-- Grant direct permissions to active administrator users
INSERT INTO admin_user_permissions (user_id, permission_id, parent, quota, translate_manual, translate_ai)
SELECT u.id, p.id, 1, NULL, 1, 1
  FROM users u
  CROSS JOIN admin_permissions p
 WHERE u.email IN ('jenniffer@afroup.com', 'tantaroth@gmail.com', 'tantaorth@gmail.com')
   AND p.module_id = (SELECT id FROM admin_modules WHERE slug = 'contacto')
   AND NOT EXISTS (
     SELECT 1 FROM admin_user_permissions up
      WHERE up.user_id = u.id AND up.permission_id = p.id
   );

-- Create table for per-locale Contact Us page content
CREATE TABLE IF NOT EXISTS contact_page_locales (
  locale TEXT NOT NULL PRIMARY KEY,
  eyebrow TEXT NOT NULL DEFAULT 'Contáctanos',
  title TEXT NOT NULL DEFAULT 'Hablemos',
  lead TEXT NOT NULL DEFAULT 'Prensa, alianzas, talleres o simplemente saludar — te respondemos en menos de 72 horas.',
  email TEXT NOT NULL DEFAULT 'hello@afroup.org',
  whatsapp TEXT NOT NULL DEFAULT '+57 320 7146 · +31 20 211 7146',
  base_location TEXT NOT NULL DEFAULT 'Colombia · trabajamos con toda la diáspora',
  social_channels TEXT NOT NULL DEFAULT '@afroup en Instagram, TikTok, YouTube y Facebook',
  response_time TEXT NOT NULL DEFAULT 'Menos de 72 horas',
  og_json TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create table for received contact submissions / messages
CREATE TABLE IF NOT EXISTS contact_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'es',
  status TEXT NOT NULL DEFAULT 'unread', -- 'unread' | 'read' | 'replied' | 'archived'
  ip_address TEXT,
  user_agent TEXT,
  admin_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);

-- Seed initial Contact page records for Spanish (es) and English (en)
INSERT OR IGNORE INTO contact_page_locales (
  locale, eyebrow, title, lead,
  email, whatsapp, base_location, social_channels,
  response_time, og_json
) VALUES (
  'es',
  'Contáctanos',
  'Hablemos',
  'Prensa, alianzas, talleres o simplemente saludar — te respondemos en menos de 72 horas.',
  'hello@afroup.org',
  '+57 320 7146 · +31 20 211 7146',
  'Colombia · trabajamos con toda la diáspora',
  '@afroup en Instagram, TikTok, YouTube y Facebook',
  'Menos de 72 horas',
  '{"title":"Contacto · AfroUp","description":"Ponte en contacto con el equipo de AfroUp.","og:image":"/assets/brand-hero.png"}'
);

INSERT OR IGNORE INTO contact_page_locales (
  locale, eyebrow, title, lead,
  email, whatsapp, base_location, social_channels,
  response_time, og_json
) VALUES (
  'en',
  'Contact us',
  "Let's talk",
  'Press, partnerships, workshops or just saying hi — we reply in less than 72 hours.',
  'hello@afroup.org',
  '+57 320 7146 · +31 20 211 7146',
  'Colombia · working with the entire diaspora',
  '@afroup on Instagram, TikTok, YouTube and Facebook',
  'Less than 72 hours',
  '{"title":"Contact · AfroUp","description":"Get in touch with the AfroUp team.","og:image":"/assets/brand-hero.png"}'
);

-- Seed sample contact submissions for initial display
INSERT INTO contact_submissions (name, email, subject, message, locale, status, created_at)
SELECT 'Carlos Murillo', 'carlos.murillo@cultura.org', 'Alianzas y colaboraciones', 'Hola equipo de AfroUp, nos gustaría explorar una alianza cultural para talleres comunitarios en Cali y el Pacífico.', 'es', 'unread', datetime('now', '-2 hours')
 WHERE NOT EXISTS (SELECT 1 FROM contact_submissions WHERE email = 'carlos.murillo@cultura.org');

INSERT INTO contact_submissions (name, email, subject, message, locale, status, created_at)
SELECT 'Maya Johnson', 'maya.j@diasporamedia.com', 'Prensa', 'Hello! We are writing a feature on educational digital platforms in Latin America and would love to interview your founders.', 'en', 'read', datetime('now', '-1 day')
 WHERE NOT EXISTS (SELECT 1 FROM contact_submissions WHERE email = 'maya.j@diasporamedia.com');
