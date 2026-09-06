import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AppColors } from "../../constants/theme";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useDatabase } from "../../src/db";
import {
  Book,
  ChapterVerse,
  getBooks,
  getChapter,
  getChapterCount,
  getVerse,
  searchVerses,
} from "../../src/db/queries";
import { useUserDatabase } from "../../src/db/UserDatabaseContext";
import {
  addBookmark,
  addNote,
  deleteSavedSession,
  getSavedSessions,
  saveSession,
  updateSavedSession,
} from "../../src/db/userDb";
import { parseBibleReference } from "../../src/utils/referenceParser";

const SESSION_TYPES = ["Sermon", "Bible Study", "SOAP", "HEAR", "Personal", "Other"] as const;
type SessionType = (typeof SESSION_TYPES)[number];

const POPULAR_PEEK_BOOKS = [
  { id: 40, name: "Matthew" },
  { id: 43, name: "John" },
  { id: 45, name: "Romans" },
  { id: 19, name: "Psalms" },
  { id: 20, name: "Proverbs" },
  { id: 1, name: "Genesis" },
  { id: 49, name: "Ephesians" },
  { id: 58, name: "Hebrews" },
  { id: 59, name: "James" },
  { id: 66, name: "Revelation" },
];

export interface SessionDocument {
  id: string;
  dbId?: number;
  topic: string;
  speaker: string;
  sessionType: SessionType;
  date: string;
  body: string;
  elapsedSeconds: number;
}

export interface SavedSessionRow {
  id: number;
  topic: string;
  speaker: string;
  session_type: string;
  date: string;
  notes: string;
  created_at: string;
}

const DRAFT_KEY = "zoe_active_session_draft_v2";

