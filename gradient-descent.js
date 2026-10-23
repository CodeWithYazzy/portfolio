/* Gradient Descent Simulator: real derivative steps on a 1D loss curve. */
(() => {
  "use strict";

  const canvas = document.querySelector("#gdCanvas");
  if (!canvas || !window.CanvasLab) return;

  const lab = window.CanvasLab;
  const functionInput = document.querySelector("#gdFunction");
  const lrInput = document.querySelector("#gdLr");
  const startInput = document.querySelector("#gdStart");
  const lrValue = document.querySelector("#gdLrValue");
  const startValue = document.querySelector("#gdStartValue");
  const runButton = document.querySelector("#gdRun");
  const stepButton = document.querySelector("#gdStep");
  const resetButton = document.querySelector("#gdReset");
  const status = document.querySelector("#gdStatus");
  const announce = document.querySelector("#gdAnnounce");

  if (
    !functionInput ||
    !lrInput ||
    !startInput ||
    !runButton ||
    !stepButton ||
    !resetButton ||
    !status
  ) {
    return;
  }

  const FUNCTIONS = {
    bowl: {
      name: "bowl",
      f: (x) => 0.7 * (x - 1.4) ** 2 + 0.45,
      slope: (x) => 1.4 * (x - 1.4),
      curvature: () => 1.4,
    },
    double: {
      name: "double well",
      f: (x) => 0.25 * x ** 4 - x ** 2 + 0.9,
      slope: (x) => x ** 3 - 2 * x,
      curvature: (x) => 3 * x ** 2 - 2,
    },
  };

  const DOMAIN = [-2.7, 2.7];
  const context = canvas.getContext("2d");
  let palette = lab.colors();
  let functionName = functionInput.value;
  let learningRate = Number(lrInput.value);
  let startX = Number(startInput.value);
  let x = startX;
  let steps = 0;
  let history = [x];
  let running = false;
  let timer = null;
  let finished = false;
  let message = "";
  let width = 0;
  let height = 0;

  const currentFunction = () => FUNCTIONS[functionName] || FUNCTIONS.bowl;
  const format = (value, digits = 2) => {
    if (!Number.isFinite(value)) return "—";
    return value.toFixed(digits).replace("-", "−");
  };

  function bounds() {
    const fn = currentFunction();
    let minimum = Infinity;
    let maximum = -Infinity;
    for (let index = 0; index <= 180; index += 1) {
      const point = DOMAIN[0] + ((DOMAIN[1] - DOMAIN[0]) * index) / 180;
      const value = fn.f(point);
      minimum = Math.min(minimum, value);
      maximum = Math.max(maximum, value);
    }
    const pad = Math.max(0.5, (maximum - minimum) * 0.12);
    return { minimum: minimum - pad, maximum: maximum + pad };
  }

  function updateControls() {
    lrValue.textContent = learningRate.toFixed(2);
    startValue.textContent = format(startX, 1);
  }

  function updateStatus() {
    const fn = currentFunction();
    const value = fn.f(x);
    const slope = fn.slope(x);
    status.textContent = `x = ${format(x)} · f(x) = ${format(value)} · slope = ${format(slope)} · Step ${steps}`;
    status.dataset.x = Number.isFinite(x) ? x.toFixed(4) : "";
    status.dataset.loss = Number.isFinite(value) ? value.toFixed(4) : "";
    status.dataset.slope = Number.isFinite(slope) ? slope.toFixed(4) : "";
    status.dataset.steps = String(steps);
    status.dataset.function = functionName;
    status.dataset.state = finished
      ? message || "finished"
      : running
        ? "running"
        : "ready";
    status.classList.toggle("is-live", running);
    canvas.setAttribute(
      "aria-label",
      `Gradient descent plot of the ${fn.name} function after ${steps} steps. Current x is ${format(x)}, loss is ${format(value)}.${message ? ` ${message}` : ""}`,
    );
  }

  function draw() {
    const fit = lab.fitCanvas(canvas);
    width = fit.width;
    height = fit.height;
    const ctx = context;
    const fn = currentFunction();
    const { minimum, maximum } = bounds();
    const padding = {
      top: 28,
      right: 24,
      bottom: 42,
      left: 46,
    };
    const plotWidth = Math.max(1, width - padding.left - padding.right);
    const plotHeight = Math.max(1, height - padding.top - padding.bottom);
    const sx = (value) =>
      padding.left + ((value - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])) * plotWidth;
    const sy = (value) =>
      padding.top +
      (1 - (value - minimum) / (maximum - minimum)) * plotHeight;

    lab.clear(ctx, width, height, palette.paper);
    ctx.font =
      '10px ui-monospace, "SF Mono", "Cascadia Code", Consolas, monospace';
    ctx.textBaseline = "middle";

    // Horizontal grid and labels.
    for (let index = 0; index <= 4; index += 1) {
      const value = minimum + ((maximum - minimum) * index) / 4;
      const y = sy(value);
      ctx.strokeStyle = palette.lineSoft;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.fillStyle = palette.muted2;
      ctx.textAlign = "right";
      ctx.fillText(format(value, 1), padding.left - 9, y);
    }

    // Vertical grid and x labels.
    for (let index = 0; index <= 4; index += 1) {
      const value = DOMAIN[0] + ((DOMAIN[1] - DOMAIN[0]) * index) / 4;
      const xPosition = sx(value);
      ctx.strokeStyle = palette.lineSoft;
      ctx.beginPath();
      ctx.moveTo(xPosition, padding.top);
      ctx.lineTo(xPosition, height - padding.bottom);
      ctx.stroke();
      ctx.fillStyle = palette.muted2;
      ctx.textAlign = "center";
      ctx.fillText(format(value, 1), xPosition, height - padding.bottom + 18);
    }

    // Zero lines.
    if (DOMAIN[0] <= 0 && DOMAIN[1] >= 0) {
      ctx.strokeStyle = palette.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx(0), padding.top);
      ctx.lineTo(sx(0), height - padding.bottom);
      ctx.stroke();
    }
    if (minimum <= 0 && maximum >= 0) {
      ctx.strokeStyle = palette.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, sy(0));
      ctx.lineTo(width - padding.right, sy(0));
      ctx.stroke();
    }

    // Curve and a faint fill underneath.
    ctx.beginPath();
    for (let index = 0; index <= 260; index += 1) {
      const value = DOMAIN[0] + ((DOMAIN[1] - DOMAIN[0]) * index) / 260;
      const xPosition = sx(value);
      const yPosition = sy(fn.f(value));
      if (index === 0) ctx.moveTo(xPosition, yPosition);
      else ctx.lineTo(xPosition, yPosition);
    }
    ctx.strokeStyle = palette.muted;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    ctx.save();
    ctx.lineTo(sx(DOMAIN[1]), height - padding.bottom);
    ctx.lineTo(sx(DOMAIN[0]), height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = palette.blueSoft;
    ctx.globalAlpha = 0.55;
    ctx.fill();
    ctx.restore();

    // The path of previous positions.
    const visibleHistory = history.slice(-48);
    visibleHistory.forEach((value, index) => {
      if (!Number.isFinite(value)) return;
      const alpha =
        visibleHistory.length === 1
          ? 0.55
          : 0.18 + (index / (visibleHistory.length - 1)) * 0.42;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = palette.blue;
      ctx.beginPath();
      ctx.arc(sx(value), sy(fn.f(value)), 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    if (Number.isFinite(x) && x >= DOMAIN[0] && x <= DOMAIN[1]) {
      const pointX = sx(x);
      const pointY = sy(fn.f(x));
      const slope = fn.slope(x);
      const delta = 0.72;
      const leftX = Math.max(DOMAIN[0], x - delta);
      const rightX = Math.min(DOMAIN[1], x + delta);
      lab.dashedLine(
        ctx,
        sx(leftX),
        sy(fn.f(x) + slope * (leftX - x)),
        sx(rightX),
        sy(fn.f(x) + slope * (rightX - x)),
        palette.blue,
      );

      ctx.save();
      ctx.fillStyle = palette.blue;
      ctx.globalAlpha = 0.14;
      ctx.beginPath();
      ctx.arc(pointX, pointY, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = palette.paper;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(pointX, pointY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = palette.muted2;
    ctx.font =
      '10px ui-monospace, "SF Mono", "Cascadia Code", Consolas, monospace';
    ctx.textAlign = "left";
    ctx.fillText("f(x)", 12, 16);
    ctx.textAlign = "right";
    ctx.fillText("x", width - 12, height - 12);
  }

  function stop() {
    running = false;
    clearTimeout(timer);
    runButton.textContent = "Run";
    runButton.setAttribute("aria-pressed", "false");
    status.classList.remove("is-live");
    status.dataset.state = finished ? message || "finished" : "ready";
  }

  function finish(nextMessage) {
    finished = true;
    message = nextMessage;
    stop();
    runButton.disabled = true;
    stepButton.disabled = true;
    announce.textContent = nextMessage;
    draw();
    updateStatus();
  }

  function takeStep() {
    if (finished) return;
    const fn = currentFunction();
    const slope = fn.slope(x);
    const next = x - learningRate * slope;
    if (!Number.isFinite(next) || Math.abs(next) > 8) {
      x = Number.isFinite(next) ? lab.clamp(next, -8, 8) : 8;
      steps += 1;
      finish("Diverged. Try a smaller learning rate.");
      return;
    }
    x = next;
    steps += 1;
    history.push(x);
    if (history.length > 140) history.shift();
    draw();
    updateStatus();
    if (Math.abs(fn.slope(x)) < 0.005) {
      const curvature = fn.curvature(x);
      if (curvature > 0.05) {
        finish(
          `Converged to a local minimum near x = ${format(x)} after ${steps} steps.`,
        );
      } else if (curvature < -0.05) {
        finish(
          `Stopped at a stationary point near x = ${format(x)} after ${steps} steps. This point is a local maximum, not a minimum.`,
        );
      } else {
        finish(
          `Stopped at a flat stationary point near x = ${format(x)} after ${steps} steps.`,
        );
      }
    }
  }

  function start() {
    if (running || finished) return;
    running = true;
    runButton.textContent = "Pause";
    runButton.setAttribute("aria-pressed", "true");
    announce.textContent = "Gradient descent running.";
    const tick = () => {
      if (!running) return;
      takeStep();
      if (!finished) timer = setTimeout(tick, 430);
    };
    tick();
  }

  function reset(announcement = false) {
    stop();
    finished = false;
    message = "";
    x = startX;
    steps = 0;
    history = [x];
    runButton.disabled = false;
    stepButton.disabled = false;
    draw();
    updateStatus();
    if (announcement) {
      announce.textContent = `Reset to x = ${format(x)}.`;
    }
  }

  function updateFromControls() {
    learningRate = Number(lrInput.value);
    startX = Number(startInput.value);
    updateControls();
  }

  functionInput.addEventListener("change", () => {
    functionName = functionInput.value;
    reset(true);
  });

  lrInput.addEventListener("input", () => {
    updateFromControls();
  });

  startInput.addEventListener("input", () => {
    updateFromControls();
    reset(true);
  });

  runButton.addEventListener("click", () => {
    if (running) {
      stop();
      announce.textContent = "Paused.";
    } else {
      start();
    }
  });

  stepButton.addEventListener("click", () => {
    stop();
    takeStep();
    if (!finished) {
      announce.textContent = `Step ${steps}. x is ${format(x)}, loss is ${format(currentFunction().f(x))}.`;
    }
  });

  resetButton.addEventListener("click", () => reset(true));

  lab.onResize(canvas, draw);
  lab.onTheme((next) => {
    palette = next;
    draw();
  });

  updateControls();
  requestAnimationFrame(() => {
    draw();
    updateStatus();
  });
})();
