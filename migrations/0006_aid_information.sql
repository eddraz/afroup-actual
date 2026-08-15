-- Public submissions now store a single information field.
ALTER TABLE aid_entries ADD COLUMN information TEXT;

UPDATE aid_entries
   SET information = NULLIF(TRIM(
     COALESCE(title, '') ||
     CASE WHEN IFNULL(location, '') != '' THEN CHAR(10) || location ELSE '' END ||
     CASE WHEN IFNULL(summary, '') != '' AND IFNULL(summary, '') != IFNULL(title, '') THEN CHAR(10) || summary ELSE '' END ||
     CASE WHEN IFNULL(body, '') != '' AND IFNULL(body, '') != IFNULL(summary, '') THEN CHAR(10) || body ELSE '' END ||
     CASE
       WHEN TRIM(COALESCE(contact_name, '') || ' ' || COALESCE(contact_phone, '') || ' ' || COALESCE(contact_email, '')) != ''
       THEN CHAR(10) || TRIM(COALESCE(contact_name, '') || ' · ' || COALESCE(contact_phone, '') || ' · ' || COALESCE(contact_email, ''))
       ELSE ''
     END
   ), '');
