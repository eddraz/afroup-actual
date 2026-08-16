-- Explicit record shares replace Parent tree visibility.
-- A user sees self, owned records, and records shared with them.
CREATE TABLE record_shares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_slug TEXT NOT NULL,
  record_id INTEGER NOT NULL,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (module_slug, record_id, shared_with_id),
  CHECK (owner_id != shared_with_id)
);

CREATE INDEX idx_record_shares_viewer ON record_shares (shared_with_id, module_slug);
CREATE INDEX idx_record_shares_record ON record_shares (module_slug, record_id);
