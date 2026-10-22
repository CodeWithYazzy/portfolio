// Dark navy is the default; explicit preferences persist before first paint.
(() => {
  let saved;
  try {
    saved = localStorage.getItem("theme");
  } catch {}
  const theme = ["light", "dark"].includes(saved) ? saved : "dark";
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#0b101c" : "#f7f8fc");
})();
