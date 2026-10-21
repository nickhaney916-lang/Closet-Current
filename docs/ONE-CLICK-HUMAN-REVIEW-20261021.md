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

## Partial draft recovery (October 21 follow-up)

The original single-page reviewer lost unfinished answers when closed. The new **Save partial draft (JSON)** control saves the currently recorded rows and optional alias to a file on the reviewer's device. **Resume saved draft (JSON)** reads that file in the same offline page after all 13 original JPEGs have again passed SHA-256 verification. Reviewers can resume without repeating their completed family observations, while retaining access to the full original images.

- The draft has a dedicated `DRAFT_UNREVIEWED` status and exact packet SHA-256. It is **not** a final reviewer submission; it cannot be passed as a `REVIEWED` file to the existing human-intake audit.
- Import is all-or-nothing. It rejects unexpected/missing fields, wrong source packet or JPEG identity, missing/duplicate source IDs, invented family names, invalid uncertainty, malformed timestamps, oversized files, and missing visible evidence. Failed imports do not erase existing observations.
- The app **does not** store or restore human attestations: reviewers must check them truthfully again before the final export, even after a valid draft loads. No automatic storage, account transfer, upload, tracking, final answer or claimed human accuracy is added.
- Use **Save partial draft** before closing the browser, and preserve the downloaded `review-draft.json` privately. Choose **Resume saved draft** to restore it. Only the separate **Download reviewed observations** button produces final human-review JSON after full coverage and fresh attestations.

Automated browser QA uses deliberately synthetic sample observations to exercise the round-trip, tamper refusal and reset of attestations. These are not independent human judgments. Physical-device confirmation remains outstanding. The software review priority may be considered complete only after the exact final branch SHA passes source/Node and both-browser CI.
