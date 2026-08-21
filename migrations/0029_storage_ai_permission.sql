-- Allow Administrador to use AI generation on the storage module.
UPDATE admin_role_permissions
   SET translate_ai = 1
 WHERE role_id = (SELECT id FROM admin_roles WHERE name = 'Administrador')
   AND permission_id IN (
     SELECT p.id
       FROM admin_permissions p
       JOIN admin_modules m ON m.id = p.module_id
      WHERE m.slug = 'almacenamiento'
   );

UPDATE admin_user_permissions
   SET translate_ai = 1
 WHERE permission_id IN (
     SELECT p.id
       FROM admin_permissions p
       JOIN admin_modules m ON m.id = p.module_id
      WHERE m.slug = 'almacenamiento'
   );
