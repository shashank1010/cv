/** Client-side only: sticky nav fallback + CTA poke + locale cookie + theme + analytics */

const THEME_KEY = "theme";
/** 7 days */
const THEME_MAX_AGE = 7 * 24 * 60 * 60;

declare global {
  interface Window {
    posthog?: {
      capture?: (event: string, properties?: Record<string, unknown>) => void;
    };
  }
}

export function initCvInteractions() {
  initStickyNavFallback();
  initCtaPoke();
  initLocaleCookie();
  initThemeToggle();
  initFaviconFocus();
  initExternalLinks();
  initPhCapture();
}

type Theme = "light" | "dark";

/** Safe PostHog capture — no-op if unavailable. */
function capture(event: string, properties?: Record<string, unknown>) {
  try {
    window.posthog?.capture?.(event, properties);
  } catch {
    /* posthog missing or blocked */
  }
}

function pageLocale(): string {
  return document.documentElement.lang || "en";
}

/** Effective theme: data-theme if set, else OS preference. */
function effectiveTheme(): Theme {
  const forced = document.documentElement.dataset.theme;
  if (forced === "light" || forced === "dark") return forced;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

const SMILEY_FAVICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">😊</text></svg>`,
  );

function pageIsFocused(): boolean {
  return document.visibilityState === "visible" && document.hasFocus();
}

/** Focused → smiley; blurred/hidden → SA light/dark SVG. */
function syncFavicon() {
  const link = document.getElementById("app-favicon") as HTMLLinkElement | null;
  if (!link) return;

  if (pageIsFocused()) {
    link.href = SMILEY_FAVICON;
    return;
  }

  const theme = effectiveTheme();
  link.href = theme === "dark" ? "/favicon-dark.svg" : "/favicon-light.svg";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.cookie =
    `${THEME_KEY}=${encodeURIComponent(theme)}; Path=/; Max-Age=${THEME_MAX_AGE}; SameSite=Lax`;
  syncFavicon();
}

function initFaviconFocus() {
  syncFavicon();
  document.addEventListener("visibilitychange", syncFavicon);
  window.addEventListener("focus", syncFavicon);
  window.addEventListener("blur", syncFavicon);
}

function initThemeToggle() {
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    "[data-theme-toggle]",
  );
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      applyTheme(effectiveTheme() === "dark" ? "light" : "dark");
    });
  });
}

function initStickyNavFallback() {
  if (
    typeof CSS !== "undefined" &&
    CSS.supports &&
    CSS.supports("container-type: scroll-state")
  ) {
    return;
  }

  const nav = document.querySelector(".site-nav");
  const sentinel = document.querySelector(".site-nav-sentinel");
  if (!nav || !sentinel || typeof IntersectionObserver === "undefined") {
    return;
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      nav.classList.toggle("is-stuck", !entry.isIntersecting);
    },
    { root: null, threshold: 0 },
  );

  observer.observe(sentinel);
}

function initCtaPoke() {
  const poke = document.querySelector(".cta-poke");
  const cta = document.querySelector(".cta");
  if (!poke || !cta || typeof IntersectionObserver === "undefined") {
    return;
  }

  new IntersectionObserver(
    ([entry]) => {
      const hide = entry.intersectionRatio >= 0.33;
      poke.classList.toggle("is-hidden", hide);
      poke.setAttribute("aria-hidden", hide ? "true" : "false");
      if (hide) {
        poke.setAttribute("tabindex", "-1");
      } else {
        poke.removeAttribute("tabindex");
      }
    },
    { root: null, threshold: [0, 0.33, 0.66, 1], rootMargin: "0px" },
  ).observe(cta);
}

/** Open all http(s) links in a new tab (content HTML + markup). */
function initExternalLinks() {
  document.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (!href || !/^https?:\/\//i.test(href)) return;
    // Print-only self-site link: leave alone (hidden on web)
    if (a.classList.contains("project__link--print")) {
      return;
    }
    a.target = "_blank";
    const rel = new Set(
      (a.getAttribute("rel") ?? "").split(/\s+/).filter(Boolean),
    );
    rel.add("noopener");
    rel.add("noreferrer");
    a.rel = [...rel].join(" ");
  });
}

/** Persist chosen locale; not used for menu open/close. */
function initLocaleCookie() {
  const items = document.querySelectorAll(".lang-dropdown__item");
  items.forEach((item) => {
    item.addEventListener("click", () => {
      const lang = item.getAttribute("lang");
      if (!lang) return;
      document.cookie =
        `locale=${encodeURIComponent(lang)}; Path=/; Max-Age=86400; SameSite=Lax`;
    });
  });
}

/**
 * Single delegated listener for PostHog.
 * Mark elements with data-ph-event="event_name" and optional data-ph-* props
 * (e.g. data-ph-label → label). Locale is always attached.
 * Theme toggle also gets theme from document after the theme handler runs.
 */
function initPhCapture() {
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    const el = target.closest<HTMLElement>("[data-ph-event]");
    if (!el) return;

    const event = el.dataset.phEvent;
    if (!event) return;

    const properties: Record<string, string> = {
      locale: pageLocale(),
    };

    for (const [key, value] of Object.entries(el.dataset)) {
      if (!key.startsWith("ph") || key === "phEvent" || value == null) continue;
      // phLabel → label, phHref → href
      const name = key.charAt(2).toLowerCase() + key.slice(3);
      properties[name] = value;
    }

    if (event === "theme_toggle") {
      properties.theme = document.documentElement.dataset.theme ?? effectiveTheme();
    }

    capture(event, properties);
  });
}
