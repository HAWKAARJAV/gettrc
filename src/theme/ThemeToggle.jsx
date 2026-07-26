import React from "react";
import { useTheme } from "./ThemeContext";

// Compact sun/moon icon toggle. `tone="light"` renders for placement on a
// dark/transparent background (e.g. the marketing nav when transparent over
// the hero); default renders for placement on a light surface.
export default function ThemeToggle({ tone = "auto", style }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const color = tone === "light" ? "rgba(255,255,255,.85)" : "var(--c-text-muted)";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: 34, height: 34, borderRadius: 999,
        border: "1px solid " + (tone === "light" ? "rgba(255,255,255,.2)" : "var(--c-border)"),
        background: tone === "light" ? "rgba(255,255,255,.08)" : "var(--c-surface-2)",
        color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 15, cursor: "pointer", flexShrink: 0,
        ...style,
      }}
    >
      {isDark ? "☀" : "☾"}
    </button>
  );
}
