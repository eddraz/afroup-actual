-- Migration 0040: Emprendedores Module (Empresas y catálogo de productos/servicios)

-- 1. Register 'emprendedores' admin module
INSERT INTO admin_modules (name, slug, description)
SELECT 'Emprendedores', 'emprendedores', 'Emprendimientos de productos y servicios de la comunidad.'
 WHERE NOT EXISTS (SELECT 1 FROM admin_modules WHERE slug = 'emprendedores');

-- 2. Register permissions: create, read, update, delete for 'emprendedores' module
INSERT INTO admin_permissions (module_id, action, name)
SELECT m.id, a.action, m.slug || ':' || a.action
  FROM admin_modules m
  CROSS JOIN (
    SELECT 'create' AS action UNION ALL SELECT 'read' UNION ALL SELECT 'update' UNION ALL SELECT 'delete'
  ) AS a
 WHERE m.slug = 'emprendedores'
   AND NOT EXISTS (
     SELECT 1 FROM admin_permissions p
      WHERE p.module_id = m.id AND p.action = a.action
   );

-- 3. Grant full permissions on 'emprendedores' module to Administrador role
INSERT INTO admin_role_permissions (role_id, permission_id, parent, quota, translate_manual, translate_ai)
SELECT r.id, p.id, 1, NULL, 1, 1
  FROM admin_roles r
  JOIN admin_permissions p ON p.module_id = (SELECT id FROM admin_modules WHERE slug = 'emprendedores')
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
   AND p.module_id = (SELECT id FROM admin_modules WHERE slug = 'emprendedores')
   AND NOT EXISTS (
     SELECT 1 FROM admin_user_permissions up
      WHERE up.user_id = u.id AND up.permission_id = p.id
   );

-- 5. Create entrepreneurs table
CREATE TABLE IF NOT EXISTS entrepreneurs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'moda' CHECK (category IN ('moda','alimentos','belleza','editorial','arte')),
  city TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  founded_year INTEGER,
  logo_url TEXT NOT NULL DEFAULT '',
  instagram_handle TEXT NOT NULL DEFAULT '',
  website_url TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  team_size INTEGER,
  status TEXT NOT NULL DEFAULT 'published',
  featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_entrepreneurs_status_sort ON entrepreneurs (status, featured DESC, sort_order ASC, created_at DESC);

