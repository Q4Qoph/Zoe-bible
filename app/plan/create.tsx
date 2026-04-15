import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AppColors } from "../../constants/theme";
import { PlanDay } from "../../constants/readingPlans";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useDatabase } from "../../src/db";
import { getBooks, getChapterCount } from "../../src/db/queries";
import { useUserDatabase } from "../../src/db/UserDatabaseContext";
import { saveCustomPlan } from "../../src/db/userDb";

const ICONS = ["📖", "✝️", "🙏", "🌟", "📅", "💡", "🕊️", "❤️", "🌿", "⚡"];
const COLORS = ["#FF6B35", "#7C3AED", "#06D6A0", "#F59E0B", "#EC4899", "#3B82F6"];

type Reading = { bookId: number; bookName: string; chapter: number };

export default function CreatePlanScreen() {
  const router = useRouter();
  const db = useDatabase();
  const userDb = useUserDatabase();
  const { colors, isDark } = useTheme();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📖");
  const [color, setColor] = useState("#FF6B35");
  const [days, setDays] = useState<{ readings: Reading[] }[]>([{ readings: [] }]);

  // Picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDayIdx, setPickerDayIdx] = useState(0);
  const [pickerStep, setPickerStep] = useState<"book" | "chapter">("book");
  const [books, setBooks] = useState<{ id: number; name: string }[]>([]);
  const [selectedBook, setSelectedBook] = useState<{ id: number; name: string } | null>(null);
  const [chapterCount, setChapterCount] = useState(0);
  const [bookSearch, setBookSearch] = useState("");

  useEffect(() => {
    getBooks(db).then(setBooks);
  }, []);

  const openPicker = (dayIdx: number) => {
    setPickerDayIdx(dayIdx);
    setPickerStep("book");
    setSelectedBook(null);
    setBookSearch("");
    setPickerOpen(true);
  };

  const selectBook = async (book: { id: number; name: string }) => {
    setSelectedBook(book);
    const count = await getChapterCount(db, book.id);
    setChapterCount(count);
    setPickerStep("chapter");
  };

  const selectChapter = (chapter: number) => {
    if (!selectedBook) return;
    const reading: Reading = { bookId: selectedBook.id, bookName: selectedBook.name, chapter };
    setDays((prev) =>
      prev.map((d, i) =>
        i === pickerDayIdx ? { readings: [...d.readings, reading] } : d,
      ),
    );
    setPickerOpen(false);
  };

  const removeReading = (dayIdx: number, readingIdx: number) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx ? { readings: d.readings.filter((_, ri) => ri !== readingIdx) } : d,
      ),
    );
  };

  const addDay = () => setDays((prev) => [...prev, { readings: [] }]);

  const removeDay = (idx: number) => {
    if (days.length === 1) return;
    setDays((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please give your plan a name.");
      return;
    }
    const hasReadings = days.some((d) => d.readings.length > 0);
    if (!hasReadings) {
      Alert.alert("No readings", "Add at least one chapter to your plan.");
      return;
    }
    const planDays: PlanDay[] = days
      .filter((d) => d.readings.length > 0)
      .map((d, i) => ({ day: i + 1, readings: d.readings }));

    const planId = `custom_${Date.now()}`;
    await saveCustomPlan(userDb, { id: planId, name: name.trim(), icon, color, days: planDays });
    Alert.alert("Plan created!", `"${name.trim()}" is ready. Enroll in it from your Library.`, [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  const styles = makeStyles(colors);
  const filteredBooks = bookSearch.trim()
    ? books.filter((b) => b.name.toLowerCase().includes(bookSearch.toLowerCase()))
    : books;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#FF6B35" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Plan</Text>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: color }]} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Name */}
          <Text style={styles.label}>Plan Name</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="e.g. Gospels in 4 Weeks"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
          />

          {/* Icon */}
          <Text style={styles.label}>Icon</Text>
          <View style={styles.iconRow}>
            {ICONS.map((ic) => (
              <TouchableOpacity
                key={ic}
                style={[styles.iconBtn, icon === ic && { borderColor: color, backgroundColor: color + "22" }]}
                onPress={() => setIcon(ic)}
              >
                <Text style={styles.iconEmoji}>{ic}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Color */}
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorRow}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
                onPress={() => setColor(c)}
              >
                {color === c && <Ionicons name="checkmark" size={14} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Days */}
          <Text style={styles.label}>Reading Schedule</Text>
          {days.map((day, dayIdx) => (
            <View key={dayIdx} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <View style={[styles.dayBadge, { backgroundColor: color + "22" }]}>
                  <Text style={[styles.dayNum, { color }]}>Day {dayIdx + 1}</Text>
                </View>
                <View style={styles.dayActions}>
                  <TouchableOpacity style={styles.addReadingBtn} onPress={() => openPicker(dayIdx)}>
                    <Ionicons name="add" size={16} color={color} />
                    <Text style={[styles.addReadingText, { color }]}>Add chapter</Text>
                  </TouchableOpacity>
                  {days.length > 1 && (
                    <TouchableOpacity onPress={() => removeDay(dayIdx)} style={styles.removeDayBtn}>
                      <Ionicons name="trash-outline" size={16} color={colors.muted} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {day.readings.length === 0 ? (
                <Text style={styles.emptyDay}>No chapters yet — tap "Add chapter"</Text>
              ) : (
                day.readings.map((r, ri) => (
                  <View key={ri} style={styles.readingRow}>
                    <Ionicons name="book-outline" size={14} color={color} />
                    <Text style={styles.readingText}>{r.bookName} {r.chapter}</Text>
                    <TouchableOpacity onPress={() => removeReading(dayIdx, ri)}>
                      <Ionicons name="close-circle" size={18} color={colors.muted} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          ))}

          <TouchableOpacity style={[styles.addDayBtn, { borderColor: color }]} onPress={addDay}>
            <Ionicons name="add-circle-outline" size={18} color={color} />
            <Text style={[styles.addDayText, { color }]}>Add Day {days.length + 1}</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Book / Chapter Picker Modal */}
      <Modal visible={pickerOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>

            {pickerStep === "book" ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Book</Text>
                  <TouchableOpacity onPress={() => setPickerOpen(false)}>
                    <Ionicons name="close" size={22} color={colors.muted} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search books..."
                  placeholderTextColor={colors.muted}
                  value={bookSearch}
                  onChangeText={setBookSearch}
                />
                <FlatList
                  data={filteredBooks}
                  keyExtractor={(b) => b.id.toString()}
                  style={{ maxHeight: 400 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.bookRow} onPress={() => selectBook(item)}>
                      <Text style={styles.bookRowText}>{item.name}</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                    </TouchableOpacity>
                  )}
                />
              </>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setPickerStep("book")} style={styles.backChevron}>
                    <Ionicons name="chevron-back" size={20} color="#FF6B35" />
                    <Text style={styles.backChevronText}>Books</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>{selectedBook?.name}</Text>
                  <TouchableOpacity onPress={() => setPickerOpen(false)}>
                    <Ionicons name="close" size={22} color={colors.muted} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={Array.from({ length: chapterCount }, (_, i) => i + 1)}
                  keyExtractor={(n) => n.toString()}
                  numColumns={5}
                  style={{ maxHeight: 400 }}
                  contentContainerStyle={styles.chapterGrid}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.chapterBtn, { borderColor: color + "44" }]}
                      onPress={() => selectChapter(item)}
                    >
                      <Text style={[styles.chapterBtnText, { color }]}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 56,
      paddingBottom: 16,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    backBtn: {
      width: 40, height: 40, justifyContent: "center", alignItems: "center",
      backgroundColor: c.background, borderRadius: 10, borderWidth: 1, borderColor: c.border,
    },
    title: { fontFamily: "Syne-Bold", fontSize: 18, color: c.text },
    saveBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },
    saveBtnText: { fontFamily: "Syne-Bold", fontSize: 14, color: "#fff" },

    scroll: { padding: 24, paddingBottom: 60 },
    label: {
      fontFamily: "DMSans-Medium", fontSize: 11, color: c.muted,
      letterSpacing: 1, marginBottom: 10, marginTop: 20,
    },
    nameInput: {
      backgroundColor: c.surface, borderRadius: 12, padding: 16,
      fontFamily: "DMSans-Regular", fontSize: 16, color: c.text,
      borderWidth: 1, borderColor: c.border,
    },

    iconRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    iconBtn: {
      width: 48, height: 48, borderRadius: 12, justifyContent: "center",
      alignItems: "center", borderWidth: 2, borderColor: c.border,
      backgroundColor: c.surface,
    },
    iconEmoji: { fontSize: 22 },

    colorRow: { flexDirection: "row", gap: 12 },
    colorDot: {
      width: 36, height: 36, borderRadius: 18,
      justifyContent: "center", alignItems: "center",
    },
    colorDotActive: { borderWidth: 3, borderColor: "#fff" },

    dayCard: {
      backgroundColor: c.surface, borderRadius: 14, padding: 14,
      marginBottom: 12, borderWidth: 1, borderColor: c.border,
    },
    dayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    dayBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
    dayNum: { fontFamily: "Syne-Bold", fontSize: 13 },
    dayActions: { flexDirection: "row", alignItems: "center", gap: 10 },
    addReadingBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
    addReadingText: { fontFamily: "DMSans-Medium", fontSize: 13 },
    removeDayBtn: { padding: 4 },
    emptyDay: { fontFamily: "DMSans-Regular", fontSize: 12, color: c.muted, fontStyle: "italic" },
    readingRow: {
      flexDirection: "row", alignItems: "center", gap: 8,
      paddingVertical: 6, borderTopWidth: 1, borderTopColor: c.border,
    },
    readingText: { flex: 1, fontFamily: "DMSans-Medium", fontSize: 14, color: c.text },

    addDayBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 8, padding: 14, borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed",
    },
    addDayText: { fontFamily: "DMSans-Medium", fontSize: 14 },

    // Modal
    modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "#000000aa" },
    modalCard: {
      backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 20, paddingBottom: 40,
    },
    modalHeader: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16,
    },
    modalTitle: { fontFamily: "Syne-Bold", fontSize: 18, color: c.text },
    backChevron: { flexDirection: "row", alignItems: "center", gap: 2 },
    backChevronText: { fontFamily: "DMSans-Medium", fontSize: 14, color: "#FF6B35" },
    searchInput: {
      backgroundColor: c.background, borderRadius: 10, padding: 12,
      fontFamily: "DMSans-Regular", fontSize: 14, color: c.text,
      borderWidth: 1, borderColor: c.border, marginBottom: 12,
    },
    bookRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    bookRowText: { fontFamily: "DMSans-Medium", fontSize: 15, color: c.text },
    chapterGrid: { paddingVertical: 8 },
    chapterBtn: {
      flex: 1, margin: 4, height: 48, borderRadius: 10,
      justifyContent: "center", alignItems: "center",
      borderWidth: 1, backgroundColor: c.background,
    },
    chapterBtnText: { fontFamily: "Syne-Bold", fontSize: 15 },
  });
}
