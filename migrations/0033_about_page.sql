-- Register 'nosotros' admin module
INSERT INTO admin_modules (name, slug, description)
SELECT 'Nosotros', 'nosotros', 'Gestión editorial y multimedia de la página institucional Nosotros.'
 WHERE NOT EXISTS (SELECT 1 FROM admin_modules WHERE slug = 'nosotros');

-- Register permissions: create, read, update, delete for 'nosotros' module
INSERT INTO admin_permissions (module_id, action, name)
SELECT m.id, a.action, m.slug || ':' || a.action
  FROM admin_modules m
  CROSS JOIN (
    SELECT 'create' AS action UNION ALL SELECT 'read' UNION ALL SELECT 'update' UNION ALL SELECT 'delete'
  ) AS a
 WHERE m.slug = 'nosotros'
   AND NOT EXISTS (
     SELECT 1 FROM admin_permissions p
      WHERE p.module_id = m.id AND p.action = a.action
   );

-- Grant full permissions on 'nosotros' module to Administrador role
INSERT INTO admin_role_permissions (role_id, permission_id, parent, quota, translate_manual, translate_ai)
SELECT r.id, p.id, 1, NULL, 1, 1
  FROM admin_roles r
  JOIN admin_permissions p ON p.module_id = (SELECT id FROM admin_modules WHERE slug = 'nosotros')
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
   AND p.module_id = (SELECT id FROM admin_modules WHERE slug = 'nosotros')
   AND NOT EXISTS (
     SELECT 1 FROM admin_user_permissions up
      WHERE up.user_id = u.id AND up.permission_id = p.id
   );

