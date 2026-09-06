import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clipboard,
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
import MoreVerseActionsModal from "../../../components/MoreVerseActionsModal";
import ParallelTranslationModal from "../../../components/ParallelTranslationModal";
import StudyDrawer from "../../../components/StudyDrawer";
import VerseShareStudio from "../../../components/VerseShareStudio";
import { READING_PLANS } from "../../../constants/readingPlans";
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
  getBookmarksByChapter,
  getCustomPlan,
  getHighlightsByChapter,
  getNotesByChapter,
  getProgress,
  markChapterComplete,
  removeBookmarkByVerse,
  removeHighlightByVerse,
} from "../../../src/db/userDb";
import { TranslationId } from "../../../src/data/translations";
import { updateStreak } from "../../../src/utils/streak";

const HIGHLIGHT_COLORS = ["#FF6B35", "#7C3AED", "#06D6A0", "#F59E0B", "#EC4899"];

export default function ChapterScreen() {
  const db = useDatabase();
  const userDb = useUserDatabase();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    bookId,
    chapter: initialChapter,
    verse: targetVerse,
    fromPlan,
    planName,
    planDay,
  } = useLocalSearchParams<{
    bookId: string;
    chapter: string;
    verse?: string;
    fromPlan?: string;
    planName?: string;
    planDay?: string;
  }>();

  const bookIdNum = parseInt(bookId);

  // Plan Companion State
  const [planDaySchedule, setPlanDaySchedule] = useState<{ bookId: number; bookName: string; chapter: number }[]>([]);
  const [isPlanChapterCompleted, setIsPlanChapterCompleted] = useState(false);

  // Chapter state
  const [currentChapter, setCurrentChapter] = useState(parseInt(initialChapter));
  const [slideDir, setSlideDir] = useState<"next" | "prev">("next");

  const [verses, setVerses] = useState<ChapterVerse[]>([]);
  const [book, setBook] = useState<Book | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<ChapterVerse | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [showVerseNumbers, setShowVerseNumbers] = useState(true);
  const [activeTranslation, setActiveTranslation] = useState<TranslationId>("BSB");

  // Annotation states
  const [chapterHighlights, setChapterHighlights] = useState<Record<number, string>>({});
  const [chapterBookmarks, setChapterBookmarks] = useState<Set<number>>(new Set());
  const [chapterNotes, setChapterNotes] = useState<Set<number>>(new Set());

  // Modals & Drawers
  const [noteModal, setNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [studyDrawerVisible, setStudyDrawerVisible] = useState(false);
  const [studyInitialTab, setStudyInitialTab] = useState<"crossref" | "lexicon">("crossref");
  const [shareStudioVisible, setShareStudioVisible] = useState(false);
  const [parallelModalVisible, setParallelModalVisible] = useState(false);
  const [moreActionsVisible, setMoreActionsVisible] = useState(false);
  const [toast, setToast] = useState("");
  const [totalChapters, setTotalChapters] = useState(0);

  // Refs for swipe responder
  const currentChapterRef = useRef(currentChapter);
  const totalChaptersRef = useRef(0);
  useEffect(() => { currentChapterRef.current = currentChapter; }, [currentChapter]);
  useEffect(() => { totalChaptersRef.current = totalChapters; }, [totalChapters]);

  // Load user preferences & translation
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("reader_font_size"),
      AsyncStorage.getItem("show_verse_numbers"),
      AsyncStorage.getItem("active_translation"),
    ]).then(([fs, svn, trans]) => {
      if (fs) setFontSize(parseInt(fs));
      if (svn !== null) setShowVerseNumbers(svn !== "false");
      if (trans === "KJV" || trans === "WEB" || trans === "BSB") {
        setActiveTranslation(trans);
      }
    });
  }, []);

  // Load book info & chapter count
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

  // Refresh chapter annotations
  const refreshAnnotations = useCallback(async (bId: number, chap: number) => {
    const [hlRows, bmRows, ntRows] = await Promise.all([
      getHighlightsByChapter(userDb, bId, chap),
      getBookmarksByChapter(userDb, bId, chap),
      getNotesByChapter(userDb, bId, chap),
    ]);

    const hlMap: Record<number, string> = {};
    hlRows.forEach((r) => { hlMap[r.verse] = r.color; });
    setChapterHighlights(hlMap);
    setChapterBookmarks(new Set(bmRows.map((r) => r.verse)));
    setChapterNotes(new Set(ntRows.map((r) => r.verse)));
  }, [userDb]);

  // Reload chapter verses & annotations
  useEffect(() => {
    getChapter(db, bookIdNum, currentChapter, activeTranslation).then((rows) => {
      setVerses(rows);
      if (targetVerse && currentChapter === parseInt(initialChapter)) {
        const vNum = parseInt(targetVerse);
        const match = rows.find((r) => r.verse === vNum);
        if (match) setSelectedVerse(match);
      } else {
        setSelectedVerse(null);
      }
    });
    refreshAnnotations(bookIdNum, currentChapter);
  }, [currentChapter, activeTranslation, bookIdNum]);

  // Update last read
  useEffect(() => {
    if (book) {
      AsyncStorage.setItem(
        "last_read",
        JSON.stringify({ bookId: bookIdNum, bookName: book.name, chapter: currentChapter }),
      );
    }
  }, [book, currentChapter]);

  // Load plan companion data if opened from a reading plan
  useEffect(() => {
    if (!fromPlan || !planDay) return;
    const dayNum = parseInt(planDay);

    const stdPlan = READING_PLANS.find((p) => p.id === fromPlan);
    if (stdPlan) {
      const dayData = stdPlan.days.find((d) => d.day === dayNum);
      if (dayData) setPlanDaySchedule(dayData.readings);
    } else {
      getCustomPlan(userDb, fromPlan).then((row) => {
        if (row) {
          try {
            const days = JSON.parse(row.days);
            const dayData = days.find((d: any) => d.day === dayNum);
            if (dayData) setPlanDaySchedule(dayData.readings);
          } catch {}
        }
      });
    }

    getProgress(userDb, fromPlan).then((rows) => {
      const isDone = rows.some(
        (r) =>
          r.day === dayNum &&
          r.book_id === bookIdNum &&
          r.chapter === currentChapter &&
          r.completed === 1
      );
      setIsPlanChapterCompleted(isDone);
    });
  }, [fromPlan, planDay, currentChapter, bookIdNum]);

  const handleCompletePlanReading = async () => {
    if (!fromPlan || !planDay || !book) return;
    const dayNum = parseInt(planDay);

    await markChapterComplete(
      userDb,
      fromPlan,
      dayNum,
      bookIdNum,
      book.name,
      currentChapter
    );
    setIsPlanChapterCompleted(true);
    await updateStreak();

    // Look for next reading in this day's schedule
    const currentIdx = planDaySchedule.findIndex(
      (r) => r.bookId === bookIdNum && r.chapter === currentChapter
    );

    if (currentIdx !== -1 && currentIdx < planDaySchedule.length - 1) {
      const next = planDaySchedule[currentIdx + 1];
      showToast(`✓ Marked Read! Next: ${next.bookName} ${next.chapter}`);
      setTimeout(() => {
        router.replace({
          pathname: "/reader/[bookId]/[chapter]",
          params: {
            bookId: next.bookId.toString(),
            chapter: next.chapter.toString(),
            fromPlan,
            planName,
            planDay,
          },
        });
      }, 350);
    } else {
      showToast(`🎉 Day ${planDay} readings complete!`);
    }
  };

  const goToChapter = useCallback((newChapter: number, direction: "next" | "prev", targetV?: number) => {
    const total = totalChaptersRef.current;
    if (newChapter < 1 || newChapter > total) return;
    setSlideDir(direction);
    setCurrentChapter(newChapter);
    if (targetV) {
      setTimeout(() => {
        getChapter(db, bookIdNum, newChapter).then((rows) => {
          const match = rows.find((r) => r.verse === targetV);
          if (match) setSelectedVerse(match);
        });
      }, 250);
    }
  }, [db, bookIdNum]);

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

  const handleToggleBookmark = async () => {
    if (!selectedVerse) return;
    const isBm = chapterBookmarks.has(selectedVerse.verse);
    if (isBm) {
      await removeBookmarkByVerse(userDb, selectedVerse.book_id, selectedVerse.chapter, selectedVerse.verse);
      showToast("Bookmark removed");
    } else {
      await addBookmark(userDb, {
        book_id: selectedVerse.book_id,
        book_name: selectedVerse.book_name,
        chapter: selectedVerse.chapter,
        verse: selectedVerse.verse,
        text: selectedVerse.text,
      });
      showToast("Bookmarked ✓");
    }
    refreshAnnotations(bookIdNum, currentChapter);
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
    refreshAnnotations(bookIdNum, currentChapter);
  };

  const handleClearHighlight = async () => {
    if (!selectedVerse) return;
    await removeHighlightByVerse(userDb, selectedVerse.book_id, selectedVerse.chapter, selectedVerse.verse);
    showToast("Highlight cleared");
    refreshAnnotations(bookIdNum, currentChapter);
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
    refreshAnnotations(bookIdNum, currentChapter);
  };

  const handleShare = async (verse: ChapterVerse) => {
    const text = verse.text;
    await Share.share({
      message: `"${text}" — ${verse.book_name} ${verse.chapter}:${verse.verse} (${activeTranslation})`,
    });
  };

  const handleCopy = async (verse: ChapterVerse) => {
    const text = verse.text;
    if (Platform.OS === "web") {
      navigator.clipboard?.writeText(`"${text}" — ${verse.book_name} ${verse.chapter}:${verse.verse} (${activeTranslation})`);
    } else {
      Clipboard.setString(`"${text}" — ${verse.book_name} ${verse.chapter}:${verse.verse} (${activeTranslation})`);
    }
    showToast("Copied to clipboard ✓");
  };

  const handleOpenStudyDrawer = (tab: "crossref" | "lexicon") => {
    setStudyInitialTab(tab);
    setStudyDrawerVisible(true);
  };

  const handleNavigateFromStudy = (toBookId: number, toChapter: number, toVerse: number) => {
    if (toBookId === bookIdNum) {
      goToChapter(toChapter, toChapter > currentChapter ? "next" : "prev", toVerse);
    } else {
      router.push({
        pathname: "/reader/[bookId]/[chapter]",
        params: { bookId: toBookId.toString(), chapter: toChapter.toString(), verse: toVerse.toString() },
      });
    }
  };

  const styles = makeStyles(colors);

  const renderVerse = useCallback(
    ({ item }: { item: ChapterVerse }) => {
      const isSelected = selectedVerse?.verse === item.verse;
      const highlightColor = chapterHighlights[item.verse];
      const isBookmarked = chapterBookmarks.has(item.verse);
      const hasNote = chapterNotes.has(item.verse);
      const displayedText = item.text;

      return (
        <TouchableOpacity
          style={[
            styles.verseRow,
            isSelected && styles.verseSelected,
            highlightColor
              ? { backgroundColor: highlightColor + "18", borderLeftWidth: 3, borderLeftColor: highlightColor }
              : undefined,
          ]}
          onPress={() => setSelectedVerse((prev) => (prev?.verse === item.verse ? null : item))}
          activeOpacity={0.7}
        >
          {/* Verse Number & Badges */}
          <View style={styles.verseMetaColumn}>
            {showVerseNumbers && (
              <Text style={styles.verseNumber}>{item.verse}</Text>
            )}
            {isBookmarked && (
              <Ionicons name="bookmark" size={10} color="#FF6B35" style={{ marginTop: 2 }} />
            )}
            {hasNote && (
              <Ionicons name="create" size={10} color="#06D6A0" style={{ marginTop: 2 }} />
            )}
          </View>

          {/* Verse Text */}
          <Text style={[styles.verseText, { fontSize }]}>{displayedText}</Text>

          {/* Clean, Uncongested Action Bar when Verse is Selected */}
          {isSelected && (
            <View style={styles.verseActions}>
              {/* Color Highlighting Palette Row */}
              <View style={styles.colorRow}>
                {HIGHLIGHT_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorDot,
                      { backgroundColor: color },
                      highlightColor === color && styles.colorDotSelected,
                    ]}
                    onPress={() => handleHighlight(color)}
                  />
                ))}
                {highlightColor && (
                  <TouchableOpacity
                    style={styles.clearHighlightBtn}
                    onPress={handleClearHighlight}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle-outline" size={22} color={colors.muted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Primary 4 Action Buttons: Note, Bookmark, Cross-Ref, More */}
              <View style={styles.actionRow}>
                {/* Note Creator */}
                <TouchableOpacity style={styles.actionBtn} onPress={() => setNoteModal(true)}>
                  <View style={[styles.actionIconBox, { backgroundColor: "#06D6A018" }]}>
                    <Ionicons name="create-outline" size={18} color="#06D6A0" />
                  </View>
                  <Text style={styles.actionLabel}>Note</Text>
                </TouchableOpacity>

                {/* Bookmark Toggle */}
                <TouchableOpacity style={styles.actionBtn} onPress={handleToggleBookmark}>
                  <View style={[styles.actionIconBox, { backgroundColor: isBookmarked ? "#FF6B3522" : colors.background }]}>
                    <Ionicons
                      name={isBookmarked ? "bookmark" : "bookmark-outline"}
                      size={18}
                      color={isBookmarked ? "#FF6B35" : colors.text}
                    />
                  </View>
                  <Text style={styles.actionLabel}>{isBookmarked ? "Saved" : "Bookmark"}</Text>
                </TouchableOpacity>

                {/* Cross References / Study */}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleOpenStudyDrawer("crossref")}
                >
                  <View style={[styles.actionIconBox, { backgroundColor: "#38BDF818" }]}>
                    <Ionicons name="git-compare-outline" size={18} color="#38BDF8" />
                  </View>
                  <Text style={styles.actionLabel}>Cross-Refs</Text>
                </TouchableOpacity>

                {/* More Options (Word Study, Compare, Card, Share, Copy) */}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setMoreActionsVisible(true)}
                >
                  <View style={[styles.actionIconBox, { backgroundColor: "#7C3AED18" }]}>
                    <Ionicons name="ellipsis-horizontal" size={18} color="#7C3AED" />
                  </View>
                  <Text style={styles.actionLabel}>More</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [selectedVerse, fontSize, chapterHighlights, chapterBookmarks, chapterNotes, showVerseNumbers, activeTranslation, styles, colors]
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginRight: 8 }}>
              {/* Translation Badge */}
              <TouchableOpacity
                style={styles.translationBadge}
                onPress={() => router.push("/settings")}
              >
                <Text style={styles.translationBadgeText}>{activeTranslation}</Text>
              </TouchableOpacity>

              {/* Font Sizing */}
              <TouchableOpacity
                style={styles.headerFontBtn}
                onPress={() =>
                  setFontSize((f) => {
                    const next = Math.max(14, f - 2);
                    AsyncStorage.setItem("reader_font_size", next.toString());
                    return next;
                  })
                }
              >
                <Text style={styles.headerFontBtnText}>A-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerFontBtn}
                onPress={() =>
                  setFontSize((f) => {
                    const next = Math.min(28, f + 2);
                    AsyncStorage.setItem("reader_font_size", next.toString());
                    return next;
                  })
                }
              >
                <Text style={styles.headerFontBtnText}>A+</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* Chapter Navigation Bar */}
      <View style={styles.chapterNav}>
        <TouchableOpacity
          style={[styles.navBtn, currentChapter <= 1 && styles.navBtnDisabled]}
          onPress={() => goToChapter(currentChapter - 1, "prev")}
          disabled={currentChapter <= 1}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={currentChapter <= 1 ? colors.border : "#FF6B35"}
          />
          <Text style={[styles.navBtnText, currentChapter <= 1 && { color: colors.border }]}>
            Prev
          </Text>
        </TouchableOpacity>

        <Text style={styles.chapterIndicator}>
          {currentChapter} / {totalChapters}
        </Text>

        <TouchableOpacity
          style={[styles.navBtn, currentChapter >= totalChapters && styles.navBtnDisabled]}
          onPress={() => goToChapter(currentChapter + 1, "next")}
          disabled={currentChapter >= totalChapters}
        >
          <Text
            style={[styles.navBtnText, currentChapter >= totalChapters && { color: colors.border }]}
          >
            Next
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={currentChapter >= totalChapters ? colors.border : "#FF6B35"}
          />
        </TouchableOpacity>
      </View>

      {/* Verse List with Animated Slide */}
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

      {/* In-Reader Reading Plan Companion Bar */}
      {fromPlan && (
        <View style={styles.planCompanionBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.planCompanionSub}>
              {planName || "Reading Plan"} • Day {planDay}
            </Text>
            <Text style={styles.planCompanionTitle} numberOfLines={1}>
              {book?.name} {currentChapter}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.planCompanionBtn,
              isPlanChapterCompleted && styles.planCompanionBtnDone,
            ]}
            onPress={handleCompletePlanReading}
          >
            <Ionicons
              name={isPlanChapterCompleted ? "checkmark-circle" : "checkmark-circle-outline"}
              size={18}
              color="#fff"
            />
            <Text style={styles.planCompanionBtnText}>
              {isPlanChapterCompleted ? "Completed" : "Complete & Next"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Toast */}
      {toast !== "" && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Study Drawer (Cross-References & Strong's Lexicon) */}
      <StudyDrawer
        visible={studyDrawerVisible}
        verse={selectedVerse}
        db={db}
        initialTab={studyInitialTab}
        onClose={() => setStudyDrawerVisible(false)}
        onNavigateToPassage={handleNavigateFromStudy}
      />

      {/* More Actions Modal */}
      <MoreVerseActionsModal
        visible={moreActionsVisible}
        verse={selectedVerse}
        isHighlighted={selectedVerse ? !!chapterHighlights[selectedVerse.verse] : false}
        onClose={() => setMoreActionsVisible(false)}
        onOpenWordStudy={() => handleOpenStudyDrawer("lexicon")}
        onOpenCompare={() => setParallelModalVisible(true)}
        onOpenCardStudio={() => setShareStudioVisible(true)}
        onCopyVerse={() => selectedVerse && handleCopy(selectedVerse)}
        onShareVerse={() => selectedVerse && handleShare(selectedVerse)}
        onClearHighlight={handleClearHighlight}
      />

      {/* Parallel Translation Comparison Modal */}
      <ParallelTranslationModal
        visible={parallelModalVisible}
        verse={selectedVerse}
        onClose={() => setParallelModalVisible(false)}
      />

      {/* Verse Share Card Studio */}
      <VerseShareStudio
        visible={shareStudioVisible}
        verse={selectedVerse}
        onClose={() => setShareStudioVisible(false)}
      />

      {/* Note Creator Modal */}
      <Modal visible={noteModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Study Note</Text>
            {selectedVerse && (
              <Text style={styles.modalVerse} numberOfLines={3}>
                "{selectedVerse.text}" — {selectedVerse.book_name}{" "}
                {selectedVerse.chapter}:{selectedVerse.verse}
              </Text>
            )}
            <TextInput
              style={styles.noteInput}
              placeholder="Record your insights, cross references, or prayer..."
              placeholderTextColor={colors.muted}
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

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    headerFontBtn: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
    },
    headerFontBtnText: { fontFamily: "Syne-Bold", fontSize: 12, color: "#FF6B35" },
    translationBadge: {
      backgroundColor: "#FF6B3518",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#FF6B3544",
    },
    translationBadgeText: { fontFamily: "Syne-Bold", fontSize: 11, color: "#FF6B35" },
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
    verseMetaColumn: {
      alignItems: "center",
      marginRight: 8,
      marginTop: 4,
      minWidth: 20,
    },
    verseNumber: {
      fontFamily: "Syne-Bold",
      fontSize: 11,
      color: "#FF6B35",
    },
    verseText: { fontFamily: "Lora-Regular", color: c.text, lineHeight: 28, flex: 1 },
    verseActions: {
      width: "100%",
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    colorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 14,
      paddingHorizontal: 4,
    },
    colorDot: { width: 28, height: 28, borderRadius: 14 },
    colorDotSelected: { borderWidth: 2, borderColor: "#fff" },
    clearHighlightBtn: { padding: 4, marginLeft: 4 },
    actionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 4,
    },
    actionBtn: {
      alignItems: "center",
      gap: 6,
      flex: 1,
    },
    actionIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.border,
    },
    actionLabel: { fontFamily: "DMSans-Medium", fontSize: 11, color: c.muted },
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
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
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
    modalSave: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      backgroundColor: "#FF6B35",
      alignItems: "center",
    },
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
    planCompanionBar: {
      position: "absolute",
      bottom: 20,
      left: 16,
      right: 16,
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: "#FF6B3555",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 6,
      gap: 12,
    },
    planCompanionSub: { fontFamily: "DMSans-Medium", fontSize: 11, color: "#FF6B35", letterSpacing: 0.5 },
    planCompanionTitle: { fontFamily: "Syne-Bold", fontSize: 15, color: c.text, marginTop: 2 },
    planCompanionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#FF6B35",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
    },
    planCompanionBtnDone: {
      backgroundColor: "#06D6A0",
    },
    planCompanionBtnText: { fontFamily: "Syne-Bold", fontSize: 13, color: "#fff" },
  });
}
