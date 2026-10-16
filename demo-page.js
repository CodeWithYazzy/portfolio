// Project preview controller. Local arithmetic and Iris inference are preserved.
const params = new URLSearchParams(location.search);
const requestedName = params.get("project") || params.get("title") || "";
const fallback = {
  name: requestedName || "Project",
  description: "Project details are not available right now.",
  technologies: [],
};

const titleEl = document.getElementById("projectTitle");
const headerEl = document.getElementById("headerTitle");
const descriptionEl = document.getElementById("projectDescription");
const tagsEl = document.getElementById("projectTags");
const imageEl = document.getElementById("projectImage");
const statusEl = document.getElementById("status");
const demoOutputEl = document.getElementById("demoOutput");
const runDemoEl = document.getElementById("runDemo");
const sourceCodeEl = document.getElementById("sourceCode");
const availabilityTextEl = document.getElementById("availabilityText");
const calculatorDemoEl = document.getElementById("calculatorDemo");
const calculatorDisplayEl = document.getElementById("calculatorDisplay");
const irisDemoEl = document.getElementById("irisDemo");
const irisSlEl = document.getElementById("irisSl");
const irisSwEl = document.getElementById("irisSw");
const irisPlEl = document.getElementById("irisPl");
const irisPwEl = document.getElementById("irisPw");
const irisResultEl = document.getElementById("irisResult");
const detailsGridEl = document.getElementById("projectDetails");
const detailProblemEl = document.getElementById("detailProblem");
const detailApproachEl = document.getElementById("detailApproach");
const detailDatasetEl = document.getElementById("detailDataset");
const detailModelEl = document.getElementById("detailModel");
const detailResultsEl = document.getElementById("detailResults");
const detailResultsCardEl = document.getElementById("detailResultsCard");
const detailEngineeringEl = document.getElementById("detailEngineering");
const detailPreprocessingEl = document.getElementById("detailPreprocessing");
const detailFeaturesEl = document.getElementById("detailFeatures");
const detailTrainingEl = document.getElementById("detailTraining");
const detailEvaluationEl = document.getElementById("detailEvaluation");
const detailDeploymentEl = document.getElementById("detailDeployment");
const detailLimitationsEl = document.getElementById("detailLimitations");
const cardProblemEl = document.getElementById("cardProblem");
const cardApproachEl = document.getElementById("cardApproach");
const cardDatasetEl = document.getElementById("cardDataset");
const cardModelEl = document.getElementById("cardModel");
const cardPreprocessingEl = document.getElementById("cardPreprocessing");
const cardFeaturesEl = document.getElementById("cardFeatures");
const cardTrainingEl = document.getElementById("cardTraining");
const cardEvaluationEl = document.getElementById("cardEvaluation");
const cardDeploymentEl = document.getElementById("cardDeployment");
const cardLimitationsEl = document.getElementById("cardLimitations");
const cardEngineeringEl = document.getElementById("cardEngineering");
const metricsSectionEl = document.getElementById("metricsSection");
const metricsGridEl = document.getElementById("metricsGrid");
const engineeringSectionEl = document.getElementById("engineeringSection");
const engineeringGridEl = document.getElementById("engineeringGrid");
const verificationBannerEl = document.getElementById("verificationBanner");
let calculatorExpression = "";
// Fixed Iris coefficients retained from the original browser demo.
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
document.getElementById("year").textContent = new Date().getFullYear();

const runner = window.GithubDemoRunner;
let currentProject = null;

