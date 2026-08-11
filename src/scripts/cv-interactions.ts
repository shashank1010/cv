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
  initProjectPeeks();
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
    // Print-only self-site anchor is hidden on screen; leave it alone
    if (a.classList.contains("project__link--print-only")) return;
    a.target = "_blank";
    const rel = new Set(
      (a.getAttribute("rel") ?? "").split(/\s+/).filter(Boolean),
    );
    rel.add("noopener");
    rel.add("noreferrer");
    a.rel = [...rel].join(" ");
  });
}

/**
 * Experience (etc.) peeks: click loads the matching side-project card into a CSS popover
 * anchored to the npm link (CSS anchor positioning).
 * Print / no-JS keeps the plain npm <a href>.
 */
function initProjectPeeks() {
  const pop = document.getElementById(
    "project-peek-popover",
  ) as (HTMLElement & {
    showPopover?: () => void;
    hidePopover?: () => void;
  }) | null;
  if (!pop || typeof pop.showPopover !== "function") {
    return;
  }

  const anchors = document.querySelectorAll<HTMLAnchorElement>(
    "a.project-peek[data-project-peek]",
  );

  /** Abortable scroll-to-close listener for the open peek only */
  let scrollClose: AbortController | null = null;

  const clearAnchors = () => {
    anchors.forEach((el) => {
      el.style.removeProperty("anchor-name");
    });
  };

  const cancelScrollClose = () => {
    scrollClose?.abort();
    scrollClose = null;
  };

  const armScrollClose = () => {
    cancelScrollClose();
    scrollClose = new AbortController();
    window.addEventListener(
      "scroll",
      () => {
        scrollClose = null;
        pop.hidePopover?.();
      },
      { passive: true, capture: true, once: true, signal: scrollClose.signal },
    );
  };

  /** Place below by default; flip above when the card won't fit under the trigger. */
  const placePeek = (trigger: HTMLElement) => {
    const gap = 6;
    const nav = document.querySelector(".site-nav-sticky");
    const topSafe =
      (nav instanceof HTMLElement
        ? nav.getBoundingClientRect().bottom
        : 0) + gap;
    const t = trigger.getBoundingClientRect();
    const p = pop.getBoundingClientRect();
    const spaceBelow = window.innerHeight - t.bottom - gap;
    const spaceAbove = t.top - topSafe;
    const openAbove =
      spaceBelow < p.height && spaceAbove > spaceBelow && spaceAbove > 0;
    pop.dataset.place = openAbove ? "above" : "below";
  };

  // Scroll listener only while open; abort if closed another way (light dismiss, Esc, …)
  // Keep anchor-name + data-place through the close fade — resetting them makes the
  // popover jump to the top-left while opacity is still animating out.
  pop.addEventListener("toggle", (e) => {
    const te = e as ToggleEvent;
    if (te.newState === "open") {
      armScrollClose();
    } else {
      cancelScrollClose();
    }
  });

  anchors.forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("data-project-peek");
      if (!id) return;
      const source = document.getElementById(id);
      if (!source) return;

      e.preventDefault();

      // Reposition only when opening (not when closing)
      clearAnchors();
      a.style.setProperty("anchor-name", "--project-peek-anchor");

      const clone = source.cloneNode(true) as HTMLElement;
      clone.removeAttribute("id");
      clone.classList.add("project--peek");
      pop.replaceChildren(clone);

      // Prefer below first so layout height is measurable, then flip if needed
      pop.dataset.place = "below";
      pop.showPopover();
      placePeek(a);
    });
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
