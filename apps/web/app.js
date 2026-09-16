"use strict";

const products = [
  { id: "tee-white", name: "白色针织短袖", category: "top", image: "assets/wardrobe-top-white.jpg", note: "方圆领 · 修身短款", color: "柔白", season: "春夏", match: 92, data: "肩宽 55–61 / 胸围 107–120 cm", sizes: [
    { size: "M", shoulder: 55, chest: 107, length: 68.5 }, { size: "L", shoulder: 56.5, chest: 110, length: 70.5 },
    { size: "XL", shoulder: 58, chest: 113, length: 72.5 }, { size: "2XL", shoulder: 59.5, chest: 117, length: 74.5 },
    { size: "3XL", shoulder: 61, chest: 120, length: 76.5 }
  ]},
  { id: "cardigan-black", name: "黑色短款开衫", category: "outer", image: "assets/wardrobe-outer-black.jpg", note: "V 领 · 细针织", color: "黑色", season: "四季", match: 88, data: "演示衣橱数据" },
  { id: "skirt-cargo", name: "白色工装短裙", category: "skirt", image: "assets/wardrobe-skirt-cargo.jpg", note: "高腰 · 侧袋", color: "柔白", season: "春夏", match: 89, data: "演示衣橱数据" },
  { id: "skirt-mini", name: "白色极简短裙", category: "skirt", image: "assets/wardrobe-skirt-mini.jpg", note: "低腰 · A 字", color: "白色", season: "春夏", match: 86, data: "演示衣橱数据" },
  { id: "skirt-pleated", name: "白色百褶裙", category: "skirt", image: "assets/wardrobe-skirt-white.jpg", note: "高腰 · 中短款", color: "白色", season: "春夏", match: 91, data: "演示衣橱数据" },
  { id: "skirt-long", name: "象牙白长裙", category: "skirt", image: "assets/wardrobe-skirt-long.jpg", note: "直筒 · 垂顺长款", color: "象牙白", season: "四季", match: 90, data: "演示衣橱数据" },
  { id: "skirt-stripe", name: "条纹针织半裙", category: "skirt", image: "assets/wardrobe-bottom-blue.jpg", note: "包臀 · 及踝", color: "燕麦色", season: "秋冬", match: 87, data: "演示衣橱数据" },
  { id: "skirt-denim", name: "蓝色牛仔短裙", category: "skirt", image: "assets/wardrobe-bottom-cream.jpg", note: "中腰 · 复古水洗", color: "牛仔蓝", season: "四季", match: 86, data: "演示衣橱数据" },
  { id: "pants-balloon", name: "奶油白灯笼裤", category: "bottom", image: "assets/wardrobe-bottom-pleated.jpg", note: "高腰 · 宽松廓形", color: "奶油白", season: "春夏", match: 90, data: "演示衣橱数据" },
  { id: "skirt-casual", name: "浅灰抽绳短裙", category: "skirt", image: "assets/wardrobe-bottom-black.jpg", note: "中腰 · 休闲短款", color: "浅灰", season: "春夏", match: 84, data: "演示衣橱数据" },
  { id: "shirt-blue", name: "清爽通勤衬衫", category: "top", image: "assets/wardrobe-shirt-blue.jpg", note: "常规领型 · 轻薄叠穿", color: "雾霾蓝", season: "春夏", match: 88, data: "示例规格：胸围 104–116 cm" },
  { id: "shoe-grey", name: "灰白缓震运动鞋", category: "shoe", image: "assets/wardrobe-shoe-white.jpg", note: "低帮 · 日常休闲", color: "灰白", season: "四季", match: 91, data: "示例数据：前掌常规" }
];

