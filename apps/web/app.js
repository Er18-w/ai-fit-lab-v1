"use strict";

const sampleSizes = [
  { size: "M", shoulder: 55, chest: 107, length: 68.5, sleeve: 19.5 },
  { size: "L", shoulder: 56.5, chest: 110, length: 70.5, sleeve: 20 },
  { size: "XL", shoulder: 58, chest: 113, length: 72.5, sleeve: 20.5 },
  { size: "2XL", shoulder: 59.5, chest: 117, length: 74.5, sleeve: 21 },
  { size: "3XL", shoulder: 61, chest: 120, length: 76.5, sleeve: 21.5 }
];

const state = {
  step: 1,
  maxStep: 1,
  stream: null,
  photoReady: false,
  sensorHandler: null,
  profile: null,
  result: null,
  tryonTimer: null
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function renderSteps() {
  const labels = ["建档", "商品", "结果", "试穿"];
  $("#steps").innerHTML = labels.map((label, index) => {
    const step = index + 1;
    return `<button type="button" data-go-step="${step}"><span>${step}</span>${label}</button>`;
  }).join("");
}

function renderSizeTable() {
  $("#sizes").innerHTML = sampleSizes.map((row, index) => `
    <tr data-index="${index}">
      <td><b>${row.size}</b></td>
      <td><input aria-label="${row.size} 肩宽" type="number" step="0.1" data-key="shoulder" value="${row.shoulder}"></td>
      <td><input aria-label="${row.size} 胸围" type="number" step="0.1" data-key="chest" value="${row.chest}"></td>
      <td><input aria-label="${row.size} 衣长" type="number" step="0.1" data-key="length" value="${row.length}"></td>
      <td><input aria-label="${row.size} 袖长" type="number" step="0.1" data-key="sleeve" value="${row.sleeve}"></td>
    </tr>`).join("");
}

function showStep(step) {
  if (step > state.maxStep) return;
  state.step = step;
  $$("section[data-step]").forEach((panel) => panel.classList.toggle("active", Number(panel.dataset.step) === step));
  $$("#steps button").forEach((button) => {
    const buttonStep = Number(button.dataset.goStep);
    button.classList.toggle("active", buttonStep === step);
    button.classList.toggle("done", buttonStep < step);
    button.disabled = buttonStep > state.maxStep;
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function unlockAndShow(step) {
  state.maxStep = Math.max(state.maxStep, step);
  showStep(step);
}

async function openCamera() {
  const message = $("#cameraMessage");
  const badge = $("#cameraBadge");
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    badge.textContent = "无法调用";
    badge.className = "status-badge error";
    message.textContent = "当前环境不能直接调用相机。请使用 HTTPS 或 localhost，也可以从相册选择照片继续。";
    return;
  }

  stopCamera();
  message.textContent = "正在请求相机权限…";
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 1920 } }
    });
    const video = $("#video");
    video.srcObject = state.stream;
    await video.play();
    video.hidden = false;
    $("#placeholder").hidden = true;
    $("#canvas").hidden = true;
    $("#capture").hidden = false;
    badge.textContent = "相机已开启";
    badge.className = "status-badge success";
    message.textContent = "请保持全身入镜并站稳，然后拍摄。";
  } catch (error) {
    const denied = error?.name === "NotAllowedError" || error?.name === "SecurityError";
    badge.textContent = denied ? "权限未授予" : "相机不可用";
    badge.className = "status-badge error";
    message.textContent = denied
      ? "你没有授权相机。可以在浏览器设置中重新允许，或从相册选择照片。"
      : "没有找到可用相机，或相机正被其他应用占用。可从相册选择照片继续。";
  }
}

function stopCamera() {
  state.stream?.getTracks().forEach((track) => track.stop());
  state.stream = null;
}

