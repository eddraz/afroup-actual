-- Translation mode belongs on every module action, not only the standalone module.
ALTER TABLE admin_user_permissions ADD COLUMN translate TEXT NOT NULL DEFAULT 'none'
  CHECK (translate IN ('none', 'manual', 'ai'));
ALTER TABLE admin_role_permissions ADD COLUMN translate TEXT NOT NULL DEFAULT 'none'
  CHECK (translate IN ('none', 'manual', 'ai'));

-- Keep previous traduccion:create as AI and traduccion:update as manual.
UPDATE admin_user_permissions
   SET translate = 'ai'
 WHERE permission_id IN (
   SELECT p.id
     FROM admin_permissions p
     JOIN admin_modules m ON m.id = p.module_id
    WHERE m.slug = 'traduccion' AND p.action = 'create'
 );

UPDATE admin_user_permissions
   SET translate = 'manual'
 WHERE translate = 'none'
   AND permission_id IN (
     SELECT p.id
       FROM admin_permissions p
       JOIN admin_modules m ON m.id = p.module_id
      WHERE m.slug = 'traduccion' AND p.action = 'update'
   );

UPDATE admin_role_permissions
   SET translate = 'ai'
 WHERE permission_id IN (
   SELECT p.id
     FROM admin_permissions p
     JOIN admin_modules m ON m.id = p.module_id
    WHERE m.slug = 'traduccion' AND p.action = 'create'
 );

UPDATE admin_role_permissions
   SET translate = 'manual'
 WHERE translate = 'none'
   AND permission_id IN (
     SELECT p.id
       FROM admin_permissions p
       JOIN admin_modules m ON m.id = p.module_id
      WHERE m.slug = 'traduccion' AND p.action = 'update'
   );
