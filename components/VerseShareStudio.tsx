import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppColors } from "../constants/theme";
import { ChapterVerse } from "../src/db/queries";
import { useTheme } from "../src/contexts/ThemeContext";

interface VerseShareStudioProps {
  visible: boolean;
  verse: ChapterVerse | null;
  onClose: () => void;
}

interface ThemeOption {
  id: string;
  name: string;
  bgColors: [string, string];
  textColor: string;
  accentColor: string;
}

const CARD_THEMES: ThemeOption[] = [
  {
    id: "sunrise",
    name: "Sunrise",
    bgColors: ["#FF6B35", "#D9381E"],
    textColor: "#FFFFFF",
    accentColor: "#FFE5D9",
  },
  {
    id: "midnight",
    name: "Midnight",
    bgColors: ["#0F172A", "#1E1B4B"],
    textColor: "#F8FAFC",
    accentColor: "#38BDF8",
  },
  {
    id: "royal",
    name: "Royal Gold",
    bgColors: ["#92400E", "#451A03"],
    textColor: "#FEF3C7",
    accentColor: "#FBBF24",
  },
  {
    id: "emerald",
    name: "Emerald",
    bgColors: ["#065F46", "#022C22"],
    textColor: "#ECFDF5",
    accentColor: "#34D399",
  },
  {
    id: "violet",
    name: "Amethyst",
    bgColors: ["#6D28D9", "#3B0764"],
    textColor: "#FDF4FF",
    accentColor: "#F472B6",
  },
  {
    id: "minimal",
    name: "Minimal",
    bgColors: ["#18181B", "#09090B"],
    textColor: "#FAFAFA",
    accentColor: "#FF6B35",
  },
];

export default function VerseShareStudio({ visible, verse, onClose }: VerseShareStudioProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(CARD_THEMES[0]);
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");

  if (!verse) return null;

  const fontSizes = {
    small: { text: 16, line: 24 },
    medium: { text: 19, line: 28 },
    large: { text: 22, line: 32 },
  };

  const handleNativeShare = async () => {
    const formatted = `"${verse.text}"\n\n— ${verse.book_name} ${verse.chapter}:${verse.verse} (BSB)\nShared via Zoe Bible`;
    await Share.share({ message: formatted });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.badgeRow}>
                <Ionicons name="sparkles" size={14} color="#FF6B35" />
                <Text style={styles.badgeText}>VERSE STUDIO</Text>
              </View>
              <Text style={styles.title}>Create Shareable Card</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Visual Card Canvas Preview */}
            <View
              style={[
                styles.cardCanvas,
                { backgroundColor: selectedTheme.bgColors[0] },
              ]}
            >
              {/* Quote Mark Watermark */}
              <Text style={[styles.watermark, { color: selectedTheme.accentColor + "22" }]}>
                “
              </Text>

              {/* Verse Text */}
              <Text
                style={[
                  styles.verseText,
                  {
                    color: selectedTheme.textColor,
                    fontSize: fontSizes[fontSize].text,
                    lineHeight: fontSizes[fontSize].line,
                  },
                ]}
              >
                "{verse.text}"
              </Text>

              {/* Footer Citation & App Branding */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={[styles.citationRef, { color: selectedTheme.accentColor }]}>
                    {verse.book_name} {verse.chapter}:{verse.verse}
                  </Text>
                  <Text style={[styles.versionLabel, { color: selectedTheme.textColor + "99" }]}>
                    Berean Standard Bible (BSB)
                  </Text>
                </View>
                <View style={styles.brandPill}>
                  <Text style={styles.brandText}>ZOE</Text>
                </View>
              </View>
            </View>

            {/* Theme Picker */}
            <Text style={styles.sectionLabel}>CHOOSE STYLE THEME</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.themeScroll}
            >
              {CARD_THEMES.map((theme) => {
                const isSelected = selectedTheme.id === theme.id;
                return (
                  <TouchableOpacity
                    key={theme.id}
                    style={[
                      styles.themePill,
                      { backgroundColor: theme.bgColors[0] },
                      isSelected && styles.themePillActive,
                    ]}
                    onPress={() => setSelectedTheme(theme)}
                  >
                    <Text style={[styles.themePillText, { color: theme.textColor }]}>
                      {theme.name}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={14} color={theme.accentColor} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Typography Controls */}
            <Text style={styles.sectionLabel}>FONT SIZE</Text>
            <View style={styles.fontSizeRow}>
              {(["small", "medium", "large"] as const).map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeBtn,
                    fontSize === size && styles.sizeBtnActive,
                  ]}
                  onPress={() => setFontSize(size)}
                >
                  <Text
                    style={[
                      styles.sizeBtnText,
                      fontSize === size && styles.sizeBtnTextActive,
                    ]}
                  >
                    {size === "small" ? "Small" : size === "medium" ? "Standard" : "Large"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Bottom Action */}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleNativeShare}>
              <Ionicons name="share-social-outline" size={18} color="#fff" />
              <Text style={styles.shareBtnText}>Share Verse Card</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.65)",
      justifyContent: "flex-end",
    },
    sheetContainer: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      maxHeight: "90%",
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
    scroll: { paddingHorizontal: 24, paddingBottom: 24 },

    cardCanvas: {
      borderRadius: 20,
      padding: 24,
      minHeight: 240,
      justifyContent: "space-between",
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 14,
      elevation: 6,
      overflow: "hidden",
      position: "relative",
    },
    watermark: {
      position: "absolute",
      top: -20,
      left: 14,
      fontSize: 120,
      fontFamily: "Lora-Bold",
    },
    verseText: {
      fontFamily: "Lora-Regular",
      zIndex: 2,
      marginBottom: 20,
    },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      zIndex: 2,
    },
    citationRef: { fontFamily: "Syne-Bold", fontSize: 16 },
    versionLabel: { fontFamily: "DMSans-Regular", fontSize: 11, marginTop: 2 },
    brandPill: {
      backgroundColor: "rgba(255,255,255,0.18)",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    brandText: { fontFamily: "Syne-Bold", fontSize: 10, color: "#fff", letterSpacing: 1 },

    sectionLabel: {
      fontFamily: "DMSans-Medium",
      fontSize: 11,
      color: c.muted,
      letterSpacing: 1,
      marginBottom: 10,
    },
    themeScroll: { gap: 10, marginBottom: 20 },
    themePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: "transparent",
    },
    themePillActive: { borderColor: "#fff" },
    themePillText: { fontFamily: "Syne-Bold", fontSize: 12 },

    fontSizeRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
    sizeBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: c.background,
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.border,
    },
    sizeBtnActive: { borderColor: "#FF6B35", backgroundColor: "#FF6B3511" },
    sizeBtnText: { fontFamily: "DMSans-Medium", fontSize: 13, color: c.muted },
    sizeBtnTextActive: { color: "#FF6B35" },

    bottomBar: {
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 32,
      borderTopWidth: 1,
      borderColor: c.border,
    },
    shareBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#FF6B35",
      borderRadius: 14,
      paddingVertical: 14,
    },
    shareBtnText: { fontFamily: "Syne-Bold", fontSize: 15, color: "#fff" },
  });
}
