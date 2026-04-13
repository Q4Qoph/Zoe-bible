import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDatabase } from "../../src/db";
import {
  Book,
  ChapterVerse,
  getBooks,
  getDailyVerse,
} from "../../src/db/queries";

const SUGGESTED_BOOKS = [1, 19, 43, 45, 66]; // Genesis, Psalms, John, Romans, Revelation

export default function HomeScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [dailyVerse, setDailyVerse] = useState<ChapterVerse | null>(null);
  const [suggestedBooks, setSuggestedBooks] = useState<Book[]>([]);
  const greeting = getGreeting();

  useEffect(() => {
    getDailyVerse(db).then(setDailyVerse);
    getBooks(db).then((all) =>
      setSuggestedBooks(all.filter((b) => SUGGESTED_BOOKS.includes(b.id))),
    );
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.tagline}>What will you read today?</Text>
          </View>
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => router.push("/search")}
          >
            <Ionicons name="search" size={20} color="#FF6B35" />
          </TouchableOpacity>
        </View>

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
            </View>
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickRow}>
            {[
              {
                icon: "book",
                label: "Read Bible",
                route: "/reader",
                color: "#FF6B35",
              },
              {
                icon: "mic",
                label: "Sermon",
                route: "/sermon",
                color: "#7C3AED",
              },
              {
                icon: "search",
                label: "Search",
                route: "/search",
                color: "#06D6A0",
              },
              {
                icon: "bookmark",
                label: "Library",
                route: "/library",
                color: "#F59E0B",
              },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.quickCard}
                onPress={() => router.push(item.route as any)}
              >
                <View
                  style={[
                    styles.quickIcon,
                    { backgroundColor: item.color + "22" },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={item.color}
                  />
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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

        {/* Sermon CTA */}
        <TouchableOpacity
          style={styles.sermonBanner}
          onPress={() => router.push("/sermon")}
        >
          <View>
            <Text style={styles.sermonTitle}>📝 In a sermon right now?</Text>
            <Text style={styles.sermonSub}>
              Open sermon mode to take notes & follow along
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#7C3AED" />
        </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F14" },
  scroll: { paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  greeting: { fontFamily: "Syne-Bold", fontSize: 26, color: "#F5F5F5" },
  tagline: {
    fontFamily: "DMSans-Regular",
    fontSize: 14,
    color: "#6B6B80",
    marginTop: 4,
  },
  searchBtn: {
    backgroundColor: "#1A1A24",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A38",
  },

  // Daily verse
  dailyCard: {
    marginHorizontal: 24,
    backgroundColor: "#1A1A24",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#2A2A38",
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
  dailyBadgeText: {
    fontFamily: "DMSans-Medium",
    fontSize: 11,
    color: "#0F0F14",
  },
  dailyVerse: {
    fontFamily: "Lora-Regular",
    fontSize: 17,
    color: "#F5F5F5",
    lineHeight: 28,
    marginBottom: 12,
  },
  dailyRef: {
    fontFamily: "DMSans-Medium",
    fontSize: 13,
    color: "#FF6B35",
    marginBottom: 16,
  },
  readMoreRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  readMore: { fontFamily: "DMSans-Medium", fontSize: 13, color: "#FF6B35" },

  // Quick actions
  section: { paddingHorizontal: 24, marginBottom: 32 },
  sectionTitle: {
    fontFamily: "Syne-Bold",
    fontSize: 18,
    color: "#F5F5F5",
    marginBottom: 16,
  },
  quickRow: { flexDirection: "row", justifyContent: "space-between" },
  quickCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#1A1A24",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#2A2A38",
  },
  quickIcon: { padding: 10, borderRadius: 12 },
  quickLabel: {
    fontFamily: "DMSans-Medium",
    fontSize: 11,
    color: "#F5F5F5",
    textAlign: "center",
  },

  // Suggested books
  bookChip: {
    backgroundColor: "#1A1A24",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#2A2A38",
  },
  bookChipText: { fontFamily: "DMSans-Medium", fontSize: 13, color: "#F5F5F5" },

  // Sermon banner
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
  sermonTitle: {
    fontFamily: "Syne-Bold",
    fontSize: 15,
    color: "#F5F5F5",
    marginBottom: 4,
  },
  sermonSub: {
    fontFamily: "DMSans-Regular",
    fontSize: 12,
    color: "#6B6B80",
    maxWidth: 220,
  },
});