export default function SessionScreen() {
  const db = useDatabase();
  const userDb = useUserDatabase();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  // Mode: "home" | "active" | "view"
  const [mode, setMode] = useState<"home" | "active" | "view">("home");
  const [savedSessions, setSavedSessions] = useState<SavedSessionRow[]>([]);
  const [savedFilter, setSavedFilter] = useState<string>("All");
  const [searchFilter, setSearchFilter] = useState("");
  const [activeDraft, setActiveDraft] = useState<SessionDocument | null>(null);

  // Active Notebook Document State
  const [docId, setDocId] = useState<string>("");
  const [docDbId, setDocDbId] = useState<number | undefined>(undefined);
  const [docTopic, setDocTopic] = useState("");
  const [docSpeaker, setDocSpeaker] = useState("");
  const [docType, setDocType] = useState<SessionType>("Sermon");
  const [docDate, setDocDate] = useState("");
  const [docBody, setDocBody] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Template Picker Modal
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [formTopic, setFormTopic] = useState("");
  const [formSpeaker, setFormSpeaker] = useState("");
  const [formType, setFormType] = useState<SessionType>("Sermon");

  // Scripture Insertion & Reference Finder Modal
  const [verseModalOpen, setVerseModalOpen] = useState(false);
  const [verseSearchText, setVerseSearchText] = useState("");
  const [verseResults, setVerseResults] = useState<ChapterVerse[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);

  // In-Session Bible Peek State & Advanced Search
  const [biblePeekOpen, setBiblePeekOpen] = useState(false);
  const [peekBookId, setPeekBookId] = useState<number>(40); // Matthew default
  const [peekChapter, setPeekChapter] = useState<number>(1);
  const [peekVerses, setPeekVerses] = useState<ChapterVerse[]>([]);
  const [peekTotalChapters, setPeekTotalChapters] = useState(28);
  const [peekSearchQuery, setPeekSearchQuery] = useState("");
  const [peekSearchResults, setPeekSearchResults] = useState<ChapterVerse[]>([]);
  const [peekParsedRef, setPeekParsedRef] = useState<ChapterVerse | null>(null);
  const [targetVerseNum, setTargetVerseNum] = useState<number | null>(null);
  const [peekToast, setPeekToast] = useState("");

  // Book & Chapter Pickers inside Bible Peek
  const [bookPickerOpen, setBookPickerOpen] = useState(false);
  const [bookFilterText, setBookFilterText] = useState("");
  const [bookTab, setBookTab] = useState<"ALL" | "OT" | "NT" | "GOSPELS" | "WISDOM">("ALL");
  const [chapterPickerOpen, setChapterPickerOpen] = useState(false);

  const peekListRef = useRef<FlatList>(null);
  const bodyInputRef = useRef<TextInput>(null);

  // Load saved sessions & books on screen focus
  const loadSessions = useCallback(async () => {
    const rows = await getSavedSessions(userDb);
    setSavedSessions(rows);
    const draftJson = await AsyncStorage.getItem(DRAFT_KEY);
    if (draftJson) {
      try {
        setActiveDraft(JSON.parse(draftJson));
      } catch {}
    } else {
      setActiveDraft(null);
    }
  }, [userDb]);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
      getBooks(db).then(setAllBooks);
    }, [loadSessions, db])
  );

  // Live Timer during active session
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (mode === "active") {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode]);

  // Continuous Auto-Save Draft on every keystroke
  useEffect(() => {
    if (mode === "active" && (docTopic.trim() || docBody.trim())) {
      const draft: SessionDocument = {
        id: docId || `draft_${Date.now()}`,
        dbId: docDbId,
        topic: docTopic,
        speaker: docSpeaker,
        sessionType: docType,
        date: docDate,
        body: docBody,
        elapsedSeconds: timerSeconds,
      };
      AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [docTopic, docSpeaker, docType, docDate, docBody, timerSeconds, mode, docId, docDbId]);

  // Load Bible Peek chapter
  useEffect(() => {
    if (biblePeekOpen) {
      getChapter(db, peekBookId, peekChapter).then(setPeekVerses);
      getChapterCount(db, peekBookId).then(setPeekTotalChapters);
    }
  }, [biblePeekOpen, peekBookId, peekChapter, db]);

  // Auto-scroll to target verse in Peek mode
  useEffect(() => {
    if (targetVerseNum && peekVerses.length > 0) {
      const idx = peekVerses.findIndex((v) => v.verse === targetVerseNum);
      if (idx >= 0) {
        setTimeout(() => {
          try {
            peekListRef.current?.scrollToIndex({ index: Math.max(0, idx), animated: true, viewPosition: 0.1 });
          } catch {}
        }, 300);
      }
    }
  }, [peekVerses, targetVerseNum]);

  // Current Peek Book
  const currentBook = allBooks.find((b) => b.id === peekBookId) || { id: 40, name: "Matthew" };

  // Filtered books for Bible Peek Book Selector Modal
  const filteredBooksForPicker = allBooks.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(bookFilterText.toLowerCase().trim());
    if (!matchesSearch) return false;
    if (bookTab === "OT") return b.id <= 39;
    if (bookTab === "NT") return b.id > 39;
    if (bookTab === "GOSPELS") return b.id >= 40 && b.id <= 43;
    if (bookTab === "WISDOM") return b.id >= 18 && b.id <= 22;
    return true;
  });

  // Advanced Live Search in Bible Peek
  const handlePeekSearch = async (text: string) => {
    setPeekSearchQuery(text);
    if (!text.trim() || text.trim().length < 2) {
      setPeekSearchResults([]);
      setPeekParsedRef(null);
      return;
    }

    const trimmed = text.trim();
    const parsed = parseBibleReference(trimmed, allBooks);
    if (parsed) {
      if (parsed.verse) {
        const directVerse = await getVerse(db, parsed.bookId, parsed.chapter, parsed.verse);
        if (directVerse) {
          setPeekParsedRef(directVerse);
          setPeekSearchResults([]);
          return;
        }
      } else {
        const chVerses = await getChapter(db, parsed.bookId, parsed.chapter);
        if (chVerses && chVerses.length > 0) {
          setPeekParsedRef(chVerses[0]);
          setPeekSearchResults([]);
          return;
        }
      }
    }

    setPeekParsedRef(null);
    const results = await searchVerses(db, trimmed, 12);
    setPeekSearchResults(results);
  };

  // Jump to specific book, chapter, and optional verse
  const jumpToPeekPassage = (bookId: number, chapter: number, verseNum?: number) => {
    setPeekBookId(bookId);
    setPeekChapter(chapter);
    setTargetVerseNum(verseNum ?? null);
    setPeekSearchQuery("");
    setPeekSearchResults([]);
    setPeekParsedRef(null);
    setBookPickerOpen(false);
    setChapterPickerOpen(false);
  };

  // Insert verse from Peek into note with feedback
  const insertVerseFromPeek = (v: ChapterVerse, keepOpen = false) => {
    const scriptureText = `📌 ${v.book_name} ${v.chapter}:${v.verse}\n"${v.text}"`;
    appendSnippet(scriptureText);
    setPeekToast(`Added ${v.book_name} ${v.chapter}:${v.verse} ✓`);
    setTimeout(() => setPeekToast(""), 2000);
    if (!keepOpen) {
      setBiblePeekOpen(false);
    }
  };

  // Format Elapsed Time (MM:SS or HH:MM:SS)
  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? "0" : ""}${mins}:${s < 10 ? "0" : ""}${s}`;
    }
    return `${mins < 10 ? "0" : ""}${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  // Launch a new session
  const startNewSession = (template: "sermon" | "soap" | "hear" | "blank") => {
    let initialBody = "";
    let initialTopic = "";
    let initialType: SessionType = "Sermon";

    if (template === "sermon") {
      initialType = "Sermon";
      initialBody =
        "Main Scripture:\n\n" +
        "Point 1:\n• \n\n" +
        "Point 2:\n• \n\n" +
        "Point 3:\n• \n\n" +
        "Key Takeaway:\n💡 \n\n" +
        "Personal Application:\n🙏 ";
    } else if (template === "soap") {
      initialType = "SOAP";
      initialTopic = "S.O.A.P. Devotional";
      initialBody =
        "📖 S - SCRIPTURE:\n\n" +
        "🔍 O - OBSERVATION:\nWhat is God saying in this passage?\n\n" +
        "💡 A - APPLICATION:\nHow does this apply to my life today?\n\n" +
        "🙏 P - PRAYER:\nFather, ";
    } else if (template === "hear") {
      initialType = "HEAR";
      initialTopic = "H.E.A.R. Study";
      initialBody =
        "✨ H - HIGHLIGHT:\n\n" +
        "📖 E - EXPLAIN:\nWhat did this mean to the original audience?\n\n" +
        "💡 A - APPLY:\nWhat is the personal lesson for me?\n\n" +
        "🙏 R - RESPOND:\nIn response, I will ";
    } else {
      initialType = "Personal";
      initialBody = "";
    }

    const todayDate = new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    setDocId(`session_${Date.now()}`);
    setDocDbId(undefined);
    setDocTopic(initialTopic);
    setDocSpeaker("");
    setDocType(initialType);
    setDocDate(todayDate);
    setDocBody(initialBody);
    setTimerSeconds(0);
    setTemplateModalVisible(false);
    setMode("active");
  };

  // Resume Draft
  const resumeDraft = () => {
    if (!activeDraft) return;
    setDocId(activeDraft.id);
    setDocDbId(activeDraft.dbId);
    setDocTopic(activeDraft.topic);
    setDocSpeaker(activeDraft.speaker);
    setDocType(activeDraft.sessionType);
    setDocDate(activeDraft.date);
    setDocBody(activeDraft.body);
    setTimerSeconds(activeDraft.elapsedSeconds || 0);
    setMode("active");
  };

  // Discard Draft
  const discardDraft = () => {
    Alert.alert("Discard Draft?", "Are you sure you want to discard this draft?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(DRAFT_KEY);
          setActiveDraft(null);
        },
      },
    ]);
  };

  // Insert text at end or helper
  const appendSnippet = (snippet: string) => {
    setDocBody((prev) => (prev ? prev + "\n\n" + snippet : snippet));
    setTimeout(() => bodyInputRef.current?.focus(), 100);
  };

  // Insert Scripture into Note Body
  const insertVerseIntoNote = (v: ChapterVerse) => {
    const scriptureText = `📌 ${v.book_name} ${v.chapter}:${v.verse}\n"${v.text}"`;
    appendSnippet(scriptureText);
    setVerseModalOpen(false);
    setVerseSearchText("");
    setVerseResults([]);
  };

  // Search Verses for Finder Modal
  const searchVersesForModal = async (q: string) => {
    setVerseSearchText(q);
    if (!q.trim() || q.length < 2) {
      setVerseResults([]);
      return;
    }
    const parsed = parseBibleReference(q.trim(), allBooks);
    if (parsed && parsed.verse) {
      const v = await getVerse(db, parsed.bookId, parsed.chapter, parsed.verse);
      if (v) {
        setVerseResults([v]);
        return;
      }
    }
    const results = await searchVerses(db, q);
    setVerseResults(results.slice(0, 10));
  };

  // Save Session & End
  const handleSaveAndFinish = async () => {
    const finalTopic = docTopic.trim() || "Untitled Study";
    const finalSpeaker = docSpeaker.trim() || "Speaker";

    if (docDbId) {
      await updateSavedSession(userDb, docDbId, {
        topic: finalTopic,
        speaker: finalSpeaker,
        sessionType: docType,
        date: docDate,
        notes: docBody,
      });
    } else {
      await saveSession(userDb, {
        topic: finalTopic,
        speaker: finalSpeaker,
        sessionType: docType,
        date: docDate,
        notes: docBody,
      });
    }

    await AsyncStorage.removeItem(DRAFT_KEY);
    await loadSessions();
    setMode("view");
  };

  // Open Past Saved Session
  const openSavedSession = (row: SavedSessionRow) => {
    let bodyText = "";
    try {
      // Handle legacy block JSON or raw text
      const parsed = JSON.parse(row.notes);
      if (Array.isArray(parsed)) {
        bodyText = parsed
          .map((b: any) =>
            b.type === "verse"
              ? `📌 ${b.verse?.book_name || ""} ${b.verse?.chapter || ""}:${b.verse?.verse || ""}\n"${b.text}"`
              : b.text
          )
          .join("\n\n");
      } else {
        bodyText = row.notes;
      }
    } catch {
      bodyText = row.notes;
    }

    setDocId(row.id.toString());
    setDocDbId(row.id);
    setDocTopic(row.topic);
    setDocSpeaker(row.speaker);
    setDocType((row.session_type as SessionType) || "Sermon");
    setDocDate(row.date);
    setDocBody(bodyText);
    setTimerSeconds(0);
    setMode("view");
  };

  // Delete Saved Session
  const handleDeleteSaved = (id: number) => {
    Alert.alert("Delete Note", "Permanently remove this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteSavedSession(userDb, id);
          await loadSessions();
        },
      },
    ]);
  };

  // Share Formatted Note
  const shareNote = async () => {
    const text = [
      `📝 ${docTopic || "Sermon Notes"}`,
      `🎤 ${docSpeaker || "Speaker"} • 🏷️ ${docType} • 📅 ${docDate}`,
      "───────────────────────",
      "",
      docBody,
      "",
      "— Zoe Bible Notebook",
    ].join("\n");
    await Share.share({ message: text });
  };

  // Filter Saved Sessions
  const filteredSessions = savedSessions.filter((s) => {
    const matchesFilter =
      savedFilter === "All" ||
      s.session_type.toLowerCase() === savedFilter.toLowerCase();
    const matchesSearch =
      !searchFilter.trim() ||
      s.topic.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.speaker.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.notes.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const styles = makeStyles(colors);

  // ═══════════════════════════════════════════════════════
  // 1. HOME SCREEN (Notebook List & Template Starters)
  // ═══════════════════════════════════════════════════════
  if (mode === "home") {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Notebook</Text>
            <Text style={styles.subtitle}>Take sermon notes, SOAP journals & Bible studies</Text>
          </View>

          {/* Active Live Draft Banner */}
          {activeDraft && (
            <View style={styles.draftCard}>
              <View style={styles.draftHeader}>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveBadgeText}>UNSAVED DRAFT</Text>
                </View>
                <Text style={styles.draftTime}>{formatTime(activeDraft.elapsedSeconds || 0)}</Text>
              </View>
              <Text style={styles.draftTopic}>{activeDraft.topic || "Untitled Note"}</Text>
              <Text style={styles.draftSub}>
                {activeDraft.sessionType} • {activeDraft.speaker || "Speaker"} • {activeDraft.date}
              </Text>
              <View style={styles.draftActions}>
                <TouchableOpacity style={styles.resumeBtn} onPress={resumeDraft}>
                  <Ionicons name="create" size={16} color="#fff" />
                  <Text style={styles.resumeBtnText}>Resume Note</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.discardBtn} onPress={discardDraft}>
                  <Ionicons name="trash-outline" size={16} color={colors.muted} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Quick Note Starters */}
          <Text style={styles.sectionHeading}>NEW NOTE</Text>
          <View style={styles.templateGrid}>
            <TouchableOpacity style={styles.templateCard} onPress={() => startNewSession("sermon")}>
              <View style={[styles.templateIconBox, { backgroundColor: "#FF6B3518" }]}>
                <Text style={styles.templateEmoji}>🎙️</Text>
              </View>
              <Text style={styles.templateTitle}>Sermon Note</Text>
              <Text style={styles.templateDesc}>Preacher, main scripture & 3-point outline</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.templateCard} onPress={() => startNewSession("soap")}>
              <View style={[styles.templateIconBox, { backgroundColor: "#06D6A018" }]}>
                <Text style={styles.templateEmoji}>🧼</Text>
              </View>
              <Text style={styles.templateTitle}>S.O.A.P. Devotional</Text>
              <Text style={styles.templateDesc}>Scripture, Observation, Application, Prayer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.templateCard} onPress={() => startNewSession("hear")}>
              <View style={[styles.templateIconBox, { backgroundColor: "#7C3AED18" }]}>
                <Text style={styles.templateEmoji}>👂</Text>
              </View>
              <Text style={styles.templateTitle}>H.E.A.R. Study</Text>
              <Text style={styles.templateDesc}>Highlight, Explain, Apply & Respond</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.templateCard} onPress={() => startNewSession("blank")}>
              <View style={[styles.templateIconBox, { backgroundColor: "#3B82F618" }]}>
                <Text style={styles.templateEmoji}>⚡</Text>
              </View>
              <Text style={styles.templateTitle}>Blank Page</Text>
              <Text style={styles.templateDesc}>Clean lined page with instant scripture links</Text>
            </TouchableOpacity>
          </View>

          {/* Past Notes Header */}
          <Text style={[styles.sectionHeading, { marginTop: 14 }]}>
            PAST NOTES ({filteredSessions.length})
          </Text>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search notes, sermons, scriptures..."
              placeholderTextColor={colors.muted}
              value={searchFilter}
              onChangeText={setSearchFilter}
            />
            {searchFilter.length > 0 && (
              <TouchableOpacity onPress={() => setSearchFilter("")}>
                <Ionicons name="close-circle" size={16} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {["All", "Sermon", "Bible Study", "SOAP", "HEAR", "Personal"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.filterChip, savedFilter === tab && styles.filterChipActive]}
                onPress={() => setSavedFilter(tab)}
              >
                <Text style={[styles.filterChipText, savedFilter === tab && styles.filterChipTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Notes List */}
          {filteredSessions.length === 0 ? (
            <View style={styles.emptyPast}>
              <Text style={styles.emptyPastEmoji}>📝</Text>
              <Text style={styles.emptyPastTitle}>No notes recorded yet</Text>
              <Text style={styles.emptyPastSub}>
                Start a Sermon or SOAP journal above to begin your study notebook.
              </Text>
            </View>
          ) : (
            filteredSessions.map((s) => (
              <TouchableOpacity key={s.id} style={styles.pastCard} onPress={() => openSavedSession(s)}>
                <View style={styles.pastCardTop}>
                  <View style={styles.pastBadge}>
                    <Text style={styles.pastBadgeText}>{s.session_type}</Text>
                  </View>
                  <Text style={styles.pastDate}>{s.date}</Text>
                  <TouchableOpacity onPress={() => handleDeleteSaved(s.id)} style={styles.pastDeleteBtn}>
                    <Ionicons name="trash-outline" size={15} color={colors.muted} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.pastTopic} numberOfLines={1}>{s.topic || "Untitled Note"}</Text>
                {s.speaker ? <Text style={styles.pastSpeaker}>🎤 {s.speaker}</Text> : null}
                <Text style={styles.pastPreview} numberOfLines={2}>
                  {s.notes.replace(/[#*💡🙏📌•]/g, "").trim()}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════
  // 2. ACTIVE NOTEBOOK EDITOR (Real Lined Page!)
  // ═══════════════════════════════════════════════════════
  if (mode === "active") {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.surface} />

        {/* Top Sticky Header */}
        <View style={styles.editorTopBar}>
          <TouchableOpacity onPress={() => setMode("home")} style={styles.editorBackBtn}>
            <Ionicons name="chevron-back" size={20} color="#FF6B35" />
            <Text style={styles.editorBackText}>Notebook</Text>
          </TouchableOpacity>

          <View style={styles.timerBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.timerText}>{formatTime(timerSeconds)}</Text>
          </View>

          <View style={styles.editorTopActions}>
            <TouchableOpacity style={styles.biblePeekBtn} onPress={() => setBiblePeekOpen(true)}>
              <Ionicons name="book-outline" size={16} color="#7C3AED" />
              <Text style={styles.biblePeekBtnText}>Bible</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.doneBtn} onPress={handleSaveAndFinish}>
              <Text style={styles.doneBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Accessory Toolbar */}
        <View style={styles.accessoryBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accessoryScroll}>
            <TouchableOpacity style={styles.toolBtn} onPress={() => setVerseModalOpen(true)}>
              <Ionicons name="bookmark-outline" size={14} color="#7C3AED" />
              <Text style={[styles.toolBtnText, { color: "#7C3AED" }]}>+ Verse</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={() => appendSnippet("Point:\n• ")}>
              <Ionicons name="list-outline" size={14} color={colors.text} />
              <Text style={styles.toolBtnText}>• Bullet Point</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={() => appendSnippet("💡 KEY TAKEAWAY:\n")}>
              <Text style={{ fontSize: 13 }}>💡</Text>
              <Text style={styles.toolBtnText}>Takeaway</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={() => appendSnippet("🙏 PRAYER:\n")}>
              <Text style={{ fontSize: 13 }}>🙏</Text>
              <Text style={styles.toolBtnText}>Prayer</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Continuous Full-Page Lined Notepad Canvas */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.notepadCanvas}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Note Title */}
          <TextInput
            style={styles.noteTitleInput}
            placeholder="Sermon or Study Title..."
            placeholderTextColor={colors.muted}
            value={docTopic}
            onChangeText={setDocTopic}
            multiline={false}
          />

          {/* Meta Info Row */}
          <View style={styles.noteMetaRow}>
            <TextInput
              style={styles.noteSpeakerInput}
              placeholder="Speaker / Teacher (e.g. Pastor John)"
              placeholderTextColor={colors.muted}
              value={docSpeaker}
              onChangeText={setDocSpeaker}
            />
            <View style={styles.noteTypeTag}>
              <Text style={styles.noteTypeTagText}>{docType}</Text>
            </View>
          </View>

          {/* Notebook Paper Divider Line */}
          <View style={styles.paperRuleLine} />

          {/* Main Document Body */}
          <TextInput
            ref={bodyInputRef}
            style={styles.notepadBodyInput}
            placeholder="Start typing your notes here freely... Use '+ Verse' to insert scripture anytime."
            placeholderTextColor={colors.muted}
            value={docBody}
            onChangeText={setDocBody}
            multiline
            scrollEnabled={false}
            textAlignVertical="top"
          />
        </ScrollView>

        {/* Quick Verse Finder Modal */}
        <Modal visible={verseModalOpen} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Insert Scripture</Text>
                <TouchableOpacity onPress={() => setVerseModalOpen(false)}>
                  <Ionicons name="close" size={22} color={colors.muted} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder="Type citation (e.g. John 3:16, Rom 8:28) or words..."
                placeholderTextColor={colors.muted}
                value={verseSearchText}
                onChangeText={searchVersesForModal}
                autoFocus
              />
              <FlatList
                data={verseResults}
                keyExtractor={(item) => item.id.toString()}
                style={{ maxHeight: 320 }}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.verseSearchItem} onPress={() => insertVerseIntoNote(item)}>
                    <Text style={styles.verseSearchItemRef}>
                      {item.book_name} {item.chapter}:{item.verse}
                    </Text>
                    <Text style={styles.verseSearchItemText} numberOfLines={2}>{item.text}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptySearchText}>
                    {verseSearchText.length > 0 ? "No matches found" : "Type a reference like 'John 3:16'"}
                  </Text>
                }
              />
            </View>
          </View>
        </Modal>

        {/* In-Session Bible Peek Sheet */}
        <Modal visible={biblePeekOpen} animationType="slide">
          <View style={[styles.container, { paddingTop: 40 }]}>
            {/* Peek Header */}
            <View style={styles.peekHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.peekTitle}>Bible Peek</Text>
                <Text style={styles.peekSub}>Instant Scripture lookup & 1-tap insert</Text>
              </View>
              <TouchableOpacity onPress={() => setBiblePeekOpen(false)} style={styles.peekCloseBtn}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Quick Toast Feedback */}
            {peekToast.length > 0 && (
              <View style={styles.peekToastBanner}>
                <Ionicons name="checkmark-circle" size={16} color="#06D6A0" />
                <Text style={styles.peekToastText}>{peekToast}</Text>
              </View>
            )}

            {/* Omni-Search & Quick Jump Bar */}
            <View style={styles.peekSearchContainer}>
              <View style={styles.peekSearchBox}>
                <Ionicons name="search" size={18} color={colors.muted} />
                <TextInput
                  style={styles.peekSearchInput}
                  placeholder="Jump to ref (e.g. John 3:16, Rom 8) or search words..."
                  placeholderTextColor={colors.muted}
                  value={peekSearchQuery}
                  onChangeText={handlePeekSearch}
                  autoCorrect={false}
                />
                {peekSearchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setPeekSearchQuery("");
                      setPeekSearchResults([]);
                      setPeekParsedRef(null);
                    }}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.muted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Instant Reference Match Card */}
            {peekParsedRef && (
              <View style={styles.peekMatchCard}>
                <View style={styles.peekMatchHeader}>
                  <View style={styles.peekMatchRefBadge}>
                    <Ionicons name="bookmark" size={14} color="#FF6B35" />
                    <Text style={styles.peekMatchRefText}>
                      {peekParsedRef.book_name} {peekParsedRef.chapter}:{peekParsedRef.verse}
                    </Text>
                  </View>
                  <Text style={styles.peekMatchLabel}>Exact Match</Text>
                </View>
                <Text style={styles.peekMatchSnippet} numberOfLines={3}>
                  "{peekParsedRef.text}"
                </Text>
                <View style={styles.peekMatchActions}>
                  <TouchableOpacity
                    style={styles.peekMatchJumpBtn}
                    onPress={() => jumpToPeekPassage(peekParsedRef.book_id, peekParsedRef.chapter, peekParsedRef.verse)}
                  >
                    <Ionicons name="eye-outline" size={15} color="#fff" />
                    <Text style={styles.peekMatchJumpText}>Jump in Chapter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.peekMatchInsertBtn}
                    onPress={() => insertVerseFromPeek(peekParsedRef, true)}
                  >
                    <Ionicons name="add-circle" size={16} color="#7C3AED" />
                    <Text style={styles.peekMatchInsertText}>+ Insert to Note</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Search Results Dropdown List */}
            {peekSearchResults.length > 0 && (
              <View style={styles.peekSearchResultsContainer}>
                <Text style={styles.peekSearchResultsHeader}>Search Results ({peekSearchResults.length})</Text>
                <FlatList
                  data={peekSearchResults}
                  keyExtractor={(item) => item.id.toString()}
                  style={{ maxHeight: 220 }}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <View style={styles.peekSearchResultItem}>
                      <TouchableOpacity
                        style={{ flex: 1, marginRight: 8 }}
                        onPress={() => jumpToPeekPassage(item.book_id, item.chapter, item.verse)}
                      >
                        <Text style={styles.peekSearchItemRef}>
                          {item.book_name} {item.chapter}:{item.verse}
                        </Text>
                        <Text style={styles.peekSearchItemSnippet} numberOfLines={2}>
                          {item.text}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.peekSearchInsertIconBtn}
                        onPress={() => insertVerseFromPeek(item, true)}
                      >
                        <Ionicons name="add-circle" size={24} color="#7C3AED" />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              </View>
            )}

            {/* Quick Book & Chapter Selector Bar */}
            <View style={styles.peekNavControlBar}>
              {/* Book Picker Button */}
              <TouchableOpacity
                style={styles.peekPickerPill}
                onPress={() => setBookPickerOpen(true)}
              >
                <Ionicons name="book-outline" size={15} color="#FF6B35" />
                <Text style={styles.peekPickerPillText} numberOfLines={1}>
                  {currentBook.name}
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.muted} />
              </TouchableOpacity>

              {/* Chapter Picker Button */}
              <TouchableOpacity
                style={styles.peekPickerPill}
                onPress={() => setChapterPickerOpen(true)}
              >
                <Ionicons name="layers-outline" size={15} color="#7C3AED" />
                <Text style={styles.peekPickerPillText}>
                  Ch. {peekChapter}
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.muted} />
              </TouchableOpacity>

              {/* Prev / Next Chapter Stepper */}
              <View style={styles.peekStepper}>
                <TouchableOpacity
                  disabled={peekChapter <= 1}
                  onPress={() => jumpToPeekPassage(peekBookId, Math.max(1, peekChapter - 1))}
                  style={[styles.peekStepBtn, peekChapter <= 1 && { opacity: 0.3 }]}
                >
                  <Ionicons name="chevron-back" size={16} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.peekStepCount}>
                  {peekChapter}/{peekTotalChapters}
                </Text>
                <TouchableOpacity
                  disabled={peekChapter >= peekTotalChapters}
                  onPress={() => jumpToPeekPassage(peekBookId, Math.min(peekTotalChapters, peekChapter + 1))}
                  style={[styles.peekStepBtn, peekChapter >= peekTotalChapters && { opacity: 0.3 }]}
                >
                  <Ionicons name="chevron-forward" size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Popular Books Quick Bar */}
            <View style={styles.popularBooksContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
                {POPULAR_PEEK_BOOKS.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.popularBookChip, peekBookId === b.id && styles.popularBookChipActive]}
                    onPress={() => jumpToPeekPassage(b.id, 1)}
                  >
                    <Text style={[styles.popularBookChipText, peekBookId === b.id && styles.popularBookChipTextActive]}>
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Verses Stream with 1-Tap Insert */}
            <FlatList
              ref={peekListRef}
              data={peekVerses}
              keyExtractor={(v) => v.id.toString()}
              contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  peekListRef.current?.scrollToIndex({ index: info.index, animated: true });
                }, 100);
              }}
              renderItem={({ item }) => {
                const isTarget = item.verse === targetVerseNum;
                return (
                  <View style={[styles.peekVerseRow, isTarget && styles.peekVerseRowHighlight]}>
                    <View style={styles.peekVerseHeaderRow}>
                      <View style={[styles.peekVerseBadge, isTarget && styles.peekVerseBadgeHighlight]}>
                        <Text style={[styles.peekVerseNumText, isTarget && { color: "#fff" }]}>{item.verse}</Text>
                      </View>
                      {isTarget && (
                        <View style={styles.targetVerseTag}>
                          <Text style={styles.targetVerseTagText}>Target Verse</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }} />
                      <TouchableOpacity
                        style={styles.peekInsertPillBtn}
                        onPress={() => insertVerseFromPeek(item, true)}
                      >
                        <Ionicons name="add" size={15} color="#7C3AED" />
                        <Text style={styles.peekInsertPillText}>Insert</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.peekVerseText}>{item.text}</Text>
                  </View>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptySearchText}>Loading chapter verses...</Text>
              }
            />

            {/* Book Selector Modal */}
            <Modal visible={bookPickerOpen} animationType="slide" transparent>
              <View style={styles.modalOverlay}>
                <View style={[styles.modalCard, { maxHeight: "85%" }]}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Book</Text>
                    <TouchableOpacity onPress={() => setBookPickerOpen(false)}>
                      <Ionicons name="close" size={22} color={colors.muted} />
                    </TouchableOpacity>
                  </View>

                  {/* Book Search Bar */}
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Filter books (e.g. Genesis, Matthew)..."
                    placeholderTextColor={colors.muted}
                    value={bookFilterText}
                    onChangeText={setBookFilterText}
                  />

                  {/* Testament Filter Tabs */}
                  <View style={styles.bookFilterTabs}>
                    {(
                      [
                        { id: "ALL", label: "All (66)" },
                        { id: "OT", label: "Old (39)" },
                        { id: "NT", label: "New (27)" },
                        { id: "GOSPELS", label: "Gospels" },
                        { id: "WISDOM", label: "Wisdom" },
                      ] as const
                    ).map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.bookFilterTabBtn, bookTab === t.id && styles.bookFilterTabBtnActive]}
                        onPress={() => setBookTab(t.id)}
                      >
                        <Text
                          style={[
                            styles.bookFilterTabBtnText,
                            bookTab === t.id && styles.bookFilterTabBtnTextActive,
                          ]}
                        >
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Book Grid */}
                  <FlatList
                    data={filteredBooksForPicker}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={3}
                    contentContainerStyle={{ paddingVertical: 10, gap: 8 }}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.bookGridCard,
                          peekBookId === item.id && styles.bookGridCardActive,
                        ]}
                        onPress={() => {
                          setPeekBookId(item.id);
                          setPeekChapter(1);
                          setBookPickerOpen(false);
                          setChapterPickerOpen(true);
                        }}
                      >
                        <Text
                          style={[
                            styles.bookGridCardText,
                            peekBookId === item.id && styles.bookGridCardTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </View>
            </Modal>

            {/* Chapter Selector Modal */}
            <Modal visible={chapterPickerOpen} animationType="slide" transparent>
              <View style={styles.modalOverlay}>
                <View style={[styles.modalCard, { maxHeight: "75%" }]}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{currentBook.name} — Select Chapter</Text>
                    <TouchableOpacity onPress={() => setChapterPickerOpen(false)}>
                      <Ionicons name="close" size={22} color={colors.muted} />
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    data={Array.from({ length: peekTotalChapters }, (_, i) => i + 1)}
                    keyExtractor={(c) => c.toString()}
                    numColumns={5}
                    contentContainerStyle={{ paddingVertical: 12, gap: 10 }}
                    renderItem={({ item: chNum }) => (
                      <TouchableOpacity
                        style={[
                          styles.chapterGridCard,
                          peekChapter === chNum && styles.chapterGridCardActive,
                        ]}
                        onPress={() => jumpToPeekPassage(peekBookId, chNum)}
                      >
                        <Text
                          style={[
                            styles.chapterGridCardText,
                            peekChapter === chNum && styles.chapterGridCardTextActive,
                          ]}
                        >
                          {chNum}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </View>
            </Modal>
          </View>
        </Modal>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════
  // 3. VIEW NOTE MODE
  // ═══════════════════════════════════════════════════════
  if (mode === "view") {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

        {/* Top Bar */}
        <View style={styles.viewHeader}>
          <TouchableOpacity onPress={() => setMode("home")} style={styles.viewBackBtn}>
            <Ionicons name="chevron-back" size={20} color="#FF6B35" />
            <Text style={styles.viewBackText}>Notebook</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.editBtn} onPress={() => setMode("active")}>
            <Ionicons name="pencil" size={15} color="#FF6B35" />
            <Text style={styles.editBtnText}>Edit Note</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Note Title & Meta */}
          <View style={styles.viewHero}>
            <Text style={styles.viewTopic}>{docTopic || "Untitled Note"}</Text>
            <Text style={styles.viewMeta}>
              {docType} • {docSpeaker || "Speaker"} • {docDate}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.viewActionGrid}>
            <TouchableOpacity style={styles.actionCardBtn} onPress={shareNote}>
              <Ionicons name="share-social-outline" size={18} color="#06D6A0" />
              <Text style={styles.actionCardBtnText}>Share Note</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCardBtn} onPress={() => startNewSession("blank")}>
              <Ionicons name="add-circle-outline" size={18} color="#FF6B35" />
              <Text style={styles.actionCardBtnText}>New Note</Text>
            </TouchableOpacity>
          </View>

          {/* Formatted Note Body */}
          <View style={styles.viewBodyCard}>
            <Text style={styles.viewBodyText}>{docBody}</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return null;
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { paddingBottom: 60 },
    header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
    title: { fontFamily: "Syne-Bold", fontSize: 28, color: c.text },
    subtitle: { fontFamily: "DMSans-Regular", fontSize: 13, color: c.muted, marginTop: 4 },

    // Draft Card
    draftCard: {
      marginHorizontal: 20,
      marginBottom: 20,
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1.5,
      borderColor: "#06D6A066",
    },
    draftHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    liveBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#06D6A0" },
    liveBadgeText: { fontFamily: "Syne-Bold", fontSize: 11, color: "#06D6A0", letterSpacing: 0.5 },
    draftTime: { fontFamily: "Syne-Bold", fontSize: 12, color: c.muted },
    draftTopic: { fontFamily: "Syne-Bold", fontSize: 17, color: c.text, marginBottom: 2 },
    draftSub: { fontFamily: "DMSans-Regular", fontSize: 12, color: c.muted, marginBottom: 12 },
    draftActions: { flexDirection: "row", gap: 10, alignItems: "center" },
    resumeBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: "#06D6A0",
      paddingVertical: 10,
      borderRadius: 10,
    },
    resumeBtnText: { fontFamily: "Syne-Bold", fontSize: 13, color: "#fff" },
    discardBtn: {
      padding: 10,
      borderRadius: 10,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
    },

    sectionHeading: {
      fontFamily: "Syne-Bold",
      fontSize: 11,
      color: c.muted,
      letterSpacing: 1,
      marginHorizontal: 20,
      marginBottom: 10,
      marginTop: 6,
    },

    // Templates
    templateGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 14, gap: 10, marginBottom: 16 },
    templateCard: {
      width: "48%",
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    templateIconBox: {
      width: 38,
      height: 38,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    templateEmoji: { fontSize: 18 },
    templateTitle: { fontFamily: "Syne-Bold", fontSize: 13.5, color: c.text, marginBottom: 3 },
    templateDesc: { fontFamily: "DMSans-Regular", fontSize: 11, color: c.muted, lineHeight: 15 },

    // Past Sessions
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 20,
      marginBottom: 10,
      backgroundColor: c.surface,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    searchInput: { flex: 1, fontFamily: "DMSans-Regular", fontSize: 13.5, color: c.text },
    filterScroll: { paddingHorizontal: 20, marginBottom: 14 },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      marginRight: 8,
    },
    filterChipActive: { backgroundColor: "#FF6B3522", borderColor: "#FF6B35" },
    filterChipText: { fontFamily: "DMSans-Medium", fontSize: 12, color: c.muted },
    filterChipTextActive: { color: "#FF6B35", fontFamily: "Syne-Bold" },

    pastCard: {
      marginHorizontal: 20,
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    pastCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
    pastBadge: {
      backgroundColor: "#7C3AED18",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    pastBadgeText: { fontFamily: "Syne-Bold", fontSize: 10, color: "#7C3AED" },
    pastDate: { fontFamily: "DMSans-Regular", fontSize: 11, color: c.muted, flex: 1, marginLeft: 8 },
    pastDeleteBtn: { padding: 4 },
    pastTopic: { fontFamily: "Syne-Bold", fontSize: 15, color: c.text, marginBottom: 2 },
    pastSpeaker: { fontFamily: "DMSans-Regular", fontSize: 12, color: c.muted, marginBottom: 6 },
    pastPreview: { fontFamily: "Lora-Regular", fontSize: 13, color: c.muted, lineHeight: 19 },

    emptyPast: { alignItems: "center", paddingVertical: 36, paddingHorizontal: 20 },
    emptyPastEmoji: { fontSize: 36, marginBottom: 8 },
    emptyPastTitle: { fontFamily: "Syne-Bold", fontSize: 16, color: c.text, marginBottom: 4 },
    emptyPastSub: { fontFamily: "DMSans-Regular", fontSize: 12, color: c.muted, textAlign: "center" },

    // Active Editor Sticky Header
    editorTopBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 50,
      paddingBottom: 10,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    editorBackBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
    editorBackText: { fontFamily: "DMSans-Medium", fontSize: 14, color: "#FF6B35" },
    timerBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
    timerText: { fontFamily: "Syne-Bold", fontSize: 12, color: c.muted },
    editorTopActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    biblePeekBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: "#7C3AED18",
    },
    biblePeekBtnText: { fontFamily: "Syne-Bold", fontSize: 12, color: "#7C3AED" },
    doneBtn: {
      backgroundColor: "#FF6B35",
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 8,
    },
    doneBtnText: { fontFamily: "Syne-Bold", fontSize: 13, color: "#fff" },

    // Accessory Bar
    accessoryBar: {
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      paddingVertical: 6,
    },
    accessoryScroll: { paddingHorizontal: 14, gap: 8 },
    toolBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
    },
    toolBtnText: { fontFamily: "DMSans-Medium", fontSize: 12, color: c.text },

    // Canvas Notepad
    notepadCanvas: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 140 },
    noteTitleInput: {
      fontFamily: "Syne-Bold",
      fontSize: 22,
      color: c.text,
      paddingVertical: 4,
      marginBottom: 6,
    },
    noteMetaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
    noteSpeakerInput: {
      flex: 1,
      fontFamily: "DMSans-Regular",
      fontSize: 13,
      color: c.muted,
      paddingVertical: 2,
    },
    noteTypeTag: {
      backgroundColor: "#FF6B3518",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    noteTypeTagText: { fontFamily: "Syne-Bold", fontSize: 11, color: "#FF6B35" },
    paperRuleLine: {
      height: 1,
      backgroundColor: c.border,
      marginBottom: 14,
    },
    notepadBodyInput: {
      fontFamily: "DMSans-Regular",
      fontSize: 16,
      color: c.text,
      lineHeight: 28,
      minHeight: 350,
      padding: 0,
    },

    // Modal
    modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "#000000aa" },
    modalCard: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 36,
    },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
    modalTitle: { fontFamily: "Syne-Bold", fontSize: 18, color: c.text },
    verseSearchItem: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border + "44",
    },
    verseSearchItemRef: { fontFamily: "Syne-Bold", fontSize: 13, color: "#7C3AED", marginBottom: 2 },
    verseSearchItemText: { fontFamily: "Lora-Regular", fontSize: 13, color: c.text },
    emptySearchText: { fontFamily: "DMSans-Regular", fontSize: 13, color: c.muted, textAlign: "center", paddingVertical: 20 },

    // Bible Peek Modernized Styles
    peekHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    peekTitle: { fontFamily: "Syne-Bold", fontSize: 20, color: c.text },
    peekSub: { fontFamily: "DMSans-Regular", fontSize: 12, color: c.muted, marginTop: 2 },
    peekCloseBtn: { padding: 4 },

    peekToastBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#06D6A018",
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginHorizontal: 16,
      marginTop: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#06D6A044",
    },
    peekToastText: { fontFamily: "Syne-Bold", fontSize: 12, color: "#06D6A0" },

    peekSearchContainer: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 6,
    },
    peekSearchBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: c.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    peekSearchInput: {
      flex: 1,
      fontFamily: "DMSans-Regular",
      fontSize: 13.5,
      color: c.text,
      padding: 0,
    },

    // Instant Reference Match Card
    peekMatchCard: {
      marginHorizontal: 16,
      marginTop: 6,
      marginBottom: 8,
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1.5,
      borderColor: "#FF6B35",
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    peekMatchHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    peekMatchRefBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    peekMatchRefText: { fontFamily: "Syne-Bold", fontSize: 14, color: "#FF6B35" },
    peekMatchLabel: {
      fontFamily: "Syne-Bold",
      fontSize: 10,
      color: "#06D6A0",
      backgroundColor: "#06D6A018",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    peekMatchSnippet: {
      fontFamily: "Lora-Regular",
      fontSize: 13.5,
      color: c.text,
      lineHeight: 20,
      marginBottom: 10,
    },
    peekMatchActions: {
      flexDirection: "row",
      gap: 8,
    },
    peekMatchJumpBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      backgroundColor: "#FF6B35",
      paddingVertical: 8,
      borderRadius: 8,
    },
    peekMatchJumpText: { fontFamily: "Syne-Bold", fontSize: 12, color: "#fff" },
    peekMatchInsertBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      backgroundColor: "#7C3AED18",
      borderWidth: 1,
      borderColor: "#7C3AED44",
      paddingVertical: 8,
      borderRadius: 8,
    },
    peekMatchInsertText: { fontFamily: "Syne-Bold", fontSize: 12, color: "#7C3AED" },

    // Search Results Dropdown List
    peekSearchResultsContainer: {
      marginHorizontal: 16,
      marginBottom: 8,
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    peekSearchResultsHeader: {
      fontFamily: "Syne-Bold",
      fontSize: 12,
      color: c.muted,
      marginBottom: 8,
    },
    peekSearchResultItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.border + "44",
    },
    peekSearchItemRef: { fontFamily: "Syne-Bold", fontSize: 13, color: "#7C3AED", marginBottom: 2 },
    peekSearchItemSnippet: { fontFamily: "Lora-Regular", fontSize: 12.5, color: c.text },
    peekSearchInsertIconBtn: { padding: 4 },

    // Nav Control Bar
    peekNavControlBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
    },
    peekPickerPill: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: c.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    peekPickerPillText: {
      fontFamily: "Syne-Bold",
      fontSize: 13,
      color: c.text,
      flex: 1,
      marginHorizontal: 6,
    },
    peekStepper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 4,
    },
    peekStepBtn: { padding: 8 },
    peekStepCount: { fontFamily: "DMSans-Medium", fontSize: 12, color: c.muted, paddingHorizontal: 2 },

    // Popular Books
    popularBooksContainer: {
      paddingBottom: 8,
    },
    popularBookChip: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 14,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    popularBookChipActive: {
      backgroundColor: "#FF6B3518",
      borderColor: "#FF6B35",
    },
    popularBookChipText: { fontFamily: "DMSans-Medium", fontSize: 11.5, color: c.muted },
    popularBookChipTextActive: { fontFamily: "Syne-Bold", color: "#FF6B35" },

    // Verses Stream
    peekVerseRow: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    peekVerseRowHighlight: {
      backgroundColor: "#FF6B3512",
      borderColor: "#FF6B35",
      borderWidth: 1.5,
    },
    peekVerseHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
      gap: 6,
    },
    peekVerseBadge: {
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    peekVerseBadgeHighlight: {
      backgroundColor: "#FF6B35",
      borderColor: "#FF6B35",
    },
    peekVerseNumText: { fontFamily: "Syne-Bold", fontSize: 11, color: c.text },
    targetVerseTag: {
      backgroundColor: "#FF6B3522",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    targetVerseTagText: { fontFamily: "Syne-Bold", fontSize: 10, color: "#FF6B35" },
    peekInsertPillBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: "#7C3AED18",
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 6,
    },
    peekInsertPillText: { fontFamily: "Syne-Bold", fontSize: 11, color: "#7C3AED" },
    peekVerseText: { fontFamily: "Lora-Regular", fontSize: 14.5, color: c.text, lineHeight: 22 },

    // Book Filter Tabs & Grid
    bookFilterTabs: {
      flexDirection: "row",
      marginVertical: 10,
      backgroundColor: c.background,
      borderRadius: 10,
      padding: 3,
      gap: 4,
    },
    bookFilterTabBtn: {
      flex: 1,
      paddingVertical: 6,
      borderRadius: 8,
      alignItems: "center",
    },
    bookFilterTabBtnActive: { backgroundColor: "#FF6B35" },
    bookFilterTabBtnText: { fontFamily: "DMSans-Medium", fontSize: 11, color: c.muted },
    bookFilterTabBtnTextActive: { color: "#fff", fontFamily: "Syne-Bold" },

    bookGridCard: {
      flex: 1,
      margin: 4,
      backgroundColor: c.background,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 6,
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.border,
    },
    bookGridCardActive: {
      backgroundColor: "#FF6B3518",
      borderColor: "#FF6B35",
    },
    bookGridCardText: {
      fontFamily: "DMSans-Medium",
      fontSize: 12,
      color: c.text,
      textAlign: "center",
    },
    bookGridCardTextActive: { fontFamily: "Syne-Bold", color: "#FF6B35" },

    // Chapter Grid
    chapterGridCard: {
      flex: 1,
      margin: 4,
      backgroundColor: c.background,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.border,
    },
    chapterGridCardActive: {
      backgroundColor: "#FF6B35",
      borderColor: "#FF6B35",
    },
    chapterGridCardText: {
      fontFamily: "Syne-Bold",
      fontSize: 14,
      color: c.text,
    },
    chapterGridCardTextActive: { color: "#fff" },

    // View Mode
    viewHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    viewBackBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
    viewBackText: { fontFamily: "DMSans-Medium", fontSize: 14, color: "#FF6B35" },
    editBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: "#FF6B3518",
    },
    editBtnText: { fontFamily: "Syne-Bold", fontSize: 13, color: "#FF6B35" },

    viewHero: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    viewTopic: { fontFamily: "Syne-Bold", fontSize: 24, color: c.text, marginBottom: 4 },
    viewMeta: { fontFamily: "DMSans-Regular", fontSize: 13, color: c.muted },

    viewActionGrid: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 16 },
    actionCardBtn: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
      gap: 4,
      borderWidth: 1,
      borderColor: c.border,
    },
    actionCardBtnText: { fontFamily: "DMSans-Medium", fontSize: 12, color: c.text },

    viewBodyCard: {
      marginHorizontal: 20,
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      borderColor: c.border,
    },
    viewBodyText: {
      fontFamily: "DMSans-Regular",
      fontSize: 15.5,
      color: c.text,
      lineHeight: 26,
    },
  });
}
