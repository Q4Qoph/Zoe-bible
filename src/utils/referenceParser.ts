export interface ParsedReference {
  bookId: number;
  bookName: string;
  chapter: number;
  verse?: number;
  endVerse?: number;
  formattedRef: string;
}

// Map common book abbreviations and aliases to exact canonical book names
const BOOK_ALIASES: Record<string, string> = {
  // Old Testament
  gen: "Genesis", ge: "Genesis", gn: "Genesis",
  exo: "Exodus", ex: "Exodus", exod: "Exodus",
  lev: "Leviticus", le: "Leviticus", lv: "Leviticus",
  num: "Numbers", nu: "Numbers", nm: "Numbers", nb: "Numbers",
  deut: "Deuteronomy", dt: "Deuteronomy", de: "Deuteronomy",
  josh: "Joshua", jos: "Joshua", jsh: "Joshua",
  judg: "Judges", jdg: "Judges", jg: "Judges", jdgs: "Judges",
  ruth: "Ruth", rth: "Ruth", ru: "Ruth",
  "1sam": "1 Samuel", "1sa": "1 Samuel", "1s": "1 Samuel", "1 samuel": "1 Samuel", "1samuel": "1 Samuel",
  "2sam": "2 Samuel", "2sa": "2 Samuel", "2s": "2 Samuel", "2 samuel": "2 Samuel", "2samuel": "2 Samuel",
  "1kgs": "1 Kings", "1ki": "1 Kings", "1k": "1 Kings", "1 kings": "1 Kings", "1kings": "1 Kings",
  "2kgs": "2 Kings", "2ki": "2 Kings", "2k": "2 Kings", "2 kings": "2 Kings", "2kings": "2 Kings",
  "1chr": "1 Chronicles", "1ch": "1 Chronicles", "1 chron": "1 Chronicles", "1chronicles": "1 Chronicles",
  "2chr": "2 Chronicles", "2ch": "2 Chronicles", "2 chron": "2 Chronicles", "2chronicles": "2 Chronicles",
  ezra: "Ezra", ezr: "Ezra",
  neh: "Nehemiah", ne: "Nehemiah",
  esth: "Esther", est: "Esther", es: "Esther",
  job: "Job", jb: "Job",
  ps: "Psalms", psa: "Psalms", psm: "Psalms", pss: "Psalms", psalm: "Psalms", psalms: "Psalms",
  prov: "Proverbs", pro: "Proverbs", prv: "Proverbs", pr: "Proverbs",
  eccl: "Ecclesiastes", ecc: "Ecclesiastes", ec: "Ecclesiastes", qoh: "Ecclesiastes",
  song: "Song of Solomon", sos: "Song of Solomon", songs: "Song of Solomon", cant: "Song of Solomon", "song of songs": "Song of Solomon",
  isa: "Isaiah", is: "Isaiah",
  jer: "Jeremiah", je: "Jeremiah", jr: "Jeremiah",
  lam: "Lamentations", la: "Lamentations",
  ezek: "Ezekiel", eze: "Ezekiel", ezk: "Ezekiel",
  dan: "Daniel", da: "Daniel", dn: "Daniel",
  hos: "Hosea", ho: "Hosea",
  joel: "Joel", joe: "Joel", jl: "Joel",
  amos: "Amos", am: "Amos",
  obad: "Obadiah", oba: "Obadiah", ob: "Obadiah",
  jonah: "Jonah", jon: "Jonah", jnh: "Jonah",
  mic: "Micah", mc: "Micah",
  nah: "Nahum", na: "Nahum",
  hab: "Habakkuk", hb: "Habakkuk",
  zeph: "Zephaniah", zep: "Zephaniah", zp: "Zephaniah",
  hag: "Haggai", hg: "Haggai",
  zech: "Zechariah", zec: "Zechariah", zc: "Zechariah",
  mal: "Malachi", ml: "Malachi",

  // New Testament
  matt: "Matthew", mat: "Matthew", mt: "Matthew",
  mark: "Mark", mrk: "Mark", mk: "Mark",
  luke: "Luke", luk: "Luke", lk: "Luke",
  john: "John", jhn: "John", jn: "John",
  acts: "Acts", act: "Acts", ac: "Acts",
  rom: "Romans", ro: "Romans", rm: "Romans",
  "1cor": "1 Corinthians", "1co": "1 Corinthians", "1 corinthians": "1 Corinthians", "1corinthians": "1 Corinthians",
  "2cor": "2 Corinthians", "2co": "2 Corinthians", "2 corinthians": "2 Corinthians", "2corinthians": "2 Corinthians",
  gal: "Galatians", ga: "Galatians",
  eph: "Ephesians", ep: "Ephesians",
  phil: "Philippians", php: "Philippians", phi: "Philippians",
  col: "Colossians", cl: "Colossians",
  "1thess": "1 Thessalonians", "1th": "1 Thessalonians", "1 thessalonians": "1 Thessalonians", "1thessalonians": "1 Thessalonians",
  "2thess": "2 Thessalonians", "2th": "2 Thessalonians", "2 thessalonians": "2 Thessalonians", "2thessalonians": "2 Thessalonians",
  "1tim": "1 Timothy", "1ti": "1 Timothy", "1 timothy": "1 Timothy", "1timothy": "1 Timothy",
  "2tim": "2 Timothy", "2ti": "2 Timothy", "2 timothy": "2 Timothy", "2timothy": "2 Timothy",
  titus: "Titus", tit: "Titus", ti: "Titus",
  phlm: "Philemon", phm: "Philemon",
  heb: "Hebrews", he: "Hebrews",
  james: "James", jas: "James", jm: "James",
  "1pet": "1 Peter", "1pe": "1 Peter", "1p": "1 Peter", "1 peter": "1 Peter", "1peter": "1 Peter",
  "2pet": "2 Peter", "2pe": "2 Peter", "2p": "2 Peter", "2 peter": "2 Peter", "2peter": "2 Peter",
  "1john": "1 John", "1jn": "1 John", "1j": "1 John", "1 john": "1 John",
  "2john": "2 John", "2jn": "2 John", "2j": "2 John", "2 john": "2 John",
  "3john": "3 John", "3jn": "3 John", "3j": "3 John", "3 john": "3 John",
  jude: "Jude", jud: "Jude", jd: "Jude",
  rev: "Revelation", re: "Revelation", rv: "Revelation", revelation: "Revelation",
};

