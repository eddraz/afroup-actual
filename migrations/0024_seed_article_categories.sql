-- Seed the former mock category pages in Spanish and English.
INSERT OR IGNORE INTO article_categories (id, slug, created_by) VALUES
  (1, 'africa', (SELECT id FROM users WHERE email = 'tantaroth@gmail.com')),
  (2, 'diaspora', (SELECT id FROM users WHERE email = 'tantaroth@gmail.com')),
  (3, 'antirracismo', (SELECT id FROM users WHERE email = 'tantaroth@gmail.com')),
  (4, 'historia', (SELECT id FROM users WHERE email = 'tantaroth@gmail.com')),
  (5, 'estetica', (SELECT id FROM users WHERE email = 'tantaroth@gmail.com')),
  (6, 'actualidad', (SELECT id FROM users WHERE email = 'tantaroth@gmail.com'));

INSERT OR IGNORE INTO article_category_locales (category_id, locale, title, description) VALUES
  (1, 'es', 'África', 'Reinos, lenguas, arte y pensamiento del continente madre — la raíz de la que parte toda la diáspora.'),
  (1, 'en', 'Africa', 'Kingdoms, languages, art, and thought from the mother continent — the root of the entire diaspora.'),
  (2, 'es', 'Diáspora', 'Memoria, lenguas, rutas y cultura viva de la diáspora africana en Abya Yala y el mundo.'),
  (2, 'en', 'Diaspora', 'Memory, languages, routes, and living culture of the African diaspora across Abya Yala and the world.'),
  (3, 'es', 'Antirracismo', 'Herramientas para nombrar, desarmar y transformar el racismo en la vida cotidiana, la escuela y las instituciones.'),
  (3, 'en', 'Antiracism', 'Tools to name, dismantle, and transform racism in everyday life, school, and institutions.'),
  (4, 'es', 'Historia', 'Memorias, luchas y genealogías afrodescendientes que la historia oficial dejó fuera.'),
  (4, 'en', 'History', 'Memories, struggles, and Afro-descendant genealogies left out of official history.'),
  (5, 'es', 'Estética', 'Cabello, moda, arte y cuidado como archivo vivo de belleza afrodescendiente.'),
  (5, 'en', 'Aesthetics', 'Hair, fashion, art, and care as a living archive of Afro-descendant beauty.'),
  (6, 'es', 'Actualidad', 'Cultura, política y voces afrodescendientes que están marcando el presente.'),
  (6, 'en', 'News', 'Culture, politics, and Afro-descendant voices shaping the present.');

INSERT OR IGNORE INTO search_documents
  (module_slug, record_id, locale, title, summary, tags, kind, path)
VALUES
  ('categorias', 1, 'es', 'África', 'Reinos, lenguas, arte y pensamiento del continente madre — la raíz de la que parte toda la diáspora.', 'África Reinos, lenguas, arte y pensamiento del continente madre — la raíz de la que parte toda la diáspora.', 'Categoría', '/africa'),
  ('categorias', 1, 'en', 'Africa', 'Kingdoms, languages, art, and thought from the mother continent — the root of the entire diaspora.', 'Africa Kingdoms, languages, art, and thought from the mother continent — the root of the entire diaspora.', 'Categoría', '/en/africa'),
  ('categorias', 2, 'es', 'Diáspora', 'Memoria, lenguas, rutas y cultura viva de la diáspora africana en Abya Yala y el mundo.', 'Diáspora Memoria, lenguas, rutas y cultura viva de la diáspora africana en Abya Yala y el mundo.', 'Categoría', '/diaspora'),
  ('categorias', 2, 'en', 'Diaspora', 'Memory, languages, routes, and living culture of the African diaspora across Abya Yala and the world.', 'Diaspora Memory, languages, routes, and living culture of the African diaspora across Abya Yala and the world.', 'Categoría', '/en/diaspora'),
  ('categorias', 3, 'es', 'Antirracismo', 'Herramientas para nombrar, desarmar y transformar el racismo en la vida cotidiana, la escuela y las instituciones.', 'Antirracismo Herramientas para nombrar, desarmar y transformar el racismo en la vida cotidiana, la escuela y las instituciones.', 'Categoría', '/antirracismo'),
  ('categorias', 3, 'en', 'Antiracism', 'Tools to name, dismantle, and transform racism in everyday life, school, and institutions.', 'Antiracism Tools to name, dismantle, and transform racism in everyday life, school, and institutions.', 'Categoría', '/en/antirracismo'),
  ('categorias', 4, 'es', 'Historia', 'Memorias, luchas y genealogías afrodescendientes que la historia oficial dejó fuera.', 'Historia Memorias, luchas y genealogías afrodescendientes que la historia oficial dejó fuera.', 'Categoría', '/historia'),
  ('categorias', 4, 'en', 'History', 'Memories, struggles, and Afro-descendant genealogies left out of official history.', 'History Memories, struggles, and Afro-descendant genealogies left out of official history.', 'Categoría', '/en/historia'),
  ('categorias', 5, 'es', 'Estética', 'Cabello, moda, arte y cuidado como archivo vivo de belleza afrodescendiente.', 'Estética Cabello, moda, arte y cuidado como archivo vivo de belleza afrodescendiente.', 'Categoría', '/estetica'),
  ('categorias', 5, 'en', 'Aesthetics', 'Hair, fashion, art, and care as a living archive of Afro-descendant beauty.', 'Aesthetics Hair, fashion, art, and care as a living archive of Afro-descendant beauty.', 'Categoría', '/en/estetica'),
  ('categorias', 6, 'es', 'Actualidad', 'Cultura, política y voces afrodescendientes que están marcando el presente.', 'Actualidad Cultura, política y voces afrodescendientes que están marcando el presente.', 'Categoría', '/actualidad'),
  ('categorias', 6, 'en', 'News', 'Culture, politics, and Afro-descendant voices shaping the present.', 'News Culture, politics, and Afro-descendant voices shaping the present.', 'Categoría', '/en/actualidad');
