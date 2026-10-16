// Apply before first paint, including when browser storage is unavailable.
(() => {
  let saved;
  try {
    saved = localStorage.getItem("theme");
  } catch {
    /* System preference remains available. */
  }
  const theme = ["light", "dark"].includes(saved)
    ? saved
    : matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#111113" : "#f5f5f7");
})();