const fallbackSizes = products[0].sizes;
const state = {
  view: "home",
  profile: { version: 2, height: 175, weight: 68, age: null, system: "unisex", chest: null, shoulder: null, waist: null, hip: null, arm: null, inseam: null, foot: null, forefoot: null, createdAt: null },
  product: products[0], fit: "regular", result: null, stream: null, captureCoach: null, tryonTimer: null,
  closet: [...products], closetCategory: "all",
  board: ["tee-white", "skirt-long", "shoe-grey"],
  boardPositions: {}, savedOutfits: [], personPhoto: null, basePhoto: null, avatarPhoto: null, bodyAnalysis: null
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function showView(view) {
  if (!$(`[data-view-panel='${view}']`)) return;
  state.view = view;
  $$('[data-view-panel]').forEach((panel) => panel.classList.toggle("active", panel.dataset.viewPanel === view));
  $$('.bottom-nav [data-view]').forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  if (view === "fit") renderSelectedProduct();
  if (view === "wardrobe") { renderWardrobe(); renderBoard(); }
  if (view === "tryon") { updateTryonSummary(); useSavedIdentityForTryon(); }
  if (view === "profile") { renderProfileOverview(); showProfileStep("overview"); }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function safeProduct(id) { return state.closet.find((item) => item.id === id) || products.find((item) => item.id === id); }
function productArt(product) { return `<div class="product-art"><img src="${product.image}" alt="${product.name}" loading="lazy"></div>`; }
const categoryLabels = { top: "上衣", outer: "外套", skirt: "半身裙", bottom: "裤子", dress: "连体裙", shoe: "鞋子" };
function productTags(product) { return `<div class="tags"><span class="tag">示例匹配 ${product.match || 85}%</span><span class="tag">${categoryLabels[product.category] || "其他"}</span></div>`; }

function renderProducts(category = "all") {
  const shown = products.filter((item) => category === "all" || item.category === category);
  $("#productList").innerHTML = shown.map((product) => `<button class="product-row" data-product="${product.id}">${productArt(product)}<span class="product-copy"><b>${product.name}</b><p>${product.note}</p><small class="data-line">${product.data}</small>${productTags(product)}</span></button>`).join("");
  $$('[data-product]').forEach((button) => button.addEventListener("click", () => selectProduct(button.dataset.product)));
}

function selectProduct(id) {
  state.product = products.find((item) => item.id === id) || products[0];
  if (state.product.category === "top") {
    if (!state.product.sizes) state.product.sizes = fallbackSizes;
    showView("fit");
  } else if (state.product.category === "shoe") {
    showToast(`根据脚长 ${state.profile.foot || "未填写"} cm，建议先试 42 码；当前为示例规则。`);
  } else {
    addToBoard(state.product.id);
    showToast("裤装精确尺码尚未接入，已先加入衣橱搭配。 ");
    showView("wardrobe");
  }
}

function renderWardrobe() {
  const shown = state.closet.filter((item) => state.closetCategory === "all" || item.category === state.closetCategory);
  $("#closetGrid").innerHTML = shown.map((item) => `<button class="closet-card ${state.board.includes(item.id) ? "selected" : ""}" data-closet-id="${item.id}">${productArt(item)}<span><b>${item.name}</b><small>${item.color || "已整理"} · ${categoryLabels[item.category] || "其他"}</small><i>${state.board.includes(item.id) ? "✓ 已加入搭配" : "＋ 加入搭配"}</i></span></button>`).join("");
  $$('[data-closet-id]').forEach((button) => button.addEventListener("click", () => toggleBoardItem(button.dataset.closetId)));
}

function toggleBoardItem(id) {
  state.board.includes(id) ? removeFromBoard(id) : addToBoard(id);
  renderWardrobe();
  renderBoard();
}

function addToBoard(id) {
  if (!state.board.includes(id)) state.board.push(id);
}

function removeFromBoard(id) {
  state.board = state.board.filter((item) => item !== id);
  delete state.boardPositions[id];
}

function defaultBoardPosition(item, index) {
  const group = ["top", "outer"].includes(item.category) ? 0 : ["bottom", "skirt", "dress"].includes(item.category) ? 1 : 2;
  return { x: 34 + (index % 2) * 7, y: 4 + group * 29 + (index % 2) * 5 };
}

function renderBoard() {
  const board = $("#outfitBoard");
  const items = state.board.map(safeProduct).filter(Boolean);
  board.innerHTML = items.length ? "" : '<div id="boardEmpty" class="board-empty"><b>空白搭配画布</b><small>从衣橱选择上衣、裤子和鞋子</small></div>';
  items.forEach((item, index) => {
    const pos = state.boardPositions[item.id] || defaultBoardPosition(item, index);
    state.boardPositions[item.id] = pos;
    const node = document.createElement("div");
    node.className = `board-piece board-piece-${item.category}`;
    node.dataset.boardId = item.id;
    node.style.left = `${pos.x}%`;
    node.style.top = `${pos.y}%`;
    node.innerHTML = `<img src="${item.image}" alt="${item.name}"><button aria-label="移除${item.name}">×</button><small>${item.name}</small>`;
    board.appendChild(node);
  });
  $$('.board-piece button', board).forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation(); removeFromBoard(button.parentElement.dataset.boardId); renderWardrobe(); renderBoard();
  }));
  enableBoardDrag();
  updateTryonSummary();
}

function enableBoardDrag() {
  $$('.board-piece').forEach((piece) => {
    piece.addEventListener("pointerdown", (event) => {
      if (event.target.tagName === "BUTTON") return;
      const board = $("#outfitBoard");
      const rect = board.getBoundingClientRect();
      piece.setPointerCapture(event.pointerId);
      const move = (moveEvent) => {
        const x = Math.max(0, Math.min(78, ((moveEvent.clientX - rect.left - piece.offsetWidth / 2) / rect.width) * 100));
        const y = Math.max(0, Math.min(72, ((moveEvent.clientY - rect.top - piece.offsetHeight / 2) / rect.height) * 100));
        piece.style.left = `${x}%`; piece.style.top = `${y}%`;
        state.boardPositions[piece.dataset.boardId] = { x, y };
      };
      const end = () => { piece.removeEventListener("pointermove", move); piece.removeEventListener("pointerup", end); };
      piece.addEventListener("pointermove", move); piece.addEventListener("pointerup", end);
    });
  });
}

function readImageFile(file, done) {
  if (!file?.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => done(reader.result);
  reader.readAsDataURL(file);
}

function createGarmentCutout(imageUrl, done) {
  const image = new Image();
  image.onload = () => {
    const max = 900, scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas"); canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d", { willReadFrequently: true }); context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height), data = pixels.data;
    const samples = [[2,2],[canvas.width-3,2],[2,canvas.height-3],[canvas.width-3,canvas.height-3]].map(([x,y]) => { const i=(y*canvas.width+x)*4; return [data[i],data[i+1],data[i+2]]; });
    const bg = samples.reduce((sum, color) => sum.map((value, i) => value + color[i] / samples.length), [0,0,0]);
    for (let i=0;i<data.length;i+=4) { const distance = Math.hypot(data[i]-bg[0],data[i+1]-bg[1],data[i+2]-bg[2]); if (distance < 28) data[i+3]=0; else if (distance < 62) data[i+3]=Math.round(data[i+3]*(distance-28)/34); }
    context.putImageData(pixels,0,0); done(canvas.toDataURL("image/png"));
  };
  image.src = imageUrl;
}

