/* SVG experiment controllers. Values are computed locally and all runs can be paused. */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s),
    $$ = (s) => [...document.querySelectorAll(s)];
  if (!$("#gradientPlot")) return;
  const M = window.YasirMath,
    NS = "http://www.w3.org/2000/svg";
  const num = (n) =>
    n === 0
      ? "0.0000"
      : Math.abs(n) < 0.0001
        ? n.toExponential(2)
        : n.toFixed(4);
  function node(tag, attrs = {}, text) {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function status(id, message, warning = false) {
    const el = $(id);
    el.textContent = message;
    el.dataset.tone = warning ? "warning" : "normal";
  }
  let gradientTimer = null,
    clusterTimer = null;
  const stopGradient = () => {
      clearInterval(gradientTimer);
      gradientTimer = null;
      $("#gradientRun").textContent = "Run";
    },
    stopCluster = () => {
      clearInterval(clusterTimer);
      clusterTimer = null;
      $("#clusterRun").textContent = "Run";
    };
  function stopAll() {
    stopGradient();
    stopCluster();
  }
  const initialized = new Set();
  function activate(id, moveFocus = false) {
    if (!["gradient", "clustering", "network"].includes(id)) id = "gradient";
    stopAll();
    if (!initialized.has(id)) {
      if (id === "gradient") resetGradient();
      if (id === "clustering") initializeClusters();
      if (id === "network") drawNetwork();
      initialized.add(id);
    }
    $$("[data-tab]").forEach((b) => {
      const selected = b.dataset.tab === id;
      b.setAttribute("aria-selected", String(selected));
      b.tabIndex = selected ? 0 : -1;
      $("#panel-" + b.dataset.tab).hidden = !selected;
      if (selected && moveFocus) b.focus();
    });
  }
  $$("[data-tab]").forEach((button, index, list) => {
    button.addEventListener("click", () => {
      activate(button.dataset.tab);
      history.replaceState(null, "", "#" + button.dataset.tab);
    });
    button.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % list.length;
      if (event.key === "ArrowLeft")
        next = (index + list.length - 1) % list.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = list.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        activate(list[next].dataset.tab, true);
        history.replaceState(null, "", "#" + list[next].dataset.tab);
      }
    });
  });
  addEventListener("hashchange", () => activate(location.hash.slice(1)));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAll();
  });
  // 1. One-dimensional quadratic optimization.
  let gx = 3,
    iteration = 0,
    trail = [3];
  const sx = (x) => 48 + ((x + 5) / 10) * 682,
    sy = (y) => 320 - (y / 25) * 290;
  function drawGradient() {
    const plot = $("#gradientPlot");
    plot.replaceChildren();
    for (const y of [0, 5, 10, 15, 20, 25])
      plot.append(
        node("line", {
          x1: 48,
          y1: sy(y),
          x2: 730,
          y2: sy(y),
          class: "plot-grid",
        }),
        node(
          "text",
          { x: 36, y: sy(y) + 4, class: "plot-label", "text-anchor": "end" },
          y,
        ),
      );
    for (const x of [-4, -2, 0, 2, 4])
      plot.append(
        node(
          "text",
          { x: sx(x), y: 344, class: "plot-label", "text-anchor": "middle" },
          x,
        ),
      );
    const curve = Array.from({ length: 161 }, (_, i) => {
      const x = -5 + i / 16;
      return `${i ? "L" : "M"}${sx(x).toFixed(2)},${sy(x * x).toFixed(2)}`;
    }).join("");
    plot.append(node("path", { d: curve, class: "objective-curve" }));
    for (const x of trail.slice(-40))
      if (Math.abs(x) <= 5)
        plot.append(
          node("circle", {
            cx: sx(x),
            cy: sy(x * x),
            r: 3,
            class: "plot-trail",
          }),
        );
    if (Math.abs(gx) <= 5)
      plot.append(
        node("line", {
          x1: sx(gx),
          y1: sy(0),
          x2: sx(gx),
          y2: sy(gx * gx),
          class: "plot-crosshair",
        }),
        node("circle", {
          cx: sx(gx),
          cy: sy(gx * gx),
          r: 7,
          class: "plot-current",
        }),
      );
    $("#gradientIteration").textContent = iteration;
    $("#gradientX").textContent = num(gx);
    $("#gradientLoss").textContent = num(gx * gx);
  }
  function resetGradient() {
    stopGradient();
    gx = Number($("#startX").value);
    iteration = 0;
    trail = [gx];
    $("#rateValue").textContent = Number($("#learningRate").value).toFixed(2);
    $("#startValue").textContent = gx.toFixed(1);
    status("#gradientStatus", "Ready. Run the simulation or take one step.");
    drawGradient();
  }
  function gradientStep() {
    try {
      gx = M.gradientStep(gx, Number($("#learningRate").value)).x;
      iteration++;
      trail.push(gx);
      drawGradient();
      if (Math.abs(gx) > 5) {
        stopGradient();
        status(
          "#gradientStatus",
          "The value has left the plotted range. This learning rate is unstable; lower it and reset.",
          true,
        );
      } else if (Math.abs(gx) < 0.0005) {
        stopGradient();
        status(
          "#gradientStatus",
          "Close to the minimum at x = 0. The displayed loss is computed from the current x.",
        );
      } else if (iteration >= 160) {
        stopGradient();
        status(
          "#gradientStatus",
          "Stopped at 160 steps. A rate of 1 oscillates; smaller rates converge for this function.",
        );
      } else
        status(
          "#gradientStatus",
          Number($("#learningRate").value) === 1
            ? "The value is oscillating without reducing the loss."
            : "Updated x using the gradient 2x.",
        );
    } catch {
      stopGradient();
      status(
        "#gradientStatus",
        "Numerical range exceeded. Reset and lower the learning rate.",
        true,
      );
    }
  }
  $("#learningRate").addEventListener("input", resetGradient);
  $("#startX").addEventListener("input", resetGradient);
  $("#gradientReset").addEventListener("click", () => {
    $("#learningRate").value = ".12";
    $("#startX").value = "3";
    resetGradient();
  });
  $("#gradientStep").addEventListener("click", () => {
    stopGradient();
    if (Math.abs(gx) > 5 || iteration >= 160) resetGradient();
    gradientStep();
  });
  $("#gradientRun").addEventListener("click", () => {
    if (gradientTimer) return stopGradient();
    if (Math.abs(gx) > 5 || iteration >= 160 || Math.abs(gx) < 0.0005)
      resetGradient();
    $("#gradientRun").textContent = "Pause";
    gradientTimer = setInterval(gradientStep, 160);
  });
  // 2. Lloyd iterations with real assignments and means.
  const colors = Array.from({ length: 5 }, (_, i) => `var(--cluster-${i + 1})`),
    shapes = ["○", "□", "△", "◇", "×"];
  let seed = 1,
    points = M.generatePoints(),
    centers = [],
    assignments = [],
    counts = [],
    inertia = null,
    clusterIteration = 0,
    converged = false;
  const px = (x) => 45 + (x / 100) * 680,
    py = (y) => 320 - (y / 100) * 290;
  function pointShape(point, cluster) {
    const x = px(point.x),
      y = py(point.y),
      color = cluster < 0 ? "var(--muted)" : colors[cluster];
    if (cluster === 1)
      return node("rect", {
        x: x - 4,
        y: y - 4,
        width: 8,
        height: 8,
        fill: color,
      });
    if (cluster === 2)
      return node("path", { d: `M${x},${y - 5}l5,9h-10Z`, fill: color });
    if (cluster === 3)
      return node("path", { d: `M${x},${y - 5}l5,5 -5,5 -5,-5Z`, fill: color });
    if (cluster === 4)
      return node("path", {
        d: `M${x - 4},${y - 4}l8,8m0,-8l-8,8`,
        stroke: color,
        "stroke-width": 2,
      });
    return node("circle", { cx: x, cy: y, r: 4, fill: color });
  }
  function drawClusters() {
    const plot = $("#clusterPlot");
    plot.replaceChildren();
    for (const n of [0, 25, 50, 75, 100]) {
      plot.append(
        node("line", {
          x1: 45,
          y1: py(n),
          x2: 725,
          y2: py(n),
          class: "plot-grid",
        }),
        node("line", {
          x1: px(n),
          y1: 30,
          x2: px(n),
          y2: 320,
          class: "plot-grid",
        }),
        node(
          "text",
          { x: 33, y: py(n) + 4, class: "plot-label", "text-anchor": "end" },
          n,
        ),
        node(
          "text",
          { x: px(n), y: 343, class: "plot-label", "text-anchor": "middle" },
          n,
        ),
      );
    }
    points.forEach((p, i) =>
      plot.append(pointShape(p, assignments.length ? assignments[i] : -1)),
    );
    centers.forEach((c, i) => {
      const x = px(c.x),
        y = py(c.y);
      plot.append(
        node("circle", {
          cx: x,
          cy: y,
          r: 9,
          fill: "var(--paper)",
          stroke: colors[i],
          "stroke-width": 2,
        }),
        node("path", {
          d: `M${x - 6},${y}h12M${x},${y - 6}v12`,
          stroke: colors[i],
          "stroke-width": 2,
        }),
        node(
          "text",
          {
            x: x + 12,
            y: y - 10,
            fill: colors[i],
            "font-size": 11,
            "font-family": "monospace",
          },
          "C" + (i + 1),
        ),
      );
    });
    $("#pointCount").textContent = points.length + " points";
    $("#clusterPoints").textContent = points.length;
    $("#clusterIteration").textContent = clusterIteration;
    $("#clusterLoss").textContent = inertia === null ? "—" : inertia.toFixed(2);
    const legend = $("#clusterLegend");
    legend.replaceChildren();
    centers.forEach((_, i) => {
      const span = document.createElement("span"),
        shape = document.createElement("b");
      shape.style.color = colors[i];
      shape.textContent = shapes[i];
      span.append(
        shape,
        document.createTextNode(` C${i + 1}: ${counts[i] ?? "—"}`),
      );
      legend.append(span);
    });
  }
  function initializeClusters() {
    stopCluster();
    const k = Number($("#clusterCount").value);
    $("#clusterValue").textContent = k;
    centers = M.initialCenters(points, k, seed);
    assignments = [];
    counts = [];
    inertia = null;
    clusterIteration = 0;
    converged = false;
    status(
      "#clusterStatus",
      "Ready. Step once to assign points and move the centers.",
    );
    drawClusters();
  }
  function clusterStep() {
    if (converged || clusterIteration >= 100) {
      stopCluster();
      return;
    }
    const result = M.kmeansStep(points, centers);
    centers = result.centers;
    assignments = result.assignments;
    counts = result.counts;
    inertia = result.inertia;
    converged = result.converged;
    clusterIteration++;
    drawClusters();
    if (converged) {
      stopCluster();
      status(
        "#clusterStatus",
        "Converged: the centers no longer move. This may be a local optimum.",
      );
    } else if (clusterIteration >= 100) {
      stopCluster();
      status("#clusterStatus", "Stopped at the 100-iteration limit.");
    } else
      status(
        "#clusterStatus",
        "Assigned each point to its nearest center, then moved centers to their group means.",
      );
  }
  $("#clusterCount").addEventListener("input", initializeClusters);
  $("#generatePoints").addEventListener("click", () => {
    seed++;
    points = M.generatePoints(seed);
    initializeClusters();
  });
  $("#clusterReset").addEventListener("click", () => {
    seed = 1;
    points = M.generatePoints();
    $("#clusterCount").value = "3";
    $("#pointX").value = "50";
    $("#pointY").value = "50";
    initializeClusters();
  });
  $("#clusterStep").addEventListener("click", () => {
    stopCluster();
    clusterStep();
  });
  $("#clusterRun").addEventListener("click", () => {
    if (clusterTimer) return stopCluster();
    if (converged || clusterIteration >= 100) initializeClusters();
    $("#clusterRun").textContent = "Pause";
    clusterTimer = setInterval(clusterStep, 450);
  });
  function addPoint(x, y) {
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      x < 0 ||
      x > 100 ||
      y < 0 ||
      y > 100
    ) {
      status(
        "#clusterStatus",
        "Use finite X and Y coordinates from 0 to 100.",
        true,
      );
      return;
    }
    if (points.length >= 150) {
      status(
        "#clusterStatus",
        "The interactive plot is limited to 150 points. Reset or generate a new set.",
        true,
      );
      return;
    }
    points.push({ x, y });
    initializeClusters();
    status(
      "#clusterStatus",
      "Point added. Iterations restart because the dataset changed.",
    );
  }
  $("#addPoint").addEventListener("click", () => {
    const x = $("#pointX").value,
      y = $("#pointY").value;
    addPoint(x.trim() ? Number(x) : NaN, y.trim() ? Number(y) : NaN);
  });
  $("#clusterChart").addEventListener("click", (event) => {
    const svg = event.currentTarget,
      p = svg.createSVGPoint();
    p.x = event.clientX;
    p.y = event.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const local = p.matrixTransform(ctm.inverse());
    const x = ((local.x - 45) / 680) * 100,
      y = ((320 - local.y) / 290) * 100;
    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) addPoint(x, y);
  });
  // 3. A dense-network structure, not a fabricated trained network.
  let selected = null;
  function networkSizes() {
    return [
      Number($("#networkInputs").value),
      ...Array(Number($("#hiddenLayers").value)).fill(
        Number($("#hiddenWidth").value),
      ),
      Number($("#networkOutputs").value),
    ];
  }
  function drawNetwork() {
    const sizes = networkSizes(),
      stats = M.networkStats(sizes),
      plot = $("#networkPlot");
    plot.replaceChildren();
    $("#inputsValue").textContent = sizes[0];
    $("#layersValue").textContent = sizes.length - 2;
    $("#widthValue").textContent = sizes[1];
    $("#outputsValue").textContent = sizes.at(-1);
    $("#networkWeights").textContent = stats.weights;
    $("#networkBiases").textContent = stats.biases;
    $("#networkParameters").textContent = stats.parameters;
    const positions = sizes.map((n, l) =>
      Array.from({ length: n }, (_, j) => ({
        x: 65 + l * (630 / (sizes.length - 1)),
        y: 180 + (j - (n - 1) / 2) * Math.min(58, 260 / Math.max(1, n - 1)),
      })),
    );
    for (let l = 0; l < sizes.length - 1; l++)
      for (let a = 0; a < sizes[l]; a++)
        for (let b = 0; b < sizes[l + 1]; b++) {
          const from = positions[l][a],
            to = positions[l + 1][b],
            connected =
              selected &&
              ((selected.l === l && selected.j === a) ||
                (selected.l === l + 1 && selected.j === b));
          plot.append(
            node("line", {
              x1: from.x,
              y1: from.y,
              x2: to.x,
              y2: to.y,
              class: "network-edge" + (connected ? " is-connected" : ""),
            }),
          );
        }
    positions.forEach((layer, l) => {
      const kind =
        l === 0 ? "input" : l === sizes.length - 1 ? "output" : "hidden";
      plot.append(
        node(
          "text",
          {
            x: layer[0].x,
            y: 20,
            class: "plot-label",
            "text-anchor": "middle",
          },
          kind === "hidden"
            ? "Hidden " + l
            : kind === "input"
              ? "Input"
              : "Output",
        ),
      );
      layer.forEach((p, j) => {
        const group = node("g", {
          class:
            "network-node" +
            (selected?.l === l && selected?.j === j ? " is-selected" : ""),
          "data-layer-kind": kind,
          role: "button",
          tabindex: 0,
          "aria-label": `${kind === "hidden" ? "Hidden layer " + l : kind} neuron ${j + 1}: ${l ? sizes[l - 1] : 0} incoming and ${l < sizes.length - 1 ? sizes[l + 1] : 0} outgoing connections`,
          "aria-pressed": String(selected?.l === l && selected?.j === j),
        });
        group.append(
          node("rect", {
            x: p.x - 22,
            y: p.y - 22,
            width: 44,
            height: 44,
            fill: "transparent",
          }),
          node("circle", { cx: p.x, cy: p.y, r: 14 }),
          node("text", { x: p.x, y: p.y + 3, "text-anchor": "middle" }, j + 1),
        );
        function choose() {
          selected = { l, j };
          for (const g of $$(".network-node"))
            g.classList.remove("is-selected");
          drawNetwork();
          const index = sizes.slice(0, l).reduce((a, b) => a + b, 0) + j;
          const replacement = $$(".network-node")[index];
          replacement?.focus({ preventScroll: true });
          status(
            "#networkStatus",
            `${kind === "hidden" ? "Hidden layer " + l : kind.charAt(0).toUpperCase() + kind.slice(1)} neuron ${j + 1}: ${l ? sizes[l - 1] : 0} incoming, ${l < sizes.length - 1 ? sizes[l + 1] : 0} outgoing connections. No numerical weights or activations are assigned.`,
          );
        }
        group.addEventListener("click", choose);
        group.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            choose();
          }
        });
        plot.append(group);
      });
    });
  }
  for (const id of [
    "networkInputs",
    "hiddenLayers",
    "hiddenWidth",
    "networkOutputs",
  ])
    $("#" + id).addEventListener("input", () => {
      selected = null;
      drawNetwork();
      status(
        "#networkStatus",
        "Architecture updated. Parameter counts include weights and one bias per non-input neuron.",
      );
    });
  $("#networkReset").addEventListener("click", () => {
    $("#networkInputs").value = "3";
    $("#hiddenLayers").value = "2";
    $("#hiddenWidth").value = "4";
    $("#networkOutputs").value = "2";
    selected = null;
    drawNetwork();
    status(
      "#networkStatus",
      "Select a neuron to highlight its incoming and outgoing connections.",
    );
  });
  activate(location.hash.slice(1));
})();
