# Closet Current — Priority #94 Independent real-photo multi-instance ground-truth gate

**Research only / Family Alpha Issue #255 HOLD / No production or existing staging changes.**

**Source baseline:** Priority #93 [draft PR #648](https://github.com/nickhaney916-lang/Closet-Current/pull/648), SHA `1a6a67919f3b4a90c5c18d6a1bdc7ea92c07e42c`, [dedicated no-deploy CI #42152631434](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42152631434) SUCCESS (855/855 Node, 12 pinned donor tests, three mobile Chromium WebGL cases, 19 screenshot audits).

## Unresolved high-impact scientific problem

Priority #86 [draft PR #642](https://github.com/nickhaney916-lang/Closet-Current/pull/642) genuinely ran a pinned FashionCLIP classifier and a SegFormer segmentation model on publicly licensed photographs, but existing 59-source benchmark manifests only have **provisional single-label categories**. There are **zero independently verified human source-bound INSTANCE segmentation masks**, so the project cannot honestly report real instance-level precision, recall, mask IoU, per-garment category/subtype accuracy or primary/secondary color accuracy. A photo containing three pieces may require three different manually annotated instances. A bounding-box count or a single whole-photo category is scientifically insufficient.

## Isolated research-only engineering task

- Construct three blinded **A/B/C offline reviewer packets** from the exact 59 already-licensed original JPEG fixtures. Verify all source JPEG bytes, SHA-256, decodability, source rights, uniqueness. Packet data contain image relative name, exact source SHA, source ID, role and an SHA-bound canonical packet ID. They contain **zero historical labels, model guesses, holdout partition labels or previous human votes**.
- Provide a genuine static local browser *polygon annotation* UI: the reviewer selects the exact displayed original source image, creates independent masks for each visible garment by tapping vertex points and closing the polygon, and records category, subtype, primary and optional secondary color for **each** garment. An explicitly negative photograph may be marked **no garments** with an observation. Reviewers self-attest identity and blind independence. No uploaded customer photos, AI suggestions, network analytics or automatic cloud saves.
- Offline exports are deliberately raw JSON (only source IDs and SHA + normalized polygon coordinates and person-entered labels, no JPEG bytes). Two different actual humans A/B must independently label each photo; category/type/color or IoU disagreements remain **PENDING** until a separately identified third actual human C adjudicates with their own source-bound polygon review.
- Node evaluation rejects fake packet digests, swapped source hashes, malformed/empty/degenerate/self-intersecting/out-of-photo polygons, unsupported categories/subtypes/colors, duplicate instances, same reviewer ID, mixed source partitions, missing source predictions and extra predictions.
- A deterministic rasterized normalized polygon IoU computes human A/B agreement and per-instance learned-model matching. Exploratory precision/recall/mean matched IoU and category/subtype/primary/secondary color correctness include missed garments as errors; no accuracy claim without genuine two-human ground truth.
- Full inherited Node regression plus research-only tests, genuine source packet build and real Chromium/WebKit mobile browser annotation interaction with original locked licensed JPEGs at 320/390/430 CSS pixels. Browser test interactions are **QA-simulated** and must not be treated as independent human reviews.
- Strict no-deploy exact-parent GitHub Actions, evidence screenshot SHA audits, all other projects untouched. The separate Work #86 performs learned model inference, while parallel Work #90 owns original-photo-to-3D visual realism. #94 provides the scientific instance-level evidence protocol and capture UI, **not new model weights or independent human labor**.

**Scientific verdict is expected to remain NEEDS REWORK** until actual A/B/C independent human review and adequate locked dataset size/category coverage. The existing 59 originals are below #60's ≥100 source/≥30 locked garment/≥10 locked non-garment independent gate.

**Engineering verdict PENDING final exact-HEAD CI.** Never merge or deploy, Family Alpha HOLD.
