(() => {
  "use strict";
  const plot = document.getElementById("homePlot");
  if (!plot) return;
  const NS = "http://www.w3.org/2000/svg";
  const sx = (x) => 45 + ((x + 3) / 6) * 470,
    sy = (y) => 266 - (y / 9) * 232;
  function node(tag, attrs, text) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = text;
    return e;
  }
  let x = 2.4,
    step = 0,
    timer;
  function draw() {
    plot.replaceChildren();
    for (const y of [0, 3, 6, 9]) {
      plot.append(
        node("line", {
          x1: 45,
          y1: sy(y),
          x2: 515,
          y2: sy(y),
          class: "plot-grid",
        }),
        node(
          "text",
          { x: 31, y: sy(y) + 4, class: "plot-label", "text-anchor": "end" },
          String(y),
        ),
      );
    }
    for (const v of [-2, 0, 2])
      plot.append(
        node(
          "text",
          { x: sx(v), y: 289, class: "plot-label", "text-anchor": "middle" },
          String(v),
        ),
      );
    const points = Array.from({ length: 121 }, (_, i) => {
      const t = -3 + i * 0.05;
      return `${i ? "L" : "M"}${sx(t).toFixed(2)},${sy(t * t).toFixed(2)}`;
    }).join("");
    plot.append(
      node("path", { d: points, class: "objective-curve" }),
      node("line", {
        x1: sx(x),
        y1: sy(0),
        x2: sx(x),
        y2: sy(x * x),
        class: "plot-crosshair",
      }),
      node("circle", { cx: sx(x), cy: sy(x * x), r: 7, class: "plot-current" }),
    );
    document.getElementById("homeStep").textContent = step;
    document.getElementById("homeLoss").textContent = (x * x).toFixed(4);
  }
  const button = document.getElementById("homeRun");
  button.addEventListener("click", () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
      button.textContent = "Resume preview →";
      return;
    }
    if (step >= 16) {
      x = 2.4;
      step = 0;
    }
    button.textContent = "Pause preview";
    timer = setInterval(() => {
      x = YasirMath.gradientStep(x, 0.12).x;
      step++;
      draw();
      if (step >= 16) {
        clearInterval(timer);
        timer = null;
        button.textContent = "Replay preview →";
      }
    }, 180);
  });
  document.getElementById("homeReset").addEventListener("click", () => {
    clearInterval(timer);
    timer = null;
    x = 2.4;
    step = 0;
    button.textContent = "Run preview →";
    draw();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && timer) {
      clearInterval(timer);
      timer = null;
      button.textContent = "Resume preview →";
    }
  });
  draw();
})();
