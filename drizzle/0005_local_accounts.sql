CREATE TABLE local_accounts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  studio_code TEXT NOT NULL UNIQUE REFERENCES rooms(code)
);
--> statement-breakpoint
CREATE TABLE local_account_sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES local_accounts(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX local_account_sessions_expiry ON local_account_sessions(expires_at);
--> statement-breakpoint
CREATE TABLE local_login_attempts (
  username TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  through INTEGER NOT NULL
);
--> statement-breakpoint
ALTER TABLE members ADD COLUMN account_collection_id TEXT;
