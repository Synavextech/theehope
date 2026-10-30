import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "system";

export interface ThemeContextType {
    theme: Theme;
    resolvedTheme: "dark" | "light";
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("theme") as Theme | null;
            if (saved === "light" || saved === "dark" || saved === "system") {
                return saved;
            }
        }
        return "system";
    });

    const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(() => {
        if (typeof window !== "undefined") {
            if (theme === "system") {
                return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            }
            return theme;
        }
        return "light";
    });

    useEffect(() => {
        const root = window.document.documentElement;
        try {
            localStorage.setItem("theme", theme);
        } catch (e) {
            console.warn("Unable to persist theme to localStorage:", e);
        }

        const applyTheme = (isDark: boolean) => {
            const active = isDark ? "dark" : "light";
            root.classList.remove("light", "dark");
            root.classList.add(active);
            root.setAttribute("data-theme", active);
            setResolvedTheme(active);
        };

        if (theme === "system") {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            applyTheme(mediaQuery.matches);

            const handleChange = (e: MediaQueryListEvent) => {
                applyTheme(e.matches);
            };

            mediaQuery.addEventListener("change", handleChange);
            return () => mediaQuery.removeEventListener("change", handleChange);
        } else {
            applyTheme(theme === "dark");
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");
    return context;
}
