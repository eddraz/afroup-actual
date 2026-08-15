-- Buenaventura is listed as a special-attention zone in the official guide.
INSERT INTO departments (slug, name) VALUES ('buenaventura', 'Buenaventura');

UPDATE aid_entries
   SET department_id = (SELECT id FROM departments WHERE slug = 'buenaventura'),
       updated_at = datetime('now')
 WHERE location LIKE '%Buenaventura%'
    OR title LIKE '%Buenaventura%';
