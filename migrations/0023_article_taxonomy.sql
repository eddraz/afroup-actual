-- An article can belong to many categories and carry searchable tags.
CREATE TABLE article_category_map (
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES article_categories(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (article_id, category_id)
);

CREATE INDEX idx_article_category_map_category ON article_category_map (category_id, sort_order);

INSERT INTO article_category_map (article_id, category_id, sort_order)
SELECT id, category_id, 0 FROM articles WHERE category_id IS NOT NULL;

CREATE TABLE articles_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO articles_new (id, slug, created_by, status, published_at, created_at, updated_at)
SELECT id, slug, created_by, status, published_at, created_at, updated_at FROM articles;

DROP TABLE articles;
ALTER TABLE articles_new RENAME TO articles;
CREATE INDEX idx_articles_created_by ON articles (created_by);

CREATE TABLE article_tags (
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (article_id, tag)
);

CREATE INDEX idx_article_tags_tag ON article_tags (tag);
