import { DEFAULT_RULE_CONFIG } from "./config.js";
import { FitInputError, isFinitePositive, issue } from "./validation.js";

const CM_PER_INCH = 2.54;
const DIMENSIONS = ["shoulder", "chest", "length", "sleeve_length", "cuff"];

/** Convert heterogeneous T-shirt measurements to centimetres and full circumferences. */
export function normalizeGarmentTable(input, config = DEFAULT_RULE_CONFIG) {
  const issues = [];
  if (!input || typeof input !== "object") throw new FitInputError([issue("product", "required_object")]);
  if (input.category !== "t_shirt") issues.push(issue("product.category", "unsupported_category", input.category));
  if (!input.unit || !["cm", "inch"].includes(input.unit)) issues.push(issue("product.unit", "unsupported_unit", input.unit));
  if (!input.sizes || typeof input.sizes !== "object" || !Object.keys(input.sizes).length) {
    issues.push(issue("product.sizes", "at_least_one_size_required"));
  }
  if (!input.measurement_basis || !["circumference", "half_width"].includes(input.measurement_basis.chest)) {
    issues.push(issue("product.measurement_basis.chest", "basis_required"));
  }
  if (issues.length) throw new FitInputError(issues);

  const factor = input.unit === "inch" ? CM_PER_INCH : 1;
  const sizes = {};
  const warnings = [];
  for (const [sizeName, raw] of Object.entries(input.sizes)) {
    const normalized = {};
    for (const dimension of DIMENSIONS) {
      const rawValue = raw[dimension];
      if (rawValue === null || rawValue === undefined || rawValue === "") {
        normalized[normalizedName(dimension)] = null;
        continue;
      }
      if (!isFinitePositive(rawValue)) {
        issues.push(issue(`product.sizes.${sizeName}.${dimension}`, "must_be_positive_number", rawValue));
        continue;
      }
      let value = rawValue * factor;
      if (dimension === "chest" && input.measurement_basis.chest === "half_width") value *= 2;
      if (dimension === "cuff" && input.measurement_basis.cuff === "half_width") value *= 2;
      value = round(value);
      const key = normalizedName(dimension);
      normalized[key] = value;
      const bounds = config.plausibilityCm[key.replace("_cm", "")];
      if (bounds && (value < bounds[0] || value > bounds[1])) {
        issues.push(issue(`product.sizes.${sizeName}.${dimension}`, "outside_plausible_range", value));
      }
    }
    sizes[sizeName] = normalized;
  }
  if (issues.length) throw new FitInputError(issues);

  if (Object.values(sizes).some((size) => size.chest_circumference_cm === null)) {
    warnings.push({ code: "missing_chest_for_some_sizes" });
  }
  return {
    schema_version: "1.0.0",
    category: "t_shirt",
    measurement_type: input.measurement_type ?? "garment",
    source_unit: input.unit,
    normalized_unit: "cm",
    sleeve_type: input.sleeve_type ?? "unknown",
    fabric_stretch: input.fabric_stretch ?? "unknown",
    measurement_basis: {
      chest: "circumference",
      cuff: input.measurement_basis.cuff ? "circumference" : "unknown",
      length_origin: input.measurement_basis.length_origin ?? "unknown"
    },
    sizes,
    warnings
  };
}

function normalizedName(dimension) {
  return dimension === "chest" || dimension === "cuff"
    ? `${dimension}_circumference_cm`
    : `${dimension}_cm`;
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