function renderProject(project) {
  currentProject = project;
  runDemoEl.disabled = !project.github;
  document.getElementById("projectKind").textContent =
    project.status || "Project not found";
  titleEl.textContent = project.name;
  if (headerEl) headerEl.textContent = project.name;
  document.title = project.name + " — YasirLab 2.0";
  descriptionEl.textContent =
    project.description || "Project details are not available right now.";
  const repoInfo = runner ? runner.parseGithubUrl(project.github || "") : null;
  if (sourceCodeEl) {
    sourceCodeEl.href = project.github || "https://github.com/CodeWithYazzy";
    sourceCodeEl.textContent = repoInfo ? "Open Source Code" : "GitHub Profile";
  }
  if (availabilityTextEl) {
    availabilityTextEl.textContent = repoInfo
      ? "This project links to GitHub. Run Demo checks what can run here; browser examples are labeled separately."
      : "A specific public repository was not provided for this project yet, so there is no live source to run.";
  }
  tagsEl.replaceChildren();
  (Array.isArray(project.technologies) ? project.technologies : []).forEach(
    (technology) => {
      const tag = document.createElement("span");
      tag.textContent = technology;
      tagsEl.appendChild(tag);
    },
  );
  if (project.image) {
    const art =
      project.localDemo === "iris"
        ? "iris-study"
        : project.localDemo === "calculator"
          ? "calculator-study"
          : project.category === "Web"
            ? "web-study"
            : project.category === "Data"
              ? "data-study"
              : "model-study";
    imageEl.src = "../assets/" + art + ".svg";
    imageEl.alt = ""; // Decorative visual study; not a product screenshot.
    imageEl.hidden = false;
  }
  const detailMap = [
    [cardProblemEl, detailProblemEl, project.problem],
    [cardApproachEl, detailApproachEl, project.approach],
    [cardDatasetEl, detailDatasetEl, project.dataset],
    [cardModelEl, detailModelEl, project.model],
    [cardPreprocessingEl, detailPreprocessingEl, project.dataPreprocessing],
    [cardFeaturesEl, detailFeaturesEl, project.features],
    [cardTrainingEl, detailTrainingEl, project.training],
    [cardEvaluationEl, detailEvaluationEl, project.evaluation],
    [cardDeploymentEl, detailDeploymentEl, project.deployment],
    [cardLimitationsEl, detailLimitationsEl, project.limitations],
    [cardEngineeringEl, detailEngineeringEl, project.engineering],
  ];
  let visibleDetails = 0;
  detailMap.forEach(([card, el, val]) => {
    if (val && String(val).trim()) {
      el.textContent = val;
      card.hidden = false;
      visibleDetails++;
    } else {
      card.hidden = true;
    }
  });
  if (project.results && String(project.results).trim()) {
    detailResultsEl.textContent = project.results;
    detailResultsCardEl.hidden = false;
    visibleDetails++;
  } else {
    detailResultsCardEl.hidden = true;
  }
  if (detailsGridEl) detailsGridEl.hidden = visibleDetails === 0;

  if (metricsSectionEl && metricsGridEl) {
    const metrics = Array.isArray(project.metrics)
      ? project.metrics.filter((m) => m && m.label && m.value)
      : [];
    metricsGridEl.replaceChildren();
    if (metrics.length) {
      metrics.forEach((m) => {
        const card = document.createElement("div");
        card.className = "metric-card";
        const v = document.createElement("strong");
        v.textContent = m.value;
        const l = document.createElement("span");
        l.textContent = m.label;
        card.append(v, l);
        if (m.note) {
          const n = document.createElement("small");
          n.textContent = m.note;
          card.appendChild(n);
        }
        metricsGridEl.appendChild(card);
      });
      metricsSectionEl.hidden = false;
    } else {
      metricsSectionEl.hidden = true;
    }
  }

  if (engineeringSectionEl && engineeringGridEl) {
    const engFields = [
      ["Architecture", project.architecture],
      ["Inference", project.inference],
      ["API", project.api],
      ["Optimization", project.optimization],
      ["Testing", project.testing],
    ].filter(([, v]) => v && String(v).trim());
    engineeringGridEl.replaceChildren();
    if (engFields.length) {
      engFields.forEach(([label, val]) => {
        const card = document.createElement("div");
        card.className = "eng-card";
        const h = document.createElement("h4");
        h.textContent = label;
        const p = document.createElement("p");
        p.textContent = val;
        card.append(h, p);
        engineeringGridEl.appendChild(card);
      });
      engineeringSectionEl.hidden = false;
    } else {
      engineeringSectionEl.hidden = true;
    }
  }

  if (verificationBannerEl) {
    verificationBannerEl.hidden = true;
    try {
      lucide.createIcons();
    } catch (e) {}
  }
}

function showCalculator(visible) {
  if (calculatorDemoEl) calculatorDemoEl.hidden = !visible;
}
function showIris(visible) {
  if (irisDemoEl) irisDemoEl.hidden = !visible;
}

