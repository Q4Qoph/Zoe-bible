import { READING_PLANS, ReadingPlan } from "@/constants/readingPlans";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { AppColors } from "../../constants/theme";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useUserDatabase } from "../../src/db/UserDatabaseContext";
import {
    deletePlan,
    deleteCustomPlan,
    getCustomPlan,
    getProgress,
    markChapterComplete,
    startPlan,
} from "../../src/db/userDb";
import { updateStreak } from "../../src/utils/streak";

export default function PlanDetailScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const userDb = useUserDatabase();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    if (!planId) return;
    const found = READING_PLANS.find((p) => p.id === planId);
    if (found) {
      setPlan(found);
      loadProgress(planId);
    } else {
      getCustomPlan(userDb, planId)
        .then((row) => {
          if (row) {
            setPlan({
              id: row.plan_id,
              name: row.name,
              icon: row.icon,
              color: row.color,
              description: "Custom reading plan",
              duration: `${JSON.parse(row.days).length} days`,
              days: JSON.parse(row.days),
            });
            loadProgress(planId);
          }
        })
        .catch(() => {
          // custom_plans table may not exist on older installs — safe to ignore
        });
    }
  }, [planId]);

  const loadProgress = async (id: string) => {
    const rows = await getProgress(userDb, id);
    const map: Record<string, boolean> = {};
    rows.forEach((r) => {
      map[`${r.day}-${r.book_id}-${r.chapter}`] = r.completed === 1;
    });
    setProgress(map);
    setIsEnrolled(rows.length > 0);
  };

  const handleEnroll = async () => {
    if (!plan) return;
    await startPlan(userDb, plan.id, plan.name);
    setIsEnrolled(true);
    Alert.alert("🎉 Enrolled!", `You've started "${plan.name}". Let's go!`);
  };

  const handleComplete = async (
    day: number,
    bookId: number,
    bookName: string,
    chapter: number,
  ) => {
    if (!plan) return;
    if (!isEnrolled) {
      handleEnroll();
      return;
    }
    const key = `${day}-${bookId}-${chapter}`;
    if (progress[key]) return;
    await markChapterComplete(userDb, plan.id, day, bookId, bookName, chapter);
    setProgress((prev) => ({ ...prev, [key]: true }));
    await updateStreak();
  };

  const handleDelete = () => {
    Alert.alert("Remove Plan", "Remove this plan and all progress?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          if (!plan) return;
          if (plan.id.startsWith("custom_")) {
            await deleteCustomPlan(userDb, plan.id);
          } else {
            await deletePlan(userDb, plan.id);
          }
          router.back();
        },
      },
    ]);
  };

  if (!plan) return null;

  const styles = makeStyles(colors);

  const totalChapters = plan.days.reduce((sum, d) => sum + d.readings.length, 0);
  const completedCount = Object.values(progress).filter(Boolean).length;
  const percent = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <Stack.Screen options={{ title: plan.name }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: plan.color + "22", borderColor: plan.color + "44" }]}>
          <Text style={styles.heroIcon}>{plan.icon}</Text>
          <Text style={styles.heroName}>{plan.name}</Text>
          <Text style={styles.heroDesc}>{plan.description}</Text>
          <View style={styles.heroBadges}>
            <View style={styles.badge}>
              <Ionicons name="calendar-outline" size={13} color={plan.color} />
              <Text style={[styles.badgeText, { color: plan.color }]}>{plan.duration}</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="book-outline" size={13} color={plan.color} />
              <Text style={[styles.badgeText, { color: plan.color }]}>{totalChapters} chapters</Text>
            </View>
          </View>
        </View>

        {/* Progress bar */}
        {isEnrolled && (
          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <Text style={styles.progressLabel}>Your Progress</Text>
              <Text style={styles.progressPct}>{percent}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${percent}%` as any, backgroundColor: plan.color }]} />
            </View>
            <Text style={styles.progressSub}>{completedCount} of {totalChapters} chapters completed</Text>
          </View>
        )}

        {/* Enroll / Delete */}
        {!isEnrolled ? (
          <TouchableOpacity style={[styles.enrollBtn, { backgroundColor: plan.color }]} onPress={handleEnroll}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.enrollBtnText}>Start This Plan</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={16} color="#FF6B35" />
            <Text style={styles.deleteBtnText}>Remove Plan</Text>
          </TouchableOpacity>
        )}

        {/* Days */}
        <Text style={styles.sectionTitle}>Reading Schedule</Text>
        {plan.days.map((planDay) => {
          const allDone = planDay.readings.every(
            (r) => progress[`${planDay.day}-${r.bookId}-${r.chapter}`],
          );
          return (
            <View key={planDay.day} style={[styles.dayCard, allDone && styles.dayCardDone]}>
              <View style={styles.dayHeader}>
                <View style={[styles.dayBadge, { backgroundColor: allDone ? "#06D6A0" : plan.color + "33" }]}>
                  <Text style={[styles.dayNum, { color: allDone ? "#fff" : plan.color }]}>
                    Day {planDay.day}
                  </Text>
                </View>
                {allDone && <Ionicons name="checkmark-circle" size={20} color="#06D6A0" />}
              </View>
              {planDay.readings.map((r) => {
                const key = `${planDay.day}-${r.bookId}-${r.chapter}`;
                const done = progress[key] || false;
                return (
                  <View key={key} style={styles.readingRow}>
                    <TouchableOpacity
                      style={styles.readingLink}
                      onPress={() => router.push(`/reader/${r.bookId}/${r.chapter}`)}
                    >
                      <Ionicons name="book-outline" size={14} color={plan.color} />
                      <Text style={styles.readingText}>{r.bookName} {r.chapter}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.doneBtn, done && styles.doneBtnActive]}
                      onPress={() => handleComplete(planDay.day, r.bookId, r.bookName, r.chapter)}
                    >
                      <Ionicons
                        name={done ? "checkmark-circle" : "ellipse-outline"}
                        size={22}
                        color={done ? "#06D6A0" : colors.muted}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { padding: 24, paddingBottom: 60 },
    hero: { borderRadius: 20, padding: 24, marginBottom: 20, borderWidth: 1, alignItems: "center" },
    heroIcon: { fontSize: 40, marginBottom: 12 },
    heroName: { fontFamily: "Syne-Bold", fontSize: 22, color: c.text, textAlign: "center", marginBottom: 8 },
    heroDesc: { fontFamily: "DMSans-Regular", fontSize: 14, color: c.muted, textAlign: "center", lineHeight: 22 },
    heroBadges: { flexDirection: "row", gap: 12, marginTop: 16 },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: c.background,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    badgeText: { fontFamily: "DMSans-Medium", fontSize: 12 },

    progressCard: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    progressTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
    progressLabel: { fontFamily: "DMSans-Medium", fontSize: 13, color: c.text },
    progressPct: { fontFamily: "Syne-Bold", fontSize: 13, color: "#06D6A0" },
    progressBar: { height: 6, backgroundColor: c.border, borderRadius: 3, marginBottom: 8 },
    progressFill: { height: 6, borderRadius: 3 },
    progressSub: { fontFamily: "DMSans-Regular", fontSize: 12, color: c.muted },

    enrollBtn: {
      borderRadius: 14,
      padding: 16,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
      marginBottom: 24,
    },
    enrollBtnText: { fontFamily: "Syne-Bold", fontSize: 16, color: "#fff" },
    deleteBtn: {
      borderRadius: 14,
      padding: 12,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: "#FF6B3533",
      backgroundColor: "#FF6B3511",
    },
    deleteBtnText: { fontFamily: "DMSans-Medium", fontSize: 14, color: "#FF6B35" },

    sectionTitle: { fontFamily: "Syne-Bold", fontSize: 18, color: c.text, marginBottom: 16 },
    dayCard: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    dayCardDone: { borderColor: "#06D6A033", backgroundColor: "#06D6A011" },
    dayHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    dayBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
    dayNum: { fontFamily: "Syne-Bold", fontSize: 13 },
    readingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 6,
    },
    readingLink: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
    readingText: { fontFamily: "DMSans-Medium", fontSize: 14, color: c.text },
    doneBtn: { padding: 4 },
    doneBtnActive: {},
  });
}
