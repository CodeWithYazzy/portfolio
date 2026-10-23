/* K-Means Clustering: Lloyd iterations on generated two-dimensional data. */
(() => {
  "use strict";

  const canvas = document.querySelector("#kmCanvas");
  if (!canvas || !window.CanvasLab) return;

  const lab = window.CanvasLab;
  const kInput = document.querySelector("#kmK");
  const pointsInput = document.querySelector("#kmPoints");
  const kValue = document.querySelector("#kmKValue");
  const pointsValue = document.querySelector("#kmPointsValue");
  const runButton = document.querySelector("#kmRun");
  const stepButton = document.querySelector("#kmStep");
  const resetButton = document.querySelector("#kmReset");
  const newDataButton = document.querySelector("#kmNewData");
  const status = document.querySelector("#kmStatus");
  const legend = document.querySelector("#kmLegend");
  const announce = document.querySelector("#kmAnnounce");

  if (
    !kInput ||
    !pointsInput ||
    !runButton ||
    !stepButton ||
    !resetButton ||
    !status ||
    !legend
  ) {
    return;
  }

  const DOMAIN = [-1.8, 1.8];
  const SHAPES = ["circle", "square", "triangle", "diamond", "plus"];
  const COLORS_LIGHT = ["#0066cc", "#5f6065", "#2f7d7a", "#a06a2c", "#715a9e"];
  const COLORS_DARK = ["#2997ff", "#c7c7cc", "#5fc6c1", "#e0a35b", "#b9a4ff"];
  const BLOBS = [
    { x: -0.95, y: -0.35 },
    { x: 0.9, y: -0.7 },
    { x: 0.05, y: 0.95 },
  ];

  const context = canvas.getContext("2d");
  let palette = lab.colors();
  let seed = 23;
  let pointCount = Number(pointsInput.value);
  let k = Number(kInput.value);
  let points = [];
  let centroids = [];
  let assignments = [];
  let counts = [];
  let iteration = 0;
  let inertia = 0;
  let running = false;
  let timer = null;
  let converged = false;
  let width = 0;
  let height = 0;

  const clusterColor = (index) =>
    (palette.dark ? COLORS_DARK : COLORS_LIGHT)[index % 5];
  const clusterShape = (index) => SHAPES[index % SHAPES.length];

  function generatePoints() {
    const random = lab.seeded(seed);
    const next = [];
    for (let index = 0; index < pointCount; index += 1) {
      const blob = BLOBS[index % BLOBS.length];
      const x = blob.x + lab.gaussian(random) * 0.27;
      const y = blob.y + lab.gaussian(random) * 0.27;
      next.push({
        x: lab.clamp(x, DOMAIN[0] + 0.08, DOMAIN[1] - 0.08),
        y: lab.clamp(y, DOMAIN[0] + 0.08, DOMAIN[1] - 0.08),
      });
    }
    points = next;
  }

  function initializeCentroids() {
    if (!points.length) {
      centroids = [];
      return;
    }
    const random = lab.seeded((seed ^ 0x85ebca6b) >>> 0);
    const chosen = [points[Math.floor(random() * points.length)]];
    while (chosen.length < k) {
      const distances = points.map((point) =>
        Math.min(
          ...chosen.map((centroid) => {
            const dx = point.x - centroid.x;
            const dy = point.y - centroid.y;
            return dx * dx + dy * dy;
          }),
        ),
      );
      const total = distances.reduce((sum, value) => sum + value, 0);
      if (total === 0 || !Number.isFinite(total)) {
        chosen.push(points[Math.floor(random() * points.length)]);
        continue;
      }
      let target = random() * total;
      let selected = 0;
      for (let index = 0; index < distances.length; index += 1) {
        target -= distances[index];
        if (target <= 0) {
          selected = index;
          break;
        }
      }
      chosen.push(points[selected]);
    }
    centroids = chosen.map((point) => ({ x: point.x, y: point.y }));
  }

  const distanceSquared = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

  function assignPoints() {
    return points.map((point) => {
      let nearest = 0;
      let best = Infinity;
      for (let index = 0; index < centroids.length; index += 1) {
        const distance = distanceSquared(point, centroids[index]);
        if (distance < best) {
          best = distance;
          nearest = index;
        }
      }
      return nearest;
    });
  }

  function updateLegend() {
    legend.textContent = "";
    for (let index = 0; index < k; index += 1) {
      const item = document.createElement("span");
      item.className = "legend-item";
      const swatch = document.createElement("span");
      swatch.className = `legend-swatch shape-${clusterShape(index)} cluster-${index + 1}`;
      swatch.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      label.textContent =
        counts[index] === undefined
          ? `Cluster ${index + 1}`
          : `Cluster ${index + 1}: ${counts[index]}`;
      item.append(swatch, label);
      legend.append(item);
    }
  }

  function updateStatus() {
    const inertiaText = iteration === 0 ? "—" : inertia.toFixed(1);
    status.textContent = `Iteration ${iteration} · Inertia ${inertiaText} · ${k} clusters`;
    status.dataset.iteration = String(iteration);
    status.dataset.inertia = iteration === 0 ? "" : inertia.toFixed(4);
    status.dataset.clusters = String(k);
    status.dataset.points = String(points.length);
    status.dataset.state = converged
      ? "converged"
      : running
        ? "running"
        : "ready";
    status.classList.toggle("is-live", running);
    canvas.setAttribute(
      "aria-label",
      `Cluster plot with ${points.length} points and ${k} clusters. Iteration ${iteration}.${iteration ? ` Inertia ${inertia.toFixed(1)}.` : " No iterations have run."}`,
    );
    updateLegend();
  }

  function draw() {
    const fit = lab.fitCanvas(canvas);
    width = fit.width;
    height = fit.height;
    const ctx = context;
    const padding = 24;
    const plotWidth = Math.max(1, width - padding * 2);
    const plotHeight = Math.max(1, height - padding * 2);
    const sx = (value) =>
      padding + ((value - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])) * plotWidth;
    const sy = (value) =>
      padding +
      (1 - (value - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])) * plotHeight;

    lab.clear(ctx, width, height, palette.paper);

    // A quiet grid gives the points a frame of reference.
    for (let index = 0; index <= 6; index += 1) {
      const value = DOMAIN[0] + ((DOMAIN[1] - DOMAIN[0]) * index) / 6;
      ctx.strokeStyle = palette.lineSoft;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx(value), padding);
      ctx.lineTo(sx(value), height - padding);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(padding, sy(value));
      ctx.lineTo(width - padding, sy(value));
      ctx.stroke();
    }

    // Connect each point to its current centroid.
    if (assignments.length === points.length) {
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.lineWidth = 1;
      points.forEach((point, index) => {
        const centroid = centroids[assignments[index]];
        if (!centroid) return;
        ctx.strokeStyle = clusterColor(assignments[index]);
        ctx.beginPath();
        ctx.moveTo(sx(point.x), sy(point.y));
        ctx.lineTo(sx(centroid.x), sy(centroid.y));
        ctx.stroke();
      });
      ctx.restore();
    }

    points.forEach((point, index) => {
      const assigned = assignments.length === points.length;
      const cluster = assigned ? assignments[index] : 0;
      lab.shape(
        ctx,
        sx(point.x),
        sy(point.y),
        assigned ? 3.5 : 3,
        assigned ? clusterShape(cluster) : "circle",
        assigned ? clusterColor(cluster) : palette.muted2,
        "fill",
      );
    });

    centroids.forEach((centroid, index) => {
      const x = sx(centroid.x);
      const y = sy(centroid.y);
      ctx.save();
      ctx.fillStyle = palette.paper;
      ctx.strokeStyle = clusterColor(index);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = clusterColor(index);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.font =
        '10px ui-monospace, "SF Mono", "Cascadia Code", Consolas, monospace';
      ctx.fillStyle = palette.muted;
      ctx.textAlign = "left";
      ctx.fillText(`C${index + 1}`, x + 13, y - 11);
      ctx.restore();
    });
  }

  function stop() {
    running = false;
    clearTimeout(timer);
    runButton.textContent = "Run";
    runButton.setAttribute("aria-pressed", "false");
    status.classList.remove("is-live");
    status.dataset.state = converged ? "converged" : "ready";
  }

  function finish() {
    converged = true;
    stop();
    runButton.disabled = true;
    stepButton.disabled = true;
    announce.textContent = `Converged after ${iteration} iterations.`;
    draw();
    updateStatus();
  }

  function takeStep() {
    if (converged || !points.length || !centroids.length) return;
    const nextAssignments = assignPoints();
    const nextCounts = new Array(k).fill(0);
    const sums = centroids.map(() => ({ x: 0, y: 0 }));
    nextAssignments.forEach((cluster, index) => {
      nextCounts[cluster] += 1;
      sums[cluster].x += points[index].x;
      sums[cluster].y += points[index].y;
    });

    const nextCentroids = centroids.map((centroid, index) => {
      if (nextCounts[index] === 0) {
        let farthest = 0;
        let best = -Infinity;
        points.forEach((point, pointIndex) => {
          const distance = distanceSquared(
            point,
            centroids[nextAssignments[pointIndex]],
          );
          if (distance > best) {
            best = distance;
            farthest = pointIndex;
          }
        });
        return { ...points[farthest] };
      }
      return {
        x: sums[index].x / nextCounts[index],
        y: sums[index].y / nextCounts[index],
      };
    });

    const changed = nextAssignments.some(
      (cluster, index) => cluster !== assignments[index],
    );
    centroids = nextCentroids;
    assignments = nextAssignments;
    counts = nextCounts;
    iteration += 1;
    inertia = points.reduce(
      (sum, point, index) =>
        sum + distanceSquared(point, centroids[assignments[index]]),
      0,
    );
    draw();
    updateStatus();
    if (!changed) finish();
  }

  function start() {
    if (running || converged) return;
    running = true;
    runButton.textContent = "Pause";
    runButton.setAttribute("aria-pressed", "true");
    announce.textContent = "K-means running.";
    const tick = () => {
      if (!running) return;
      takeStep();
      if (!converged) timer = setTimeout(tick, 520);
    };
    tick();
  }

  function reset(announcement = false) {
    stop();
    converged = false;
    iteration = 0;
    inertia = 0;
    assignments = [];
    counts = [];
    initializeCentroids();
    runButton.disabled = false;
    stepButton.disabled = false;
    draw();
    updateStatus();
    if (announcement) {
      announce.textContent = "Centroids reset and iterations cleared.";
    }
  }

  function updateFromControls() {
    pointCount = Number(pointsInput.value);
    k = Number(kInput.value);
    kValue.textContent = String(k);
    pointsValue.textContent = String(pointCount);
  }

  kInput.addEventListener("input", () => {
    updateFromControls();
    reset(true);
  });

  pointsInput.addEventListener("input", () => {
    updateFromControls();
    generatePoints();
    reset(true);
  });

  runButton.addEventListener("click", () => {
    if (running) {
      stop();
      announce.textContent = "K-means paused.";
    } else {
      start();
    }
  });

  stepButton.addEventListener("click", () => {
    stop();
    takeStep();
    if (!converged) {
      announce.textContent = `Iteration ${iteration}. Inertia ${inertia.toFixed(1)}.`;
    }
  });

  resetButton.addEventListener("click", () => reset(true));

  newDataButton?.addEventListener("click", () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    generatePoints();
    reset(true);
  });

  lab.onResize(canvas, draw);
  lab.onTheme((next) => {
    palette = next;
    draw();
    updateLegend();
  });

  updateFromControls();
  generatePoints();
  initializeCentroids();
  requestAnimationFrame(() => {
    draw();
    updateStatus();
  });
})();
