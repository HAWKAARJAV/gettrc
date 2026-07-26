// Shared design tokens — single source of truth for the visual polish pass.
// Built from the existing brand palette already duplicated across
// src/config/retailTheme.js, src/theme/marketingColors.js, and the many
// inline `const C = {...}` objects in advisor/admin pages. Same colors,
// same brand — just centralized, extended with a real spacing/shadow/
// radius/typography scale, and refined (softer multi-layer shadows,
// consistent focus rings, hover/active/disabled states).

// Theme-reactive — these resolve via CSS custom properties defined in
// theme/global.css ([data-theme="dark"] on <html> overrides them), so any
// component using COLOR.* gets both light and dark mode automatically.
// Components still holding their own hardcoded hex constants (most of the
// app, pre-migration) do not — see theme/ThemeContext.jsx for the toggle
// and global.css for the variable definitions.
export const COLOR = {
  navy: "var(--c-navy)",
  navyLight: "var(--c-navy-light)",
  navyDark: "var(--c-navy-dark)",
  gold: "var(--c-gold)",
  goldLight: "var(--c-gold-light)",
  goldDark: "var(--c-gold-dark)",

  white: "var(--c-surface)",
  offWhite: "var(--c-bg)",
  offWhite2: "var(--c-surface-2)",

  text: "var(--c-text)",
  textMuted: "var(--c-text-muted)",
  textFaint: "var(--c-text-faint)",
  border: "var(--c-border)",
  borderStrong: "var(--c-border-strong)",

  success: "var(--c-success)",
  successBg: "var(--c-success-bg)",
  successBorder: "#A7F3D0",
  warning: "var(--c-warning)",
  warningBg: "var(--c-warning-bg)",
  warningBorder: "#FDE68A",
  error: "var(--c-error)",
  errorBg: "var(--c-error-bg)",
  errorBorder: "#FECACA",
  info: "#2563EB",
  infoBg: "#EFF6FF",
  infoBorder: "#BFDBFE",

  sidebar: "#0A1F4E",
  focusRing: "rgba(201,168,76,.45)", // gold, used for all :focus-visible outlines
};

export const FONT = {
  serif: "'Cormorant Garamond', serif",
  sans: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'Fira Code', ui-monospace, monospace",
};

// 8px base spacing scale — use SPACE[n] instead of ad-hoc px values.
export const SPACE = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64, 20: 80 };

export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, pill: 999 };

// Layered, softer shadows (Stripe/Linear-style: a tight ambient shadow +
// a longer soft one) instead of the old single hard-edged box-shadow.
export const SHADOW = {
  xs: "0 1px 2px rgba(15,37,87,.04)",
  sm: "0 1px 3px rgba(15,37,87,.06), 0 1px 2px rgba(15,37,87,.04)",
  md: "0 4px 12px rgba(15,37,87,.06), 0 2px 4px rgba(15,37,87,.04)",
  lg: "0 12px 32px rgba(15,37,87,.10), 0 4px 8px rgba(15,37,87,.04)",
  xl: "0 24px 60px rgba(15,37,87,.14), 0 8px 16px rgba(15,37,87,.06)",
  gold: "0 6px 20px rgba(201,168,76,.35)",
  focus: "0 0 0 3px rgba(201,168,76,.35)",
};

export const EASE = "cubic-bezier(.4,0,.2,1)";
export const TRANSITION = {
  fast: `all .15s ${EASE}`,
  base: `all .2s ${EASE}`,
  slow: `all .3s ${EASE}`,
};

// Reusable style fragments for the most common patterns (buttons, cards,
// inputs) — plain objects to spread into a component's inline style, kept
// intentionally framework-agnostic since the app uses inline styles
// throughout rather than a CSS-in-JS/utility library.
export const PRIMARY_BUTTON = {
  background: `linear-gradient(135deg, ${COLOR.gold}, ${COLOR.goldDark})`,
  color: COLOR.navy,
  border: "none",
  borderRadius: RADIUS.sm,
  fontWeight: 700,
  cursor: "pointer",
  transition: TRANSITION.base,
  boxShadow: SHADOW.sm,
};

export const SECONDARY_BUTTON = {
  background: COLOR.white,
  color: COLOR.navy,
  border: `1px solid ${COLOR.border}`,
  borderRadius: RADIUS.sm,
  fontWeight: 700,
  cursor: "pointer",
  transition: TRANSITION.base,
};

export const CARD = {
  background: COLOR.white,
  border: `1px solid ${COLOR.border}`,
  borderRadius: RADIUS.lg,
  boxShadow: SHADOW.sm,
};

export const INPUT = {
  border: `1px solid ${COLOR.border}`,
  borderRadius: RADIUS.sm,
  fontFamily: FONT.sans,
  fontSize: 14,
  color: COLOR.text,
  background: COLOR.white,
  transition: TRANSITION.fast,
  outline: "none",
};

export const INPUT_FOCUS = {
  borderColor: COLOR.gold,
  boxShadow: SHADOW.focus,
};
