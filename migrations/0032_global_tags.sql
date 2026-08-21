-- Global tags catalog for autocomplete and cross-article discovery.
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags (slug);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags (name);

-- Populate existing tags from article_tags
INSERT OR IGNORE INTO tags (name, slug)
SELECT DISTINCT LOWER(TRIM(tag)), LOWER(TRIM(tag))
  FROM article_tags
 WHERE TRIM(tag) != '';
