export interface PlanReading {
  bookId: number;
  bookName: string;
  chapter: number;
}

export interface PlanDay {
  day: number;
  readings: PlanReading[];
}

export interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  duration: string;
  category: "canonical" | "new_testament" | "wisdom" | "topical" | "short";
  icon: string;
  color: string;
  days: PlanDay[];
}

// Canonical book catalog for plan generation
const BIBLE_BOOKS: { id: number; name: string; chapters: number; isNT?: boolean }[] = [
  // Old Testament (929 chapters)
  { id: 1, name: "Genesis", chapters: 50 },
  { id: 2, name: "Exodus", chapters: 40 },
  { id: 3, name: "Leviticus", chapters: 27 },
  { id: 4, name: "Numbers", chapters: 36 },
  { id: 5, name: "Deuteronomy", chapters: 34 },
  { id: 6, name: "Joshua", chapters: 24 },
  { id: 7, name: "Judges", chapters: 21 },
  { id: 8, name: "Ruth", chapters: 4 },
  { id: 9, name: "1 Samuel", chapters: 31 },
  { id: 10, name: "2 Samuel", chapters: 24 },
  { id: 11, name: "1 Kings", chapters: 22 },
  { id: 12, name: "2 Kings", chapters: 25 },
  { id: 13, name: "1 Chronicles", chapters: 29 },
  { id: 14, name: "2 Chronicles", chapters: 36 },
  { id: 15, name: "Ezra", chapters: 10 },
  { id: 16, name: "Nehemiah", chapters: 13 },
  { id: 17, name: "Esther", chapters: 10 },
  { id: 18, name: "Job", chapters: 42 },
  { id: 19, name: "Psalms", chapters: 150 },
  { id: 20, name: "Proverbs", chapters: 31 },
  { id: 21, name: "Ecclesiastes", chapters: 12 },
  { id: 22, name: "Song of Solomon", chapters: 8 },
  { id: 23, name: "Isaiah", chapters: 66 },
  { id: 24, name: "Jeremiah", chapters: 52 },
  { id: 25, name: "Lamentations", chapters: 5 },
  { id: 26, name: "Ezekiel", chapters: 48 },
  { id: 27, name: "Daniel", chapters: 12 },
  { id: 28, name: "Hosea", chapters: 14 },
  { id: 29, name: "Joel", chapters: 3 },
  { id: 30, name: "Amos", chapters: 9 },
  { id: 31, name: "Obadiah", chapters: 1 },
  { id: 32, name: "Jonah", chapters: 4 },
  { id: 33, name: "Micah", chapters: 7 },
  { id: 34, name: "Nahum", chapters: 3 },
  { id: 35, name: "Habakkuk", chapters: 3 },
  { id: 36, name: "Zephaniah", chapters: 3 },
  { id: 37, name: "Haggai", chapters: 2 },
  { id: 38, name: "Zechariah", chapters: 14 },
  { id: 39, name: "Malachi", chapters: 4 },
  // New Testament (260 chapters)
  { id: 40, name: "Matthew", chapters: 28, isNT: true },
  { id: 41, name: "Mark", chapters: 16, isNT: true },
  { id: 42, name: "Luke", chapters: 24, isNT: true },
  { id: 43, name: "John", chapters: 21, isNT: true },
  { id: 44, name: "Acts", chapters: 28, isNT: true },
  { id: 45, name: "Romans", chapters: 16, isNT: true },
  { id: 46, name: "1 Corinthians", chapters: 16, isNT: true },
  { id: 47, name: "2 Corinthians", chapters: 13, isNT: true },
  { id: 48, name: "Galatians", chapters: 6, isNT: true },
  { id: 49, name: "Ephesians", chapters: 6, isNT: true },
  { id: 50, name: "Philippians", chapters: 4, isNT: true },
  { id: 51, name: "Colossians", chapters: 4, isNT: true },
  { id: 52, name: "1 Thessalonians", chapters: 5, isNT: true },
  { id: 53, name: "2 Thessalonians", chapters: 3, isNT: true },
  { id: 54, name: "1 Timothy", chapters: 6, isNT: true },
  { id: 55, name: "2 Timothy", chapters: 4, isNT: true },
  { id: 56, name: "Titus", chapters: 3, isNT: true },
  { id: 57, name: "Philemon", chapters: 1, isNT: true },
  { id: 58, name: "Hebrews", chapters: 13, isNT: true },
  { id: 59, name: "James", chapters: 5, isNT: true },
  { id: 60, name: "1 Peter", chapters: 5, isNT: true },
  { id: 61, name: "2 Peter", chapters: 3, isNT: true },
  { id: 62, name: "1 John", chapters: 5, isNT: true },
  { id: 63, name: "2 John", chapters: 1, isNT: true },
  { id: 64, name: "3 John", chapters: 1, isNT: true },
  { id: 65, name: "Jude", chapters: 1, isNT: true },
  { id: 66, name: "Revelation", chapters: 22, isNT: true },
];

