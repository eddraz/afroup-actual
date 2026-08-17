-- Assign the seeded editorial categories to the founding admin account.
UPDATE article_categories
   SET created_by = (SELECT id FROM users WHERE email = 'tantaroth@gmail.com')
 WHERE slug IN ('africa', 'diaspora', 'antirracismo', 'historia', 'estetica', 'actualidad');
