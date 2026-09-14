# Fit Engine (T-shirt POC)

Zero-dependency deterministic core for the first adult T-shirt experiment.

## Run

```powershell
cd packages/fit-engine
npm test
```

## Contract

- Raw garment tables are normalized to centimetres and full circumferences before evaluation.
- Chest, shoulder and length produce separate conclusions with `rule_id` and evidence.
- A unique size is withheld unless chest circumference comes from manual input or a merchant body range.
- Biacromial or camera-visible shoulder width is not treated as directly comparable to garment seam-to-seam shoulder width.
- Raglan/unknown sleeve types and unknown garment length origins degrade to `unknown` conclusions.
- Every numeric fit threshold lives in `src/config.js`, is versioned, and is currently marked `experimental`.

The JSON Schemas under `schemas/` describe the external raw product, body and output shapes. Runtime validation is deliberately dependency-free and returns structured `FitInputError.issues`.

## Important limitation

Candidate order is deterministic, but the default rule values are hypotheses for the demo, not calibrated sizing facts. They must be replaced or promoted to `calibrated` only after manual measurements and real wear trials.
