CREATE TABLE game_states (
  room_code TEXT PRIMARY KEY REFERENCES rooms(code) ON DELETE CASCADE,
  revision INTEGER NOT NULL,
  state TEXT NOT NULL
);
