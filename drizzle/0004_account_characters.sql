CREATE TABLE account_characters (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  data TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX account_characters_owner ON account_characters(owner_id, updated_at DESC, id);
