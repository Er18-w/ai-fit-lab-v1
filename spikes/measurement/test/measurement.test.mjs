import test from "node:test";
import assert from "node:assert/strict";
import { aggregateFrames, createHeightScale, estimatePoseShoulderSpan, median, pixelDistance } from "../src/measurement.js";
import { evaluateCaptureQuality } from "../src/quality.js";
import { EXPERIMENT_CONFIG } from "../src/config.js";

test("geometry helpers are deterministic", () => {
  assert.equal(pixelDistance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  assert.equal(median([9, 1, 5]), 5);
  assert.equal(median([1, 3]), 2);
});

test("height scale labels its limitations", () => {
  const scale = createHeightScale({ knownHeightCm: 180, headTop: { x: 100, y: 20 }, footBottom: { x: 100, y: 920 } });
  assert.equal(scale.cmPerPixel, 0.2);
  assert.match(scale.warning, /perspective/);
});

test("pose span is not named body or garment width", () => {
  const result = estimatePoseShoulderSpan({ leftShoulder: { x: 100, y: 200 }, rightShoulder: { x: 300, y: 200 }, scale: { cmPerPixel: 0.2 } });
  assert.equal(result.measurementKind, "pose_landmark_shoulder_span");
  assert.equal(result.experimentalHeightScaledSpanCm, 40);
  assert.deepEqual(result.experimentalIntervalCm, [36.8, 43.2]);
});

test("quality rejects incomplete annotation", () => {
  const result = evaluateCaptureQuality({ width: 720, height: 1000, landmarks: { headTop: { x: 360, y: 40 } }, config: EXPERIMENT_CONFIG.capture });
  assert.equal(result.accepted, false);
  assert.ok(result.reasons.some((reason) => reason.code === "missing_footBottom"));
});

test("quality accepts centered full-body annotation", () => {
  const result = evaluateCaptureQuality({ width: 720, height: 1000, landmarks: { headTop: { x: 360, y: 40 }, footBottom: { x: 360, y: 940 }, leftShoulder: { x: 260, y: 220 }, rightShoulder: { x: 460, y: 220 } }, config: EXPERIMENT_CONFIG.capture });
  assert.equal(result.accepted, true);
});

test("aggregation excludes a large outlier", () => {
  const frames = [40, 40.2, 39.8, 60].map((value) => ({ accepted: true, experimentalHeightScaledSpanCm: value }));
  const result = aggregateFrames(frames, EXPERIMENT_CONFIG.aggregation);
  assert.equal(result.status, "experimental_only");
  assert.equal(result.excludedOutlierCount, 1);
  assert.equal(result.medianExperimentalHeightScaledSpanCm, 40);
});
