/* Bounded native motion. Scroll writes only transforms; reduced motion stays static. */
(() => {
  "use strict";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = matchMedia("(max-width: 760px)");
  const header = document.querySelector(".site-header");
  const art = document.querySelector(".iteration-art");
  const lab = document.querySelector(".lab-visual");
  let pending = false;
  let artVisible = false;
  let labVisible = false;
  function update() {
    pending = false;
    header?.classList.toggle("is-scrolled", scrollY > 16);
    if (reduce.matches || mobile.matches) {
      art?.style.removeProperty("transform");
      lab?.style.removeProperty("transform");
      return;
    }
    // Read all geometry before writes; no continuous animation loop while idle.
    const artTop = artVisible ? art.getBoundingClientRect().top : null;
    const labTop = labVisible ? lab.getBoundingClientRect().top : null;
    if (artTop !== null)
      art.style.transform = `translateY(${Math.max(-18, Math.min(18, -artTop * 0.035))}px) rotate(${-7 + Math.max(-3, Math.min(3, -artTop * 0.006))}deg)`;
    if (labTop !== null)
      lab.style.transform = `rotate(${Math.max(-5, Math.min(5, (innerHeight / 2 - labTop) * 0.009))}deg)`;
  }
  function schedule() {
    if (!pending) {
      pending = true;
      requestAnimationFrame(update);
    }
  }
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === art) artVisible = entry.isIntersecting;
        if (entry.target === lab) labVisible = entry.isIntersecting;
      }
      schedule();
    });
    [art, lab].filter(Boolean).forEach((el) => observer.observe(el));
  }
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule, { passive: true });
  reduce.addEventListener("change", schedule);
  mobile.addEventListener("change", schedule);
  let themeTimer;
  document.querySelectorAll(".theme-toggle").forEach((button) =>
    button.addEventListener(
      "click",
      () => {
        document.documentElement.classList.add("theme-changing");
        clearTimeout(themeTimer);
        themeTimer = setTimeout(
          () => document.documentElement.classList.remove("theme-changing"),
          350,
        );
      },
      { capture: true },
    ),
  );
  schedule();
})();
