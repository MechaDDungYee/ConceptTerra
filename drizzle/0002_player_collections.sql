CREATE TABLE player_collections (
  id TEXT PRIMARY KEY,
  revision INTEGER NOT NULL DEFAULT 0,
  cards TEXT NOT NULL DEFAULT '[]',
  deck TEXT NOT NULL DEFAULT '[]'
);
--> statement-breakpoint
ALTER TABLE members ADD COLUMN collection_id TEXT;