async function loadProject() {
  renderProject(fallback);
  try {
    const response = await fetch("../assets/projects.json");
    if (!response.ok) throw new Error("Project data unavailable");
    const data = await response.json();
    const projects = Array.isArray(data.projects) ? data.projects : [];
    const project = projects.find(
      (item) => item.name.toLowerCase() === requestedName.toLowerCase(),
    );
    if (project) {
      renderProject(project);
      showCalculator(false);
      showIris(false);
    } else
      statusEl.textContent =
        "This project is not listed in the current catalog.";
  } catch (error) {
    const localProject = (window.PROJECT_CATALOG || []).find(
      (item) => item.name.toLowerCase() === requestedName.toLowerCase(),
    );
    if (localProject) {
      renderProject(localProject);
      showCalculator(false);
      showIris(false);
      statusEl.textContent = "";
    } else {
      statusEl.textContent = "Project details could not be loaded.";
    }
  }
}
// ==========================================
// DEMO EXECUTION PIPELINE (real GitHub inspection)
// ==========================================
const pipelineEl = document.getElementById("pipeline");
const noticePanelEl = document.getElementById("noticePanel");
const errorPanelEl = document.getElementById("errorPanel");
const frameWrapEl = document.getElementById("frameWrap");
const frameTitleEl = document.getElementById("frameTitle");
const frameBadgeEl = document.getElementById("frameBadge");
const demoFrameEl = document.getElementById("demoFrame");
const frameSkeletonEl = document.getElementById("frameSkeleton");
const scrollArrowEl = document.getElementById("scrollToDemo");
let stepItems = [];

demoFrameEl.addEventListener("load", () => {
  frameSkeletonEl.hidden = true;
});

function scrollToEl(el) {
  if (!el) return;
  try {
    if (typeof el.scrollIntoView === "function")
      el.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
  } catch (err) {
    /* older browsers */
  }
}

// Auto-scroll to the running demo, then retire the floating arrow.
function settleDemo(target) {
  scrollToEl(target);
  setTimeout(() => {
    if (scrollArrowEl) scrollArrowEl.hidden = true;
  }, 1600);
}

function hideAllOutputs() {
  [noticePanelEl, errorPanelEl, frameWrapEl].forEach((el) => {
    el.hidden = true;
  });
  frameSkeletonEl.hidden = true;
  if (calculatorDemoEl) calculatorDemoEl.hidden = true;
  if (irisDemoEl) irisDemoEl.hidden = true;
  if (scrollArrowEl) scrollArrowEl.hidden = true;
  statusEl.textContent = "";
}

function resetPipeline() {
  pipelineEl.hidden = false;
  pipelineEl.classList.add("active");
  pipelineEl.replaceChildren();
  stepItems = [];
}

function addStep(label, state) {
  const li = document.createElement("li");
  li.textContent = label;
  if (state) li.classList.add(state);
  pipelineEl.appendChild(li);
  stepItems.push(li);
  return li;
}

function onStep(label) {
  stepItems.forEach((li) => li.classList.replace("active", "done"));
  addStep(label, "active");
}
function completeStep() {
  stepItems.forEach((li) => li.classList.remove("active", "error"));
  stepItems.forEach((li) => li.classList.add("done"));
}
function failStep() {
  const active = [...stepItems]
    .reverse()
    .find((li) => li.classList.contains("active"));
  if (active) active.classList.replace("active", "error");
}

function panelActions(container, actions) {
  (actions || []).forEach((action) => {
    const link = document.createElement("a");
    link.href = action.href || "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = action.label;
    container.appendChild(link);
  });
}

function showUnavailable(model) {
  errorPanelEl.hidden = false;
  errorPanelEl.className = "note-panel";
  errorPanelEl.replaceChildren();
  const h = document.createElement("h3");
  h.textContent = model.title || "Demo unavailable";
  const p = document.createElement("p");
  p.className = "panel-detail";
  p.textContent = model.detail || "";
  errorPanelEl.append(h, p);
  panelActions(errorPanelEl, model.actions);
  statusEl.textContent =
    "This project cannot be executed directly in the browser — see the reason above.";
  frameWrapEl.hidden = true;
  frameSkeletonEl.hidden = true;
  if (scrollArrowEl) scrollArrowEl.hidden = true;
  scrollToEl(errorPanelEl);
}

