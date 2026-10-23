# Issue 211 — realistic avatar / virtual try-on design, October 22, 2026

Design research only. No models downloaded, inference activated or selfie read.

## Recommendation

Keep a rights-cleared adult standard figure with local original-photo overlays
as the free pilot. Label it **2D outfit collage — not fit or drape simulation**.
Preserve an immutable original/photo hash alongside separate display/cutout
assets; bind every result to owner, garment IDs, original hashes and model
version. Dress selections suppress bottoms; layer order and shoe slots remain
explicit. Use existing approved cutouts only; missing physical mask truth means
REVIEW rather than invented garment reconstruction. Retain actual RGB/texture;
never replace a wardrobe original with a generated image.

Phone design: lazy 512px preview, separately load detail on demand, release
ImageBitmap/blob resources after swaps, cancel stale async jobs on owner changes,
and limit concurrent decodes. High-resolution originals stay available for
recognition, detail and future explicit inference consent. These are proposed
performance choices, not measured device guarantees.

| Route | Commercial/technical gate | Cost and realism |
|---|---|---|
| Standard figure + browser overlay | Commission/create commercially cleared adult figures; preserve asset provenance and original garments | No inference charge; plausible layout only, no realistic fit |
| FASHN VTON 1.5 self-hosted | Apache-2.0 project; audit downloaded weights, parser and all third-party rights separately; tops/bottoms/one-pieces, no demonstrated shoe pipeline | Roughly 2GB weights plus parser; GPU/server management required; no free phone-browser deployment claim |
| FASHN v1.6 hosted | Separately approved paid provider, private account-scoped job and explicit adult photo transfer consent | Published 1 credit/output; 7.5 cents on demand; realism must be tested, footwear support not inferred |
| FASHN Try-On Max hosted | Same privacy/cost gate; broader supported items including shoes | Published 1–5 credits/output by mode/resolution = $0.075–$0.375 before optional extras/retries; multi-item fidelity unproven |
| CatVTON | Upstream noncommercial restriction excludes default commercial release | Do not deploy for this commercial app without separate suitable permission |

Provider arithmetic: 1,000 v1.6 successful outputs = $75; 1,000 Max outputs
= $75–$375 at the cited credit schedule. Three separate v1.6 garment passes would
be $0.225/outfit if all succeed, with cumulative fidelity risk; that is arithmetic,
not proof sequential layering works. Self-host planning assumption only:
$0.50–$2/GPU-hour and 10–60 seconds/output implies about $0.0014–$0.0333 raw GPU
compute/output, excluding idle time, hosting, storage, engineering and retries.
Those GPU prices and timings are hypothetical sensitivity inputs, NOT quotes or
benchmarked latency. No procurement recommendation is based on them.

## Gate before any future evaluation

Central owner chooses separately authorized capped spend and reviews provider
retention/data terms. Use rights-cleared adult standard figures first. Optional
adult selfies require specific transfer consent, revocation, expiry, deletion,
no training reuse commitment and owner isolation; no minor selfie pilot. Keep
keys server-side; no provider URL or shared cache can expose another owner.
Bind source hash to the request and result, invalidate on swap/delete/account
change, and never auto-index a generated garment as owned truth.

Predetermine an untouched licensed garment set across shoes, patterned dresses,
skirts/shorts, sleeves and layered jackets. Two independent reviewers compare
source vs generated category, color, logos, texture, closures and hem/sole shape;
record failures and abstentions. Require no owner/hash mismatch, no critical
identity edits, explicit synthetic-image disclosure, phone memory/latency and
multi-garment consistency evidence before release. Exact numeric quality targets
must be agreed before viewing evaluation outputs; no retroactive threshold edits.

## Primary sources checked for this note

- https://github.com/fashn-AI/fashn-vton-1.5 — Apache-2.0, components, model downloads and category support.
- https://github.com/Zheng-Chong/CatVTON — noncommercial project restriction.
- https://help.fashn.ai/plans-and-pricing/api-pricing — $0.075/credit, 100-credit minimum purchase, endpoint credit schedule.
- https://docs.fashn.ai/api-reference/tryon-v1-6 — tops/bottoms/one-pieces and distinction from Max item support.

Commercial rights review remains a project gate; no assertion that one license
covers customer likeness, all dependency weights or all possible generated use.
