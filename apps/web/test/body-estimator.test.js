const test = require("node:test");
const assert = require("node:assert/strict");
const { estimateBodyDimensions } = require("../body-estimator.js");

function point(x, y, visibility = 1) { return { x, y, visibility }; }

function fixture() {
  const points = Array.from({ length: 33 }, () => point(0.5, 0.5, 0));
  points[11] = point(0.4, 0.2); points[12] = point(0.6, 0.2);
  points[13] = point(0.35, 0.4); points[14] = point(0.65, 0.4);
  points[15] = point(0.3, 0.6); points[16] = point(0.7, 0.6);
  points[23] = point(0.44, 0.5); points[24] = point(0.56, 0.5);
  points[25] = point(0.44, 0.7); points[26] = point(0.56, 0.7);
  points[27] = point(0.44, 0.9); points[28] = point(0.56, 0.9);
  return points;
}

test("returns height-scaled pose intervals without using weight", () => {
  const result = estimateBodyDimensions({ points: fixture(), width: 500, height: 1000, headY: 0, footY: 1, knownHeightCm: 180, capture: { fullBody: true, distance: true, frontal: true } });
  assert.equal(result.status, "experimental_only");
  assert.equal(result.measurements.poseShoulderSpan.valueCm, 18);
  assert.deepEqual(result.measurements.poseShoulderSpan.intervalCm, [16, 20]);
  assert.equal(result.confidence, "中");
  assert.match(result.warning, /不能替代软尺量体/);
});

test("degrades missing arm landmarks instead of inventing a value", () => {
  const points = fixture(); points[15].visibility = 0; points[16].visibility = 0;
  const result = estimateBodyDimensions({ points, width: 500, height: 1000, headY: 0, footY: 1, knownHeightCm: 180 });
  assert.equal(result.measurements.projectedArmLength, null);
  assert.equal(result.confidence, "低");
});

test("rejects invalid scale input", () => {
  assert.equal(estimateBodyDimensions({ points: fixture(), width: 500, height: 1000, headY: 0.8, footY: 0.2, knownHeightCm: 180 }), null);
});