function captureFrame() {
  const video = $("#video");
  if (!video.videoWidth) return;
  const canvas = $("#canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  canvas.hidden = false;
  video.hidden = true;
  $("#placeholder").hidden = true;
  state.photoReady = true;
  stopCamera();
  $("#capture").hidden = true;
  $("#cameraBadge").textContent = "照片已就绪";
  $("#cameraBadge").className = "status-badge success";
  $("#cameraMessage").textContent = "照片仅用于本地流程演示；当前未运行真实人体测量模型。";
}

function loadLocalPhoto(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    $("#cameraMessage").textContent = "请选择 JPG、PNG、HEIC 等图片文件。";
    return;
  }
  const image = new Image();
  const objectUrl = URL.createObjectURL(file);
  image.onload = () => {
    const canvas = $("#canvas");
    const maxWidth = 1200;
    const scale = Math.min(1, maxWidth / image.naturalWidth);
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    canvas.hidden = false;
    $("#video").hidden = true;
    $("#placeholder").hidden = true;
    state.photoReady = true;
    stopCamera();
    $("#capture").hidden = true;
    $("#cameraBadge").textContent = "本地照片已就绪";
    $("#cameraBadge").className = "status-badge success";
    $("#cameraMessage").textContent = "照片只保留在当前页面内存中；刷新或重置后清除。";
    URL.revokeObjectURL(objectUrl);
  };
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    $("#cameraMessage").textContent = "浏览器无法读取这张照片，请换一张重试。";
  };
  image.src = objectUrl;
}

function readOrientation(event) {
  const beta = typeof event.beta === "number" ? event.beta : null;
  const gamma = typeof event.gamma === "number" ? event.gamma : null;
  const message = $("#sensorMessage");
  if (beta === null || gamma === null) {
    message.textContent = "设备没有返回角度数据，可以跳过并按画面引导拍摄。";
    return;
  }
  const sideTilt = Math.abs(gamma);
  message.textContent = sideTilt <= 8
    ? `横向倾斜约 ${sideTilt.toFixed(1)}°，处于演示引导范围内。`
    : `横向倾斜约 ${sideTilt.toFixed(1)}°，建议扶正手机；±8° 只是待验证的演示阈值。`;
}

async function requestOrientation() {
  const message = $("#sensorMessage");
  if (!("DeviceOrientationEvent" in window)) {
    message.textContent = "此设备不支持方向传感器。已跳过，不影响后续流程。";
    return;
  }
  try {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== "granted") throw new Error("permission-denied");
    }
    if (state.sensorHandler) window.removeEventListener("deviceorientation", state.sensorHandler);
    state.sensorHandler = readOrientation;
    window.addEventListener("deviceorientation", state.sensorHandler, { passive: true });
    message.textContent = "角度检测已开启。若数值不出现，也可以直接跳过。";
  } catch {
    message.textContent = "方向权限未授予。已跳过，不影响拍照和尺码流程。";
  }
}

function submitProfile(event) {
  event.preventDefault();
  const height = Number($("#height").value);
  const weight = Number($("#weight").value);
  const chest = Number($("#chest").value) || null;
  const shoulder = Number($("#shoulder").value) || null;
  const error = $("#profileError");
  if (height < 130 || height > 220 || weight < 30 || weight > 200) {
    error.textContent = "请检查身高和体重：演示范围为身高 130–220 cm、体重 30–200 kg。";
    return;
  }
  error.textContent = "";
  state.profile = {
    system: $("input[name='system']:checked").value,
    height,
    weight,
    chest,
    shoulder,
    photoSource: state.photoReady ? "local_photo" : "not_provided"
  };
  unlockAndShow(2);
}

function currentRows() {
  return $$("#sizes tr").map((tr) => {
    const base = sampleSizes[Number(tr.dataset.index)];
    const values = Object.fromEntries($$("input", tr).map((input) => [input.dataset.key, Number(input.value)]));
    return { size: base.size, ...values };
  });
}

function targetEase(fit) {
  return ({ "修身": [0, 4], "合体": [4, 8], "微宽松": [8, 14], "宽松": [14, 22] })[fit];
}

