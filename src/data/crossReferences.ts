export interface CrossReference {
  toBookId: number;
  toBookName: string;
  toChapter: number;
  toVerse: number;
  toEndVerse?: number;
  label?: string;
}

// Canonical cross-reference mappings for major theological passages and verses
// Key format: `${bookId}:${chapter}:${verse}`
export const CROSS_REFERENCES: Record<string, CrossReference[]> = {
  // Genesis 1:1 - "In the beginning God created the heavens and the earth"
  "1:1:1": [
    { toBookId: 43, toBookName: "John", toChapter: 1, toVerse: 1, toEndVerse: 3, label: "The Word at Creation" },
    { toBookId: 51, toBookName: "Colossians", toChapter: 1, toVerse: 16, toEndVerse: 17, label: "All things created through Him" },
    { toBookId: 58, toBookName: "Hebrews", toChapter: 11, toVerse: 3, label: "Framed by the Word of God" },
    { toBookId: 19, toBookName: "Psalms", toChapter: 33, toVerse: 6, label: "By the word of the LORD" },
    { toBookId: 66, toBookName: "Revelation", toChapter: 4, toVerse: 11, label: "Created all things" },
  ],

  // Genesis 1:26 - "Let Us make man in Our image..."
  "1:1:26": [
    { toBookId: 1, toBookName: "Genesis", toChapter: 9, toVerse: 6, label: "In the image of God" },
    { toBookId: 51, toBookName: "Colossians", toChapter: 3, toVerse: 10, label: "Renewed in knowledge" },
    { toBookId: 49, toBookName: "Ephesians", toChapter: 4, toVerse: 24, label: "Created to be like God" },
    { toBookId: 19, toBookName: "Psalms", toChapter: 8, toVerse: 5, toEndVerse: 8, label: "Crowned with glory and honor" },
  ],

  // Genesis 3:15 - "Protoevangelium (He will crush your head...)"
  "1:3:15": [
    { toBookId: 48, toBookName: "Galatians", toChapter: 4, toVerse: 4, label: "Born of a woman" },
    { toBookId: 45, toBookName: "Romans", toChapter: 16, toVerse: 20, label: "Crush Satan under your feet" },
    { toBookId: 62, toBookName: "1 John", toChapter: 3, toVerse: 8, label: "Destroy the works of the devil" },
    { toBookId: 58, toBookName: "Hebrews", toChapter: 2, toVerse: 14, label: "Destroy him holding power of death" },
    { toBookId: 66, toBookName: "Revelation", toChapter: 12, toVerse: 9, label: "The ancient serpent defeated" },
  ],

  // Genesis 12:3 - "In you all the families of the earth will be blessed"
  "1:12:3": [
    { toBookId: 48, toBookName: "Galatians", toChapter: 3, toVerse: 8, label: "Scripture foresaw Gospel to Gentiles" },
    { toBookId: 44, toBookName: "Acts", toChapter: 3, toVerse: 25, label: "In your offspring all families blessed" },
    { toBookId: 45, toBookName: "Romans", toChapter: 4, toVerse: 13, label: "Heir of the world" },
  ],

  // Psalm 23:1 - "The LORD is my shepherd; I shall not want."
  "19:23:1": [
    { toBookId: 43, toBookName: "John", toChapter: 10, toVerse: 11, label: "I am the good shepherd" },
    { toBookId: 58, toBookName: "Hebrews", toChapter: 13, toVerse: 20, label: "Great Shepherd of the sheep" },
    { toBookId: 60, toBookName: "1 Peter", toChapter: 2, toVerse: 25, label: "Shepherd and Overseer of your souls" },
    { toBookId: 66, toBookName: "Revelation", toChapter: 7, toVerse: 17, label: "The Lamb will shepherd them" },
    { toBookId: 23, toBookName: "Isaiah", toChapter: 40, toVerse: 11, label: "Tending His flock like a shepherd" },
  ],

  // Psalm 23:4 - "Even though I walk through the valley of the shadow of death..."
  "19:23:4": [
    { toBookId: 19, toBookName: "Psalms", toChapter: 27, toVerse: 1, label: "The LORD is my light and salvation" },
    { toBookId: 23, toBookName: "Isaiah", toChapter: 43, toVerse: 2, label: "When you pass through the waters" },
    { toBookId: 45, toBookName: "Romans", toChapter: 8, toVerse: 38, toEndVerse: 39, label: "Neither death nor life can separate" },
  ],

  // Isaiah 53:5 - "He was pierced for our transgressions, He was crushed for our iniquities..."
  "23:53:5": [
    { toBookId: 60, toBookName: "1 Peter", toChapter: 2, toVerse: 24, label: "By His wounds you have been healed" },
    { toBookId: 45, toBookName: "Romans", toChapter: 4, toVerse: 25, label: "Delivered over for our trespasses" },
    { toBookId: 46, toBookName: "1 Corinthians", toChapter: 15, toVerse: 3, label: "Christ died for our sins" },
    { toBookId: 58, toBookName: "Hebrews", toChapter: 9, toVerse: 28, label: "Offered once to bear sins of many" },
  ],

  // Matthew 6:33 - "Seek first the kingdom of God and His righteousness..."
  "40:6:33": [
    { toBookId: 42, toBookName: "Luke", toChapter: 12, toVerse: 31, label: "Seek His kingdom" },
    { toBookId: 19, toBookName: "Psalms", toChapter: 37, toVerse: 4, label: "Delight yourself in the LORD" },
    { toBookId: 45, toBookName: "Romans", toChapter: 14, toVerse: 17, label: "The kingdom of God is righteousness" },
    { toBookId: 50, toBookName: "Philippians", toChapter: 4, toVerse: 19, label: "God will supply every need" },
  ],

  // Matthew 28:19 - "Go therefore and make disciples of all nations..."
  "40:28:19": [
    { toBookId: 41, toBookName: "Mark", toChapter: 16, toVerse: 15, label: "Preach the gospel to all creation" },
    { toBookId: 42, toBookName: "Luke", toChapter: 24, toVerse: 47, label: "Repentance preached to all nations" },
    { toBookId: 44, toBookName: "Acts", toChapter: 1, toVerse: 8, label: "You will be My witnesses" },
  ],

  // John 1:1 - "In the beginning was the Word..."
  "43:1:1": [
    { toBookId: 1, toBookName: "Genesis", toChapter: 1, toVerse: 1, label: "In the beginning God created" },
    { toBookId: 62, toBookName: "1 John", toChapter: 1, toVerse: 1, label: "That which was from the beginning" },
    { toBookId: 51, toBookName: "Colossians", toChapter: 1, toVerse: 17, label: "He is before all things" },
    { toBookId: 66, toBookName: "Revelation", toChapter: 19, toVerse: 13, label: "His name is the Word of God" },
  ],

  // John 1:14 - "The Word became flesh and made His dwelling among us..."
  "43:1:14": [
    { toBookId: 45, toBookName: "Romans", toChapter: 1, toVerse: 3, label: "Born of the seed of David" },
    { toBookId: 48, toBookName: "Galatians", toChapter: 4, toVerse: 4, label: "God sent His Son, born of a woman" },
    { toBookId: 50, toBookName: "Philippians", toChapter: 2, toVerse: 6, toEndVerse: 8, label: "Taking the form of a servant" },
    { toBookId: 58, toBookName: "Hebrews", toChapter: 2, toVerse: 14, label: "Shared in human flesh and blood" },
    { toBookId: 62, toBookName: "1 John", toChapter: 4, toVerse: 2, label: "Jesus Christ has come in the flesh" },
  ],

  // John 3:16 - "For God so loved the world that He gave His one and only Son..."
  "43:3:16": [
    { toBookId: 45, toBookName: "Romans", toChapter: 5, toVerse: 8, label: "God proves His love in Christ" },
    { toBookId: 62, toBookName: "1 John", toChapter: 4, toVerse: 9, toEndVerse: 10, label: "God sent His only Son into the world" },
    { toBookId: 49, toBookName: "Ephesians", toChapter: 2, toVerse: 4, toEndVerse: 5, label: "Because of His great love for us" },
    { toBookId: 45, toBookName: "Romans", toChapter: 8, toVerse: 32, label: "Did not spare His own Son" },
    { toBookId: 43, toBookName: "John", toChapter: 1, toVerse: 12, label: "Right to become children of God" },
  ],

  // John 14:6 - "I am the way and the truth and the life..."
  "43:14:6": [
    { toBookId: 44, toBookName: "Acts", toChapter: 4, toVerse: 12, label: "No other name under heaven" },
    { toBookId: 54, toBookName: "1 Timothy", toChapter: 2, toVerse: 5, label: "One mediator between God and men" },
    { toBookId: 58, toBookName: "Hebrews", toChapter: 10, toVerse: 19, toEndVerse: 20, label: "A new and living way" },
    { toBookId: 49, toBookName: "Ephesians", toChapter: 2, toVerse: 18, label: "Access to the Father in one Spirit" },
  ],

  // Romans 8:28 - "And we know that in all things God works for the good of those who love Him..."
  "45:8:28": [
    { toBookId: 1, toBookName: "Genesis", toChapter: 50, toVerse: 20, label: "God meant it for good" },
    { toBookId: 24, toBookName: "Jeremiah", toChapter: 29, toVerse: 11, label: "Plans to prosper and not to harm" },
    { toBookId: 49, toBookName: "Ephesians", toChapter: 1, toVerse: 11, label: "Predestined according to His plan" },
    { toBookId: 45, toBookName: "Romans", toChapter: 8, toVerse: 29, toEndVerse: 30, label: "Conformed to the image of His Son" },
  ],

  // Romans 8:38-39 - "For I am convinced that neither death nor life..."
  "45:8:38": [
    { toBookId: 49, toBookName: "Ephesians", toChapter: 3, toVerse: 18, toEndVerse: 19, label: "The breadth, length, height and depth" },
    { toBookId: 43, toBookName: "John", toChapter: 10, toVerse: 28, label: "No one can snatch them from My hand" },
    { toBookId: 51, toBookName: "Colossians", toChapter: 3, toVerse: 3, label: "Life hidden with Christ in God" },
  ],

  // Romans 12:2 - "Do not be conformed to this world, but be transformed by the renewing of your mind..."
  "45:12:2": [
    { toBookId: 49, toBookName: "Ephesians", toChapter: 4, toVerse: 23, label: "Renewed in the spirit of your mind" },
    { toBookId: 51, toBookName: "Colossians", toChapter: 3, toVerse: 10, label: "Put on the new self" },
    { toBookId: 60, toBookName: "1 Peter", toChapter: 1, toVerse: 14, label: "Do not conform to evil desires" },
    { toBookId: 62, toBookName: "1 John", toChapter: 2, toVerse: 15, label: "Do not love the world" },
  ],

  // 1 Corinthians 13:4 - "Love is patient, love is kind..."
  "46:13:4": [
    { toBookId: 48, toBookName: "Galatians", toChapter: 5, toVerse: 22, label: "The fruit of the Spirit is love" },
    { toBookId: 51, toBookName: "Colossians", toChapter: 3, toVerse: 12, toEndVerse: 14, label: "Clothe yourselves with love" },
    { toBookId: 49, toBookName: "Ephesians", toChapter: 4, toVerse: 2, label: "Bearing with one another in love" },
    { toBookId: 62, toBookName: "1 John", toChapter: 4, toVerse: 7, toEndVerse: 8, label: "Love comes from God" },
  ],

  // Galatians 5:22 - "The fruit of the Spirit is love, joy, peace, patience..."
  "48:5:22": [
    { toBookId: 49, toBookName: "Ephesians", toChapter: 5, toVerse: 9, label: "Fruit of the light" },
    { toBookId: 51, toBookName: "Colossians", toChapter: 3, toVerse: 12, label: "Compassion, kindness, humility" },
    { toBookId: 61, toBookName: "2 Peter", toChapter: 1, toVerse: 5, toEndVerse: 8, label: "Supplementing faith with virtue" },
    { toBookId: 43, toBookName: "John", toChapter: 15, toVerse: 5, label: "He who abides in Me bears much fruit" },
  ],

  // Ephesians 2:8 - "For by grace you have been saved through faith..."
  "49:2:8": [
    { toBookId: 45, toBookName: "Romans", toChapter: 3, toVerse: 24, label: "Justified freely by His grace" },
    { toBookId: 56, toBookName: "Titus", toChapter: 3, toVerse: 5, label: "Saved not by righteous deeds" },
    { toBookId: 55, toBookName: "2 Timothy", toChapter: 1, toVerse: 9, label: "Saved according to His purpose and grace" },
    { toBookId: 48, toBookName: "Galatians", toChapter: 2, toVerse: 16, label: "Justified by faith in Christ" },
  ],

  // Philippians 4:6 - "Do not be anxious about anything, but in everything by prayer..."
  "50:4:6": [
    { toBookId: 60, toBookName: "1 Peter", toChapter: 5, toVerse: 7, label: "Cast all your anxiety on Him" },
    { toBookId: 40, toBookName: "Matthew", toChapter: 6, toVerse: 25, toEndVerse: 34, label: "Do not worry about tomorrow" },
    { toBookId: 19, toBookName: "Psalms", toChapter: 55, toVerse: 22, label: "Cast your burden upon the LORD" },
  ],

  // Philippians 4:13 - "I can do all things through Christ who strengthens me."
  "50:4:13": [
    { toBookId: 47, toBookName: "2 Corinthians", toChapter: 12, toVerse: 9, toEndVerse: 10, label: "My grace is sufficient for you" },
    { toBookId: 49, toBookName: "Ephesians", toChapter: 3, toVerse: 16, label: "Strengthened with power in inner man" },
    { toBookId: 43, toBookName: "John", toChapter: 15, toVerse: 5, label: "Apart from Me you can do nothing" },
  ],

  // Hebrews 11:1 - "Now faith is the assurance of what we hope for and the certainty of what we do not see."
  "58:11:1": [
    { toBookId: 45, toBookName: "Romans", toChapter: 8, toVerse: 24, toEndVerse: 25, label: "Hope that is seen is no hope" },
    { toBookId: 47, toBookName: "2 Corinthians", toChapter: 4, toVerse: 18, label: "Fix our eyes on the unseen" },
    { toBookId: 47, toBookName: "2 Corinthians", toChapter: 5, toVerse: 7, label: "We walk by faith, not by sight" },
    { toBookId: 60, toBookName: "1 Peter", toChapter: 1, toVerse: 8, label: "Though you have not seen Him, you love Him" },
  ],

  // James 1:22 - "Be doers of the word, and not hearers only, deceiving yourselves."
  "59:1:22": [
    { toBookId: 40, toBookName: "Matthew", toChapter: 7, toVerse: 24, toEndVerse: 27, label: "Wise man building on rock" },
    { toBookId: 45, toBookName: "Romans", toChapter: 2, toVerse: 13, label: "Doers of the law will be justified" },
    { toBookId: 42, toBookName: "Luke", toChapter: 11, toVerse: 28, label: "Blessed are those who hear and obey" },
  ],

  // 1 John 1:9 - "If we confess our sins, He is faithful and just to forgive us our sins..."
  "62:1:9": [
    { toBookId: 20, toBookName: "Proverbs", toChapter: 28, toVerse: 13, label: "He who conceals sins will not prosper" },
    { toBookId: 19, toBookName: "Psalms", toChapter: 32, toVerse: 5, label: "I acknowledged my sin to You" },
    { toBookId: 58, toBookName: "Hebrews", toChapter: 9, toVerse: 14, label: "Purify our conscience from dead works" },
  ],

  // Revelation 21:4 - "He will wipe away every tear from their eyes. There will be no more death..."
  "66:21:4": [
    { toBookId: 23, toBookName: "Isaiah", toChapter: 25, toVerse: 8, label: "He will swallow up death forever" },
    { toBookId: 23, toBookName: "Isaiah", toChapter: 35, toVerse: 10, label: "Sorrow and sighing will flee away" },
    { toBookId: 46, toBookName: "1 Corinthians", toChapter: 15, toVerse: 26, label: "The last enemy destroyed is death" },
    { toBookId: 66, toBookName: "Revelation", toChapter: 7, toVerse: 17, label: "God will wipe away every tear" },
  ],
};

export function getVerseCrossReferences(bookId: number, chapter: number, verse: number): CrossReference[] {
  const key = `${bookId}:${chapter}:${verse}`;
  return CROSS_REFERENCES[key] || [];
}
