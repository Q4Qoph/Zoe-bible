import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppColors } from "../../constants/theme";
import { useDatabase } from "../../src/db";
import { useTheme } from "../../src/contexts/ThemeContext";
import {
  Book,
  ChapterVerse,
  getBooks,
  getDailyVerse,
} from "../../src/db/queries";
import { useUserDatabase } from "../../src/db/UserDatabaseContext";
import { getActivePlans, getProgress } from "../../src/db/userDb";
import { READING_PLANS } from "../../constants/readingPlans";
import { getStreak } from "../../src/utils/streak";

function getDailySuggestedBookIds(): number[] {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  // Simple seeded shuffle of all 66 book IDs, pick first 6
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
  const [dailyVerse, setDailyVerse] = useState<ChapterVerse | null>(null);
  const [suggestedBooks, setSuggestedBooks] = useState<Book[]>([]);
  const [lastRead, setLastRead] = useState<{ bookId: number; bookName: string; chapter: number } | null>(null);
  const [streak, setStreak] = useState(0);
  const [activePlan, setActivePlan] = useState<{ id: string; name: string; color: string; icon: string; percent: number; completed: number; total: number } | null>(null);
  const greeting = getGreeting();

  useEffect(() => {
    getDailyVerse(db).then(setDailyVerse);
    const suggestedIds = getDailySuggestedBookIds();
    getBooks(db).then((all) =>
      setSuggestedBooks(
        suggestedIds.map((id) => all.find((b) => b.id === id)!).filter(Boolean),
      ),
    );
    AsyncStorage.getItem("last_read").then((v) => v && setLastRead(JSON.parse(v)));
    getStreak().then(setStreak);
    loadActivePlan();
  }, []);

  const loadActivePlan = async () => {
    const plans = await getActivePlans(userDb);
    if (plans.length === 0) return;
    const first = plans[0];
    const meta = READING_PLANS.find((p) => p.id === first.plan_id);
    if (!meta) return;
    const progress = await getProgress(userDb, first.plan_id);
    const total = meta.days.reduce((s, d) => s + d.readings.length, 0);
    const completed = progress.filter((r) => r.completed === 1).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    setActivePlan({ id: first.plan_id, name: first.plan_name, color: meta.color, icon: meta.icon, percent, completed, total });
  };

  const shareVOTD = (e: any) => {
    e.stopPropagation();
    if (!dailyVerse) return;
    Share.share({
      message: `"${dailyVerse.text}" — ${dailyVerse.book_name} ${dailyVerse.chapter}:${dailyVerse.verse} (BSB)`,
    });
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

        {/* Daily Verse Card */}
        {dailyVerse && (
          <TouchableOpacity
            style={styles.dailyCard}
            onPress={() =>
              router.push(`/reader/${dailyVerse.book_id}/${dailyVerse.chapter}`)
            }
            activeOpacity={0.85}
          >
            <View style={styles.dailyBadge}>
              <Ionicons name="sunny" size={12} color="#0F0F14" />
              <Text style={styles.dailyBadgeText}>Verse of the Day</Text>
            </View>
            <Text style={styles.dailyVerse}>"{dailyVerse.text}"</Text>
            <Text style={styles.dailyRef}>
              {dailyVerse.book_name} {dailyVerse.chapter}:{dailyVerse.verse}
            </Text>
            <View style={styles.readMoreRow}>
              <Text style={styles.readMore}>Read chapter</Text>
              <Ionicons name="arrow-forward" size={14} color="#FF6B35" />
              <TouchableOpacity onPress={shareVOTD} style={styles.shareVOTD}>
                <Ionicons name="share-outline" size={16} color="#FF6B35" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* Active Plan Progress */}
        {activePlan ? (
          <TouchableOpacity
            style={[styles.planProgress, { borderColor: activePlan.color + "44" }]}
            onPress={() => router.push(`/plan/${activePlan.id}` as any)}
          >
            <View style={styles.planProgressTop}>
              <Text style={styles.planProgressIcon}>{activePlan.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.planProgressName}>{activePlan.name}</Text>
                <Text style={styles.planProgressSub}>{activePlan.completed} of {activePlan.total} chapters done</Text>
              </View>
              <Text style={[styles.planProgressPct, { color: activePlan.color }]}>{activePlan.percent}%</Text>
            </View>
            <View style={styles.planProgressBar}>
              <View style={[styles.planProgressFill, { width: `${activePlan.percent}%` as any, backgroundColor: activePlan.color }]} />
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
            <Text style={styles.sermonTitle}>📝 In a session right now?</Text>
            <Text style={styles.sermonSub}>
              Open session mode — notes & verses, fast
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#7C3AED" />
        </TouchableOpacity>

        {/* Reading Plans */}
        <View style={[styles.section, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Reading Plans</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { id: "nt-30", icon: "✝️", name: "NT in 30 Days", color: "#FF6B35" },
              { id: "psalms-30", icon: "🎵", name: "Psalms in 30 Days", color: "#7C3AED" },
              { id: "beginners-7", icon: "🌱", name: "Beginners Week", color: "#06D6A0" },
              { id: "proverbs-31", icon: "💡", name: "Proverbs in 31 Days", color: "#F59E0B" },
            ].map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, { borderColor: plan.color + "44" }]}
                onPress={() => router.push(`/plan/${plan.id}` as any)}
              >
                <Text style={styles.planIcon}>{plan.icon}</Text>
                <Text style={styles.planName}>{plan.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning 🌅";
  if (hour < 17) return "Good afternoon ☀️";
  return "Good evening 🌙";
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { paddingBottom: 40 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 16,
    },
    greetingRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
    greeting: { fontFamily: "Syne-Bold", fontSize: 26, color: c.text },
    streakBadge: {
      backgroundColor: "#FF6B3522",
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: "#FF6B3544",
    },
    streakText: { fontFamily: "DMSans-Medium", fontSize: 13, color: "#FF6B35" },
    tagline: { fontFamily: "DMSans-Regular", fontSize: 14, color: c.muted, marginTop: 4 },
    headerActions: { flexDirection: "row", gap: 8 },
    headerBtn: {
      backgroundColor: c.surface,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
    },

    // Resume reading
    resumeCard: {
      marginHorizontal: 24,
      marginBottom: 16,
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

    // Daily verse
    dailyCard: {
      marginHorizontal: 24,
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: 32,
    },
    dailyBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FF6B35",
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      gap: 4,
      marginBottom: 16,
    },
    dailyBadgeText: { fontFamily: "DMSans-Medium", fontSize: 11, color: "#0F0F14" },
    dailyVerse: {
      fontFamily: "Lora-Regular",
      fontSize: 17,
      color: c.text,
      lineHeight: 28,
      marginBottom: 12,
    },
    dailyRef: { fontFamily: "DMSans-Medium", fontSize: 13, color: "#FF6B35", marginBottom: 16 },
    readMoreRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    readMore: { fontFamily: "DMSans-Medium", fontSize: 13, color: "#FF6B35" },
    shareVOTD: { marginLeft: "auto" as any, padding: 4 },

    // Plan progress / nudge
    section: { paddingHorizontal: 24, marginBottom: 32 },
    sectionTitle: { fontFamily: "Syne-Bold", fontSize: 18, color: c.text, marginBottom: 16 },
    planProgress: {
      marginHorizontal: 24,
      marginBottom: 32,
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
    },
    planProgressTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
    planProgressIcon: { fontSize: 28 },
    planProgressName: { fontFamily: "Syne-Bold", fontSize: 14, color: c.text },
    planProgressSub: { fontFamily: "DMSans-Regular", fontSize: 12, color: c.muted, marginTop: 2 },
    planProgressPct: { fontFamily: "Syne-Bold", fontSize: 18 },
    planProgressBar: { height: 6, backgroundColor: c.border, borderRadius: 3 },
    planProgressFill: { height: 6, borderRadius: 3 },
    planNudge: {
      marginHorizontal: 24,
      marginBottom: 32,
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

    // Suggested books
    bookChip: {
      backgroundColor: c.surface,
      borderRadius: 20,
      paddingHorizontal: 18,
      paddingVertical: 10,
      marginRight: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    bookChipText: { fontFamily: "DMSans-Medium", fontSize: 13, color: c.text },

    // Session banner
    sermonBanner: {
      marginHorizontal: 24,
      backgroundColor: "#7C3AED22",
      borderRadius: 16,
      padding: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#7C3AED44",
    },
    sermonTitle: { fontFamily: "Syne-Bold", fontSize: 15, color: c.text, marginBottom: 4 },
    sermonSub: { fontFamily: "DMSans-Regular", fontSize: 12, color: c.muted, maxWidth: 220 },

    // Plans
    planCard: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 16,
      marginRight: 12,
      width: 130,
      borderWidth: 1,
      alignItems: "center",
      gap: 8,
    },
    planIcon: { fontSize: 28 },
    planName: { fontFamily: "DMSans-Medium", fontSize: 12, color: c.text, textAlign: "center" },
  });
}
