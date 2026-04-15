import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
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
import { useDatabase } from "../../src/db";
import { useTheme } from "../../src/contexts/ThemeContext";
import { ChapterVerse, searchVerses } from "../../src/db/queries";
import { useUserDatabase } from "../../src/db/UserDatabaseContext";
import {
    addNote,
    deleteSavedSession,
    getSavedSessions,
    saveSession,
} from "../../src/db/userDb";

const SESSION_TYPES = ["Sermon", "Bible Study", "Talk", "Other"];

interface SessionNote {
  id: string;
  text: string;
  verse: ChapterVerse | null;
  timestamp: string;
  type: "note" | "verse";
}

interface Session {
  id: string;
  topic: string;
  speaker: string;
  sessionType: string;
  date: string;
  notes: SessionNote[];
}

interface SavedSession {
  id: number;
  topic: string;
  speaker: string;
  session_type: string;
  date: string;
  notes: string;
  created_at: string;
}

export default function SessionScreen() {
  const db = useDatabase();
  const userDb = useUserDatabase();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [mode, setMode] = useState<"home" | "active" | "view">("home");
  const [session, setSession] = useState<Session | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [verseQuery, setVerseQuery] = useState("");
  const [verseResults, setVerseResults] = useState<ChapterVerse[]>([]);
  const [showVerseSearch, setShowVerseSearch] = useState(false);
  const [sessionTopic, setSessionTopic] = useState("");
  const [sessionSpeaker, setSessionSpeaker] = useState("");
  const [sessionType, setSessionType] = useState("Sermon");
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const noteInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadSavedSessions();
  }, []);

  const loadSavedSessions = async () => {
    const sessions = await getSavedSessions(userDb);
    setSavedSessions(sessions);
  };

  const startSession = () => {
    if (!sessionTopic.trim()) {
      Alert.alert("Topic required", "Please enter a session topic to continue.");
      return;
    }
    const newSession: Session = {
      id: Date.now().toString(),
      topic: sessionTopic.trim(),
      speaker: sessionSpeaker.trim() || "Unknown",
      sessionType,
      date: new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      notes: [],
    };
    setSession(newSession);
    setMode("active");
    setSessionTopic("");
    setSessionSpeaker("");
  };

  const addNoteToSession = () => {
    if (!noteInput.trim() || !session) return;
    const note: SessionNote = {
      id: Date.now().toString(),
      text: noteInput.trim(),
      verse: null,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "note",
    };
    setSession((prev) => prev ? { ...prev, notes: [...prev.notes, note] } : prev);
    setNoteInput("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const searchVerse = async (q: string) => {
    setVerseQuery(q);
    if (q.length < 2) { setVerseResults([]); return; }
    const results = await searchVerses(db, q);
    setVerseResults(results.slice(0, 6));
  };

  const attachVerse = (verse: ChapterVerse) => {
    if (!session) return;
    const note: SessionNote = {
      id: Date.now().toString(),
      text: verse.text,
      verse,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "verse",
    };
    setSession((prev) => prev ? { ...prev, notes: [...prev.notes, note] } : prev);
    setVerseQuery("");
    setVerseResults([]);
    setShowVerseSearch(false);
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
      noteInputRef.current?.focus();
    }, 100);
  };

  const saveToLibrary = async () => {
    if (!session) return;
    for (const note of session.notes) {
      if (note.verse) {
        await addNote(userDb, {
          book_id: note.verse.book_id,
          book_name: note.verse.book_name,
          chapter: note.verse.chapter,
          verse: note.verse.verse,
          verse_text: note.verse.text,
          note: `[${session.sessionType} – ${session.topic}] ${note.text !== note.verse.text ? note.text : "Session verse"}`,
        });
      }
    }
    Alert.alert("Saved!", "Session verses saved to your Library.");
  };

  const shareSession = async () => {
    if (!session) return;
    const text = [
      `📝 ${session.topic}`,
      `🏷️ ${session.sessionType}`,
      `🎤 ${session.speaker}`,
      `📅 ${session.date}`,
      "",
      ...session.notes.map((n) =>
        n.type === "verse"
          ? `📌 ${n.verse?.book_name} ${n.verse?.chapter}:${n.verse?.verse}\n"${n.text}"`
          : `• ${n.text}`,
      ),
      "",
      "Shared from Zoe Bible App",
    ].join("\n");
    await Share.share({ message: text });
  };

  const endSession = () => {
    Alert.alert("End Session", "Finish this session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End & Review",
        onPress: async () => {
          if (session) {
            await saveSession(userDb, {
              topic: session.topic,
              speaker: session.speaker,
              sessionType: session.sessionType,
              date: session.date,
              notes: session.notes,
            });
            await loadSavedSessions();
          }
          setMode("view");
        },
      },
    ]);
  };

  const openSavedSession = (saved: SavedSession) => {
    const notes: SessionNote[] = JSON.parse(saved.notes);
    setSession({
      id: saved.id.toString(),
      topic: saved.topic,
      speaker: saved.speaker,
      sessionType: saved.session_type,
      date: saved.date,
      notes,
    });
    setMode("view");
  };

  const confirmDeleteSaved = (id: number) => {
    Alert.alert("Delete Session", "Remove this session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteSavedSession(userDb, id);
          await loadSavedSessions();
        },
      },
    ]);
  };

  const styles = makeStyles(colors);

  // ─── Home ─────────────────────────────────────────────
  if (mode === "home") {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>Session</Text>
            <Text style={styles.subtitle}>Type notes → find a verse → keep going</Text>
          </View>

          <View style={styles.sessionForm}>
            <Text style={styles.formLabel}>Session Type</Text>
            <View style={styles.chipRow}>
              {SESSION_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, sessionType === t && styles.chipActive]}
                  onPress={() => setSessionType(t)}
                >
                  <Text style={[styles.chipText, sessionType === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Topic</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Walking by Faith"
              placeholderTextColor={colors.muted}
              value={sessionTopic}
              onChangeText={setSessionTopic}
            />
            <Text style={styles.formLabel}>Speaker / Host</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Pastor John (optional)"
              placeholderTextColor={colors.muted}
              value={sessionSpeaker}
              onChangeText={setSessionSpeaker}
            />
            <TouchableOpacity
              style={[styles.startBtn, !sessionTopic.trim() && { opacity: 0.5 }]}
              onPress={startSession}
              disabled={!sessionTopic.trim()}
            >
              <Ionicons name="create" size={20} color="#fff" />
              <Text style={styles.startBtnText}>Start Session</Text>
            </TouchableOpacity>
          </View>

          {/* Past Sessions */}
          {savedSessions.length > 0 && (
            <View style={styles.pastSection}>
              <Text style={styles.pastTitle}>Past Sessions</Text>
              {savedSessions.slice(0, 3).map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.pastCard}
                  onPress={() => openSavedSession(s)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pastTopic} numberOfLines={1}>{s.topic}</Text>
                    <Text style={styles.pastMeta}>{s.session_type} · {s.date}</Text>
                  </View>
                  <TouchableOpacity onPress={() => confirmDeleteSaved(s.id)}>
                    <Ionicons name="trash-outline" size={16} color={colors.muted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // ─── Active Session ───────────────────────────────────
  if (mode === "active" && session) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.surface} />

        <View style={styles.sessionBar}>
          <View style={styles.liveDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.sessionBarTitle} numberOfLines={1}>{session.topic}</Text>
            <Text style={styles.sessionBarSub}>{session.sessionType} · {session.speaker}</Text>
          </View>
          <TouchableOpacity style={styles.endBtn} onPress={endSession}>
            <Text style={styles.endBtnText}>End</Text>
          </TouchableOpacity>
        </View>

        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.noteStream}>
          {session.notes.length === 0 && (
            <View style={styles.emptyStream}>
              <Text style={styles.emptyStreamText}>Type a note or tap the verse icon to search scripture</Text>
            </View>
          )}
          {session.notes.map((note) => (
            <View key={note.id} style={[styles.noteItem, note.type === "verse" && styles.noteItemVerse]}>
              {note.type === "verse" && note.verse && (
                <TouchableOpacity
                  onPress={() => router.push(`/reader/${note.verse!.book_id}/${note.verse!.chapter}`)}
                >
                  <Text style={styles.noteVerseRef}>
                    📌 {note.verse.book_name} {note.verse.chapter}:{note.verse.verse}
                  </Text>
                </TouchableOpacity>
              )}
              <Text style={note.type === "verse" ? styles.noteVerseText : styles.noteTextContent}>
                {note.text}
              </Text>
              <Text style={styles.noteTime}>{note.timestamp}</Text>
            </View>
          ))}
        </ScrollView>

        {showVerseSearch && (
          <View style={styles.verseSearchBox}>
            <View style={styles.verseSearchBar}>
              <Ionicons name="search" size={16} color={colors.muted} />
              <TextInput
                style={styles.verseSearchInput}
                placeholder="Search verse (e.g. faith, John 3)"
                placeholderTextColor={colors.muted}
                value={verseQuery}
                onChangeText={searchVerse}
                autoFocus
              />
              <TouchableOpacity onPress={() => { setShowVerseSearch(false); setVerseQuery(""); setVerseResults([]); }}>
                <Ionicons name="close" size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>
            {verseResults.map((v) => (
              <TouchableOpacity key={v.id} style={styles.verseResult} onPress={() => attachVerse(v)}>
                <Text style={styles.verseResultRef}>{v.book_name} {v.chapter}:{v.verse}</Text>
                <Text style={styles.verseResultText} numberOfLines={2}>{v.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[styles.verseBtn, showVerseSearch && styles.verseBtnActive]}
            onPress={() => setShowVerseSearch((v) => !v)}
          >
            <Ionicons name="book" size={20} color="#7C3AED" />
          </TouchableOpacity>
          <TextInput
            ref={noteInputRef}
            style={styles.noteInputField}
            placeholder="Type a note..."
            placeholderTextColor={colors.muted}
            value={noteInput}
            onChangeText={setNoteInput}
            multiline
            onSubmitEditing={addNoteToSession}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !noteInput.trim() && { opacity: 0.4 }]}
            onPress={addNoteToSession}
            disabled={!noteInput.trim()}
          >
            <Ionicons name="arrow-up" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ─── Review / Summary ─────────────────────────────────
  if (mode === "view" && session) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <View style={styles.header}>
          <Text style={styles.title}>{session.topic}</Text>
          <Text style={styles.subtitle}>
            {session.sessionType} · {session.speaker} · {session.date}
          </Text>
        </View>

        <View style={styles.reviewActions}>
          <TouchableOpacity style={styles.reviewBtn} onPress={saveToLibrary}>
            <Ionicons name="bookmark" size={18} color="#7C3AED" />
            <Text style={styles.reviewBtnText}>Save to Library</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reviewBtn} onPress={shareSession}>
            <Ionicons name="share-outline" size={18} color="#06D6A0" />
            <Text style={styles.reviewBtnText}>Share Notes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reviewBtn} onPress={() => setMode("home")}>
            <Ionicons name="add-circle-outline" size={18} color="#FF6B35" />
            <Text style={styles.reviewBtnText}>New Session</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.noteStream}>
          <Text style={styles.reviewCount}>
            {session.notes.length} note{session.notes.length !== 1 ? "s" : ""} from this session
          </Text>
          {session.notes.map((note) => (
            <View key={note.id} style={[styles.noteItem, note.type === "verse" && styles.noteItemVerse]}>
              {note.type === "verse" && note.verse && (
                <TouchableOpacity
                  onPress={() => router.push(`/reader/${note.verse!.book_id}/${note.verse!.chapter}`)}
                >
                  <Text style={styles.noteVerseRef}>
                    📌 {note.verse.book_name} {note.verse.chapter}:{note.verse.verse}
                  </Text>
                </TouchableOpacity>
              )}
              <Text style={note.type === "verse" ? styles.noteVerseText : styles.noteTextContent}>
                {note.text}
              </Text>
              <Text style={styles.noteTime}>{note.timestamp}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return null;
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { paddingBottom: 40 },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24 },
    title: { fontFamily: "Syne-Bold", fontSize: 32, color: c.text },
    subtitle: { fontFamily: "DMSans-Regular", fontSize: 13, color: c.muted, marginTop: 4 },

    sessionForm: {
      marginHorizontal: 24,
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: c.border,
    },
    formLabel: { fontFamily: "DMSans-Medium", fontSize: 13, color: c.muted, marginBottom: 8 },
    formInput: {
      backgroundColor: c.background,
      borderRadius: 12,
      padding: 14,
      fontFamily: "DMSans-Regular",
      fontSize: 15,
      color: c.text,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipActive: { backgroundColor: "#7C3AED22", borderColor: "#7C3AED" },
    chipText: { fontFamily: "DMSans-Medium", fontSize: 13, color: c.muted },
    chipTextActive: { color: "#7C3AED" },
    startBtn: {
      backgroundColor: "#7C3AED",
      borderRadius: 14,
      padding: 16,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
      marginTop: 4,
    },
    startBtnText: { fontFamily: "Syne-Bold", fontSize: 16, color: "#fff" },

    // Past sessions
    pastSection: { marginHorizontal: 24, marginBottom: 24 },
    pastTitle: { fontFamily: "Syne-Bold", fontSize: 16, color: c.text, marginBottom: 12 },
    pastCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    pastTopic: { fontFamily: "DMSans-Medium", fontSize: 14, color: c.text },
    pastMeta: { fontFamily: "DMSans-Regular", fontSize: 12, color: c.muted, marginTop: 2 },

    // Active session
    sessionBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: c.surface,
      paddingHorizontal: 20,
      paddingTop: 52,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#06D6A0" },
    sessionBarTitle: { fontFamily: "Syne-Bold", fontSize: 16, color: c.text },
    sessionBarSub: { fontFamily: "DMSans-Regular", fontSize: 12, color: c.muted },
    endBtn: {
      backgroundColor: "#FF6B3522",
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: "#FF6B3544",
    },
    endBtnText: { fontFamily: "Syne-Bold", fontSize: 13, color: "#FF6B35" },

    // Notes stream
    noteStream: { padding: 20, paddingBottom: 40 },
    emptyStream: { alignItems: "center", paddingTop: 60 },
    emptyStreamText: { fontFamily: "DMSans-Regular", fontSize: 14, color: c.muted, textAlign: "center" },
    noteItem: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    noteItemVerse: { borderColor: "#7C3AED44", backgroundColor: "#7C3AED11" },
    noteVerseRef: { fontFamily: "Syne-Bold", fontSize: 12, color: "#7C3AED", marginBottom: 6 },
    noteVerseText: { fontFamily: "Lora-Regular", fontSize: 15, color: c.text, lineHeight: 24 },
    noteTextContent: { fontFamily: "DMSans-Regular", fontSize: 15, color: c.text, lineHeight: 22 },
    noteTime: { fontFamily: "DMSans-Regular", fontSize: 11, color: c.muted, marginTop: 8 },

    // Verse search
    verseSearchBox: {
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingBottom: 8,
    },
    verseSearchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    verseSearchInput: { flex: 1, fontFamily: "DMSans-Regular", fontSize: 14, color: c.text },
    verseResult: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border + "44",
    },
    verseResultRef: { fontFamily: "Syne-Bold", fontSize: 12, color: "#7C3AED", marginBottom: 2 },
    verseResultText: { fontFamily: "DMSans-Regular", fontSize: 13, color: c.text },

    // Input bar
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    verseBtn: {
      padding: 10,
      backgroundColor: "#7C3AED22",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#7C3AED44",
    },
    verseBtnActive: { backgroundColor: "#7C3AED44", borderColor: "#7C3AED" },
    noteInputField: {
      flex: 1,
      fontFamily: "DMSans-Regular",
      fontSize: 15,
      color: c.text,
      backgroundColor: c.background,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      maxHeight: 100,
      borderWidth: 1,
      borderColor: c.border,
    },
    sendBtn: {
      backgroundColor: "#FF6B35",
      borderRadius: 12,
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },

    // Review
    reviewActions: { flexDirection: "row", paddingHorizontal: 24, gap: 8, marginBottom: 20 },
    reviewBtn: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderColor: c.border,
    },
    reviewBtnText: { fontFamily: "DMSans-Medium", fontSize: 11, color: c.text, textAlign: "center" },
    reviewCount: { fontFamily: "DMSans-Medium", fontSize: 13, color: c.muted, marginBottom: 16 },
  });
}
