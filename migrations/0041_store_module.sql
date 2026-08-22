-- Migration 0041: Tienda Module (Catálogo propio de AfroUp)

-- 1. Register 'tienda' admin module
INSERT INTO admin_modules (name, slug, description)
SELECT 'Tienda', 'tienda', 'Catálogo de eBooks, láminas, merch y descargables de AfroUp.'
 WHERE NOT EXISTS (SELECT 1 FROM admin_modules WHERE slug = 'tienda');

-- 2. Register permissions: create, read, update, delete for 'tienda' module
INSERT INTO admin_permissions (module_id, action, name)
SELECT m.id, a.action, m.slug || ':' || a.action
  FROM admin_modules m
  CROSS JOIN (
    SELECT 'create' AS action UNION ALL SELECT 'read' UNION ALL SELECT 'update' UNION ALL SELECT 'delete'
  ) AS a
 WHERE m.slug = 'tienda'
   AND NOT EXISTS (
     SELECT 1 FROM admin_permissions p
      WHERE p.module_id = m.id AND p.action = a.action
   );

-- 3. Grant full permissions on 'tienda' module to Administrador role
INSERT INTO admin_role_permissions (role_id, permission_id, parent, quota, translate_manual, translate_ai)
SELECT r.id, p.id, 1, NULL, 1, 1
  FROM admin_roles r
  JOIN admin_permissions p ON p.module_id = (SELECT id FROM admin_modules WHERE slug = 'tienda')
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
   AND p.module_id = (SELECT id FROM admin_modules WHERE slug = 'tienda')
   AND NOT EXISTS (
     SELECT 1 FROM admin_user_permissions up
      WHERE up.user_id = u.id AND up.permission_id = p.id
   );

-- 5. Create store_products table
CREATE TABLE IF NOT EXISTS store_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'ebook' CHECK (category IN ('ebook','lamina','merch','descargable')),
  image_url TEXT NOT NULL DEFAULT '',
  image_label TEXT NOT NULL DEFAULT '',
  price_currency TEXT NOT NULL DEFAULT 'USD',
  price_amount INTEGER,
  compare_at_price INTEGER,
  is_downloadable INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  featured INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_store_products_status_sort ON store_products (status, featured DESC, sort_order ASC, created_at DESC);

-- 6. Create store_product_locales table
CREATE TABLE IF NOT EXISTS store_product_locales (
  product_id INTEGER NOT NULL REFERENCES store_products(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  dek TEXT NOT NULL DEFAULT '',
  description_html TEXT NOT NULL DEFAULT '',
  specs_json TEXT NOT NULL DEFAULT '[]',
  og_json TEXT,
  PRIMARY KEY (product_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_store_product_locales_lookup ON store_product_locales (locale);

-- 7. Create store_page_locales table
CREATE TABLE IF NOT EXISTS store_page_locales (
  locale TEXT PRIMARY KEY,
  eyebrow TEXT NOT NULL DEFAULT 'Tienda AfroUp',
  title TEXT NOT NULL DEFAULT 'Conocimiento que también sostiene',
  lead TEXT NOT NULL DEFAULT 'eBooks, láminas y merch con propósito — cada compra financia contenido libre para la diáspora.',
  band_title TEXT NOT NULL DEFAULT 'Descargables gratuitos',
  band_dek TEXT NOT NULL DEFAULT 'Guías y recursos libres para captar, aprender y compartir.',
  band_cta_label TEXT NOT NULL DEFAULT 'Ver recursos',
  band_cta_url TEXT NOT NULL DEFAULT '/recursos',
  og_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. Seed Page configuration for es & en
INSERT OR IGNORE INTO store_page_locales (locale, eyebrow, title, lead, band_title, band_dek, band_cta_label, band_cta_url)
VALUES
  (
    'es',
    'Tienda AfroUp',
    'Conocimiento que también sostiene',
    'eBooks, láminas y merch con propósito — cada compra financia contenido libre para la diáspora.',
    'Descargables gratuitos',
    'Guías y recursos libres para captar, aprender y compartir.',
    'Ver recursos',
    '/recursos'
  ),
  (
    'en',
    'AfroUp Store',
    'Knowledge that also sustains',
    'eBooks, prints, and merch with purpose — every purchase funds free content for the diaspora.',
    'Free downloads',
    'Free guides and resources to capture, learn, and share.',
    'See resources',
    '/en/recursos'
  );

-- 9. Seed 3 example products (AfroUp's own catalog; titles from the /tienda mockup)
INSERT OR IGNORE INTO store_products (id, slug, category, image_label, price_currency, price_amount, compare_at_price, is_downloadable, status, featured, sort_order)
VALUES
  (1, 'guia-antirracista', 'ebook', '', 'USD', 12, 18, 1, 'published', 1, 1),
  (2, 'camiseta-conocimiento', 'merch', 'camiseta', 'USD', 22, NULL, 0, 'published', 0, 2),
  (3, 'pack-stickers', 'descargable', 'PDF', 'USD', NULL, NULL, 1, 'published', 0, 3);

-- Seed Spanish translations
INSERT OR IGNORE INTO store_product_locales (product_id, locale, name, dek, description_html, specs_json)
VALUES
  (
    1,
    'es',
    'Raíces: historia afro de Abya Yala',
    'Quinientos años de historia contados desde la diáspora: de los reinos africanos a los palenques y al presente.',
    '<p>Quinientos años de historia contados desde la diáspora: de los reinos africanos a los palenques y al presente. PDF + EPUB.</p>',
    '[{"label":"Formato","value":"PDF + EPUB"}]'
  ),
  (
    2,
    'es',
    'Camiseta “Conocimiento = poder”',
    'Algodón orgánico con la estampa de la casa.',
    '<p>Algodón orgánico unisex con la estampa “Conocimiento = poder”. Cada prenda financia contenido libre para la diáspora.</p>',
    '[{"label":"Material","value":"Algodón orgánico"},{"label":"Tallas","value":"S – XXL"}]'
  ),
  (
    3,
    'es',
    'Set de stickers Palenque',
    'Lámina descargable para imprimir y compartir.',
    '<p>Set de stickers inspirado en los palenques, listo para descargar, imprimir y pegar donde llegue la memoria.</p>',
    '[]'
  );

-- Seed English translations
INSERT OR IGNORE INTO store_product_locales (product_id, locale, name, dek, description_html, specs_json)
VALUES
  (
    1,
    'en',
    'Roots: Afro history of Abya Yala',
    'Five hundred years of history told from the diaspora: from African kingdoms to the palenques and the present.',
    '<p>Five hundred years of history told from the diaspora: from African kingdoms to the palenques and the present. PDF + EPUB.</p>',
    '[{"label":"Format","value":"PDF + EPUB"}]'
  ),
  (
    2,
    'en',
    '“Knowledge = power” T-shirt',
    'Organic cotton with our house print.',
    '<p>Unisex organic cotton tee with the “Knowledge = power” print. Every shirt funds free content for the diaspora.</p>',
    '[{"label":"Material","value":"Organic cotton"},{"label":"Sizes","value":"S – XXL"}]'
  ),
  (
    3,
    'en',
    'Palenque sticker pack',
    'Printable download sheet to share anywhere.',
    '<p>A sticker pack inspired by the palenques, ready to download, print, and stick wherever memory belongs.</p>',
    '[]'
  );
