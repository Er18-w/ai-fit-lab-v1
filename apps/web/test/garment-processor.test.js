const test = require("node:test");
const assert = require("node:assert/strict");
const { analyzeImageQuality } = require("../garment-processor.js");

function pixels(value, width = 400, height = 500, alternate = value) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < data.length; index += 4) {
    const pixel = index / 4;
    const color = Math.floor(pixel / Math.max(1, Math.floor(width / 8))) % 2 ? value : alternate;
    data[index] = color;
    data[index + 1] = color;
    data[index + 2] = color;
    data[index + 3] = 255;
  }
  return { data, width, height };
}

test("accepts a sufficiently bright, contrasted image", () => {
  const result = analyzeImageQuality(pixels(80, 600, 800, 190));
  assert.equal(result.accepted, true);
  assert.equal(result.warnings.length, 0);
});

test("flags dark low-contrast images for user review", () => {
  const result = analyzeImageQuality(pixels(25, 600, 800, 28));
  assert.equal(result.accepted, false);
  assert.match(result.warnings.join(" "), /偏暗/);
  assert.match(result.warnings.join(" "), /对比不足/);
});

test("warns when the image resolution is too low", () => {
  const result = analyzeImageQuality(pixels(80, 200, 240, 190));
  assert.equal(result.accepted, false);
  assert.match(result.warnings.join(" "), /分辨率偏低/);
});
