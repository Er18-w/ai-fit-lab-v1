(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BodyEstimator = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const isVisible = (point, threshold = 0.45) => point && (point.visibility ?? 1) >= threshold;
  const round = (value) => Math.round(value * 10) / 10;

  function pixelPoint(point, width, height) {
    return { x: point.x * width, y: point.y * height };
  }

  function distance(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  function pathLength(points) {
    return points.slice(1).reduce((sum, point, index) => sum + distance(points[index], point), 0);
  }

  function interval(value, ratio, minimumCm) {
    const uncertainty = Math.max(value * ratio, minimumCm);
    return [round(Math.max(0, value - uncertainty)), round(value + uncertainty)];
  }

  function measurePath(points, indexes, width, height, cmPerPixel) {
    if (!indexes.every((index) => isVisible(points[index]))) return null;
    return pathLength(indexes.map((index) => pixelPoint(points[index], width, height))) * cmPerPixel;
  }

  function average(values) {
    const valid = values.filter(Number.isFinite);
    return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
  }

  function estimateBodyDimensions({ points, width, height, headY, footY, knownHeightCm, capture = {} }) {
    if (!Array.isArray(points) || !Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(knownHeightCm) || knownHeightCm <= 0) return null;
    const bodyHeightPx = (footY - headY) * height;
    if (!Number.isFinite(bodyHeightPx) || bodyHeightPx <= 0) return null;
    const cmPerPixel = knownHeightCm / bodyHeightPx;

    const shoulder = measurePath(points, [11, 12], width, height, cmPerPixel);
    const leftArm = measurePath(points, [11, 13, 15], width, height, cmPerPixel);
    const rightArm = measurePath(points, [12, 14, 16], width, height, cmPerPixel);
    const leftLeg = measurePath(points, [23, 25, 27], width, height, cmPerPixel);
    const rightLeg = measurePath(points, [24, 26, 28], width, height, cmPerPixel);
    const arm = average([leftArm, rightArm]);
    const leg = average([leftLeg, rightLeg]);
    const requiredVisible = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].filter((index) => isVisible(points[index])).length;
    const confidence = capture.fullBody && capture.distance && capture.frontal && requiredVisible >= 10 ? "中" : "低";

    return {
      version: "height-scaled-pose-0.1.0",
      status: "experimental_only",
      knownHeightCm,
      bodyHeightPx: round(bodyHeightPx),
      cmPerPixel: Math.round(cmPerPixel * 10000) / 10000,
      confidence,
      measurements: {
        poseShoulderSpan: shoulder ? { valueCm: round(shoulder), intervalCm: interval(shoulder, 0.08, 2) } : null,
        projectedArmLength: arm ? { valueCm: round(arm), intervalCm: interval(arm, 0.1, 3), sidesCm: [leftArm, rightArm].filter(Number.isFinite).map(round) } : null,
        projectedLegLength: leg ? { valueCm: round(leg), intervalCm: interval(leg, 0.1, 4), sidesCm: [leftLeg, rightLeg].filter(Number.isFinite).map(round) } : null
      },
      warning: "身高线性标定的二维姿态估算，未校正透视、体深、衣物和关键点语义；不能替代软尺量体。"
    };
  }

  return { estimateBodyDimensions };
});
