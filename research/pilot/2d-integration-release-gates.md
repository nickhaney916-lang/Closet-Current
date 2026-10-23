# Closet Current — 2D integration release-gate decision (2026-10-23)

**Decision: HOLD for physical-phone and human-quality evidence.** This document does not authorize merge, staging deployment, production deployment, or paid services.

## Reviewed candidate
Draft [PR #219](https://github.com/nickhaney916-lang/Closet-Current/pull/219), verified head stated as `883c8ed8f751edead21f9dff41074da03412f9b6`, stacked on unmerged development PRs #209 → #213 → #218. Read `docs/2D-OUTFIT-INTEGRATION-20261023.md` at that exact commit. Separate [PR #217](https://github.com/nickhaney916-lang/Closet-Current/pull/217) is a synthetic research/demo branch, not the customer integration branch.

## Evidence from PR #219 (reported, not re-executed in this review)
- Two complete Node regression runs: 1,842 pass, 0 fail, 0 skip.
- 46/46 avatar/garment-transfer tests; 22/22 locked outfit acceptance checks.
- Chromium and WebKit tests cover three looks, pinning, swapping, save/reload, stale original/crop invalidation, account isolation and a 390×844 viewport.
- 59/59 licensed original fixtures hash-verified.
- Exact-head integration CI reported SUCCESS; protected pilot packaging SKIPPED.
- These are automated checks and browser emulation, not real Android/iPhone tests or independent human fidelity scoring.

## Source-of-truth review
- Customer preview now uses saved original/native crop rather than reusing stale display-only cutouts.
- Original/photo/crop/provenance changes invalidate cached preview work.
- Invalid originals, foreign ownership, or unusable separation hold safely rather than hallucinating a garment.
- Research compositor review/hash fields are caller assertions, not authenticated mask-review or actual byte-integrity evidence. **Do not promote that research compositor into the customer runtime.**
- Preview is an approximate styling collage, not physical fit, sizing, drape or photorealistic try-on.

## Unmet release gates
| Gate | Current evidence | Required to close |
|---|---|---|
| Physical Android | None | End-to-end on actual device, documented build/model/OS |
| Physical iPhone | None | End-to-end on actual device, documented build/model/iOS |
| Independent photo/segmentation truth | None new | Human-reviewed original-linked items and masks, disagreements adjudicated |
| Human garment fidelity | Unmeasured | Independent color/texture/pattern/source identity ratings with sample size |
| Protected pilot build | Packaging skipped | Explicit owner authorization and security review before deployment |
| Final branch integration | PR stack unmerged | Review dependency chain and choose exact integration SHA |
| Commercial fidelity claims | Not supported | Describe as approximate styling preview with saved-photo fallback |

## Acceptance sequence
1. Preserve draft branches. Review the exact PR #219 dependency chain and security gates; do not merge or deploy.
2. With owner's explicit approval, prepare a protected test build from a reviewed SHA (not an arbitrary latest branch).
3. Run [physical phone sheet](physical-phone-test-sheet.md) and [pilot tester instructions](pilot-test-instructions.md), recording results in [pilot intake CSV](pilot-test-intake.csv).
4. Fix any account isolation, original-photo mutation, false garment or critical UX defects on an isolated branch. Rerun exact-head automated suites and physical cases.
5. Only after evidence is reviewed should the main conversation make a separate pilot go/no-go decision. Public launch needs its own approval.

## Decision ownership
Main Closet Current conversation controls merge/deploy and public claims. No customer photos, paid AI, Supabase/Cloudflare changes, or Drive Duel changes are authorized.
