-- Add collaborate_url and donate_url columns to about_page_locales
ALTER TABLE about_page_locales ADD COLUMN collaborate_url TEXT NOT NULL DEFAULT '/colabora';
ALTER TABLE about_page_locales ADD COLUMN donate_url TEXT NOT NULL DEFAULT '/donacion';

-- Set localized defaults for English records
UPDATE about_page_locales SET collaborate_url = '/en/colabora' WHERE locale = 'en';
UPDATE about_page_locales SET donate_url = '/en/donacion' WHERE locale = 'en';
