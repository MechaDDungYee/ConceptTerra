import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';

export function localDb(filename = ':memory:') {
  const db = new DatabaseSync(filename);
  if (!db.prepare("SELECT name FROM sqlite_master WHERE name='rooms'").get()) {
    db.exec(readFileSync(new URL('../drizzle/0000_rooms.sql', import.meta.url),'utf8'));
  }
  if (!db.prepare("SELECT name FROM sqlite_master WHERE name='game_states'").get()) {
    db.exec(readFileSync(new URL('../drizzle/0001_game.sql', import.meta.url),'utf8'));
  }
  if (!db.prepare("SELECT name FROM sqlite_master WHERE name='player_collections'").get()) {
    db.exec(readFileSync(new URL('../drizzle/0002_player_collections.sql', import.meta.url),'utf8'));
  }
  if (!db.prepare("PRAGMA table_info(player_collections)").all().some(column=>column.name==='stack_names')) {
    db.exec(readFileSync(new URL('../drizzle/0003_custom_stacks.sql', import.meta.url),'utf8'));
  }
  if (!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='account_characters'").get()) {
    db.exec(readFileSync(new URL('../drizzle/0004_account_characters.sql', import.meta.url),'utf8'));
  }
  if (!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='local_accounts'").get()) {
    db.exec(readFileSync(new URL('../drizzle/0005_local_accounts.sql', import.meta.url),'utf8'));
  }
  if (!db.prepare("SELECT name FROM sqlite_master WHERE name='campaign_saves'").get()) {
    db.exec(readFileSync(new URL('../drizzle/0006_campaign_saves.sql', import.meta.url),'utf8'));
  }
  if (!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='battle_music_unlocks'").get()) {
    db.exec(readFileSync(new URL('../drizzle/0007_battle_music_unlocks.sql', import.meta.url),'utf8'));
  }
  if (!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='journey_records'").get()) {
    db.exec(readFileSync(new URL('../drizzle/0008_journey_records.sql', import.meta.url),'utf8'));
  }
  return {
    prepare(sql) {
      return {bind(...args) {
        const statement = db.prepare(sql);
        return {
          first: () => statement.get(...args),
          all: () => ({results:statement.all(...args)}),
          run: () => ({meta:statement.run(...args)})
        };
      }};
    },
    async batch(statements) {
      db.exec('BEGIN');
      try {
        const result = statements.map(statement => statement.run());
        db.exec('COMMIT');
        return result;
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    }
  };
}
