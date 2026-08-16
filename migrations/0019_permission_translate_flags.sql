-- Translation is two independent flags: write by hand and use AI.
ALTER TABLE admin_user_permissions ADD COLUMN translate_manual INTEGER NOT NULL DEFAULT 0
  CHECK (translate_manual IN (0, 1));
ALTER TABLE admin_user_permissions ADD COLUMN translate_ai INTEGER NOT NULL DEFAULT 0
  CHECK (translate_ai IN (0, 1));
ALTER TABLE admin_role_permissions ADD COLUMN translate_manual INTEGER NOT NULL DEFAULT 0
  CHECK (translate_manual IN (0, 1));
ALTER TABLE admin_role_permissions ADD COLUMN translate_ai INTEGER NOT NULL DEFAULT 0
  CHECK (translate_ai IN (0, 1));

UPDATE admin_user_permissions
   SET translate_manual = CASE WHEN translate IN ('manual', 'ai') THEN 1 ELSE 0 END,
       translate_ai = CASE WHEN translate = 'ai' THEN 1 ELSE 0 END;

UPDATE admin_role_permissions
   SET translate_manual = CASE WHEN translate IN ('manual', 'ai') THEN 1 ELSE 0 END,
       translate_ai = CASE WHEN translate = 'ai' THEN 1 ELSE 0 END;
