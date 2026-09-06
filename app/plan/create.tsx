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

const ICONS = ["📖", "✝️", "🙏", "🌟", "📅", "💡", "🕊️", "❤️", "🌿", "⚡", "👑", "🛡️"];
const COLORS = ["#FF6B35", "#7C3AED", "#06D6A0", "#F59E0B", "#EC4899", "#3B82F6", "#10B981"];

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
  const [selectedChapters, setSelectedChapters] = useState<number[]>([]);

  useEffect(() => {
    getBooks(db).then(setBooks);
  }, []);

  const openPicker = (dayIdx: number) => {
    setPickerDayIdx(dayIdx);
    setPickerStep("book");
    setSelectedBook(null);
    setBookSearch("");
    setSelectedChapters([]);
    setPickerOpen(true);
  };

  const selectBook = async (book: { id: number; name: string }) => {
    setSelectedBook(book);
    const count = await getChapterCount(db, book.id);
    setChapterCount(count);
    setSelectedChapters([]);
    setPickerStep("chapter");
  };

  const toggleChapterSelection = (chapter: number) => {
    setSelectedChapters((prev) =>
      prev.includes(chapter) ? prev.filter((c) => c !== chapter) : [...prev, chapter].sort((a, b) => a - b)
    );
  };

  const selectAllChapters = () => {
    if (selectedChapters.length === chapterCount) {
      setSelectedChapters([]);
    } else {
      setSelectedChapters(Array.from({ length: chapterCount }, (_, i) => i + 1));
    }
  };

  const confirmAddChapters = () => {
    if (!selectedBook || selectedChapters.length === 0) return;
    const newReadings: Reading[] = selectedChapters.map((ch) => ({
      bookId: selectedBook.id,
      bookName: selectedBook.name,
      chapter: ch,
    }));

    setDays((prev) =>
      prev.map((d, i) =>
        i === pickerDayIdx ? { readings: [...d.readings, ...newReadings] } : d
      )
    );
    setPickerOpen(false);
  };

  const removeReading = (dayIdx: number, readingIdx: number) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx ? { readings: d.readings.filter((_, ri) => ri !== readingIdx) } : d
      )
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
    Alert.alert("Plan Created!", `"${name.trim()}" is ready. You can find it in your Library tab.`, [
      { text: "View Plans", onPress: () => router.back() },
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
          <Text style={styles.saveBtnText}>Save Plan</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Name */}
          <Text style={styles.label}>PLAN NAME</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="e.g. My 14-Day Walk in Psalms"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
          />

          {/* Icon */}
          <Text style={styles.label}>CHOOSE ICON</Text>
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
          <Text style={styles.label}>CHOOSE THEME COLOR</Text>
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
          <View style={styles.scheduleHeader}>
            <Text style={styles.label}>READING SCHEDULE</Text>
            <Text style={styles.scheduleCount}>{days.length} Days</Text>
          </View>

          {days.map((day, dayIdx) => (
            <View key={dayIdx} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <View style={[styles.dayBadge, { backgroundColor: color + "22" }]}>
                  <Text style={[styles.dayNum, { color }]}>Day {dayIdx + 1}</Text>
                </View>
                <View style={styles.dayActions}>
                  <TouchableOpacity style={styles.addReadingBtn} onPress={() => openPicker(dayIdx)}>
                    <Ionicons name="add" size={16} color={color} />
                    <Text style={[styles.addReadingText, { color }]}>Add Chapters</Text>
                  </TouchableOpacity>
                  {days.length > 1 && (
                    <TouchableOpacity onPress={() => removeDay(dayIdx)} style={styles.removeDayBtn}>
                      <Ionicons name="trash-outline" size={16} color={colors.muted} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {day.readings.length === 0 ? (
                <Text style={styles.emptyDay}>No chapters assigned yet — tap "Add Chapters"</Text>
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

      {/* Book / Multi-Chapter Picker Modal */}
      <Modal visible={pickerOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {pickerStep === "book" ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Scripture Book</Text>
                  <TouchableOpacity onPress={() => setPickerOpen(false)}>
                    <Ionicons name="close" size={22} color={colors.muted} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search books (e.g. Genesis, Matthew)..."
                  placeholderTextColor={colors.muted}
                  value={bookSearch}
                  onChangeText={setBookSearch}
                />
                <FlatList
                  data={filteredBooks}
                  keyExtractor={(b) => b.id.toString()}
                  style={{ maxHeight: 380 }}
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

                {/* Multi-Selection Control Bar */}
                <View style={styles.multiSelectBar}>
                  <TouchableOpacity style={styles.selectAllBtn} onPress={selectAllChapters}>
                    <Text style={styles.selectAllText}>
                      {selectedChapters.length === chapterCount ? "Deselect All" : "Select All Chapters"}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.selectedCountText}>
                    {selectedChapters.length} selected
                  </Text>
                </View>

                <FlatList
                  data={Array.from({ length: chapterCount }, (_, i) => i + 1)}
                  keyExtractor={(n) => n.toString()}
                  numColumns={5}
                  style={{ maxHeight: 320 }}
                  contentContainerStyle={styles.chapterGrid}
                  renderItem={({ item }) => {
                    const isSelected = selectedChapters.includes(item);
                    return (
                      <TouchableOpacity
                        style={[
                          styles.chapterBtn,
                          isSelected && { backgroundColor: color, borderColor: color },
                        ]}
                        onPress={() => toggleChapterSelection(item)}
                      >
                        <Text
                          style={[
                            styles.chapterBtnText,
                            { color: isSelected ? "#fff" : cText(colors) },
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />

                {/* Confirm Add Button */}
                <TouchableOpacity
                  style={[
                    styles.confirmAddBtn,
                    { backgroundColor: selectedChapters.length > 0 ? color : colors.border },
                  ]}
                  disabled={selectedChapters.length === 0}
                  onPress={confirmAddChapters}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.confirmAddBtnText}>
                    Add {selectedChapters.length} Chapter{selectedChapters.length === 1 ? "" : "s"} to Day {pickerDayIdx + 1}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function cText(colors: AppColors) {
  return colors.text;
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
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    title: { fontFamily: "Syne-Bold", fontSize: 18, color: c.text },
    saveBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 },
    saveBtnText: { fontFamily: "Syne-Bold", fontSize: 14, color: "#fff" },

    scroll: { padding: 20, paddingBottom: 60 },
    label: {
      fontFamily: "DMSans-Medium",
      fontSize: 11,
      color: c.muted,
      letterSpacing: 1,
      marginBottom: 8,
      marginTop: 18,
    },
    scheduleHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 8,
    },
    scheduleCount: { fontFamily: "Syne-Bold", fontSize: 12, color: "#FF6B35" },
    nameInput: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 14,
      fontFamily: "DMSans-Regular",
      fontSize: 15,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
    },

    iconRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    iconEmoji: { fontSize: 20 },

    colorRow: { flexDirection: "row", gap: 10 },
    colorDot: {
      width: 34,
      height: 34,
      borderRadius: 17,
      justifyContent: "center",
      alignItems: "center",
    },
    colorDotActive: { borderWidth: 3, borderColor: "#fff" },

    dayCard: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    dayHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    dayBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
    dayNum: { fontFamily: "Syne-Bold", fontSize: 12 },
    dayActions: { flexDirection: "row", alignItems: "center", gap: 10 },
    addReadingBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
    addReadingText: { fontFamily: "DMSans-Medium", fontSize: 13 },
    removeDayBtn: { padding: 4 },
    emptyDay: { fontFamily: "DMSans-Regular", fontSize: 12, color: c.muted, fontStyle: "italic" },
    readingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 7,
      borderTopWidth: 1,
      borderTopColor: c.border + "66",
    },
    readingText: { flex: 1, fontFamily: "DMSans-Medium", fontSize: 14, color: c.text },

    addDayBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderStyle: "dashed",
      marginTop: 8,
    },
    addDayText: { fontFamily: "DMSans-Medium", fontSize: 14 },

    // Modal
    modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "#000000aa" },
    modalCard: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 36,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    modalTitle: { fontFamily: "Syne-Bold", fontSize: 18, color: c.text },
    backChevron: { flexDirection: "row", alignItems: "center", gap: 2 },
    backChevronText: { fontFamily: "DMSans-Medium", fontSize: 14, color: "#FF6B35" },
    searchInput: {
      backgroundColor: c.background,
      borderRadius: 10,
      padding: 12,
      fontFamily: "DMSans-Regular",
      fontSize: 14,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 10,
    },
    bookRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    bookRowText: { fontFamily: "DMSans-Medium", fontSize: 15, color: c.text },
    multiSelectBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
      paddingHorizontal: 2,
    },
    selectAllBtn: { paddingVertical: 4 },
    selectAllText: { fontFamily: "DMSans-Medium", fontSize: 13, color: "#FF6B35" },
    selectedCountText: { fontFamily: "Syne-Bold", fontSize: 12, color: c.muted },
    chapterGrid: { paddingVertical: 6 },
    chapterBtn: {
      flex: 1,
      margin: 4,
      height: 46,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    chapterBtnText: { fontFamily: "Syne-Bold", fontSize: 15 },
    confirmAddBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 14,
    },
    confirmAddBtnText: { fontFamily: "Syne-Bold", fontSize: 14, color: "#fff" },
  });
}
