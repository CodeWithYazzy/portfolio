/* Page interactions: theme, navigation, hero demo, archive. */
(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const root = document.documentElement;
  const systemTheme = matchMedia("(prefers-color-scheme: dark)");

  function storedTheme() {
    try {
      return localStorage.getItem("theme");
    } catch {
      return null;
    }
  }
  function applyTheme(theme) {
    root.dataset.theme = theme;
    const color = theme === "dark" ? "#000000" : "#fbfbfd";
    $('meta[name="theme-color"]')?.setAttribute("content", color);
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
        /* The current page still toggles. */
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

  // Add a border to the header after scrolling.
  const header = $("#navbar");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

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
    if (menu && !menu.hidden && !event.target.closest("#navbar")) setMenu(false);
  });
  matchMedia("(min-width: 701px)").addEventListener("change", (event) => {
    if (event.matches) setMenu(false);
  });

  // Focus the target section when an in-page link is used.
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
        requestAnimationFrame(() => target.focus({ preventScroll: true }));
      }
    }),
  );

  if ("IntersectionObserver" in window && $("#work")) {
    const links = $$(".desktop-nav a");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          links.forEach((link) => {
            if (new URL(link.href).hash === "#" + entry.target.id)
              link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
        }
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    ["work", "about", "contact"].forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  let toastTimer;
  function toast(message) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 4000);
  }
  $("#copyEmail")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("codewithyazzy@gmail.com");
      toast("Email address copied.");
    } catch {
      toast("Copy is unavailable. The email link is above.");
    }
  });

  // Iris coefficients shared with the demo page.
  const IRIS_MEAN = [5.8575, 3.049166666666666, 3.759166666666667, 1.2075];
  const IRIS_SCALE = [
    0.8514362865182572, 0.44515836757520594, 1.7808001868698118,
    0.7636712316173764,
  ];
  const IRIS_COEF = [
    [
      -1.0003651631318553, 1.0634839402359453, -1.7895002222546368,
      -1.716586636558806,
    ],
    [
      0.4566888535508926, -0.37542898149273707, -0.11516979607648324,
      -0.7865034740380231,
    ],
    [
      0.5436763095809638, -0.6880549587432071, 1.90467001833112,
      2.5030901105968293,
    ],
  ];
  const IRIS_INTERCEPT = [
    -0.3054433182228682, 1.8808490584010606, -1.5754057401781931,
  ];
  const IRIS_LABELS = ["setosa", "versicolor", "virginica"];
  const irisInputs = ["demoSl", "demoSw", "demoPl", "demoPw"].map((id) =>
    document.getElementById(id),
  );
  if (irisInputs.every(Boolean) && $("#demoSpecies")) {
    const speciesEl = $("#demoSpecies");
    const announceEl = $("#demoAnnounce");
    const bars = [
      $("#demoBarSetosa"),
      $("#demoBarVersicolor"),
      $("#demoBarVirginica"),
    ];
    const percents = [
      $("#demoPctSetosa"),
      $("#demoPctVersicolor"),
      $("#demoPctVirginica"),
    ];
    const outputs = ["demoSlOut", "demoSwOut", "demoPlOut", "demoPwOut"].map(
      (id) => document.getElementById(id),
    );
    const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

    function renderIris(announce) {
      const values = irisInputs.map((input) => parseFloat(input.value));
      values.forEach((value, index) => {
        if (outputs[index]) outputs[index].textContent = `${value.toFixed(1)} cm`;
      });
      if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
        speciesEl.textContent = "Check inputs";
        return;
      }
      const x = values.map(
        (value, index) => (value - IRIS_MEAN[index]) / IRIS_SCALE[index],
      );
      const logits = IRIS_COEF.map(
        (row, r) =>
          row.reduce((sum, weight, i) => sum + weight * x[i], 0) +
          IRIS_INTERCEPT[r],
      );
      const max = Math.max(...logits);
      const exps = logits.map((value) => Math.exp(value - max));
      const total = exps.reduce((sum, value) => sum + value, 0);
      const probs = exps.map((value) => value / total);
      const winner = probs.indexOf(Math.max(...probs));
      speciesEl.textContent = capitalize(IRIS_LABELS[winner]);
      bars.forEach((bar, index) => {
        if (!bar) return;
        bar.style.flexBasis = `${(probs[index] * 100).toFixed(1)}%`;
        bar.classList.toggle("is-winner", index === winner);
        if (percents[index])
          percents[index].textContent = `${Math.round(probs[index] * 100)}%`;
      });
      if (announce && announceEl)
        announceEl.textContent = `${capitalize(IRIS_LABELS[winner])}, ${Math.round(probs[winner] * 100)} percent.`;
    }
    irisInputs.forEach((input) =>
      input.addEventListener("input", () => renderIris(true)),
    );
    renderIris(false);
  }

  const grid = $("#projectsGrid");
  let catalog = window.PROJECT_CATALOG || [];
  let selectedFilter = "All";
  const pagePrefix = location.pathname.includes("/pages/") ? "../" : "";
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
  function demoFor(project) {
    if (project.name === "Portfolio Website")
      return { href: pagePrefix + "index.html", label: "Visit the site" };
    if (project.localDemo)
      return {
        href: `${pagePrefix}pages/demo.html?project=${encodeURIComponent(project.name)}`,
        label: "Try the demo",
      };
    return null;
  }
  function makeCard(project) {
    const card = document.createElement("article");
    card.className = "project-card";

    const top = document.createElement("p");
    top.className = "project-top";
    const status = document.createElement("span");
    status.className = "project-status";
    status.textContent = project.status;
    const category = document.createElement("span");
    category.className = "project-category";
    category.textContent = project.category;
    top.append(status, category);

    const title = document.createElement("h3");
    title.className = "project-title";
    title.textContent = project.name;

    const desc = document.createElement("p");
    desc.className = "project-desc";
    desc.textContent = project.description;

    const tech = document.createElement("p");
    tech.className = "project-tech";
    tech.textContent = (project.technologies || []).slice(0, 3).join(" · ");

    const actions = document.createElement("div");
    actions.className = "project-actions";
    const demo = demoFor(project);
    if (demo) {
      const link = document.createElement("a");
      link.href = demo.href;
      link.textContent = demo.label;
      actions.append(link);
    }
    const source = document.createElement("a");
    source.href = safeURL(project.github);
    source.textContent = "Source";
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    const note = document.createElement("span");
    note.className = "sr-only";
    note.textContent = " (opens in a new tab)";
    source.append(note);
    actions.append(source);

    card.append(top, title, desc, tech, actions);
    return card;
  }
  function renderGallery() {
    if (!grid) return;
    const query = ($("#projectSearch")?.value || "").trim().toLowerCase();
    const projects = catalog.filter(
      (project) =>
        (selectedFilter === "All" || project.category === selectedFilter) &&
        [project.name, project.description, ...(project.technologies || [])]
          .join(" ")
          .toLowerCase()
          .includes(query),
    );
    grid.replaceChildren(...projects.map(makeCard));
    const count = $("#projectCount");
    if (count) {
      const filter = selectedFilter === "All" ? "" : ` · ${selectedFilter}`;
      count.textContent = `${projects.length} ${
        projects.length === 1 ? "project" : "projects"
      }${filter}`;
    }
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
        /* The bundled catalog also supports offline browsing. */
      });
  }
})();