function addUploadedGarment(file) {
  readImageFile(file, (image) => {
    const dialog = $("#garmentDialog"); $("#garmentOriginal").src = image; $("#garmentGenerated").hidden = true; $("#garmentProcessing").hidden = false; $("#garmentForm").hidden = true; $("#garmentDialogTitle").textContent = "正在识别这件衣物"; dialog.dataset.image = ""; dialog.showModal();
    setTimeout(() => createGarmentCutout(image, (generated) => { dialog.dataset.image = generated; $("#garmentGenerated").src = generated; $("#garmentGenerated").hidden = false; $("#garmentProcessing").hidden = true; $("#garmentForm").hidden = false; $("#garmentDialogTitle").textContent = "确认 AI 整理结果"; }), 650);
  });
}

function saveUploadedGarment(event) {
  event.preventDefault(); const dialog = $("#garmentDialog"), name = $("#garmentName").value.trim() || "我的新单品", category = $("#garmentCategory").value;
  state.closet.unshift({ id: `upload-${Date.now()}`, name, category, image: dialog.dataset.image || $("#garmentOriginal").src, note: "本地 AI 整理 · 用户确认", color: "待补充", season: "四季", match: 87, data: "用户上传 · 本机保存" });
  try { localStorage.setItem("ziru-demo-custom-closet", JSON.stringify(state.closet.filter((item) => item.id.startsWith("upload-")))); } catch {}
  dialog.close(); $("#garmentFile").value = ""; $("#wardrobeStatus").textContent = `“${name}”已整理并加入衣橱，可以直接用于 DIY 搭配。`; renderWardrobe(); showToast("新单品已加入衣橱");
}

function autoCompose() {
  state.boardPositions = {};
  renderBoard();
  showToast("已按上装、下装和鞋履重新排版");
}

function saveOutfit() {
  if (!state.board.length) return showToast("先从衣橱选择至少一件衣物");
  const saved = { id: Date.now(), items: [...state.board], date: new Date().toLocaleDateString("zh-CN") };
  state.savedOutfits.unshift(saved);
  try { localStorage.setItem("ziru-demo-outfits", JSON.stringify(state.savedOutfits)); } catch {}
  renderSavedOutfits();
  showToast("这套搭配已保存");
}

function renderSavedOutfits() {
  $("#savedOutfits").innerHTML = state.savedOutfits.length ? `<div class="section-heading"><h2>已保存的搭配</h2></div>${state.savedOutfits.slice(0, 3).map((look) => `<article class="saved-look"><span>${look.items.map((id) => { const item = safeProduct(id); return item ? `<img src="${item.image}" alt="">` : ""; }).join("")}</span><div><b>${look.date} 的搭配</b><small>${look.items.length} 件衣物</small></div></article>`).join("")}` : "";
}

function runAgent() {
  const prompt = $("#agentPrompt").value.trim();
  const reply = $("#agentReply");
  if (!prompt) return showToast("先告诉自如你想达到什么效果");
  reply.hidden = false;
  reply.innerHTML = `<span>演示回答</span><b>我会先从你的衣橱选择清爽上衣、直筒裤和浅色鞋。</b><p>考虑了“通勤、利落、不过分正式”三个条件。当前使用模拟理解和衣橱数据；后续 Agent 会调用真实天气、个人偏好和搭配规则。</p><button id="openAgentLook" class="secondary-button">打开这套搭配</button>`;
  $("#openAgentLook").addEventListener("click", () => showView("wardrobe"));
}

function renderSelectedProduct() {
  const product = state.product;
  $("#selectedProduct").innerHTML = `<div class="selected-product">${productArt(product)}<div><p class="eyebrow">正在分析</p><h2>${product.name}</h2><p>${product.note}</p>${productTags(product)}</div></div>`;
  $("#fitHeight").value = state.profile.height; $("#fitWeight").value = state.profile.weight;
  $("#fitChest").value = state.profile.chest || ""; $("#fitShoulder").value = state.profile.shoulder || "";
  $("#fitSizeRows").innerHTML = (product.sizes || fallbackSizes).map((row) => `<tr><td><b>${row.size}</b></td><td>${row.shoulder}</td><td>${row.chest}</td><td>${row.length}</td></tr>`).join("");
}

const easeTargets = {
  slim: { label: "修身", range: [0, 4], description: "轮廓较清楚，胸身余量较少；更依赖准确围度和面料弹性。" },
  regular: { label: "合体", range: [4, 8], description: "肩线接近自然肩点，胸身留有正常活动空间，衣长不过分放大身体。" },
  relaxed: { label: "微宽松", range: [8, 12], description: "肩部和胸身略有余量，仍能看出身体轮廓，适合日常穿着。" },
  loose: { label: "日常宽松", range: [12, 18], description: "落肩和胸身余量更明显，但衣长与袖长仍保持日常比例。" },
  oversized: { label: "Oversize", range: [18, 26], description: "强调落肩、宽衣身和更大的整体量感，可能同时增加衣长与袖长。" }
};

function selectFit(type) {
  state.fit = type;
  $$('[data-fit]').forEach((item) => item.classList.toggle("active", item.dataset.fit === type));
  const target = easeTargets[type];
  $("#fitGoalDescription").textContent = `${target.label}：${target.description}`;
}

function calculateFit() {
  const height = Number($("#fitHeight").value), weight = Number($("#fitWeight").value);
  const chest = Number($("#fitChest").value) || null, shoulder = Number($("#fitShoulder").value) || null;
  if (height < 130 || height > 220 || weight < 30 || weight > 200) { $("#fitError").textContent = "请检查身高和体重是否在合理范围内。"; return; }
  $("#fitError").textContent = ""; state.profile = { ...state.profile, height, weight, chest, shoulder };
  const sizes = state.product.sizes || fallbackSizes, target = easeTargets[state.fit], center = (target.range[0] + target.range[1]) / 2;
  const ranked = sizes.map((row) => ({ ...row, ease: chest ? row.chest - chest : null }));
  if (chest) ranked.sort((a, b) => Math.abs(a.ease - center) - Math.abs(b.ease - center));
  const primary = chest ? ranked[0] : sizes[1] || sizes[0];
  state.result = { primary, alternative: chest ? ranked[1] : sizes[2] || sizes[0], target, chest, shoulder, height, reliable: Boolean(chest), shoulderDelta: shoulder ? primary.shoulder - shoulder : null, lengthRatio: primary.length / height };
  renderResult(); saveProfile(); showView("result");
}

