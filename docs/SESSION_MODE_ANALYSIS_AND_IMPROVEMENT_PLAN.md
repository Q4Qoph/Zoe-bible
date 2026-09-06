# Session Mode (Live Sermon & Study Notebook) Analysis & Improvement Plan

## Executive Summary
The **Session Mode** in Zoe Bible is designed for the high-frequency, real-time environment of church services, personal devotions, and small-group Bible studies. This audit compares Zoe Bible's current chat-style session against leading study tools (Logos, Olive Tree, Harvous, Biblenotes.ai, and YouVersion Events) to identify UX friction, architectural gaps, and provide a 6-pillar modern notebook transformation.

---

## 1. Competitive Benchmark & Industry Trends

| Feature / App | Zoe Bible (Current) | Harvous / BibleNotes.ai | YouVersion / Logos | Best Practice Recommendation |
|---|---|---|---|---|
| **Note-Taking Paradigm** | Fragmented chat bubbles (WhatsApp style) | Rich document / block notebook | Threaded scripture-linked notes | **Block-based Hybrid Document** (Sections, Bullets, Inline Scripture Cards) |
| **Scripture Insertion** | Manual search popup (slow) | Instant `@reference` autocomplete | Interactive chapter anchors | **Instant Citation Parser (`@Jn 3:16`) + Quick Passage Sheet** |
| **Structured Templates** | None (Blank topic input only) | S.O.A.P., H.E.A.R., Inductive | Fill-in-the-blank sermon guides | **1-Tap Templates (Sermon, SOAP, HEAR, Freeform)** |
| **In-Session Bible Reading** | Disconnect (must exit session to read) | Side-by-side / split peek | Integrated reader drawer | **Collapsible In-Session Scripture Peek Sheet** |
| **Draft Safety & Auto-Save** | High risk (only saved on explicit "End") | Continuous real-time local save | Cloud auto-sync | **Auto-Drafting in `AsyncStorage` / SQLite Draft Table** |
| **Export & Portability** | Raw plain text string | Formatted Markdown & PDF | Community sharing & Sync | **Styled Markdown Export, Copy Formatted, & Library Integration** |

---

## 2. Core UX Gaps & Frustrations in Current `session.tsx`

### 🚨 1. Chat-Bubble Model vs. Document Model
- **The Problem:** Each entry is treated as an immutable chat message. If a user makes a spelling mistake or wants to add a sub-point, they cannot edit the existing bubble.
- **The Solution:** Transition to an editable **rich note stream** where users can:
  - Add text notes, bullet points, key takeaways, and prayer points.
  - Tap any block to edit, reorder, or delete.
  - Insert formatted scripture blocks with one tap.

### 🚨 2. Scripture Lookup Interrupts the Preacher
- **The Problem:** In a fast sermon, a speaker quotes 5–8 scriptures in 10 minutes. Opening a search modal, typing words, and scrolling through query matches takes 15–20 seconds per verse.
- **The Solution:**
  1. **Smart Citation Auto-Detect:** Type `Rom 8:28` or `@Matt 6:33` $\rightarrow$ parses with `referenceParser.ts` and fetches the verse immediately.
  2. **Quick Reference Tray:** Tap "Add Verse", pick Book & Chapter with instant 2-step chips.

### 🚨 3. Lack of Structured Reflection Frameworks
- When users open "Bible Study" or "Sermon", they often stare at a blank prompt.
- **Templates Needed:**
  - **3-Point Sermon:** Main Message, Scripture Anchor, Point 1, Point 2, Point 3, Life Application.
  - **S.O.A.P. Devotional:** Scripture, Observation, Application, Prayer.
  - **H.E.A.R. Study:** Highlight, Explain, Apply, Respond.
  - **Freeform Live Notes:** Fast, bulleted real-time note-taking.

### 🚨 4. Zero Draft Persistence (Risk of Data Loss)
- If a phone call interrupts church service or the app is closed, active notes are lost unless the user tapped "End Session".
- **The Solution:** Active sessions are continuously auto-saved to `zoe_active_session_draft` so users can resume seamlessly even after device restarts.

### 🚨 5. In-Session Passage Peek
- While taking sermon notes, users need to glance at the context of the chapter being preached without navigating away from their note cursor.
- **The Solution:** Slide-up **Scripture Peek Sheet** allowing full chapter reading with a 1-tap "Insert into Note" button.

---

## 3. Upgraded Feature Specifications

### A. Template Selector Modal / Starter Grid
When starting a session, the user can select:
1. 🎙️ **Standard Sermon** (Preacher, Series, Main Points, Takeaway)
2. 🧼 **S.O.A.P. Journal** (Scripture $\rightarrow$ Observation $\rightarrow$ Application $\rightarrow$ Prayer)
3. 👂 **H.E.A.R. Framework** (Highlight $\rightarrow$ Explain $\rightarrow$ Apply $\rightarrow$ Respond)
4. ⚡ **Quick Capture** (Blank fast note-stream)

### B. Inline Block Types
Notes can contain distinct interactive block types:
- 📝 **General Point / Paragraph**
- 📌 **Scripture Anchor / Verse Quote** (with direct reader link)
- 💡 **Key Takeaway / Principle** (highlighted badge)
- 🙏 **Prayer / Commitment** (distinct styling)
- ❓ **Question / Reflection**

### C. Search & Filter for Past Sessions
- Filter past notes by type: `All`, `Sermon`, `SOAP`, `Study`.
- Full-text search across past session titles, speakers, notes, and embedded verses.
- Export options: Markdown (`.md`), formatted text, and 1-tap batch save to Library.

---

## 4. Implementation Blueprint

```
app/(tabs)/session.tsx
├── Home View (Past Sessions + Template Cards + Search & Filter)
├── Template Setup Modal (Select SOAP / Sermon / HEAR / Freeform)
├── Active Session Screen
│   ├── Top Live Status Bar (Timer, Speaker, Title, End Session)
│   ├── Interactive Block Stream (Draggable/Editable Notes & Verses)
│   ├── In-Session Bible Peek Sheet (Collapsible Reader Drawer)
│   └── Multi-Action Toolbar:
│       ├── [📝 Add Point]
│       ├── [📌 Add Verse Citation]
│       ├── [💡 Key Takeaway]
│       └── [🙏 Prayer Point]
└── Review & Export Screen (Formatted Markdown, Library Sync, Share)
```
