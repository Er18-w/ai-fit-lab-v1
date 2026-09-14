import { DEFAULT_RULE_CONFIG, FIT_PREFERENCES } from "./config.js";
import { normalizeGarmentTable } from "./normalize.js";
import { FitInputError, measurementMidpoint, validateBody } from "./validation.js";

export function evaluateTshirtFit({ body, product, preference = "fitted", config = DEFAULT_RULE_CONFIG }) {
  const bodyIssues = validateBody(body);
  if (!FIT_PREFERENCES.includes(preference)) {
    bodyIssues.push({ path: "preference", code: "unsupported_preference", value: preference });
  }
  if (bodyIssues.length) throw new FitInputError(bodyIssues);
  const garment = product.normalized_unit === "cm" ? product : normalizeGarmentTable(product, config);
  const candidates = Object.entries(garment.sizes).map(([size, dimensions], index) => {
    const conclusions = [
      chestConclusion(body, dimensions, preference, config),
      shoulderConclusion(body, garment, dimensions, preference, config),
      lengthConclusion(body, garment, dimensions, preference, config)
    ];
    return { size, source_order: index, score: score(conclusions), conclusions };
  }).sort((a, b) => a.score - b.score || a.source_order - b.source_order);

  const chestReliable = body.chest && ["manual", "merchant_range"].includes(body.chest.source);
  const top = candidates[0] ?? null;
  const uniqueAllowed = Boolean(chestReliable && top && top.conclusions.find((x) => x.dimension === "chest")?.status !== "unknown");
  return {
    schema_version: "1.0.0",
    rule_version: config.version,
    rule_status: config.status,
    category: "t_shirt",
    preference,
    recommendation: {
      mode: uniqueAllowed ? "ranked_recommendation" : "candidates_only",
      recommended_size: uniqueAllowed ? top.size : null,
      candidate_sizes: candidates.slice(0, 3).map((item) => item.size),
      reason: uniqueAllowed ? "reliable_chest_available" : "reliable_chest_required_for_unique_size"
    },
    candidates: candidates.map(({ source_order, ...candidate }) => candidate),
    warnings: [
      ...(config.status === "experimental" ? [{ code: "experimental_thresholds", config_version: config.version }] : []),
      ...(!chestReliable ? [{ code: "unique_size_withheld", required_input: "manual_or_merchant_chest_circumference" }] : [])
    ]
  };
}

function chestConclusion(body, dimensions, preference, config) {
  const garmentChest = dimensions.chest_circumference_cm;
  const bodyChest = measurementMidpoint(body.chest);
  const evidence = [ev("garment.chest_circumference_cm", garmentChest, "cm", "size_chart")];
  if (bodyChest === null || garmentChest === null) return unknown("FIT_CHEST_DATA_REQUIRED", "chest", evidence, "missing_chest_measurement");
  evidence.push(ev("body.chest", bodyChest, "cm", body.chest.source));
  const ease = round(garmentChest - bodyChest);
  evidence.push(ev("derived.chest_ease", ease, "cm", "calculation"));
  const range = config.chestEaseCm[preference];
  return ranged("FIT_CHEST_EASE_V1", "chest", ease, range, evidence);
}

function shoulderConclusion(body, garment, dimensions, preference, config) {
  const garmentShoulder = dimensions.shoulder_cm;
  const bodyShoulder = measurementMidpoint(body.shoulder_reference);
  const evidence = [ev("garment.shoulder_cm", garmentShoulder, "cm", "size_chart")];
  if (bodyShoulder === null || garmentShoulder === null) return unknown("FIT_SHOULDER_DATA_REQUIRED", "shoulder", evidence, "missing_shoulder_measurement");
  evidence.push(ev("body.shoulder_reference", bodyShoulder, "cm", body.shoulder_reference.source));
  if (garment.sleeve_type === "raglan" || garment.sleeve_type === "unknown") {
    return unknown("FIT_SHOULDER_SLEEVE_TYPE_UNSUPPORTED", "shoulder", evidence, `sleeve_type_${garment.sleeve_type}`);
  }
  if (body.shoulder_reference.definition !== "garment_comparable") {
    return unknown("FIT_SHOULDER_DEFINITION_NOT_COMPARABLE", "shoulder", evidence, "shoulder_definition_requires_calibration");
  }
  const difference = round(garmentShoulder - bodyShoulder);
  evidence.push(ev("derived.shoulder_difference", difference, "cm", "calculation"));
  return ranged("FIT_SHOULDER_DIFFERENCE_V1", "shoulder", difference, config.shoulderDifferenceCm[garment.sleeve_type][preference], evidence);
}

function lengthConclusion(body, garment, dimensions, preference, config) {
  const length = dimensions.length_cm;
  const evidence = [ev("garment.length_cm", length, "cm", "size_chart"), ev("body.height_cm", body.height_cm, "cm", "user_input")];
  if (length === null) return unknown("FIT_LENGTH_DATA_REQUIRED", "length", evidence, "missing_garment_length");
  if (garment.measurement_basis.length_origin === "unknown") {
    return unknown("FIT_LENGTH_ORIGIN_REQUIRED", "length", evidence, "unknown_length_measurement_origin");
  }
  const ratio = round(length / body.height_cm);
  evidence.push(ev("derived.length_to_height_ratio", ratio, "ratio", "calculation"));
  return ranged("FIT_LENGTH_HEIGHT_RATIO_V1", "length", ratio, config.garmentLengthToHeightRatio[preference], evidence);
}

function ranged(ruleId, dimension, value, range, evidence) {
  const status = value < range[0] ? "smaller_than_target" : value > range[1] ? "larger_than_target" : "matches_target";
  const distance = value < range[0] ? range[0] - value : value > range[1] ? value - range[1] : 0;
  return {
    rule_id: ruleId,
    dimension,
    status,
    confidence: "experimental",
    target_range: range,
    distance_from_target: round(distance),
    evidence
  };
}

function unknown(ruleId, dimension, evidence, reason) {
  return { rule_id: ruleId, dimension, status: "unknown", confidence: "none", reason, evidence };
}

function ev(path, value, unit, source) {
  return { path, value: value ?? null, unit, source };
}

function score(conclusions) {
  return round(conclusions.reduce((total, item) => {
    if (item.status === "unknown") return total + 2;
    return total + item.distance_from_target;
  }, 0));
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}
