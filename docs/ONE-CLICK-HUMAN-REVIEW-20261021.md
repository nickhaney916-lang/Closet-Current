# Closet Current — easier independent original-photo review
October 21, 2026 Pacific. Development QA only; no deployment.

## One file to open
Prior PR #117 required each reviewer to locate and select 13 original JPEGs. This add-on creates one offline `OPEN-REVIEW.html` with all 13 unchanged source-locked original JPEG bytes embedded. Opening it triggers the browser to recompute SHA-256 of all original bytes before enabling any observation. There is no account, network request or file picker. Previous/Next buttons allow simple navigation; after recording, the page moves to another unreviewed photo. The unchanged reviewed form still requires visible evidence, family, explicit uncertainty and five truthful attestations. It exports JSON only when every photo has been independently reviewed.

## Source fidelity and independent-human constraints
The packet-preparation script refuses to build if any source is missing or its original JPEG bytes differ from the frozen, pre-inference source manifest. All 13 remain original, not cropped, reencoded, masked or resized. Existing PR #117 stale/incomplete-image recording denial remains present. The HTML contains neutral source IDs and hashes, no photographer captions, proposed categories or model results. The original source EXIF and separate post-review attribution file remain unchanged; real blinding still requires reviewer integrity and procedural verification.

Two genuine human reviewers must independently inspect and download distinct JSON submissions, and return them separately. Alias and checkbox attestations alone do not authenticate people; even matching coarse labels are not approval for exact subtypes, garment counts, masks or production. No automatic review completion, AI-generated human answers, model promotion or release.

## Limitations
The one-file page is larger than 30 MB, potentially around 40 MB once the original photographs are base64 encoded. It is intended for offline computer browsers first. Chromium and WebKit touch emulation is not real Android/iPhone validation. The page does not auto-save a draft, and people must download their observations before closing. Original artist credits must be retained on redistribution. No actual human review evidence, accurate subtypes or customer wardrobe save results are asserted. Human-gold accuracy is **null**, classifier promotion **BLOCKED**.

## Use
Download the exact-head Actions artifact named `one-click-blind-original-photo-reviewer-no-labels`. Extract and open `OPEN-REVIEW.html`; read `START-HERE.txt`. Keep `CREDITS-after-review.txt` with the packet but do not consult source credits before reviewing. Return the exported JSON separately. When two actual humans have reviewed, use the unchanged `node scripts/source-holdout-human-review.mjs audit RESULTS.json FIRST.json SECOND.json` to validate packet identity and disagreement; the audit still blocks gold-label promotion.

## Boundaries
All deployed runtime, Supabase SQL/Auth/RLS, original images, FashionCLIP, taxonomy, masks and segmentation, style generator, private cloud account isolation, saved customer closets, paid services and Drive Duel remain untouched. Development-only branch; do not merge or deploy without approval. Final exact-head verification must be checked in the new draft PR.
