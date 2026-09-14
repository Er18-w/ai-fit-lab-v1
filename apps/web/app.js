"use strict";

const products = [
  {
    id: "tee-sage", name: "鼠尾草绿落肩短袖", category: "top", icon: "👕", color: "#cbd6c4", partner: true,
    note: "柔和低饱和 · 适合日常", match: 92,
    sizes: [
      { size: "M", shoulder: 55, chest: 107, length: 68.5 },
      { size: "L", shoulder: 56.5, chest: 110, length: 70.5 },
      { size: "XL", shoulder: 58, chest: 113, length: 72.5 },
      { size: "2XL", shoulder: 59.5, chest: 117, length: 74.5 },
      { size: "3XL", shoulder: 61, chest: 120, length: 76.5 }
    ]
  },
  { id: "shirt-blue", name: "雾蓝牛津纺衬衫", category: "top", icon: "👔", color: "#b9cbd4", partner: true, note: "轮廓清楚 · 通勤友好", match: 88 },
  { id: "pants-khaki", name: "卡其直筒休闲裤", category: "bottom", icon: "👖", color: "#d2c39e", partner: false, note: "直筒不贴腿 · 平衡上身", match: 90 },
  { id: "jeans-dark", name: "深靛蓝直筒牛仔裤", category: "bottom", icon: "👖", color: "#7f94a4", partner: true, note: "耐搭配 · 下装有重量", match: 86 },
  { id: "shoe-cream", name: "米白低帮休闲鞋", category: "shoe", icon: "👟", color: "#e6dfcf", partner: true, note: "脚长 25.5–26.3 cm 可试 42", match: 91 },
  { id: "shoe-brown", name: "棕色德训鞋", category: "shoe", icon: "👟", color: "#b99b7d", partner: false, note: "暖色呼应 · 前掌常规", match: 84 }
];

