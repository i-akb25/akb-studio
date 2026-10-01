"use client";

import {
  ArrowUpRight,
  FileText,
  Menu,
  Monitor,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SiteBrandMark } from "@/components/brand/site-brand-mark";
import { MusicControl } from "@/features/media/components/music-control";
import {
  nextResolvedTheme,
  type ResolvedTheme,
  resolveTheme,
  SYSTEM_THEME_QUERY,
  THEME_STORAGE_KEY,
} from "@/features/theme/theme-config";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "Pravaah", href: "/pravaah" },
  { label: "Journal", href: "/journal" },
  { label: "Knowledge", href: "/knowledge" },
  { label: "Aeva", href: "/aeva" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

function readResolvedTheme(mediaQuery: MediaQueryList): ResolvedTheme {
  let storedTheme: string | null = null;

  try {
    storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {}

  return resolveTheme(storedTheme, mediaQuery.matches);
}

function applyResolvedTheme(theme: ResolvedTheme) {
  const root = document.documentElement;

  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

function ThemeSwitch() {
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme | null>(
    null,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY);

    const synchronizeTheme = () => {
      const theme = readResolvedTheme(mediaQuery);

      applyResolvedTheme(theme);
      setResolvedTheme(theme);
    };

    const handleSystemThemeChange = () => {
      let storedTheme: string | null = null;

      try {
        storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      } catch {}

      if (storedTheme !== "dark" && storedTheme !== "light") {
        synchronizeTheme();
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) {
        synchronizeTheme();
      }
    };

    synchronizeTheme();

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const mounted = resolvedTheme !== null;
  const isDark = resolvedTheme === "dark";
  const label = mounted
    ? `Switch to ${isDark ? "light" : "dark"} theme`
    : "Change color theme";

  const toggleTheme = () => {
    const nextTheme = nextResolvedTheme(isDark ? "dark" : "light");

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {}

    applyResolvedTheme(nextTheme);
    setResolvedTheme(nextTheme);
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={toggleTheme}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-[border-color,background-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-subtle motion-reduce:transform-none motion-reduce:transition-none"
    >
      {!mounted ? (
        <Monitor aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
      ) : isDark ? (
        <Sun aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
      ) : (
        <Moon aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
      )}
    </button>
  );
}

function Brand() {
  return (
    <Link
      href="/"
      aria-label="AKB Studio home"
      className="group flex min-w-0 items-center gap-3 rounded-md"
    >
      <SiteBrandMark className="size-10" priority />

      <span className="hidden min-w-0 sm:block">
        <span className="block truncate font-display text-[15px] leading-none font-semibold tracking-[-0.02em] text-foreground">
          AKB Studio
        </span>
        <span className="mt-1.5 block truncate font-mono text-[9px] leading-none tracking-[0.18em] text-muted uppercase">
          Exploring Engg. Innovation
        </span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updateHeader = () => {
      setIsScrolled(window.scrollY > 24);
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateHeader);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const drawer = drawerRef.current;

    const focusableElements = drawer?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );

    closeButtonRef.current?.focus();
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }

      if (event.key !== "Tab" || !focusableElements?.length) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [menuOpen]);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full border-b bg-background transition-[border-color,box-shadow] duration-300 motion-reduce:transition-none ${
          isScrolled
            ? "border-border shadow-[0_12px_32px_rgba(20,16,12,0.06)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.28)]"
            : "border-transparent"
        }`}
      >
        <div
          className={`mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 transition-[height,padding] duration-300 sm:px-6 lg:px-8 xl:px-10 motion-reduce:transition-none ${
            isScrolled ? "h-16" : "h-20"
          }`}
        >
          <Brand />

          <nav
            aria-label="Primary navigation"
            className="hidden min-[1180px]:block"
          >
            <ul className="flex items-center gap-1">
              {navigation.map((item) => {
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={false}
                      aria-current={active ? "page" : undefined}
                      className={`relative inline-flex h-10 items-center rounded-full px-3.5 text-[13px] font-medium transition-colors duration-200 ${
                        active
                          ? "text-foreground"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {item.label}

                      {active ? (
                        <span
                          aria-hidden="true"
                          className="absolute right-3.5 bottom-1.5 left-3.5 h-px bg-accent-warm"
                        />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/search"
              prefetch={false}
              aria-label="Search AKB Studio"
              title="Search"
              className="hidden size-10 items-center justify-center rounded-full border border-transparent text-muted transition-[border-color,background-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-surface hover:text-foreground md:inline-flex motion-reduce:transform-none motion-reduce:transition-none"
            >
              <Search
                aria-hidden="true"
                className="size-[18px]"
                strokeWidth={1.8}
              />
            </Link>

            <MusicControl />

            <ThemeSwitch />

            <a
              href="/resume/anurag-kumar-bharti-resume.pdf"
              download
              className="hidden h-10 items-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-[13px] font-semibold text-foreground transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-accent-warm hover:bg-surface-subtle md:inline-flex motion-reduce:transform-none motion-reduce:transition-none"
            >
              <FileText
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.8}
              />
              Resume
            </a>

            <Link
              href="/contact"
              className="hidden h-10 items-center gap-2 rounded-full bg-foreground px-5 text-[13px] font-semibold text-background transition-[opacity,transform] duration-200 hover:-translate-y-0.5 hover:opacity-90 min-[1180px]:inline-flex motion-reduce:transform-none motion-reduce:transition-none"
            >
              Start a conversation
              <ArrowUpRight
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.8}
              />
            </Link>

            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="site-navigation-drawer"
              onClick={() => setMenuOpen(true)}
              className="inline-flex size-10 items-center justify-center rounded-full border border-border-strong bg-surface text-foreground transition-[border-color,background-color] duration-200 hover:border-accent-warm hover:bg-surface-subtle min-[1180px]:hidden motion-reduce:transition-none"
            >
              <Menu aria-hidden="true" className="size-5" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-[80] min-[1180px]:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 cursor-default bg-foreground/20 dark:bg-black/60"
          />

          <div
            ref={drawerRef}
            id="site-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col border-l border-border bg-background shadow-[-24px_0_64px_rgba(20,16,12,0.16)] dark:shadow-[-24px_0_64px_rgba(0,0,0,0.5)]"
          >
            <div className="flex h-20 items-center justify-between border-b border-border px-5 sm:px-7">
              <Brand />

              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setMenuOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-full border border-border-strong bg-surface text-foreground transition-colors duration-200 hover:border-accent-warm hover:bg-surface-subtle motion-reduce:transition-none"
              >
                <X aria-hidden="true" className="size-5" strokeWidth={1.8} />
              </button>
            </div>

            <nav
              aria-label="Mobile navigation"
              className="flex-1 overflow-y-auto px-5 py-7 sm:px-7"
            >
              <p className="mb-4 font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
                Explore the studio
              </p>

              <ul className="divide-y divide-border">
                {navigation.map((item, index) => {
                  const active = isActive(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        prefetch={false}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setMenuOpen(false)}
                        className="group flex items-center justify-between gap-5 py-4"
                      >
                        <span className="flex items-baseline gap-4">
                          <span className="font-mono text-[10px] text-muted-soft">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <span
                            className={`font-display text-2xl font-medium tracking-[-0.03em] transition-colors duration-200 ${
                              active
                                ? "text-accent-warm"
                                : "text-foreground group-hover:text-accent-warm"
                            }`}
                          >
                            {item.label}
                          </span>
                        </span>

                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-4 text-muted transition-[color,transform] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-warm motion-reduce:transform-none motion-reduce:transition-none"
                          strokeWidth={1.8}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="border-t border-border bg-surface-subtle px-5 py-5 sm:px-7">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/search"
                  prefetch={false}
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border-strong bg-background px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:border-accent-warm motion-reduce:transition-none"
                >
                  <Search
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={1.8}
                  />
                  Search
                </Link>

                <a
                  href="/resume/anurag-kumar-bharti-resume.pdf"
                  download
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border-strong bg-background px-4 text-sm font-semibold text-foreground transition-colors duration-200 hover:border-accent-warm motion-reduce:transition-none"
                >
                  <FileText
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={1.8}
                  />
                  Resume
                </a>
              </div>

              <Link
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-90 motion-reduce:transition-none"
              >
                Start a conversation
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.8}
                />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
