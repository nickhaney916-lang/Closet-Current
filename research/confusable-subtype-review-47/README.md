# CONFUSABLE-SUBTYPE-REVIEW-47 — high-confidence wrong clothing type human-review gate

**Main controller RESEARCH ONLY. Family Alpha GitHub Issue #255 HOLD. NEVER MERGE, MODIFY production/existing staging, or deploy.**

## Exact verified parent and scientific reason

[Main-controller #46 PR #604](https://github.com/nickhaney916-lang/Closet-Current/pull/604) exact final source commit `76867d53e183729e7799e69de098aa6b7ade59a9`, dedicated [no-deploy GitHub Actions #41942862433](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41942862433) **SUCCESS** (587/587 Node, 42/42 actual Chromium+WebKit research browser scenarios at 320/390/430, 73 SHA/pixel-audited PNG screenshots and 35-source provisional color comparison).

Independent recognition research [Parallel #32 PR #599](https://github.com/nickhaney916-lang/Closet-Current/pull/599), **NEEDS REWORK**, observed broad category **8/13**, correct subtype **4/13** and **three confidently accepted WRONG subtypes**:
- `commons-0003` true T-shirt but FashionCLIP predicted Sweatshirt.
- `commons-0014` true Blouse but model predicted Tunic.
- `commons-0078` true Sneakers but model predicted Ankle boots.

The existing real FashionCLIP review UI showed `itemType` when the model reported `strong:true`; this is NOT calibrated probability, and the above failures show real danger. The user still had to confirm before save, but incorrectly specific advice invites mistaken confirmation. A safe improvement is **withhold those risky type claims while explicitly showing candidate versus alternative**.

## What changed

- `recognition-review-42.mjs` adds pure `guardConfusableSubtype47` for the three historically verified confusion pairs, **bidirectionally**: T-shirt ↔ Sweatshirt, Blouse ↔ Tunic, Sneakers ↔ Ankle boots. It only fires when local FashionCLIP actually emitted a schema-valid, strong candidate for Tops or Shoes. The crop result retains its category/color *as unverified suggestions*, sets specific `itemType:null` and `status:'category-only'`, and exposes **bounded `subtypeReview47`** with candidate, alternate garment type, constant known-confusion reason and `needsConfirmation:true`. Full-original photo output remains context only; it cannot rescue missing crop labels. Other garment types such as Jeans, Hoodie, Tall boots continue using existing normal adapter logic. This is **not** a new subtype classifier, scientific accuracy improvement, likelihood calibration or proof that the two options cover the actual garment.
- Native garment review card displays **“Subtype needs manual comparison: Sweatshirt or T-shirt”** when applicable. It does not choose either value in the category/type dropdowns and cannot check the user's confirmation. User explicitly inspects the original and crop, selects the correct category/type/color and saves via existing atomic owner-private transaction.
- `atomic-group.mjs` continues #43 strict final selected category/subtype/color validation. It stores only the bounded approved ambiguity marker beside sanitized `recognitionSuggestion42` with `itemType:null`, source piece identity/crop, original JPEG SHA, and the **separate** human-verified saved type. Reject arbitrary/mismatched pairs, malformed flags or worker metadata. #44 confirmed noncolor learning, #46 unverified reviewed primary/secondary pixel advice, #41 color authority, #38 frozen late worker, #34 owner/epoch, duplicate atomic and V4 backup are unchanged.
- Genuine archived licensed original `commons-0003` (source SHA independently pinned) was previously seen in browser CI making the incorrect Sweatshirt suggestion. New genuine Chromium 390 replay asserts an actual **manual comparison warning**, category-only model evidence and saved human-corrected T-shirt/Black in real owner-private IndexedDB. No fake correct model labels.

## Engineering & research verification

- Exact parent #604 ancestry, no-deploy changed-file allowlist.
- Application build and full inherited 587 Node plus six new substantive confusion/mock worker/source-locked original JPEG and owner-private IndexedDB safety tests.
- All inherited six browser suites × 6 Chromium/WebKit 320/390/430: source photo epoch, immutable owner save, late worker finality, manual pixel/color authority, strict subtype category commit, confirmed type-learning.
- Six actual FashionCLIP original+reviewed-crop → native private wardrobe/outfits/backup/restore/owner-B denial research browser scenarios as before, with **new actual archived black T-shirt** conflict and persisted bounded marker check. Independently SHA/dimensions/pixel audit 73 genuine screenshots and six contact montages.
- Historical independent 13-photo FashionCLIP category/subtype quality figures are **not new measurements**, and these targeted guard rules **reduce coverage** for these six type values rather than proving the model is more accurate. Neither newly independently adjudicated 100–200 photo holdout nor actual two-human correction ground truth/automatic detection mask/real signed Supabase/physical phone acceptance is supplied.

**Verdict criteria:** engineering PASS requires exact-final-HEAD no-deploy CI successful, including true original/crop model and human-approved saved row; scientific classifier category/type/color remains **NEEDS REWORK** and Family Alpha remains HOLD irrespective of any engineering pass. The main controller alone can authorize a future release.
