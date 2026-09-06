import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'zoe_bible.db';

export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  const dbDir = `${FileSystem.documentDirectory}SQLite/`;
  const dbPath = `${dbDir}${DB_NAME}`;

  // Ensure SQLite directory exists
  const dirInfo = await FileSystem.getInfoAsync(dbDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
  }

  // Copy DB from assets if not already there or if translations need update
  const dbInfo = await FileSystem.getInfoAsync(dbPath);
  let needsCopy = !dbInfo.exists;

  if (dbInfo.exists) {
    try {
      const testDb = await SQLite.openDatabaseAsync(DB_NAME);
      const checkKjv = await testDb.getFirstAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='KJV_verses'"
      );
      if (!checkKjv) {
        needsCopy = true;
      }
      await testDb.closeAsync();
    } catch {
      needsCopy = true;
    }
  }

  if (needsCopy) {
    const asset = Asset.fromModule(require('../../assets/zoe_bible.db'));
    await asset.downloadAsync();
    await FileSystem.copyAsync({
      from: asset.localUri!,
      to: dbPath,
    });
  }

  const db = await SQLite.openDatabaseAsync(DB_NAME);

  // Initialize FTS5 table in background if needed
  try {
    await db.execAsync(`
      CREATE VIRTUAL TABLE IF NOT EXISTS BSB_verses_fts USING fts5(
        verse_id UNINDEXED,
        book_id UNINDEXED,
        chapter UNINDEXED,
        verse UNINDEXED,
        text,
        tokenize = 'porter unicode61'
      );
    `);

    const check = await db.getFirstAsync<{ cnt: number }>(
      'SELECT count(*) as cnt FROM BSB_verses_fts LIMIT 1'
    );
    if (!check || check.cnt === 0) {
      await db.execAsync(`
        INSERT INTO BSB_verses_fts (verse_id, book_id, chapter, verse, text)
        SELECT id, book_id, chapter, verse, text FROM BSB_verses;
      `);
    }
  } catch (e) {
    console.warn('FTS initialization skipped or failed:', e);
  }

  return db;
}