-- Schema only. No invented aid rows.
CREATE TABLE departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE aid_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  department_id INTEGER NOT NULL REFERENCES departments(id),
  title TEXT NOT NULL,
  summary TEXT,
  body TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  location TEXT,
  category TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('published', 'pending', 'rejected')),
  submitted_by_name TEXT,
  submitted_by_contact TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT
);

CREATE TABLE admin_sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE INDEX idx_aid_entries_department_status ON aid_entries (department_id, status);
CREATE INDEX idx_aid_entries_status ON aid_entries (status);
CREATE INDEX idx_admin_sessions_expires ON admin_sessions (expires_at);

INSERT INTO departments (slug, name) VALUES
  ('choco', 'Chocó'),
  ('valle-del-cauca', 'Valle del Cauca'),
  ('antioquia', 'Antioquia'),
  ('risaralda', 'Risaralda'),
  ('caldas', 'Caldas'),
  ('quindio', 'Quindío'),
  ('cauca', 'Cauca'),
  ('narino', 'Nariño'),
  ('cordoba', 'Córdoba'),
  ('otros', 'Otros / nacional');
