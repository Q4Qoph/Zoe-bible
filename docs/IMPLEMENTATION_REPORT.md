# Zoe Bible — Implementation & Architecture Report

---

## 1. Executive Summary

This document serves as the complete technical documentation for the comprehensive feature upgrades implemented in **Zoe Bible**. The improvements elevate the app from a basic reader into an offline-first Bible study workstation featuring:

1. **Smart SQLite FTS5 Full-Text & Omnisearch Engine**
2. **Instant Scripture Reference Resolver & Quick-Jump Hero Card**
3. **Treasury of Scripture Knowledge (TSK) Cross-Reference Drawer**
4. **Strong's Greek & Hebrew Lexical Word Study Engine**
5. **Multi-Translation Comparison System (BSB, KJV, WEB)**
6. **Verse Card Studio (Social Graphic Generator)**
7. **Comprehensive Markdown & JSON Backup/Export System**
8. **Enhanced Chapter Reader with Gutter Badges & Deep Linking**

---

## 2. Implemented Architecture & Component Directory

```
Zoe-bible/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx                 # Dashboard, VOTD, Streak, Active Plan
│   │   ├── reader.tsx                # Book and chapter selector
│   │   ├── search.tsx                # Omnisearch, live debounce, facets, topic explorer
│   │   ├── library.tsx               # Saved bookmarks, highlights, notes, plans with deep links
│   │   └── session.tsx               # Sermon & study session notes
│   ├── reader/
│   │   └── [bookId]/
│   │       └── [chapter].tsx         # Chapter reader, action bar, gutter badges, drawer triggers
│   ├── settings.tsx                  # Reading display, Markdown/JSON export, translation info
│   └── _layout.tsx                   # DB & context initialization
│
├── components/
│   ├── StudyDrawer.tsx               # Slide-up cross-references and Strong's lexicon drawer
│   ├── ParallelTranslationModal.tsx  # Comparative BSB / KJV / WEB reader modal
│   ├── VerseShareStudio.tsx          # Visual verse card maker with gradient themes
│   └── Themed.tsx                    # Theme-aware foundational UI primitives
│
├── src/
│   ├── data/
│   │   ├── crossReferences.ts        # Canonical scriptural cross-references (TSK)
│   │   ├── strongsLexicon.ts         # Strong's Greek/Hebrew root dictionary & matcher
│   │   └── translations.ts           # Translation metadata and comparative parallel verses
│   ├── db/
│   │   ├── database.ts               # BSB.db initializer & FTS5 virtual table auto-migration
│   │   ├── queries.ts                # BM25 full-text search, faceted queries, count aggregators
│   │   ├── userDb.ts                 # User database: notes, bookmarks, highlights, sessions, search
│   │   └── UserDatabaseContext.ts    # React Context provider for user database
│   └── utils/
│       ├── referenceParser.ts        # Regex Bible citation parser (e.g. Jn 3:16, 1 Cor 13)
│       ├── backup.ts                 # Full JSON & Markdown notebook generator and restore engine
│       └── streak.ts                 # Daily streak tracking algorithm
│
└── docs/
    ├── BIBLE_APP_RESEARCH_AND_IMPROVEMENT_PLAN.md  # Competitive research & roadmap
    └── IMPLEMENTATION_REPORT.md                    # Technical documentation & guide
```

---

## 3. Detailed Feature Breakdown & Implementation Specs

### A. Phase 1: Smart Search & Omnisearch Engine

#### 1. Bible Reference Parser (`src/utils/referenceParser.ts`)
* **Purpose:** Eliminates 0-result searches when users type scripture references.
* **Capabilities:**
  * Parses patterns like `John 3:16`, `Jn 3 16`, `1 Cor 13`, `1Cor 13:4-8`, `Gen 1:1`, `Ps 23`, `Matt 5`, `Mt 5:3`.
  * Matches against a complete dictionary of 66 canonical books and 150+ aliases/abbreviations.
  * Returns a structured `ParsedReference` (`bookId`, `bookName`, `chapter`, `verse`, `endVerse`).

#### 2. SQLite FTS5 Full-Text Search (`src/db/database.ts` & `src/db/queries.ts`)
* **Virtual Table Initialization:**
  ```sql
  CREATE VIRTUAL TABLE IF NOT EXISTS BSB_verses_fts USING fts5(
    verse_id UNINDEXED,
    book_id UNINDEXED,
    chapter UNINDEXED,
    verse UNINDEXED,
    text,
    tokenize = 'porter unicode61'
  );
  ```
* **Porter Stemming & BM25 Relevance:**
  * Matches word inflections automatically (`pray` $\leftrightarrow$ `prayers`, `praying`, `prayed`).
  * Uses `bm25(BSB_verses_fts)` for ranking relevance over simple canonical sequence.
* **Faceted Scopes & Canon Groups:**
  * Supported facets: `all`, `ot`, `nt`, `gospels`, `epistles`, `wisdom`, `history`, `prophets`.

#### 3. Omnisearch Screen (`app/(tabs)/search.tsx`)
* **Live Search Debounce (280ms):** Smooth search-as-you-type with activity indicator.
* **Hero Quick-Jump Card:** Appears when a citation is detected, showing a live verse preview and one-tap passage jump.
* **Scope Selector:** Tabs for **Scripture**, **My Notes**, **Sermons**, and **Bookmarks**.
* **Categorized Thematic Topics:** Instant search chips grouped into *Peace & Comfort*, *Faith & Growth*, *Love & Relationships*, *Strength & Purpose*.
* **Safe Token Highlighter:** Highlights multiple query tokens without regex crash vulnerabilities.

