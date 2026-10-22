/* Subtle interactive network illustration for the home page. */
(() => {
  "use strict";

  const canvas = document.querySelector("#heroNetwork");
  if (!canvas || !window.CanvasLab) return;

  const lab = window.CanvasLab;
  const context = canvas.getContext("2d");
  const layers = [4, 6, 4];
  const nodes = [];
  const edges = [];
  const pulses = [];
  let width = 0;
  let height = 0;
  let pointer = { x: 0, y: 0, active: false };
  let frame = null;
  let lastTime = 0;
  let spawnClock = 0;
  let visible = true;
  let palette = lab.colors();
  let reduced = lab.reducedMotion();
  const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");

  for (let layer = 0; layer < layers.length; layer += 1) {
    for (let index = 0; index < layers[layer]; index += 1) {
      nodes.push({ layer, index });
    }
  }

  for (let layer = 0; layer < layers.length - 1; layer += 1) {
    for (let from = 0; from < layers[layer]; from += 1) {
      for (let to = 0; to < layers[layer + 1]; to += 1) {
        edges.push({ layer, from, to });
      }
    }
  }

  function position(node) {
    const paddingX = Math.max(38, width * 0.13);
    const paddingY = Math.max(38, height * 0.13);
    const usableX = width - paddingX * 2;
    const usableY = height - paddingY * 2;
    const layerCount = layers[node.layer];
    const x = paddingX + (usableX * node.layer) / (layers.length - 1);
    const y =
      paddingY +
      (usableY * node.index) / Math.max(1, layerCount - 1);
    return { x, y };
  }

  function makePulse() {
    const edge = edges[Math.floor(Math.random() * edges.length)];
    if (!edge) return;
    pulses.push({
      ...edge,
      progress: 0,
      speed: 0.32 + Math.random() * 0.3,
      size: 1.6 + Math.random() * 1.2,
    });
  }

  function drawPulse(pulse) {
    const from = position({ layer: pulse.layer, index: pulse.from });
    const to = position({ layer: pulse.layer + 1, index: pulse.to });
    const x = lab.lerp(from.x, to.x, pulse.progress);
    const y = lab.lerp(from.y, to.y, pulse.progress);
    context.save();
    context.globalAlpha = 0.72;
    context.fillStyle = palette.blue;
    context.shadowColor = palette.blue;
    context.shadowBlur = 10;
    context.beginPath();
    context.arc(x, y, pulse.size, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function draw(timestamp) {
    const fit = lab.fitCanvas(canvas);
    width = fit.width;
    height = fit.height;
    if (!width || !height) return;

    const elapsed = Math.min(0.05, (timestamp - lastTime) / 1000 || 0);
    lastTime = timestamp;

    if (!reduced) {
      spawnClock += elapsed;
      if (spawnClock > 0.24 && pulses.length < 13) {
        spawnClock = 0;
        makePulse();
      }
      for (let i = pulses.length - 1; i >= 0; i -= 1) {
        const pulse = pulses[i];
        pulse.progress += pulse.speed * elapsed;
        if (pulse.progress >= 1) pulses.splice(i, 1);
      }
    }

    context.clearRect(0, 0, width, height);

    if (pointer.active) {
      const glow = context.createRadialGradient(
        pointer.x,
        pointer.y,
        0,
        pointer.x,
        pointer.y,
        Math.min(width, height) * 0.38,
      );
      glow.addColorStop(0, palette.blue);
      glow.addColorStop(1, "transparent");
      context.save();
      context.globalAlpha = 0.06;
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
      context.restore();
    }

    context.save();
    context.strokeStyle = palette.line;
    context.lineWidth = 0.8;
    context.globalAlpha = 0.8;
    for (const edge of edges) {
      const from = position({ layer: edge.layer, index: edge.from });
      const to = position({ layer: edge.layer + 1, index: edge.to });
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
    }
    context.restore();

    if (!reduced) pulses.forEach(drawPulse);

    for (const node of nodes) {
      const point = position(node);
      const distance = pointer.active
        ? Math.hypot(pointer.x - point.x, pointer.y - point.y)
        : Infinity;
      const near = distance < 92;
      const radius =
        node.layer === layers.length - 1 ? 4.8 : 3.7 + (near ? 1.5 : 0);
      context.save();
      context.globalAlpha = near ? 1 : 0.92;
      context.fillStyle =
        node.layer === layers.length - 1 || near
          ? palette.blue
          : palette.muted2;
      if (near) {
        context.shadowColor = palette.blue;
        context.shadowBlur = 12;
      }
      context.beginPath();
      context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    if (!reduced && visible) {
      frame = requestAnimationFrame(draw);
    } else {
      frame = null;
    }
  }

  function start() {
    if (frame || reduced || !visible) return;
    lastTime = performance.now();
    frame = requestAnimationFrame(draw);
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = null;
  }

  lab.onResize(canvas, () => {
    if (!frame) draw(performance.now());
  });

  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      active: true,
    };
    if (reduced) draw(performance.now());
  });

  canvas.addEventListener("pointerleave", () => {
    pointer.active = false;
    if (reduced) draw(performance.now());
  });

  lab.onTheme((next) => {
    palette = next;
    if (!frame) draw(performance.now());
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
        if (visible) start();
        else stop();
      },
      { threshold: 0.05 },
    );
    observer.observe(canvas);
  }

  motionQuery.addEventListener("change", (event) => {
    reduced = event.matches;
    if (reduced) {
      stop();
      draw(performance.now());
    } else {
      start();
    }
  });

  // Draw once immediately so the card never appears empty.
  draw(performance.now());
  start();

  window.addEventListener("pageshow", () => {
    if (!document.hidden) start();
  });
})();
