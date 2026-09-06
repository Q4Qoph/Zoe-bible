import { SQLiteDatabase } from "expo-sqlite";
import {
  getBookmarks,
  getCustomPlans,
  getHighlights,
  getNotes,
  getSavedSessions,
} from "../db/userDb";

export interface ZoeBackupData {
  version: string;
  exportedAt: string;
  data: {
    bookmarks: any[];
    highlights: any[];
    notes: any[];
    sessions: any[];
    customPlans: any[];
  };
}

export async function generateJsonBackup(userDb: SQLiteDatabase): Promise<string> {
  const [bookmarks, highlights, notes, sessions, customPlans] = await Promise.all([
    getBookmarks(userDb),
    getHighlights(userDb),
    getNotes(userDb),
    getSavedSessions(userDb),
    getCustomPlans(userDb),
  ]);

  const backup: ZoeBackupData = {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    data: {
      bookmarks,
      highlights,
      notes,
      sessions,
      customPlans,
    },
  };

  return JSON.stringify(backup, null, 2);
}

export async function generateMarkdownExport(userDb: SQLiteDatabase): Promise<string> {
  const [bookmarks, highlights, notes, sessions] = await Promise.all([
    getBookmarks(userDb),
    getHighlights(userDb),
    getNotes(userDb),
    getSavedSessions(userDb),
  ]);

  const lines: string[] = [];
  lines.push("# Zoe Bible — Study Notebook Export");
  lines.push(`*Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*\n`);

  // Notes
  lines.push(`## 📝 Study Notes (${notes.length})`);
  if (notes.length === 0) {
    lines.push("*No notes recorded yet.*\n");
  } else {
    notes.forEach((n) => {
      lines.push(`### ${n.book_name} ${n.chapter}:${n.verse}`);
      lines.push(`> "${n.verse_text}"\n`);
      lines.push(`**Note:** ${n.note}`);
      lines.push(`*Created: ${new Date(n.created_at).toLocaleDateString()}*\n`);
    });
  }

  // Sermon Sessions
  lines.push(`## 🎙️ Sermon & Study Sessions (${sessions.length})`);
  if (sessions.length === 0) {
    lines.push("*No sermon sessions recorded yet.*\n");
  } else {
    sessions.forEach((s) => {
      lines.push(`### ${s.topic || "Untitled Sermon"}`);
      if (s.speaker) lines.push(`*Speaker:* ${s.speaker} | *Date:* ${s.date}`);
      lines.push(`\n${typeof s.notes === "string" ? s.notes : JSON.stringify(s.notes)}\n`);
    });
  }

  // Bookmarks
  lines.push(`## 🔖 Saved Bookmarks (${bookmarks.length})`);
  bookmarks.forEach((b) => {
    lines.push(`* **${b.book_name} ${b.chapter}:${b.verse}** — "${b.text}"`);
  });
  lines.push("");

  // Highlights
  lines.push(`## 🎨 Verse Highlights (${highlights.length})`);
  highlights.forEach((h) => {
    lines.push(`* **${h.book_name} ${h.chapter}:${h.verse}** (${h.color}): "${h.text}"`);
  });

  return lines.join("\n");
}

export async function restoreJsonBackup(
  userDb: SQLiteDatabase,
  jsonString: string
): Promise<{ success: boolean; restoredCounts: { notes: number; bookmarks: number; highlights: number; sessions: number } }> {
  try {
    const parsed: ZoeBackupData = JSON.parse(jsonString);
    if (!parsed.data) throw new Error("Invalid backup format");

    const counts = { notes: 0, bookmarks: 0, highlights: 0, sessions: 0 };

    // Restore Bookmarks
    if (Array.isArray(parsed.data.bookmarks)) {
      for (const b of parsed.data.bookmarks) {
        await userDb.runAsync(
          `INSERT OR IGNORE INTO bookmarks (book_id, book_name, chapter, verse, text, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [b.book_id, b.book_name, b.chapter, b.verse, b.text, b.created_at || new Date().toISOString()]
        );
        counts.bookmarks++;
      }
    }

    // Restore Highlights
    if (Array.isArray(parsed.data.highlights)) {
      for (const h of parsed.data.highlights) {
        await userDb.runAsync(
          `INSERT OR REPLACE INTO highlights (book_id, book_name, chapter, verse, text, color, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [h.book_id, h.book_name, h.chapter, h.verse, h.text, h.color, h.created_at || new Date().toISOString()]
        );
        counts.highlights++;
      }
    }

    // Restore Notes
    if (Array.isArray(parsed.data.notes)) {
      for (const n of parsed.data.notes) {
        await userDb.runAsync(
          `INSERT INTO notes (book_id, book_name, chapter, verse, verse_text, note, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [n.book_id, n.book_name, n.chapter, n.verse, n.verse_text, n.note, n.created_at || new Date().toISOString()]
        );
        counts.notes++;
      }
    }

    // Restore Sessions
    if (Array.isArray(parsed.data.sessions)) {
      for (const s of parsed.data.sessions) {
        await userDb.runAsync(
          `INSERT INTO sessions (topic, speaker, session_type, date, notes, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [s.topic, s.speaker, s.session_type, s.date, typeof s.notes === "string" ? s.notes : JSON.stringify(s.notes), s.created_at || new Date().toISOString()]
        );
        counts.sessions++;
      }
    }

    return { success: true, restoredCounts: counts };
  } catch (e: any) {
    throw new Error(e.message || "Failed to restore backup");
  }
}
