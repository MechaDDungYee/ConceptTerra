CREATE TABLE rooms (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  owner_id TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE members (
  id TEXT PRIMARY KEY,
  room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  seat INTEGER CHECK (seat BETWEEN 0 AND 4),
  joined_at INTEGER NOT NULL,
  UNIQUE(room_code, seat),
  UNIQUE(room_code, token_hash)
);
