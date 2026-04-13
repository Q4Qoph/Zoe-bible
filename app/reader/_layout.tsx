import { Stack } from "expo-router";

export default function ReaderLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#1A1A24" },
        headerTintColor: "#FF6B35",
        headerTitleStyle: { fontFamily: "Syne-Bold", color: "#F5F5F5" },
        headerBackTitle: "",
        contentStyle: { backgroundColor: "#0F0F14" },
      }}
    />
  );
}