function calculateResult() {
  const fit = $("input[name='fit']:checked").value;
  const rows = currentRows();
  const chest = state.profile.chest;
  const shoulder = state.profile.shoulder;
  let ranked = rows;
  let recommended = null;

  if (chest) {
    const [minEase, maxEase] = targetEase(fit);
    const center = (minEase + maxEase) / 2;
    ranked = [...rows].sort((a, b) => Math.abs((a.chest - chest) - center) - Math.abs((b.chest - chest) - center));
    recommended = ranked[0];
  }

  const visualShoulder = shoulder;
  const primary = recommended || rows[Math.min(1, rows.length - 1)];
  const shoulderDelta = visualShoulder === null ? null : primary.shoulder - visualShoulder;
  const lengthRelation = primary.length / state.profile.height;
  state.result = { fit, rows, recommended, primary, visualShoulder, shoulderDelta, lengthRelation };
  renderResult();
  unlockAndShow(3);
}

function renderResult() {
  const { recommended, primary, fit, shoulderDelta, lengthRelation } = state.result;
  const hasChest = Boolean(state.profile.chest);
  const card = $("#recommendation");
  if (hasChest) {
    const ease = primary.chest - state.profile.chest;
    card.innerHTML = `<p class="result-label">MOCK 候选建议</p><h3>${primary.size} 码</h3><p>胸围松量约 ${ease.toFixed(1)} cm，最接近“${fit}”演示区间。结论仍需真实规则校准和用户试穿反馈验证。</p><span class="confidence">数据质量：中 · 含人工胸围</span>`;
  } else {
    card.innerHTML = `<p class="result-label">数据不足 · 已降级</p><h3>${primary.size} / ${state.result.rows[Math.min(2, state.result.rows.length - 1)].size} 候选</h3><p>没有可靠人体胸围，系统不能判断能否穿下，也不会给出唯一精准尺码。补充软尺胸围后才能比较胸围松量。</p><span class="confidence">置信度：低 · 仅演示肩部与衣长</span>`;
  }
  $("#resultIntro").textContent = `以 ${primary.size} 码作为示意，目标效果为“${fit}”。`;

  const shoulderText = shoulderDelta === null ? "缺少可靠人体肩宽" : shoulderDelta > 12 ? "明显落肩" : shoulderDelta > 7 ? "轻至中度落肩" : "接近正肩关系";
  const lengthText = lengthRelation > 0.42 ? "偏长衣身" : lengthRelation > 0.39 ? "常规偏长" : "常规衣长";
  const items = [
    {
      title: "肩部关系",
      value: shoulderText,
      detail: shoulderDelta === null ? `成衣肩宽 ${primary.shoulder} cm；未提供人工肩峰宽，因此不计算肩宽差。` : `成衣肩宽 ${primary.shoulder} cm；人工肩峰宽 ${state.result.visualShoulder.toFixed(1)} cm；两种口径仅作实验关系展示，不能直接等同。`,
      rule: state.profile.shoulder ? "依据：人工肩峰宽 + MOCK_SHOULDER_RELATION" : "拒答规则：MISSING_RELIABLE_SHOULDER"
    },
    {
      title: "胸围松量",
      value: hasChest ? `${(primary.chest - state.profile.chest).toFixed(1)} cm` : "无法计算",
      detail: hasChest ? `成衣胸围 ${primary.chest} cm − 人体胸围 ${state.profile.chest} cm。` : "单张正面照片不用于自动推算胸围；因此只展示候选与风险。",
      rule: hasChest ? "依据：MOCK_CHEST_EASE_V0 · 阈值待真人校准" : "拒答规则：MISSING_RELIABLE_CHEST"
    },
    {
      title: "纵向关系",
      value: lengthText,
      detail: `衣长 ${primary.length} cm，约为身高的 ${(lengthRelation * 100).toFixed(1)}%。这里只表达比例，不代表真实衣摆落点。`,
      rule: "依据：MOCK_LENGTH_RATIO_V0 · 需关键点与实穿校准"
    }
  ];
  $("#dimensions").innerHTML = items.map((item) => `<article class="card dimension"><h3>${item.title}</h3><b>${item.value}</b><p class="tip">${item.detail}</p><small>${item.rule}</small></article>`).join("");
}

