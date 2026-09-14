export class FitInputError extends Error {
  constructor(issues) {
    super("Fit-engine input validation failed");
    this.name = "FitInputError";
    this.issues = issues;
  }
}

export function isFinitePositive(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function measurementMidpoint(measurement) {
  if (!measurement) return null;
  if (isFinitePositive(measurement.value_cm)) return measurement.value_cm;
  if (isFinitePositive(measurement.min_cm) && isFinitePositive(measurement.max_cm)) {
    return (measurement.min_cm + measurement.max_cm) / 2;
  }
  return null;
}

export function measurementRange(measurement) {
  const midpoint = measurementMidpoint(measurement);
  if (midpoint === null) return null;
  return [measurement.min_cm ?? midpoint, measurement.max_cm ?? midpoint];
}

export function validateBody(body) {
  const issues = [];
  if (!body || typeof body !== "object") return [issue("body", "required_object")];
  if (!isFinitePositive(body.height_cm) || body.height_cm < 100 || body.height_cm > 230) {
    issues.push(issue("body.height_cm", "outside_supported_range", body.height_cm));
  }
  for (const field of ["chest", "shoulder_reference"]) {
    const value = body[field];
    if (!value) continue;
    const range = measurementRange(value);
    if (!range || range[0] > range[1]) {
      issues.push(issue(`body.${field}`, "invalid_measurement_range", value));
    }
  }
  return issues;
}

export function issue(path, code, value) {
  return { path, code, ...(value === undefined ? {} : { value }) };
}
