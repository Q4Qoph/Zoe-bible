import { SQLiteDatabase } from 'expo-sqlite';

export interface Book {
  id: number;
  name: string;
}

export interface Verse {
  id: number;
  book_id: number;
  chapter: number;
  verse: number;
  text: string;
}

export interface ChapterVerse extends Verse {
  book_name: string;
}

// Get all books
export async function getBooks(db: SQLiteDatabase): Promise<Book[]> {
  return db.getAllAsync<Book>('SELECT * FROM BSB_books ORDER BY id');
}

// Get total chapters in a book
export async function getChapterCount(
  db: SQLiteDatabase,
  bookId: number
): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT MAX(chapter) as count FROM BSB_verses WHERE book_id = ?',
    [bookId]
  );
  return result?.count ?? 0;
}

// Get all verses in a chapter
export async function getChapter(
  db: SQLiteDatabase,
  bookId: number,
  chapter: number
): Promise<ChapterVerse[]> {
  return db.getAllAsync<ChapterVerse>(
    `SELECT v.*, b.name as book_name 
     FROM BSB_verses v 
     JOIN BSB_books b ON v.book_id = b.id
     WHERE v.book_id = ? AND v.chapter = ? 
     ORDER BY v.verse`,
    [bookId, chapter]
  );
}

// Get a single verse
export async function getVerse(
  db: SQLiteDatabase,
  bookId: number,
  chapter: number,
  verse: number
): Promise<ChapterVerse | null> {
  return db.getFirstAsync<ChapterVerse>(
    `SELECT v.*, b.name as book_name 
     FROM BSB_verses v 
     JOIN BSB_books b ON v.book_id = b.id
     WHERE v.book_id = ? AND v.chapter = ? AND v.verse = ?`,
    [bookId, chapter, verse]
  );
}

// Full-text search with pagination
export async function searchVerses(
  db: SQLiteDatabase,
  query: string,
  limit = 20,
  offset = 0
): Promise<ChapterVerse[]> {
  return db.getAllAsync<ChapterVerse>(
    `SELECT v.*, b.name as book_name
     FROM BSB_verses v
     JOIN BSB_books b ON v.book_id = b.id
     WHERE v.text LIKE ?
     ORDER BY v.book_id, v.chapter, v.verse
     LIMIT ? OFFSET ?`,
    [`%${query}%`, limit, offset]
  );
}

// Get verse count in a chapter (useful for navigation)
export async function getVerseCount(
  db: SQLiteDatabase,
  bookId: number,
  chapter: number
): Promise<number> {
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT MAX(verse) as count FROM BSB_verses WHERE book_id = ? AND chapter = ?',
    [bookId, chapter]
  );
  return result?.count ?? 0;
}

// Get a random verse (for daily verse)
export async function getDailyVerse(db: SQLiteDatabase): Promise<ChapterVerse | null> {
  // Use date as seed so it's consistent per day
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const total = 31102; // Total BSB verses
  const verseId = (seed % total) + 1;

  return db.getFirstAsync<ChapterVerse>(
    `SELECT v.*, b.name as book_name 
     FROM BSB_verses v 
     JOIN BSB_books b ON v.book_id = b.id
     WHERE v.id = ?`,
    [verseId]
  );
}