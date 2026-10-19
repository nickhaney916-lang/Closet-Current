# Outcome — high-confidence body exclusion sensitivity (2026-10-18)

**Decision: reject automatic adoption. Keep strict baseline and current customer app unchanged.**

Source: [GitHub Actions five-photo comparison](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39133654353), artifact `experimental-hybrid-clothing-segmentation` (ID `12138542756`). The model outputs were generated on checksum-verified photographs, not inferred from synthetic fixtures.

| Source ID | Category | Strict protected cells | Confidence-protected cells | Newly exposed native pixels | Interpretation |
|---|---|---:|---:|---:|---|
| validation-0001 | worn patterned dress | 2,035 | 1,361 | 46,485 | Side-by-side preview includes pixels near exposed skin and neckline/hem; not a clean clothing-only recovery |
| validation-0003 | mannequin dress | 401 | 152 | 4,452 | Small pale additional contours are ambiguous between dress and mannequin |
| validation-0010 | worn blue dress | 545 | 415 | 0 | Catastrophic dress extraction persists |
| validation-0017 | jeans | 528 | 118 | 0 | No changed display cutout |
| validation-0019 | sneaker pair | 88 | 0 | 0 | No changed display cutout |

*Protected cells* are coarse semantic model cells; *newly exposed pixels* are original-resolution alpha-mask positions. **Neither measure is garment recall, precision, accuracy, successful fabric restoration, or user-facing performance**. The alternative cannot distinguish recovered cloth from included skin/mannequin pixels.

The experiment confirms that relaxing an argmax-based body mask alone is **not a reliable fix** for missing dress fabric or shoe toes. The review-only alternative stays disabled for production. Any proposed future model must be scored against independent approved garment outlines and pass human-visible body exclusion checks plus real mobile device tests.

The experiment also exposed a useful reporting requirement: any person-containing photo with newly visible pixels must carry an explicit `bodyExposureRiskReviewRequired` flag. CI checks this and rejects automatic body-mask relaxation regardless of apparent improvement. No new app feature, external paid service, Drive Duel code, or production deployment.
