-- Rich text content, cover image, and reading time for articles.
ALTER TABLE articles ADD COLUMN cover_image_url TEXT;
ALTER TABLE articles ADD COLUMN reading_time_minutes INTEGER NOT NULL DEFAULT 5;
ALTER TABLE article_locales ADD COLUMN content_html TEXT NOT NULL DEFAULT '';
