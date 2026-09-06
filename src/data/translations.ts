export type TranslationId = "BSB" | "KJV" | "WEB";

export interface TranslationMeta {
  id: TranslationId;
  name: string;
  fullName: string;
  year: string;
  license: string;
  description: string;
  sourceUrl: string;
}

export const AVAILABLE_TRANSLATIONS: TranslationMeta[] = [
  {
    id: "BSB",
    name: "BSB",
    fullName: "Berean Standard Bible",
    year: "2023",
    license: "CC0 / Public Domain",
    description: "Modern English translation with high readability and formal equivalence.",
    sourceUrl: "https://berean.bible",
  },
  {
    id: "KJV",
    name: "KJV",
    fullName: "King James Version",
    year: "1611 / 1769",
    license: "Public Domain",
    description: "Classic historic translation renowned for poetic rhythm and traditional phrasing.",
    sourceUrl: "https://github.com/scrollmapper/bible_databases",
  },
  {
    id: "WEB",
    name: "WEB",
    fullName: "World English Bible",
    year: "2000",
    license: "Public Domain",
    description: "Modern, easy-to-read public-domain update of the American Standard Version.",
    sourceUrl: "https://ebible.org/web/",
  },
];

// Curated parallel translations for theological verses & sample chapters
export const PARALLEL_SAMPLE_VERSES: Record<
  string,
  { BSB: string; KJV: string; WEB: string }
