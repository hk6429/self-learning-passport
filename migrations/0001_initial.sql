PRAGMA foreign_keys = ON;

CREATE TABLE classes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 40),
  teacher_key_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'closed', 'deleted')),
  retention_days INTEGER NOT NULL CHECK (retention_days IN (7, 30, 90)),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  purge_after TEXT NOT NULL
);

CREATE TABLE missions (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  catalog_mission_id TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  available_on TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (class_id, catalog_mission_id)
);

CREATE TABLE participants (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  participant_token_hash TEXT NOT NULL,
  joined_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  UNIQUE (class_id, alias)
);

CREATE TABLE completions (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('complete', 'partial')),
  completed_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (class_id, event_id)
);

CREATE INDEX idx_classes_expires ON classes(status, expires_at);
CREATE INDEX idx_missions_class_position ON missions(class_id, position);
CREATE INDEX idx_participants_class ON participants(class_id);
CREATE INDEX idx_completions_class ON completions(class_id, completed_at);
CREATE INDEX idx_completions_participant ON completions(participant_id);
CREATE INDEX idx_completions_mission ON completions(mission_id);
