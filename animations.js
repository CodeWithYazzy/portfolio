/* Progressive motion layer: reveals, pointer depth, and scroll feedback. */
(() => {
  "use strict";

  const root = document.documentElement;
  const motion = window.Motion;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const revealNodes = Array.from(document.querySelectorAll("[data-reveal]"));
  const revealed = new WeakSet();
  const introNodes = revealNodes.filter(
    (element) => element.dataset.reveal === "intro",
  );
  const scrollNodes = revealNodes.filter(
    (element) => element.dataset.reveal === "scroll",
  );
  const EASE = [0.23, 1, 0.32, 1];

  root.classList.add("motion-ready");

  function settle(element) {
    element.classList.add("is-revealed");
    element.style.removeProperty("opacity");
    element.style.removeProperty("transform");
    element.style.removeProperty("filter");
  }

  function settleAll() {
    revealNodes.forEach(settle);
  }

  function canAnimate() {
    return Boolean(motion) && !reduceMotion.matches;
  }

  function reveal(elements, kind) {
    const targets = elements.filter((element) => {
      if (revealed.has(element)) return false;
      revealed.add(element);
      return true;
    });
    if (!targets.length) return;

    if (!canAnimate()) {
      targets.forEach(settle);
      return;
    }

    const options = {
      duration: kind === "card" ? 0.55 : 0.68,
      delay: motion.stagger(kind === "card" ? 0.055 : 0.06),
      ease: EASE,
      onComplete: () => targets.forEach(settle),
    };

    if (kind === "card") {
      motion.animate(
        targets,
        {
          opacity: [0, 1],
          filter: ["blur(5px)", "blur(0px)"],
        },
        options,
      );
      return;
    }

    motion.animate(
      targets,
      {
        opacity: [0, 1],
        y: [18, 0],
      },
      options,
    );
  }

  if (introNodes.length) {
    requestAnimationFrame(() => reveal(introNodes, "intro"));
  }

  if (canAnimate()) {
    scrollNodes.forEach((element) => {
      motion.inView(
        element,
        () => reveal([element], "scroll"),
        { amount: 0.14, margin: "0px 0px -6% 0px" },
      );
    });

    document.querySelectorAll("[data-reveal-group]").forEach((group) => {
      const cards = Array.from(
        group.querySelectorAll('[data-reveal="card"]'),
      );
      if (!cards.length) return;
      motion.inView(
        group,
        () => reveal(cards, "card"),
        { amount: 0.16, margin: "0px 0px -4% 0px" },
      );
    });
  } else {
    settleAll();
  }

  reduceMotion.addEventListener("change", (event) => {
    if (event.matches) settleAll();
  });

  addEventListener("pageshow", (event) => {
    if (event.persisted) settleAll();
  });

  function setupScrollProgress() {
    const header = document.querySelector("#navbar");
    if (!header) return;

    const bar = document.createElement("span");
    bar.className = "scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    header.append(bar);

    let frame = 0;

    const update = () => {
      frame = 0;
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        scrollable > 0
          ? Math.min(1, Math.max(0, window.scrollY / scrollable))
          : 0;
      bar.style.transform = `scaleX(${progress})`;
      bar.classList.toggle("is-visible", progress > 0.002);
    };

    const queue = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue, { passive: true });
    update();
  }

  function setupPointerDetail() {
    if (reduceMotion.matches || !finePointer.matches) return;

    const tiltCards = document.querySelectorAll(".preview-card");
    tiltCards.forEach((card) => {
      let frame = 0;
      let latest = null;

      const apply = () => {
        frame = 0;
        if (!latest) return;
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = Math.min(rect.width, Math.max(0, latest.x - rect.left));
        const y = Math.min(rect.height, Math.max(0, latest.y - rect.top));
        const px = x / rect.width;
        const py = y / rect.height;

        card.style.setProperty("--mx", `${x.toFixed(1)}px`);
        card.style.setProperty("--my", `${y.toFixed(1)}px`);
        card.style.setProperty("--rx", `${((0.5 - py) * 3.4).toFixed(2)}deg`);
        card.style.setProperty("--ry", `${((px - 0.5) * 4).toFixed(2)}deg`);
      };

      card.addEventListener(
        "pointermove",
        (event) => {
          if (event.pointerType === "touch") return;
          latest = { x: event.clientX, y: event.clientY };
          if (!frame) frame = requestAnimationFrame(apply);
        },
        { passive: true },
      );

      card.addEventListener("pointerleave", () => {
        latest = null;
        cancelAnimationFrame(frame);
        frame = 0;
        card.style.setProperty("--mx", "50%");
        card.style.setProperty("--my", "50%");
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });

    document.querySelectorAll(".contact-link").forEach((link) => {
      link.addEventListener(
        "pointermove",
        (event) => {
          if (event.pointerType === "touch") return;
          const rect = link.getBoundingClientRect();
          link.style.setProperty(
            "--mx",
            `${(event.clientX - rect.left).toFixed(1)}px`,
          );
          link.style.setProperty(
            "--my",
            `${(event.clientY - rect.top).toFixed(1)}px`,
          );
        },
        { passive: true },
      );

      link.addEventListener("pointerleave", () => {
        link.style.setProperty("--mx", "50%");
        link.style.setProperty("--my", "50%");
      });
    });
  }

  setupScrollProgress();
  setupPointerDetail();
})();
