const VERSION = "0.10.22-rc.20250304";
const TASKS_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/+esm`;
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`;
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const LINKS = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28],[27,29],[29,31],[28,30],[30,32]];
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const visible = (p, threshold = .45) => p && (p.visibility ?? 1) >= threshold;

async function requestOrientationPermission() {
  const Orientation = window.DeviceOrientationEvent;
  if (!Orientation) return "unsupported";
  if (typeof Orientation.requestPermission !== "function") return "granted";
  try { return await Orientation.requestPermission(); } catch { return "denied"; }
}

function createCaptureCoach({ video, overlay, checks, instruction, badge, levelBubble, captureButton }) {
  let landmarker, active = false, frameId = 0, lastVideoTime = -1, lastRunAt = 0;
  let previousPose = null, stableFrames = 0, centerMissFrames = 0, lastCenterPass = false, orientationPermission = "unknown", orientation = null, analysis = null;
  const orientationHandler = (event) => { orientation = { beta: event.beta, gamma: event.gamma }; };

  async function prepareSensors() {
    orientationPermission = await requestOrientationPermission();
    if (orientationPermission === "granted") window.addEventListener("deviceorientation", orientationHandler, true);
  }

  async function loadModel() {
    badge.textContent = "正在加载识别";
    const { FilesetResolver, PoseLandmarker } = await import(TASKS_URL);
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);
    try {
      landmarker = await PoseLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" }, runningMode: "VIDEO", numPoses: 1, minPoseDetectionConfidence: .55, minTrackingConfidence: .55 });
    } catch {
      landmarker = await PoseLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" }, runningMode: "VIDEO", numPoses: 1, minPoseDetectionConfidence: .55, minTrackingConfidence: .55 });
    }
  }

  function resizeOverlay() {
    if (overlay.width !== video.videoWidth || overlay.height !== video.videoHeight) {
      overlay.width = video.videoWidth; overlay.height = video.videoHeight;
    }
  }

  function deviceCheck() {
    if (!matchMedia("(orientation: portrait)").matches) return { pass: false, available: true, message: "请把手机竖起来" };
    if (!orientation || orientationPermission !== "granted") return { pass: true, available: false, message: "继续用画面校正" };
    const roll = Number(orientation.gamma) || 0;
    const beta = Number(orientation.beta);
    const pitchError = Number.isFinite(beta) ? Math.abs(Math.abs(beta) - 90) : 0;
    const pass = Math.abs(roll) <= 4.5 && pitchError <= 11;
    levelBubble.style.transform = `translateX(${clamp(roll * 2.2, -38, 38)}px)`;
    if (pass) return { pass: true, available: true, message: "手机姿态合适" };
    if (Math.abs(roll) > 4.5) return { pass: false, available: true, message: roll > 0 ? "手机向左回正" : "手机向右回正" };
    return { pass: false, available: true, message: "手机镜头再正对人体" };
  }

  function assessPose(points) {
    const important = [0,11,12,23,24,27,28,29,30,31,32];
    if (important.filter((i) => visible(points[i])).length < 6) return { detected: false, device: deviceCheck(), instruction: "请让人物站进轮廓框内", ready: false };
    const feet = [27,28,29,30,31,32].map((i) => points[i]).filter((p) => visible(p));
    const face = [0,2,5,7,8].map((i) => points[i]).filter((p) => visible(p));
    const fullBody = face.length >= 2 && feet.length >= 2;
    const shoulderWidth = visible(points[11]) && visible(points[12]) ? Math.abs(points[11].x - points[12].x) : .16;
    const headY = face.length ? Math.max(0, Math.min(...face.map((p) => p.y)) - shoulderWidth * .42) : 0;
    const footY = feet.length ? Math.max(...feet.map((p) => p.y)) : 1;
    const xs = points.filter((p) => visible(p)).map((p) => p.x);
    const minX = Math.min(...xs), maxX = Math.max(...xs), centerX = (minX + maxX) / 2;
    const bodyRatio = footY - headY;
    const distance = bodyRatio >= .58 && bodyRatio <= .91;
    const centerOffset = Math.abs(centerX - .5);
    if (centerOffset <= .14) { lastCenterPass = true; centerMissFrames = 0; }
    else if (centerOffset > .20) { centerMissFrames += 1; if (centerMissFrames >= 6) lastCenterPass = false; }
    const center = lastCenterPass;
    const frontal = visible(points[11]) && visible(points[12]) && visible(points[23]) && visible(points[24]) && Math.abs((points[11].z || 0) - (points[12].z || 0)) <= .13 && Math.abs((points[23].z || 0) - (points[24].z || 0)) <= .16;
    const tracked = [0,11,12,23,24,27,28].filter((i) => visible(points[i]));
    let movement = 1;
    if (previousPose && tracked.length >= 5) movement = tracked.reduce((sum, i) => sum + Math.hypot(points[i].x - previousPose[i].x, points[i].y - previousPose[i].y), 0) / tracked.length;
    previousPose = points.map((p) => ({ x: p.x, y: p.y }));
    stableFrames = movement < .009 ? Math.min(20, stableFrames + 1) : 0;
    const stable = stableFrames >= 8, device = deviceCheck();
    const result = { detected: true, fullBody, distance, center, frontal, stable, device, bodyRatio, centerX, headY, footY, minX, maxX, points };
    if (!fullBody) result.instruction = "请后退一点，露出头顶和双脚";
    else if (bodyRatio > .91) result.instruction = "离远一点，给头脚留出边缘";
    else if (bodyRatio < .58) result.instruction = "靠近一点，让人物更清楚";
    else if (!center) result.instruction = centerX < .5 ? "人物向画面右侧移动" : "人物向画面左侧移动";
    else if (!device.pass) result.instruction = device.message;
    else if (!frontal) result.instruction = "肩和髋尽量正对镜头";
    else if (!stable) result.instruction = "位置合适，请保持不动";
    else result.instruction = "状态合格，可以拍摄";
    result.ready = fullBody && distance && center && frontal && stable && device.pass;
    return result;
  }

  function setCheck(name, pass, available = true) {
    const node = checks.querySelector(`[data-check="${name}"]`);
    if (!node) return;
    node.classList.toggle("pass", Boolean(pass));
    node.classList.toggle("warn", !pass && available);
    node.classList.toggle("muted", !available);
  }

  function updateUI(result) {
    analysis = result; instruction.textContent = result.instruction;
    instruction.classList.toggle("ready", Boolean(result.ready)); captureButton.classList.toggle("capture-ready", Boolean(result.ready));
    setCheck("device", result.device?.pass ?? true, result.device?.available ?? false);
    ["fullBody","distance","center","frontal","stable"].forEach((name) => setCheck(name, result.detected ? result[name] : false));
  }

  function draw(result) {
    resizeOverlay(); const context = overlay.getContext("2d"); context.clearRect(0, 0, overlay.width, overlay.height);
    if (!result.detected) return;
    const points = result.points; context.lineWidth = Math.max(3, overlay.width / 260); context.strokeStyle = result.ready ? "#8ee39b" : "#f3d391"; context.fillStyle = context.strokeStyle; context.lineCap = "round";
    LINKS.forEach(([a,b]) => { if (!visible(points[a]) || !visible(points[b])) return; context.beginPath(); context.moveTo(points[a].x * overlay.width, points[a].y * overlay.height); context.lineTo(points[b].x * overlay.width, points[b].y * overlay.height); context.stroke(); });
    [0,11,12,23,24,27,28].forEach((i) => { if (!visible(points[i])) return; context.beginPath(); context.arc(points[i].x * overlay.width, points[i].y * overlay.height, Math.max(4, overlay.width / 150), 0, Math.PI * 2); context.fill(); });
  }

  function loop(now) {
    if (!active) return;
    if (landmarker && video.readyState >= 2 && video.currentTime !== lastVideoTime && now - lastRunAt >= 90) {
      lastVideoTime = video.currentTime; lastRunAt = now;
      try { const result = landmarker.detectForVideo(video, now); const assessed = result.landmarks?.[0] ? assessPose(result.landmarks[0]) : { detected: false, device: deviceCheck(), instruction: "请让人物站进轮廓框内", ready: false }; updateUI(assessed); draw(assessed); }
      catch { updateUI({ detected: false, device: deviceCheck(), instruction: "识别暂时中断，请保持人物完整入镜", ready: false }); }
    }
    frameId = requestAnimationFrame(loop);
  }

  async function start() { active = true; checks.hidden = false; overlay.hidden = false; instruction.hidden = false; await loadModel(); badge.textContent = "实时识别"; frameId = requestAnimationFrame(loop); }
  async function analyzeStill(source) {
    if (!landmarker) await loadModel();
    await landmarker.setOptions({ runningMode: "IMAGE" });
    const result = landmarker.detect(source);
    const assessed = result.landmarks?.[0] ? assessPose(result.landmarks[0]) : { detected: false, device: { pass: true, available: false }, instruction: "没有识别到完整人体", ready: false };
    analysis = assessed;
    return assessed;
  }
  function stop() { active = false; cancelAnimationFrame(frameId); previousPose = null; stableFrames = 0; centerMissFrames = 0; lastCenterPass = false; window.removeEventListener("deviceorientation", orientationHandler, true); landmarker?.close?.(); landmarker = null; }
  return { prepareSensors, start, analyzeStill, stop, getAnalysis: () => analysis };
}

window.createCaptureCoach = createCaptureCoach;
document.documentElement.dataset.captureCoach = "ready";
