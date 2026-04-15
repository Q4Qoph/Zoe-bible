import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { SlideInLeft, SlideInRight } from "react-native-reanimated";
import { AppColors } from "../../../constants/theme";
import { useDatabase } from "../../../src/db";
import { useTheme } from "../../../src/contexts/ThemeContext";
import {
  Book,
  ChapterVerse,
  getBooks,
  getChapter,
  getChapterCount,
} from "../../../src/db/queries";
import { useUserDatabase } from "../../../src/db/UserDatabaseContext";
import {
  addBookmark,
  addHighlight,
  addNote,
  getHighlightsByChapter,
} from "../../../src/db/userDb";

const HIGHLIGHT_COLORS = ["#FF6B35", "#7C3AED", "#06D6A0", "#F59E0B", "#EC4899"];

export default function ChapterScreen() {
  const db = useDatabase();
  const userDb = useUserDatabase();
  const { colors, isDark } = useTheme();
  const { bookId, chapter: initialChapter } = useLocalSearchParams<{
    bookId: string;
    chapter: string;
  }>();

  const bookIdNum = parseInt(bookId);

  // Chapter managed as local state — no router.replace needed, no flash
  const [currentChapter, setCurrentChapter] = useState(parseInt(initialChapter));
  const [slideDir, setSlideDir] = useState<"next" | "prev">("next");

  const [verses, setVerses] = useState<ChapterVerse[]>([]);
  const [book, setBook] = useState<Book | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<ChapterVerse | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [showVerseNumbers, setShowVerseNumbers] = useState(true);
  const [chapterHighlights, setChapterHighlights] = useState<Record<number, string>>({});
  const [noteModal, setNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [toast, setToast] = useState("");
  const [totalChapters, setTotalChapters] = useState(0);

  // Refs for swipe responder closure
  const currentChapterRef = useRef(currentChapter);
  const totalChaptersRef = useRef(0);
  useEffect(() => { currentChapterRef.current = currentChapter; }, [currentChapter]);
  useEffect(() => { totalChaptersRef.current = totalChapters; }, [totalChapters]);

  // Load preferences once
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("reader_font_size"),
      AsyncStorage.getItem("show_verse_numbers"),
    ]).then(([fs, svn]) => {
      if (fs) setFontSize(parseInt(fs));
      if (svn !== null) setShowVerseNumbers(svn !== "false");
    });
  }, []);

  // Load book info + chapter count once (book doesn't change)
  useEffect(() => {
    getBooks(db).then((books) => {
      const found = books.find((b) => b.id === bookIdNum) || null;
      setBook(found);
    });
    getChapterCount(db, bookIdNum).then((count) => {
      setTotalChapters(count);
      totalChaptersRef.current = count;
    });
  }, [bookId]);

  // Reload verses + highlights whenever chapter changes
  useEffect(() => {
    setSelectedVerse(null);
    getChapter(db, bookIdNum, currentChapter).then(setVerses);
    getHighlightsByChapter(userDb, bookIdNum, currentChapter).then((rows) => {
      const map: Record<number, string> = {};
      rows.forEach((r) => { map[r.verse] = r.color; });
      setChapterHighlights(map);
    });
  }, [currentChapter]);

  // Save last_read whenever chapter or book changes
  useEffect(() => {
    if (book) {
      AsyncStorage.setItem(
        "last_read",
        JSON.stringify({ bookId: bookIdNum, bookName: book.name, chapter: currentChapter }),
      );
    }
  }, [book, currentChapter]);

  const goToChapter = useCallback((newChapter: number, direction: "next" | "prev") => {
    const total = totalChaptersRef.current;
    if (newChapter < 1 || newChapter > total) return;
    setSlideDir(direction);
    setCurrentChapter(newChapter);
  }, []);

  const swipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 25,
      onPanResponderRelease: (_, { dx }) => {
        const cur = currentChapterRef.current;
        const total = totalChaptersRef.current;
        if (dx < -60 && cur < total) goToChapter(cur + 1, "next");
        else if (dx > 60 && cur > 1) goToChapter(cur - 1, "prev");
      },
    }),
  ).current;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const handleBookmark = async () => {
    if (!selectedVerse) return;
    await addBookmark(userDb, {
      book_id: selectedVerse.book_id,
      book_name: selectedVerse.book_name,
      chapter: selectedVerse.chapter,
      verse: selectedVerse.verse,
      text: selectedVerse.text,
    });
    showToast("Bookmarked ✓");
    setSelectedVerse(null);
  };

  const handleHighlight = async (color: string) => {
    if (!selectedVerse) return;
    await addHighlight(userDb, {
      book_id: selectedVerse.book_id,
      book_name: selectedVerse.book_name,
      chapter: selectedVerse.chapter,
      verse: selectedVerse.verse,
      text: selectedVerse.text,
      color,
    });
    showToast("Highlighted ✓");
    setSelectedVerse(null);
    getHighlightsByChapter(userDb, bookIdNum, currentChapter).then((rows) => {
      const map: Record<number, string> = {};
      rows.forEach((r) => { map[r.verse] = r.color; });
      setChapterHighlights(map);
    });
  };

  const handleNote = async () => {
    if (!selectedVerse || !noteText.trim()) return;
    await addNote(userDb, {
      book_id: selectedVerse.book_id,
      book_name: selectedVerse.book_name,
      chapter: selectedVerse.chapter,
      verse: selectedVerse.verse,
      verse_text: selectedVerse.text,
      note: noteText.trim(),
    });
    setNoteText("");
    setNoteModal(false);
    showToast("Note saved ✓");
    setSelectedVerse(null);
  };

  const handleShare = async (verse: ChapterVerse) => {
    await Share.share({
      message: `"${verse.text}" — ${verse.book_name} ${verse.chapter}:${verse.verse} (BSB)`,
    });
  };

  const styles = makeStyles(colors);

  const renderVerse = useCallback(
    ({ item }: { item: ChapterVerse }) => {
      const isSelected = selectedVerse?.verse === item.verse;
      const highlightColor = chapterHighlights[item.verse];
      return (
        <TouchableOpacity
          style={[
            styles.verseRow,
            isSelected && styles.verseSelected,
            highlightColor
              ? { backgroundColor: highlightColor + "18", borderLeftWidth: 3, borderLeftColor: highlightColor }
              : undefined,
          ]}
          onPress={() => setSelectedVerse((prev) => prev?.verse === item.verse ? null : item)}
          activeOpacity={0.7}
        >
          {showVerseNumbers && (
            <Text style={styles.verseNumber}>{item.verse}</Text>
          )}
          <Text style={[styles.verseText, { fontSize }]}>{item.text}</Text>

          {isSelected && (
            <View style={styles.verseActions}>
              <View style={styles.colorRow}>
                {HIGHLIGHT_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorDot, { backgroundColor: color }]}
                    onPress={() => handleHighlight(color)}
                  />
                ))}
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleBookmark}>
                  <Ionicons name="bookmark-outline" size={18} color="#7C3AED" />
                  <Text style={styles.actionLabel}>Bookmark</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setNoteModal(true)}>
                  <Ionicons name="create-outline" size={18} color="#06D6A0" />
                  <Text style={styles.actionLabel}>Note</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item)}>
                  <Ionicons name="share-outline" size={18} color="#FF6B35" />
                  <Text style={styles.actionLabel}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [selectedVerse, fontSize, chapterHighlights, showVerseNumbers, styles],
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.surface}
      />
      <Stack.Screen
        options={{
          title: `${book?.name || ""} ${currentChapter}`,
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginRight: 8 }}>
              <TouchableOpacity
                style={styles.headerFontBtn}
                onPress={() => setFontSize((f) => {
                  const next = Math.max(14, f - 2);
                  AsyncStorage.setItem("reader_font_size", next.toString());
                  return next;
                })}
              >
                <Text style={styles.headerFontBtnText}>A-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerFontBtn}
                onPress={() => setFontSize((f) => {
                  const next = Math.min(28, f + 2);
                  AsyncStorage.setItem("reader_font_size", next.toString());
                  return next;
                })}
              >
                <Text style={styles.headerFontBtnText}>A+</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* Chapter Navigation */}
      <View style={styles.chapterNav}>
        <TouchableOpacity
          style={[styles.navBtn, currentChapter <= 1 && styles.navBtnDisabled]}
          onPress={() => goToChapter(currentChapter - 1, "prev")}
          disabled={currentChapter <= 1}
        >
          <Ionicons name="chevron-back" size={18} color={currentChapter <= 1 ? colors.border : "#FF6B35"} />
          <Text style={[styles.navBtnText, currentChapter <= 1 && { color: colors.border }]}>Prev</Text>
        </TouchableOpacity>

        <Text style={styles.chapterIndicator}>{currentChapter} / {totalChapters}</Text>

        <TouchableOpacity
          style={[styles.navBtn, currentChapter >= totalChapters && styles.navBtnDisabled]}
          onPress={() => goToChapter(currentChapter + 1, "next")}
          disabled={currentChapter >= totalChapters}
        >
          <Text style={[styles.navBtnText, currentChapter >= totalChapters && { color: colors.border }]}>Next</Text>
          <Ionicons name="chevron-forward" size={18} color={currentChapter >= totalChapters ? colors.border : "#FF6B35"} />
        </TouchableOpacity>
      </View>

      {/* Verse list — slides in from the correct direction, no screen transition */}
      <Animated.View
        key={currentChapter}
        style={{ flex: 1 }}
        entering={slideDir === "prev" ? SlideInRight.duration(220) : SlideInLeft.duration(220)}
        {...swipeResponder.panHandlers}
      >
        <FlatList
          data={verses}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.content}
          renderItem={renderVerse}
        />
      </Animated.View>

      {/* Toast */}
      {toast !== "" && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Note Modal */}
      <Modal visible={noteModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Note</Text>
            {selectedVerse && (
              <Text style={styles.modalVerse} numberOfLines={3}>
                "{selectedVerse.text}" — {selectedVerse.book_name}{" "}
                {selectedVerse.chapter}:{selectedVerse.verse}
              </Text>
            )}
            <TextInput
              style={styles.noteInput}
              placeholder="Write your note..."
              placeholderTextColor={colors.muted}
              multiline
              value={noteText}
              onChangeText={setNoteText}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => { setNoteModal(false); setNoteText(""); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleNote}>
                <Text style={styles.modalSaveText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    headerFontBtn: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
    },
    headerFontBtnText: { fontFamily: "Syne-Bold", fontSize: 13, color: "#FF6B35" },
    content: { paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 80 },
    verseRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 4,
      borderRadius: 10,
    },
    verseSelected: {
      backgroundColor: c.surface,
      borderLeftWidth: 3,
      borderLeftColor: "#FF6B35",
    },
    verseNumber: {
      fontFamily: "Syne-Bold",
      fontSize: 11,
      color: "#FF6B35",
      marginRight: 8,
      marginTop: 4,
      minWidth: 20,
    },
    verseText: { fontFamily: "Lora-Regular", color: c.text, lineHeight: 28, flex: 1 },
    verseActions: {
      width: "100%",
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    colorRow: { flexDirection: "row", gap: 10, marginBottom: 14, paddingHorizontal: 4 },
    colorDot: { width: 28, height: 28, borderRadius: 14 },
    actionRow: { flexDirection: "row", justifyContent: "space-around" },
    actionBtn: { alignItems: "center", gap: 4 },
    actionLabel: { fontFamily: "DMSans-Regular", fontSize: 11, color: c.muted },
    toast: {
      position: "absolute",
      bottom: 100,
      alignSelf: "center",
      backgroundColor: c.surface,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
    },
    toastText: { fontFamily: "DMSans-Medium", fontSize: 13, color: c.text },
    modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "#000000aa" },
    modalCard: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
    },
    modalTitle: { fontFamily: "Syne-Bold", fontSize: 20, color: c.text, marginBottom: 12 },
    modalVerse: {
      fontFamily: "Lora-Regular",
      fontSize: 14,
      color: c.muted,
      marginBottom: 16,
      lineHeight: 22,
    },
    noteInput: {
      backgroundColor: c.background,
      borderRadius: 12,
      padding: 16,
      fontFamily: "DMSans-Regular",
      fontSize: 15,
      color: c.text,
      minHeight: 120,
      textAlignVertical: "top",
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    modalActions: { flexDirection: "row", gap: 12 },
    modalCancel: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      backgroundColor: c.background,
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.border,
    },
    modalCancelText: { fontFamily: "DMSans-Medium", fontSize: 14, color: c.muted },
    modalSave: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: "#FF6B35", alignItems: "center" },
    modalSaveText: { fontFamily: "Syne-Bold", fontSize: 14, color: "#fff" },
    chapterNav: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    navBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: c.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    navBtnDisabled: { opacity: 0.4 },
    navBtnText: { fontFamily: "DMSans-Medium", fontSize: 13, color: "#FF6B35" },
    chapterIndicator: { fontFamily: "Syne-Bold", fontSize: 14, color: c.muted },
  });
}
