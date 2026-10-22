/* Neural Network Playground: a tiny classifier trained in the browser. */
(() => {
  "use strict";

  const canvas = document.querySelector("#nnCanvas");
  if (!canvas || !window.CanvasLab) return;

  const lab = window.CanvasLab;
  const datasetInput = document.querySelector("#nnDataset");
  const lrInput = document.querySelector("#nnLr");
  const unitsInput = document.querySelector("#nnUnits");
  const noiseInput = document.querySelector("#nnNoise");
  const lrValue = document.querySelector("#nnLrValue");
  const unitsValue = document.querySelector("#nnUnitsValue");
  const noiseValue = document.querySelector("#nnNoiseValue");
  const runButton = document.querySelector("#nnRun");
  const stepButton = document.querySelector("#nnStep");
  const resetButton = document.querySelector("#nnReset");
  const newDataButton = document.querySelector("#nnNewData");
  const status = document.querySelector("#nnStatus");
  const announce = document.querySelector("#nnAnnounce");

  if (
    !datasetInput ||
    !lrInput ||
    !unitsInput ||
    !noiseInput ||
    !runButton ||
    !stepButton ||
    !resetButton ||
    !status
  ) {
    return;
  }

  const POINT_COUNT = 90;
  const MAX_EPOCHS = 1600;
  const context = canvas.getContext("2d");
  let palette = lab.colors();
  let seed = 11;
  let points = [];
  let network = null;
  let dataset = datasetInput.value;
  let learningRate = Number(lrInput.value);
  let hiddenUnits = Number(unitsInput.value);
  let noise = Number(noiseInput.value);
  let epoch = 0;
  let loss = 0;
  let accuracy = 0;
  let running = false;
  let timer = null;
  let width = 0;
  let height = 0;

  function createPoints() {
    const random = lab.seeded(seed);
    const next = [];
    for (let index = 0; index < POINT_COUNT; index += 1) {
      let x;
      let y;
      let label;
      if (dataset === "ring") {
        label = index < POINT_COUNT / 2 ? 1 : 0;
        const radius =
          label === 1 ? 0.18 + random() * 0.3 : 0.63 + random() * 0.3;
        const angle = random() * Math.PI * 2;
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
      } else {
        x = random() * 2 - 1;
        y = random() * 2 - 1;
        label = (x > 0) !== (y > 0) ? 1 : 0;
      }
      if (random() < noise) label = 1 - label;
      next.push({ x, y, label });
    }
    points = next;
  }

  function createNetwork() {
    const random = lab.seeded((seed ^ 0x9e3779b9) >>> 0);
    const inputWeights = [];
    for (let index = 0; index < hiddenUnits; index += 1) {
      inputWeights.push({
        x: (random() * 2 - 1) * 1.1,
        y: (random() * 2 - 1) * 1.1,
        bias: (random() * 2 - 1) * 0.2,
      });
    }
    const outputWeights = [];
    for (let index = 0; index < hiddenUnits; index += 1) {
      outputWeights.push((random() * 2 - 1) * 1.1);
    }
    return {
      inputWeights,
      outputWeights,
      outputBias: (random() * 2 - 1) * 0.2,
    };
  }

  function forward(x, y, model = network) {
    const hidden = new Array(hiddenUnits);
    for (let index = 0; index < hiddenUnits; index += 1) {
      const weights = model.inputWeights[index];
      hidden[index] = Math.tanh(
        weights.x * x + weights.y * y + weights.bias,
      );
    }
    let logit = model.outputBias;
    for (let index = 0; index < hiddenUnits; index += 1) {
      logit += model.outputWeights[index] * hidden[index];
    }
    return { hidden, probability: 1 / (1 + Math.exp(-logit)) };
  }

  function measure() {
    let totalLoss = 0;
    let correct = 0;
    for (const point of points) {
      const probability = forward(point.x, point.y).probability;
      const bounded = lab.clamp(probability, 1e-7, 1 - 1e-7);
      totalLoss -=
        point.label * Math.log(bounded) +
        (1 - point.label) * Math.log(1 - bounded);
      if ((probability >= 0.5 ? 1 : 0) === point.label) correct += 1;
    }
    loss = totalLoss / points.length;
    accuracy = correct / points.length;
  }

  function trainEpoch() {
    const gradientInput = network.inputWeights.map(() => ({
      x: 0,
      y: 0,
      bias: 0,
    }));
    const gradientOutput = new Array(hiddenUnits).fill(0);
    let gradientOutputBias = 0;

    for (const point of points) {
      const { hidden, probability } = forward(point.x, point.y);
      const delta = probability - point.label;
      gradientOutputBias += delta;
      for (let index = 0; index < hiddenUnits; index += 1) {
        gradientOutput[index] += delta * hidden[index];
        const hiddenDelta =
          delta *
          network.outputWeights[index] *
          (1 - hidden[index] * hidden[index]);
        gradientInput[index].x += hiddenDelta * point.x;
        gradientInput[index].y += hiddenDelta * point.y;
        gradientInput[index].bias += hiddenDelta;
      }
    }

    const scale = learningRate / points.length;
    for (let index = 0; index < hiddenUnits; index += 1) {
      network.inputWeights[index].x -= scale * gradientInput[index].x;
      network.inputWeights[index].y -= scale * gradientInput[index].y;
      network.inputWeights[index].bias -= scale * gradientInput[index].bias;
      network.outputWeights[index] -= scale * gradientOutput[index];
    }
    network.outputBias -= scale * gradientOutputBias;
    epoch += 1;
    measure();
  }

  function startTraining() {
    if (running) return;
    running = true;
    runButton.textContent = "Pause";
    runButton.setAttribute("aria-pressed", "true");
    stepButton.disabled = true;
    announce.textContent = "Training started.";
    const tick = () => {
      if (!running) return;
      for (let index = 0; index < 4 && epoch < MAX_EPOCHS; index += 1) {
        trainEpoch();
      }
      draw();
      updateStatus();
      if (epoch >= MAX_EPOCHS) {
        stopTraining();
        announce.textContent = "Training reached the maximum number of epochs.";
        return;
      }
      timer = setTimeout(tick, 75);
    };
    tick();
  }

  function stopTraining() {
    running = false;
    clearTimeout(timer);
    runButton.textContent = "Train";
    runButton.setAttribute("aria-pressed", "false");
    stepButton.disabled = false;
  }

  function resetTraining(announcement = false) {
    stopTraining();
    network = createNetwork();
    epoch = 0;
    measure();
    draw();
    updateStatus();
    if (announcement) {
      announce.textContent = "Network reset to its starting weights.";
    }
  }

  function resetAll(announcement = false) {
    createPoints();
    resetTraining(announcement);
  }

  function updateControls() {
    lrValue.textContent = learningRate.toFixed(2);
    unitsValue.textContent = String(hiddenUnits);
    noiseValue.textContent = `${Math.round(noise * 100)}%`;
  }

  function updateStatus() {
    status.textContent = `Epoch ${epoch} · Loss ${loss.toFixed(2)} · Accuracy ${(accuracy * 100).toFixed(0)}%`;
    status.dataset.epoch = String(epoch);
    status.dataset.loss = loss.toFixed(4);
    status.dataset.accuracy = accuracy.toFixed(4);
    canvas.setAttribute(
      "aria-label",
      `Decision boundary plot after ${epoch} training epochs. Loss ${loss.toFixed(2)}, accuracy ${(accuracy * 100).toFixed(0)} percent.`,
    );
  }

  function draw() {
    const fit = lab.fitCanvas(canvas);
    width = fit.width;
    height = fit.height;
    const ctx = context;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = palette.paper;
    ctx.fillRect(0, 0, width, height);

    const gridWidth = 72;
    const gridHeight = 46;
    const grid = document.createElement("canvas");
    grid.width = gridWidth;
    grid.height = gridHeight;
    const gridContext = grid.getContext("2d");
    const image = gridContext.createImageData(gridWidth, gridHeight);
    const base = palette.dark ? [0, 0, 0] : [251, 251, 253];
    const blue = palette.dark ? [41, 151, 255] : [0, 102, 204];
    const ink = palette.dark ? [255, 255, 255] : [29, 29, 31];

    for (let row = 0; row < gridHeight; row += 1) {
      const y = ((row + 0.5) / gridHeight) * 2.24 - 1.12;
      for (let column = 0; column < gridWidth; column += 1) {
        const x = ((column + 0.5) / gridWidth) * 2.24 - 1.12;
        const probability = forward(x, y).probability;
        const confidence = Math.abs(probability - 0.5) * 2;
        const blueAlpha =
          probability > 0.5
            ? confidence * (palette.dark ? 0.3 : 0.2)
            : 0;
        const inkAlpha =
          probability < 0.5
            ? confidence * (palette.dark ? 0.035 : 0.075)
            : 0;
        const offset = (row * gridWidth + column) * 4;
        image.data[offset] = Math.round(
          base[0] * (1 - blueAlpha - inkAlpha) +
            blue[0] * blueAlpha +
            ink[0] * inkAlpha,
        );
        image.data[offset + 1] = Math.round(
          base[1] * (1 - blueAlpha - inkAlpha) +
            blue[1] * blueAlpha +
            ink[1] * inkAlpha,
        );
        image.data[offset + 2] = Math.round(
          base[2] * (1 - blueAlpha - inkAlpha) +
            blue[2] * blueAlpha +
            ink[2] * inkAlpha,
        );
        image.data[offset + 3] = 255;
      }
    }
    gridContext.putImageData(image, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(grid, 0, 0, gridWidth, gridHeight, 0, 0, width, height);

    const pad = Math.max(12, width * 0.025);
    const sx = (x) => pad + ((x + 1.12) / 2.24) * (width - pad * 2);
    const sy = (y) =>
      height - pad - ((y + 1.12) / 2.24) * (height - pad * 2);

    for (const point of points) {
      const x = sx(point.x);
      const y = sy(point.y);
      ctx.save();
      ctx.fillStyle = point.label === 1 ? palette.blue : palette.muted;
      ctx.strokeStyle = palette.paper;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      if (point.label === 1) {
        ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      } else {
        ctx.rect(x - 2.8, y - 2.8, 5.6, 5.6);
      }
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  datasetInput.addEventListener("change", () => {
    dataset = datasetInput.value;
    resetAll(true);
  });

  lrInput.addEventListener("input", () => {
    learningRate = Number(lrInput.value);
    updateControls();
  });

  unitsInput.addEventListener("input", () => {
    hiddenUnits = Number(unitsInput.value);
    updateControls();
    resetTraining(true);
  });

  noiseInput.addEventListener("input", () => {
    noise = Number(noiseInput.value);
    updateControls();
    resetAll(true);
  });

  runButton.addEventListener("click", () => {
    if (running) {
      stopTraining();
      announce.textContent = "Training paused.";
    } else {
      startTraining();
    }
  });

  stepButton.addEventListener("click", () => {
    stopTraining();
    for (let index = 0; index < 10 && epoch < MAX_EPOCHS; index += 1) {
      trainEpoch();
    }
    draw();
    updateStatus();
    announce.textContent = `Stepped forward. Epoch ${epoch}, accuracy ${(accuracy * 100).toFixed(0)} percent.`;
  });

  resetButton.addEventListener("click", () => resetTraining(true));

  newDataButton?.addEventListener("click", () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    resetAll(true);
  });

  lab.onResize(canvas, draw);
  lab.onTheme((next) => {
    palette = next;
    draw();
  });

  // Initialise once the controls and canvas have their final sizes.
  updateControls();
  createPoints();
  network = createNetwork();
  measure();
  requestAnimationFrame(() => {
    draw();
    updateStatus();
  });
})();