// Helper to flatten a book list into single chapter readings
function flattenChapters(bookList: typeof BIBLE_BOOKS): PlanReading[] {
  const result: PlanReading[] = [];
  for (const b of bookList) {
    for (let ch = 1; ch <= b.chapters; ch++) {
      result.push({ bookId: b.id, bookName: b.name, chapter: ch });
    }
  }
  return result;
}

// Distribute chapters evenly across N days
function distributeIntoDays(allReadings: PlanReading[], totalDays: number): PlanDay[] {
  const days: PlanDay[] = [];
  const total = allReadings.length;
  let currIndex = 0;

  for (let day = 1; day <= totalDays; day++) {
    // Calculate target end index proportionally
    const targetEnd = Math.round((day * total) / totalDays);
    const dayReadings = allReadings.slice(currIndex, targetEnd);
    currIndex = targetEnd;
    days.push({ day, readings: dayReadings });
  }
  return days;
}

// 1. Bible in One Year (365 Days - 1,189 Chapters)
const allBibleChapters = flattenChapters(BIBLE_BOOKS);
const bible365Days = distributeIntoDays(allBibleChapters, 365);

// 2. New Testament in 90 Days (260 Chapters)
const ntBooks = BIBLE_BOOKS.filter((b) => b.isNT);
const allNtChapters = flattenChapters(ntBooks);
const nt90Days = distributeIntoDays(allNtChapters, 90);

// 3. The Gospels in 30 Days (89 Chapters: Matthew, Mark, Luke, John)
const gospelsBooks = BIBLE_BOOKS.filter((b) => b.id >= 40 && b.id <= 43);
const allGospelChapters = flattenChapters(gospelsBooks);
const gospels30Days = distributeIntoDays(allGospelChapters, 30);

// 4. Epistles & Letters in 30 Days (Romans through Revelation - 143 Chapters)
const epistlesBooks = BIBLE_BOOKS.filter((b) => b.id >= 45 && b.id <= 66);
const allEpistleChapters = flattenChapters(epistlesBooks);
const epistles30Days = distributeIntoDays(allEpistleChapters, 30);

