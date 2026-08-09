/** Client-side only: sticky nav fallback + CTA poke visibility + language switcher visibility */

export function initCvInteractions() {
  initStickyNavFallback();
  initCtaPoke();
  initLanguageSwitcher();
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
  const label = document.querySelector(".cta__title");
  if (!poke || !label || typeof IntersectionObserver === "undefined") {
    return;
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      poke.classList.toggle("is-hidden", entry.isIntersecting);
      poke.setAttribute("aria-hidden", entry.isIntersecting ? "true" : "false");
      if (entry.isIntersecting) {
        poke.setAttribute("tabindex", "-1");
      } else {
        poke.removeAttribute("tabindex");
      }
    },
    { root: null, threshold: 0, rootMargin: "0px" },
  );

  observer.observe(label);
}

function initLanguageSwitcher() {
  const langSwitch = document.querySelector(".lang-switch");
  const cta = document.getElementById("lets-talk");

  if (!langSwitch || !cta || typeof IntersectionObserver === "undefined") {
    return;
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      langSwitch.classList.toggle("is-hidden", entry.intersectionRatio === 1);
    },
    { root: null, threshold: 1 },
  );

  observer.observe(cta);
}
