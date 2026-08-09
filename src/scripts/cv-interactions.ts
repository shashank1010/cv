/** Client-side only: sticky nav fallback + CTA poke visibility + language switcher visibility */

export function initCvInteractions() {
  initStickyNavFallback();
  initCtaPoke();
  initLanguageDropdown();
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

function initLanguageDropdown() {
  // Handle dropdown menu toggle
  const triggers = document.querySelectorAll(".lang-dropdown__trigger");

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      const isExpanded = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!isExpanded));
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    const dropdowns = document.querySelectorAll(".lang-dropdown");
    dropdowns.forEach((dropdown) => {
      if (!dropdown.contains(e.target as Node)) {
        const trigger = dropdown.querySelector(
          ".lang-dropdown__trigger",
        ) as HTMLButtonElement;
        trigger?.setAttribute("aria-expanded", "false");
      }
    });
  });

  // Close dropdown when a language is selected and delay navigation
  const items = document.querySelectorAll(".lang-dropdown__item");
  items.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const dropdown = item.closest(".lang-dropdown");
      const trigger = dropdown?.querySelector(
        ".lang-dropdown__trigger",
      ) as HTMLButtonElement;
      trigger?.setAttribute("aria-expanded", "false");

      // Wait for menu close animation (300ms) before navigating
      setTimeout(() => {
        const href = (item as HTMLAnchorElement).href;
        if (href) {
          window.location.href = href;
        }
      }, 300);
    });
  });

  // Also close hamburger menu when nav links are clicked and delay navigation
  const navLinks = document.querySelectorAll(".site-nav__list a");
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = (link as HTMLAnchorElement).href;
      // Only prevent default for anchor links (section navigation)
      if (href.includes("#")) {
        e.preventDefault();
        const toggle = document.querySelector(
          ".site-nav__toggle",
        ) as HTMLButtonElement;
        toggle?.setAttribute("aria-expanded", "false");

        window.location.hash = (link as HTMLAnchorElement).hash;
      }
    });
  });
}
