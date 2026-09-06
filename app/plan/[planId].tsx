import { READING_PLANS, ReadingPlan } from "@/constants/readingPlans";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useMemo } from "react";
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
  completeDayInPlan,
  deleteCustomPlan,
  deletePlan,
  getCustomPlan,
  getProgress,
  isPlanEnrolled,
  startPlan,
  toggleChapterProgress,
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
              category: "short",
              description: "Custom personal reading plan",
              duration: `${JSON.parse(row.days).length} days`,
              days: JSON.parse(row.days),
            });
            loadProgress(planId);
          }
        })
        .catch(() => {
          // safe ignore
        });
    }
  }, [planId]);

  const loadProgress = async (id: string) => {
    const [rows, enrolled] = await Promise.all([
      getProgress(userDb, id),
      isPlanEnrolled(userDb, id),
    ]);
    const map: Record<string, boolean> = {};
    rows.forEach((r) => {
      map[`${r.day}-${r.book_id}-${r.chapter}`] = r.completed === 1;
    });
    setProgress(map);
    setIsEnrolled(enrolled || rows.length > 0);
  };

  const handleEnroll = async () => {
    if (!plan) return;
    await startPlan(userDb, plan.id, plan.name);
    setIsEnrolled(true);
    Alert.alert("🎉 Plan Started!", `You are now enrolled in "${plan.name}". Happy reading!`);
  };

  const handleToggle = async (
    day: number,
    bookId: number,
    bookName: string,
    chapter: number
  ) => {
    if (!plan) return;
    if (!isEnrolled) {
      await startPlan(userDb, plan.id, plan.name);
      setIsEnrolled(true);
    }
    const key = `${day}-${bookId}-${chapter}`;
    const nextState = await toggleChapterProgress(
      userDb,
      plan.id,
      day,
      bookId,
      bookName,
      chapter
    );
    setProgress((prev) => ({ ...prev, [key]: nextState }));
    if (nextState) {
      await updateStreak();
    }
  };

  const handleCompleteDay = async (dayObj: { day: number; readings: any[] }) => {
    if (!plan) return;
    if (!isEnrolled) {
      await startPlan(userDb, plan.id, plan.name);
      setIsEnrolled(true);
    }
    await completeDayInPlan(userDb, plan.id, dayObj.day, dayObj.readings);
    const newProgress = { ...progress };
    dayObj.readings.forEach((r) => {
      newProgress[`${dayObj.day}-${r.bookId}-${r.chapter}`] = true;
    });
    setProgress(newProgress);
    await updateStreak();
  };

  const handleDelete = () => {
    Alert.alert("Remove Plan", "Remove this plan and reset its progress?", [
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

  const totalChapters = useMemo(
    () => (plan ? plan.days.reduce((sum, d) => sum + d.readings.length, 0) : 0),
    [plan]
  );
  const completedCount = useMemo(
    () => Object.values(progress).filter(Boolean).length,
    [progress]
  );
  const percent = totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0;

  // Compute the current active day (first uncompleted day)
  const activeDay = useMemo(() => {
    if (!plan) return null;
    return (
      plan.days.find((d) =>
        d.readings.some((r) => !progress[`${d.day}-${r.bookId}-${r.chapter}`])
      ) || plan.days[plan.days.length - 1]
    );
  }, [plan, progress]);

  // First unread reading in active day
  const nextReading = useMemo(() => {
    if (!activeDay) return null;
    return activeDay.readings.find(
      (r) => !progress[`${activeDay.day}-${r.bookId}-${r.chapter}`]
    ) || activeDay.readings[0];
  }, [activeDay, progress]);

  if (!plan) return null;

  const styles = makeStyles(colors);

  const openReaderWithPlan = (dayNum: number, bookId: number, chapter: number) => {
    router.push({
      pathname: "/reader/[bookId]/[chapter]",
      params: {
        bookId: bookId.toString(),
        chapter: chapter.toString(),
        fromPlan: plan.id,
        planName: plan.name,
        planDay: dayNum.toString(),
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <Stack.Screen options={{ title: plan.name }} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={[styles.hero, { backgroundColor: plan.color + "16", borderColor: plan.color + "33" }]}>
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

        {/* Progress Card */}
        {isEnrolled && (
          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <Text style={styles.progressLabel}>Overall Progress</Text>
              <Text style={[styles.progressPct, { color: percent === 100 ? "#06D6A0" : plan.color }]}>
                {percent}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${percent}%` as any, backgroundColor: percent === 100 ? "#06D6A0" : plan.color },
                ]}
              />
            </View>
            <Text style={styles.progressSub}>
              {completedCount} of {totalChapters} chapters completed
            </Text>
          </View>
        )}

        {/* 100% Completion Celebration */}
        {percent === 100 && (
          <View style={styles.celebrationCard}>
            <Text style={styles.celebrationIcon}>🏆</Text>
            <Text style={styles.celebrationTitle}>Plan Completed!</Text>
            <Text style={styles.celebrationSub}>
              Praise God! You have finished all readings in {plan.name}.
            </Text>
          </View>
        )}

        {/* Today's Reading Target (If enrolled and not finished) */}
        {isEnrolled && activeDay && percent < 100 && nextReading && (
          <View style={[styles.targetCard, { borderColor: plan.color + "55" }]}>
            <View style={styles.targetHeader}>
              <View style={[styles.targetTag, { backgroundColor: plan.color + "22" }]}>
                <Ionicons name="flash" size={12} color={plan.color} />
                <Text style={[styles.targetTagText, { color: plan.color }]}>TODAY'S TARGET</Text>
              </View>
              <Text style={styles.targetDayTitle}>Day {activeDay.day}</Text>
            </View>
            <Text style={styles.targetChapters}>
              {activeDay.readings.map((r) => `${r.bookName} ${r.chapter}`).join(" • ")}
            </Text>
            <View style={styles.targetActions}>
              <TouchableOpacity
                style={[styles.startTodayBtn, { backgroundColor: plan.color }]}
                onPress={() => openReaderWithPlan(activeDay.day, nextReading.bookId, nextReading.chapter)}
              >
                <Ionicons name="play-circle" size={18} color="#fff" />
                <Text style={styles.startTodayText}>Read Day {activeDay.day}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkDayBtn}
                onPress={() => handleCompleteDay(activeDay)}
              >
                <Ionicons name="checkmark-done-circle-outline" size={18} color={colors.muted} />
                <Text style={styles.checkDayText}>Mark Day Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Enroll / Delete CTA */}
        {!isEnrolled ? (
          <TouchableOpacity style={[styles.enrollBtn, { backgroundColor: plan.color }]} onPress={handleEnroll}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.enrollBtnText}>Start This Plan</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={15} color="#FF6B35" />
            <Text style={styles.deleteBtnText}>Remove Plan</Text>
          </TouchableOpacity>
        )}

        {/* Schedule List */}
        <Text style={styles.sectionTitle}>Reading Schedule</Text>
        {plan.days.map((planDay) => {
          const allDone = planDay.readings.every(
            (r) => progress[`${planDay.day}-${r.bookId}-${r.chapter}`]
          );
          const isCurrentActive = activeDay?.day === planDay.day && !allDone;

          return (
            <View
              key={planDay.day}
              style={[
                styles.dayCard,
                allDone && styles.dayCardDone,
                isCurrentActive && { borderColor: plan.color, borderWidth: 1.5 },
              ]}
            >
              <View style={styles.dayHeader}>
                <View
                  style={[
                    styles.dayBadge,
                    {
                      backgroundColor: allDone
                        ? "#06D6A0"
                        : isCurrentActive
                        ? plan.color
                        : plan.color + "22",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNum,
                      { color: allDone || isCurrentActive ? "#fff" : plan.color },
                    ]}
                  >
                    Day {planDay.day}
                  </Text>
                </View>
                {allDone ? (
                  <View style={styles.doneTag}>
                    <Ionicons name="checkmark-circle" size={18} color="#06D6A0" />
                    <Text style={styles.doneTagText}>Completed</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.quickMarkDay}
                    onPress={() => handleCompleteDay(planDay)}
                  >
                    <Text style={[styles.quickMarkDayText, { color: colors.muted }]}>
                      Complete all
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {planDay.readings.map((r) => {
                const key = `${planDay.day}-${r.bookId}-${r.chapter}`;
                const done = progress[key] || false;
                return (
                  <View key={key} style={styles.readingRow}>
                    <TouchableOpacity
                      style={styles.readingLink}
                      onPress={() => openReaderWithPlan(planDay.day, r.bookId, r.chapter)}
                    >
                      <Ionicons
                        name="book-outline"
                        size={15}
                        color={done ? "#06D6A0" : plan.color}
                      />
                      <Text
                        style={[
                          styles.readingText,
                          done && { textDecorationLine: "line-through", color: colors.muted },
                        ]}
                      >
                        {r.bookName} {r.chapter}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.doneBtn}
                      onPress={() => handleToggle(planDay.day, r.bookId, r.bookName, r.chapter)}
                    >
                      <Ionicons
                        name={done ? "checkmark-circle" : "ellipse-outline"}
                        size={24}
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
    scroll: { padding: 20, paddingBottom: 60 },
    hero: { borderRadius: 20, padding: 22, marginBottom: 16, borderWidth: 1, alignItems: "center" },
    heroIcon: { fontSize: 40, marginBottom: 10 },
    heroName: { fontFamily: "Syne-Bold", fontSize: 22, color: c.text, textAlign: "center", marginBottom: 6 },
    heroDesc: { fontFamily: "DMSans-Regular", fontSize: 13.5, color: c.muted, textAlign: "center", lineHeight: 20 },
    heroBadges: { flexDirection: "row", gap: 10, marginTop: 14 },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: c.background,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 5,
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
    progressTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    progressLabel: { fontFamily: "DMSans-Medium", fontSize: 13, color: c.text },
    progressPct: { fontFamily: "Syne-Bold", fontSize: 14 },
    progressBar: { height: 6, backgroundColor: c.border, borderRadius: 3, marginBottom: 8 },
    progressFill: { height: 6, borderRadius: 3 },
    progressSub: { fontFamily: "DMSans-Regular", fontSize: 12, color: c.muted },

    celebrationCard: {
      backgroundColor: "#06D6A018",
      borderRadius: 16,
      padding: 18,
      alignItems: "center",
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "#06D6A044",
    },
    celebrationIcon: { fontSize: 32, marginBottom: 6 },
    celebrationTitle: { fontFamily: "Syne-Bold", fontSize: 18, color: "#06D6A0", marginBottom: 4 },
    celebrationSub: { fontFamily: "DMSans-Regular", fontSize: 13, color: c.text, textAlign: "center" },

    targetCard: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1,
    },
    targetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    targetTag: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    targetTagText: { fontFamily: "Syne-Bold", fontSize: 10, letterSpacing: 0.5 },
    targetDayTitle: { fontFamily: "Syne-Bold", fontSize: 14, color: c.text },
    targetChapters: { fontFamily: "Lora-Regular", fontSize: 16, color: c.text, marginBottom: 14 },
    targetActions: { flexDirection: "row", gap: 10 },
    startTodayBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: 10,
    },
    startTodayText: { fontFamily: "Syne-Bold", fontSize: 13, color: "#fff" },
    checkDayBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
    },
    checkDayText: { fontFamily: "DMSans-Medium", fontSize: 12, color: c.muted },

    enrollBtn: {
      borderRadius: 14,
      padding: 15,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      marginBottom: 20,
    },
    enrollBtnText: { fontFamily: "Syne-Bold", fontSize: 15, color: "#fff" },
    deleteBtn: {
      borderRadius: 12,
      padding: 10,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: "#FF6B3533",
      backgroundColor: "#FF6B3511",
    },
    deleteBtnText: { fontFamily: "DMSans-Medium", fontSize: 13, color: "#FF6B35" },

    sectionTitle: { fontFamily: "Syne-Bold", fontSize: 17, color: c.text, marginBottom: 14 },
    dayCard: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    dayCardDone: { borderColor: "#06D6A033", backgroundColor: "#06D6A008" },
    dayHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    dayBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
    dayNum: { fontFamily: "Syne-Bold", fontSize: 12 },
    doneTag: { flexDirection: "row", alignItems: "center", gap: 4 },
    doneTagText: { fontFamily: "DMSans-Medium", fontSize: 11, color: "#06D6A0" },
    quickMarkDay: { padding: 4 },
    quickMarkDayText: { fontFamily: "DMSans-Medium", fontSize: 11 },

    readingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 7,
      borderTopWidth: 1,
      borderTopColor: c.border + "66",
    },
    readingLink: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
    readingText: { fontFamily: "DMSans-Medium", fontSize: 14, color: c.text },
    doneBtn: { padding: 2 },
  });
}
