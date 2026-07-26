// Shared marketing color palette — used by the marketing homepage and the
// legacy /uae, /marketplace, /onboarding pages plus the navbar shell in
// TRCConnectApp.jsx. Extracted so it isn't duplicated across every page.
export const C = {
  navy: "#0F2557",
  navyLight: "#1A3570",
  navyDark: "#091A3D",
  gold: "#C9A84C",
  goldLight: "#E2C47A",
  goldDark: "#A07C2E",
  // Literal white — text-on-dark, button text, icon fills. Stays white in
  // both themes on purpose (these sit on backgrounds that are already dark
  // regardless of site theme, e.g. the hero gradient or a gold button).
  white: "#FFFFFF",
  offWhite: "#F7F8FC",
  textMuted: "#6B7A99",
  border: "#E2E8F0",
  // Theme-reactive — use for section/card backgrounds and default body
  // text that should actually invert between light and dark mode.
  surface: "var(--c-surface)",
  surfaceMuted: "var(--c-surface-2)",
  text: "var(--c-text)",
  textMutedTheme: "var(--c-text-muted)",
  themeBorder: "var(--c-border)",
};
