-- Migration 0039: Proyectos Module (Proyectos aliados y presupuesto)

-- 1. Register 'proyectos' admin module
INSERT INTO admin_modules (name, slug, description)
SELECT 'Proyectos', 'proyectos', 'Proyectos aliados y presupuesto.'
 WHERE NOT EXISTS (SELECT 1 FROM admin_modules WHERE slug = 'proyectos');

-- 2. Register permissions: create, read, update, delete for 'proyectos' module
INSERT INTO admin_permissions (module_id, action, name)
SELECT m.id, a.action, m.slug || ':' || a.action
  FROM admin_modules m
  CROSS JOIN (
    SELECT 'create' AS action UNION ALL SELECT 'read' UNION ALL SELECT 'update' UNION ALL SELECT 'delete'
  ) AS a
 WHERE m.slug = 'proyectos'
   AND NOT EXISTS (
     SELECT 1 FROM admin_permissions p
      WHERE p.module_id = m.id AND p.action = a.action
   );

-- 3. Grant full permissions on 'proyectos' module to Administrador role
INSERT INTO admin_role_permissions (role_id, permission_id, parent, quota, translate_manual, translate_ai)
SELECT r.id, p.id, 1, NULL, 1, 1
  FROM admin_roles r
  JOIN admin_permissions p ON p.module_id = (SELECT id FROM admin_modules WHERE slug = 'proyectos')
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
   AND p.module_id = (SELECT id FROM admin_modules WHERE slug = 'proyectos')
   AND NOT EXISTS (
     SELECT 1 FROM admin_user_permissions up
      WHERE up.user_id = u.id AND up.permission_id = p.id
   );

-- 5. Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  organization TEXT NOT NULL DEFAULT '',
  stage TEXT NOT NULL DEFAULT 'borrador' CHECK (stage IN ('borrador','en_revision','aprobado')),
  budget_currency TEXT NOT NULL DEFAULT 'USD',
  budget_amount INTEGER,
  start_date TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_status_sort ON projects (status, featured DESC, sort_order ASC, created_at DESC);

-- 6. Create project_locales table
CREATE TABLE IF NOT EXISTS project_locales (
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  dek TEXT NOT NULL DEFAULT '',
  description_html TEXT NOT NULL DEFAULT '',
  og_json TEXT,
  PRIMARY KEY (project_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_project_locales_lookup ON project_locales (locale);

-- 7. Create projects_page_locales table
CREATE TABLE IF NOT EXISTS projects_page_locales (
  locale TEXT PRIMARY KEY,
  eyebrow TEXT NOT NULL DEFAULT 'Comunidad',
  title TEXT NOT NULL DEFAULT 'Proyectos en territorio',
  lead TEXT NOT NULL DEFAULT 'Del contenido a la acción: iniciativas educativas y culturales que construimos con comunidades de la diáspora.',
  band_title TEXT NOT NULL DEFAULT '¿Tienes una idea para tu comunidad?',
  band_dek TEXT NOT NULL DEFAULT 'Propón un proyecto y construyámoslo juntos.',
  band_cta_label TEXT NOT NULL DEFAULT 'Proponer proyecto',
  band_cta_url TEXT NOT NULL DEFAULT '/colabora',
  og_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. Seed Page configuration for es & en
INSERT OR IGNORE INTO projects_page_locales (locale, eyebrow, title, lead, band_title, band_dek, band_cta_label, band_cta_url)
VALUES
  (
    'es',
    'Comunidad',
    'Proyectos en territorio',
    'Del contenido a la acción: iniciativas educativas y culturales que construimos con comunidades de la diáspora.',
    '¿Tienes una idea para tu comunidad?',
    'Propón un proyecto y construyámoslo juntos.',
    'Proponer proyecto',
    '/colabora'
  ),
  (
    'en',
    'Community',
    'Projects on the ground',
    'From content to action: educational and cultural initiatives we build alongside diaspora communities.',
    'Do you have an idea for your community?',
    'Propose a project and let''s build it together.',
    'Propose a project',
    '/en/colabora'
  );

-- 9. Seed 3 Example Projects
INSERT OR IGNORE INTO projects (id, slug, organization, stage, budget_currency, budget_amount, status, featured, sort_order)
VALUES
  (1, 'archivo-oral-afrocolombiano', 'Casa de la Memoria', 'en_revision', 'USD', 8500, 'published', 0, 1),
  (2, 'atlas-afrolatinoamericano', 'Red AfroLatam', 'aprobado', 'USD', 12000, 'published', 0, 2),
  (3, 'podcast-saberes-del-pacifico', 'Colectivo Tambó', 'borrador', 'USD', 3200, 'published', 0, 3);

-- Seed Spanish translations
INSERT OR IGNORE INTO project_locales (project_id, locale, name, dek, description_html)
VALUES
  (
    1,
    'es',
    'Archivo oral afrocolombiano',
    'Rescate y digitalización de testimonios de comunidades negras de Colombia.',
    '<p>Recopilamos historias de vida de líderes y sabedores de distintas regiones del país, conservando la memoria oral afrocolombiana en un archivo digital abierto para investigadores, docentes y comunidades.</p>'
  ),
  (
    2,
    'es',
    'Atlas afrolatinoamericano',
    'Cartografía colaborativa de la presencia africana en América Latina.',
    '<p>Un mapa vivo que documenta territorios, organizaciones y expresiones culturales afrodescendientes en toda la región, construido junto a organizaciones locales.</p>'
  ),
  (
    3,
    'es',
    'Podcast Saberes del Pacífico',
    'Conversaciones con saberes, músicas y memorias del litoral Pacífico.',
    '<p>Una serie sonora producida con el Colectivo Tambó que difunde los conocimientos ancestrales, la música y las luchas territoriales de las comunidades del Pacífico colombiano.</p>'
  );

-- Seed English translations
INSERT OR IGNORE INTO project_locales (project_id, locale, name, dek, description_html)
VALUES
  (
    1,
    'en',
    'Afro-Colombian Oral Archive',
    'Rescuing and digitizing testimonials from Black communities of Colombia.',
    '<p>We collect life stories from community leaders and knowledge keepers across the country, preserving Afro-Colombian oral memory in an open digital archive for researchers, teachers, and communities.</p>'
  ),
  (
    2,
    'en',
    'Afro-Latin American Atlas',
    'Collaborative mapping of the African presence across Latin America.',
    '<p>A living map documenting Afro-descendant territories, organizations, and cultural expressions throughout the region, built together with local organizations.</p>'
  ),
  (
    3,
    'en',
    'Saberes del Pacífico Podcast',
    'Conversations with the knowledge, music, and memory of the Pacific coast.',
    '<p>A sound series produced with Colectivo Tambó that spreads ancestral knowledge, music, and territorial struggles of Colombian Pacific communities.</p>'
  );
