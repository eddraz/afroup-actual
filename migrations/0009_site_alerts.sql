-- Breaking news / emergency site alert banner
CREATE TABLE IF NOT EXISTS site_alerts (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  is_active INTEGER NOT NULL DEFAULT 0,
  message TEXT NOT NULL DEFAULT '',
  link_url TEXT NOT NULL DEFAULT '',
  link_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO site_alerts (id, is_active, message, link_url, link_text)
VALUES (1, 0, '', '', '');