const fallbackSizes = products[0].sizes;
const state = {
  view: "home",
  profile: { height: 175, weight: 68, chest: 96, shoulder: 44, waist: null, foot: 26 },
  product: products[0],
  fit: "regular",
  result: null,
  scene: "daily",
  lookIndex: 0,
  stream: null,
  tryonTimer: null
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function showView(view) {
  if (!$("[data-view-panel='" + view + "']")) return;
  state.view = view;
  $$("[data-view-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.viewPanel === view));
  $$(".bottom-nav [data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  if (view === "fit") renderSelectedProduct();
  if (view === "match") renderLook();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function productArt(product) {
  return `<div class="product-art" style="background:${product.color}">${product.partner ? "<i>合作商品</i>" : ""}<span>${product.icon}</span></div>`;
}

function productTags(product) {
  return `<div class="tags"><span class="tag">适合度 ${product.match}%</span>${product.partner ? '<span class="tag partner">合作商品</span>' : '<span class="tag">示例商品</span>'}</div>`;
}

function renderProducts(category = "all") {
  const shown = products.filter((item) => category === "all" || item.category === category);
  $("#productList").innerHTML = shown.map((product) => `
    <button class="product-row" data-product="${product.id}">
      ${productArt(product)}
      <span class="product-copy"><b>${product.name}</b><p>${product.note}</p>${productTags(product)}</span>
    </button>`).join("");
  $$("[data-product]").forEach((button) => button.addEventListener("click", () => selectProduct(button.dataset.product)));
}

function renderHomeProducts() {
  $("#homeProducts").innerHTML = products.filter((item) => item.partner).slice(0, 3).map((product) => `
    <button class="product-mini" data-home-product="${product.id}">${productArt(product)}<div><b>${product.name}</b><small>适合度 ${product.match}%</small></div></button>`).join("");
  $$('[data-home-product]').forEach((button) => button.addEventListener("click", () => selectProduct(button.dataset.homeProduct)));
}

function selectProduct(id) {
  state.product = products.find((item) => item.id === id) || products[0];
  if (state.product.category === "top") {
    if (!state.product.sizes) state.product.sizes = fallbackSizes;
    showView("fit");
  } else if (state.product.category === "shoe") {
    showToast(`根据脚长 ${state.profile.foot || "未填写"} cm，${state.product.name} 建议先试 42 码；当前为示例规则。`);
  } else {
    showToast("裤装合身引擎将在下一阶段接入；已将商品加入搭配演示。 ");
    state.lookIndex = products.indexOf(state.product);
    showView("match");
  }
}

function renderSelectedProduct() {
  const product = state.product;
  $("#selectedProduct").innerHTML = `<div class="selected-product">${productArt(product)}<div><p class="eyebrow">正在分析</p><h2>${product.name}</h2><p>${product.note}</p>${productTags(product)}</div></div>`;
  $("#fitHeight").value = state.profile.height;
  $("#fitWeight").value = state.profile.weight;
  $("#fitChest").value = state.profile.chest || "";
  $("#fitShoulder").value = state.profile.shoulder || "";
  const sizes = product.sizes || fallbackSizes;
  $("#fitSizeRows").innerHTML = sizes.map((row) => `<tr><td><b>${row.size}</b></td><td>${row.shoulder}</td><td>${row.chest}</td><td>${row.length}</td></tr>`).join("");
}

const easeTargets = {
  slim: { label: "修身", range: [0, 4] },
  regular: { label: "合体", range: [4, 8] },
  relaxed: { label: "微宽松", range: [8, 14] },
  oversized: { label: "宽松", range: [14, 22] }
};

function calculateFit() {
  const height = Number($("#fitHeight").value);
  const weight = Number($("#fitWeight").value);
  const chest = Number($("#fitChest").value) || null;
  const shoulder = Number($("#fitShoulder").value) || null;
  if (height < 130 || height > 220 || weight < 30 || weight > 200) {
    $("#fitError").textContent = "请检查身高和体重是否在合理范围内。";
    return;
  }
  $("#fitError").textContent = "";
  state.profile = { ...state.profile, height, weight, chest, shoulder };
  const sizes = state.product.sizes || fallbackSizes;
  const target = easeTargets[state.fit];
  const center = (target.range[0] + target.range[1]) / 2;
  let ranked = sizes.map((row) => ({ ...row, ease: chest ? row.chest - chest : null }));
  if (chest) ranked.sort((a, b) => Math.abs(a.ease - center) - Math.abs(b.ease - center));
  const primary = chest ? ranked[0] : sizes[1] || sizes[0];
  state.result = {
    primary,
    alternative: chest ? ranked[1] : sizes[2] || sizes[0],
    target,
    chest,
    shoulder,
    height,
    reliable: Boolean(chest),
    shoulderDelta: shoulder ? primary.shoulder - shoulder : null,
    lengthRatio: primary.length / height
  };
  renderResult();
  saveProfile();
  showView("result");
}

function relationText(status, low, high) {
  if (status === null) return "数据不足";
  if (status < low) return "偏紧";
  if (status > high) return "偏宽松";
  return "接近目标";
}

function renderResult() {
  const result = state.result;
  const product = state.product;
  const unique = result.reliable;
  $("#resultTitle").textContent = unique ? `建议优先试 ${result.primary.size} 码` : "暂不输出唯一尺码";
  $("#resultSubtitle").textContent = unique
    ? `${product.name} · 目标效果“${result.target.label}”`
    : `缺少可靠胸围，先保留 ${result.primary.size} / ${result.alternative.size} 两个候选。`;
  $("#resultHero").innerHTML = unique
    ? `<p class="eyebrow">首选尺码</p><div class="result-size">${result.primary.size}</div><h2>胸围松量约 ${result.primary.ease.toFixed(1)} cm</h2><p>最接近“${result.target.label}”的演示区间 ${result.target.range[0]}–${result.target.range[1]} cm。</p><span class="confidence">可信度：中 · 含手工胸围</span>`
    : `<p class="eyebrow">候选尺码</p><div class="result-size">${result.primary.size}/${result.alternative.size}</div><h2>补充胸围后才能给出单一建议</h2><p>身高体重不足以判断衣服能否穿下，系统不会为了完整而编造答案。</p><span class="confidence">可信度：低 · 已降级</span>`;

  const shoulderValue = result.shoulderDelta;
  const shoulderLabel = shoulderValue === null ? "无法判断" : shoulderValue > 12 ? "明显落肩" : shoulderValue > 7 ? "轻至中度落肩" : "接近正肩";
  const lengthLabel = result.lengthRatio > .42 ? "衣身偏长" : result.lengthRatio > .39 ? "常规偏长" : "常规衣长";
  const easeLabel = result.chest ? relationText(result.primary.ease, result.target.range[0], result.target.range[1]) : "无法判断";
  const dimensions = [
    ["胸围松量", easeLabel, result.chest ? `${result.primary.chest} − ${result.chest} = ${result.primary.ease.toFixed(1)} cm。` : "单张照片不自动推算胸围；请手工填写后再计算。"],
    ["肩线关系", shoulderLabel, shoulderValue === null ? "未填写人体肩宽，因此不输出肩线落点。" : `成衣肩宽比人体参考肩宽大 ${shoulderValue.toFixed(1)} cm；落肩款只能做关系描述。`],
    ["衣长关系", lengthLabel, `衣长 ${result.primary.length} cm，约为身高的 ${(result.lengthRatio * 100).toFixed(1)}%；真实衣摆位置仍需关键点校准。`],
    ["备选方案", result.alternative.size + " 码", unique ? `如果希望更${result.alternative.chest > result.primary.chest ? "宽松" : "修身"}，可把 ${result.alternative.size} 作为试穿备选。` : "两个候选都需要结合实穿或补充数据判断。"]
  ];
  $("#fitDimensions").innerHTML = dimensions.map(([name, value, detail]) => `<article class="dimension-card"><b>${name}</b><b>${value}</b><p>${detail}</p></article>`).join("");
}

const looks = {
  daily: [
    { top: "tee-sage", bottom: "pants-khaki", shoe: "shoe-cream", reason: "低饱和同类色，日常但不单调", detail: "鼠尾草绿和卡其色保持柔和，米白鞋让下半身更轻；上衣略短、裤型直，比例更利落。" },
    { top: "shirt-blue", bottom: "jeans-dark", shoe: "shoe-brown", reason: "上浅下深，让视觉重心更稳定", detail: "雾蓝衬衫负责清爽，深靛牛仔裤压住下半身，棕色鞋增加一点温度。" }
  ],
  date: [
    { top: "shirt-blue", bottom: "pants-khaki", shoe: "shoe-brown", reason: "柔和对比，比全身黑更容易亲近", detail: "蓝、卡其与棕色都不抢眼，轮廓整洁，适合见面但没有刻意正式感。" },
    { top: "tee-sage", bottom: "jeans-dark", shoe: "shoe-cream", reason: "颜色克制，把注意力留给人", detail: "深浅关系清楚，鞋子提亮；配饰不需要再堆很多颜色。" }
  ],
  weekend: [
    { top: "tee-sage", bottom: "jeans-dark", shoe: "shoe-brown", reason: "自然色组合，耐脏也适合拍照", detail: "绿色与棕色相互呼应，深色牛仔裤适合走动；整体松弛但不拖沓。" },
    { top: "shirt-blue", bottom: "pants-khaki", shoe: "shoe-cream", reason: "明亮轻松，适合白天户外", detail: "三个单品都偏浅，用不同材质拉开层次，避免看起来像一整块。" }
  ]
};

function renderLook() {
  const options = looks[state.scene];
  const look = options[state.lookIndex % options.length];
  const keys = [["上衣", look.top], ["裤子", look.bottom], ["鞋子", look.shoe]];
  $("#matchLook").innerHTML = keys.map(([label, id]) => {
    const product = products.find((item) => item.id === id);
    return `<article class="look-item">${productArt(product)}<b>${label}</b><small>${product.name}</small></article>`;
  }).join("");
  $("#matchReason").textContent = look.reason;
  $("#matchDetail").textContent = look.detail + " 当前为规则文案与假数据演示。";
}

function runTryon() {
  clearTimeout(state.tryonTimer);
  const button = $("#runTryon");
  const job = $("#tryonJob");
  const canvas = $("#tryonCanvas");
  button.disabled = true;
  job.className = "job-card running";
  job.querySelector("b").textContent = "正在分析人物与商品图";
  job.querySelector("p").textContent = "Mock job_001 · 模拟排队与生成状态";
  canvas.classList.remove("ready");
  canvas.querySelector("p").textContent = "生成中…";
  state.tryonTimer = setTimeout(() => {
    job.querySelector("b").textContent = "正在生成视觉参考";
    job.querySelector("p").textContent = "此处未来接入专用 VTON 服务，不用普通提示词代替精确合身。";
    state.tryonTimer = setTimeout(() => {
      button.disabled = false;
      job.className = "job-card";
      job.querySelector("b").textContent = "演示结果已生成";
      job.querySelector("p").textContent = "本次只改变示意轮廓与颜色，没有上传任何照片。";
      canvas.classList.add("ready");
      canvas.querySelector("p").textContent = `${state.product.name} · ${easeTargets[state.fit].label}氛围参考`;
    }, 1200);
  }, 900);
}

const labContent = {
  hair: ["✂️", "发型与发色灵感", "模拟：比较短层次、自然卷与深茶色。正式版需要人脸与发型参考图生成。"],
  body: ["↕️", "体态与轮廓情景", "模拟：展示肩背打开、腰线变化等视觉情景，不预测减重后的真实结果。"],
  style: ["🎨", "陌生风格试验", "模拟：从日常松弛切换到清爽通勤，同时保留你不喜欢紧绷感的偏好。"],
  animal: ["🦊", "赤狐型 · 敏锐而松弛", "动物人格负责陪伴、表达与审美偏好，不替代身体数据或尺码计算。"]
};

function renderLab(type) {
  $$("[data-lab]").forEach((button) => button.classList.toggle("active", button.dataset.lab === type));
  const [icon, title, text] = labContent[type];
  $("#labStage").innerHTML = `<div class="animal-avatar large">${icon}</div><div><b>${title}</b><p>${text}</p><button class="text-button" type="button">生成一组模拟方案 →</button></div>`;
  $("#labStage button").addEventListener("click", () => showToast("已生成 3 个概念方案（Demo 假数据）"));
}

function saveProfile() {
  try { localStorage.setItem("ziru-demo-profile", JSON.stringify(state.profile)); } catch {}
  const filled = Object.values(state.profile).filter(Boolean).length;
  $("#profileCompleteness").textContent = `当前完整度 ${Math.round(filled / 6 * 100)}%`;
}

function loadProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem("ziru-demo-profile"));
    if (saved && typeof saved === "object") state.profile = { ...state.profile, ...saved };
  } catch {}
  const mapping = { Height: "height", Weight: "weight", Chest: "chest", Shoulder: "shoulder", Waist: "waist", Foot: "foot" };
  Object.entries(mapping).forEach(([suffix, key]) => { $("#profile" + suffix).value = state.profile[key] || ""; });
  saveProfile();
}

function submitProfile(event) {
  event.preventDefault();
  const field = (name) => Number($("#profile" + name).value) || null;
  state.profile = { height: field("Height"), weight: field("Weight"), chest: field("Chest"), shoulder: field("Shoulder"), waist: field("Waist"), foot: field("Foot") };
  saveProfile();
  showToast("身体档案已保存在当前浏览器");
  showView("home");
}

async function openCamera() {
  const message = $("#cameraMessage");
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    message.textContent = "浏览器相机需要 HTTPS 或 localhost；你仍可使用系统相册/相机上传。";
    return;
  }
  stopCamera();
  message.textContent = "正在请求相机权限…";
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 1920 } } });
    const video = $("#cameraVideo");
    video.srcObject = state.stream;
    await video.play();
    video.hidden = false;
    $("#cameraPlaceholder").hidden = true;
    $("#cameraCanvas").hidden = true;
    $("#capturePhoto").hidden = false;
    message.textContent = "相机已开启，请保持头顶和脚底完整入镜。";
  } catch (error) {
    message.textContent = error?.name === "NotAllowedError" ? "未获得相机权限，可改用相册选择。" : "相机不可用或正被其他程序占用。";
  }
}

