export const DEFAULT_RULE_CONFIG = Object.freeze({
  version: "tshirt-experimental-2026-09-14",
  status: "experimental",
  notes: [
    "All fit thresholds require calibration against manual measurements and wear trials.",
    "Do not present these defaults as population-level sizing facts."
  ],
  chestEaseCm: {
    slim: [0, 4],
    fitted: [4, 8],
    slight_relaxed: [8, 14],
    relaxed: [14, 20],
    oversized: [20, 30]
  },
  shoulderDifferenceCm: {
    set_in: {
      slim: [-1, 0.5],
      fitted: [-0.5, 1.5],
      slight_relaxed: [0.5, 3],
      relaxed: [1.5, 5],
      oversized: [3, 8]
    },
    drop_shoulder: {
      slim: [1, 4],
      fitted: [2, 6],
      slight_relaxed: [4, 9],
      relaxed: [7, 13],
      oversized: [10, 18]
    }
  },
  garmentLengthToHeightRatio: {
    slim: [0.37, 0.41],
    fitted: [0.38, 0.42],
    slight_relaxed: [0.39, 0.44],
    relaxed: [0.4, 0.46],
    oversized: [0.42, 0.49]
  },
  plausibilityCm: {
    shoulder: [25, 90],
    chest_circumference: [50, 220],
    length: [35, 120],
    sleeve_length: [5, 80],
    cuff_circumference: [15, 100]
  }
});

export const FIT_PREFERENCES = Object.freeze([
  "slim",
  "fitted",
  "slight_relaxed",
  "relaxed",
  "oversized"
]);
