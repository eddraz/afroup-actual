-- Migration 0036: Resources Module (Biblioteca Libre / Recursos)

-- 1. Register 'recursos' admin module
INSERT INTO admin_modules (name, slug, description)
SELECT 'Recursos', 'recursos', 'Biblioteca libre de recursos educativos, guías PDF, lecturas y herramientas comunitarias.'
 WHERE NOT EXISTS (SELECT 1 FROM admin_modules WHERE slug = 'recursos');

-- 2. Register permissions: create, read, update, delete for 'recursos' module
INSERT INTO admin_permissions (module_id, action, name)
SELECT m.id, a.action, m.slug || ':' || a.action
  FROM admin_modules m
  CROSS JOIN (
    SELECT 'create' AS action UNION ALL SELECT 'read' UNION ALL SELECT 'update' UNION ALL SELECT 'delete'
  ) AS a
 WHERE m.slug = 'recursos'
   AND NOT EXISTS (
     SELECT 1 FROM admin_permissions p
      WHERE p.module_id = m.id AND p.action = a.action
   );

-- 3. Grant full permissions on 'recursos' module to Administrador role
INSERT INTO admin_role_permissions (role_id, permission_id, parent, quota, translate_manual, translate_ai)
SELECT r.id, p.id, 1, NULL, 1, 1
  FROM admin_roles r
  JOIN admin_permissions p ON p.module_id = (SELECT id FROM admin_modules WHERE slug = 'recursos')
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
   AND p.module_id = (SELECT id FROM admin_modules WHERE slug = 'recursos')
   AND NOT EXISTS (
     SELECT 1 FROM admin_user_permissions up
      WHERE up.user_id = u.id AND up.permission_id = p.id
   );

-- 5. Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  resource_type TEXT NOT NULL DEFAULT 'pdf', -- pdf | web | mapa | lectura | audio | doc
  category_tag TEXT NOT NULL DEFAULT 'Guía PDF', -- Guía PDF · Para docentes | Guía PDF | Glosario | Mapa | Lecturas
  file_url TEXT, -- URL to downloadable file in R2 or external link
  external_url TEXT, -- Optional external link
  cover_image_url TEXT, -- Thumbnail / preview image in R2
  format_label TEXT NOT NULL DEFAULT 'PDF', -- PDF | Web | Lista | Audio
  pages_count TEXT, -- e.g. "24 págs"
  languages_label TEXT DEFAULT 'ES/EN', -- e.g. "ES", "ES/EN"
  status TEXT NOT NULL DEFAULT 'published', -- published | draft
  featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_resources_slug ON resources(slug);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);