function showError(model) {
  errorPanelEl.hidden = false;
  errorPanelEl.className = "error-panel";
  errorPanelEl.replaceChildren();
  const h = document.createElement("h3");
  h.textContent = model.title || "Demo failed";
  const p = document.createElement("p");
  p.className = "panel-detail";
  p.textContent = model.detail || "";
  errorPanelEl.append(h, p);
  const retry = document.createElement("button");
  retry.type = "button";
  retry.textContent = "Retry";
  retry.addEventListener("click", () => executeRun(false));
  const actions = document.createElement("div");
  actions.className = "panel-actions";
  actions.appendChild(retry);
  errorPanelEl.appendChild(actions);
  statusEl.textContent =
    "The demo could not be loaded. Technical details are in the browser console.";
  frameWrapEl.hidden = true;
  frameSkeletonEl.hidden = true;
  if (scrollArrowEl) scrollArrowEl.hidden = true;
  scrollToEl(errorPanelEl);
}

function showNotice(text) {
  noticePanelEl.hidden = false;
  noticePanelEl.replaceChildren();
  const p = document.createElement("p");
  p.className = "panel-detail";
  p.style.margin = "0";
  p.textContent = text;
  noticePanelEl.appendChild(p);
}

function renderStaticFrame(html, label) {
  frameWrapEl.hidden = false;
  frameTitleEl.textContent = currentProject ? currentProject.name : "preview";
  frameBadgeEl.textContent = label.toUpperCase();
  demoFrameEl.srcdoc = html;
  settleDemo(frameWrapEl);
}

function renderDeployedFrame(url) {
  frameWrapEl.hidden = false;
  frameTitleEl.textContent = url;
  frameBadgeEl.textContent = "DEPLOYED APP";
  demoFrameEl.removeAttribute("srcdoc");
  demoFrameEl.src = url;
  showNotice(
    "If the preview area stays blank, this deployment refuses iframe embedding — open it directly:",
  );
  const link = document.createElement("a");
  link.className = "panel-link";
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Open Live Demo ↗";
  noticePanelEl.appendChild(link);
  settleDemo(frameWrapEl);
}