-- Create table for per-locale About Us page content
CREATE TABLE IF NOT EXISTS about_page_locales (
  locale TEXT NOT NULL PRIMARY KEY,
  eyebrow TEXT NOT NULL DEFAULT 'CONOCE AFROUP',
  title TEXT NOT NULL DEFAULT 'Una plataforma para amplificar la voz, cultura y memoria afro',
  lead TEXT NOT NULL DEFAULT 'Investigamos, creamos y compartimos contenidos educativos, culturales y de memoria histórica afrodiaspórica.',
  story_title TEXT NOT NULL DEFAULT 'Nuestra historia',
  story_body TEXT NOT NULL DEFAULT 'AfroUp nace como una cuenta educativa en redes sociales y crece hasta convertirse en una plataforma digital activista, educativa y cultural afrocéntrica. Creemos que el conocimiento es poder: que conocer nuestra historia —la que no se enseñó en la escuela— transforma la manera en que nos vemos y nos organizamos.',
  values_json TEXT NOT NULL DEFAULT '["Orgullosamente afrocéntrico", "Educación comunitaria", "Cultura viva", "En red"]',
  mission_title TEXT NOT NULL DEFAULT 'Nuestra misión',
  mission_body TEXT NOT NULL DEFAULT 'Educar y empoderar a través del conocimiento afrocéntrico, accesible y riguroso.',
  vision_title TEXT NOT NULL DEFAULT 'Nuestra visión',
  vision_body TEXT NOT NULL DEFAULT 'Una comunidad global que reconoce, valora y vive su legado afro.',
  stats_json TEXT NOT NULL DEFAULT '[{"value":"+200","label":"Artículos y guías publicados"},{"value":"14","label":"Países alcanzados"},{"value":"+80K","label":"Comunidad en redes"}]',
  team_json TEXT NOT NULL DEFAULT '[{"name":"Jenniffer M.","role":"Fundadora · Editora","avatar_url":"","figure":"bg-secondary/30"},{"name":"Equipo editorial","role":"Investigación y redacción","avatar_url":"","figure":"bg-accent/30"},{"name":"Diseño","role":"Identidad y contenido visual","avatar_url":"","figure":"bg-primary/20"},{"name":"Comunidad","role":"Colaboradores de la diáspora","avatar_url":"","figure":"bg-[url(\"/assets/pattern.png\")] bg-cover bg-center"}]',
  cta_title TEXT NOT NULL DEFAULT '¿Quieres apoyar este proyecto?',
  cta_body TEXT NOT NULL DEFAULT 'Únete como colaborador o haz una donación para que sigamos creando contenido libre y accesible.',
  collaborate_label TEXT NOT NULL DEFAULT 'Colabora con nosotros',
  donate_label TEXT NOT NULL DEFAULT 'Haz una donación',
  og_json TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed initial records for Spanish (es) and English (en)
INSERT OR IGNORE INTO about_page_locales (
  locale, eyebrow, title, lead,
  story_title, story_body, values_json,
  mission_title, mission_body,
  vision_title, vision_body,
  stats_json, team_json,
  cta_title, cta_body, collaborate_label, donate_label,
  og_json
) VALUES (
  'es',
  'CONOCE AFROUP',
  'Una plataforma para amplificar la voz, cultura y memoria afro',
  'Investigamos, creamos y compartimos contenidos educativos, culturales y de memoria histórica afrodiaspórica.',
  'Nuestra historia',
  'AfroUp nace como una cuenta educativa en redes sociales y crece hasta convertirse en una plataforma digital activista, educativa y cultural afrocéntrica. Creemos que el conocimiento es poder: que conocer nuestra historia —la que no se enseñó en la escuela— transforma la manera en que nos vemos y nos organizamos.',
  '["Orgullosamente afrocéntrico", "Educación comunitaria", "Cultura viva", "En red"]',
  'Nuestra misión',
  'Educar y empoderar a través del conocimiento afrocéntrico, accesible y riguroso.',
  'Nuestra visión',
  'Una comunidad global que reconoce, valora y vive su legado afro.',
  '[{"value":"+200","label":"Artículos y guías publicados"},{"value":"14","label":"Países alcanzados"},{"value":"+80K","label":"Comunidad en redes"}]',
  '[{"name":"Jenniffer M.","role":"Fundadora · Editora","avatar_url":"","figure":"bg-secondary/30"},{"name":"Equipo editorial","role":"Investigación y redacción","avatar_url":"","figure":"bg-accent/30"},{"name":"Diseño","role":"Identidad y contenido visual","avatar_url":"","figure":"bg-primary/20"},{"name":"Comunidad","role":"Colaboradores de la diáspora","avatar_url":"","figure":"bg-[url(\"/assets/pattern.png\")] bg-cover bg-center"}]',
  '¿Quieres apoyar este proyecto?',
  'Únete como colaborador o haz una donación para que sigamos creando contenido libre y accesible.',
  'Colabora con nosotros',
  'Haz una donación',
  '{"title":"Nosotros · AfroUp","description":"Conoce la historia, misión, visión y equipo detrás de AfroUp.","og:image":"/assets/brand-hero.png"}'
);

INSERT OR IGNORE INTO about_page_locales (
  locale, eyebrow, title, lead,
  story_title, story_body, values_json,
  mission_title, mission_body,
  vision_title, vision_body,
  stats_json, team_json,
  cta_title, cta_body, collaborate_label, donate_label,
  og_json
) VALUES (
  'en',
  'ABOUT AFROUP',
  'A platform to amplify Afro voices, culture, and memory',
  'We research, create, and share educational, cultural, and historical Afro-diasporic knowledge.',
  'Our Story',
  'AfroUp began as an educational initiative on social media and grew into an activist, educational, and cultural Afrocentric digital platform. We believe knowledge is power: knowing our history transforms how we see ourselves and organize.',
  '["Proudly Afrocentric", "Community Education", "Living Culture", "Connected Network"]',
  'Our Mission',
  'To educate and empower through accessible, rigorous Afrocentric knowledge.',
  'Our Vision',
  'A global community that recognizes, values, and lives its Afro heritage.',
  '[{"value":"+200","label":"Published articles & guides"},{"value":"14","label":"Countries reached"},{"value":"+80K","label":"Community members"}]',
  '[{"name":"Jenniffer M.","role":"Founder · Editor","avatar_url":"","figure":"bg-secondary/30"},{"name":"Editorial Team","role":"Research & Writing","avatar_url":"","figure":"bg-accent/30"},{"name":"Design","role":"Visual Identity & Content","avatar_url":"","figure":"bg-primary/20"},{"name":"Community","role":"Diaspora Collaborators","avatar_url":"","figure":"bg-[url(\"/assets/pattern.png\")] bg-cover bg-center"}]',
  'Want to support this project?',
  'Join us as a collaborator or make a donation so we can continue creating free, accessible content.',
  'Collaborate with us',
  'Make a donation',
  '{"title":"About Us · AfroUp","description":"Discover the story, mission, vision, and team behind AfroUp.","og:image":"/assets/brand-hero.png"}'
);
