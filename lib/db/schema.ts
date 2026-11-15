export const SCHEMA_VERSION = 1;

export const SCHEMA_SQL = /* sql */ `
CREATE TABLE IF NOT EXISTS _meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS works (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  type           TEXT    NOT NULL CHECK (type IN ('movie','series','book','music')),
  title          TEXT    NOT NULL,
  original_title TEXT    NOT NULL DEFAULT '',
  creator        TEXT    NOT NULL DEFAULT '',
  year           INTEGER,
  cover          TEXT    NOT NULL DEFAULT '',
  cover_remote   TEXT    NOT NULL DEFAULT '',
  cover_ratio    REAL    NOT NULL DEFAULT 0.72,
  summary        TEXT    NOT NULL DEFAULT '',
  review         TEXT    NOT NULL DEFAULT '',
  rating         REAL,
  status         TEXT    NOT NULL DEFAULT 'done' CHECK (status IN ('done','doing','wish')),
  tags           TEXT    NOT NULL DEFAULT '',
  douban_id      TEXT    NOT NULL DEFAULT '',
  douban_url     TEXT    NOT NULL DEFAULT '',
  douban_rating  REAL,
  meta           TEXT    NOT NULL DEFAULT '{}',
  featured       INTEGER NOT NULL DEFAULT 0,
  finished_on    TEXT,
  created_at     TEXT    NOT NULL,
  updated_at     TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_works_type     ON works(type);
CREATE INDEX IF NOT EXISTS idx_works_status   ON works(status);
CREATE INDEX IF NOT EXISTS idx_works_year     ON works(year);
CREATE INDEX IF NOT EXISTS idx_works_rating   ON works(rating);
CREATE INDEX IF NOT EXISTS idx_works_created  ON works(created_at DESC);

-- "collected" ordering drives the home page and the library default.
CREATE INDEX IF NOT EXISTS idx_works_finished ON works(finished_on DESC);
-- Timeline groups by year and reads covers only; covering index avoids a
-- full table scan when ordering the whole archive.
CREATE INDEX IF NOT EXISTS idx_works_year_id  ON works(year DESC, id DESC);
`;

/**
 * Full-text index. Kept as an external-content table so the works table stays
 * the single source of truth; triggers keep both in sync.
 */
export const FTS_SQL = /* sql */ `
CREATE VIRTUAL TABLE IF NOT EXISTS works_fts USING fts5(
  title,
  original_title,
  creator,
  summary,
  review,
  tags,
  content='works',
  content_rowid='id',
  tokenize="unicode61 remove_diacritics 2"
);

CREATE TRIGGER IF NOT EXISTS works_fts_ai AFTER INSERT ON works BEGIN
  INSERT INTO works_fts(rowid, title, original_title, creator, summary, review, tags)
  VALUES (new.id, new.title, new.original_title, new.creator, new.summary, new.review, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS works_fts_ad AFTER DELETE ON works BEGIN
  INSERT INTO works_fts(works_fts, rowid, title, original_title, creator, summary, review, tags)
  VALUES ('delete', old.id, old.title, old.original_title, old.creator, old.summary, old.review, old.tags);
END;

CREATE TRIGGER IF NOT EXISTS works_fts_au AFTER UPDATE ON works BEGIN
  INSERT INTO works_fts(works_fts, rowid, title, original_title, creator, summary, review, tags)
  VALUES ('delete', old.id, old.title, old.original_title, old.creator, old.summary, old.review, old.tags);
  INSERT INTO works_fts(rowid, title, original_title, creator, summary, review, tags)
  VALUES (new.id, new.title, new.original_title, new.creator, new.summary, new.review, new.tags);
END;
`;