// 5. Balanced Psalms in 30 Days (150 Chapters with Psalm 119 isolated)
const psalms30Days: PlanDay[] = [
  { day: 1, readings: [{ bookId: 19, bookName: "Psalms", chapter: 1 }, { bookId: 19, bookName: "Psalms", chapter: 2 }, { bookId: 19, bookName: "Psalms", chapter: 3 }, { bookId: 19, bookName: "Psalms", chapter: 4 }, { bookId: 19, bookName: "Psalms", chapter: 5 }] },
  { day: 2, readings: [{ bookId: 19, bookName: "Psalms", chapter: 6 }, { bookId: 19, bookName: "Psalms", chapter: 7 }, { bookId: 19, bookName: "Psalms", chapter: 8 }, { bookId: 19, bookName: "Psalms", chapter: 9 }] },
  { day: 3, readings: [{ bookId: 19, bookName: "Psalms", chapter: 10 }, { bookId: 19, bookName: "Psalms", chapter: 11 }, { bookId: 19, bookName: "Psalms", chapter: 12 }, { bookId: 19, bookName: "Psalms", chapter: 13 }, { bookId: 19, bookName: "Psalms", chapter: 14 }] },
  { day: 4, readings: [{ bookId: 19, bookName: "Psalms", chapter: 15 }, { bookId: 19, bookName: "Psalms", chapter: 16 }, { bookId: 19, bookName: "Psalms", chapter: 17 }, { bookId: 19, bookName: "Psalms", chapter: 18 }] },
  { day: 5, readings: [{ bookId: 19, bookName: "Psalms", chapter: 19 }, { bookId: 19, bookName: "Psalms", chapter: 20 }, { bookId: 19, bookName: "Psalms", chapter: 21 }, { bookId: 19, bookName: "Psalms", chapter: 22 }] },
  { day: 6, readings: [{ bookId: 19, bookName: "Psalms", chapter: 23 }, { bookId: 19, bookName: "Psalms", chapter: 24 }, { bookId: 19, bookName: "Psalms", chapter: 25 }, { bookId: 19, bookName: "Psalms", chapter: 26 }, { bookId: 19, bookName: "Psalms", chapter: 27 }] },
  { day: 7, readings: [{ bookId: 19, bookName: "Psalms", chapter: 28 }, { bookId: 19, bookName: "Psalms", chapter: 29 }, { bookId: 19, bookName: "Psalms", chapter: 30 }, { bookId: 19, bookName: "Psalms", chapter: 31 }, { bookId: 19, bookName: "Psalms", chapter: 32 }] },
  { day: 8, readings: [{ bookId: 19, bookName: "Psalms", chapter: 33 }, { bookId: 19, bookName: "Psalms", chapter: 34 }, { bookId: 19, bookName: "Psalms", chapter: 35 }] },
  { day: 9, readings: [{ bookId: 19, bookName: "Psalms", chapter: 36 }, { bookId: 19, bookName: "Psalms", chapter: 37 }, { bookId: 19, bookName: "Psalms", chapter: 38 }] },
  { day: 10, readings: [{ bookId: 19, bookName: "Psalms", chapter: 39 }, { bookId: 19, bookName: "Psalms", chapter: 40 }, { bookId: 19, bookName: "Psalms", chapter: 41 }, { bookId: 19, bookName: "Psalms", chapter: 42 }, { bookId: 19, bookName: "Psalms", chapter: 43 }] },
  { day: 11, readings: [{ bookId: 19, bookName: "Psalms", chapter: 44 }, { bookId: 19, bookName: "Psalms", chapter: 45 }, { bookId: 19, bookName: "Psalms", chapter: 46 }, { bookId: 19, bookName: "Psalms", chapter: 47 }, { bookId: 19, bookName: "Psalms", chapter: 48 }] },
  { day: 12, readings: [{ bookId: 19, bookName: "Psalms", chapter: 49 }, { bookId: 19, bookName: "Psalms", chapter: 50 }, { bookId: 19, bookName: "Psalms", chapter: 51 }, { bookId: 19, bookName: "Psalms", chapter: 52 }, { bookId: 19, bookName: "Psalms", chapter: 53 }] },
  { day: 13, readings: [{ bookId: 19, bookName: "Psalms", chapter: 54 }, { bookId: 19, bookName: "Psalms", chapter: 55 }, { bookId: 19, bookName: "Psalms", chapter: 56 }, { bookId: 19, bookName: "Psalms", chapter: 57 }, { bookId: 19, bookName: "Psalms", chapter: 58 }] },
  { day: 14, readings: [{ bookId: 19, bookName: "Psalms", chapter: 59 }, { bookId: 19, bookName: "Psalms", chapter: 60 }, { bookId: 19, bookName: "Psalms", chapter: 61 }, { bookId: 19, bookName: "Psalms", chapter: 62 }, { bookId: 19, bookName: "Psalms", chapter: 63 }] },
  { day: 15, readings: [{ bookId: 19, bookName: "Psalms", chapter: 64 }, { bookId: 19, bookName: "Psalms", chapter: 65 }, { bookId: 19, bookName: "Psalms", chapter: 66 }, { bookId: 19, bookName: "Psalms", chapter: 67 }] },
  { day: 16, readings: [{ bookId: 19, bookName: "Psalms", chapter: 68 }, { bookId: 19, bookName: "Psalms", chapter: 69 }, { bookId: 19, bookName: "Psalms", chapter: 70 }] },
  { day: 17, readings: [{ bookId: 19, bookName: "Psalms", chapter: 71 }, { bookId: 19, bookName: "Psalms", chapter: 72 }, { bookId: 19, bookName: "Psalms", chapter: 73 }] },
  { day: 18, readings: [{ bookId: 19, bookName: "Psalms", chapter: 74 }, { bookId: 19, bookName: "Psalms", chapter: 75 }, { bookId: 19, bookName: "Psalms", chapter: 76 }, { bookId: 19, bookName: "Psalms", chapter: 77 }] },
  { day: 19, readings: [{ bookId: 19, bookName: "Psalms", chapter: 78 }, { bookId: 19, bookName: "Psalms", chapter: 79 }] },
  { day: 20, readings: [{ bookId: 19, bookName: "Psalms", chapter: 80 }, { bookId: 19, bookName: "Psalms", chapter: 81 }, { bookId: 19, bookName: "Psalms", chapter: 82 }, { bookId: 19, bookName: "Psalms", chapter: 83 }, { bookId: 19, bookName: "Psalms", chapter: 84 }] },
  { day: 21, readings: [{ bookId: 19, bookName: "Psalms", chapter: 85 }, { bookId: 19, bookName: "Psalms", chapter: 86 }, { bookId: 19, bookName: "Psalms", chapter: 87 }, { bookId: 19, bookName: "Psalms", chapter: 88 }, { bookId: 19, bookName: "Psalms", chapter: 89 }] },
  { day: 22, readings: [{ bookId: 19, bookName: "Psalms", chapter: 90 }, { bookId: 19, bookName: "Psalms", chapter: 91 }, { bookId: 19, bookName: "Psalms", chapter: 92 }, { bookId: 19, bookName: "Psalms", chapter: 93 }, { bookId: 19, bookName: "Psalms", chapter: 94 }] },
  { day: 23, readings: [{ bookId: 19, bookName: "Psalms", chapter: 95 }, { bookId: 19, bookName: "Psalms", chapter: 96 }, { bookId: 19, bookName: "Psalms", chapter: 97 }, { bookId: 19, bookName: "Psalms", chapter: 98 }, { bookId: 19, bookName: "Psalms", chapter: 99 }, { bookId: 19, bookName: "Psalms", chapter: 100 }] },
  { day: 24, readings: [{ bookId: 19, bookName: "Psalms", chapter: 101 }, { bookId: 19, bookName: "Psalms", chapter: 102 }, { bookId: 19, bookName: "Psalms", chapter: 103 }, { bookId: 19, bookName: "Psalms", chapter: 104 }] },
  { day: 25, readings: [{ bookId: 19, bookName: "Psalms", chapter: 105 }, { bookId: 19, bookName: "Psalms", chapter: 106 }, { bookId: 19, bookName: "Psalms", chapter: 107 }] },
  { day: 26, readings: [{ bookId: 19, bookName: "Psalms", chapter: 108 }, { bookId: 19, bookName: "Psalms", chapter: 109 }, { bookId: 19, bookName: "Psalms", chapter: 110 }, { bookId: 19, bookName: "Psalms", chapter: 111 }, { bookId: 19, bookName: "Psalms", chapter: 112 }, { bookId: 19, bookName: "Psalms", chapter: 113 }, { bookId: 19, bookName: "Psalms", chapter: 114 }, { bookId: 19, bookName: "Psalms", chapter: 115 }] },
  { day: 27, readings: [{ bookId: 19, bookName: "Psalms", chapter: 116 }, { bookId: 19, bookName: "Psalms", chapter: 117 }, { bookId: 19, bookName: "Psalms", chapter: 118 }] },
  { day: 28, readings: [{ bookId: 19, bookName: "Psalms", chapter: 119 }] }, // Dedicated day for the 176 verses of Psalm 119
  { day: 29, readings: [{ bookId: 19, bookName: "Psalms", chapter: 120 }, { bookId: 19, bookName: "Psalms", chapter: 121 }, { bookId: 19, bookName: "Psalms", chapter: 122 }, { bookId: 19, bookName: "Psalms", chapter: 123 }, { bookId: 19, bookName: "Psalms", chapter: 124 }, { bookId: 19, bookName: "Psalms", chapter: 125 }, { bookId: 19, bookName: "Psalms", chapter: 126 }, { bookId: 19, bookName: "Psalms", chapter: 127 }, { bookId: 19, bookName: "Psalms", chapter: 128 }, { bookId: 19, bookName: "Psalms", chapter: 129 }, { bookId: 19, bookName: "Psalms", chapter: 130 }, { bookId: 19, bookName: "Psalms", chapter: 131 }, { bookId: 19, bookName: "Psalms", chapter: 132 }, { bookId: 19, bookName: "Psalms", chapter: 133 }, { bookId: 19, bookName: "Psalms", chapter: 134 }] },
  { day: 30, readings: [{ bookId: 19, bookName: "Psalms", chapter: 135 }, { bookId: 19, bookName: "Psalms", chapter: 136 }, { bookId: 19, bookName: "Psalms", chapter: 137 }, { bookId: 19, bookName: "Psalms", chapter: 138 }, { bookId: 19, bookName: "Psalms", chapter: 139 }, { bookId: 19, bookName: "Psalms", chapter: 140 }, { bookId: 19, bookName: "Psalms", chapter: 141 }, { bookId: 19, bookName: "Psalms", chapter: 142 }, { bookId: 19, bookName: "Psalms", chapter: 143 }, { bookId: 19, bookName: "Psalms", chapter: 144 }, { bookId: 19, bookName: "Psalms", chapter: 145 }, { bookId: 19, bookName: "Psalms", chapter: 146 }, { bookId: 19, bookName: "Psalms", chapter: 147 }, { bookId: 19, bookName: "Psalms", chapter: 148 }, { bookId: 19, bookName: "Psalms", chapter: 149 }, { bookId: 19, bookName: "Psalms", chapter: 150 }] },
];

