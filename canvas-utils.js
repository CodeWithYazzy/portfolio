/* Small canvas helpers shared by the hero and the visualization lab. */
window.CanvasLab = (() => {
  "use strict";

  const themeListeners = new Set();
  let themeObserver;

  function colors() {
    const styles = getComputedStyle(document.documentElement);
    const read = (name) => styles.getPropertyValue(name).trim();
    return {
      paper: read("--paper"),
      surface: read("--surface"),
      text: read("--text"),
      muted: read("--muted"),
      muted2: read("--muted-2"),
      blue: read("--blue"),
      blueSoft: read("--blue-soft"),
      line: read("--line"),
      lineSoft: read("--line-soft"),
      dark: document.documentElement.dataset.theme === "dark",
    };
  }

  function initThemeObserver() {
    if (themeObserver) return;
    themeObserver = new MutationObserver(() => {
      const palette = colors();
      themeListeners.forEach((listener) => listener(palette));
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  }

  function onTheme(listener) {
    initThemeObserver();
    themeListeners.add(listener);
    return () => themeListeners.delete(listener);
  }

  function fitCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const context = canvas.getContext("2d");
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { context, width, height };
  }

  function onResize(element, callback) {
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(() => requestAnimationFrame(callback));
      observer.observe(element);
      return observer;
    }
    let frame;
    const listener = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(callback);
    };
    window.addEventListener("resize", listener, { passive: true });
    return {
      disconnect() {
        cancelAnimationFrame(frame);
        window.removeEventListener("resize", listener);
      },
    };
  }

  function seeded(seed) {
    let state = seed >>> 0;
    return () => {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function gaussian(random) {
    let u = 0;
    let v = 0;
    while (u === 0) u = random();
    while (v === 0) v = random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (a, b, amount) => a + (b - a) * amount;

  function clear(context, width, height, color) {
    context.clearRect(0, 0, width, height);
    context.fillStyle = color;
    context.fillRect(0, 0, width, height);
  }

  function shape(context, x, y, size, kind, color, mode = "fill") {
    context.save();
    context.translate(x, y);
    context.beginPath();
    if (kind === "circle") {
      context.arc(0, 0, size, 0, Math.PI * 2);
    } else if (kind === "square") {
      context.rect(-size, -size, size * 2, size * 2);
    } else if (kind === "triangle") {
      context.moveTo(0, -size * 1.15);
      context.lineTo(size * 1.1, size * 0.85);
      context.lineTo(-size * 1.1, size * 0.85);
      context.closePath();
    } else if (kind === "diamond") {
      context.moveTo(0, -size * 1.2);
      context.lineTo(size * 1.2, 0);
      context.lineTo(0, size * 1.2);
      context.lineTo(-size * 1.2, 0);
      context.closePath();
    } else if (kind === "plus") {
      const arm = size * 0.46;
      context.moveTo(-arm, -size);
      context.lineTo(arm, -size);
      context.lineTo(arm, -arm);
      context.lineTo(size, -arm);
      context.lineTo(size, arm);
      context.lineTo(arm, arm);
      context.lineTo(arm, size);
      context.lineTo(-arm, size);
      context.lineTo(-arm, arm);
      context.lineTo(-size, arm);
      context.lineTo(-size, -arm);
      context.lineTo(-arm, -arm);
      context.closePath();
    }
    if (mode === "stroke") {
      context.strokeStyle = color;
      context.stroke();
    } else {
      context.fillStyle = color;
      context.fill();
    }
    context.restore();
  }

  function dashedLine(context, x1, y1, x2, y2, color) {
    context.save();
    context.beginPath();
    context.setLineDash([5, 5]);
    context.strokeStyle = color;
    context.lineWidth = 1.3;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.restore();
  }

  const reducedMotion = () =>
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  return {
    colors,
    onTheme,
    fitCanvas,
    onResize,
    seeded,
    gaussian,
    clamp,
    lerp,
    clear,
    shape,
    dashedLine,
    reducedMotion,
  };
})();
