import { EXPERIMENT_CONFIG } from "./config.js";
import { ManualLandmarkAdapter, LANDMARK_ORDER } from "./landmark-adapter.js";
import {
  aggregateFrames,
  createHeightScale,
  estimatePoseShoulderSpan,
} from "./measurement.js";
import { evaluateCaptureQuality } from "./quality.js";

const elements = {
  video: document.querySelector("#camera"),
  canvas: document.querySelector("#frame"),
  start: document.querySelector("#start-camera"),
  capture: document.querySelector("#capture"),
  upload: document.querySelector("#upload"),
  height: document.querySelector("#height-cm"),
  reset: document.querySelector("#reset-points"),
  save: document.querySelector("#save-frame"),
  status: document.querySelector("#status"),
  result: document.querySelector("#result"),
  nextPoint: document.querySelector("#next-point"),
};

const ctx = elements.canvas.getContext("2d");
const adapter = new ManualLandmarkAdapter();
const frames = [];
let stream = null;
let baseImage = null;

function setStatus(kind, text) {
  elements.status.className = `status ${kind}`;
  elements.status.textContent = text;
}

function updateNextPoint() {
  const next = LANDMARK_ORDER[Object.keys(adapter.landmarks).length];
  elements.nextPoint.textContent = next ? `下一点：${next.label}` : "四个点已完成";
}

function draw() {
  if (!baseImage) return;
  ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
  ctx.drawImage(baseImage, 0, 0, elements.canvas.width, elements.canvas.height);
  ctx.fillStyle = "#ff4d6d";
  ctx.strokeStyle = "#ff4d6d";
  ctx.lineWidth = 3;
  for (const [key, point] of Object.entries(adapter.landmarks)) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(key, point.x + 10, point.y - 8);
  }
  const { leftShoulder, rightShoulder, headTop, footBottom } = adapter.landmarks;
  for (const pair of [[leftShoulder, rightShoulder], [headTop, footBottom]]) {
    if (!pair[0] || !pair[1]) continue;
    ctx.beginPath();
    ctx.moveTo(pair[0].x, pair[0].y);
    ctx.lineTo(pair[1].x, pair[1].y);
    ctx.stroke();
  }
}

function loadDrawable(drawable, width, height) {
  const maxWidth = 720;
  const ratio = Math.min(1, maxWidth / width);
  elements.canvas.width = Math.round(width * ratio);
  elements.canvas.height = Math.round(height * ratio);
  baseImage = drawable;
  adapter.reset();
  draw();
  updateNextPoint();
  setStatus("info", "请依次标注四个实验关键点。当前没有接入自动姿态模型。 ");
}

elements.start.addEventListener("click", async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
      audio: false,
    });
    elements.video.srcObject = stream;
    elements.capture.disabled = false;
    setStatus("success", "相机已连接。请保证全身入镜，再截取当前帧。 ");
  } catch (error) {
    setStatus("error", `无法使用相机：${error.message}。可改用上传照片。`);
  }
});

elements.capture.addEventListener("click", () => {
  if (!elements.video.videoWidth) return;
  const captured = document.createElement("canvas");
  captured.width = elements.video.videoWidth;
  captured.height = elements.video.videoHeight;
  captured.getContext("2d").drawImage(elements.video, 0, 0);
  loadDrawable(captured, captured.width, captured.height);
});

elements.upload.addEventListener("change", () => {
  const [file] = elements.upload.files;
  if (!file) return;
  const image = new Image();
  image.onload = () => {
    loadDrawable(image, image.naturalWidth, image.naturalHeight);
    URL.revokeObjectURL(image.src);
  };
  image.src = URL.createObjectURL(file);
});

elements.canvas.addEventListener("click", (event) => {
  if (!baseImage || Object.keys(adapter.landmarks).length >= LANDMARK_ORDER.length) return;
  const rect = elements.canvas.getBoundingClientRect();
  adapter.addPoint({
    x: ((event.clientX - rect.left) / rect.width) * elements.canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * elements.canvas.height,
  });
  draw();
  updateNextPoint();
});

elements.reset.addEventListener("click", () => {
  adapter.reset();
  draw();
  updateNextPoint();
});

elements.save.addEventListener("click", () => {
  const heightCm = Number(elements.height.value);
  const { landmarks, adapterId, source } = adapter.getResult();
  const quality = evaluateCaptureQuality({
    width: elements.canvas.width,
    height: elements.canvas.height,
    landmarks,
    config: EXPERIMENT_CONFIG.capture,
  });
  if (!quality.accepted) {
    frames.push({ accepted: false, reasons: quality.reasons });
    setStatus("error", `本帧拒绝：${quality.reasons.map((item) => item.message).join("；")}`);
  } else {
    try {
      const scale = createHeightScale({
        knownHeightCm: heightCm,
        headTop: landmarks.headTop,
        footBottom: landmarks.footBottom,
      });
      const estimate = estimatePoseShoulderSpan({
        leftShoulder: landmarks.leftShoulder,
        rightShoulder: landmarks.rightShoulder,
        scale,
        ...EXPERIMENT_CONFIG.scale,
      });
      frames.push({
        accepted: true,
        adapterId,
        source,
        quality: quality.metrics,
        ...estimate,
      });
      setStatus("success", `已记录实验帧 ${frames.length}。建议至少记录 3 帧。`);
    } catch (error) {
      setStatus("error", `无法计算：${error.message}`);
    }
  }
  elements.result.textContent = JSON.stringify(
    {
      configVersion: EXPERIMENT_CONFIG.version,
      configStatus: EXPERIMENT_CONFIG.status,
      frameCount: frames.length,
      latestFrame: frames.at(-1),
      aggregate: aggregateFrames(frames, EXPERIMENT_CONFIG.aggregation),
    },
    null,
    2,
  );
});

updateNextPoint();
setStatus("info", "可启动后置相机，或上传一张已有全身照。相机通常要求 HTTPS 或 localhost。 ");

