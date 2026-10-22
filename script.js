/* Shared navigation and theme. All page content remains readable without JavaScript. */
(() => {
  "use strict";
  const root = document.documentElement;
  function theme(value) {
    root.dataset.theme = value;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", value === "dark" ? "#0b101c" : "#f7f8fc");
    document.querySelectorAll(".theme-toggle").forEach((b) => {
      b.setAttribute("aria-pressed", String(value === "dark"));
      b.setAttribute(
        "aria-label",
        `Switch to ${value === "dark" ? "light" : "dark"} mode`,
      );
    });
  }
  theme(root.dataset.theme || "dark");
  let timer;
  document.querySelectorAll(".theme-toggle").forEach((b) =>
    b.addEventListener("click", () => {
      root.classList.add("theme-changing");
      clearTimeout(timer);
      timer = setTimeout(() => root.classList.remove("theme-changing"), 300);
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("theme", next);
      } catch {}
      theme(next);
    }),
  );
  addEventListener("storage", (e) => {
    if (e.key === "theme")
      theme(["light", "dark"].includes(e.newValue) ? e.newValue : "dark");
  });
  const menu = document.getElementById("mobileMenu"),
    button = document.getElementById("hamburger");
  function setMenu(open, focus = false) {
    if (!menu || !button) return;
    menu.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (focus) button.focus();
  }
  button?.addEventListener("click", () => setMenu(menu.hidden));
  menu?.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu && !menu.hidden) setMenu(false, true);
  });
  addEventListener("click", (e) => {
    if (menu && !menu.hidden && !e.target.closest(".site-header"))
      setMenu(false);
  });
  matchMedia("(min-width:761px)").addEventListener("change", (e) => {
    if (e.matches) setMenu(false);
  });
  document
    .querySelectorAll("#year")
    .forEach((el) => (el.textContent = new Date().getFullYear()));
  const hero = document.querySelector("[data-interactive-background]");
  if (
    hero &&
    !matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)").matches
  ) {
    let pending = false;
    hero.addEventListener("pointermove", (e) => {
      if (pending) return;
      pending = true;
      const x = e.clientX,
        y = e.clientY;
      requestAnimationFrame(() => {
        pending = false;
        const r = hero.getBoundingClientRect();
        hero.style.setProperty(
          "--pointer-x",
          `${((x - r.left) / r.width) * 100}%`,
        );
        hero.style.setProperty(
          "--pointer-y",
          `${((y - r.top) / r.height) * 100}%`,
        );
      });
    });
  }
})();
