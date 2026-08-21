-- Per-locale Open Graph / Twitter Card metadata for articles and categories.
ALTER TABLE article_locales ADD COLUMN og_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE article_category_locales ADD COLUMN og_json TEXT NOT NULL DEFAULT '{}';
