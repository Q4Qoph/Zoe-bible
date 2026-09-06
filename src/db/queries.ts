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

export type TranslationId = 'BSB' | 'KJV' | 'WEB';

export function getTableNameForTranslation(translation: TranslationId = 'BSB'): string {
  if (translation === 'KJV') return 'KJV_verses';
  if (translation === 'WEB') return 'WEB_verses';
  return 'BSB_verses';
}

// Get all verses in a chapter
export async function getChapter(
  db: SQLiteDatabase,
  bookId: number,
  chapter: number,
  translation: TranslationId = 'BSB'
): Promise<ChapterVerse[]> {
  const table = getTableNameForTranslation(translation);
  return db.getAllAsync<ChapterVerse>(
    `SELECT v.id, v.book_id, v.chapter, v.verse, v.text, b.name as book_name 
     FROM ${table} v 
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
  verse: number,
  translation: TranslationId = 'BSB'
): Promise<ChapterVerse | null> {
  const table = getTableNameForTranslation(translation);
  return db.getFirstAsync<ChapterVerse>(
    `SELECT v.id, v.book_id, v.chapter, v.verse, v.text, b.name as book_name 
     FROM ${table} v 
     JOIN BSB_books b ON v.book_id = b.id
     WHERE v.book_id = ? AND v.chapter = ? AND v.verse = ?`,
    [bookId, chapter, verse]
  );
}

// Get parallel translations for comparison (BSB, KJV, WEB) directly from SQLite DB
export async function getComparativeTranslationsFromDb(
  db: SQLiteDatabase,
  bookId: number,
  chapter: number,
  verse: number,
  fallbackText?: string
): Promise<{ BSB: string; KJV: string; WEB: string }> {
  try {
    const [bsb, kjv, web] = await Promise.all([
      db.getFirstAsync<{ text: string }>(
        'SELECT text FROM BSB_verses WHERE book_id = ? AND chapter = ? AND verse = ?',
        [bookId, chapter, verse]
      ),
      db.getFirstAsync<{ text: string }>(
        'SELECT text FROM KJV_verses WHERE book_id = ? AND chapter = ? AND verse = ?',
        [bookId, chapter, verse]
      ),
      db.getFirstAsync<{ text: string }>(
        'SELECT text FROM WEB_verses WHERE book_id = ? AND chapter = ? AND verse = ?',
        [bookId, chapter, verse]
      ),
    ]);

    const bsbText = bsb?.text || fallbackText || '';
    return {
      BSB: bsbText,
      KJV: kjv?.text || bsbText,
      WEB: web?.text || bsbText,
    };
  } catch {
    const defaultText = fallbackText || '';
    return {
      BSB: defaultText,
      KJV: defaultText,
      WEB: defaultText,
    };
  }
}

export type SearchFacet =
  | 'all'
  | 'ot'
  | 'nt'
  | 'gospels'
  | 'epistles'
  | 'wisdom'
  | 'history'
  | 'prophets';

export interface SearchOptions {
  facet?: SearchFacet;
  bookId?: number;
  limit?: number;
  offset?: number;
}

// Full-text search with BM25 ranking, stemming, boolean and phrase support
export async function searchVerses(
  db: SQLiteDatabase,
  query: string,
  limit = 20,
  offset = 0,
  options?: Omit<SearchOptions, 'limit' | 'offset'>
): Promise<ChapterVerse[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const facet = options?.facet ?? 'all';
  let filterClause = '';
  const params: (string | number)[] = [];

  if (options?.bookId) {
    filterClause = ' AND v.book_id = ?';
    params.push(options.bookId);
  } else if (facet === 'ot') {
    filterClause = ' AND v.book_id <= 39';
  } else if (facet === 'nt') {
    filterClause = ' AND v.book_id >= 40';
  } else if (facet === 'gospels') {
    filterClause = ' AND v.book_id BETWEEN 40 AND 44';
  } else if (facet === 'epistles') {
    filterClause = ' AND v.book_id BETWEEN 45 AND 65';
  } else if (facet === 'wisdom') {
    filterClause = ' AND v.book_id BETWEEN 18 AND 22';
  } else if (facet === 'history') {
    filterClause = ' AND v.book_id BETWEEN 6 AND 17';
  } else if (facet === 'prophets') {
    filterClause = ' AND v.book_id BETWEEN 23 AND 39';
  }

  // Check if FTS query is possible
  try {
    const isPhrase = trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 2;
    let ftsTerm = '';
    if (isPhrase) {
      ftsTerm = trimmed;
    } else {
      const words = trimmed.replace(/[^\w\s]/gi, ' ').split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        ftsTerm = words.map((w) => `"${w}"*`).join(' AND ');
      }
    }

    if (ftsTerm) {
      const ftsSql = `
        SELECT v.id, v.book_id, v.chapter, v.verse, v.text, b.name as book_name,
               bm25(BSB_verses_fts) as rank
        FROM BSB_verses_fts f
        JOIN BSB_verses v ON v.id = f.verse_id
        JOIN BSB_books b ON v.book_id = b.id
        WHERE BSB_verses_fts MATCH ? ${filterClause}
        ORDER BY rank
        LIMIT ? OFFSET ?
      `;
      const ftsResults = await db.getAllAsync<ChapterVerse>(ftsSql, [
        ftsTerm,
        ...params,
        limit,
        offset,
      ]);
      if (ftsResults.length > 0 || offset > 0) {
        return ftsResults;
      }
    }
  } catch {
    // If FTS fails or is compiling, continue to LIKE query fallback
  }

  // Fallback to LIKE query
  const likeSql = `
    SELECT v.*, b.name as book_name
    FROM BSB_verses v
    JOIN BSB_books b ON v.book_id = b.id
    WHERE v.text LIKE ? ${filterClause}
    ORDER BY v.book_id, v.chapter, v.verse
    LIMIT ? OFFSET ?
  `;
  return db.getAllAsync<ChapterVerse>(likeSql, [`%${trimmed}%`, ...params, limit, offset]);
}

// Get match counts across facets
export async function getSearchCounts(
  db: SQLiteDatabase,
  query: string
): Promise<{ total: number; ot: number; nt: number; gospels: number; epistles: number }> {
  const trimmed = query.trim();
  if (!trimmed) return { total: 0, ot: 0, nt: 0, gospels: 0, epistles: 0 };

  try {
    const words = trimmed.replace(/[^\w\s]/gi, ' ').split(/\s+/).filter(Boolean);
    const ftsTerm = words.map((w) => `"${w}"*`).join(' AND ');
    if (ftsTerm) {
      const row = await db.getFirstAsync<{
        total: number;
        ot: number;
        nt: number;
        gospels: number;
        epistles: number;
      }>(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN v.book_id <= 39 THEN 1 ELSE 0 END) as ot,
          SUM(CASE WHEN v.book_id >= 40 THEN 1 ELSE 0 END) as nt,
          SUM(CASE WHEN v.book_id BETWEEN 40 AND 44 THEN 1 ELSE 0 END) as gospels,
          SUM(CASE WHEN v.book_id BETWEEN 45 AND 65 THEN 1 ELSE 0 END) as epistles
         FROM BSB_verses_fts f
         JOIN BSB_verses v ON v.id = f.verse_id
         WHERE BSB_verses_fts MATCH ?`,
        [ftsTerm]
      );
      if (row) {
        return {
          total: row.total || 0,
          ot: row.ot || 0,
          nt: row.nt || 0,
          gospels: row.gospels || 0,
          epistles: row.epistles || 0,
        };
      }
    }
  } catch {
    // Fallback using LIKE
  }

  const likeTerm = `%${trimmed}%`;
  const row = await db.getFirstAsync<{
    total: number;
    ot: number;
    nt: number;
    gospels: number;
    epistles: number;
  }>(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN book_id <= 39 THEN 1 ELSE 0 END) as ot,
      SUM(CASE WHEN book_id >= 40 THEN 1 ELSE 0 END) as nt,
      SUM(CASE WHEN book_id BETWEEN 40 AND 44 THEN 1 ELSE 0 END) as gospels,
      SUM(CASE WHEN book_id BETWEEN 45 AND 65 THEN 1 ELSE 0 END) as epistles
     FROM BSB_verses
     WHERE text LIKE ?`,
    [likeTerm]
  );

  return {
    total: row?.total || 0,
    ot: row?.ot || 0,
    nt: row?.nt || 0,
    gospels: row?.gospels || 0,
    epistles: row?.epistles || 0,
  };
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

import { getDevotionalForDate, DailyDevotionalEntry } from '../data/dailyVerses';

export interface DailyVerseResult extends ChapterVerse {
  devotional: DailyDevotionalEntry;
}

// Get curated inspirational verse of the day with reflection & prayer
export async function getDailyVerse(db: SQLiteDatabase): Promise<DailyVerseResult | null> {
  const devotional = getDevotionalForDate(new Date());

  const verse = await db.getFirstAsync<ChapterVerse>(
    `SELECT v.*, b.name as book_name 
     FROM BSB_verses v 
     JOIN BSB_books b ON v.book_id = b.id
     WHERE v.book_id = ? AND v.chapter = ? AND v.verse = ?`,
    [devotional.bookId, devotional.chapter, devotional.verse]
  );

  if (!verse) {
    // Graceful fallback to John 3:16 if DB row lookup fails
    return {
      id: 26137,
      book_id: 43,
      chapter: 3,
      verse: 16,
      text: "For God so loved the world that He gave His one and only Son, that everyone who believes in Him shall not perish but have eternal life.",
      book_name: "John",
      devotional,
    };
  }

  return {
    ...verse,
    devotional,
  };
}