import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
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
import { useDatabase } from "../../src/db";
import { ChapterVerse, searchVerses } from "../../src/db/queries";

const QUICK_SEARCHES = [
  "faith",
  "love",
  "hope",
  "peace",
  "strength",
  "grace",
  "prayer",
  "forgiveness",
  "salvation",
  "joy",
];

export default function SearchScreen() {
  const db = useDatabase();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChapterVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) return;
      Keyboard.dismiss();
      setLoading(true);
      setSearched(true);
      const found = await searchVerses(db, q.trim());
      setResults(found);
      setLoading(false);
    },
    [db],
  );

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
            <Text key={i} style={styles.highlight}>
              {part}
            </Text>
          ) : (
            part
          ),
        )}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <Text style={styles.subtitle}>Find any verse in scripture</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons
            name="search"
            size={18}
            color="#6B6B80"
            style={{ marginRight: 10 }}
          />
          <TextInput
            style={styles.input}
            placeholder="Search scripture..."
            placeholderTextColor="#6B6B80"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => doSearch(query)}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                setResults([]);
                setSearched(false);
              }}
            >
              <Ionicons name="close-circle" size={18} color="#6B6B80" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => doSearch(query)}
        >
          <Text style={styles.searchBtnText}>Go</Text>
        </TouchableOpacity>
      </View>

      {/* Quick search chips */}
      {!searched && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Topics</Text>
          <View style={styles.chips}>
            {QUICK_SEARCHES.map((term) => (
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
              : `${results.length} verse${results.length !== 1 ? "s" : ""} found`}
          </Text>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultCard}
                onPress={() =>
                  router.push(`/reader/${item.book_id}/${item.chapter}`)
                }
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
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={styles.emptyIcon}>📖</Text>
                <Text style={styles.emptyText}>
                  No verses found for "{query}"
                </Text>
                <Text style={styles.emptySub}>
                  Try a different word or phrase
                </Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F14" },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: { fontFamily: "Syne-Bold", fontSize: 32, color: "#F5F5F5" },
  subtitle: {
    fontFamily: "DMSans-Regular",
    fontSize: 13,
    color: "#6B6B80",
    marginTop: 4,
  },

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
    backgroundColor: "#1A1A24",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#2A2A38",
  },
  input: {
    flex: 1,
    fontFamily: "DMSans-Regular",
    fontSize: 15,
    color: "#F5F5F5",
  },
  searchBtn: {
    backgroundColor: "#FF6B35",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  searchBtnText: { fontFamily: "Syne-Bold", fontSize: 14, color: "#fff" },

  section: { paddingHorizontal: 24 },
  sectionTitle: {
    fontFamily: "Syne-Bold",
    fontSize: 16,
    color: "#F5F5F5",
    marginBottom: 14,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    backgroundColor: "#1A1A24",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#2A2A38",
  },
  chipText: { fontFamily: "DMSans-Medium", fontSize: 13, color: "#F5F5F5" },

  resultCount: {
    fontFamily: "DMSans-Medium",
    fontSize: 13,
    color: "#6B6B80",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  list: { paddingHorizontal: 24, paddingBottom: 40 },
  resultCard: {
    backgroundColor: "#1A1A24",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2A38",
  },
  refRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ref: { fontFamily: "Syne-Bold", fontSize: 13, color: "#FF6B35" },
  verseText: {
    fontFamily: "Lora-Regular",
    fontSize: 15,
    color: "#F5F5F5",
    lineHeight: 24,
  },
  highlight: {
    backgroundColor: "#FF6B3533",
    color: "#FF6B35",
    fontFamily: "Lora-Bold",
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  loadingText: {
    fontFamily: "DMSans-Regular",
    fontSize: 14,
    color: "#6B6B80",
    marginTop: 12,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: {
    fontFamily: "Syne-Bold",
    fontSize: 16,
    color: "#F5F5F5",
    marginBottom: 6,
  },
  emptySub: { fontFamily: "DMSans-Regular", fontSize: 13, color: "#6B6B80" },
});
