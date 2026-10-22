/* Deterministic educational algorithms. No model, network request, or fabricated output. */
((root) => {
  "use strict";
  function rng(seed = 1) {
    let value = seed >>> 0;
    return () => {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }
  function gradientStep(x, rate) {
    if (!Number.isFinite(x) || !Number.isFinite(rate) || rate <= 0)
      throw new RangeError(
        "Use a finite starting value and a positive learning rate.",
      );
    const next = x - rate * 2 * x;
    const loss = next * next;
    if (!Number.isFinite(next) || !Number.isFinite(loss))
      throw new RangeError("The values exceed the numerical range.");
    return { x: next, loss };
  }
  function generatePoints(seed = 1, count = 36) {
    if (!Number.isInteger(count) || count < 1 || count > 200)
      throw new RangeError("Use 1–200 points.");
    const rand = rng(seed),
      centers = [
        [22, 25],
        [75, 30],
        [48, 76],
      ];
    const normal = () =>
      Math.sqrt(-2 * Math.log(Math.max(rand(), 1e-12))) *
      Math.cos(2 * Math.PI * rand());
    return Array.from({ length: count }, (_, i) => ({
      x: Math.max(2, Math.min(98, centers[i % 3][0] + normal() * 10)),
      y: Math.max(2, Math.min(98, centers[i % 3][1] + normal() * 10)),
    }));
  }
  const distance = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  function checkPoints(points) {
    if (
      !Array.isArray(points) ||
      !points.length ||
      points.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))
    )
      throw new RangeError("Use at least one finite data point.");
  }
  function initialCenters(points, k, seed = 1) {
    checkPoints(points);
    if (!Number.isInteger(k) || k < 1 || k > points.length)
      throw new RangeError(
        "The cluster count cannot exceed the number of points.",
      );
    const chosen = [Math.floor(rng(seed)() * points.length)];
    while (chosen.length < k) {
      let best = -1,
        score = -1;
      for (let i = 0; i < points.length; i++) {
        if (chosen.includes(i)) continue;
        const d = Math.min(
          ...chosen.map((j) => distance(points[i], points[j])),
        );
        if (d > score) {
          score = d;
          best = i;
        }
      }
      chosen.push(best);
    }
    return chosen.map((i) => ({ ...points[i] }));
  }
  function kmeansStep(points, centers) {
    checkPoints(points);
    checkPoints(centers);
    const assignments = points.map((point) => {
      let best = 0;
      for (let c = 1; c < centers.length; c++)
        if (distance(point, centers[c]) < distance(point, centers[best]))
          best = c;
      return best;
    });
    const counts = centers.map(() => 0),
      sums = centers.map(() => ({ x: 0, y: 0 }));
    points.forEach((p, i) => {
      const c = assignments[i];
      counts[c]++;
      sums[c].x += p.x;
      sums[c].y += p.y;
    });
    const next = centers.map((c, i) =>
      counts[i]
        ? { x: sums[i].x / counts[i], y: sums[i].y / counts[i] }
        : { ...c },
    );
    const inertia = points.reduce(
      (sum, p, i) => sum + distance(p, next[assignments[i]]),
      0,
    );
    const movement = Math.max(...centers.map((c, i) => distance(c, next[i])));
    return {
      centers: next,
      assignments,
      counts,
      inertia,
      converged: movement < 1e-10,
    };
  }
  function networkStats(sizes) {
    if (
      !Array.isArray(sizes) ||
      sizes.length < 2 ||
      sizes.length > 8 ||
      sizes.some((n) => !Number.isInteger(n) || n < 1 || n > 20)
    )
      throw new RangeError("Use 2–8 layers with 1–20 neurons per layer.");
    const weights = sizes.slice(1).reduce((sum, n, i) => sum + n * sizes[i], 0),
      biases = sizes.slice(1).reduce((sum, n) => sum + n, 0);
    return { weights, biases, parameters: weights + biases };
  }
  const api = {
    rng,
    gradientStep,
    generatePoints,
    initialCenters,
    kmeansStep,
    networkStats,
  };
  root.YasirMath = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
