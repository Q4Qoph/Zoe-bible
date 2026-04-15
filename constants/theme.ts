export const darkColors = {
  background: "#0F0F14",
  surface: "#1A1A24",
  border: "#2A2A38",
  text: "#F5F5F5",
  muted: "#6B6B80",
};

export const lightColors = {
  background: "#F5F5FF",
  surface: "#FFFFFF",
  border: "#E4E4EF",
  text: "#1A1A24",
  muted: "#8888A0",
};

export type AppColors = typeof darkColors;

export const theme = {
  colors: darkColors,
  fonts: {
    heading: "Syne-Bold",
    body: "Lora-Regular",
    bodyBold: "Lora-Bold",
    ui: "DMSans-Regular",
    uiMedium: "DMSans-Medium",
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};