function relationText(value, low, high) { if (value === null) return "数据不足"; if (value < low) return "偏紧"; if (value > high) return "偏宽松"; return "接近目标"; }

function renderResult() {
  const result = state.result, product = state.product, unique = result.reliable;
  $("#resultTitle").textContent = unique ? `预计呈现“${result.target.label}”` : "暂时只能给出效果范围";
  $("#resultSubtitle").textContent = unique ? `${product.name} · 为接近这个效果，可优先试 ${result.primary.size} 码。` : `缺少可靠胸围，${result.primary.size} / ${result.alternative.size} 只能作为两个试穿候选。`;
  $("#resultHero").innerHTML = unique ? `<p class="eyebrow">目标穿着效果</p><div class="result-effect">${result.target.label}</div><h2>肩部、胸身和衣长共同决定最终轮廓</h2><p>${result.target.description}</p><span class="confidence">尺码建议：${result.primary.size} · 可信度：中</span>` : `<p class="eyebrow">预计效果范围</p><div class="result-effect">${result.target.label}</div><h2>身体数据不足，暂不把某个尺码说成确定答案</h2><p>${result.target.description}</p><span class="confidence">候选尺码：${result.primary.size} / ${result.alternative.size} · 可信度：低</span>`;
  const delta = result.shoulderDelta;
  const dimensions = [
    ["胸围松量", result.chest ? relationText(result.primary.ease, result.target.range[0], result.target.range[1]) : "无法判断", result.chest ? `${result.primary.chest} − ${result.chest} = ${result.primary.ease.toFixed(1)} cm。` : "请手工填写胸围后再计算。"],
    ["肩线关系", delta === null ? "无法判断" : delta > 12 ? "明显落肩" : delta > 7 ? "轻至中度落肩" : "接近正肩", delta === null ? "未填写人体肩宽。" : `成衣肩宽比人体参考肩宽大 ${delta.toFixed(1)} cm。`],
    ["衣长关系", result.lengthRatio > .42 ? "衣身偏长" : "常规衣长", `衣长 ${result.primary.length} cm，约为身高的 ${(result.lengthRatio * 100).toFixed(1)}%。`],
    ["备选方案", `${result.alternative.size} 码`, "希望改变宽松程度时，可以作为试穿备选。"]
  ];
  $("#fitDimensions").innerHTML = dimensions.map(([name, value, detail]) => `<article class="dimension-card"><b>${name}</b><b>${value}</b><p>${detail}</p></article>`).join("");
}

function updateTryonSummary() {
  const count = state.board.length;
  $("#tryonOutfitCount").textContent = count ? `当前已选 ${count} 件衣物` : "尚未选择衣物";
}

function useSavedIdentityForTryon() {
  const image = state.avatarPhoto || state.basePhoto;
  if (!image || state.personPhoto) return;
  state.personPhoto = image;
  $("#selectPersonPhoto").querySelector("span").textContent = "✓";
  $("#selectPersonPhoto").querySelector("small").textContent = state.avatarPhoto ? "已使用我的二维基础形象" : "已使用我的标准全身照";
  $("#tryonCanvas").innerHTML = `<img class="tryon-person-photo" src="${image}" alt="我的基础形象"><p>已从外形档案载入</p>`;
}

function loadPersonPhoto(file) {
  readImageFile(file, (image) => {
    state.personPhoto = image;
    $("#selectPersonPhoto").querySelector("span").textContent = "✓";
    $("#selectPersonPhoto").querySelector("small").textContent = "本人照片已在本机载入";
    $("#tryonCanvas").innerHTML = `<img class="tryon-person-photo" src="${image}" alt="用户选择的本人照片"><p>照片已准备</p>`;
  });
}

function runTryon() {
  clearTimeout(state.tryonTimer);
  if (!state.board.length) return showToast("请先在衣橱选择一套衣服");
  const button = $("#runTryon"), job = $("#tryonJob"), canvas = $("#tryonCanvas");
  button.disabled = true; job.className = "job-card running";
  job.querySelector("b").textContent = "正在分析人物与当前搭配";
  job.querySelector("p").textContent = "Mock job_001 · 模拟排队和成本确认";
  canvas.classList.remove("ready");
  state.tryonTimer = setTimeout(() => {
    job.querySelector("b").textContent = "正在生成视觉参考";
    job.querySelector("p").textContent = "正式版将在这里调用真人换装服务。";
    state.tryonTimer = setTimeout(() => {
      button.disabled = false; job.className = "job-card"; job.querySelector("b").textContent = "演示结果已生成";
      job.querySelector("p").textContent = "这是交互模拟，不代表已经完成真实换装。"; canvas.classList.add("ready");
      canvas.querySelector("p").textContent = "当前搭配 · 上身效果演示完成";
    }, 1000);
  }, 700);
}