// Safe arithmetic evaluator — recursive descent, NO eval()/Function().
// Mirrors server.py rules: + - * / % ^, parentheses, unary +/-, size guards.
function evaluateLocally(rawExpression) {
  let source = String(rawExpression || "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .trim();
  if (!source) throw new Error("Enter a valid expression.");
  source = source.replace(/[+\-*/%^.\s]+$/, "");
  if (!source) throw new Error("Enter a valid expression.");

  const tokens = source.match(/\d*\.?\d+|[+\-*/%^()]/g);
  if (!tokens || tokens.join("") !== source.replace(/\s+/g, "")) {
    throw new Error("Enter a valid expression.");
  }
  let pos = 0;
  const peek = () => tokens[pos];

  function parsePrimary() {
    const token = tokens[pos];
    if (token === undefined) throw new Error("Enter a valid expression.");
    pos++;
    if (token === "(") {
      const value = parseExpression();
      if (peek() !== ")") throw new Error("Enter a valid expression.");
      pos++;
      return value;
    }
    const number = Number(token);
    if (isNaN(number) || !isFinite(number))
      throw new Error("Enter a valid expression.");
    if (Math.abs(number) > 1e12) throw new Error("Number is too large.");
    return number;
  }
  function parseUnary() {
    if (peek() === "-") {
      pos++;
      return -parseUnary();
    }
    if (peek() === "+") {
      pos++;
      return parseUnary();
    }
    return parsePrimary();
  }
  function parseFactor() {
    const base = parseUnary();
    if (peek() === "^") {
      pos++;
      const exponent = parseFactor();
      if (Math.abs(exponent) > 10) throw new Error("Power is too large.");
      return Math.pow(base, exponent);
    }
    return base;
  }
  function parseTerm() {
    let value = parseFactor();
    while (peek() === "*" || peek() === "/" || peek() === "%") {
      const op = tokens[pos++];
      const rhs = parseFactor();
      if ((op === "/" || op === "%") && rhs === 0)
        throw new Error("Cannot divide by zero.");
      value = op === "*" ? value * rhs : op === "/" ? value / rhs : value % rhs;
    }
    return value;
  }
  function parseExpression() {
    let value = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = tokens[pos++];
      const rhs = parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  const result = parseExpression();
  if (pos !== tokens.length) throw new Error("Enter a valid expression.");
  if (!isFinite(result)) throw new Error("Result is out of range.");
  return parseFloat(result.toPrecision(12));
}

async function runCalculatorLocal(sourceInfo) {
  showCalculator(true);
  if (calculatorDisplayEl) calculatorDisplayEl.focus();
  statusEl.textContent = "Ready — arithmetic runs inside your browser.";
  if (sourceInfo && sourceInfo.path) {
    const card = availabilityTextEl.parentElement;
    let meta = document.getElementById("ghSourceMeta");
    if (!meta) {
      meta = document.createElement("p");
      meta.id = "ghSourceMeta";
      meta.className = "source-meta";
      const anchor = card.querySelector(".status");
      card.insertBefore(meta, anchor);
    }
    meta.replaceChildren();
    meta.append("Verified GitHub source: ");
    const code = document.createElement("code");
    code.textContent =
      sourceInfo.path +
      " · " +
      sourceInfo.lines +
      " lines · " +
      Math.round(sourceInfo.bytes / 1024) +
      " KB" +
      (sourceInfo.gui ? " · Tkinter GUI confirmed in code" : "");
    meta.appendChild(code);
    meta.append(
      " — a desktop Python app cannot run inside a web page, so this preview evaluates in your browser (the Python backend is used automatically when it is running).",
    );
  }
  settleDemo(calculatorDemoEl);
}

function predictIris(sl, sw, pl, pw) {
  const x = [sl, sw, pl, pw].map((v, i) => (v - IRIS_MEAN[i]) / IRIS_SCALE[i]);
  const logits = IRIS_COEF.map(
    (row, r) => row.reduce((s, w, i) => s + w * x[i], 0) + IRIS_INTERCEPT[r],
  );
  const m = Math.max(...logits);
  const ex = logits.map((v) => Math.exp(v - m));
  const sum = ex.reduce((a, b) => a + b, 0);
  const probs = ex.map((v) => v / sum);
  const idx = probs.indexOf(Math.max(...probs));
  return { label: IRIS_LABELS[idx], probs, idx };
}

function renderIrisResult(sl, sw, pl, pw) {
  if ([sl, sw, pl, pw].some((v) => !Number.isFinite(v) || v <= 0)) {
    irisResultEl.textContent = "Enter four positive, finite measurements.";
    return;
  }
  const { label, probs } = predictIris(sl, sw, pl, pw);
  irisResultEl.replaceChildren();
  const strong = document.createElement("strong");
  strong.textContent = label.charAt(0).toUpperCase() + label.slice(1);
  strong.style.color = "var(--blue)";
  const p = document.createElement("div");
  p.className = "iris-probs";
  probs.forEach((pr, i) => {
    const s = document.createElement("span");
    s.textContent = `${IRIS_LABELS[i]} ${(pr * 100).toFixed(1)}%`;
    if (IRIS_LABELS[i] === label)
      (s.style.background = "#0B1220"),
        (s.style.color = "#fff"),
        (s.style.borderColor = "#0B1220");
    p.appendChild(s);
  });
  irisResultEl.append(strong, p);
  try {
    lucide.createIcons();
  } catch (e) {}
}

async function runIrisLocal(sourceInfo) {
  showIris(true);
  if (irisSlEl) irisSlEl.focus();
  statusEl.textContent =
    "Iris browser example ready — bundled coefficients, local inference. No accuracy claim is made here.";
  if (sourceInfo && sourceInfo.path) {
    const card = availabilityTextEl.parentElement;
    let meta = document.getElementById("ghSourceMeta");
    if (!meta) {
      meta = document.createElement("p");
      meta.id = "ghSourceMeta";
      meta.className = "source-meta";
      const anchor = card.querySelector(".status");
      card.insertBefore(meta, anchor);
    }
    meta.replaceChildren();
    meta.append("Verified GitHub source: ");
    const code = document.createElement("code");
    code.textContent =
      sourceInfo.path +
      " · " +
      sourceInfo.lines +
      " lines · " +
      Math.round(sourceInfo.bytes / 1024) +
      " KB" +
      (sourceInfo.model ? " · LogisticRegression confirmed" : "");
    meta.appendChild(code);
    meta.append(" — Python pipeline reproduced in JS (no server).");
  }
  // initial predict
  renderIrisResult(
    parseFloat(irisSlEl.value),
    parseFloat(irisSwEl.value),
    parseFloat(irisPlEl.value),
    parseFloat(irisPwEl.value),
  );
  settleDemo(irisDemoEl);
}

async function executeRun(force) {
  if (!runner) {
    statusEl.textContent = "Demo runner failed to load — refresh the page.";
    return;
  }
  hideAllOutputs();
  resetPipeline();
  if (scrollArrowEl) scrollArrowEl.hidden = false;

  const project = currentProject || Object.assign({}, fallback);
  const config = {
    name: project.name,
    github: project.github || "",
    subdir: project.subdir || "",
    demoUrl:
      project.demoUrl && /^https?:/i.test(project.demoUrl)
        ? project.demoUrl
        : project.demo && /^https?:/i.test(project.demo)
          ? project.demo
          : "",
    localDemo: project.localDemo || "",
  };

  await runner.runDemo(
    config,
    {
      onStep: (label) => {
        if (/Preparing demo|Loading deployed/i.test(label)) {
          frameWrapEl.hidden = false;
          frameSkeletonEl.hidden = false;
        }
        onStep(label);
      },
      completeStep,
      failStep,
      onReady: (message) => {
        statusEl.textContent = message;
      },
      onNotice: showNotice,
      onUnavailable: showUnavailable,
      onError: showError,
      renderStatic: renderStaticFrame,
      renderDeployed: renderDeployedFrame,
      renderLocalDemo: async (info) => {
        frameWrapEl.hidden = true;
        frameSkeletonEl.hidden = true;
        if (info && info.kind === "iris") await runIrisLocal(info.sourceInfo);
        else await runCalculatorLocal(info.sourceInfo);
      },
    },
    { force: !!force },
  );
}

runDemoEl.addEventListener("click", () => {
  executeRun(false).finally(() => {
    runDemoEl.classList.remove("loading");
    runDemoEl.disabled = false;
  });
  runDemoEl.classList.add("loading");
  runDemoEl.disabled = true;
});
if (scrollArrowEl) {
  scrollArrowEl.addEventListener("click", () => {
    const target = !frameWrapEl.hidden
      ? frameWrapEl
      : !irisDemoEl.hidden
        ? irisDemoEl
        : calculatorDemoEl;
    scrollToEl(target);
  });
}
[irisSlEl, irisSwEl, irisPlEl, irisPwEl].forEach(
  (el) =>
    el &&
    el.addEventListener("input", () =>
      renderIrisResult(
        parseFloat(irisSlEl.value),
        parseFloat(irisSwEl.value),
        parseFloat(irisPlEl.value),
        parseFloat(irisPwEl.value),
      ),
    ),
);

window.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.__ghDemoFrame !== true) return;
  if (data.type === "error")
    console.warn("[demo frame]", data.message, data.source + ":" + data.line);
  else if (data.type === "rejection")
    console.warn("[demo frame] unhandled rejection:", data.message);
});

async function calculateExpression() {
  if (!calculatorExpression) return;
  try {
    const result = evaluateLocally(calculatorExpression);
    calculatorExpression = String(result);
    calculatorDisplayEl.value = calculatorExpression;
    statusEl.textContent =
      "Evaluated locally in your browser — no Python or server required.";
  } catch (err) {
    statusEl.textContent =
      err && err.message ? err.message : "Enter a valid expression.";
  }
}

document.querySelectorAll("[data-calc]").forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.dataset.calc;
    if (value === "clear") calculatorExpression = "";
    else if (value === "delete")
      calculatorExpression = calculatorExpression.slice(0, -1);
    else if (value === "=") {
      calculateExpression();
      return;
    } else calculatorExpression += value;
    calculatorDisplayEl.value = calculatorExpression || "0";
  });
});

loadProject();
