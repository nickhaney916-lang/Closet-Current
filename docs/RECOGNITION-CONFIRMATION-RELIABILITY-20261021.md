# Recognition confirmation and owner-bound indexing — October 21, 2026 Pacific

Isolated from draft PR #125 exact head `623eb4af070b6caece11247e79eb3494d8450f98`; that branch and all existing human review/evidence files remain unchanged.

## Reproduced customer-state failures

A strong final classifier result could disagree with a previous inferred type already in the draft. `applyLocalChoice` preserves existing categories/types, so the app could then automatically save that old type even though the new accepted result selected a different garment. Examples in deterministic fixtures: Sneakers/Ankle boots (including high-top interpretation ambiguity), Skirt/Shorts, Dresses/Skirt and shirt/Jacket or Jacket/Coat. These are synthetic result/state fixtures, not newly measured real garment/model mistakes.

An uncertain final retry also set `localAnalyzed=true` while leaving old category metadata. With missing color, `canConfirmReviewedColor` could authorize the old garment identity just by choosing a color. Failed/timeout results need the same persistent hold until a valid retry or explicit Adjust confirmation.

The generic IndexedDB write queue did not independently bind work to its original database and signed-in owner. A delayed editor save or recognition result could reach storage after an account/database replacement, especially when cloud preflight was asynchronous or unavailable. Existing cloud/backend protections remain intact; these new checks protect local writes too.

## Fix

- Set `recognitionReviewRequired` at scan start; keep it across uncertain/failed results and contradictory existing category/type. Valid supported final choices may clear it; manual Adjust confirmation clears it when saved.
- Guard both automatic indexing and color-only shortcuts. Do not silently overwrite existing details or save mismatching old types. Existing accepted broad category + Unknown subtype behavior remains, with no speculative subtype assigned.
- Pin original database and owner across scanning. Bind queued writes to owner/database at submission, check before and after cloud preflight, and notify cloud only while the same context remains current.
- Bind the Adjust editor to its opened account/database/original source and recheck at submit and final queued transaction. Actual type/color corrections persist atomically with draft removal.
- Do not change models, scores, prompts, thresholds, raw RGB photo selection, camera quality from #125, segmentation, source photos, review packets, human submissions or backend schema/config.

## Verification

Fourteen new independent regression cases: **13 fail against the untouched PR125 app**, all 14 pass with the fix. Full local build and suite: **1,344 passed / 0 failed / 3 skipped**. The sole existing fixture change supplies `db:null` to its intentionally missing-original-source harness, which must reject before any storage/model work.

Dedicated exact-head CI runs all Node tests, current exact app/source guard, historical guards on immutable #125, and Android Chromium/iPhone WebKit emulation. New mobile UI fixtures use synthetic 3072×2304 RGB JPEGs and injected classifier responses: all eight conflicts remain in review, real Adjust controls correct type/color, and actual owner-named IndexedDB stores the corrected original-backed record. Also test uncertain shortcut refusal, failed/timeout retry, duplicate suppression, stale editor/account write refusal and recovery in the original account. Existing actual worker timeout tests, cloud owner generation, camera fidelity, original-source imports/duplicates and owned styling also run.

Final exact-head browser/CI evidence is recorded in the draft PR after completion. No real model inference, independent humans, physical devices or hosted customer accounts are part of these state tests. Prior actual model diagnostics remain authoritative and unchanged; no improved accuracy percentage is claimed. Human-gold accuracy remains null. The unchanged model can still make confident errors: independent original-photo human labels and physical Android/iPhone testing remain required. No paid service, Drive Duel edits, merge or deployment.
