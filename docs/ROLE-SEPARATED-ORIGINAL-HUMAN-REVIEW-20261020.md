# Closet Current: separate offline first/second human garment review packages

**2026-10-20 · Draft technical handoff stacked on PR #83**

## Fixed handoff risk

The previously verified 12-original source work packet placed `FIRST-REVIEW.html` and `SECOND-REVIEW.html` (including source inspection risk notes) in the SAME directory. The first human, who is supposed to identify a garment independently without model categories or second-person hints, could accidentally open the second-reviewer's notes. The downloadable artifact also included both roles, so instructions alone did not enforce a model-blind first review.

**Now generate and deliver two distinct ZIP files**, not the earlier combined directory:

| Who receives it | ZIP | Contents |
|---|---|---|
| First human annotator ONLY | `first-human-originals.zip` | 12 unchanged original licensed JPGs; `FIRST-REVIEW.html`; `FIRST-ANNOTATE.html` native-grid editor; `BLIND-FIRST-SOURCES.json`; hash-auditable role manifest |
| Distinct second human reviewer ONLY | `second-human-originals.zip` | Same 12 exact unmodified JPGs; `SECOND-REVIEW.html` with source risk inspection notes and attribution; `SECOND-APPROVE.html`; `RIGHTS-AUDIT.json`; `REVIEW-STATUS.json`; independent role manifest |

The first ZIP contains **zero second-review notes, sourceInspection, benchmark categories, model mask proposals, legal identity assertions or "approved masks"**. The second ZIP contains no first-review editor or first-view instruction page. Every source JPG in BOTH roles has the exact independently locked SHA256 and native resolution. Filenames and paths are flat and safe inside ZIP; the archives have fixed timestamps and reproducible bytes, and neither can overwrite an existing ZIP.

No reviewer annotation or human identity evidence is bundled. Real independent humans must perform reviews. The second reviewer must securely obtain the genuine first person's **original draft JSON** separately, verify the source/JPG, and inspect all garment pixels; any correction goes back to the first person for an updated draft and a fresh review. A different typed reviewer name in JSON does **not** authenticate real independence.

## How to obtain and use

1. In the final successful GitHub Actions workflow for the branch, open the artifact **`offline-original-photo-reviewer-role-isolated-zips`**. It contains exactly the two role ZIPs plus `ROLE-DELIVERY-MANIFEST.json`, never the mixed working packet.
2. Only the coordinator should download the combined artifact. Verify each ZIP's SHA256 against the delivery manifest before distributing it.
3. Deliver **only the first ZIP** to first human. Extract it, open `FIRST-REVIEW.html` locally and follow the source-photo instructions. Use the provided `FIRST-ANNOTATE.html` to draw original-pixel fabric shapes without model prompts, then save each `*.mask.draft.json` privately. Do not share the second ZIP with them.
4. A different human receives **only the second ZIP**, plus the first person's specific draft JSON through an approved secure channel. Open `SECOND-REVIEW.html` and `SECOND-APPROVE.html` with the matching exact original JPG, inspect cuffs, seams, hems, trims, correct shorts/dress/skirt type, and approve/reject. Save review JSON locally. Do not upload person names, source photos, private drafts or rights evidence to public PRs.
5. Coordinator runs `node scripts/check-integrated-real-photo-readiness.mjs --reviews <private-folder> --out artifacts/private-human-review/<new-name>.json` to produce a locally contained summary. A syntactically correct pair is still **NOT an authenticated human mask**; human/rights verification, approved registry and source-grid scoring remain independently blocked.

Offline packet preparation (technical operator with repository checkout):

```bash
python scripts/stage-independent-twelve-mask-review.py
python scripts/build-role-isolated-review-packets.py
```

The review ZIPs and hashes are written under ignored `artifacts/private-human-review/role-packets/`. Re-running the builder without selecting a fresh destination is deliberately refused, preventing accidental overwrites of previous review packages.

## Verification scope

`.github/workflows/role-isolated-reviewer-packets-qa.yml` builds the integrated app, runs full Node regressions and the real Git dual-parent-integrity test, stages the 12 true source files, generates BOTH role ZIPs, verifies all ZIP hashes/source image bytes, reproducibility, risk-note isolation and failure on tampering, and extracts each ZIP into a separate folder. Real Chromium and WebKit browsers then open the extracted offline first/second pages and independent editors at phone-width, decode all 12 original JPEGs from actual file paths, and verify **zero network requests**. Source-native editor and owned-clothes styling browser suites also rerun. No image generation or paid provider is invoked.

Role separation is **packaging discipline**, not authentication: a coordinator could still hand both ZIPs to the same person. There are still **0 genuinely independently human-reviewed masks out of 12**, therefore **0 actual clipping/fit quality measurements** (metrics are NULL/UNMEASURED). Commercial image/model rights, full physical-phone camera testing, and real-human reviewer independence remain prerequisites for production. No GitHub main merge, paid AI, production deployment or Drive Duel edits.
