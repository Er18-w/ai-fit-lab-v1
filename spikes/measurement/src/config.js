export const EXPERIMENT_CONFIG = Object.freeze({
  version: "measurement-spike-0.1.0",
  status: "UNCALIBRATED",
  capture: Object.freeze({
    minWidthPx: 480,
    minHeightPx: 640,
    safeMarginRatio: 0.02,
    minBodyHeightRatio: 0.55,
    maxBodyHeightRatio: 0.96,
    maxShoulderSlopeDegrees: 12,
    recommendedFrameCount: 3,
  }),
  scale: Object.freeze({
    relativeUncertaintyRatio: 0.08,
    minimumUncertaintyCm: 2,
  }),
  aggregation: Object.freeze({
    outlierMadMultiplier: 3.5,
    minFrames: 2,
  }),
});

