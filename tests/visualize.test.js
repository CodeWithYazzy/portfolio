"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const M = require("../visualize-core");
test("quadratic gradient step uses the analytical derivative", () => {
  const result = M.gradientStep(3, 0.12);
  assert.ok(Math.abs(result.x - 2.28) < 1e-12);
  assert.ok(Math.abs(result.loss - 5.1984) < 1e-12);
});
test("a stable learning rate monotonically reduces the quadratic loss", () => {
  let x = 4,
    last = x * x;
  for (let i = 0; i < 100; i++) {
    const next = M.gradientStep(x, 0.2);
    assert.ok(next.loss <= last);
    last = next.loss;
    x = next.x;
  }
  assert.ok(Math.abs(x) < 1e-15);
});
test("rate one oscillates, and a rate above one diverges", () => {
  assert.equal(M.gradientStep(3, 1).x, -3);
  assert.equal(M.gradientStep(-3, 1).x, 3);
  assert.ok(M.gradientStep(3, 1.2).loss > 9);
});
test("invalid and nonfinite gradient values are rejected", () => {
  for (const [x, rate] of [
    [NaN, 0.1],
    [Infinity, 0.1],
    [2, 0],
    [2, -1],
    [2, Infinity],
  ])
    assert.throws(() => M.gradientStep(x, rate), RangeError);
});
test("synthetic points are deterministic, bounded, and vary by seed", () => {
  assert.deepEqual(M.generatePoints(7), M.generatePoints(7));
  assert.notDeepEqual(M.generatePoints(7), M.generatePoints(8));
  assert.equal(M.generatePoints().length, 36);
  for (const p of M.generatePoints())
    assert.ok(p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100);
});
test("Lloyd updates match the known two-group solution", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 10, y: 10 },
    { x: 12, y: 10 },
  ];
  const step = M.kmeansStep(points, [
    { x: 0, y: 0 },
    { x: 10, y: 10 },
  ]);
  assert.deepEqual(step.assignments, [0, 0, 1, 1]);
  assert.deepEqual(step.centers, [
    { x: 1, y: 0 },
    { x: 11, y: 10 },
  ]);
  assert.equal(step.inertia, 4);
  assert.equal(M.kmeansStep(points, step.centers).converged, true);
});
test("Lloyd iterations never increase SSE on the fixed dataset", () => {
  const points = M.generatePoints(4);
  let centers = M.initialCenters(points, 3, 4),
    previous = Infinity;
  for (let i = 0; i < 50; i++) {
    const step = M.kmeansStep(points, centers);
    assert.ok(step.inertia <= previous + 1e-8);
    assert.equal(
      step.counts.reduce((a, b) => a + b, 0),
      points.length,
    );
    previous = step.inertia;
    centers = step.centers;
    if (step.converged) return;
  }
  assert.fail("Expected convergence within 50 steps");
});
test("empty clusters retain a finite prior center", () => {
  const step = M.kmeansStep(
    [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ],
    [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ],
  );
  assert.deepEqual(step.centers[1], { x: 100, y: 100 });
  assert.equal(step.counts[1], 0);
  assert.ok(Number.isFinite(step.inertia));
});
test("duplicate points are handled without NaNs", () => {
  const points = Array.from({ length: 5 }, () => ({ x: 2, y: 2 }));
  const centers = M.initialCenters(points, 3);
  const step = M.kmeansStep(points, centers);
  assert.equal(step.inertia, 0);
  assert.equal(step.converged, true);
});
test("invalid clustering input is rejected", () => {
  assert.throws(() => M.initialCenters([{ x: 0, y: 0 }], 2), RangeError);
  assert.throws(() => M.kmeansStep([], [{ x: 0, y: 0 }]), RangeError);
  assert.throws(() => M.generatePoints(1, 201), RangeError);
});
test("dense-network weight and bias counts follow layer sizes", () => {
  assert.deepEqual(M.networkStats([3, 4, 4, 2]), {
    weights: 36,
    biases: 10,
    parameters: 46,
  });
  assert.deepEqual(M.networkStats([1, 2, 1]), {
    weights: 4,
    biases: 3,
    parameters: 7,
  });
  assert.throws(() => M.networkStats([3, 0, 2]), RangeError);
});
