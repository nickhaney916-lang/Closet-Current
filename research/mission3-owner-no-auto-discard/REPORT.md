# Mission 3 — Never auto-discard an original photograph from a quality or duplicate heuristic

**Family Alpha HOLD #255 OPEN. Draft only; no merge, production/staging deployment, hosted Supabase, physical phone or private owner wardrobe access.**

Parent [Mission 3 draft PR #1001](https://github.com/nickhaney916-lang/Closet-Current/pull/1001), verified HEAD `83199f13294f0b8ac64650699cef923e350adaea`.

## Source-verified photograph-loss risk
Production `public/app.js` `recognizeItem(item)` historically performed a destructive `persistDraft({required:true,mode:'remove',expected:expectedDraftForRecognition})` after `checkPhoto().blank` or an exact-match test against saved/review items. The transaction correctly used per-row CAS to avoid harming other tabs, but the **owner's selected original JPEG was automatically deleted** without consent. A quality heuristic can misclassify dark/solid fabrics as featureless; an exact duplicate photo may be a separately imported capture that the owner wishes to keep as a viewing angle or record. An automated model result is not human permission to discard photographs.

Candidate capture still rejects an exact byte-identical newly presented photograph when another copy already exists. This milestone specifically protects **already accepted and durably saved pending originals** from destructive recognition decisions.

## Solution
- A blank/featureless quality flag is a **review suggestion, not a deletion**: set `localAnalyzed=true`, leave original JPEG/source proof and review ID unchanged, and show `Original photo kept. Review it in Adjust or remove it yourself.` No learned-label assertion or model request.
- An exact-match during analysis sets `possibleDuplicate=true`, `localAnalyzed=true` and displays an explicit owner-review instruction. Neither merges physical garments nor deletes the pending original.
- The existing `finally` compare-and-swap private status update persists only the individual draft when the original row is still current. Stale two-tab edits continue to win; the owner can explicitly invoke the existing source-safe Remove operation. Cloud backup, SHA proof, device writes, auth and 3D logic unchanged.
- Two inherited exact-source test suites were updated to protect source originals instead of expecting heuristic deletion.

## Evidence design
- Source-executed Node + native fake IndexedDB tests: exact owner source JPEG+SHA retained through blank and duplicate decisions, second-tab pending JPEG retained, no model calls on blank quality, classification not invented, explicit owner CAS removal affects only selected row.
- Native Chromium and WebKit at 320/390/430 CSS px: actual owner private capture and native persisted IndexedDB, synthetic hash-matched JPEG, checkPhoto blank and exact-source case; verify both originals remain stored; confirm true page reload retains both originals, owner explicit Remove affects only one; second owner sees no photos. All off-host traffic intercepted and blocked.
- Exact parent six-file no-deploy GitHub Actions re-run all inherited suite and signed disposable PostgreSQL two-owner RLS/browser checks.

**Verification status** must come from final exact-head CI; never use previous run as success for this change.

## Remaining release gates
Human-reviewed genuine photographic recognition performance, authorized hosted Supabase live recovery/session revocation, actual Android Chrome and iPhone Safari physical cameras, 3D cloth fit/drape realism, full parallel-Mission integration, and explicit owner sign-off. Family Alpha remains HOLD #255.
