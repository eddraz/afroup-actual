-- Grant full module and AI permissions to Administrador role and administrator accounts:
-- tantaorth@gmail.com, tantaroth@gmail.com, and jenniffer@afroup.com

-- 1. Ensure all permissions across all modules are assigned to the Administrador role with full AI and parent capabilities
INSERT OR IGNORE INTO admin_role_permissions (role_id, permission_id, parent, quota, translate_manual, translate_ai)
SELECT r.id, p.id, 1, NULL, 1, 1
  FROM admin_roles r
  CROSS JOIN admin_permissions p
 WHERE r.name = 'Administrador';

UPDATE admin_role_permissions
   SET parent = 1,
       quota = NULL,
       translate_manual = 1,
       translate_ai = 1
 WHERE role_id = (SELECT id FROM admin_roles WHERE name = 'Administrador');

-- 2. Upsert admin users (jenniffer@afroup.com, tantaroth@gmail.com, tantaorth@gmail.com)
INSERT INTO users (name, email, password_hash, verified_at, role_id, is_active, invite_pending)
VALUES (
  'Jenniffer Mayren Urrutia Briñez',
  'jenniffer@afroup.com',
  'pbkdf2$sha256$100000$d8f6efc0ee9d4a71f2cc8763b8215424$f94a63a523a62d737d6bfbe5306a86e6b9283688d6b2273a7e81217c637ce73e',
  '2026-08-15 22:25:18',
  (SELECT id FROM admin_roles WHERE name = 'Administrador'),
  1,
  0
)
ON CONFLICT(email) DO UPDATE SET
  role_id = (SELECT id FROM admin_roles WHERE name = 'Administrador'),
  is_active = 1,
  invite_pending = 0;

INSERT INTO users (name, email, password_hash, verified_at, role_id, is_active, invite_pending)
VALUES (
  'Eduard Ramirez',
  'tantaroth@gmail.com',
  'pbkdf2$sha256$100000$f3424927b844a3d9c42c1ed9935ea235$52587f1630a54df958c6defe39b610a8a66776640b3ffcf3552d89ccc73c29f5',
  '2026-08-15 20:59:16',
  (SELECT id FROM admin_roles WHERE name = 'Administrador'),
  1,
  0
)
ON CONFLICT(email) DO UPDATE SET
  role_id = (SELECT id FROM admin_roles WHERE name = 'Administrador'),
  is_active = 1,
  invite_pending = 0;

INSERT INTO users (name, email, password_hash, verified_at, role_id, is_active, invite_pending)
VALUES (
  'Eduard Ramirez',
  'tantaorth@gmail.com',
  'pbkdf2$sha256$100000$f3424927b844a3d9c42c1ed9935ea235$52587f1630a54df958c6defe39b610a8a66776640b3ffcf3552d89ccc73c29f5',
  '2026-08-15 20:59:16',
  (SELECT id FROM admin_roles WHERE name = 'Administrador'),
  1,
  0
)
ON CONFLICT(email) DO UPDATE SET
  role_id = (SELECT id FROM admin_roles WHERE name = 'Administrador'),
  is_active = 1,
  invite_pending = 0;

-- 3. Ensure direct user permissions have full permissions and AI capabilities across all modules
INSERT OR IGNORE INTO admin_user_permissions (user_id, permission_id, parent, quota, translate_manual, translate_ai)
SELECT u.id, p.id, 1, NULL, 1, 1
  FROM users u
  CROSS JOIN admin_permissions p
 WHERE u.email IN ('jenniffer@afroup.com', 'tantaroth@gmail.com', 'tantaorth@gmail.com');

UPDATE admin_user_permissions
   SET parent = 1,
       quota = NULL,
       translate_manual = 1,
       translate_ai = 1
 WHERE user_id IN (
   SELECT id FROM users WHERE email IN ('jenniffer@afroup.com', 'tantaroth@gmail.com', 'tantaorth@gmail.com')
 );