export const READING_PLANS: ReadingPlan[] = [
  {
    id: "bible-365",
    name: "Bible in One Year",
    description: "Read through every chapter of the Old and New Testaments from Genesis to Revelation in 365 days.",
    duration: "365 days",
    category: "canonical",
    icon: "📖",
    color: "#FF6B35",
    days: bible365Days,
  },
  {
    id: "nt-90",
    name: "New Testament in 90 Days",
    description: "Journey through all 27 books of the New Testament at an approachable pace of ~3 chapters daily.",
    duration: "90 days",
    category: "new_testament",
    icon: "✝️",
    color: "#3B82F6",
    days: nt90Days,
  },
  {
    id: "gospels-30",
    name: "The Gospels in 30 Days",
    description: "Immerse yourself in the life, teachings, death, and resurrection of Jesus Christ across Matthew, Mark, Luke, and John.",
    duration: "30 days",
    category: "new_testament",
    icon: "👑",
    color: "#EC4899",
    days: gospels30Days,
  },
  {
    id: "epistles-30",
    name: "Paul's Letters & Epistles",
    description: "Study foundational Christian theology, church life, and practical discipleship in 30 days.",
    duration: "30 days",
    category: "new_testament",
    icon: "📜",
    color: "#8B5CF6",
    days: epistles30Days,
  },
  {
    id: "psalms-30",
    name: "Psalms in 30 Days",
    description: "A balanced 30-day journey through the complete Book of Psalms for worship, prayer, and contemplation.",
    duration: "30 days",
    category: "wisdom",
    icon: "🎵",
    color: "#7C3AED",
    days: psalms30Days,
  },
  {
    id: "proverbs-31",
    name: "Proverbs in 31 Days",
    description: "One chapter of Proverbs per day — timeless godly wisdom, discernment, and instruction for daily living.",
    duration: "31 days",
    category: "wisdom",
    icon: "💡",
    color: "#F59E0B",
    days: Array.from({ length: 31 }, (_, i) => ({
      day: i + 1,
      readings: [{ bookId: 20, bookName: "Proverbs", chapter: i + 1 }],
    })),
  },
  {
    id: "peace-7",
    name: "Peace & Overcoming Anxiety",
    description: "7 days of foundational scriptures to replace worry, stress, and fear with the supernatural peace of God.",
    duration: "7 days",
    category: "topical",
    icon: "🕊️",
    color: "#06D6A0",
    days: [
      { day: 1, readings: [{ bookId: 50, bookName: "Philippians", chapter: 4 }] },
      { day: 2, readings: [{ bookId: 19, bookName: "Psalms", chapter: 23 }] },
      { day: 3, readings: [{ bookId: 40, bookName: "Matthew", chapter: 6 }] },
      { day: 4, readings: [{ bookId: 45, bookName: "Romans", chapter: 8 }] },
      { day: 5, readings: [{ bookId: 19, bookName: "Psalms", chapter: 91 }] },
      { day: 6, readings: [{ bookId: 23, bookName: "Isaiah", chapter: 40 }] },
      { day: 7, readings: [{ bookId: 43, bookName: "John", chapter: 14 }] },
    ],
  },
  {
    id: "faith-14",
    name: "Walking in Faith & Victory",
    description: "14 days of power-packed scriptures to strengthen your spiritual foundation, courage, and trust in God.",
    duration: "14 days",
    category: "topical",
    icon: "🛡️",
    color: "#10B981",
    days: [
      { day: 1, readings: [{ bookId: 58, bookName: "Hebrews", chapter: 11 }] },
      { day: 2, readings: [{ bookId: 6, bookName: "Joshua", chapter: 1 }] },
      { day: 3, readings: [{ bookId: 9, bookName: "1 Samuel", chapter: 17 }] },
      { day: 4, readings: [{ bookId: 49, bookName: "Ephesians", chapter: 6 }] },
      { day: 5, readings: [{ bookId: 45, bookName: "Romans", chapter: 4 }] },
      { day: 6, readings: [{ bookId: 59, bookName: "James", chapter: 1 }] },
      { day: 7, readings: [{ bookId: 59, bookName: "James", chapter: 2 }] },
      { day: 8, readings: [{ bookId: 41, bookName: "Mark", chapter: 11 }] },
      { day: 9, readings: [{ bookId: 23, bookName: "Isaiah", chapter: 54 }] },
      { day: 10, readings: [{ bookId: 46, bookName: "1 Corinthians", chapter: 13 }] },
      { day: 11, readings: [{ bookId: 47, bookName: "2 Corinthians", chapter: 4 }] },
      { day: 12, readings: [{ bookId: 47, bookName: "2 Corinthians", chapter: 5 }] },
      { day: 13, readings: [{ bookId: 50, bookName: "Philippians", chapter: 3 }] },
      { day: 14, readings: [{ bookId: 66, bookName: "Revelation", chapter: 21 }] },
    ],
  },
  {
    id: "beginners-7",
    name: "Beginners Week",
    description: "New to the Bible? Start here with 7 essential chapters that define the Christian faith.",
    duration: "7 days",
    category: "short",
    icon: "🌱",
    color: "#14B8A6",
    days: [
      { day: 1, readings: [{ bookId: 1, bookName: "Genesis", chapter: 1 }] },
      { day: 2, readings: [{ bookId: 43, bookName: "John", chapter: 1 }] },
      { day: 3, readings: [{ bookId: 19, bookName: "Psalms", chapter: 23 }] },
      { day: 4, readings: [{ bookId: 45, bookName: "Romans", chapter: 8 }] },
      { day: 5, readings: [{ bookId: 20, bookName: "Proverbs", chapter: 3 }] },
      { day: 6, readings: [{ bookId: 46, bookName: "1 Corinthians", chapter: 13 }] },
      { day: 7, readings: [{ bookId: 66, bookName: "Revelation", chapter: 21 }] },
    ],
  },
];