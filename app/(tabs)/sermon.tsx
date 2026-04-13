import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
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
import { useDatabase } from "../../src/db";
import { ChapterVerse, searchVerses } from "../../src/db/queries";
import { useUserDatabase } from "../../src/db/UserDatabaseContext";
import { addNote } from "../../src/db/userDb";

interface SermonNote {
  id: string;
  text: string;
  verse: ChapterVerse | null;
  timestamp: string;
  type: "note" | "verse";
}

interface Sermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  notes: SermonNote[];
}

export default function SermonScreen() {
  const db = useDatabase();
  const userDb = useUserDatabase();
  const router = useRouter();

  const [mode, setMode] = useState<"home" | "active" | "view">("home");
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [verseQuery, setVerseQuery] = useState("");
  const [verseResults, setVerseResults] = useState<ChapterVerse[]>([]);
  const [showVerseSearch, setShowVerseSearch] = useState(false);
  const [sermonTitle, setSermonTitle] = useState("");
  const [sermonSpeaker, setSermonSpeaker] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const startSermon = () => {
    if (!sermonTitle.trim()) {
      Alert.alert("Title required", "Please enter a sermon title to continue.");
      return;
    }
    const newSermon: Sermon = {
      id: Date.now().toString(),
      title: sermonTitle.trim(),
      speaker: sermonSpeaker.trim() || "Unknown Speaker",
      date: new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      notes: [],
    };
    setSermon(newSermon);
    setMode("active");
    setSermonTitle("");
    setSermonSpeaker("");
  };

  const addNoteToSermon = () => {
    if (!noteInput.trim() || !sermon) return;
    const note: SermonNote = {
      id: Date.now().toString(),
      text: noteInput.trim(),
      verse: null,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "note",
    };
    setSermon((prev) =>
      prev ? { ...prev, notes: [...prev.notes, note] } : prev,
    );
    setNoteInput("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const searchVerse = async (q: string) => {
    setVerseQuery(q);
    if (q.length < 2) {
      setVerseResults([]);
      return;
    }
    const results = await searchVerses(db, q);
    setVerseResults(results.slice(0, 6));
  };

  const attachVerse = (verse: ChapterVerse) => {
    if (!sermon) return;
    const note: SermonNote = {
      id: Date.now().toString(),
      text: verse.text,
      verse,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "verse",
    };
    setSermon((prev) =>
      prev ? { ...prev, notes: [...prev.notes, note] } : prev,
    );
    setVerseQuery("");
    setVerseResults([]);
    setShowVerseSearch(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const saveToLibrary = async () => {
    if (!sermon) return;
    for (const note of sermon.notes) {
      if (note.verse) {
        await addNote(userDb, {
          book_id: note.verse.book_id,
          book_name: note.verse.book_name,
          chapter: note.verse.chapter,
          verse: note.verse.verse,
          verse_text: note.verse.text,
          note: `[${sermon.title}] ${note.text !== note.verse.text ? note.text : "Sermon verse"}`,
        });
      }
    }
    Alert.alert("Saved!", "Sermon verses saved to your Library.");
  };

  const shareSermon = async () => {
    if (!sermon) return;
    const text = [
      `📖 ${sermon.title}`,
      `🎤 ${sermon.speaker}`,
      `📅 ${sermon.date}`,
      "",
      ...sermon.notes.map((n) =>
        n.type === "verse"
          ? `📌 ${n.verse?.book_name} ${n.verse?.chapter}:${n.verse?.verse}\n"${n.text}"`
          : `• ${n.text}`,
      ),
      "",
      "Shared from Zoe Bible App",
    ].join("\n");
    await Share.share({ message: text });
  };

  const endSermon = () => {
    Alert.alert("End Sermon", "Finish this sermon session?", [
      { text: "Cancel", style: "cancel" },
      { text: "End & Review", onPress: () => setMode("view") },
    ]);
  };

  // ─── Home ─────────────────────────────────────────────
  if (mode === "home") {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>Sermon Mode</Text>
            <Text style={styles.subtitle}>Take notes & follow along live</Text>
          </View>

          <View style={styles.sermonForm}>
            <Text style={styles.formLabel}>Sermon Title</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Walking by Faith"
              placeholderTextColor="#6B6B80"
              value={sermonTitle}
              onChangeText={setSermonTitle}
            />
            <Text style={styles.formLabel}>Speaker</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Pastor John"
              placeholderTextColor="#6B6B80"
              value={sermonSpeaker}
              onChangeText={setSermonSpeaker}
            />
            <TouchableOpacity style={styles.startBtn} onPress={startSermon}>
              <Ionicons name="mic" size={20} color="#fff" />
              <Text style={styles.startBtnText}>Start Sermon Session</Text>
            </TouchableOpacity>
          </View>

          {/* Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 During a sermon you can</Text>
            {[
              "Type notes as the pastor speaks",
              "Search & attach Bible verses instantly",
              "Save all verses to your Library",
              "Share your sermon notes after",
            ].map((tip) => (
              <View key={tip} style={styles.tipRow}>
                <Text style={styles.tipDot}>→</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── Active Sermon ────────────────────────────────────
  if (mode === "active" && sermon) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <StatusBar barStyle="light-content" backgroundColor="#1A1A24" />

        {/* Sermon header bar */}
        <View style={styles.sermonBar}>
          <View style={styles.liveDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.sermonBarTitle} numberOfLines={1}>
              {sermon.title}
            </Text>
            <Text style={styles.sermonBarSub}>{sermon.speaker}</Text>
          </View>
          <TouchableOpacity style={styles.endBtn} onPress={endSermon}>
            <Text style={styles.endBtnText}>End</Text>
          </TouchableOpacity>
        </View>

        {/* Notes stream */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.noteStream}
        >
          {sermon.notes.length === 0 && (
            <View style={styles.emptyStream}>
              <Text style={styles.emptyStreamText}>
                Start typing notes or search for a verse below
              </Text>
            </View>
          )}
          {sermon.notes.map((note) => (
            <View
              key={note.id}
              style={[
                styles.noteItem,
                note.type === "verse" && styles.noteItemVerse,
              ]}
            >
              {note.type === "verse" && note.verse && (
                <TouchableOpacity
                  onPress={() =>
                    router.push(
                      `/reader/${note.verse!.book_id}/${note.verse!.chapter}`,
                    )
                  }
                >
                  <Text style={styles.noteVerseRef}>
                    📌 {note.verse.book_name} {note.verse.chapter}:
                    {note.verse.verse}
                  </Text>
                </TouchableOpacity>
              )}
              <Text
                style={
                  note.type === "verse"
                    ? styles.noteVerseText
                    : styles.noteTextContent
                }
              >
                {note.text}
              </Text>
              <Text style={styles.noteTime}>{note.timestamp}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Verse search results */}
        {showVerseSearch && (
          <View style={styles.verseSearchBox}>
            <View style={styles.verseSearchBar}>
              <Ionicons name="search" size={16} color="#6B6B80" />
              <TextInput
                style={styles.verseSearchInput}
                placeholder="Search verse (e.g. faith, John 3)"
                placeholderTextColor="#6B6B80"
                value={verseQuery}
                onChangeText={searchVerse}
                autoFocus
              />
              <TouchableOpacity
                onPress={() => {
                  setShowVerseSearch(false);
                  setVerseQuery("");
                  setVerseResults([]);
                }}
              >
                <Ionicons name="close" size={18} color="#6B6B80" />
              </TouchableOpacity>
            </View>
            {verseResults.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={styles.verseResult}
                onPress={() => attachVerse(v)}
              >
                <Text style={styles.verseResultRef}>
                  {v.book_name} {v.chapter}:{v.verse}
                </Text>
                <Text style={styles.verseResultText} numberOfLines={2}>
                  {v.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input bar */}
        {!showVerseSearch && (
          <View style={styles.inputBar}>
            <TouchableOpacity
              style={styles.verseBtn}
              onPress={() => setShowVerseSearch(true)}
            >
              <Ionicons name="book" size={20} color="#7C3AED" />
            </TouchableOpacity>
            <TextInput
              style={styles.noteInputField}
              placeholder="Type a note..."
              placeholderTextColor="#6B6B80"
              value={noteInput}
              onChangeText={setNoteInput}
              multiline
              onSubmitEditing={addNoteToSermon}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !noteInput.trim() && { opacity: 0.4 }]}
              onPress={addNoteToSermon}
              disabled={!noteInput.trim()}
            >
              <Ionicons name="arrow-up" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    );
  }

  // ─── Review / Summary ─────────────────────────────────
  if (mode === "view" && sermon) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
        <View style={styles.header}>
          <Text style={styles.title}>{sermon.title}</Text>
          <Text style={styles.subtitle}>
            {sermon.speaker} · {sermon.date}
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.reviewActions}>
          <TouchableOpacity style={styles.reviewBtn} onPress={saveToLibrary}>
            <Ionicons name="bookmark" size={18} color="#7C3AED" />
            <Text style={styles.reviewBtnText}>Save to Library</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reviewBtn} onPress={shareSermon}>
            <Ionicons name="share-outline" size={18} color="#06D6A0" />
            <Text style={styles.reviewBtnText}>Share Notes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.reviewBtn}
            onPress={() => setMode("home")}
          >
            <Ionicons name="add-circle-outline" size={18} color="#FF6B35" />
            <Text style={styles.reviewBtnText}>New Sermon</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.noteStream}>
          <Text style={styles.reviewCount}>
            {sermon.notes.length} note{sermon.notes.length !== 1 ? "s" : ""}{" "}
            from this sermon
          </Text>
          {sermon.notes.map((note) => (
            <View
              key={note.id}
              style={[
                styles.noteItem,
                note.type === "verse" && styles.noteItemVerse,
              ]}
            >
              {note.type === "verse" && note.verse && (
                <TouchableOpacity
                  onPress={() =>
                    router.push(
                      `/reader/${note.verse!.book_id}/${note.verse!.chapter}`,
                    )
                  }
                >
                  <Text style={styles.noteVerseRef}>
                    📌 {note.verse.book_name} {note.verse.chapter}:
                    {note.verse.verse}
                  </Text>
                </TouchableOpacity>
              )}
              <Text
                style={
                  note.type === "verse"
                    ? styles.noteVerseText
                    : styles.noteTextContent
                }
              >
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F14" },
  scroll: { paddingBottom: 40 },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24 },
  title: { fontFamily: "Syne-Bold", fontSize: 32, color: "#F5F5F5" },
  subtitle: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    color: "#6B6B80",
    marginTop: 4,
  },

  // Form
  sermonForm: {
    marginHorizontal: 24,
    backgroundColor: "#1A1A24",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#2A2A38",
  },
  formLabel: {
    fontFamily: "DMSans-Medium",
    fontSize: 13,
    color: "#6B6B80",
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: "#0F0F14",
    borderRadius: 12,
    padding: 14,
    fontFamily: "DMSans-Regular",
    fontSize: 15,
    color: "#F5F5F5",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2A2A38",
  },
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

  // Tips
  tipsCard: {
    marginHorizontal: 24,
    backgroundColor: "#7C3AED11",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#7C3AED33",
  },
  tipsTitle: {
    fontFamily: "Syne-Bold",
    fontSize: 15,
    color: "#F5F5F5",
    marginBottom: 14,
  },
  tipRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  tipDot: { fontFamily: "DMSans-Bold", fontSize: 14, color: "#7C3AED" },
  tipText: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    color: "#6B6B80",
    flex: 1,
  },

  // Active sermon bar
  sermonBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1A1A24",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A38",
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#06D6A0",
  },
  sermonBarTitle: { fontFamily: "Syne-Bold", fontSize: 16, color: "#F5F5F5" },
  sermonBarSub: {
    fontFamily: "DMSans-Regular",
    fontSize: 12,
    color: "#6B6B80",
  },
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
  emptyStreamText: {
    fontFamily: "DMSans-Regular",
    fontSize: 14,
    color: "#6B6B80",
    textAlign: "center",
  },
  noteItem: {
    backgroundColor: "#1A1A24",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2A2A38",
  },
  noteItemVerse: { borderColor: "#7C3AED44", backgroundColor: "#7C3AED11" },
  noteVerseRef: {
    fontFamily: "Syne-Bold",
    fontSize: 12,
    color: "#7C3AED",
    marginBottom: 6,
  },
  noteVerseText: {
    fontFamily: "Lora-Regular",
    fontSize: 15,
    color: "#F5F5F5",
    lineHeight: 24,
  },
  noteTextContent: {
    fontFamily: "DMSans-Regular",
    fontSize: 15,
    color: "#F5F5F5",
    lineHeight: 22,
  },
  noteTime: {
    fontFamily: "DMSans-Regular",
    fontSize: 11,
    color: "#6B6B80",
    marginTop: 8,
  },

  // Verse search
  verseSearchBox: {
    backgroundColor: "#1A1A24",
    borderTopWidth: 1,
    borderTopColor: "#2A2A38",
    paddingBottom: 8,
  },
  verseSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A38",
  },
  verseSearchInput: {
    flex: 1,
    fontFamily: "DMSans-Regular",
    fontSize: 14,
    color: "#F5F5F5",
  },
  verseResult: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A3844",
  },
  verseResultRef: {
    fontFamily: "Syne-Bold",
    fontSize: 12,
    color: "#7C3AED",
    marginBottom: 2,
  },
  verseResultText: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    color: "#F5F5F5",
  },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1A1A24",
    borderTopWidth: 1,
    borderTopColor: "#2A2A38",
  },
  verseBtn: {
    padding: 10,
    backgroundColor: "#7C3AED22",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#7C3AED44",
  },
  noteInputField: {
    flex: 1,
    fontFamily: "DMSans-Regular",
    fontSize: 15,
    color: "#F5F5F5",
    backgroundColor: "#0F0F14",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#2A2A38",
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
  reviewActions: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 20,
  },
  reviewBtn: {
    flex: 1,
    backgroundColor: "#1A1A24",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#2A2A38",
  },
  reviewBtnText: {
    fontFamily: "DMSans-Medium",
    fontSize: 11,
    color: "#F5F5F5",
    textAlign: "center",
  },
  reviewCount: {
    fontFamily: "DMSans-Medium",
    fontSize: 13,
    color: "#6B6B80",
    marginBottom: 16,
  },
});