const hairReferences = {
  short: ["轻盈短层次", "露出颈肩线，适合圆领、方领与利落通勤风。"],
  curly: ["蓬松纹理卷", "增加头顶和两侧发量，搭配简洁领口会更平衡。"],
  long: ["长层次直发", "面部两侧的层次可以柔化轮廓，视觉线条更舒展。"],
  red: ["暖栗红短发", "暖色发色会把焦点拉向面部，衣着适合降低饱和度。"]
};
const faceReferences = {
  tone: ["中性偏暖 · 低对比", "雾霾蓝、鼠尾草绿和柔白靠近面部时更协调；避免大面积荧光色。"],
  skin: ["本周状态稳定", "水润感 82、均匀度 74。建议继续保持当前作息，并在相同光线下每周记录。"],
  brow: ["柔和直眉 · 轻量镜框", "平缓眉峰能保持自然感；细金属或半透明镜框比厚重黑框更轻盈。"]
};
const postureReferences = {
  head: ["头颈位置 · 模拟观察", "未来通过规范正侧面照片或短视频，观察头部是否前伸或左右偏斜；只提供日常改善提示，不作医疗诊断。"],
  shoulder: ["肩背状态 · 模拟观察", "观察圆肩倾向、左右肩高度和肩胛区域的对称性；拍摄姿势或衣服遮挡会影响结果。"],
  trunk: ["躯干状态 · 模拟观察", "观察躯干是否侧倾或存在明显左右旋转，并区分暂时站姿与持续习惯。"],
  pelvis: ["骨盆状态 · 模拟观察", "观察骨盆前后倾和左右高低趋势；单张正面照片无法给出可靠结论。"],
  legs: ["下肢站姿 · 模拟观察", "观察膝盖方向、双腿对称性和站立受力趋势，不进行骨骼或关节诊断。"],
  gait: ["动态步态 · 模拟观察", "通过短视频观察步幅、摆臂、左右重心和身体晃动，并记录长期变化。"]
};

function showReference(type) {
  $$('[data-reference]').forEach((button) => button.classList.toggle("active", button.dataset.reference === type));
  $$('[data-reference-panel]').forEach((panel) => panel.classList.toggle("active", panel.dataset.referencePanel === type));
  if (type === "shape") renderShapeOverview();
}
function selectHair(type) { $$('[data-hair]').forEach((button) => button.classList.toggle("active", button.dataset.hair === type)); const [title, text] = hairReferences[type]; $("#hairResult > div > b").textContent = title; $("#hairResult p").textContent = text; }
function selectFace(type) { $$('[data-face]').forEach((button) => button.classList.toggle("active", button.dataset.face === type)); const [title, text] = faceReferences[type]; $("#faceResult > div > b").textContent = title; $("#faceResult p").textContent = text; }

function renderShapeOverview() {
  const a = state.bodyAnalysis;
  const values = a ? [["头身比例", a.headRatio], ["上半身比例", a.upperRatio], ["下半身比例", a.legRatio], ["视觉肩宽", a.shoulderRatio]] : [["头身比例", "待拍摄"], ["上下身比例", "待拍摄"], ["肩胯结构", "待补充"], ["整体轮廓", "待建立"]];
  $("#shapeMetricGrid").innerHTML = values.map(([name, value]) => `<div><small>${name}</small><b>${value}</b></div>`).join("");
}

function selectPosture(type) {
  $$('[data-posture]').forEach((button) => button.classList.toggle("active", button.dataset.posture === type));
  const [title, text] = postureReferences[type];
  $("#postureResult b").textContent = title;
  $("#postureResult p").textContent = text;
}

function saveProfile() {
  try {
    localStorage.setItem("ziru-demo-profile", JSON.stringify(state.profile));
    localStorage.setItem("ziru-demo-body-analysis", JSON.stringify(state.bodyAnalysis));
    if (state.basePhoto) localStorage.setItem("ziru-demo-base-photo", state.basePhoto);
    if (state.avatarPhoto) localStorage.setItem("ziru-demo-avatar-photo", state.avatarPhoto);
  } catch { showToast("本机存储空间不足，照片只保留到本次页面关闭"); }
}
function loadProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem("ziru-demo-profile"));
    if (saved && typeof saved === "object") {
      state.profile = saved.version === 2 ? { ...state.profile, ...saved } : { ...state.profile, height: saved.height || state.profile.height, weight: saved.weight || state.profile.weight };
    }
    const outfits = JSON.parse(localStorage.getItem("ziru-demo-outfits")); if (Array.isArray(outfits)) state.savedOutfits = outfits;
    const customCloset = JSON.parse(localStorage.getItem("ziru-demo-custom-closet")); if (Array.isArray(customCloset)) state.closet = [...customCloset, ...products];
    state.bodyAnalysis = JSON.parse(localStorage.getItem("ziru-demo-body-analysis")) || null;
    state.basePhoto = localStorage.getItem("ziru-demo-base-photo"); state.avatarPhoto = localStorage.getItem("ziru-demo-avatar-photo");
  } catch {}
  const mapping = { Height: "height", Weight: "weight", Age: "age", Chest: "chest", Shoulder: "shoulder", Waist: "waist", Hip: "hip", Arm: "arm", Inseam: "inseam", Foot: "foot", Forefoot: "forefoot" };
  Object.entries(mapping).forEach(([suffix, key]) => { $("#profile" + suffix).value = state.profile[key] || ""; });
  $("#profileSystem").value = state.profile.system || "unisex";
  renderSavedOutfits(); renderProfileOverview();
}
function submitProfile(event) {
  event.preventDefault(); const field = (name) => Number($("#profile" + name).value) || null;
  state.profile = { version: 2, height: field("Height"), weight: field("Weight"), age: field("Age"), system: $("#profileSystem").value, chest: field("Chest"), shoulder: field("Shoulder"), waist: field("Waist"), hip: field("Hip"), arm: field("Arm"), inseam: field("Inseam"), foot: field("Foot"), forefoot: field("Forefoot"), createdAt: state.profile.createdAt || new Date().toISOString() };
  saveProfile(); renderProfileOverview(); showProfileStep("guide");
}

