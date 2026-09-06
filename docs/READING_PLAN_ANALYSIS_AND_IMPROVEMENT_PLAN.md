# Reading Plan Audit, Gap Analysis & Improvement Plan

## Executive Summary
This document provides a comprehensive analysis of the **Reading Plan** engine in Zoe Bible, uncovering critical data errors, UX bottlenecks, architectural gaps, and a step-by-step blueprint to transform reading plans into a best-in-class spiritual habit system (matching YouVersion, Dwell, and Logos).

---

## 1. Critical Errors & Data Flaws Identified

### 🚨 Fatal Content Error in `constants/readingPlans.ts`
- **The "New Testament in 30 Days" (`nt-30`) Plan only contains the 4 Gospels:**
  - `Day 1 - Day 10`: Matthew (Chapters 1–28)
  - `Day 10 - Day 15`: Mark (Chapters 1–16)
  - `Day 15 - Day 23`: Luke (Chapters 1–24)
  - `Day 23 - Day 30`: John (Chapters 1–21)
  - **Fatal Gap:** The plan abruptly terminates at John 21 on Day 30. It completely excludes **23 books of the New Testament** (Acts, Romans, 1 & 2 Corinthians, Galatians, Ephesians, Philippians, Colossians, 1 & 2 Thessalonians, 1 & 2 Timothy, Titus, Philemon, Hebrews, James, 1 & 2 Peter, 1, 2, 3 John, Jude, Revelation).
  - **Resolution:** Rename `nt-30` to **"The Gospels in 30 Days"** and create a genuine **"New Testament in 90 Days"** (~3 chapters/day) and **"New Testament in 30 Days"** (8.6 chapters/day).

### 🚨 Unbalanced Reading Loads in `psalms-30`
- The Psalms plan blindly aggregates 5 consecutive chapters per day:
  - `Day 24` includes **Psalm 116, 117, 118, 119, 120**.
  - Because Psalm 119 alone contains **176 verses**, Day 24 forces the user to read **238 verses** in one sitting, while Day 23 is only 35 verses.
  - **Resolution:** Balance the Psalms dynamically so long chapters like Psalm 119 are assigned their own dedicated days.

---

## 2. Structural & UX Gaps

### 1. One-Way Reader Disconnect (No In-Reader Completion Flow)
- **Current state:** Tapping a reading navigates to `/reader/[bookId]/[chapter]`, but the Reader has **zero awareness** that it was opened from a reading plan.
- **Problem:** The user has to finish reading, press back, return to the plan screen, find the chapter row, and manually tap the small circle button.
- **Fix:** Pass `?fromPlan=planId&planDay=dayNumber` to Reader. When opened in plan context:
  - Display a top or bottom floating banner: *"Day X • [Plan Name] — Chapter 1 of 3"*.
  - Include a 1-tap **"Complete & Next"** button that automatically saves progress to `zoe_user.db` and loads the next assigned chapter.

### 2. No Progress Toggle (Cannot Uncheck Completed Items)
- **Current state:** In `PlanDetailScreen`, `if (progress[key]) return;`.
- **Problem:** If a user accidentally taps a reading, they cannot unmark or uncomplete it.
- **Fix:** Add `toggleChapterProgress(db, planId, day, bookId, chapter)` supporting completion toggles and recalculating progress dynamically.

### 3. Missing Active "Today" Focus & Auto-Scroll
- **Current state:** Opening a 30-day or 365-day plan always starts at Day 1, requiring manual scrolling to find unread days.
- **Problem:** Friction increases every day the user progresses.
- **Fix:** Compute the current active day (first uncompleted day) and highlight it prominently at the top with a "Today's Reading" action card, auto-scrolling the schedule list.

### 4. Limited Pre-Packaged Plan Variety
- Zoe Bible currently only has 4 basic plans.
- **Industry Standard Suite Needed:**
  1. **Canonical Bible in 1 Year (365 Days)** (Genesis to Revelation, ~3.2 ch/day)
  2. **Chronological Bible in 1 Year (365 Days)** (Events in historical order)
  3. **Daily Walk Mix (365 Days)** (1 Old Testament + 1 New Testament + 1 Psalm/Proverb daily)
  4. **The Gospels in 30 Days** (Matthew, Mark, Luke, John)
  5. **New Testament in 90 Days** (Full 260 chapters at ~3 ch/day)
  6. **Wisdom Literature (30 Days)** (Proverbs, Ecclesiastes, Job highlights)
  7. **Anxiety, Peace & Hope (7 Days)** (Curated topical devotional chapters)
  8. **Faith & Overcoming (14 Days)** (Hebrews 11, Romans 8, David & Goliath, etc.)
  9. **The Epistles of Paul (30 Days)** (Romans through Philemon)

### 5. Plan Creation Friction
- **Current state:** Adding 10 chapters requires 10 separate modal interactions.
- **Fix:** Support range selection in `app/plan/create.tsx` (e.g. "Select Book: Genesis", "Chapters: 1 to 12" -> adds all 12 chapters to Day X with 1 tap).

### 6. Home Screen Plan Widget Gaps
- The Home screen widget only shows overall percentage. It should display:
  - Today's day number & chapter titles.
  - Direct 1-tap **"Start Day X"** button.

---

## 3. Database & Schema Enhancements

### Current Schema:
```sql
CREATE TABLE reading_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  started_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE reading_progress (
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
```

### Proposed Schema Upgrades:
1. Add `toggleChapterComplete` method to `src/db/userDb.ts` to allow toggling completion on and off cleanly.
2. Add `getPlanStats(db, planId)` returning total days, completed days, streak, and estimated finish date.

---

## 4. Implementation Roadmap (Step-by-Step)

| Phase | Focus Area | Deliverables |
|---|---|---|
| **Phase 1** | **Curated Plan Canon** | Fix `nt-30` content bug; add 1-Year Canonical, 1-Year Chronological, 90-Day NT, 30-Day Gospels, Balanced Psalms, and Topical 7-14 Day plans. |
| **Phase 2** | **Database & Logic Upgrade** | Add progress toggling (`toggleChapterProgress`), active day calculation, and plan completion timestamping in `userDb.ts`. |
| **Phase 3** | **Plan Detail Redesign** | Modernize `[planId].tsx` with "Today's Reading" hero card, uncompleted jump, and toggleable checkboxes. |
| **Phase 4** | **In-Reader Plan Companion** | Integrate Reader floating plan pill with auto-mark and "Next Chapter" navigation. |
| **Phase 5** | **Home Screen Quick Action** | Upgrade Home screen widget with direct "Start Today's Readings" flow. |
| **Phase 6** | **Batch Custom Plan Creator** | Add chapter range selector (e.g. Ch 1–10) in `create.tsx` for effortless custom plan creation. |
