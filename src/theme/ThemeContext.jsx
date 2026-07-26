import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });

function readInitialTheme() {
  if (typeof document !== "undefined") {
    // index.html's inline script already set this before first paint.
    const fromDom = document.documentElement.getAttribute("data-theme");
    if (fromDom === "light" || fromDom === "dark") return fromDom;
  }
  return "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("trc_theme", theme); } catch (e) {}
  }, [theme]);

  // Follow system changes only if the user hasn't explicitly chosen a theme.
  useEffect(() => {
    let hasExplicitChoice = false;
    try { hasExplicitChoice = !!localStorage.getItem("trc_theme_explicit"); } catch (e) {}
    if (hasExplicitChoice) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setTheme(e.matches ? "dark" : "light");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try { localStorage.setItem("trc_theme_explicit", "1"); } catch (e) {}
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
