import * as SQLite from 'expo-sqlite';

let userDb: SQLite.SQLiteDatabase | null = null;

export async function openUserDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (userDb) return userDb;

  userDb = await SQLite.openDatabaseAsync('zoe_user.db');

  await userDb.execAsync(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      book_name TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS highlights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      book_name TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL,
      color TEXT DEFAULT '#FF6B35',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      book_name TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      verse_text TEXT NOT NULL,
      note TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  return userDb;
}

// ─── Bookmarks ───────────────────────────────────────────
export async function addBookmark(
  db: SQLite.SQLiteDatabase,
  item: { book_id: number; book_name: string; chapter: number; verse: number; text: string }
) {
  await db.runAsync(
    `INSERT OR IGNORE INTO bookmarks (book_id, book_name, chapter, verse, text)
     VALUES (?, ?, ?, ?, ?)`,
    [item.book_id, item.book_name, item.chapter, item.verse, item.text]
  );
}

export async function removeBookmark(db: SQLite.SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM bookmarks WHERE id = ?', [id]);
}

export async function getBookmarks(db: SQLite.SQLiteDatabase) {
  return db.getAllAsync<{
    id: number; book_id: number; book_name: string;
    chapter: number; verse: number; text: string; created_at: string;
  }>('SELECT * FROM bookmarks ORDER BY created_at DESC');
}

// ─── Highlights ──────────────────────────────────────────
export async function addHighlight(
  db: SQLite.SQLiteDatabase,
  item: { book_id: number; book_name: string; chapter: number; verse: number; text: string; color: string }
) {
  await db.runAsync(
    `INSERT INTO highlights (book_id, book_name, chapter, verse, text, color)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [item.book_id, item.book_name, item.chapter, item.verse, item.text, item.color]
  );
}

export async function getHighlights(db: SQLite.SQLiteDatabase) {
  return db.getAllAsync<{
    id: number; book_id: number; book_name: string;
    chapter: number; verse: number; text: string; color: string; created_at: string;
  }>('SELECT * FROM highlights ORDER BY created_at DESC');
}

export async function removeHighlight(db: SQLite.SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM highlights WHERE id = ?', [id]);
}

// ─── Notes ───────────────────────────────────────────────
export async function addNote(
  db: SQLite.SQLiteDatabase,
  item: { book_id: number; book_name: string; chapter: number; verse: number; verse_text: string; note: string }
) {
  await db.runAsync(
    `INSERT INTO notes (book_id, book_name, chapter, verse, verse_text, note)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [item.book_id, item.book_name, item.chapter, item.verse, item.verse_text, item.note]
  );
}

export async function getNotes(db: SQLite.SQLiteDatabase) {
  return db.getAllAsync<{
    id: number; book_id: number; book_name: string;
    chapter: number; verse: number; verse_text: string; note: string; created_at: string;
  }>('SELECT * FROM notes ORDER BY created_at DESC');
}

export async function removeNote(db: SQLite.SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
}