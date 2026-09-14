function assertFinitePositive(value, name) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite positive number`);
  }
}

export function pixelDistance(a, b) {
  if (!a || !b) throw new TypeError("two points are required");
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function shoulderSlopeDegrees(leftShoulder, rightShoulder) {
  const dx = rightShoulder.x - leftShoulder.x;
  const dy = rightShoulder.y - leftShoulder.y;
  if (dx === 0 && dy === 0) return 0;
  return Math.abs((Math.atan2(dy, dx) * 180) / Math.PI);
}

export function createHeightScale({ knownHeightCm, headTop, footBottom }) {
  assertFinitePositive(knownHeightCm, "knownHeightCm");
  const bodyHeightPx = pixelDistance(headTop, footBottom);
  assertFinitePositive(bodyHeightPx, "bodyHeightPx");
  return {
    knownHeightCm,
    bodyHeightPx,
    cmPerPixel: knownHeightCm / bodyHeightPx,
    method: "standing-height-linear-image-scale",
    warning:
      "Experimental image-plane scale only; it does not correct perspective, landmark semantics, clothing, or body depth.",
  };
}

export function estimatePoseShoulderSpan({
  leftShoulder,
  rightShoulder,
  scale,
  relativeUncertaintyRatio = 0.08,
  minimumUncertaintyCm = 2,
}) {
  if (!scale || !Number.isFinite(scale.cmPerPixel)) {
    throw new TypeError("a valid height scale is required");
  }
  const pixelSpan = pixelDistance(leftShoulder, rightShoulder);
  const experimentalSpanCm = pixelSpan * scale.cmPerPixel;
  const uncertaintyCm = Math.max(
    experimentalSpanCm * relativeUncertaintyRatio,
    minimumUncertaintyCm,
  );
  return {
    measurementKind: "pose_landmark_shoulder_span",
    pixelSpan,
    experimentalHeightScaledSpanCm: experimentalSpanCm,
    experimentalIntervalCm: [
      Math.max(0, experimentalSpanCm - uncertaintyCm),
      experimentalSpanCm + uncertaintyCm,
    ],
    warning:
      "Pose shoulder landmarks are neither biacromial body width nor garment seam-to-seam shoulder width.",
  };
}

export function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function aggregateFrames(
  frames,
  { minFrames = 2, outlierMadMultiplier = 3.5 } = {},
) {
  const valid = frames.filter(
    (frame) => frame.accepted && Number.isFinite(frame.experimentalHeightScaledSpanCm),
  );
  if (valid.length < minFrames) {
    return {
      status: "insufficient_frames",
      acceptedFrameCount: valid.length,
      rejectedFrameCount: frames.length - valid.length,
    };
  }
  const values = valid.map((frame) => frame.experimentalHeightScaledSpanCm);
  const center = median(values);
  const mad = median(values.map((value) => Math.abs(value - center))) ?? 0;
  const kept = mad === 0
    ? valid
    : valid.filter(
        (frame) =>
          Math.abs(frame.experimentalHeightScaledSpanCm - center) <=
          outlierMadMultiplier * mad,
      );
  const keptValues = kept.map((frame) => frame.experimentalHeightScaledSpanCm);
  return {
    status: kept.length >= minFrames ? "experimental_only" : "insufficient_frames",
    medianExperimentalHeightScaledSpanCm: median(keptValues),
    minExperimentalHeightScaledSpanCm: Math.min(...keptValues),
    maxExperimentalHeightScaledSpanCm: Math.max(...keptValues),
    medianAbsoluteDeviationCm: median(
      keptValues.map((value) => Math.abs(value - median(keptValues))),
    ),
    acceptedFrameCount: kept.length,
    excludedOutlierCount: valid.length - kept.length,
    rejectedFrameCount: frames.length - valid.length,
    warning: "Aggregate is an experiment metric, not a validated body measurement.",
  };
}

