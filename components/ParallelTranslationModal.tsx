import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppColors } from "../constants/theme";
import { ChapterVerse, getComparativeTranslationsFromDb } from "../src/db/queries";
import { useDatabase } from "../src/db";
import { useTheme } from "../src/contexts/ThemeContext";
import { AVAILABLE_TRANSLATIONS } from "../src/data/translations";

interface ParallelTranslationModalProps {
  visible: boolean;
  verse: ChapterVerse | null;
  onClose: () => void;
}

export default function ParallelTranslationModal({
  visible,
  verse,
  onClose,
}: ParallelTranslationModalProps) {
  const db = useDatabase();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [parallelVerses, setParallelVerses] = useState<{ BSB: string; KJV: string; WEB: string }>({
    BSB: "",
    KJV: "",
    WEB: "",
  });

  useEffect(() => {
    if (visible && verse) {
      getComparativeTranslationsFromDb(db, verse.book_id, verse.chapter, verse.verse, verse.text).then(
        setParallelVerses
      );
    }
  }, [visible, verse, db]);

  if (!verse) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.badgeRow}>
                <Ionicons name="git-compare" size={12} color="#FF6B35" />
                <Text style={styles.badgeText}>TRANSLATION COMPARISON</Text>
              </View>
              <Text style={styles.title}>
                {verse.book_name} {verse.chapter}:{verse.verse}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {AVAILABLE_TRANSLATIONS.map((t) => {
              const text = parallelVerses[t.id] || verse.text;
              return (
                <View key={t.id} style={styles.translationCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.tagRow}>
                      <View style={styles.translationTag}>
                        <Text style={styles.translationTagText}>{t.id}</Text>
                      </View>
                      <Text style={styles.fullName}>{t.fullName}</Text>
                    </View>
                    <Text style={styles.yearText}>{t.year}</Text>
                  </View>
                  <Text style={styles.verseText}>"{text}"</Text>
                  <Text style={styles.descText}>{t.description}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    sheetContainer: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      maxHeight: "85%",
      paddingTop: 16,
      borderTopWidth: 1,
      borderColor: c.border,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingHorizontal: 24,
      marginBottom: 16,
    },
    badgeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
    badgeText: { fontFamily: "Syne-Bold", fontSize: 10, color: "#FF6B35", letterSpacing: 0.5 },
    title: { fontFamily: "Syne-Bold", fontSize: 20, color: c.text },
    closeBtn: {
      padding: 6,
      borderRadius: 16,
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
    },
    scroll: { paddingHorizontal: 24, paddingBottom: 40 },
    translationCard: {
      backgroundColor: c.background,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    tagRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    translationTag: {
      backgroundColor: "#FF6B3518",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    translationTagText: { fontFamily: "Syne-Bold", fontSize: 12, color: "#FF6B35" },
    fullName: { fontFamily: "DMSans-Medium", fontSize: 13, color: c.text },
    yearText: { fontFamily: "DMSans-Regular", fontSize: 11, color: c.muted },
    verseText: {
      fontFamily: "Lora-Regular",
      fontSize: 15,
      color: c.text,
      lineHeight: 24,
      marginBottom: 10,
    },
    descText: {
      fontFamily: "DMSans-Regular",
      fontSize: 11,
      color: c.muted,
      fontStyle: "italic",
    },
  });
}
