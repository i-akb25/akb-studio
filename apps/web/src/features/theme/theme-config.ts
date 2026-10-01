export type ResolvedTheme = "dark" | "light";

export const THEME_STORAGE_KEY = "akb-studio-theme";
export const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";

export function resolveTheme(
  storedTheme: string | null,
  prefersDark: boolean,
): ResolvedTheme {
  return storedTheme === "dark" || storedTheme === "light"
    ? storedTheme
    : prefersDark
      ? "dark"
      : "light";
}

export function nextResolvedTheme(theme: ResolvedTheme): ResolvedTheme {
  return theme === "dark" ? "light" : "dark";
}

export function createThemeBootstrapScript(): string {
  return `(function(){try{var key=${JSON.stringify(THEME_STORAGE_KEY)};var stored=localStorage.getItem(key);var theme=stored==='dark'||stored==='light'?stored:matchMedia(${JSON.stringify(SYSTEM_THEME_QUERY)}).matches?'dark':'light';var root=document.documentElement;root.classList.toggle('dark',theme==='dark');root.style.colorScheme=theme;}catch(error){var fallback=matchMedia(${JSON.stringify(SYSTEM_THEME_QUERY)}).matches?'dark':'light';document.documentElement.classList.toggle('dark',fallback==='dark');document.documentElement.style.colorScheme=fallback;}})();`;
}
