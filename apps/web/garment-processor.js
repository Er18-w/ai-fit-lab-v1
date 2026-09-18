(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.GarmentProcessor = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  const clamp = (value, low = 0, high = 255) => Math.max(low, Math.min(high, value));

  function analyzeImageQuality({ data, width, height }) {
    if (!data?.length || !width || !height) throw new Error("invalid_image_data");
    let luminance = 0;
    let squared = 0;
    let samples = 0;
    const stride = Math.max(4, Math.floor(data.length / 12000 / 4) * 4);
    for (let index = 0; index < data.length; index += stride) {
      const value = data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722;
      luminance += value;
      squared += value * value;
      samples += 1;
    }
    const brightness = luminance / samples;
    const contrast = Math.sqrt(Math.max(0, squared / samples - brightness * brightness));
    const warnings = [];
    if (Math.min(width, height) < 320) warnings.push("图片分辨率偏低，衣物边缘可能不完整");
    if (brightness < 72) warnings.push("图片偏暗，已进行基础提亮");
    if (brightness > 225) warnings.push("图片可能过曝，浅色衣物边缘需要确认");
    if (contrast < 20) warnings.push("衣物与背景对比不足，建议换纯色背景重拍");
    return {
      accepted: Math.min(width, height) >= 240 && brightness >= 32 && brightness <= 245 && contrast >= 10,
      brightness: Math.round(brightness),
      contrast: Math.round(contrast),
      resolution: `${width}×${height}`,
      warnings
    };
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("read_failed"));
      reader.readAsDataURL(file);
    });
  }

  function readBlob(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("read_failed"));
      reader.readAsDataURL(blob);
    });
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("decode_failed"));
      image.src = url;
    });
  }

  function prepareCanvas(image) {
    const max = 1200;
    const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d", { willReadFrequently: true }).drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function enhanceCanvas(canvas, quality) {
    const output = document.createElement("canvas");
    output.width = canvas.width;
    output.height = canvas.height;
    const context = output.getContext("2d", { willReadFrequently: true });
    context.drawImage(canvas, 0, 0);
    if (quality.brightness >= 90) return output;
    const pixels = context.getImageData(0, 0, output.width, output.height);
    const factor = Math.min(1.7, 108 / Math.max(quality.brightness, 1));
    for (let index = 0; index < pixels.data.length; index += 4) {
      pixels.data[index] = clamp((pixels.data[index] - 8) * factor + 8);
      pixels.data[index + 1] = clamp((pixels.data[index + 1] - 8) * factor + 8);
      pixels.data[index + 2] = clamp((pixels.data[index + 2] - 8) * factor + 8);
    }
    context.putImageData(pixels, 0, 0);
    return output;
  }

  function createFallbackCutout(canvas) {
    const output = document.createElement("canvas");
    output.width = canvas.width;
    output.height = canvas.height;
    const context = output.getContext("2d", { willReadFrequently: true });
    context.drawImage(canvas, 0, 0);
    const pixels = context.getImageData(0, 0, output.width, output.height);
    const data = pixels.data;
    const points = [[2, 2], [output.width - 3, 2], [2, output.height - 3], [output.width - 3, output.height - 3]];
    const background = points.reduce((sum, [x, y]) => {
      const index = (y * output.width + x) * 4;
      return sum.map((value, channel) => value + data[index + channel] / points.length);
    }, [0, 0, 0]);
    for (let index = 0; index < data.length; index += 4) {
      const distance = Math.hypot(data[index] - background[0], data[index + 1] - background[1], data[index + 2] - background[2]);
      if (distance < 28) data[index + 3] = 0;
      else if (distance < 62) data[index + 3] = Math.round(data[index + 3] * (distance - 28) / 34);
    }
    context.putImageData(pixels, 0, 0);
    return output.toDataURL("image/png");
  }

  async function processRemote({ file, source, endpoint, original, onProgress }) {
    const image = await loadImage(original);
    const canvas = prepareCanvas(image);
    const pixels = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height);
    const quality = analyzeImageQuality({ data: pixels.data, width: canvas.width, height: canvas.height });
    onProgress?.("upload", "正在发送到图像处理服务");
    const form = new FormData();
    form.append("image", file);
    form.append("source", source);
    form.append("operations", "quality,enhance,remove_background,classify");
    const response = await fetch(endpoint, { method: "POST", body: form });
    if (!response.ok) throw new Error(`processor_http_${response.status}`);
    if (response.headers.get("content-type")?.startsWith("image/")) {
      const transparent = await readBlob(await response.blob());
      return {
        status: "completed",
        provider: "rembg-http",
        quality,
        garment: { name: file.name.replace(/\.[^.]+$/, "") || "我的新单品", category: "top", color: "待确认" },
        images: { original, transparent, preview: transparent }
      };
    }
    const result = await response.json();
    result.images = { original, ...result.images };
    return result;
  }

  async function processLocal({ file, original, onProgress }) {
    onProgress?.("quality", "正在检查亮度、对比度与分辨率");
    const image = await loadImage(original);
    const canvas = prepareCanvas(image);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const quality = analyzeImageQuality({ data: pixels.data, width: canvas.width, height: canvas.height });
    onProgress?.("enhance", quality.brightness < 90 ? "图片偏暗，正在基础提亮" : "光线可用，保留原始颜色");
    const enhanced = enhanceCanvas(canvas, quality);
    await new Promise((resolve) => setTimeout(resolve, 180));
    onProgress?.("cutout", "正在生成独立单品预览");
    const transparent = createFallbackCutout(enhanced);
    return {
      status: "completed",
      provider: "local-fallback",
      quality,
      garment: { name: file.name.replace(/\.[^.]+$/, "") || "我的新单品", category: "top", color: "待确认" },
      images: { original, enhanced: enhanced.toDataURL("image/jpeg", 0.88), transparent, preview: transparent }
    };
  }

  async function processGarment({ file, source = "upload", endpoint = root.GARMENT_API_URL, onProgress } = {}) {
    if (!file?.type?.startsWith("image/")) throw new Error("image_required");
    const original = await readFile(file);
    if (endpoint) {
      try { return await processRemote({ file, source, endpoint, original, onProgress }); }
      catch { onProgress?.("fallback", "图像服务不可用，已切换到本地预处理"); }
    }
    return processLocal({ file, original, onProgress });
  }

  return { processGarment, analyzeImageQuality };
});
