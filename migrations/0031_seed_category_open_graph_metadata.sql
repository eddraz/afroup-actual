-- Seed structured Open Graph / Twitter Card metadata for default article categories.

UPDATE article_category_locales
   SET og_json = json_object(
     'url', CASE WHEN locale = 'es' THEN '/africa' ELSE '/en/africa' END,
     'type', 'website',
     'title', title,
     'description', description,
     'image', '',
     'imageAlt', title,
     'twitterCard', 'summary',
     'twitterTitle', title,
     'twitterDescription', description,
     'twitterImage', ''
   )
 WHERE category_id = 1 AND (og_json IS NULL OR og_json = '' OR og_json = '{}');

UPDATE article_category_locales
   SET og_json = json_object(
     'url', CASE WHEN locale = 'es' THEN '/diaspora' ELSE '/en/diaspora' END,
     'type', 'website',
     'title', title,
     'description', description,
     'image', '',
     'imageAlt', title,
     'twitterCard', 'summary',
     'twitterTitle', title,
     'twitterDescription', description,
     'twitterImage', ''
   )
 WHERE category_id = 2 AND (og_json IS NULL OR og_json = '' OR og_json = '{}');

UPDATE article_category_locales
   SET og_json = json_object(
     'url', CASE WHEN locale = 'es' THEN '/antirracismo' ELSE '/en/antirracismo' END,
     'type', 'website',
     'title', title,
     'description', description,
     'image', '',
     'imageAlt', title,
     'twitterCard', 'summary',
     'twitterTitle', title,
     'twitterDescription', description,
     'twitterImage', ''
   )
 WHERE category_id = 3 AND (og_json IS NULL OR og_json = '' OR og_json = '{}');

UPDATE article_category_locales
   SET og_json = json_object(
     'url', CASE WHEN locale = 'es' THEN '/historia' ELSE '/en/historia' END,
     'type', 'website',
     'title', title,
     'description', description,
     'image', '',
     'imageAlt', title,
     'twitterCard', 'summary',
     'twitterTitle', title,
     'twitterDescription', description,
     'twitterImage', ''
   )
 WHERE category_id = 4 AND (og_json IS NULL OR og_json = '' OR og_json = '{}');

UPDATE article_category_locales
   SET og_json = json_object(
     'url', CASE WHEN locale = 'es' THEN '/estetica' ELSE '/en/estetica' END,
     'type', 'website',
     'title', title,
     'description', description,
     'image', '',
     'imageAlt', title,
     'twitterCard', 'summary',
     'twitterTitle', title,
     'twitterDescription', description,
     'twitterImage', ''
   )
 WHERE category_id = 5 AND (og_json IS NULL OR og_json = '' OR og_json = '{}');

UPDATE article_category_locales
   SET og_json = json_object(
     'url', CASE WHEN locale = 'es' THEN '/actualidad' ELSE '/en/actualidad' END,
     'type', 'website',
     'title', title,
     'description', description,
     'image', '',
     'imageAlt', title,
     'twitterCard', 'summary',
     'twitterTitle', title,
     'twitterDescription', description,
     'twitterImage', ''
   )
 WHERE category_id = 6 AND (og_json IS NULL OR og_json = '' OR og_json = '{}');