function stopCamera() {
  state.stream?.getTracks().forEach((track) => track.stop());
  state.stream = null;
}

function capturePhoto() {
  const video = $("#cameraVideo");
  if (!video.videoWidth) return;
  const canvas = $("#cameraCanvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
  canvas.hidden = false;
  video.hidden = true;
  $("#capturePhoto").hidden = true;
  stopCamera();
  $("#cameraMessage").textContent = "照片仅保留在当前页面内存中；Demo 未运行人体测量模型。";
}

function loadPhoto(file, canvasSelector, placeholderSelector, messageSelector) {
  if (!file?.type.startsWith("image/")) return;
  const image = new Image();
  const url = URL.createObjectURL(file);
  image.onload = () => {
    const canvas = $(canvasSelector);
    const scale = Math.min(1, 1200 / image.naturalWidth);
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    canvas.hidden = false;
    $(placeholderSelector).hidden = true;
    if (messageSelector) $(messageSelector).textContent = "图片已载入本机内存，刷新页面后清除。";
    URL.revokeObjectURL(url);
  };
  image.src = url;
}

let toastTimer;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function bindEvents() {
  $$('[data-view]').forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
  $("[data-action='start-buy']").addEventListener("click", () => showView("shop"));
  $("#demoInfo").addEventListener("click", () => $("#infoDialog").showModal());
  $(".dialog-close").addEventListener("click", () => $("#infoDialog").close());
  $("#infoDialog").addEventListener("click", (event) => { if (event.target === $("#infoDialog")) $("#infoDialog").close(); });
  $("#uploadProduct").addEventListener("click", () => $("#productFile").click());
  $("#productFile").addEventListener("change", (event) => {
    if (!event.target.files[0]) return;
    $("#uploadStatus").textContent = "商品截图已在本地读取。OCR 当前为模拟：已识别为“短袖 T 恤”，请确认示例尺码表。";
    state.product = { ...products[0], id: "user-upload", name: "我上传的短袖商品", partner: false, note: "本地图片 · 尺码表识别为 Demo 模拟" };
    setTimeout(() => showView("fit"), 450);
  });
  $("#browsePartners").addEventListener("click", () => $("#productList").scrollIntoView({ behavior: "smooth" }));
  $$("[data-category]").forEach((button) => button.addEventListener("click", () => {
    $$("[data-category]").forEach((item) => item.classList.toggle("active", item === button));
    renderProducts(button.dataset.category);
  }));
  $$("[data-fit]").forEach((button) => button.addEventListener("click", () => {
    state.fit = button.dataset.fit;
    $$("[data-fit]").forEach((item) => item.classList.toggle("active", item === button));
  }));
  $("#calculateFit").addEventListener("click", calculateFit);
  $("#generateTryon").addEventListener("click", () => showView("tryon"));
  $("#addToMatch").addEventListener("click", () => showView("match"));
  $("#runTryon").addEventListener("click", runTryon);
  $$("[data-scene]").forEach((button) => button.addEventListener("click", () => {
    state.scene = button.dataset.scene;
    state.lookIndex = 0;
    $$("[data-scene]").forEach((item) => item.classList.toggle("active", item === button));
    renderLook();
  }));
  $("#remixLook").addEventListener("click", () => { state.lookIndex += 1; renderLook(); });
  $$("[data-lab]").forEach((button) => button.addEventListener("click", () => renderLab(button.dataset.lab)));
  $("#profileForm").addEventListener("submit", submitProfile);
  $("#openCamera").addEventListener("click", openCamera);
  $("#capturePhoto").addEventListener("click", capturePhoto);
  $("#bodyPhoto").addEventListener("change", (event) => loadPhoto(event.target.files[0], "#cameraCanvas", "#cameraPlaceholder", "#cameraMessage"));
  window.addEventListener("pagehide", stopCamera);
}

renderHomeProducts();
renderProducts();
loadProfile();
renderLook();
bindEvents();
