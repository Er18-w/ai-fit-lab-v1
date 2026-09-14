import { pixelDistance, shoulderSlopeDegrees } from "./measurement.js";

const REQUIRED_POINTS = ["headTop", "footBottom", "leftShoulder", "rightShoulder"];

export function evaluateCaptureQuality({ width, height, landmarks, config }) {
  const reasons = [];
  if (width < config.minWidthPx || height < config.minHeightPx) {
    reasons.push({ code: "resolution_too_low", message: "图片分辨率低于实验门槛。" });
  }
  for (const name of REQUIRED_POINTS) {
    if (!landmarks?.[name]) {
      reasons.push({ code: `missing_${name}`, message: `缺少关键点：${name}` });
    }
  }
  if (reasons.some((reason) => reason.code.startsWith("missing_"))) {
    return { accepted: false, reasons, metrics: {} };
  }

  const marginX = width * config.safeMarginRatio;
  const marginY = height * config.safeMarginRatio;
  for (const [name, point] of Object.entries(landmarks)) {
    if (
      point.x < marginX || point.x > width - marginX ||
      point.y < marginY || point.y > height - marginY
    ) {
      reasons.push({ code: `${name}_near_edge`, message: `${name} 太靠近画面边缘。` });
    }
  }

  const bodyHeightRatio = pixelDistance(landmarks.headTop, landmarks.footBottom) / height;
  if (bodyHeightRatio < config.minBodyHeightRatio) {
    reasons.push({ code: "person_too_small", message: "人物在画面中太小。" });
  }
  if (bodyHeightRatio > config.maxBodyHeightRatio) {
    reasons.push({ code: "person_too_large", message: "人物过于贴近画面边缘。" });
  }
  const shoulderSlope = shoulderSlopeDegrees(
    landmarks.leftShoulder,
    landmarks.rightShoulder,
  );
  if (shoulderSlope > config.maxShoulderSlopeDegrees) {
    reasons.push({ code: "shoulder_slope_high", message: "肩线倾斜过大，请正对镜头站立。" });
  }

  return {
    accepted: reasons.length === 0,
    reasons,
    metrics: { bodyHeightRatio, shoulderSlopeDegrees: shoulderSlope },
  };
}

