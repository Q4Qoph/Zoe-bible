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
    CREATE TABLE IF NOT EXISTS reading_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id TEXT NOT NULL,
      plan_name TEXT NOT NULL,
      started_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reading_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id TEXT NOT NULL,
      day INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      book_name TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      completed INTEGER DEFAULT 0,
      completed_at TEXT,
      UNIQUE(plan_id, day, book_id, chapter)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      speaker TEXT NOT NULL,
      session_type TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

  `);

  // Additive migrations — safe to run on existing DBs
  await userDb.execAsync(`
    CREATE TABLE IF NOT EXISTS custom_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '📖',
      color TEXT DEFAULT '#FF6B35',
      days TEXT NOT NULL,
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
    `DELETE FROM highlights WHERE book_id = ? AND chapter = ? AND verse = ?`,
    [item.book_id, item.chapter, item.verse]
  );
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

export async function getHighlightsByChapter(
  db: SQLite.SQLiteDatabase,
  book_id: number,
  chapter: number
) {
  return db.getAllAsync<{ verse: number; color: string }>(
    `SELECT verse, color FROM highlights WHERE book_id = ? AND chapter = ?`,
    [book_id, chapter]
  );
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
// ─── Reading Plans ────────────────────────────────────
export async function startPlan(
  db: SQLite.SQLiteDatabase,
  planId: string,
  planName: string
) {
  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM reading_plans WHERE plan_id = ?',
    [planId]
  );
  if (existing) return;
  await db.runAsync(
    'INSERT INTO reading_plans (plan_id, plan_name) VALUES (?, ?)',
    [planId, planName]
  );
}

export async function getActivePlans(db: SQLite.SQLiteDatabase) {
  return db.getAllAsync<{ id: number; plan_id: string; plan_name: string; started_at: string }>(
    'SELECT * FROM reading_plans ORDER BY started_at DESC'
  );
}

export async function markChapterComplete(
  db: SQLite.SQLiteDatabase,
  planId: string,
  day: number,
  bookId: number,
  bookName: string,
  chapter: number
) {
  await db.runAsync(
    `INSERT INTO reading_progress (plan_id, day, book_id, book_name, chapter, completed, completed_at)
     VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
     ON CONFLICT(plan_id, day, book_id, chapter) DO UPDATE SET completed=1, completed_at=datetime('now')`,
    [planId, day, bookId, bookName, chapter]
  );
}

export async function getProgress(
  db: SQLite.SQLiteDatabase,
  planId: string
) {
  return db.getAllAsync<{
    day: number; book_id: number; book_name: string;
    chapter: number; completed: number;
  }>(
    'SELECT * FROM reading_progress WHERE plan_id = ? ORDER BY day',
    [planId]
  );
}

export async function deletePlan(db: SQLite.SQLiteDatabase, planId: string) {
  await db.runAsync('DELETE FROM reading_plans WHERE plan_id = ?', [planId]);
  await db.runAsync('DELETE FROM reading_progress WHERE plan_id = ?', [planId]);
}

// ─── Sessions ─────────────────────────────────────────────
export async function saveSession(
  db: SQLite.SQLiteDatabase,
  session: { topic: string; speaker: string; sessionType: string; date: string; notes: unknown[] }
) {
  await db.runAsync(
    `INSERT INTO sessions (topic, speaker, session_type, date, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [session.topic, session.speaker, session.sessionType, session.date, JSON.stringify(session.notes)]
  );
}

export async function getSavedSessions(db: SQLite.SQLiteDatabase) {
  return db.getAllAsync<{
    id: number; topic: string; speaker: string; session_type: string;
    date: string; notes: string; created_at: string;
  }>('SELECT * FROM sessions ORDER BY created_at DESC');
}

export async function deleteSavedSession(db: SQLite.SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM sessions WHERE id = ?', [id]);
}

// ─── Custom Plans ──────────────────────────────────────────
export async function saveCustomPlan(
  db: SQLite.SQLiteDatabase,
  plan: { id: string; name: string; icon: string; color: string; days: unknown }
) {
  await db.runAsync(
    `INSERT INTO custom_plans (plan_id, name, icon, color, days) VALUES (?, ?, ?, ?, ?)`,
    [plan.id, plan.name, plan.icon, plan.color, JSON.stringify(plan.days)]
  );
}

export async function getCustomPlans(db: SQLite.SQLiteDatabase) {
  return db.getAllAsync<{
    plan_id: string; name: string; icon: string; color: string; days: string; created_at: string;
  }>('SELECT * FROM custom_plans ORDER BY created_at DESC');
}

export async function getCustomPlan(db: SQLite.SQLiteDatabase, planId: string) {
  return db.getFirstAsync<{
    plan_id: string; name: string; icon: string; color: string; days: string;
  }>('SELECT * FROM custom_plans WHERE plan_id = ?', [planId]);
}

export async function deleteCustomPlan(db: SQLite.SQLiteDatabase, planId: string) {
  await db.runAsync('DELETE FROM custom_plans WHERE plan_id = ?', [planId]);
  await db.runAsync('DELETE FROM reading_plans WHERE plan_id = ?', [planId]);
  await db.runAsync('DELETE FROM reading_progress WHERE plan_id = ?', [planId]);
}