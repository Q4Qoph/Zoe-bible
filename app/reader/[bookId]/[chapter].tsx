import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useDatabase } from "../../../src/db";
import {
    Book,
    ChapterVerse,
    getBooks,
    getChapter,
} from "../../../src/db/queries";
import { useUserDatabase } from "../../../src/db/UserDatabaseContext";
import { addBookmark, addHighlight, addNote } from "../../../src/db/userDb";

const HIGHLIGHT_COLORS = [
  "#FF6B35",
  "#7C3AED",
  "#06D6A0",
  "#F59E0B",
  "#EC4899",
];

export default function ChapterScreen() {
  const db = useDatabase();
  const userDb = useUserDatabase();
  const { bookId, chapter } = useLocalSearchParams<{
    bookId: string;
    chapter: string;
  }>();
  const [verses, setVerses] = useState<ChapterVerse[]>([]);
  const [book, setBook] = useState<Book | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<ChapterVerse | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [noteModal, setNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [toast, setToast] = useState("");

  const bookIdNum = parseInt(bookId);
  const chapterNum = parseInt(chapter);

  useEffect(() => {
    getBooks(db).then((books) =>
      setBook(books.find((b) => b.id === bookIdNum) || null),
    );
    getChapter(db, bookIdNum, chapterNum).then(setVerses);
  }, [bookId, chapter]);

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

  const renderVerse = useCallback(
    ({ item }: { item: ChapterVerse }) => {
      const isSelected = selectedVerse?.verse === item.verse;
      return (
        <TouchableOpacity
          style={[styles.verseRow, isSelected && styles.verseSelected]}
          onPress={() =>
            setSelectedVerse((prev) =>
              prev?.verse === item.verse ? null : item,
            )
          }
          activeOpacity={0.7}
        >
          <Text style={styles.verseNumber}>{item.verse}</Text>
          <Text style={[styles.verseText, { fontSize }]}>{item.text}</Text>

          {isSelected && (
            <View style={styles.verseActions}>
              {/* Highlight colors */}
              <View style={styles.colorRow}>
                {HIGHLIGHT_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorDot, { backgroundColor: color }]}
                    onPress={() => handleHighlight(color)}
                  />
                ))}
              </View>
              {/* Action buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleBookmark}
                >
                  <Ionicons name="bookmark-outline" size={18} color="#7C3AED" />
                  <Text style={styles.actionLabel}>Bookmark</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    setNoteModal(true);
                  }}
                >
                  <Ionicons name="create-outline" size={18} color="#06D6A0" />
                  <Text style={styles.actionLabel}>Note</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleShare(item)}
                >
                  <Ionicons name="share-outline" size={18} color="#FF6B35" />
                  <Text style={styles.actionLabel}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [selectedVerse, fontSize],
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `${book?.name || ""} ${chapter}` }} />

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          onPress={() => setFontSize((f) => Math.max(14, f - 2))}
        >
          <Text style={styles.toolbarBtn}>A-</Text>
        </TouchableOpacity>
        <Text style={styles.toolbarLabel}>
          {book?.name} {chapter}
        </Text>
        <TouchableOpacity
          onPress={() => setFontSize((f) => Math.min(28, f + 2))}
        >
          <Text style={styles.toolbarBtn}>A+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={verses}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.content}
        renderItem={renderVerse}
      />

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
              placeholderTextColor="#6B6B80"
              multiline
              value={noteText}
              onChangeText={setNoteText}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setNoteModal(false);
                  setNoteText("");
                }}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F14" },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#1A1A24",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A38",
  },
  toolbarBtn: {
    fontFamily: "Syne-Bold",
    fontSize: 16,
    color: "#FF6B35",
    paddingHorizontal: 12,
  },
  toolbarLabel: { fontFamily: "DMSans-Medium", fontSize: 14, color: "#6B6B80" },
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
    backgroundColor: "#1A1A24",
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
  verseText: {
    fontFamily: "Lora-Regular",
    color: "#F5F5F5",
    lineHeight: 28,
    flex: 1,
  },
  verseActions: {
    width: "100%",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2A2A38",
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  actionRow: { flexDirection: "row", justifyContent: "space-around" },
  actionBtn: { alignItems: "center", gap: 4 },
  actionLabel: { fontFamily: "DMSans-Regular", fontSize: 11, color: "#6B6B80" },

  toast: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    backgroundColor: "#1A1A24",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2A2A38",
  },
  toastText: { fontFamily: "DMSans-Medium", fontSize: 13, color: "#F5F5F5" },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "#000000aa",
  },
  modalCard: {
    backgroundColor: "#1A1A24",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontFamily: "Syne-Bold",
    fontSize: 20,
    color: "#F5F5F5",
    marginBottom: 12,
  },
  modalVerse: {
    fontFamily: "Lora-Regular",
    fontSize: 14,
    color: "#6B6B80",
    marginBottom: 16,
    lineHeight: 22,
  },
  noteInput: {
    backgroundColor: "#0F0F14",
    borderRadius: 12,
    padding: 16,
    fontFamily: "DMSans-Regular",
    fontSize: 15,
    color: "#F5F5F5",
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2A2A38",
  },
  modalActions: { flexDirection: "row", gap: 12 },
  modalCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#0F0F14",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A38",
  },
  modalCancelText: {
    fontFamily: "DMSans-Medium",
    fontSize: 14,
    color: "#6B6B80",
  },
  modalSave: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FF6B35",
    alignItems: "center",
  },
  modalSaveText: { fontFamily: "Syne-Bold", fontSize: 14, color: "#fff" },
});
