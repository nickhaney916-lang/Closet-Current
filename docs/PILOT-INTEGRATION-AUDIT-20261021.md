# Closet Current pilot integration audit — October 21, 2026 Pacific

Status: isolated draft integration candidate. **Not approved for a pilot release, merge or deployment.**

## Verified dependency map

| PR/ref | Exact reviewed head | Depends on | Disposition |
|---|---|---|---|
| #123 imported-photo detail budget | `61e4a87672ec603e29d9f10763d25d803ecbb801` | #122 | Inherited through #125/#127; do not apply twice |
| #124 responsive import retries | `5bc60e05dea12d62b97bbcdaf55b4999a3ba695a` | #123 | Four exact reviewed files transplanted into this candidate |
| #125 native still quality | `623eb4af070b6caece11247e79eb3494d8450f98` | #123 | Inherited byte-identically from #127 |
| #127 private phone coordinator | `46f9c521466976b4ec238d24b1eb1d7871e3bffb` | #125 | Base of this integration; complete implementation unchanged |
| #126 recognition/indexing | `5aa60d5e0d4be1e36bf694971385a6e3c340d120` | #125 | Explicitly separate and excluded per assignment; its branch untouched |
| #118 cloud Keep-both recovery | `f16fce2956688e576edde6ecfdc390d3f46158a3` | #115 | Already inherited; tested again, no duplicate patch |
| main | `54c9e29ede069a05d1268e003f80cbda043c7d6a` | Separate production history | Untouched; not used to overwrite the verified draft chain |
| Legacy shared integration | `510ee14d437bbe266e2f7aa463504998ef7a75cb` | Separate long-lived history | Untouched; current explicit #127 checkpoint governs this task |

The common ancestor of #124 and #127 is #123. #125/#127 have no importer runtime edits beyond inherited #123; #124 has no app/camera runtime edits. The only customer runtime difference from #127 is the exact #124 `public/photo-import.js` blob `b2fb984444528c07beec1e388936dad66f47a5d3`.

Reviewed completed exact-head CI: #123 run **39613112036** (1,327 pass), #124 **39616554431** (1,329), #125 **39617982858** (1,330), #127 **39621202895** (1,333). All successful, all zero failures/three skipped; each included supported Chromium/WebKit emulation. Existing #126 is separately verified but is not included or altered here. Older research/measurement branches are not promoted into customer recognition by this audit.

## Changes and conflict resolution

Copy exactly from #124: importer, focused import regression file, real-browser budget/UI-yield test, and its additive import-detail document. Preserve #127's app/camera code, coordinator, Node validator, Auth, cloud/SQL, recognizer, models, masks, styling, original photos, human packets and all evidence bytes. Preserve #127 checkpoint verbatim as a suffix and add a new integration entry.

Do not cherry-pick the entire #124 metadata diff: its old source guard pins the pre-#125 app, while #125/#127 guards pin the native camera app and old importer. Overwriting these would discard newer source proofs or fail even though the customer runtime edits are independent. Leave all historical guards unchanged; rerun each on its exact immutable source. `scripts/check-pilot-integration-scope.mjs` is the current combined gate: permitted-file allowlist, four byte-exact #124 transplants, fixed graph, frozen app125/127, excluded #126, unchanged other tracked files/evidence and prepend-only checkpoint.

This resolves an integration verification/metadata conflict. It does not invent a new classifier or additional customer functionality. The importer bug already fixed by #124 is incorporated: 800×600 sources that overflow the JPEG budget previously repeated 15 identical-dimension encodes; now three quality attempts run once with UI task yields between retries. Native #125 still quality retries, pixel bounds, cancellation and original RGB remain untouched. No conflicts were resolved by weakening the old source pins.

## Reproducible integrated verification

