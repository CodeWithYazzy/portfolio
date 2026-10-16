/* YasirLab 2.0 — progressive enhancements, no framework or runtime dependencies. */
(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const root = document.documentElement;
  const systemTheme = matchMedia("(prefers-color-scheme: dark)");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  function storedTheme() {
    try {
      return localStorage.getItem("theme");
    } catch {
      return null;
    }
  }
  function applyTheme(theme) {
    root.dataset.theme = theme;
    $('meta[name="theme-color"]')?.setAttribute(
      "content",
      theme === "dark" ? "#111113" : "#f5f5f7",
    );
    $$(".theme-toggle").forEach((button) => {
      button.setAttribute("aria-pressed", String(theme === "dark"));
      button.setAttribute(
        "aria-label",
        `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
      );
    });
  }
  applyTheme(root.dataset.theme || (systemTheme.matches ? "dark" : "light"));
  $$(".theme-toggle").forEach((button) =>
    button.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("theme", next);
      } catch {
        /* Current page still toggles. */
      }
      applyTheme(next);
    }),
  );
  systemTheme.addEventListener("change", (event) => {
    if (!["light", "dark"].includes(storedTheme()))
      applyTheme(event.matches ? "dark" : "light");
  });
  window.addEventListener("storage", (event) => {
    if (event.key === "theme")
      applyTheme(
        ["light", "dark"].includes(event.newValue)
          ? event.newValue
          : systemTheme.matches
            ? "dark"
            : "light",
      );
  });
  if ($("#year")) $("#year").textContent = new Date().getFullYear();

  const menu = $("#mobileMenu");
  const hamburger = $("#hamburger");
  function setMenu(open, restoreFocus = false) {
    if (!menu || !hamburger) return;
    menu.hidden = !open;
    hamburger.setAttribute("aria-expanded", String(open));
    hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (restoreFocus) hamburger.focus();
  }
  hamburger?.addEventListener("click", () => setMenu(menu.hidden));
  menu?.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu && !menu.hidden) setMenu(false, true);
  });
  document.addEventListener("click", (event) => {
    if (menu && !menu.hidden && !event.target.closest("#navbar"))
      setMenu(false);
  });
  matchMedia("(min-width: 761px)").addEventListener("change", (event) => {
    if (event.matches) setMenu(false);
  });
  // Native anchor links retain keyboard behavior, history, and reduced-motion support.
  $$('a[href*="#"]').forEach((link) =>
    link.addEventListener("click", () => {
      const url = new URL(link.href, location.href);
      if (
        url.pathname.replace(/index\.html$/, "") !==
          location.pathname.replace(/index\.html$/, "") ||
        !url.hash
      )
        return;
      const target = document.getElementById(
        decodeURIComponent(url.hash.slice(1)),
      );
      if (target) {
        target.setAttribute("tabindex", "-1");
        // Focus without moving the viewport; the native anchor performs scrolling.
        requestAnimationFrame(() => target.focus({ preventScroll: true }));
      }
    }),
  );
  if ("IntersectionObserver" in window && $("#home")) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            $$(".desktop-nav a").forEach((link) => {
              if (new URL(link.href).hash === "#" + entry.target.id)
                link.setAttribute("aria-current", "location");
              else link.removeAttribute("aria-current");
            });
          }
      },
      { rootMargin: "-15% 0px -65% 0px" },
    );
    $$("#home, #projects, #lab, #about, #contact").forEach((section) =>
      observer.observe(section),
    );
  }
  let toastTimer;
  function toast(message) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 5000);
  }
  $("#copyEmail")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("codewithyazzy@gmail.com");
      toast("Email address copied.");
    } catch {
      toast("Copy is unavailable here. Use the email address above.");
    }
  });
  const form = $("#contactForm");
  if (form) {
    form.querySelector('button[type="submit"]').disabled = false;
    const fields = ["name", "email", "subject", "message"].map((id) =>
      $("#" + id),
    );
    function error(field, message) {
      $("#" + field.id + "Error").textContent = message;
      if (message) {
        field.setAttribute("aria-invalid", "true");
        field.setAttribute("aria-describedby", field.id + "Error");
      } else {
        field.removeAttribute("aria-invalid");
        field.removeAttribute("aria-describedby");
      }
    }
    fields.forEach((field) =>
      field.addEventListener("input", () => error(field, "")),
    );
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      let firstInvalid;
      fields.forEach((field) => {
        let message = "";
        if (!field.value.trim())
          message = `Please enter ${field.id === "name" ? "your name" : field.id === "subject" ? "a subject" : field.id === "message" ? "a message" : "your email address"}.`;
        else if (field.id === "email" && field.validity.typeMismatch)
          message = "Please enter a valid email address.";
        else if (field.id === "message" && field.value.trim().length < 10)
          message = "Please write at least 10 characters.";
        error(field, message);
        if (message && !firstInvalid) firstInvalid = field;
      });
      const status = $("#formStatus");
      if (firstInvalid) {
        status.textContent = "Please check the highlighted fields.";
        firstInvalid.focus();
        return;
      }
      const subject = $("#subject").value.trim();
      const body = `Name: ${$("#name").value.trim()}\nEmail: ${$("#email").value.trim()}\n\n${$("#message").value.trim()}`;
      const href = `mailto:codewithyazzy@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      status.textContent =
        "Your email draft is ready. Finish sending it in your email app. Your message stays here if the app does not open.";
      const draft = document.createElement('a');
      draft.href = href;
      draft.target = '_blank';
      draft.rel = 'noopener noreferrer';
      document.body.append(draft);
      draft.click();
      draft.remove();
    });
  }

  // Native dialogs provide focus containment, Escape handling, and focus restoration.
  $$("dialog").forEach((dialog) => {
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const focusable = $$('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled])', dialog).filter(el => el.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    $(".dialog-close", dialog)?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      const box = dialog.getBoundingClientRect();
      if (
        event.target === dialog &&
        (event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom)
      )
        dialog.close();
    });
    dialog.addEventListener("close", () => {
      document.body.style.overflow = "";
    });
  });
  function showDialog(dialog) {
    dialog.showModal();
    document.body.style.overflow = "hidden";
  }
  const concepts = [
    [
      "CNN vs transfer learning",
      "Could pretrained features help a small image dataset?",
      "Pretrained features might improve a small-data baseline.",
      "Choose an image dataset, fix a split and augmentation, compare a small CNN with a pretrained backbone.",
      "Held-out accuracy, per-class recall, and training cost. Keep the test data out of tuning.",
    ],
    [
      "Model evaluation",
      "What changes when the test set stays unseen?",
      "A careful split could expose overfitting hidden by training scores.",
      "Start with a small classification baseline. Compare training and validation behavior; reserve a final test set.",
      "A split description, confusion matrix, and per-class metrics, including errors and limitations.",
    ],
    [
      "Hyperparameter search",
      "Which settings are worth the extra compute?",
      "A limited random search may be a useful starting point.",
      "Set a compute budget and fixed validation folds. Compare defaults with a small randomized search.",
      "Validation performance and compute cost, followed by one final held-out evaluation.",
    ],
    [
      "Attention & text",
      "When is a simple text baseline enough?",
      "TF-IDF may provide a useful reference before a more complex model.",
      "Select a properly deduplicated text dataset. Compare a linear baseline with a small attention-based model.",
      "Per-class F1, inference time, and example errors. No conclusion before the comparison.",
    ],
    [
      "Understanding data",
      "What should we know before fitting a model?",
      "Inspecting distributions and missing values may reveal better preprocessing choices.",
      "Profile one dataset. Fit preprocessing on training data only, and compare a baseline with one controlled change.",
      "Distribution summaries, missing-value counts, and a documented validation comparison.",
    ],
    [
      "Inference trade-offs",
      "What do smaller models give up to run faster?",
      "A smaller model might trade some performance for lower cost.",
      "Use fixed inputs and one hardware target. Compare an original model with a supported smaller variant.",
      "Latency distributions, model size, and held-out performance with hardware and batch size stated.",
    ],
  ];
  $$("[data-lab]").forEach((button) =>
    button.addEventListener("click", () => {
      const [title, question, hypothesis, method, evidence] =
        concepts[Number(button.dataset.lab)];
      $("#labModalTitle").textContent = title;
      $("#labModalDesc").textContent = question;
      const body = $("#labModalBody");
      body.replaceChildren();
      for (const [label, text] of [
        ["Hypothesis", hypothesis],
        ["Possible method", method],
        ["Evidence to collect", evidence],
        ["Result", "Not run. No measured result is available."],
      ]) {
        const dt = document.createElement("dt");
        dt.textContent = label;
        const dd = document.createElement("dd");
        dd.textContent = text;
        body.append(dt, dd);
      }
      showDialog($("#labModal"));
    }),
  );

  const grid = $("#projectsGrid");
  let catalog = window.PROJECT_CATALOG || [];
  let selectedFilter = "All";
  const pagePrefix = location.pathname.includes("/pages/") ? "../" : "";
  function localPreview(project) {
    return `${pagePrefix}pages/demo.html?project=${encodeURIComponent(project.name)}`;
  }
  function safeURL(url) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" && parsed.hostname === "github.com"
        ? parsed.href
        : "https://github.com/CodeWithYazzy";
    } catch {
      return "https://github.com/CodeWithYazzy";
    }
  }
  function openProject(project) {
    $("#modalTitle").textContent = project.name;
    $("#modalStatus").textContent = `${project.category} / ${project.status}`;
    $("#modalDesc").textContent = project.description;
    $("#modalLimitations").textContent = project.limitations;
    $("#modalDemo").href =
      project.name === "Portfolio Website"
        ? pagePrefix + "index.html"
        : localPreview(project);
    $("#modalDemo").textContent =
      project.name === "Portfolio Website"
        ? "Explore this site →"
        : project.localDemo
          ? "Try browser demo →"
          : "Explore project →";
    $("#modalGithub").href = safeURL(project.github);
    showDialog($("#projectModal"));
  }
  function addArrow(element) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("class", "arrow-icon");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M5 19 19 5M5 5h14v14");
    svg.append(path);
    element.append(svg);
  }
  function makeCard(project, index) {
    const card = document.createElement("article");
    card.className = "project-card";
    const art = document.createElement("div");
    art.className = "project-art";
    const img = document.createElement("img");
    const illustration =
      project.localDemo === "iris"
        ? "iris-study"
        : project.localDemo === "calculator"
          ? "calculator-study"
          : project.category === "Web"
            ? "web-study"
            : project.category === "Data"
              ? "data-study"
              : "model-study";
    img.src = `${pagePrefix}assets/${illustration}.svg`;
    img.alt = "";
    img.width = 560;
    img.height = 420;
    img.loading = "lazy";
    const artLabel = document.createElement("span");
    artLabel.className = "project-art-label";
    artLabel.textContent =
      "VISUAL STUDY / " + String(index + 1).padStart(2, "0");
    art.append(img, artLabel);
    const copy = document.createElement("div");
    copy.className = "project-copy";
    const meta = document.createElement("div");
    meta.className = "project-meta";
    const status = document.createElement("span");
    status.className = "project-status";
    status.textContent = project.status;
    const category = document.createElement("span");
    category.textContent = project.category;
    meta.append(status, category);
    const title = document.createElement("h3");
    title.textContent = project.name;
    const desc = document.createElement("p");
    desc.textContent = project.description;
    const tags = document.createElement("div");
    tags.className = "tags";
    (project.technologies || []).slice(0, 3).forEach((technology) => {
      const tag = document.createElement("span");
      tag.textContent = technology;
      tags.append(tag);
    });
    const actions = document.createElement("div");
    actions.className = "project-actions";
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = project.localDemo
      ? "Explore demo "
      : "Explore project ";
    button.setAttribute(
      "aria-label",
      `Explore ${project.localDemo ? "demo" : "project"}: ${project.name}`,
    );
    button.setAttribute("aria-haspopup", "dialog");
    button.addEventListener("click", () => openProject(project));
    const source = document.createElement("a");
    source.href = safeURL(project.github);
    source.textContent = "Source ";
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    source.setAttribute(
      "aria-label",
      `${project.name} source on GitHub (opens in new tab)`,
    );
    addArrow(button);
    addArrow(source);
    actions.append(button, source);
    copy.append(meta, title, desc, tags, actions);
    card.append(art, copy);
    return card;
  }
  function renderGallery() {
    if (!grid) return;
    const query = ($("#projectSearch")?.value || "").trim().toLowerCase();
    const projects = catalog.filter(
      (project) =>
        (!grid.dataset.featured || project.featured) &&
        (selectedFilter === "All" || project.category === selectedFilter) &&
        [project.name, project.description, ...(project.technologies || [])]
          .join(" ")
          .toLowerCase()
          .includes(query),
    );
    grid.replaceChildren(...projects.map(makeCard));
    if ($("#projectCount"))
      $("#projectCount").textContent =
        `${projects.length} ${projects.length === 1 ? "project" : "projects"}${selectedFilter === "All" ? " in the collection" : " in " + selectedFilter.toLowerCase()}`;
    if ($("#projectEmpty")) $("#projectEmpty").hidden = projects.length !== 0;
  }
  $$("[data-filter]").forEach((button) =>
    button.addEventListener("click", () => {
      selectedFilter = button.dataset.filter;
      $$("[data-filter]").forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
      renderGallery();
    }),
  );
  $("#projectSearch")?.addEventListener("input", renderGallery);
  $("#resetFilters")?.addEventListener("click", () => {
    $("#projectSearch").value = "";
    selectedFilter = "All";
    $$("[data-filter]").forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.filter === "All"),
      ),
    );
    renderGallery();
    $("#projectSearch").focus();
  });
  renderGallery();
  if (grid && location.protocol !== "file:") {
    fetch(pagePrefix + "assets/projects.json")
      .then((response) => {
        if (!response.ok) throw new Error("Catalog unavailable");
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data.projects) || data.projects.length === 0) return;
        catalog = data.projects;
        renderGallery();
      })
      .catch(() => {
        /* The bundled catalog also supports offline/file browsing. */
      });
  }
  if (!motion.matches && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("reveal-pending");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    $$(".section-heading, .about-grid, .learning-journal, .lab-intro").forEach(
      (el) => {
        el.classList.add("reveal-ready", "reveal-pending");
        observer.observe(el);
      },
    );
    motion.addEventListener("change", () => {
      if (motion.matches)
        $$(".reveal-pending").forEach((el) =>
          el.classList.remove("reveal-pending"),
        );
    });
    // Fragment navigation and browser Find must never land on invisible content.
    window.addEventListener("hashchange", () =>
      $$(".reveal-pending").forEach((el) =>
        el.classList.remove("reveal-pending"),
      ),
    );
  }
})();
