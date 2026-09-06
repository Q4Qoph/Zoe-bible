import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import VerseShareStudio from "../../components/VerseShareStudio";
import { AppColors } from "../../constants/theme";
import { useDatabase } from "../../src/db";
import { useTheme } from "../../src/contexts/ThemeContext";
import {
  Book,
  DailyVerseResult,
  getBooks,
  getDailyVerse,
} from "../../src/db/queries";
import { useUserDatabase } from "../../src/db/UserDatabaseContext";
import {
  addBookmark,
  getActivePlans,
  getCustomPlan,
  getProgress,
} from "../../src/db/userDb";
import { READING_PLANS } from "../../constants/readingPlans";
import { getStreak } from "../../src/utils/streak";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getDailySuggestedBookIds(): number[] {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const ids = Array.from({ length: 66 }, (_, i) => i + 1);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = (seed * (i + 1) * 2654435761) % (i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, 6);
}

export default function HomeScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors);

  const userDb = useUserDatabase();
  const [dailyVerse, setDailyVerse] = useState<DailyVerseResult | null>(null);
  const [suggestedBooks, setSuggestedBooks] = useState<Book[]>([]);
  const [lastRead, setLastRead] = useState<{ bookId: number; bookName: string; chapter: number } | null>(null);
  const [streak, setStreak] = useState(0);
  const [activePlan, setActivePlan] = useState<{
    id: string;
    name: string;
    color: string;
    icon: string;
    percent: number;
    completed: number;
    total: number;
    currentDay?: number;
    todaySummary?: string;
    firstUnread?: { bookId: number; chapter: number };
  } | null>(null);

  const [shareStudioVisible, setShareStudioVisible] = useState(false);
  const [toast, setToast] = useState("");
  const greeting = getGreeting();

  useEffect(() => {
    getDailyVerse(db).then((res) => setDailyVerse(res as any));
    const suggestedIds = getDailySuggestedBookIds();
    getBooks(db).then((all) =>
      setSuggestedBooks(
        suggestedIds.map((id) => all.find((b) => b.id === id)!).filter(Boolean)
      )
    );
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("last_read").then((v) => v && setLastRead(JSON.parse(v)));
      getStreak().then(setStreak);
      loadActivePlan();
    }, [userDb])
  );

  const loadActivePlan = async () => {
    const plans = await getActivePlans(userDb);
    if (plans.length === 0) {
      setActivePlan(null);
      return;
    }
    const first = plans[0];
    let planData: any = READING_PLANS.find((p) => p.id === first.plan_id);
    if (!planData) {
      const customRow = await getCustomPlan(userDb, first.plan_id);
      if (customRow) {
        try {
          planData = {
            id: customRow.plan_id,
            name: customRow.name,
            icon: customRow.icon,
            color: customRow.color,
            days: JSON.parse(customRow.days),
          };
        } catch {}
      }
    }
    if (!planData) return;

    const progress = await getProgress(userDb, first.plan_id);
    const progressMap = new Set(
      progress.filter((r) => r.completed === 1).map((r) => `${r.day}-${r.book_id}-${r.chapter}`)
    );

    const total = planData.days.reduce((s: number, d: any) => s + d.readings.length, 0);
    const completed = progress.filter((r) => r.completed === 1).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const activeDay =
      planData.days.find((d: any) =>
        d.readings.some((r: any) => !progressMap.has(`${d.day}-${r.bookId}-${r.chapter}`))
      ) || planData.days[0];

    const unreadReading = activeDay
      ? activeDay.readings.find((r: any) => !progressMap.has(`${activeDay.day}-${r.bookId}-${r.chapter}`))
      : null;

    const todaySummary = activeDay
      ? `Day ${activeDay.day}: ` + activeDay.readings.map((r: any) => `${r.bookName} ${r.chapter}`).join(", ")
      : "";

    setActivePlan({
      id: first.plan_id,
      name: first.plan_name,
      color: planData.color || "#FF6B35",
      icon: planData.icon || "📖",
      percent,
      completed,
      total,
      currentDay: activeDay?.day,
      todaySummary,
      firstUnread: unreadReading ? { bookId: unreadReading.bookId, chapter: unreadReading.chapter } : undefined,
    });
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const shareVOTD = async () => {
    if (!dailyVerse) return;
    await Share.share({
      message: `"${dailyVerse.text}" — ${dailyVerse.book_name} ${dailyVerse.chapter}:${dailyVerse.verse} (BSB)\n\nDaily Reflection: ${dailyVerse.devotional?.reflection || ""}\nShared via Zoe Bible`,
    });
  };

  const bookmarkVOTD = async () => {
    if (!dailyVerse) return;
    await addBookmark(userDb, {
      book_id: dailyVerse.book_id,
      book_name: dailyVerse.book_name,
      chapter: dailyVerse.chapter,
      verse: dailyVerse.verse,
      text: dailyVerse.text,
    });
    showToast("Saved to Library ✓");
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={styles.greetingRow}>
              <Text style={styles.greeting}>{greeting}</Text>
              {streak > 0 && (
                <View style={styles.streakBadge}>
                  <Text style={styles.streakText}>🔥 {streak}</Text>
                </View>
              )}
            </View>
            <Text style={styles.tagline}>What will you read today?</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.push("/settings" as any)}
            >
              <Ionicons name="settings-outline" size={20} color={colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.push("/search")}
            >
              <Ionicons name="search" size={20} color="#FF6B35" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Resume Reading */}
        {lastRead && (
          <TouchableOpacity
            style={styles.resumeCard}
            onPress={() => router.push(`/reader/${lastRead.bookId}/${lastRead.chapter}` as any)}
          >
            <Ionicons name="book" size={16} color="#FF6B35" />
            <Text style={styles.resumeText}>
              Continue — {lastRead.bookName} {lastRead.chapter}
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#FF6B35" />
          </TouchableOpacity>
        )}

        {/* Curated Verse of the Day Card */}
        {dailyVerse && (
          <View style={styles.dailyCard}>
            {/* Top Badge & Date */}
            <View style={styles.dailyHeader}>
              <View style={styles.dailyBadge}>
                <Ionicons name="sunny" size={12} color="#FF6B35" />
                <Text style={styles.dailyBadgeText}>Verse of the Day</Text>
              </View>
              <Text style={styles.dailyDate}>
                {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </Text>
            </View>

            {/* Scripture Verse */}
            <Text style={styles.dailyVerse}>"{dailyVerse.text}"</Text>
            <Text style={styles.dailyRef}>
              {dailyVerse.book_name} {dailyVerse.chapter}:{dailyVerse.verse}
            </Text>

            {/* Concise Daily Reflection */}
            {dailyVerse.devotional?.reflection ? (
              <View style={styles.reflectionBox}>
                <View style={styles.reflectionHeader}>
                  <Ionicons name="bulb-outline" size={13} color="#FF6B35" />
                  <Text style={styles.reflectionLabel}>DAILY THOUGHT</Text>
                </View>
                <Text style={styles.reflectionText}>
                  {dailyVerse.devotional.reflection}
                </Text>
              </View>
            ) : null}

            {/* Clean, Simple 4-Button Action Bar */}
            <View style={styles.actionRow}>
              {/* Studio Card */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setShareStudioVisible(true)}
              >
                <View style={[styles.actionIcon, { backgroundColor: "#FF6B3518" }]}>
                  <Ionicons name="sparkles-outline" size={16} color="#FF6B35" />
                </View>
                <Text style={styles.actionLabel}>Card</Text>
              </TouchableOpacity>

              {/* Bookmark */}
              <TouchableOpacity style={styles.actionBtn} onPress={bookmarkVOTD}>
                <View style={[styles.actionIcon, { backgroundColor: "#06D6A018" }]}>
                  <Ionicons name="bookmark-outline" size={16} color="#06D6A0" />
                </View>
                <Text style={styles.actionLabel}>Save</Text>
              </TouchableOpacity>

              {/* Share */}
              <TouchableOpacity style={styles.actionBtn} onPress={shareVOTD}>
                <View style={[styles.actionIcon, { backgroundColor: "#38BDF818" }]}>
                  <Ionicons name="share-outline" size={16} color="#38BDF8" />
                </View>
                <Text style={styles.actionLabel}>Share</Text>
              </TouchableOpacity>

              {/* Read Chapter */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() =>
                  router.push({
                    pathname: "/reader/[bookId]/[chapter]",
                    params: {
                      bookId: dailyVerse.book_id.toString(),
                      chapter: dailyVerse.chapter.toString(),
                      verse: dailyVerse.verse.toString(),
                    },
                  })
                }
              >
                <View style={[styles.actionIcon, { backgroundColor: "#7C3AED18" }]}>
                  <Ionicons name="arrow-forward" size={16} color="#7C3AED" />
                </View>
                <Text style={styles.actionLabel}>Read</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Active Plan Progress */}
        {activePlan ? (
          <TouchableOpacity
            style={[styles.planProgress, { borderColor: activePlan.color + "44" }]}
            onPress={() =>
              router.push({
                pathname: "/plan/[planId]",
                params: { planId: activePlan.id },
              })
            }
          >
            <View style={styles.planProgressTop}>
              <Text style={styles.planProgressIcon}>{activePlan.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.planProgressName}>{activePlan.name}</Text>
                <Text style={styles.planProgressSub}>
                  {activePlan.todaySummary
                    ? activePlan.todaySummary
                    : `${activePlan.completed} of ${activePlan.total} chapters done`}
                </Text>
              </View>
              <Text style={[styles.planProgressPct, { color: activePlan.color }]}>
                {activePlan.percent}%
              </Text>
            </View>
            <View style={styles.planProgressBar}>
              <View
                style={[
                  styles.planProgressFill,
                  { width: `${activePlan.percent}%` as any, backgroundColor: activePlan.color },
                ]}
              />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.planNudge}
            onPress={() => router.push("/library" as any)}
          >
            <Ionicons name="calendar-outline" size={20} color="#7C3AED" />
            <View style={{ flex: 1 }}>
              <Text style={styles.planNudgeTitle}>Start a reading plan</Text>
              <Text style={styles.planNudgeSub}>Stay consistent with guided daily readings</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#7C3AED" />
          </TouchableOpacity>
        )}

        {/* Suggested Books */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start Reading</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {suggestedBooks.map((book) => (
              <TouchableOpacity
                key={book.id}
                style={styles.bookChip}
                onPress={() => router.push(`/reader/${book.id}`)}
              >
                <Text style={styles.bookChipText}>{book.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Session CTA */}
        <TouchableOpacity
          style={styles.sermonBanner}
          onPress={() => router.push("/session")}
        >
          <View>
            <Text style={styles.sermonTitle}>📝 In a sermon right now?</Text>
            <Text style={styles.sermonSub}>Open session mode — record notes & scriptures fast</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#7C3AED" />
        </TouchableOpacity>

        {/* Reading Plans */}
        <View style={[styles.section, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Reading Plans</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { id: "bible-365", icon: "📖", name: "Bible in 1 Year", color: "#FF6B35" },
              { id: "nt-90", icon: "✝️", name: "NT in 90 Days", color: "#3B82F6" },
              { id: "gospels-30", icon: "👑", name: "Gospels in 30 Days", color: "#EC4899" },
              { id: "epistles-30", icon: "📜", name: "Epistles in 30 Days", color: "#8B5CF6" },
              { id: "psalms-30", icon: "🎵", name: "Psalms in 30 Days", color: "#7C3AED" },
              { id: "proverbs-31", icon: "💡", name: "Proverbs in 31 Days", color: "#F59E0B" },
              { id: "peace-7", icon: "🕊️", name: "Peace & Anxiety", color: "#06D6A0" },
              { id: "faith-14", icon: "🛡️", name: "Faith & Victory", color: "#10B981" },
              { id: "beginners-7", icon: "🌱", name: "Beginners Week", color: "#14B8A6" },
            ].map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, { borderColor: plan.color + "44" }]}
                onPress={() =>
                  router.push({
                    pathname: "/plan/[planId]",
                    params: { planId: plan.id },
                  })
                }
              >
                <Text style={styles.planIcon}>{plan.icon}</Text>
                <Text style={styles.planName}>{plan.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Verse Card Studio Modal */}
      <VerseShareStudio
        visible={shareStudioVisible}
        verse={dailyVerse}
        onClose={() => setShareStudioVisible(false)}
      />

      {/* Floating Toast */}
      {toast !== "" && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { paddingBottom: 60 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 20,
    },
    greetingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    greeting: { fontFamily: "Syne-Bold", fontSize: 24, color: c.text },
    streakBadge: {
      backgroundColor: "#FF6B3518",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#FF6B3533",
    },
    streakText: { fontFamily: "Syne-Bold", fontSize: 12, color: "#FF6B35" },
    tagline: { fontFamily: "DMSans-Regular", fontSize: 13, color: c.muted, marginTop: 2 },
    headerActions: { flexDirection: "row", gap: 8 },
    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: c.surface,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.border,
    },

    resumeCard: {
      marginHorizontal: 24,
      marginBottom: 20,
      backgroundColor: c.surface,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: c.border,
      borderLeftWidth: 3,
      borderLeftColor: "#FF6B35",
    },
    resumeText: { flex: 1, fontFamily: "DMSans-Medium", fontSize: 14, color: c.text },

    // Curated Daily verse
    dailyCard: {
      marginHorizontal: 24,
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 22,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 28,
    },
    dailyHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    dailyBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FF6B3518",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      gap: 4,
    },
    dailyBadgeText: { fontFamily: "Syne-Bold", fontSize: 10, color: "#FF6B35", letterSpacing: 0.5 },
    dailyDate: { fontFamily: "DMSans-Medium", fontSize: 11, color: c.muted },
    dailyVerse: {
      fontFamily: "Lora-Regular",
      fontSize: 16,
      color: c.text,
      lineHeight: 26,
      marginBottom: 8,
    },
    dailyRef: { fontFamily: "Syne-Bold", fontSize: 13, color: "#FF6B35", marginBottom: 14 },

    reflectionBox: {
      backgroundColor: c.background,
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    reflectionHeader: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
    reflectionLabel: { fontFamily: "Syne-Bold", fontSize: 9, color: "#FF6B35", letterSpacing: 0.5 },
    reflectionText: { fontFamily: "DMSans-Regular", fontSize: 12, color: c.muted, lineHeight: 18 },

    actionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: c.border + "66",
    },
    actionBtn: { alignItems: "center", gap: 4, flex: 1 },
    actionIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    actionLabel: { fontFamily: "DMSans-Medium", fontSize: 11, color: c.muted },

    // Plan progress / nudge
    section: { paddingHorizontal: 24, marginBottom: 28 },
    sectionTitle: { fontFamily: "Syne-Bold", fontSize: 17, color: c.text, marginBottom: 14 },
    planProgress: {
      marginHorizontal: 24,
      marginBottom: 28,
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
    },
    planProgressTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
    planProgressIcon: { fontSize: 26 },
    planProgressName: { fontFamily: "Syne-Bold", fontSize: 14, color: c.text },
    planProgressSub: { fontFamily: "DMSans-Regular", fontSize: 12, color: c.muted, marginTop: 2 },
    planProgressPct: { fontFamily: "Syne-Bold", fontSize: 17 },
    planProgressBar: { height: 6, backgroundColor: c.border, borderRadius: 3 },
    planProgressFill: { height: 6, borderRadius: 3 },
    planNudge: {
      marginHorizontal: 24,
      marginBottom: 28,
      backgroundColor: "#7C3AED11",
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: "#7C3AED33",
    },
    planNudgeTitle: { fontFamily: "Syne-Bold", fontSize: 14, color: c.text },
    planNudgeSub: { fontFamily: "DMSans-Regular", fontSize: 12, color: c.muted, marginTop: 2 },

    bookChip: {
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginRight: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    bookChipText: { fontFamily: "DMSans-Medium", fontSize: 13, color: c.text },

    sermonBanner: {
      marginHorizontal: 24,
      marginBottom: 28,
      backgroundColor: "#7C3AED18",
      borderRadius: 16,
      padding: 18,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#7C3AED33",
    },
    sermonTitle: { fontFamily: "Syne-Bold", fontSize: 14, color: c.text, marginBottom: 3 },
    sermonSub: { fontFamily: "DMSans-Regular", fontSize: 12, color: c.muted, maxWidth: 220 },

    planCard: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 16,
      marginRight: 10,
      width: 125,
      borderWidth: 1,
      alignItems: "center",
      gap: 6,
    },
    planIcon: { fontSize: 26 },
    planName: { fontFamily: "DMSans-Medium", fontSize: 12, color: c.text, textAlign: "center" },

    toast: {
      position: "absolute",
      bottom: 80,
      alignSelf: "center",
      backgroundColor: c.surface,
      paddingHorizontal: 18,
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
  });
}
