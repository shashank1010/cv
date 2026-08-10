/** Client-side only: sticky nav fallback + CTA poke + locale cookie + theme */

const THEME_KEY = "theme";
/** 7 days */
const THEME_MAX_AGE = 7 * 24 * 60 * 60;

export function initCvInteractions() {
  initStickyNavFallback();
  initCtaPoke();
  initLocaleCookie();
  initThemeToggle();
}

type Theme = "light" | "dark";

/** Effective theme: data-theme if set, else OS preference. */
function effectiveTheme(): Theme {
  const forced = document.documentElement.dataset.theme;
  if (forced === "light" || forced === "dark") return forced;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.cookie =
    `${THEME_KEY}=${encodeURIComponent(theme)}; Path=/; Max-Age=${THEME_MAX_AGE}; SameSite=Lax`;
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