- Local build and full Node suite: **1,335 passed / 0 failed / 3 skipped** (1,338 tests). This equals #127 plus #124's two additional tests, without duplicate application of shared #123 work.
- Current build fingerprint from unchanged builder plus integrated public assets: **`5491ea5da913`**. Both physical-phone exports must later identify this same build; a predecessor build cannot validate the combined candidate.
- New Android Chromium/iPhone WebKit app journey: actual synthetic 3600×2700 JPEG import -> bounded 3072×2304 full-frame JPEG -> injected classifier sees that exact unmasked image -> correct category/color saved to owner-named real IndexedDB -> owned-only styling -> preview and outfit save/reload -> duplicate skipped -> unsaved source restored after reload and a simulated scanner interruption. Test Auth/cloud/classifier are synthetic, not real model quality or hosted-account proof.
- Existing mobile scripts cover import quality/retry responsiveness, native still source quality/cancellation, orientation/color emulation, camera restart/errors, blank MIME/unsupported codecs, original-source crop/duplicate handling, real local IndexedDB owner-switch checks with synthetic remote replies, overlapping Keep-both cloud conflict/retry, owned styling/swap/save/reload/storage failures at 320/390/430px, and source-preserving transparent preview canvas at 1x/3x in both engines.
- Exact #127 offline coordinator regenerated unchanged and tested in both engines against the authoritative Node comparator. Private reports remain absent; synthetic passing fixtures never authorize release. Generated coordinator and machine-only screenshot/QA artifacts are separate from human evidence.

Exact final integration commit, Actions run, browser results and any corrected harness failures are recorded in the draft PR after verification. No claim of successful browser integration should be made before that final run is confirmed.

## Prioritized launch-readiness checklist

| Priority | Gate | Current status / required evidence |
|---|---|---|
| P0 | Recognition/indexing safety from separate #126 | Not included here by instruction. Review its completed fixes and combine in a separately verified candidate before pilot use: contradictory old types, uncertain color shortcut and delayed local writes across accounts are known concerns absent from this integration. Never assume #126 is inherited through #127. |
| P0 | Real garment category/color and saved-photo evidence | No new human gold. Obtain genuine independent original-photo observations, reconcile ambiguous high-top footwear, dress/skirt, shorts/skirt and outerwear; retain raw independent submissions privately. Actual recognition accuracy remains null; no model promotion. |
| P0 | Actual Android and iPhone on the same final candidate build | Zero actual physical-device reports supplied here. Test native camera/import, sharpness/orientation/colors, uncertain confirmation, saved photos, drafts, previews, swaps, reload/background recovery and cloud interruptions. Use Device help's 17 checks, coordinator and separate Saved Closet/Photo-Check evidence. Authentic hardware/operator evidence required. |
| P0 | Hosted private account/restore and login verification | Actual consented test accounts must verify email link expiration, canonical host/redirect, two-account separation, cloud sync/Keep both, refresh/logout, fresh-device restore and failed-network recovery. Synthetic REST/RPC and local IndexedDB checks do not prove hosted Auth/RLS/SMTP/storage behavior. No hosted settings changed in this task. |
| P0 | Review and explicit pilot hosting/release decision | This is an unmerged draft with blockers, not permission to publish it. Preserve existing production and customer data. Agree a small consented test cohort, rollback/recovery and private evidence handling before any approved pilot deployment. |
| P1 | Real preview appearance and figure rights | Machine tests verify retained source pixels, canvas bounds, pattern/alpha and layout, not human fit quality or figure-distribution rights. Validate appearance with testers and resolve outstanding asset provenance/distribution approval before wider/public use. |
| P1 | Physical-device performance and recovery | Measure decode/classification times, memory and battery on actual phones; a single canvas JPEG encode remains synchronous. Check low storage, unsupported codecs, repeated backgrounding and slower network/model downloads. |
| P1 | Re-audit parallel changes against the selected final commit | Recheck #126 and any later branches without overwriting this source audit. Rerun source/regression/mobile checks after every integration. Do not accept stale earlier CI or production-main tests as final candidate evidence. |

No merge, deployment, paid inference/services, real customer-data access, Drive Duel edits, human-label manufacture or physical-phone validation occurred. Existing account isolation and independent evidence are preserved; a software integration pass does not close the launch gates above.
