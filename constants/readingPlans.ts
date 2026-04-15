export interface PlanDay {
  day: number;
  readings: { bookId: number; bookName: string; chapter: number }[];
}

export interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  duration: string;
  icon: string;
  color: string;
  days: PlanDay[];
}

export const READING_PLANS: ReadingPlan[] = [
  {
    id: 'nt-30',
    name: 'New Testament in 30 Days',
    description: 'Read through the entire New Testament in one month.',
    duration: '30 days',
    icon: '✝️',
    color: '#FF6B35',
    days: [
      { day: 1, readings: [{ bookId: 40, bookName: 'Matthew', chapter: 1 }, { bookId: 40, bookName: 'Matthew', chapter: 2 }, { bookId: 40, bookName: 'Matthew', chapter: 3 }] },
      { day: 2, readings: [{ bookId: 40, bookName: 'Matthew', chapter: 4 }, { bookId: 40, bookName: 'Matthew', chapter: 5 }, { bookId: 40, bookName: 'Matthew', chapter: 6 }] },
      { day: 3, readings: [{ bookId: 40, bookName: 'Matthew', chapter: 7 }, { bookId: 40, bookName: 'Matthew', chapter: 8 }, { bookId: 40, bookName: 'Matthew', chapter: 9 }] },
      { day: 4, readings: [{ bookId: 40, bookName: 'Matthew', chapter: 10 }, { bookId: 40, bookName: 'Matthew', chapter: 11 }, { bookId: 40, bookName: 'Matthew', chapter: 12 }] },
      { day: 5, readings: [{ bookId: 40, bookName: 'Matthew', chapter: 13 }, { bookId: 40, bookName: 'Matthew', chapter: 14 }, { bookId: 40, bookName: 'Matthew', chapter: 15 }] },
      { day: 6, readings: [{ bookId: 40, bookName: 'Matthew', chapter: 16 }, { bookId: 40, bookName: 'Matthew', chapter: 17 }, { bookId: 40, bookName: 'Matthew', chapter: 18 }] },
      { day: 7, readings: [{ bookId: 40, bookName: 'Matthew', chapter: 19 }, { bookId: 40, bookName: 'Matthew', chapter: 20 }, { bookId: 40, bookName: 'Matthew', chapter: 21 }] },
      { day: 8, readings: [{ bookId: 40, bookName: 'Matthew', chapter: 22 }, { bookId: 40, bookName: 'Matthew', chapter: 23 }, { bookId: 40, bookName: 'Matthew', chapter: 24 }] },
      { day: 9, readings: [{ bookId: 40, bookName: 'Matthew', chapter: 25 }, { bookId: 40, bookName: 'Matthew', chapter: 26 }, { bookId: 40, bookName: 'Matthew', chapter: 27 }] },
      { day: 10, readings: [{ bookId: 40, bookName: 'Matthew', chapter: 28 }, { bookId: 41, bookName: 'Mark', chapter: 1 }, { bookId: 41, bookName: 'Mark', chapter: 2 }] },
      { day: 11, readings: [{ bookId: 41, bookName: 'Mark', chapter: 3 }, { bookId: 41, bookName: 'Mark', chapter: 4 }, { bookId: 41, bookName: 'Mark', chapter: 5 }] },
      { day: 12, readings: [{ bookId: 41, bookName: 'Mark', chapter: 6 }, { bookId: 41, bookName: 'Mark', chapter: 7 }, { bookId: 41, bookName: 'Mark', chapter: 8 }] },
      { day: 13, readings: [{ bookId: 41, bookName: 'Mark', chapter: 9 }, { bookId: 41, bookName: 'Mark', chapter: 10 }, { bookId: 41, bookName: 'Mark', chapter: 11 }] },
      { day: 14, readings: [{ bookId: 41, bookName: 'Mark', chapter: 12 }, { bookId: 41, bookName: 'Mark', chapter: 13 }, { bookId: 41, bookName: 'Mark', chapter: 14 }] },
      { day: 15, readings: [{ bookId: 41, bookName: 'Mark', chapter: 15 }, { bookId: 41, bookName: 'Mark', chapter: 16 }, { bookId: 42, bookName: 'Luke', chapter: 1 }] },
      { day: 16, readings: [{ bookId: 42, bookName: 'Luke', chapter: 2 }, { bookId: 42, bookName: 'Luke', chapter: 3 }, { bookId: 42, bookName: 'Luke', chapter: 4 }] },
      { day: 17, readings: [{ bookId: 42, bookName: 'Luke', chapter: 5 }, { bookId: 42, bookName: 'Luke', chapter: 6 }, { bookId: 42, bookName: 'Luke', chapter: 7 }] },
      { day: 18, readings: [{ bookId: 42, bookName: 'Luke', chapter: 8 }, { bookId: 42, bookName: 'Luke', chapter: 9 }, { bookId: 42, bookName: 'Luke', chapter: 10 }] },
      { day: 19, readings: [{ bookId: 42, bookName: 'Luke', chapter: 11 }, { bookId: 42, bookName: 'Luke', chapter: 12 }, { bookId: 42, bookName: 'Luke', chapter: 13 }] },
      { day: 20, readings: [{ bookId: 42, bookName: 'Luke', chapter: 14 }, { bookId: 42, bookName: 'Luke', chapter: 15 }, { bookId: 42, bookName: 'Luke', chapter: 16 }] },
      { day: 21, readings: [{ bookId: 42, bookName: 'Luke', chapter: 17 }, { bookId: 42, bookName: 'Luke', chapter: 18 }, { bookId: 42, bookName: 'Luke', chapter: 19 }] },
      { day: 22, readings: [{ bookId: 42, bookName: 'Luke', chapter: 20 }, { bookId: 42, bookName: 'Luke', chapter: 21 }, { bookId: 42, bookName: 'Luke', chapter: 22 }] },
      { day: 23, readings: [{ bookId: 42, bookName: 'Luke', chapter: 23 }, { bookId: 42, bookName: 'Luke', chapter: 24 }, { bookId: 43, bookName: 'John', chapter: 1 }] },
      { day: 24, readings: [{ bookId: 43, bookName: 'John', chapter: 2 }, { bookId: 43, bookName: 'John', chapter: 3 }, { bookId: 43, bookName: 'John', chapter: 4 }] },
      { day: 25, readings: [{ bookId: 43, bookName: 'John', chapter: 5 }, { bookId: 43, bookName: 'John', chapter: 6 }, { bookId: 43, bookName: 'John', chapter: 7 }] },
      { day: 26, readings: [{ bookId: 43, bookName: 'John', chapter: 8 }, { bookId: 43, bookName: 'John', chapter: 9 }, { bookId: 43, bookName: 'John', chapter: 10 }] },
      { day: 27, readings: [{ bookId: 43, bookName: 'John', chapter: 11 }, { bookId: 43, bookName: 'John', chapter: 12 }, { bookId: 43, bookName: 'John', chapter: 13 }] },
      { day: 28, readings: [{ bookId: 43, bookName: 'John', chapter: 14 }, { bookId: 43, bookName: 'John', chapter: 15 }, { bookId: 43, bookName: 'John', chapter: 16 }] },
      { day: 29, readings: [{ bookId: 43, bookName: 'John', chapter: 17 }, { bookId: 43, bookName: 'John', chapter: 18 }, { bookId: 43, bookName: 'John', chapter: 19 }] },
      { day: 30, readings: [{ bookId: 43, bookName: 'John', chapter: 20 }, { bookId: 43, bookName: 'John', chapter: 21 }] },
    ],
  },
  {
    id: 'psalms-30',
    name: 'Psalms in 30 Days',
    description: 'Journey through the book of Psalms — poetry, worship and prayer.',
    duration: '30 days',
    icon: '🎵',
    color: '#7C3AED',
    days: Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      readings: [
        { bookId: 19, bookName: 'Psalms', chapter: i * 5 + 1 },
        { bookId: 19, bookName: 'Psalms', chapter: i * 5 + 2 },
        { bookId: 19, bookName: 'Psalms', chapter: i * 5 + 3 },
        { bookId: 19, bookName: 'Psalms', chapter: i * 5 + 4 },
        { bookId: 19, bookName: 'Psalms', chapter: i * 5 + 5 },
      ].filter(r => r.chapter <= 150),
    })),
  },
  {
    id: 'beginners-7',
    name: 'Beginners Week',
    description: 'New to the Bible? Start here. 7 key chapters to get you started.',
    duration: '7 days',
    icon: '🌱',
    color: '#06D6A0',
    days: [
      { day: 1, readings: [{ bookId: 1, bookName: 'Genesis', chapter: 1 }] },
      { day: 2, readings: [{ bookId: 43, bookName: 'John', chapter: 1 }] },
      { day: 3, readings: [{ bookId: 19, bookName: 'Psalms', chapter: 23 }] },
      { day: 4, readings: [{ bookId: 45, bookName: 'Romans', chapter: 8 }] },
      { day: 5, readings: [{ bookId: 20, bookName: 'Proverbs', chapter: 1 }] },
      { day: 6, readings: [{ bookId: 46, bookName: '1 Corinthians', chapter: 13 }] },
      { day: 7, readings: [{ bookId: 66, bookName: 'Revelation', chapter: 21 }] },
    ],
  },
  {
    id: 'proverbs-31',
    name: 'Proverbs in 31 Days',
    description: 'One chapter of Proverbs per day — wisdom for everyday life.',
    duration: '31 days',
    icon: '💡',
    color: '#F59E0B',
    days: Array.from({ length: 31 }, (_, i) => ({
      day: i + 1,
      readings: [{ bookId: 20, bookName: 'Proverbs', chapter: i + 1 }],
    })),
  },
];