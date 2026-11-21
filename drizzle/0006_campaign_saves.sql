CREATE TABLE IF NOT EXISTS campaign_saves (
  room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 3),
  data TEXT NOT NULL,
  label TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  round INTEGER,
  PRIMARY KEY(room_code, slot)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS campaign_save_keys (
  room_code TEXT PRIMARY KEY REFERENCES rooms(code) ON DELETE CASCADE,
  secret TEXT NOT NULL
);