function showProfileStep(step) {
  const ids = { overview: "profileOverview", setup: "profileForm", guide: "profileGuide", capture: "profileCapture", analysis: "profileAnalysis" };
  $$(".profile-step").forEach((panel) => panel.classList.toggle("active", panel.id === ids[step]));
  if (step !== "capture") stopCamera();
  if (step === "capture") {
    $("#cameraVideo").hidden = true; $("#cameraCanvas").hidden = true; $("#coachOverlay").hidden = true; $("#bodyGuide").hidden = true; $("#levelGauge").hidden = true; $("#coachInstruction").hidden = true; $("#coachChecks").hidden = true; $("#capturePhoto").hidden = true; $("#cameraPlaceholder").hidden = false; $("#cameraModeBadge").textContent = "未启动"; $("#cameraMessage").textContent = "照片只保存在当前浏览器；视觉提示不是苹果 LiDAR 测距。";
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function profileSystemLabel(value) { return value === "mens" ? "男装" : value === "womens" ? "女装" : "中性款"; }
function renderProfileOverview() {
  const p = state.profile, image = state.avatarPhoto || state.basePhoto;
  $("#profileSummaryGrid").innerHTML = [["身高", p.height ? `${p.height} cm` : "未填写"], ["体重", p.weight ? `${p.weight} kg` : "未填写"], ["常购体系", profileSystemLabel(p.system)], ["进阶数据", [p.shoulder,p.chest,p.waist,p.hip,p.arm,p.inseam,p.foot,p.forefoot].filter(Boolean).length ? "已补充" : "均为选填"]].map(([key,value]) => `<div><small>${key}</small><b>${value}</b></div>`).join("");
  $("#bodyProfileState").textContent = state.bodyAnalysis ? `${state.bodyAnalysis.headRatio} · 腿部约占 ${state.bodyAnalysis.legRatio}` : "还没有照片分析";
  $("#bodyProfileHint").textContent = state.bodyAnalysis ? `拍摄质量：${state.bodyAnalysis.quality}。原图用于比例判断，生成图不参与测量。` : "正面照只估算可见比例，胸围、腰围和臀围仍以手工测量为准。";
  $("#createBodyProfile").textContent = state.bodyAnalysis ? "重新拍摄并更新" : "拍照建立身体档案";
  [["#profileAvatarImage", "#profileAvatarPlaceholder"], ["#homeAvatarImage", "#homeAvatarPlaceholder"]].forEach(([imageId, placeholderId]) => { const imageNode = $(imageId); imageNode.hidden = !image; $(placeholderId).hidden = Boolean(image); if (image) imageNode.src = image; });
  $("#profileOverviewTitle").textContent = state.avatarPhoto ? "二维基础形象已导入" : state.basePhoto ? "标准照片已保存，待生成二维形象" : "从一张规范照片开始";
  $("#profileOverviewText").textContent = state.avatarPhoto ? "这张形象用于首页展示和后续换衣服；测量仍使用原始照片。" : state.basePhoto ? "下载原图交给 Codex 处理，再把生成图导回即可。" : "完成后会得到身体比例档案，并可导入 Codex 生成的二维形象。";
  $("#homeIdentityCard").classList.toggle("empty", !image);
  $("#homeIdentityTitle").textContent = state.avatarPhoto ? "我的二维基础形象" : state.basePhoto ? "基础照片已建立" : "还没有建立外形档案";
  $("#homeIdentityText").textContent = state.bodyAnalysis ? `${p.height || "—"} cm · ${state.bodyAnalysis.headRatio} · 下半身约 ${state.bodyAnalysis.legRatio}` : "拍摄一张标准正面全身照，建立身体比例和后续换衣服使用的基础形象。";
  $("#homeProfileAction").textContent = image ? "查看档案" : "开始建立";
}

function compactCanvasData(canvas) {
  const width = Math.min(720, canvas.width), scale = width / canvas.width, height = Math.round(canvas.height * scale);
  const output = document.createElement("canvas"); output.width = width; output.height = height; output.getContext("2d").drawImage(canvas, 0, 0, width, height);
  return output.toDataURL("image/jpeg", .82);
}

function buildBodyAnalysis(result, width, height) {
  if (!result?.detected || !result.points) return { headRatio: "未识别", shoulderRatio: "未识别", upperRatio: "未识别", legRatio: "未识别", shoulderSlope: "未识别", quality: "需要重拍", confidence: "低" };
  const p = result.points, bodyPx = Math.max(1, result.bodyRatio * height), shoulderMidY = (p[11].y + p[12].y) / 2, hipMidY = (p[23].y + p[24].y) / 2;
  const headPx = Math.max(bodyPx * .105, (shoulderMidY - result.headY) * height * .88);
  const shoulderPx = Math.abs(p[11].x - p[12].x) * width;
  const headCount = Math.max(5.5, Math.min(9, bodyPx / headPx));
  const upper = Math.max(0, Math.min(1, (hipMidY - result.headY) * height / bodyPx));
  const leg = Math.max(0, Math.min(1, (result.footY - hipMidY) * height / bodyPx));
  const rawSlope = Math.abs(Math.atan2((p[12].y - p[11].y) * height, (p[12].x - p[11].x) * width) * 180 / Math.PI);
  const slope = Math.min(rawSlope, 180 - rawSlope);
  const estimates = window.BodyEstimator?.estimateBodyDimensions({ points: p, width, height, headY: result.headY, footY: result.footY, knownHeightCm: state.profile.height, capture: result }) || null;
  return { headRatio: `约 ${headCount.toFixed(1)} 头身`, shoulderRatio: `身高画面的 ${(shoulderPx / bodyPx * 100).toFixed(1)}%`, upperRatio: `${(upper * 100).toFixed(0)}%`, legRatio: `${(leg * 100).toFixed(0)}%`, shoulderSlope: slope < 3 ? "基本水平" : slope < 7 ? "轻微高低差" : "建议复核站姿", quality: result.ready ? "标准" : result.fullBody && result.distance ? "可用，建议复核" : "条件不足", confidence: estimates?.confidence || (result.fullBody && result.distance ? "中" : "低"), estimates };
}

function renderBodyAnalysis() {
  const a = state.bodyAnalysis;
  const range = (measurement) => measurement ? `${measurement.intervalCm[0]}–${measurement.intervalCm[1]} cm` : "关键点不足";
  const estimates = a.estimates?.measurements || {};
  $("#bodyMetrics").innerHTML = [["头身比例",a.headRatio],["姿态肩点跨度",range(estimates.poseShoulderSpan)],["投影臂长",range(estimates.projectedArmLength)],["投影腿长",range(estimates.projectedLegLength)],["肩线状态",a.shoulderSlope],["结果可信度",a.confidence]].map(([key,value]) => `<article><small>${key}</small><b>${value}</b></article>`).join("");
  const note = $("#measurementEstimateNote");
  if (note) note.textContent = a.estimates ? `按已知身高 ${a.estimates.knownHeightCm} cm 做二维标定。区间不是统计置信区间，体重不参与长度推算；胸围、腰围仍需手工测量。` : "未得到完整姿态关键点，暂不生成厘米估算。";
  $("#analysisPhoto").src = state.basePhoto;
}

function completeBodyCapture(canvas, result) {
  state.basePhoto = compactCanvasData(canvas); state.bodyAnalysis = buildBodyAnalysis(result, canvas.width, canvas.height);
  if (!state.profile.createdAt) state.profile.createdAt = new Date().toISOString();
  saveProfile(); renderBodyAnalysis(); renderProfileOverview(); showProfileStep("analysis");
}

function makeCaptureCoach() {
  return window.createCaptureCoach?.({ video: $("#cameraVideo"), overlay: $("#coachOverlay"), checks: $("#coachChecks"), instruction: $("#coachInstruction"), badge: $("#cameraModeBadge"), levelBubble: $("#levelBubble"), captureButton: $("#capturePhoto") }) || null;
}

async function openCamera() {
  const message = $("#cameraMessage");
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) { message.textContent = "浏览器相机需要 HTTPS；你仍可使用系统相册或相机上传。"; return; }
  stopCamera(); message.textContent = "正在请求相机和姿态传感器权限…";
  try {
    if (window.createCaptureCoach) {
      state.captureCoach = makeCaptureCoach();
      state.captureCoach.prepareSensors();
    }
    state.stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 1920 } } });
    const video = $("#cameraVideo"); video.srcObject = state.stream; await video.play(); video.hidden = false; $("#cameraPlaceholder").hidden = true; $("#cameraCanvas").hidden = true; $("#capturePhoto").hidden = false; $("#capturePhoto").disabled = false; $("#bodyGuide").hidden = false; $("#levelGauge").hidden = false;
    if (state.captureCoach) {
      message.textContent = "相机已开启，正在下载端侧识别模型（首次约需数秒）…";
      try { await state.captureCoach.start(); message.textContent = "按画面提示调整；也可以忽略实验提示直接拍摄。"; }
      catch { $("#cameraModeBadge").textContent = "普通拍照"; $("#capturePhoto").disabled = false; $("#coachInstruction").hidden = false; $("#coachInstruction").textContent = "识别模型加载失败，请人工确认头脚完整入镜"; message.textContent = "已降级为普通拍照，仍可继续保存照片。"; }
    } else {
      $("#cameraModeBadge").textContent = "普通拍照"; $("#capturePhoto").disabled = false; message.textContent = "实时识别模块未就绪，已降级为普通拍照。";
    }
  } catch (error) { message.textContent = error?.name === "NotAllowedError" ? "未获得相机权限，可改用相册选择。" : "相机不可用或正被其他程序占用。"; }
}
function stopCamera() { state.captureCoach?.stop(); state.captureCoach = null; state.stream?.getTracks().forEach((track) => track.stop()); state.stream = null; }
function capturePhoto() { const video = $("#cameraVideo"); if (!video.videoWidth) return; const result = state.captureCoach?.getAnalysis(); const canvas = $("#cameraCanvas"); canvas.width = video.videoWidth; canvas.height = video.videoHeight; canvas.getContext("2d").drawImage(video, 0, 0); stopCamera(); completeBodyCapture(canvas, result); }
function loadPhoto(file, canvasSelector, placeholderSelector, messageSelector) { readImageFile(file, (dataUrl) => { const image = new Image(); image.onload = () => { const canvas = $(canvasSelector), scale = Math.min(1, 1200 / image.naturalWidth); canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale); canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height); canvas.hidden = false; $(placeholderSelector).hidden = true; if (messageSelector) $(messageSelector).textContent = "图片已载入本机内存，刷新页面后清除。"; }; image.src = dataUrl; }); }

