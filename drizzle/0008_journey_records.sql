CREATE TABLE journey_records (
  room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  revision INTEGER NOT NULL,
  recorded_at TEXT NOT NULL,
  lines TEXT NOT NULL,
  PRIMARY KEY (room_code, revision)
);
