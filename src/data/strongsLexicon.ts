export interface StrongsEntry {
  strongId: string; // e.g. "G26" or "H7965"
  language: "Greek" | "Hebrew";
  original: string; // Original script (e.g. ἀγάπη or שָׁלוֹם)
  transliteration: string; // e.g. "agápē" or "shālôm"
  pronunciation: string; // e.g. "ah-GAH-pay"
  partOfSpeech: string;
  definition: string;
  usageNotes: string;
  keyPassages: string[];
}

export const STRONGS_LEXICON: Record<string, StrongsEntry> = {
  // GREEK ENTRIES (New Testament)
  G26: {
    strongId: "G26",
    language: "Greek",
    original: "ἀγάπη",
    transliteration: "agápē",
    pronunciation: "ah-GAH-pay",
    partOfSpeech: "Noun, Feminine",
    definition: "Unconditional, sacrificial, benevolent love; the highest form of love characterized by self-giving devotion.",
    usageNotes: "Used predominantly in the New Testament to describe God's willful, covenantal love towards humanity and the love believers are commanded to have for one another (1 Cor 13, 1 John 4:8).",
    keyPassages: ["John 3:16", "1 Corinthians 13:4", "Romans 5:8", "1 John 4:8", "Galatians 5:22"],
  },
  G3056: {
    strongId: "G3056",
    language: "Greek",
    original: "λόγος",
    transliteration: "lógos",
    pronunciation: "LAH-goss",
    partOfSpeech: "Noun, Masculine",
    definition: "A word, speech, matter, or reason; in Johannine theology, the Divine Expression, Wisdom, and Incarnate Son of God.",
    usageNotes: "In John 1:1, Logos denotes the eternal second person of the Trinity through whom all things were created and who took on human flesh.",
    keyPassages: ["John 1:1", "John 1:14", "1 John 1:1", "Hebrews 4:12", "Revelation 19:13"],
  },
  G5485: {
    strongId: "G5485",
    language: "Greek",
    original: "χάρις",
    transliteration: "cháris",
    pronunciation: "KHAH-reece",
    partOfSpeech: "Noun, Feminine",
    definition: "Grace, unmerited divine favor, goodwill, loving-kindness, spiritual blessing.",
    usageNotes: "The generous, undeserved favor of God bestowed upon sinners through Jesus Christ, providing salvation and enabling holy living (Eph 2:8, Titus 2:11).",
    keyPassages: ["Ephesians 2:8", "Romans 3:24", "2 Corinthians 12:9", "John 1:16", "Titus 2:11"],
  },
  G4102: {
    strongId: "G4102",
    language: "Greek",
    original: "πίστις",
    transliteration: "pístis",
    pronunciation: "PEES-tis",
    partOfSpeech: "Noun, Feminine",
    definition: "Faith, trust, firm persuasion, belief, conviction of truth and reliance on God.",
    usageNotes: "Not mere intellectual assent, but active surrender and unwavering confidence in God's promises and Christ's finished work (Heb 11:1, Rom 1:17).",
    keyPassages: ["Hebrews 11:1", "Romans 1:17", "Ephesians 2:8", "Galatians 2:20", "James 2:17"],
  },
  G4151: {
    strongId: "G4151",
    language: "Greek",
    original: "πνεῦμα",
    transliteration: "pneûma",
    pronunciation: "PNEV-mah",
    partOfSpeech: "Noun, Neuter",
    definition: "Wind, breath, spirit; the Holy Spirit; the immaterial human spirit or soul.",
    usageNotes: "Used for the Third Person of the Trinity (Holy Spirit) who indwells believers, gives spiritual gifts, and guides into all truth (John 14:26).",
    keyPassages: ["John 3:8", "Romans 8:16", "Galatians 5:16", "Acts 1:8", "1 Corinthians 2:10"],
  },
  G2222: {
    strongId: "G2222",
    language: "Greek",
    original: "ζωή",
    transliteration: "zōē",
    pronunciation: "zoh-AY",
    partOfSpeech: "Noun, Feminine",
    definition: "Life, both physical life and the transcendent, eternal, divine life of God (Zoe).",
    usageNotes: "The namesake of this app ('Zoe'). Used by Jesus in John 10:10 ('I came that they may have life, and have it abundantly') and throughout the Gospel of John for eternal life.",
    keyPassages: ["John 10:10", "John 14:6", "John 3:16", "1 John 5:12", "Romans 6:23"],
  },
  G1515: {
    strongId: "G1515",
    language: "Greek",
    original: "εἰρήνη",
    transliteration: "eirḗnē",
    pronunciation: "ay-RAY-nay",
    partOfSpeech: "Noun, Feminine",
    definition: "Peace, tranquility, harmony, wholeness; freedom from strife and spiritual rest in God.",
    usageNotes: "The Greek equivalent of the Hebrew concept of Shalom. Represents objective peace with God through justification (Rom 5:1) and subjective peace of heart (Phil 4:7).",
    keyPassages: ["Philippians 4:7", "John 14:27", "Romans 5:1", "Colossians 3:15", "Matthew 5:9"],
  },

  // HEBREW ENTRIES (Old Testament)
  H7965: {
    strongId: "H7965",
    language: "Hebrew",
    original: "שָׁלוֹם",
    transliteration: "shālôm",
    pronunciation: "shah-LOME",
    partOfSpeech: "Noun, Masculine",
    definition: "Completeness, soundness, welfare, health, prosperity, peace, quietness.",
    usageNotes: "Signifies more than the absence of conflict; it denotes holistic flourishing, reconciliation with God, and harmonious wholeness in all relationships.",
    keyPassages: ["Numbers 6:26", "Isaiah 9:6", "Jeremiah 29:11", "Psalm 29:11", "Isaiah 26:3"],
  },
  H1254: {
    strongId: "H1254",
    language: "Hebrew",
    original: "בָּרָא",
    transliteration: "bārā’",
    pronunciation: "bah-RAH",
    partOfSpeech: "Verb",
    definition: "To create, shape, form; used exclusively in the Hebrew Bible with God as the subject (creatio ex nihilo).",
    usageNotes: "Only God is ever the subject of this verb in scripture, emphasizing that divine creation brings into existence what did not previously exist (Genesis 1:1, Psalm 51:10).",
    keyPassages: ["Genesis 1:1", "Genesis 1:27", "Psalm 51:10", "Isaiah 40:28", "Isaiah 45:18"],
  },
  H2617: {
    strongId: "H2617",
    language: "Hebrew",
    original: "חֶסֶד",
    transliteration: "ḥesed",
    pronunciation: "KHEH-sed",
    partOfSpeech: "Noun, Masculine",
    definition: "Covenant loyalty, unfailing steadfast love, mercy, kindness, devotion, grace.",
    usageNotes: "One of the most foundational Old Testament theological terms describing Yahweh’s unbreakable faithfulness to His covenant promises (Exodus 34:6, Psalm 136).",
    keyPassages: ["Exodus 34:6", "Psalm 136:1", "Lamentations 3:22", "Micah 6:8", "Hosea 6:6"],
  },
  H6918: {
    strongId: "H6918",
    language: "Hebrew",
    original: "קָדוֹשׁ",
    transliteration: "qādôsh",
    pronunciation: "kah-DOSH",
    partOfSpeech: "Adjective",
    definition: "Holy, sacred, set apart, transcendent, consecrated to God.",
    usageNotes: "Depicts God's absolute moral purity and utter otherness above creation. The angels proclaim 'Holy, Holy, Holy' in Isaiah 6:3.",
    keyPassages: ["Isaiah 6:3", "Leviticus 19:2", "Psalm 99:9", "Habakkuk 1:13", "1 Samuel 2:2"],
  },
  H3374: {
    strongId: "H3374",
    language: "Hebrew",
    original: "יִרְאָה",
    transliteration: "yir’āh",
    pronunciation: "yeer-AH",
    partOfSpeech: "Noun, Feminine",
    definition: "Fear, reverence, awe, worshipful respect of God.",
    usageNotes: "The biblical 'fear of the LORD' is not terror, but profound humble reverence and awe before the Creator that forms the foundation of all true wisdom (Proverbs 1:7, 9:10).",
    keyPassages: ["Proverbs 1:7", "Proverbs 9:10", "Psalm 111:10", "Job 28:28", "Ecclesiastes 12:13"],
  },
};

