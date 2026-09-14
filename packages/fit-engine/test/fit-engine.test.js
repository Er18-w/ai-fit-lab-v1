import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DEFAULT_RULE_CONFIG, FitInputError, evaluateTshirtFit, normalizeGarmentTable } from "../src/index.js";

const fixture = JSON.parse(await readFile(new URL("../fixtures/tshirt-m-to-3xl.json", import.meta.url), "utf8"));

test("normalizes the provided M-3XL circumference table without changing values", () => {
  const product = normalizeGarmentTable(fixture);
  assert.equal(product.sizes.M.chest_circumference_cm, 107);
  assert.equal(product.sizes["3XL"].shoulder_cm, 61);
  assert.equal(product.measurement_basis.chest, "circumference");
});

test("normalizes inches and half chest widths to cm circumference", () => {
  const product = normalizeGarmentTable({
    category: "t_shirt",
    unit: "inch",
    measurement_basis: { chest: "half_width", length_origin: "high_point_shoulder" },
    sizes: { M: { chest: 20, length: 27 } }
  });
  assert.equal(product.sizes.M.chest_circumference_cm, 101.6);
  assert.equal(product.sizes.M.length_cm, 68.58);
});

test("rejects missing basis, unsupported units, and implausible measurements", () => {
  assert.throws(
    () => normalizeGarmentTable({ category: "t_shirt", unit: "mm", sizes: { M: { chest: 1000 } } }),
    (error) => error instanceof FitInputError && error.issues.some((x) => x.path === "product.unit")
  );
  assert.throws(
    () => normalizeGarmentTable({ category: "t_shirt", unit: "cm", measurement_basis: { chest: "circumference" }, sizes: { M: { chest: 500 } } }),
    (error) => error instanceof FitInputError && error.issues.some((x) => x.code === "outside_plausible_range")
  );
});

test("returns deterministic ranked recommendation when reliable chest is available", () => {
  const input = {
    body: {
      height_cm: 175,
      chest: { value_cm: 99, source: "manual" },
      shoulder_reference: { value_cm: 52, source: "manual", definition: "garment_comparable" }
    },
    product: fixture,
    preference: "slight_relaxed"
  };
  const first = evaluateTshirtFit(input);
  const second = evaluateTshirtFit(input);
  assert.deepEqual(first, second);
  assert.equal(first.recommendation.mode, "ranked_recommendation");
  assert.equal(first.recommendation.recommended_size, "L");
  assert.ok(first.candidates.every((candidate) => candidate.conclusions.every((item) => item.rule_id && item.evidence.length)));
});

test("withholds a unique size when reliable chest is absent", () => {
  const output = evaluateTshirtFit({
    body: {
      height_cm: 175,
      shoulder_reference: { min_cm: 46, max_cm: 49, source: "camera_estimate", definition: "body_visual" }
    },
    product: fixture,
    preference: "fitted"
  });
  assert.equal(output.recommendation.mode, "candidates_only");
  assert.equal(output.recommendation.recommended_size, null);
  assert.ok(output.warnings.some((warning) => warning.code === "unique_size_withheld"));
  assert.ok(output.candidates.every((candidate) => candidate.conclusions.find((x) => x.dimension === "shoulder").status === "unknown"));
});

test("camera-estimated chest never unlocks a unique recommendation", () => {
  const output = evaluateTshirtFit({
    body: { height_cm: 175, chest: { min_cm: 96, max_cm: 102, source: "camera_estimate" } },
    product: fixture,
    preference: "fitted"
  });
  assert.equal(output.recommendation.mode, "candidates_only");
  assert.equal(output.recommendation.recommended_size, null);
});

test("unknown length origin degrades length conclusion instead of inventing a fit", () => {
  const product = structuredClone(fixture);
  product.measurement_basis.length_origin = "unknown";
  const output = evaluateTshirtFit({
    body: { height_cm: 175, chest: { value_cm: 99, source: "manual" } },
    product,
    preference: "fitted"
  });
  const conclusion = output.candidates[0].conclusions.find((x) => x.dimension === "length");
  assert.equal(conclusion.rule_id, "FIT_LENGTH_ORIGIN_REQUIRED");
  assert.equal(conclusion.status, "unknown");
});

test("all uncalibrated threshold groups are centralized and marked experimental", () => {
  assert.equal(DEFAULT_RULE_CONFIG.status, "experimental");
  assert.ok(DEFAULT_RULE_CONFIG.chestEaseCm.fitted);
  assert.ok(DEFAULT_RULE_CONFIG.shoulderDifferenceCm.set_in.fitted);
  assert.ok(DEFAULT_RULE_CONFIG.garmentLengthToHeightRatio.fitted);
});
