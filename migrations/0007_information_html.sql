-- Preserve official line breaks by converting stored plain text into simple HTML paragraphs.
UPDATE aid_entries
   SET information = '<p>' || REPLACE(REPLACE(information, CHAR(13), ''), CHAR(10), '<br>') || '</p>'
 WHERE information IS NOT NULL
   AND TRIM(information) != ''
   AND information NOT LIKE '%<%';