// Map keywords in verse text to relevant Strong's lexicon entries
export function findStrongsForVerse(verseText: string): StrongsEntry[] {
  const lower = verseText.toLowerCase();
  const results: StrongsEntry[] = [];
  const addedIds = new Set<string>();

  const check = (keywords: string[], id: string) => {
    if (addedIds.has(id)) return;
    if (keywords.some((k) => lower.includes(k))) {
      const entry = STRONGS_LEXICON[id];
      if (entry) {
        results.push(entry);
        addedIds.add(id);
      }
    }
  };

  check(["love", "loved", "beloved"], "G26");
  check(["word", "saying", "logos"], "G3056");
  check(["grace", "gracious", "favor"], "G5485");
  check(["faith", "faithful", "believe", "believed", "believeth"], "G4102");
  check(["spirit", "ghost", "breath", "wind"], "G4151");
  check(["life", "alive", "living", "eternal life"], "G2222");
  check(["peace", "peacemaker"], "G1515");
  check(["peace", "shalom", "welfare"], "H7965");
  check(["create", "created", "creation", "beginning"], "H1254");
  check(["steadfast", "mercy", "lovingkindness", "faithful love"], "H2617");
  check(["holy", "holiness", "sanctuary", "set apart"], "H6918");
  check(["fear of the lord", "reverence", "awe", "fear"], "H3374");

  return results;
}