function setTryonStatus(kind, title, message) {
  const box = $("#job");
  box.className = `card row ${kind}`;
  box.querySelector("h3").textContent = title;
  box.querySelector("p").textContent = message;
}

function simulateTryon(shouldFail = false) {
  clearTimeout(state.tryonTimer);
  $("#tryon").disabled = true;
  $("#tryonOutput").className = "tryon-output";
  $("#tryonOutput").innerHTML = "<span>任务排队中…</span>";
  setTryonStatus("processing", "任务已排队", "Mock job_001 · 等待异步适配器处理");
  state.tryonTimer = setTimeout(() => {
    setTryonStatus("processing", "正在生成视觉参考", "人物与商品图未上传；当前仅演示状态轮询。");
    $("#tryonOutput").innerHTML = "<span>处理中…</span>";
    state.tryonTimer = setTimeout(() => {
      $("#tryon").disabled = false;
      if (shouldFail) {
        setTryonStatus("failure", "生成失败，但合身结果仍然有效", "可重新尝试；失败不会修改 STEP 03 的计算结论。");
        $("#tryonOutput").innerHTML = "<span>本次生成失败</span>";
      } else {
        setTryonStatus("success", "视觉参考已生成", "Mock 结果 · 正式版必须明确标注由 AI 生成。");
        $("#tryonOutput").className = "tryon-output is-ready";
        $("#tryonOutput").innerHTML = "<span>AI 视觉参考<br><small>轻落肩 · 合体感</small></span>";
      }
    }, 1300);
  }, 900);
}

function resetApp() {
  stopCamera();
  clearTimeout(state.tryonTimer);
  if (state.sensorHandler) window.removeEventListener("deviceorientation", state.sensorHandler);
  state.step = 1;
  state.maxStep = 1;
  state.photoReady = false;
  state.profile = null;
  state.result = null;
  $("#profile").reset();
  $("#height").value = "175";
  $("#weight").value = "68";
  $("#video").hidden = true;
  $("#canvas").hidden = true;
  $("#placeholder").hidden = false;
  $("#capture").hidden = true;
  $("#cameraBadge").textContent = "尚未检测";
  $("#cameraBadge").className = "status-badge neutral";
  $("#cameraMessage").textContent = "";
  $("#sensorMessage").textContent = "";
  setTryonStatus("idle", "尚未提交", "演示适配器不会调用云服务或上传照片。");
  $("#tryonOutput").className = "tryon-output";
  $("#tryonOutput").innerHTML = "<span>等待生成</span>";
  renderSizeTable();
  showStep(1);
}

function bindEvents() {
  $$("#steps button").forEach((button) => button.addEventListener("click", () => showStep(Number(button.dataset.goStep))));
  $("#openCamera").addEventListener("click", openCamera);
  $("#capture").addEventListener("click", captureFrame);
  $("#photo").addEventListener("change", (event) => loadLocalPhoto(event.target.files?.[0]));
  $("#sensor").addEventListener("click", requestOrientation);
  $("#profile").addEventListener("submit", submitProfile);
  $("#calculate").addEventListener("click", calculateResult);
  $("#toTryon").addEventListener("click", () => unlockAndShow(4));
  $("#tryon").addEventListener("click", () => simulateTryon(false));
  $("#tryonFail").addEventListener("click", () => simulateTryon(true));
  $("#reset").addEventListener("click", resetApp);
  window.addEventListener("pagehide", stopCamera);
}

renderSteps();
renderSizeTable();
bindEvents();
