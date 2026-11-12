# New public photographs — exploratory evidence only

Collected and visually reviewed before baseline/candidate model inference. `manifest.json` contains 32 original JPEG source receipts, publisher descriptions, authors, commercial-compatible CC/public-domain license metadata and SHA-256 checksums. `reviewed-development.json` freezes the 19 usable exploratory photographs (16 garments and three negatives). Its SHA receipt must remain unchanged after inference.

The labels are **publisher descriptions checked by an AI visual reviewer**, not independent human ground truth. Every row remains `verified:false`, `humanVerified:false`, and `blindAcceptance:false`. No sealed acceptance data was created. This collection cannot establish population accuracy, acceptance target attainment, calibrated color accuracy, or safe automatic wardrobe admission.

The review excluded pens, a logo, a concert named after the performer Earl Sweatshirt, crowded/multi-item scenes, historical drawings/fragments, and duplicate views of the same museum objects. `review-decisions.json` preserves those decisions. Exact URL/title/hash overlap with all pre-existing `benchmark/*.json` values was excluded before collection. Unidentified same-object overlap with prior evidence remains possible.

Coverage is sparse and biased: two T-shirts, one sweatshirt, two blouses, one tunic, four sneakers, three boots, three dresses, and three empty-room negatives. Some tops/dresses/boots are museum objects rather than modern phone capture. Two subtype proposals are explicitly ambiguous. The three negatives share an archive context. No segmentation masks exist; do not score garment-instance IoU or recall from these labels.

`python research/parallel67/new-photos/download.py` recovers the original, unmodified JPEG bytes and fails if a checksum changes. JPEGs are intentionally not committed. `collect.py` documents candidate acquisition, but querying it again may produce a different candidate list; use the frozen source receipts for reproducibility. `review.py` documents the pre-inference visual selection and must not be rerun to tune labels against predictions.

Color proposals are AI visual judgments, sensitive to lighting and off-white/gray distinctions. They require independent human adjudication before any true color-accuracy claim.
