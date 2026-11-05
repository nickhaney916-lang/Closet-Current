# Closet Current — REVIEWER-CHECKPOINT-INTEGRITY-63

**Research only. Family Alpha Issue #255 HOLD. Never merge/deploy/modify production or existing staging.** Verified exact baseline: BLIND61 research HEAD `aa45e0df890bdd405e4a494bed8941bb1731d761`; dedicated [BLIND61 no-deploy GitHub Actions #42064775010](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42064775010) SUCCESS (664 Node, 12 real browser cases, 59 original sources).

## Priority and defect

BLIND61 shipped a reliable local original-JPEG reviewer interface and exported **partial JSON** for real humans to annotate clothing category, subtype and color. However, there was **no safe way to import the same review JSON and resume where the person stopped**. Reloading or switching devices reset all 59 in-memory responses. A reviewer could accidentally re-answer old items or mix another reviewer’s responses. A partially loaded stale JPEG could also be mistaken for a new source while fast navigating.

## Engineering implementation

- Adds `resumeFile` to the offline original photo reviewer UI, enabled only after importing the same source-locked A, B or C reviewer packet.
- Importing the packet verifies its **SHA-256 canonical packet identity** in the browser before exposing any labels. The browser hash detects accidental mismatches; since packets are not digitally signed, an external trusted source audit remains essential.
- Source packets are capped in file size and item count; reviewers cannot import arbitrary categories, previous model scores or other reviewers’ answers into the source packet.
- Resume supports exact packet ID, role, reviewer identity, unique sample IDs and SHA-256 source matches, valid human-specific category/subtype and primary/secondary colors, explicit uncertain/out-of-scope annotations, accurate partial/completed flags, timestamps and bounded notes.
- A bad checkpoint is rejected **without overwriting any existing valid observations**. Different source packet, swapped photo SHA, duplicated item, conflicting reviewer identity, fake completeness/independence, invalid clothing category, impossible colors or extra untrusted metadata are refused.
- A resumed reviewer must **re-acknowledge independence** before recording or exporting. Resume reopens on the **first unreviewed original photograph**, while prior responses remain available when navigating back.
- No server sync, browser gallery, localStorage, sessionStorage, IndexedDB autosave or customer photo uploads. Manual export remains required, with a conspicuous reminder when recent observations exist only in memory. If source data are switched while unsaved observations exist, the UI requests explicit discard confirmation.
- A stale JPEG image must match the current displayed source name and finished image load before recording an observation; switching photos cannot authorize labeling the prior image.

## Acceptance

- All existing inherited Node and actual 59-source SHA audits pass.
- 9 new adversarial tests cover exact packet and reviewer identity, SHA swaps, illegal subtype/color/secondary, negative, uncertainty, duplicate ID, fake completeness/independence and canonical SHA identity.
- Original BLIND61 six mobile-width Chromium/WebKit offline reviewer cases and 18 real screenshot SHA checks still pass.
- NEW six original JPEG mobile-width Chromium/WebKit reviewer cases: simulate local 2-row export → reload (no autosave) → same locked A packet → user-selected export import → 2-row restored source/color/subtype → forced independent re-attestation → malicious source-SHA checkpoint rejected with existing rows unchanged → reviewer B packet change isolates A labels. **QA-simulated clicks do not constitute genuine independent human labeling.**
- 30 screenshots across new six reviewer flows are SHA, pixel dimensions and nonblank audited.
- Existing six native original source JPEG private closet/outfit/duplicate/V4 restore/two-owner browser acceptance cases must remain green.

## Remaining scientific work

This priority **does not collect any new photographs or independent human reviewer labels**. Parallel Work #37 separately owns REAL-PHOTO-GROUND-TRUTH-62 actual source acquisition, larger locked dataset and genuine independent annotation. This priority only makes the manual reviewer process recoverable, source-safe and usable.

No statistical category/subtype/color model-accuracy improvement is claimed. BLIND61/Priority #60 existing 59 photos still have **zero verified independent human color annotations**; Family Alpha #255 remains HOLD. No real mobile phones or external human identity verification in this engineering run.

## Final delivery

Strict no-deploy exact-parent workflow, research-only draft PR, evidence artifact with sanitized packets and screenshots (never original JPEGs or human private answers), passing full Node and Chromium/WebKit test results, exact verified HEAD. Scientific verdict remains NEEDS REWORK for real model category/subtype/color accuracy, even if engineering passes.
