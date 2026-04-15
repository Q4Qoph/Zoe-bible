import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { AppColors } from "../../constants/theme";
import { useDatabase } from "../../src/db";
import { useTheme } from "../../src/contexts/ThemeContext";
import { ChapterVerse, searchVerses } from "../../src/db/queries";

const QUICK_SEARCHES = [
  "faith", "love", "hope", "peace", "strength",
  "grace", "prayer", "forgiveness", "salvation", "joy",
];

const PAGE_SIZE = 20;

export default function SearchScreen() {
  const db = useDatabase();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChapterVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("search_history").then((v) => {
      if (v) setSearchHistory(JSON.parse(v));
    });
  }, []);

  const saveToHistory = async (term: string) => {
    const raw = await AsyncStorage.getItem("search_history");
    const prev: string[] = raw ? JSON.parse(raw) : [];
    const updated = [term, ...prev.filter((t) => t !== term)].slice(0, 6);
    await AsyncStorage.setItem("search_history", JSON.stringify(updated));
    setSearchHistory(updated);
  };

  const clearHistory = async () => {
    await AsyncStorage.removeItem("search_history");
    setSearchHistory([]);
  };

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) return;
      Keyboard.dismiss();
      setLoading(true);
      setSearched(true);
      setPage(0);
      const found = await searchVerses(db, q.trim(), PAGE_SIZE, 0);
      setResults(found);
      setHasMore(found.length === PAGE_SIZE);
      setLoading(false);
      saveToHistory(q.trim());
    },
    [db],
  );

  const loadMore = async () => {
    const nextPage = page + 1;
    const more = await searchVerses(db, query.trim(), PAGE_SIZE, nextPage * PAGE_SIZE);
    setResults((prev) => [...prev, ...more]);
    setHasMore(more.length === PAGE_SIZE);
    setPage(nextPage);
  };

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    doSearch(term);
  };

  const highlight = (text: string, term: string) => {
    if (!term) return <Text style={styles.verseText}>{text}</Text>;
    const parts = text.split(new RegExp(`(${term})`, "gi"));
    return (
      <Text style={styles.verseText}>
        {parts.map((part, i) =>
          part.toLowerCase() === term.toLowerCase() ? (
            <Text key={i} style={styles.highlightText}>{part}</Text>
          ) : (
            part
          ),
        )}
      </Text>
    );
  };

  const showingHistory = !searched && searchHistory.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <Text style={styles.subtitle}>Find any verse in scripture</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.muted} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.input}
            placeholder="Search scripture..."
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => doSearch(query)}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => { setQuery(""); setResults([]); setSearched(false); }}
            >
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={() => doSearch(query)}>
          <Text style={styles.searchBtnText}>Go</Text>
        </TouchableOpacity>
      </View>

      {/* Chips — Recent or Popular */}
      {!searched && (
        <View style={styles.section}>
          <View style={styles.chipHeader}>
            <Text style={styles.sectionTitle}>
              {showingHistory ? "Recent" : "Popular Topics"}
            </Text>
            {showingHistory && (
              <TouchableOpacity onPress={clearHistory}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.chips}>
            {(showingHistory ? searchHistory : QUICK_SEARCHES).map((term) => (
              <TouchableOpacity
                key={term}
                style={styles.chip}
                onPress={() => handleQuickSearch(term)}
              >
                <Text style={styles.chipText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color="#FF6B35" size="large" />
          <Text style={styles.loadingText}>Searching scripture...</Text>
        </View>
      )}

      {/* Results */}
      {!loading && searched && (
        <View style={{ flex: 1 }}>
          <Text style={styles.resultCount}>
            {results.length === 0
              ? "No results found"
              : `${results.length}${hasMore ? "+" : ""} verse${results.length !== 1 ? "s" : ""} found`}
          </Text>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultCard}
                onPress={() => router.push(`/reader/${item.book_id}/${item.chapter}`)}
              >
                <View style={styles.refRow}>
                  <Text style={styles.ref}>
                    {item.book_name} {item.chapter}:{item.verse}
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color="#FF6B35" />
                </View>
                {highlight(item.text, query)}
              </TouchableOpacity>
            )}
            ListFooterComponent={
              hasMore ? (
                <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore}>
                  <Text style={styles.loadMoreText}>Load more</Text>
                </TouchableOpacity>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={styles.emptyIcon}>📖</Text>
                <Text style={styles.emptyText}>No verses found for "{query}"</Text>
                <Text style={styles.emptySub}>Try a different word or phrase</Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
    title: { fontFamily: "Syne-Bold", fontSize: 32, color: c.text },
    subtitle: { fontFamily: "DMSans-Regular", fontSize: 13, color: c.muted, marginTop: 4 },

    searchRow: {
      flexDirection: "row",
      paddingHorizontal: 24,
      marginBottom: 24,
      gap: 10,
      alignItems: "center",
    },
    searchBox: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surface,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    input: { flex: 1, fontFamily: "DMSans-Regular", fontSize: 15, color: c.text },
    searchBtn: {
      backgroundColor: "#FF6B35",
      borderRadius: 14,
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    searchBtnText: { fontFamily: "Syne-Bold", fontSize: 14, color: "#fff" },

    section: { paddingHorizontal: 24 },
    chipHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    sectionTitle: { fontFamily: "Syne-Bold", fontSize: 16, color: c.text },
    clearText: { fontFamily: "DMSans-Medium", fontSize: 13, color: "#FF6B35" },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    chip: {
      backgroundColor: c.surface,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipText: { fontFamily: "DMSans-Medium", fontSize: 13, color: c.text },

    resultCount: {
      fontFamily: "DMSans-Medium",
      fontSize: 13,
      color: c.muted,
      paddingHorizontal: 24,
      marginBottom: 12,
    },
    list: { paddingHorizontal: 24, paddingBottom: 40 },
    resultCard: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    refRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    ref: { fontFamily: "Syne-Bold", fontSize: 13, color: "#FF6B35" },
    verseText: { fontFamily: "Lora-Regular", fontSize: 15, color: c.text, lineHeight: 24 },
    highlightText: {
      backgroundColor: "#FF6B3533",
      color: "#FF6B35",
      fontFamily: "Lora-Bold",
    },
    loadMoreBtn: {
      alignItems: "center",
      paddingVertical: 14,
      marginBottom: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    loadMoreText: { fontFamily: "DMSans-Medium", fontSize: 14, color: "#FF6B35" },

    centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 },
    loadingText: { fontFamily: "DMSans-Regular", fontSize: 14, color: c.muted, marginTop: 12 },
    emptyIcon: { fontSize: 40, marginBottom: 12 },
    emptyText: { fontFamily: "Syne-Bold", fontSize: 16, color: c.text, marginBottom: 6 },
    emptySub: { fontFamily: "DMSans-Regular", fontSize: 13, color: c.muted },
  });
}
