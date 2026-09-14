export const LANDMARK_ORDER = [
  { key: "headTop", label: "头顶" },
  { key: "footBottom", label: "脚底中点" },
  { key: "leftShoulder", label: "画面左侧姿态肩点" },
  { key: "rightShoulder", label: "画面右侧姿态肩点" },
];

export class ManualLandmarkAdapter {
  constructor() {
    this.id = "manual-landmark-adapter";
    this.reset();
  }

  reset() {
    this.landmarks = {};
  }

  addPoint(point) {
    const target = LANDMARK_ORDER[Object.keys(this.landmarks).length];
    if (!target) return { complete: true, landmarks: this.landmarks };
    this.landmarks[target.key] = point;
    return {
      complete: Object.keys(this.landmarks).length === LANDMARK_ORDER.length,
      landmarks: { ...this.landmarks },
      next: LANDMARK_ORDER[Object.keys(this.landmarks).length] ?? null,
    };
  }

  getResult() {
    return {
      adapterId: this.id,
      source: "manual_annotation",
      landmarks: { ...this.landmarks },
      warning: "This is a manual/mock adapter. MediaPipe is not connected in this spike.",
    };
  }
}

export function assertLandmarkAdapter(adapter) {
  if (!adapter || typeof adapter.getResult !== "function") {
    throw new TypeError("adapter must implement getResult()");
  }
  return adapter;
}

