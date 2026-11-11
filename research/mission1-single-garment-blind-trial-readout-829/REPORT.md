# Closet Current Mission 1 P829 — private single-garment recognition trial readout

**Family Alpha HOLD #255. Draft research branch; not deployed, not merged, no account, no wardrobe save or real personal photos in CI.**

## Owner purpose
Before a household member tries to build a real wardrobe, a **short, private, single-garment accuracy check** can show whether real phone photographs get category/type right, whether automatic guesses are wrong, which images need human correction, and whether the model successfully runs on that device. This is a diagnostic preview, NOT evidence of release readiness.

### What the isolated change actually does
- Reuses the existing deployed-code **no-account** `phone-photo-check.html` checker and the frozen production FashionCLIP worker; no additional model weights, recognition thresholds, garment ontology, privacy database, cloud or API edits.
- Asks the tester to prelabel **one full garment per photo** (or Not clothing) before pressing Check recognition. Labels remain frozen. Recommended 5–10 original phone photos: top, pants, skirt/dress, jacket, shoes, optional negative.
- Shows distinct per-photo verdicts after scoring: accepted correct category and subtype; matching category but **wrong type**; **wrong automatic category**; uncertain **needs manual review** (never called successful automatic recognition); non-clothing rejected or falsely detected; runtime failure. The verdict is derived only from the sanitized `scorePhonePhotos` receipt, shown using `textContent` rather than raw diagnostic strings.
- Clearly describes the private, experimental status; real photo files stay in browser memory and are not included in the download. The existing JSON output stays unchanged, including pre-inference category/type labels, timings, errors and coarse recognition receipts; it includes NO filenames, source photo bytes, credentials, owner emails or account IDs.
- Explicitly reports wrong automatic category totals. The summary's broad category-matched count may include confirmation needing review, and must never be described as fully automatic accuracy.

### Required verified acceptance before household test
1. Full Node application regressions + native build PASS on exact final commit.
2. Actual pinned FashionCLIP browser worker on Chromium and WebKit at phone-size 320/390/430 widths; original licensed positive and nonclothing negative; pre-inference labels frozen; show honest per-photo results; downloadable sanitised JSON; no horizontal overflow; restart cancels worker.
3. Reviewer tests 5–10 genuine new smartphone clothing photographs on her own browser; parent should provide UI instructions and take explicit consent before sharing any sanitized results. A two-human independently held-out cohort, real iPhone Safari/Android Chrome timing/memory, and complete secure cloud/3D acceptance remain OPEN.

## Trial decision
**Do not invite wife via an unverified URL or activate accounts based only on a passing CI run.** A green research PR may be suitable for a parent-controlled locally hosted demo or an explicit owner-authorized separately isolated preview. The current GitHub Pages / production URL may not contain this P829 change. Issue #255 holds all releases; existing production/staging stay untouched.

Separately, [P828 pinned SegFormer source-failure audit](https://github.com/nickhaney916-lang/Closet-Current/pull/868) successfully identified 13/23 publisher garment instances missed in BOTH browsers. That concerns `whole-outfit` separation, not single-item FashionCLIP category recognition. P829 does not claim to improve either model's measured accuracy.

**Neither real family-alpha release nor P829 verification may be asserted before exact-head CI and authorized demo access.**