function loadBodyPhoto(file) {
  readImageFile(file, (dataUrl) => {
    const image = new Image();
    image.onload = async () => {
      const canvas = $("#cameraCanvas"), scale = Math.min(1, 1200 / image.naturalWidth); canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale); canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      $("#cameraMessage").textContent = "正在设备端分析照片…";
      let result = null;
      try { state.captureCoach = makeCaptureCoach(); result = await state.captureCoach?.analyzeStill(canvas); }
      catch { showToast("人体模型未能完成分析，照片仍会保存"); }
      stopCamera(); completeBodyCapture(canvas, result);
    };
    image.src = dataUrl;
  });
}

function downloadBodyPhoto() {
  if (!state.basePhoto) return showToast("请先拍摄标准全身照");
  const link = document.createElement("a"); link.href = state.basePhoto; link.download = `自如-二维形象原图-${new Date().toISOString().slice(0,10)}.jpg`; link.click();
}

function importAvatar(file) {
  readImageFile(file, (image) => { state.avatarPhoto = image; saveProfile(); renderProfileOverview(); $("#analysisPhoto").src = image; showToast("二维基础形象已导入并显示到首页"); });
}

let toastTimer;
function showToast(message) { const toast = $("#toast"); toast.textContent = message; toast.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2600); }

