# Issue #9 — owned outfit and realistic preview foundation

October 22, 2026 (Pacific). Development only; no inference, deployment or production changes.

## Baseline and overlap review

Reviewed open PRs and issue #9's complete comments. Work is based on PR #180,
`083f9c234a0a0829476df25287ccf8ff638af937`, on a new branch
`feature/issue-9-outfit-preview-foundation-20261022`, targeting the predecessor
`staging/pin-verified-supabase-project-20261022`, never main. PR #7's older
owned stylist and PRs #11/#12's disabled try-on work are already in this lineage.
PR #181 packaging and #183 / issue #182 staging Auth/security are separate;
none of their branches, settings, audit files or workflows were modified.

Existing stylist already generates up to three unique owned combinations,
cycles eligible one-piece swaps, preserves source records and saves boards in
account-specific IndexedDB. A small closet legitimately produces fewer options.
The reusable preview is a local collage. The hidden provider prototype and its
server paid-inference approval constants remain disabled and unchanged.

## Implemented

- Builder now has an owned-clothing entry, useful empty-closet explanation and
  Add clothing action. Whole-closet generation reuses the existing account-bound
  form; Style selected piece reuses the existing pinned-item flow.
- `anchorItemId` is retained only when the item is actually selected and owned.
  It survives board serialization, save/reload, and conflicting-ID backup restore.
  Swaps honor the persisted pin even when transient stylist state is gone.
  Explicitly choosing a replacement on the editable board may clear that pin.
- Native decoded figure dimensions are disclosed. Both checked-in references are
  160×297 WebP, displayed at up to 290 CSS pixels: insufficient even at DPR1,
  much less an Android DPR3 display. Originals and garment textures are untouched.
- The circular selfie behavior is intentional CSS (`object-fit:cover`,
  `border-radius:48%`) plus percentage-positioned blob image. It never was face
  synthesis. The experiment now sits in a collapsed section explaining this,
  with unchecked, nonpersistent consent and a disabled file picker. The handler
  checks consent before reading files or creating a URL. Revocation, removal,
  account changes and pagehide revoke the blob and clear consent. No customer
  selfie was opened, processed, stored or uploaded in this assignment.
- Existing 2D board, original images, generated-preview approval/source-hash
  admission, RGB preservation, original-before-crop recognition and paid gates
  are preserved. No new provider SDK or dependencies ship in the app.

## Commercial rendering options

Primary sources checked October 22, 2026; vendor claims are not our measurements.

| Approach | Commercial and fidelity considerations | Performance / projected cost |
| --- | --- | --- |
| Existing 2D photo board / local collage | Best source transparency; cannot simulate drape or sizing. Exact existing figure rights and high-resolution masters remain unverified. | No per-render API cost; browser processing only. Keep as fallback. |
| FASHN API v1.6 | Commercial output permitted by vendor. Current integration supports top/bottom/one-piece category passes; source logos and previous passes still require human checking. | Vendor: 864×1296 processing, ~5s performance / 8s balanced / 12–17s quality; 1 credit/output. At $0.075/credit, 3 single passes $0.225; 3 two-pass outfits $0.45. 1,000 such two-pass batches: $450 before retries/storage/tax. No purchase made. |
| FASHN Try-On Max API | Vendor-recommended higher-fidelity option, supports shoes and accessories; currently Preview lifecycle. One product-image input is not proof of faithful complete multi-item outfits. Evaluate rather than switching automatically. | 1–5 credits/image by explicit mode/resolution: $0.075–$0.375. Three single-pass options $0.225–$1.125; six passes $0.45–$2.25. Vendor ~10s fast 1K, ~25s balanced 2K, ~55s quality 4K. Passes compound latency and drift. |
| Self-host FASHN VTON v1.5 | Repository and model card advertise Apache-2.0; audit exact weight revision and all parser/pose dependencies and avatar rights before commercial packaging. Supports tops/bottoms/one-pieces; shoes not listed. License cost is not hosting cost. | ~2GB weights plus parser; GPU-oriented pipeline. No local GPU benchmark or cloud quote obtained. Compute cost = GPU hourly rate × billed seconds / 3600 + idle/storage/egress. No free-production-cost claim. |
| CatVTON / IDM-VTON | Public code/checkpoints CC BY-NC-SA 4.0; exclude from commercial implementation without separately cleared rights. | No integration or download. Apparent free weights do not resolve commercial licensing. |
| Rigged 3D avatar / cloth simulation | Requires commercially licensed meshes and garment geometry/material construction. A single closet photo cannot establish physical fabric properties or true fit. Potential longer-term route, not an immediate fidelity fix. | Modeling and infrastructure costs unquoted; no asset purchase. |

