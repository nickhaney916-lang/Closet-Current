# Verified garment color provenance — 2026-10-20

## Customer problem and concrete fix

A mask-derived foreground color can arrive through `ClothingDetails.fillColor` with `estimate.method='garment-mask'`, but the helper formerly **did not retain that method**. The later `ClothingDetails.fill` stage treats anonymous `photo-estimate` colors as replaceable by a conflicting recognition model color. That can misindex a correctly sampled blue shoe as a red shoe despite confirmed garment-pixel evidence.

The helper now records `colorMethod='garment-mask'` for recognized, **already verified** mask color estimates, exactly as it already records `uniform-light-background`. Since the existing fill step requires that trusted method to protect independently verified photo color, the original category, color and type index remain consistent. No new model outputs are fabricated; only the original confirmed evidence is carried forward.

The fix preserves conservative behavior:
- `needsConfirmation=true` returns the input unchanged; uncertain masks cannot fill a color.
- Model guesses can still correct **ordinary** scene-wide photo estimates with no verified foreground evidence.
- User-entered color never gets overwritten by automatic estimates.
- Unexpected `estimate.method` strings cannot spoof trusted mask provenance.
- Category mismatches do not apply unrelated garment type/color details.
- The application still classifies from the **untouched original RGB photo** before derived clipping, and outfits still use only owned clothes.

## Test coverage and exact source integrity

New `tests/verified-garment-color-provenance.test.cjs` exercises seven concrete decisions, including conflict between a verified garment mask blue color and a model's red label, preservation of white-background evidence, user corrections and disputed/unsupported masks. Full existing automatic-indexing and photo-color tests must also pass.

The source provenance gate compares `public/clothing-details.js` with the exact prior PR #103 revision **after applying only the approved one-function replacement**. Changes elsewhere in that helper or elsewhere in original recognition, segmentation, physical masks and photos fail CI. Relevant original-photo and integrated review gates remain active.

Workflow: `.github/workflows/verified-color-provenance-qa.yml`; its exact-head result must be checked before reporting this specific code priority finished.

## Limits

This is a targeted, evidence-preserving correctness fix, **not** a claim of 100% real-photo or physical-device recognition accuracy. Independent real-world color benchmarks and actual owned garment examples (particularly shoes, skirts versus dresses, pale garments and shadows) remain part of customer validation. Hosted Auth SMTP/redirect blockers, independent production figure/mask review and staged security permissions also remain unapproved.

No merging, deploying, paid AI, private customer wardrobe access or Drive Duel edits.
