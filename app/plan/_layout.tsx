import { Stack } from "expo-router";
import { useTheme } from "../../src/contexts/ThemeContext";

export default function PlanLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: "#FF6B35",
        headerTitleStyle: { fontFamily: "Syne-Bold", color: colors.text },
        headerBackTitle: "",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="[planId]"
        options={{
          headerShown: true,
          title: "Plan Details",
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