Sources:
- https://fashn.ai/products/api (commercial output and pricing)
- https://fashn.ai/pricing and https://help.fashn.ai/plans-and-pricing/api-pricing
  ($0.075/credit; minimum prepaid purchase $7.50; successful outputs charged)
- https://docs.fashn.ai/api-reference/tryon-v1-6
- https://docs.fashn.ai/api-reference/tryon-max
- https://github.com/fashn-AI/fashn-vton-1.5
- https://huggingface.co/fashn-ai/fashn-vton-1.5
- https://github.com/Zheng-Chong/CatVTON
- https://github.com/yisol/IDM-VTON

Projection assumptions: one output per pass, no successful retries, no discounts,
no automatic generation of every swap. These are arithmetic scenarios, not a
quote or authorization. Max fast 4K costs 3 credits per the current endpoint table;
older pricing changelog wording should not override that table.

## Optional realistic-render architecture (not activated)

Keep outfit IDs, selected item IDs, exact original-source hashes, display-only
cutout hashes, pin, figure asset hash/version and render settings in a request
manifest. Server authenticates owner and verifies all references, persists quota
and idempotency before admission, caps total credits and never retries uncertain
billable submissions automatically. Generic approved adult avatars first.
No customer face input by default. A later selfie feature requires separate
explicit consent naming recipient, purpose, retention and deletion, plus privacy
review; this local-overlay consent does not authorize vendor upload.

Cache generated candidates separately by owner and exact manifest. Any source,
owner, model or selected-item change invalidates the result. Never put a render
in the garment image, originalPhoto or recognitionPhoto fields. Display it as
“AI-generated approximation — check original clothes; fit is not predicted.”
Provide original thumbnails and an immediate return to the 2D board. Retain
existing source-linked display-preview approval safeguards before any faithful
preview claim. A larger image alone is not evidence of fidelity.

## Evidence and quality limits

New deterministic tests execute consent before file access, blob revocation,
account cleanup, decoded-size disclosure, empty/owned builder actions, three
unique owned results, serialized pin protection and backup pin remapping.
The complete Node suite passes locally; exact counts and CI links are in PR/issue.

The existing offline browser figure test verifies SHA-256-bound licensed original
fixtures and manifest-labeled extraction witnesses, pixel/source preservation,
held cutouts, male/female alignment and source-race cancellation. It is included
in the new branch-only CI with both Android Chromium and iPhone WebKit stylist
flows. These labels and reused fixtures are regression evidence, NOT a new
independent held-out fidelity evaluation. Browser installation failed locally due
to network download restrictions; CI status must be observed before claiming a
browser pass. CI artifacts contain synthetic or existing licensed test images.

There are no generated AI outfit outputs from this assignment to score.
Independently human-labeled held-out rendering evaluations: **0**.
New physical Android / iPhone runs: **0 / 2**. No realism percentage, competitor
superiority, sizing accuracy or visual acceptance is established by Node tests.

Next quality gate: freeze a consented, rights-cleared independent set of originals
before rendering. A reviewer labels category, primary color, texture/pattern,
sleeve/neckline, hem, graphics/logo and footwear from originals without seeing
model predictions. Record source hashes and licensing separately from identities.
Then blind-rate each generated outfit against each source: preserved, changed,
missing, uncertain; include earlier garments after every sequential pass. Require
all identity-critical features (especially logos/colors) preserved or hold the
render and show source fallback. Report per-feature numerators/denominators,
coverage, disagreement and failures, not a single unsupported accuracy score.
Do not use tuning images as holdout. No new personal images are needed for
current automated tests.

## Next implementation steps / blockers

1. Obtain exact approved high-resolution generic adult figure masters and rights
   evidence, ideally at least 1294×2398 with native detail; do not upscale 160px
   references and claim improvement. Existing production-figure readiness gates
   remain blocked until exact assets pass rights/anatomy/anchor review.
2. Run physical Android and iPhone photo→Style this→3 options where enough owned
   clothes exist→swap→save/reload tests. Record model/OS, timing, clicks, legibility
   and failures. Hosted Auth/security validation remains with #182.
3. Collect the independent source labels and reviewer evidence. No private user
   wardrobe or selfie access is implied by this task.
4. Before any vendor evaluation, obtain an explicit capped paid-inference budget
   and privacy approval. Compare v1.6 vs Max on the same frozen sources; inspect
   logo/texture/color and multi-pass drift. No paid or hosted integration enabled.
5. Keep draft until browser results, review and independent visual evidence are
   available. No merge or deployment authorization follows from passing CI.
