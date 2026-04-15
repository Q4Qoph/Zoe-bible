import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { AppColors } from "../constants/theme";
import { useTheme } from "../src/contexts/ThemeContext";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    icon: "📖",
    title: "Your Bible,\nAlways With You",
    subtitle:
      "Full offline access to the Berean Standard Bible. No internet needed — ever.",
    color: "#FF6B35",
  },
  {
    icon: "✏️",
    title: "Session Mode\nfor Any Gathering",
    subtitle:
      "Sermon, Bible study, talk — open a session, type notes fast, and pull up verses instantly without losing your place.",
    color: "#7C3AED",
  },
  {
    icon: "🔖",
    title: "Highlight,\nNote & Save",
    subtitle:
      "Tap any verse to highlight it, add a personal note, or bookmark it for later.",
    color: "#06D6A0",
  },
  {
    icon: "📅",
    title: "Read Plans\nThat Stick",
    subtitle: "Follow guided reading plans and track your progress day by day.",
    color: "#F59E0B",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [current, setCurrent] = useState(0);
  const { colors, isDark } = useTheme();

  const next = () => {
    if (current < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (current + 1) * width, animated: true });
      setCurrent(current + 1);
    } else {
      finish();
    }
  };

  const finish = async () => {
    await AsyncStorage.setItem("onboarded", "true");
    router.replace("/(tabs)");
  };

  const slide = SLIDES[current];
  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Skip */}
      <TouchableOpacity style={styles.skip} onPress={finish}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrent(idx);
        }}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: s.color + "22",
                  borderColor: s.color + "44",
                },
              ]}
            >
              <Text style={styles.icon}>{s.icon}</Text>
            </View>
            <Text style={[styles.slideTitle, { color: s.color }]}>
              {s.title}
            </Text>
            <Text style={styles.slideSubtitle}>{s.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === current && { backgroundColor: slide.color, width: 24 },
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.cta, { backgroundColor: slide.color }]}
        onPress={next}
      >
        <Text style={styles.ctaText}>
          {current === SLIDES.length - 1 ? "Let's Go 🚀" : "Next"}
        </Text>
        <Ionicons
          name={current === SLIDES.length - 1 ? "rocket" : "arrow-forward"}
          size={18}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, alignItems: "center" },
    skip: { position: "absolute", top: 56, right: 24, zIndex: 10 },
    skipText: { fontFamily: "DMSans-Medium", fontSize: 14, color: c.muted },

    slide: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 40,
      paddingTop: 60,
    },
    iconCircle: {
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 40,
    },
    icon: { fontSize: 64 },
    slideTitle: {
      fontFamily: "Syne-Bold",
      fontSize: 36,
      textAlign: "center",
      lineHeight: 44,
      marginBottom: 20,
    },
    slideSubtitle: {
      fontFamily: "DMSans-Regular",
      fontSize: 16,
      color: c.muted,
      textAlign: "center",
      lineHeight: 26,
    },

    dots: { flexDirection: "row", gap: 8, marginBottom: 32 },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.border,
    },

    cta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 40,
      paddingVertical: 18,
      borderRadius: 16,
      marginBottom: 48,
      width: width - 48,
      justifyContent: "center",
    },
    ctaText: { fontFamily: "Syne-Bold", fontSize: 18, color: "#fff" },
  });
}