-- 6. Create entrepreneur_locales table
CREATE TABLE IF NOT EXISTS entrepreneur_locales (
  entrepreneur_id INTEGER NOT NULL REFERENCES entrepreneurs(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  dek TEXT NOT NULL DEFAULT '',
  story_html TEXT NOT NULL DEFAULT '',
  quote TEXT NOT NULL DEFAULT '',
  rubro_label TEXT NOT NULL DEFAULT '',
  team_label TEXT NOT NULL DEFAULT '',
  shipping_label TEXT NOT NULL DEFAULT '',
  og_json TEXT,
  PRIMARY KEY (entrepreneur_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_entrepreneur_locales_lookup ON entrepreneur_locales (locale);

-- 7. Create entrepreneur_offerings table
CREATE TABLE IF NOT EXISTS entrepreneur_offerings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entrepreneur_id INTEGER NOT NULL REFERENCES entrepreneurs(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'producto' CHECK (kind IN ('producto','servicio')),
  image_url TEXT NOT NULL DEFAULT '',
  price_currency TEXT NOT NULL DEFAULT 'USD',
  price_amount INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (entrepreneur_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_entrepreneur_offerings_sort ON entrepreneur_offerings (entrepreneur_id, sort_order ASC);

-- 8. Create entrepreneur_offering_locales table
CREATE TABLE IF NOT EXISTS entrepreneur_offering_locales (
  offering_id INTEGER NOT NULL REFERENCES entrepreneur_offerings(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  dek TEXT NOT NULL DEFAULT '',
  description_html TEXT NOT NULL DEFAULT '',
  specs_json TEXT NOT NULL DEFAULT '[]',
  og_json TEXT,
  PRIMARY KEY (offering_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_entrepreneur_offering_locales_lookup ON entrepreneur_offering_locales (locale);

-- 9. Create entrepreneurs_page_locales table
CREATE TABLE IF NOT EXISTS entrepreneurs_page_locales (
  locale TEXT PRIMARY KEY,
  eyebrow TEXT NOT NULL DEFAULT 'Comunidad',
  title TEXT NOT NULL DEFAULT 'Emprendedores afro',
  lead TEXT NOT NULL DEFAULT 'Un directorio para descubrir y apoyar negocios de la diáspora — comprar afro también es activismo económico.',
  band_title TEXT NOT NULL DEFAULT '¿Tienes un emprendimiento?',
  band_dek TEXT NOT NULL DEFAULT 'Súmalo al directorio — es gratuito para la comunidad.',
  band_cta_label TEXT NOT NULL DEFAULT 'Sumar mi negocio',
  band_cta_url TEXT NOT NULL DEFAULT '/colabora',
  og_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 10. Seed Page configuration for es & en
INSERT OR IGNORE INTO entrepreneurs_page_locales (locale, eyebrow, title, lead, band_title, band_dek, band_cta_label, band_cta_url)
VALUES
  (
    'es',
    'Comunidad',
    'Emprendedores afro',
    'Un directorio para descubrir y apoyar negocios de la diáspora — comprar afro también es activismo económico.',
    '¿Tienes un emprendimiento?',
    'Súmalo al directorio — es gratuito para la comunidad.',
    'Sumar mi negocio',
    '/colabora'
  ),
  (
    'en',
    'Community',
    'Afro entrepreneurs',
    'A directory to discover and support diaspora businesses — buying Afro is also economic activism.',
    'Have a venture?',
    'Add it to the directory — it''s free for the community.',
    'Add my business',
    '/en/colabora'
  );

-- 11. Seed 1 Example Entrepreneur (company) with its offerings catalog
INSERT OR IGNORE INTO entrepreneurs (id, slug, category, city, country, founded_year, logo_url, instagram_handle, website_url, contact_email, team_size, status, featured, sort_order)
VALUES
  (1, 'tejidos-ubuntu', 'moda', 'Buenaventura', 'Colombia', 2022, '', 'tejidosubuntu', 'https://tejidosubuntu.co', 'hola@tejidosubuntu.co', 12, 'published', 1, 1);

-- Seed Spanish translations
INSERT OR IGNORE INTO entrepreneur_locales (entrepreneur_id, locale, name, dek, story_html, quote, rubro_label, team_label, shipping_label)
VALUES
  (
    1,
    'es',
    'Tejidos Ubuntu',
    'Moda con estampas africanas hecha por mujeres del Pacífico.',
    '<p>Un taller de doce mujeres de Buenaventura que transforma telas de estampa africana en moda contemporánea. Cada prenda lleva el nombre de la artesana que la confeccionó, y parte de las ganancias financia un fondo de becas para jóvenes del barrio.</p>',
    '“Ubuntu: soy porque somos. Cosemos comunidad.”',
    'Moda · textiles',
    '12 artesanas',
    'Toda Colombia'
  );

-- Seed English translations
INSERT OR IGNORE INTO entrepreneur_locales (entrepreneur_id, locale, name, dek, story_html, quote, rubro_label, team_label, shipping_label)
VALUES
  (
    1,
    'en',
    'Tejidos Ubuntu',
    'Afro-print fashion handmade by women of the Pacific.',
    '<p>A workshop of twelve women in Buenaventura transforming African-print fabrics into contemporary fashion. Each garment carries the name of the artisan who made it, and part of the profits funds a scholarship pool for young people in the neighborhood.</p>',
    '“Ubuntu: I am because we are. We weave community.”',
    'Fashion · textiles',
    '12 artisans',
    'All of Colombia'
  );

-- Seed example offerings (product + service)
INSERT OR IGNORE INTO entrepreneur_offerings (id, entrepreneur_id, slug, kind, image_url, price_currency, price_amount, sort_order, status)
VALUES
  (1, 1, 'manta-kente', 'producto', '', 'USD', 85, 1, 'published'),
  (2, 1, 'taller-telar', 'servicio', '', 'USD', NULL, 2, 'published');

INSERT OR IGNORE INTO entrepreneur_offering_locales (offering_id, locale, name, dek, description_html, specs_json)
VALUES
  (
    1,
    'es',
    'Manta Kente',
    'Manta tejida en telar con estampas kente.',
    '<p>Cada manta se teje a mano en el taller de Buenaventura y toma su nombre del estilo kente de Ghana.</p>',
    '[{"label":"Material","value":"Algodón hilado a mano"},{"label":"Dimensiones","value":"120 × 180 cm"}]'
  ),
  (
    2,
    'es',
    'Taller de telar',
    'Aprende telar artesanal en nuestro taller.',
    '<p>Experiencia de cuatro horas guiada por las artesanas: conoce el telar, hila y llévate tu propia pieza.</p>',
    '[{"label":"Duración","value":"4 horas"},{"label":"Cupo","value":"8 personas"}]'
  ),
  (
    1,
    'en',
    'Kente blanket',
    'Loom-woven blanket featuring kente patterns.',
    '<p>Every blanket is handwoven at the Buenaventura workshop and takes its name from Ghanaian kente style.</p>',
    '[{"label":"Material","value":"Hand-spun cotton"},{"label":"Dimensions","value":"120 × 180 cm"}]'
  ),
  (
    2,
    'en',
    'Loom workshop',
    'Learn traditional loom weaving at our workshop.',
    '<p>A four-hour experience led by the artisans: meet the loom, spin thread, and take your own piece home.</p>',
    '[{"label":"Duration","value":"4 hours"},{"label":"Capacity","value":"8 people"}]'
  );