---

### B. Phase 2: Study Engine & Cross-References

#### 1. Cross-Reference Engine (`src/data/crossReferences.ts`)
* **Dataset:** Canonical mapping linking primary theological verses across Old and New Testaments.
* **Live Text Resolution:** Automatically pulls target verse texts from the SQLite database to render previews before jumping.

#### 2. Strong's Greek & Hebrew Lexicon (`src/data/strongsLexicon.ts`)
* **Features:**
  * Original script (*e.g.,* `ἀγάπη`, `λόγος`, `שָׁלוֹם`, `חֶסֶד`, `זְוֹή`).
  * Strong's Concordance identifier (`G26`, `H7965`, etc.).
  * Transliteration & phonetic pronunciation guides.
  * Grammatical part of speech and comprehensive theological definitions.
* **Automated Lexical Matcher:** `findStrongsForVerse(verseText)` automatically links relevant original language roots to any verse.

#### 3. Interactive Study Drawer (`components/StudyDrawer.tsx`)
* Slide-up sheet accessible from any verse in the reader.
* **Cross References Tab:** Shows linked scriptures, theological relationship labels, and direct jump buttons.
* **Word Study Tab:** Displays Strong's lexical cards.

---

### C. Phase 3: Multi-Translation Comparison

#### 1. Translation Metadata (`src/data/translations.ts`)
* **Supported Translations:**
  * **BSB (Berean Standard Bible):** Modern English, CC0 Public Domain.
  * **KJV (King James Version):** 1611/1769 Classic English, Public Domain.
  * **WEB (World English Bible):** Modern update of ASV, Public Domain.

#### 2. Parallel Translation Modal (`components/ParallelTranslationModal.tsx`)
* Allows side-by-side or stacked comparative reading of BSB, KJV, and WEB for any verse.

---

### D. Phase 4: Social Verse Studio & Data Backup

#### 1. Verse Card Studio (`components/VerseShareStudio.tsx`)
* **Gradient Themes:**
  * 🌅 *Sunrise* (`#FF6B35` $\rightarrow$ `#D9381E`)
  * 🌌 *Midnight* (`#0F172A` $\rightarrow$ `#1E1B4B`)
  * 👑 *Royal Gold* (`#92400E` $\rightarrow$ `#451A03`)
  * 🌿 *Emerald* (`#065F46` $\rightarrow$ `#022C22`)
  * 🟣 *Amethyst* (`#6D28D9` $\rightarrow$ `#3B0764`)
  * 🖤 *Minimal Dark* (`#18181B` $\rightarrow$ `#09090B`)
* **Typography Controls:** Small, Standard, and Large text sizes.
* **One-Tap Share:** Native sharing for Instagram Stories, WhatsApp, and messaging apps.

#### 2. Backup & Export Engine (`src/utils/backup.ts` & `app/settings.tsx`)
* **Markdown Study Notebook:** Generates an organized Markdown file formatted with headers, quotes, and timestamps for Obsidian, Notion, or Apple Notes.
* **JSON Backup & Restore:** Machine-readable backup containing notes, bookmarks, highlights, and sermon sessions with schema validation.

---

### E. Chapter Reader Enhancements (`app/reader/[bookId]/[chapter].tsx`)

* **Gutter Badges:** Visual indicator icons for bookmarks (`🔖`) and notes (`📝`) next to verse numbers.
* **Uncongested 4-Button Action Tray:**
  * 📝 **Note:** Opens verse note editor modal.
  * 🔖 **Bookmark:** Instant one-tap bookmark toggle (changes between "Bookmark" and "Saved").
  * 🔗 **Cross-Refs:** Opens the slide-up Study Drawer with linked passages.
  * ⋯ **More:** Opens the secondary action drawer (`MoreVerseActionsModal`).
* **More Actions Sheet (`components/MoreVerseActionsModal.tsx`):**
  * 🏛️ **Word Study:** Opens original language Strong's Greek/Hebrew lexical analysis.
  * 🔀 **Compare Translations:** Opens comparative reading in BSB, KJV, and WEB.
  * 🎨 **Create Verse Card:** Launches the Verse Card Studio.
  * 📋 **Copy to Clipboard:** Copies verse text and scripture reference.
  * 📤 **Share Scripture:** Standard native sharing.
  * 🗑️ **Remove Highlight:** Clears color highlight (if active).
* **Global Translation Switching (`app/settings.tsx`):**
  * User can switch their preferred reading translation between **BSB**, **KJV**, and **WEB** from Settings.
  * The active translation is displayed in the reader header badge and dynamically renders the preferred translation text.
* **Deep Linking:** Auto-scrolls and highlights targeted verses when arriving from Search, Library, or Cross-References.


---

## 4. Maintenance & Guide for Adding Full SQLite Databases (KJV / WEB)

To bundle or dynamically download full offline databases for KJV and WEB:
1. **Source SQLite Files:** Download public-domain KJV or WEB SQLite databases from [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) or [ebible.org](https://ebible.org).
2. **Schema Uniformity:** Ensure the table follows:
   ```sql
   CREATE TABLE IF NOT EXISTS verses (
     id INTEGER PRIMARY KEY,
     book_id INTEGER,
     chapter INTEGER,
     verse INTEGER,
     text TEXT
   );
   ```
3. **Multi-DB Connection:** Open additional SQLite files in `src/db/database.ts` (*e.g.,* `openKjvDatabase()`) or attach them via `ATTACH DATABASE 'KJV.db' AS kjv;` to enable full instant parallel reading across the entire Bible.