> = {
  // Matthew 1:1-5
  "40:1:1": {
    BSB: "This is the record of the genealogy of Jesus Christ, the son of David, the son of Abraham:",
    KJV: "The book of the generation of Jesus Christ, the son of David, the son of Abraham.",
    WEB: "The book of the genealogy of Jesus Christ, the son of David, the son of Abraham.",
  },
  "40:1:2": {
    BSB: "Abraham was the father of Isaac, Isaac the father of Jacob, and Jacob the father of Judah and his brothers.",
    KJV: "Abraham begat Isaac; and Isaac begat Jacob; and Jacob begat Judas and his brethren;",
    WEB: "Abraham became the father of Isaac. Isaac became the father of Jacob. Jacob became the father of Judah and his brothers.",
  },
  "40:1:3": {
    BSB: "Judah was the father of Perez and Zerah by Tamar, Perez the father of Hezron, and Hezron the father of Ram.",
    KJV: "And Judas begat Phares and Zara of Thamar; and Phares begat Esrom; and Esrom begat Aram;",
    WEB: "Judah became the father of Perez and Zerah by Tamar. Perez became the father of Hezron. Hezron became the father of Ram.",
  },
  "40:1:4": {
    BSB: "Ram was the father of Amminadab, Amminadab the father of Nahshon, and Nahshon the father of Salmon.",
    KJV: "And Aram begat Aminadab; and Aminadab begat Naasson; and Naasson begat Salmon;",
    WEB: "Ram became the father of Amminadab. Amminadab became the father of Nahshon. Nahshon became the father of Salmon.",
  },
  "40:1:5": {
    BSB: "Salmon was the father of Boaz by Rahab, Boaz the father of Obed by Ruth, and Obed the father of Jesse.",
    KJV: "And Salmon begat Booz of Rachab; and Booz begat Obed of Ruth; and Obed begat Jesse;",
    WEB: "Salmon became the father of Boaz by Rahab. Boaz became the father of Obed by Ruth. Obed became the father of Jesse.",
  },
  "40:1:21": {
    BSB: "She will give birth to a son, and you are to give Him the name Jesus, because He will save His people from their sins.",
    KJV: "And she shall bring forth a son, and thou shalt call his name JESUS: for he shall save his people from their sins.",
    WEB: "She shall bring forth a son. You shall call his name Jesus, for it is he who shall save his people from their sins.",
  },
  "40:1:23": {
    BSB: "“Behold, the virgin will be with child and will give birth to a son, and they will call Him Immanuel” (which means, “God with us”).",
    KJV: "Behold, a virgin shall be with child, and shall bring forth a son, and they shall call his name Emmanuel, which being interpreted is, God with us.",
    WEB: "“Behold, the virgin shall be with child, and shall bring forth a son. They shall call his name Immanuel,” which is, being interpreted, “God with us.”",
  },

  // Genesis 1:1-3
  "1:1:1": {
    BSB: "In the beginning God created the heavens and the earth.",
    KJV: "In the beginning God created the heaven and the earth.",
    WEB: "In the beginning, God created the heavens and the earth.",
  },
  "1:1:2": {
    BSB: "Now the earth was formless and void, and darkness was over the surface of the deep. And the Spirit of God was hovering over the surface of the waters.",
    KJV: "And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.",
    WEB: "The earth was formless and empty. Darkness was on the surface of the deep and God’s Spirit was hovering over the surface of the waters.",
  },
  "1:1:3": {
    BSB: "And God said, “Let there be light,” and there was light.",
    KJV: "And God said, Let there be light: and there was light.",
    WEB: "God said, “Let there be light,” and there was light.",
  },

  // Psalm 23:1-4
  "19:23:1": {
    BSB: "The LORD is my shepherd; I shall not want.",
    KJV: "The LORD is my shepherd; I shall not want.",
    WEB: "Yahweh is my shepherd: I shall lack nothing.",
  },
  "19:23:2": {
    BSB: "He makes me lie down in green pastures; He leads me beside quiet waters.",
    KJV: "He maketh me to lie down in green pastures: he leadeth me beside the still waters.",
    WEB: "He makes me lie down in green pastures. He leads me beside still waters.",
  },
  "19:23:3": {
    BSB: "He restores my soul; He guides me in the paths of righteousness for the sake of His name.",
    KJV: "He restoreth my soul: he leadeth me in the paths of righteousness for his name’s sake.",
    WEB: "He restores my soul. He guides me in the paths of righteousness for his name’s sake.",
  },
  "19:23:4": {
    BSB: "Even though I walk through the valley of the shadow of death, I will fear no evil, for You are with me; Your rod and Your staff, they comfort me.",
    KJV: "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.",
    WEB: "Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me. Your rod and your staff, they comfort me.",
  },

  // Proverbs 3:5-6
  "20:3:5": {
    BSB: "Trust in the LORD with all your heart, and lean not on your own understanding;",
    KJV: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.",
    WEB: "Trust in Yahweh with all your heart, and don’t lean on your own understanding.",
  },
  "20:3:6": {
    BSB: "in all your ways acknowledge Him, and He will make your paths straight.",
    KJV: "In all thy ways acknowledge him, and he shall direct thy paths.",
    WEB: "In all your ways acknowledge him, and he will make your paths straight.",
  },

  // Matthew 6:33
  "40:6:33": {
    BSB: "But seek first the kingdom of God and His righteousness, and all these things will be added to you.",
    KJV: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.",
    WEB: "But seek first God’s Kingdom and his righteousness; and all these things will be given to you as well.",
  },

  // John 1:1-3
  "43:1:1": {
    BSB: "In the beginning was the Word, and the Word was with God, and the Word was God.",
    KJV: "In the beginning was the Word, and the Word was with God, and the Word was God.",
    WEB: "In the beginning was the Word, and the Word was with God, and the Word was God.",
  },
  "43:1:2": {
    BSB: "He was with God in the beginning.",
    KJV: "The same was in the beginning with God.",
    WEB: "The same was in the beginning with God.",
  },
  "43:1:3": {
    BSB: "Through Him all things were made, and without Him nothing was made that has been made.",
    KJV: "All things were made by him; and without him was not any thing made that was made.",
    WEB: "All things were made through him. Without him, nothing was made that has been made.",
  },

  // John 3:16
  "43:3:16": {
    BSB: "For God so loved the world that He gave His one and only Son, that everyone who believes in Him shall not perish but have eternal life.",
    KJV: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
    WEB: "For God so loved the world, that he gave his one and only Son, that whoever believes in him should not perish, but have eternal life.",
  },

  // Romans 8:28
  "45:8:28": {
    BSB: "And we know that in all things God works for the good of those who love Him, who have been called according to His purpose.",
    KJV: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
    WEB: "We know that all things work together for good for those who love God, to those who are called according to his purpose.",
  },

  // 1 Corinthians 13:4
  "46:13:4": {
    BSB: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.",
    KJV: "Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up,",
    WEB: "Love is patient and is kind; love doesn’t envy. Love doesn’t brag, is not proud,",
  },

  // Philippians 4:13
  "50:4:13": {
    BSB: "I can do all things through Christ who gives me strength.",
    KJV: "I can do all things through Christ which strengtheneth me.",
    WEB: "I can do all things through Christ, who strengthens me.",
  },

  // Revelation 21:4
  "66:21:4": {
    BSB: "He will wipe away every tear from their eyes. There will be no more death or mourning or crying or pain, for the old order of things has passed away.",
    KJV: "And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away.",
    WEB: "He will wipe away every tear from their eyes. Death will be no more; neither will there be mourning, nor crying, nor pain, any more. The first things have passed away.",
  },
};

export function getComparativeTranslations(
  bookId: number,
  chapter: number,
  verse: number,
  defaultText: string
): { BSB: string; KJV: string; WEB: string } {
  const key = `${bookId}:${chapter}:${verse}`;
  const found = PARALLEL_SAMPLE_VERSES[key];
  if (found) return found;

  return {
    BSB: defaultText,
    KJV: defaultText,
    WEB: defaultText,
  };
}

export function resolveVerseTranslation(
  bookId: number,
  chapter: number,
  verse: number,
  defaultText: string,
  translationId: TranslationId = "BSB"
): string {
  if (translationId === "BSB") return defaultText;
  const key = `${bookId}:${chapter}:${verse}`;
  const found = PARALLEL_SAMPLE_VERSES[key];
  if (found && found[translationId]) {
    return found[translationId];
  }
  return defaultText;
}