export function parseBibleReference(
  rawInput: string,
  allBooks: { id: number; name: string }[]
): ParsedReference | null {
  if (!rawInput || !rawInput.trim()) return null;
  const input = rawInput.trim();

  // Regex matches patterns like:
  // "John 3:16", "Jn 3 16", "1 Cor 13:4-8", "Genesis 1", "Ps 23", "1John 1:9"
  const pattern = /^([1-3]?\s*[a-zA-Z]+(?:\s+of\s+[a-zA-Z]+)?)\s*(\d+)(?:(?::|\s+|\.)(\d+)(?:-(\d+))?)?$/i;
  const match = input.match(pattern);
  if (!match) return null;

  const [, rawBookStr, chapterStr, verseStr, endVerseStr] = match;
  const chapter = parseInt(chapterStr, 10);
  if (isNaN(chapter) || chapter <= 0) return null;

  const verse = verseStr ? parseInt(verseStr, 10) : undefined;
  const endVerse = endVerseStr ? parseInt(endVerseStr, 10) : undefined;

  // Normalize book string
  const cleanBook = rawBookStr.toLowerCase().trim().replace(/\s+/g, " ");
  const compactBook = cleanBook.replace(/\s+/g, "");

  // 1. Check exact match in allBooks
  let foundBook = allBooks.find(
    (b) => b.name.toLowerCase() === cleanBook || b.name.toLowerCase().replace(/\s+/g, "") === compactBook
  );

  // 2. Check alias map
  if (!foundBook) {
    const canonicalName = BOOK_ALIASES[cleanBook] || BOOK_ALIASES[compactBook];
    if (canonicalName) {
      foundBook = allBooks.find((b) => b.name.toLowerCase() === canonicalName.toLowerCase());
    }
  }

  // 3. Check prefix match (e.g. "gen" -> "Genesis", "rom" -> "Romans")
  if (!foundBook) {
    foundBook = allBooks.find(
      (b) =>
        b.name.toLowerCase().startsWith(cleanBook) ||
        b.name.toLowerCase().replace(/\s+/g, "").startsWith(compactBook)
    );
  }

  if (!foundBook) return null;

  let formattedRef = `${foundBook.name} ${chapter}`;
  if (verse) {
    formattedRef += `:${verse}`;
    if (endVerse) {
      formattedRef += `-${endVerse}`;
    }
  }

  return {
    bookId: foundBook.id,
    bookName: foundBook.name,
    chapter,
    verse,
    endVerse,
    formattedRef,
  };
}
