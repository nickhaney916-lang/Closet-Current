# Closet Current — Priority #98 / SOURCE97-INDEPENDENT-HUMAN-REVIEW-HANDOFF-98

**RESEARCH ONLY · Family Alpha Issue #255 HOLD · no merge, production, existing staging or other-project modification.**

## Verified exact parent

Priority #97 [draft PR #652](https://github.com/nickhaney916-lang/Closet-Current/pull/652), HEAD `31e47ee9f2dcd621fb380bd280ff88c986c219d1`, [no-deploy CI #42162743091](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42162743091) SUCCESS: 899/899 Node, seven independently redownloaded original Commons JPEG SHA/dimensions verified, six original-photo human-annotation UI browser workflows and 20 source screenshot audits.

## High-value next blockage resolved in research tooling

The seven P97 photos were verified but had no ready, isolated path into the P94 exact-source-blinded independent human polygon workflow. P98 provides that handoff **without accepting or scoring any labels**.

- A standalone Node research script downloads the seven **original** Commons JPEGs over strict HTTPS; refuses redirected, oversized, unpinned, SHA-incorrect or dimension-incorrect photos before writing any reviewer package. Preserves the original image bytes; no resizing.
- The script generates three separate folders, one for each human role **A, B, C**, with only that role's canonical P94 blind packet and a private copy of P94's unchanged original-JPEG polygon UI. Each packet contains just source ID, original JPEG name and original SHA-256. It excludes model predictions, old labels, and holdout status.
- Each folder contains all seven pinned JPEGs, a clear local usage guide and author/license attribution. All photo packages are written **outside the Git repository** in a fresh 0700 OS temp directory; originals and QA JSON exports are never committed or placed in GitHub Actions artifacts.
- A read-only HTTP server binds to **127.0.0.1**, serves only the known annotation HTML and specifically scoped r97 JPEG paths, and rejects POSTs, JSON reads, and arbitrary paths. The existing UI re-hashes each original JPEG with WebCrypto *before* an annotation is allowed. Review exports remain local downloads, with no server-side POST or autosave.
- The same packets let two actual independent humans manually trace overlapping garments, choose category/subtype/primary/secondary color, or explicitly record no garments; conflicting A/B human results require independent C adjudication. The workflow **does not create, recruit, certify or impersonate human reviewers**.
- A new genuine Chromium/WebKit original-JPEG browser smoke across 320/390/430 CSS pixels checks client loading, actual image canvas pixels, role-locked P94 packet import, polygon entry and source-bound QA export. QA robot clicks are **not human labels**. Metadata-only screenshot SHA/dimensions; no screenshot or JPEG upload.
- Research-only adversarial tests reject source-byte edits, duplicated SHA, wrong host, missing real annotation UI, public JSON responses and server POSTs. Workflow checks the strict P97 exact parent, the five P98-only changed files, full inherited Node/build, P97 strict originals, new P98 local handoff and browser QA, inherited P94 original-photo browser checks and screenshot audits.

## Run locally (public research originals only)

From the research branch working copy:

```bash
npm install --no-save --no-package-lock sharp@0.34.3 playwright@1.56.1
node scripts/prepare-source97-review-98.mjs --build
# Copy ONE reviewer-A, reviewer-B or reviewer-C folder to each independent person.
node scripts/prepare-source97-review-98.mjs --serve "/tmp/<generated-folder>/reviewer-A"
# On the same device, open http://127.0.0.1:8787/research/independent-instance-ground-truth-94/annotate.html
# Use the local file picker to import packet-A.json; annotate and export.
```

Each real human must personally attest independence. A downloaded file by itself does not prove that identity or prevent collusion. The person must preserve their exported review privately; no customer/private family photos belong in a public issue or CI.

## Scientific / release status

- Original frozen benchmark: **59** source photos, unchanged (32 development / 11 validation / 16 locked).
- Prior P96 quarantined model-exposed originals: **2**, unchanged.
- P97 candidate originals: **7**, source-SHA verified but **QUARANTINED**; model-exposure audit and independent legal audit still pending.
- P98 new independent actual human masks: **ZERO**; zero person-confirmed reviewers; no production model weights changed.
- Still **41 additional independently eligible sources short of the >=100 source target**; the 7 quarantine photos are not silently promoted. No independent instance IoU, per-garment recognition, category/subtype/primary/secondary color accuracy or 3D photorealism PASS.
- Physical Android/iPhone camera, signed live cloud account/RLS, 3D fabric realism and Family Alpha remain **HOLD**.

**Engineering evidence: pending dedicated exact-head no-deploy CI.** Historical unrelated strict branch-wide scope workflows may remain red; do not weaken them or represent this draft as merge-ready.
