/* Shared page behaviour: theme, navigation, and small actions. */
(() => {
  "use strict";

  const root = document.documentElement;
  const systemTheme = matchMedia("(prefers-color-scheme: dark)");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const EMAIL = "codewithyazzy@gmail.com";
  let themeTimer;

  function storedTheme() {
    try {
      return localStorage.getItem("theme");
    } catch {
      return null;
    }
  }

  function applyTheme(theme, smooth = false) {
    if (smooth) {
      root.classList.add("is-theme-switching");
      clearTimeout(themeTimer);
      themeTimer = setTimeout(
        () => root.classList.remove("is-theme-switching"),
        360,
      );
    }
    root.dataset.theme = theme;
    const color = theme === "dark" ? "#000000" : "#fbfbfd";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", color);
    document.querySelectorAll(".theme-toggle").forEach((button) => {
      button.setAttribute("aria-pressed", String(theme === "dark"));
      button.setAttribute(
        "aria-label",
        `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
      );
    });
    window.dispatchEvent(
      new CustomEvent("themechange", { detail: { theme } }),
    );
  }

  applyTheme(
    ["light", "dark"].includes(root.dataset.theme)
      ? root.dataset.theme
      : systemTheme.matches
        ? "dark"
        : "light",
  );

  document.querySelectorAll(".theme-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("theme", next);
      } catch {
        /* The current page can still switch. */
      }
      applyTheme(next, true);
    });
  });

  systemTheme.addEventListener("change", (event) => {
    if (!["light", "dark"].includes(storedTheme())) {
      applyTheme(event.matches ? "dark" : "light");
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== "theme") return;
    applyTheme(
      ["light", "dark"].includes(event.newValue)
        ? event.newValue
        : systemTheme.matches
          ? "dark"
          : "light",
    );
  });

  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();

  const header = document.querySelector("#navbar");
  if (header) {
    const updateHeader = () => {
      header.classList.toggle("is-scrolled", scrollY > 4);
    };
    updateHeader();
    addEventListener("scroll", updateHeader, { passive: true });
  }

  const menu = document.querySelector("#mobileMenu");
  const menuButton = document.querySelector("#hamburger");
  const menuQuery = matchMedia("(min-width: 821px)");
  let menuAnimation = null;

  function clearMenuStyles() {
    if (!menu) return;
    menu.style.removeProperty("height");
    menu.style.removeProperty("overflow");
    menu.style.removeProperty("opacity");
    menu.style.removeProperty("transform");
  }

  function setMenu(open, restoreFocus = false) {
    if (!menu || !menuButton) return;

    if (menuAnimation) {
      menuAnimation.stop();
      menuAnimation = null;
    }

    const shouldAnimate = Boolean(window.Motion) && !reduceMotion.matches;

    if (open) {
      menu.hidden = false;
      menu.style.overflow = "hidden";
      const targetHeight = menu.scrollHeight;
      if (shouldAnimate) {
        menuAnimation = window.Motion.animate(
          menu,
          {
            height: ["0px", `${targetHeight}px`],
            opacity: [0, 1],
            transform: ["translateY(-6px)", "translateY(0px)"],
          },
          {
            duration: 0.28,
            ease: [0.23, 1, 0.32, 1],
            onComplete: () => {
              menuAnimation = null;
              clearMenuStyles();
            },
          },
        );
      } else {
        clearMenuStyles();
      }
    } else {
      if (shouldAnimate && !menu.hidden) {
        const startHeight = menu.getBoundingClientRect().height;
        menuAnimation = window.Motion.animate(
          menu,
          {
            height: [`${startHeight}px`, "0px"],
            opacity: [1, 0],
            transform: ["translateY(0px)", "translateY(-4px)"],
          },
          {
            duration: 0.18,
            ease: [0.4, 0, 1, 1],
            onComplete: () => {
              menu.hidden = true;
              menuAnimation = null;
              clearMenuStyles();
            },
          },
        );
      } else {
        menu.hidden = true;
        clearMenuStyles();
      }
    }

    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (restoreFocus) menuButton.focus();
  }

  menuButton?.addEventListener("click", () => {
    setMenu(menu ? menu.hidden : false);
  });

  menu?.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu && !menu.hidden) setMenu(false, true);
  });

  document.addEventListener("click", (event) => {
    if (menu && !menu.hidden && !event.target.closest("#navbar")) {
      setMenu(false);
    }
  });

  const onMenuBreakpoint = (event) => {
    if (event.matches) setMenu(false);
  };
  if (menuQuery.addEventListener) {
    menuQuery.addEventListener("change", onMenuBreakpoint);
  } else {
    menuQuery.addListener(onMenuBreakpoint);
  }

  let toastTimer;
  function toast(message) {
    const element = document.querySelector("#toast");
    if (!element) return;
    element.textContent = message;
    element.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove("show"), 3600);
  }

  document.querySelector("#copyEmail")?.addEventListener("click", async () => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(EMAIL);
      toast("Email address copied.");
    } catch {
      toast(`Copy is unavailable. Email: ${EMAIL}`);
    }
  });

  // Move keyboard focus to in-page targets so the new context is announced.
  document.querySelectorAll('a[href*="#"]').forEach((link) => {
    link.addEventListener("click", () => {
      const url = new URL(link.href, location.href);
      if (url.pathname !== location.pathname || !url.hash) return;
      const target = document.getElementById(
        decodeURIComponent(url.hash.slice(1)),
      );
      if (!target) return;
      target.setAttribute("tabindex", "-1");
      requestAnimationFrame(() => target.focus({ preventScroll: true }));
    });
  });
})();
