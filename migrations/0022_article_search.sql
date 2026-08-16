-- Article categories, articles, and the search index used by /buscar.
INSERT INTO admin_modules (name, slug, description)
SELECT 'Categorías', 'categorias', 'Categorías de artículos y su índice de búsqueda.'
 WHERE NOT EXISTS (SELECT 1 FROM admin_modules WHERE slug = 'categorias');

INSERT INTO admin_permissions (module_id, action, name)
SELECT m.id, a.action, m.slug || ':' || a.action
  FROM admin_modules m
  CROSS JOIN (
    SELECT 'create' AS action UNION ALL SELECT 'read' UNION ALL SELECT 'update' UNION ALL SELECT 'delete'
  ) AS a
 WHERE m.slug = 'categorias'
   AND NOT EXISTS (
     SELECT 1 FROM admin_permissions p
      WHERE p.module_id = m.id AND p.action = a.action
   );

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id
  FROM admin_roles r
  JOIN admin_permissions p ON p.module_id = (SELECT id FROM admin_modules WHERE slug = 'categorias')
 WHERE r.name = 'Administrador'
   AND NOT EXISTS (
     SELECT 1 FROM admin_role_permissions rp
      WHERE rp.role_id = r.id AND rp.permission_id = p.id
   );

CREATE TABLE article_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE article_category_locales (
  category_id INTEGER NOT NULL REFERENCES article_categories(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (category_id, locale)
);

CREATE TABLE articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  category_id INTEGER REFERENCES article_categories(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE article_locales (
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (article_id, locale)
);

CREATE TABLE search_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_slug TEXT NOT NULL,
  record_id INTEGER NOT NULL,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT '',
  path TEXT NOT NULL,
  extra TEXT,
  published_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (module_slug, record_id, locale)
);

CREATE INDEX idx_article_categories_created_by ON article_categories (created_by);
CREATE INDEX idx_articles_category ON articles (category_id);
CREATE INDEX idx_articles_created_by ON articles (created_by);
CREATE INDEX idx_search_documents_locale ON search_documents (locale, module_slug);