function bindEvents() {
  $$('[data-view]').forEach((button) => button.addEventListener("click", () => { showView(button.dataset.view); if (button.dataset.referenceJump) showReference(button.dataset.referenceJump); }));
  $("#demoInfo").addEventListener("click", () => $("#infoDialog").showModal()); $(".dialog-close").addEventListener("click", () => $("#infoDialog").close()); $("#infoDialog").addEventListener("click", (event) => { if (event.target === $("#infoDialog")) $("#infoDialog").close(); });
  $("#runAgent").addEventListener("click", runAgent); $("#agentPrompt").addEventListener("keydown", (event) => { if (event.key === "Enter") runAgent(); });
  $("#uploadGarment").addEventListener("click", () => $("#garmentFile").click()); $("#scanGarment").addEventListener("click", () => $("#garmentFile").click()); $("#garmentFile").addEventListener("change", (event) => addUploadedGarment(event.target.files[0]));
  $("#closeGarmentDialog").addEventListener("click", () => $("#garmentDialog").close()); $("#garmentForm").addEventListener("submit", saveUploadedGarment);
  $("#loadDemoCloset").addEventListener("click", () => { state.closet = [...products]; localStorage.removeItem("ziru-demo-custom-closet"); $("#wardrobeStatus").textContent = "已恢复 12 件统一示例单品，可直接点选组合。"; renderWardrobe(); });
  $$('[data-closet-category]').forEach((button) => button.addEventListener("click", () => { state.closetCategory = button.dataset.closetCategory; $$('[data-closet-category]').forEach((item) => item.classList.toggle("active", item === button)); renderWardrobe(); }));
  $("#clearBoard").addEventListener("click", () => { state.board = []; state.boardPositions = {}; renderWardrobe(); renderBoard(); }); $("#autoCompose").addEventListener("click", autoCompose); $("#saveOutfit").addEventListener("click", saveOutfit); $("#boardTryon").addEventListener("click", () => showView("tryon"));
  $("#uploadProduct").addEventListener("click", () => $("#productFile").click()); $("#productFile").addEventListener("change", (event) => { const file = event.target.files[0]; if (!file) return; readImageFile(file, (image) => { $("#uploadStatus").textContent = "商品图片已读取。尺码表识别当前为模拟，请确认样例数据。"; state.product = { ...products[0], id: "user-product", name: "我上传的短袖商品", image, note: "本地图片 · OCR 为 Demo 模拟" }; showView("fit"); }); });
  $("#browsePartners").addEventListener("click", () => $("#productList").scrollIntoView({ behavior: "smooth" }));
  $$('[data-category]').forEach((button) => button.addEventListener("click", () => { $$('[data-category]').forEach((item) => item.classList.toggle("active", item === button)); renderProducts(button.dataset.category); }));
  $$('[data-fit]').forEach((button) => button.addEventListener("click", () => selectFit(button.dataset.fit)));
  $("#calculateFit").addEventListener("click", calculateFit); $("#generateTryon").addEventListener("click", () => showView("tryon")); $("#addToCloset").addEventListener("click", () => { if (!state.closet.some((item) => item.id === state.product.id)) state.closet.unshift(state.product); addToBoard(state.product.id); showToast("已加入衣橱"); showView("wardrobe"); });
  $("#selectPersonPhoto").addEventListener("click", () => $("#personPhoto").click()); $("#personPhoto").addEventListener("change", (event) => loadPersonPhoto(event.target.files[0])); $("#runTryon").addEventListener("click", runTryon);
  $$('[data-reference]').forEach((button) => button.addEventListener("click", () => showReference(button.dataset.reference))); $$('[data-hair]').forEach((button) => button.addEventListener("click", () => selectHair(button.dataset.hair))); $$('[data-face]').forEach((button) => button.addEventListener("click", () => selectFace(button.dataset.face))); $$('[data-posture]').forEach((button) => button.addEventListener("click", () => selectPosture(button.dataset.posture)));
  $("#hairResult button").addEventListener("click", () => showToast("已记录所选参考；正式版将在这里调用人物换发模型。"));
  $("#uploadHair").addEventListener("click", () => $("#hairPhoto").click()); $("#hairPhoto").addEventListener("change", (event) => { if (!event.target.files[0]) return; showToast("正面照已读取，已可用于发型模拟流程"); $("#uploadHair").textContent = "照片已准备"; });
  $("#profileForm").addEventListener("submit", submitProfile); $("#editProfile").addEventListener("click", () => showProfileStep("setup")); $("#createBodyProfile").addEventListener("click", () => showProfileStep("setup")); $("#startCapture").addEventListener("click", () => showProfileStep("capture")); $$('[data-profile-step]').forEach((button) => button.addEventListener("click", () => showProfileStep(button.dataset.profileStep)));
  $("#openCamera").addEventListener("click", openCamera); $("#capturePhoto").addEventListener("click", capturePhoto); $("#bodyPhoto").addEventListener("change", (event) => loadBodyPhoto(event.target.files[0])); $("#downloadBodyPhoto").addEventListener("click", downloadBodyPhoto); $("#avatarFile").addEventListener("change", (event) => importAvatar(event.target.files[0])); $("#finishProfile").addEventListener("click", () => { renderProfileOverview(); showProfileStep("overview"); }); window.addEventListener("pagehide", stopCamera);
}

renderProducts(); loadProfile(); renderWardrobe(); renderBoard(); renderShapeOverview(); bindEvents();