-- 6. Create resource_locales table
CREATE TABLE IF NOT EXISTS resource_locales (
  resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  dek TEXT NOT NULL, -- Short description
  content_html TEXT, -- Detailed description, contents, audience
  og_json TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (resource_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_resource_locales_locale ON resource_locales(locale);

-- 7. Create resources_page_locales table (Hero and banner configuration per locale)
CREATE TABLE IF NOT EXISTS resources_page_locales (
  locale TEXT PRIMARY KEY,
  eyebrow TEXT NOT NULL DEFAULT 'Biblioteca libre',
  title TEXT NOT NULL DEFAULT 'Recursos para aprender y enseñar',
  lead TEXT NOT NULL DEFAULT 'Guías, lecturas y materiales descargables — gratuitos y listos para el aula, el círculo de lectura o el autoestudio.',
  band_title TEXT NOT NULL DEFAULT '¿Tienes un recurso para compartir?',
  band_dek TEXT NOT NULL DEFAULT 'Súmalo a la biblioteca libre de AfroUp.',
  band_cta_label TEXT NOT NULL DEFAULT 'Colabora',
  band_cta_url TEXT NOT NULL DEFAULT '/colabora',
  og_json TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. Seed initial configuration for resources_page_locales
INSERT INTO resources_page_locales (
  locale, eyebrow, title, lead, band_title, band_dek, band_cta_label, band_cta_url, og_json, updated_at
) VALUES (
  'es',
  'Biblioteca libre',
  'Recursos para aprender y enseñar',
  'Guías, lecturas y materiales descargables — gratuitos y listos para el aula, el círculo de lectura o el autoestudio.',
  '¿Tienes un recurso para compartir?',
  'Súmalo a la biblioteca libre de AfroUp.',
  'Colabora',
  '/colabora',
  json_object('title', 'Recursos · AfroUp', 'description', 'Biblioteca libre de recursos educativos, guías y materiales sobre cultura afrodescendiente.'),
  datetime('now')
), (
  'en',
  'Open Library',
  'Resources to learn and teach',
  'Downloadable guides, readings, and materials — free and ready for the classroom, reading circle, or self-study.',
  'Do you have a resource to share?',
  'Add it to the AfroUp open library.',
  'Collaborate',
  '/en/colabora',
  json_object('title', 'Resources · AfroUp', 'description', 'Free educational resources, guides, and materials on Afro-descendant culture.'),
  datetime('now')
)
ON CONFLICT(locale) DO NOTHING;

-- 9. Seed default resources matching original site mockups
INSERT INTO resources (
  id, slug, resource_type, category_tag, file_url, format_label, pages_count, languages_label, status, featured, sort_order, created_at, updated_at
) VALUES 
(
  1,
  'guia-docente-cimarronaje-en-el-aula',
  'pdf',
  'Guía PDF · Para docentes',
  'https://media.afroup.org/documents/guia-docente-cimarronaje.pdf',
  'PDF',
  '24 págs',
  'ES/EN',
  'published',
  1,
  1,
  datetime('now'),
  datetime('now')
),
(
  2,
  'guia-cine-afrolatino-esencial',
  'pdf',
  'Guía PDF',
  'https://media.afroup.org/documents/guia-cine-afrolatino.pdf',
  'PDF',
  '18 págs',
  'ES',
  'published',
  1,
  2,
  datetime('now'),
  datetime('now')
),
(
  3,
  'glosario-antirracista',
  'web',
  'Glosario',
  '/antirracismo',
  'Web',
  'Web',
  'ES',
  'published',
  0,
  3,
  datetime('now'),
  datetime('now')
),
(
  4,
  'mapa-interactivo-de-la-diaspora',
  'mapa',
  'Mapa',
  '/diaspora',
  'Web',
  'Interactivo',
  'ES/EN',
  'published',
  1,
  4,
  datetime('now'),
  datetime('now')
),
(
  5,
  '50-lecturas-fundamentales',
  'lectura',
  'Lecturas',
  'https://media.afroup.org/documents/50-lecturas-fundamentales.pdf',
  'PDF',
  '12 págs',
  'ES',
  'published',
  0,
  5,
  datetime('now'),
  datetime('now')
)
ON CONFLICT(id) DO NOTHING;

-- 10. Seed resource_locales (ES and EN)
INSERT INTO resource_locales (resource_id, locale, title, dek, content_html, og_json, updated_at)
VALUES
(
  1,
  'es',
  'Guía docente: cimarronaje en el aula',
  'Actividades, fuentes primarias y rúbricas para secundaria.',
  '<p>Actividades, fuentes primarias y rúbricas para secundaria. Un material libre para enseñar la historia cimarrona sin el recorte del libro de texto.</p><h3>Contenido del material</h3><ul><li>Actividades listas para 45 y 90 minutos</li><li>Fuentes primarias comentadas</li><li>Rúbricas de evaluación</li><li>Glosario breve para el aula</li></ul><h3>Dirigido a</h3><p>Docentes de secundaria, talleres comunitarios y círculos de lectura. El material se puede imprimir o proyectar y no requiere suscripción.</p>',
  json_object('title', 'Guía docente: cimarronaje en el aula · AfroUp', 'description', 'Actividades, fuentes primarias y rúbricas para secundaria.'),
  datetime('now')
),
(
  1,
  'en',
  'Teaching Guide: Maroonage in the Classroom',
  'Activities, primary sources, and rubrics for high school educators.',
  '<p>Activities, primary sources, and rubrics for secondary education. Free material to teach Maroon history beyond textbook omissions.</p><h3>Resource Contents</h3><ul><li>Ready-to-use activities for 45 and 90-minute lessons</li><li>Annotated primary sources</li><li>Assessment rubrics</li><li>Classroom glossary</li></ul><h3>Target Audience</h3><p>High school teachers, community workshops, and reading circles. Freely printable and presentable.</p>',
  json_object('title', 'Teaching Guide: Maroonage in the Classroom · AfroUp', 'description', 'Activities, primary sources, and rubrics for high school educators.'),
  datetime('now')
),
(
  2,
  'es',
  'Guía: cine afrolatino esencial',
  '30 películas para entender la diáspora, con fichas y dónde verlas.',
  '<p>Selección curada de 30 obras cinematográficas fundamentales del cine afrolatino y caribeño con análisis y guías de discusión.</p>',
  json_object('title', 'Guía: cine afrolatino esencial · AfroUp', 'description', '30 películas para entender la diáspora.'),
  datetime('now')
),
(
  2,
  'en',
  'Essential Afro-Latin Cinema Guide',
  '30 essential films to understand the diaspora, with reviews and streaming guides.',
  '<p>Curated selection of 30 landmark Afro-Latin and Caribbean films with context and discussion prompts.</p>',
  json_object('title', 'Essential Afro-Latin Cinema Guide · AfroUp', 'description', '30 essential films to understand the diaspora.'),
  datetime('now')
),
(
  3,
  'es',
  'Glosario antirracista',
  'Términos clave para hablar de raza, racismo e identidad con precisión.',
  '<p>Guía de conceptos y vocabulario clave para enriquecer debates sobre equidad racial e identidades afrodescendientes.</p>',
  json_object('title', 'Glosario antirracista · AfroUp', 'description', 'Términos clave para hablar de raza, racismo e identidad.'),
  datetime('now')
),
(
  3,
  'en',
  'Anti-Racism Glossary',
  'Key terms to discuss race, racism, and identity with accuracy.',
  '<p>Conceptual guide and glossary to elevate discussions on racial justice and diaspora identities.</p>',
  json_object('title', 'Anti-Racism Glossary · AfroUp', 'description', 'Key terms to discuss race, racism, and identity.'),
  datetime('now')
),
(
  4,
  'es',
  'Mapa interactivo de la diáspora',
  'Rutas, asentamientos y comunidades afro en América Latina.',
  '<p>Visualización interactiva de las trayectorias históricas, palenques y asentamientos de la diáspora africana en las Américas.</p>',
  json_object('title', 'Mapa interactivo de la diáspora · AfroUp', 'description', 'Rutas, asentamientos y comunidades afro en América Latina.'),
  datetime('now')
),
(
  4,
  'en',
  'Interactive Map of the Diaspora',
  'Routes, settlements, and Afro communities across the Americas.',
  '<p>Interactive exploration of historic trajectories, quilombos, and African diaspora communities.</p>',
  json_object('title', 'Interactive Map of the Diaspora · AfroUp', 'description', 'Routes, settlements, and Afro communities across the Americas.'),
  datetime('now')
),
(
  5,
  'es',
  '50 lecturas fundamentales',
  'Bibliografía comentada: de Fanon a Lélia Gonzalez.',
  '<p>Compilación bibliográfica comentada con los 50 textos seminales del pensamiento afrodiaspórico.</p>',
  json_object('title', '50 lecturas fundamentales · AfroUp', 'description', 'Bibliografía comentada: de Fanon a Lélia Gonzalez.'),
  datetime('now')
),
(
  5,
  'en',
  '50 Essential Readings',
  'Annotated bibliography: from Frantz Fanon to Lélia Gonzalez.',
  '<p>Annotated collection of 50 seminal readings shaping Black and diaspora critical theory.</p>',
  json_object('title', '50 Essential Readings · AfroUp', 'description', 'Annotated bibliography: from Fanon to Lélia Gonzalez.'),
  datetime('now')
)
ON CONFLICT(resource_id, locale) DO NOTHING;
