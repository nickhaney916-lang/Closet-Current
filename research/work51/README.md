# Work51: source-contour support cleanup — HOLD

Separate development candidate on PR374 `8a1ec778dfa24521eeaa3133d6913becbfbbbd26`. Reuses Work50 isolation, Work49 manual editor, exact source-bound portable recipes and existing Work48 fitting. No model/service/dependency, original re-encoding, storage, Auth or production change.

A new **Find automatic cleanup** action derives a warm-neutral source-support component above a strongly contrasting dark garment. It follows that component with raster-checked small polygons, protecting dark cloth connected to the garment core and nearby neutral trim. It refuses pale/similarly colored clothing, prints below the first dark-cloth boundary, narrow straps, clipped/ambiguous components and unsupported categories. This is a bounded proposal heuristic, not semantic person/mannequin recognition. Pale-on-pale and dark-on-dark separation remain unresolved and keep their previous mask/photo fallback. Hangers, arms, torsos and shoes are not broadly solved.

The planner emits only existing remove-polygon operations (≤32, ≤24 vertices each). No recipe format, source hash, mask base, manual engine or reviewed provider change. It refuses to run over existing manual or recovered edits. Its results require explicit review and can be undone/redone/reset, exported and recovered through the unchanged original-JPEG/base-RGBA/category/dimension-bound recipe. It never marks review or ownership approved. The compiled overlay byte-compares all parent files except the existing review UI, where it inserts the action; independent source audit, recognition, Auth/backup, source JPEGs, fit geometry and edge modes remain identical.

## Actual measured progress

All fifteen licensed photos are evaluated using the same global rules, with no per-photo seeds, polygons, category substitutions or trained-on-fixture thresholds. Only the dress produces a new cleanup proposal: **9,884 previously opaque pixels** removed from the provisional Work50 mask; **143,099** from the separate source-native proposal. These are two variants of one photo, not two improved garments. All source RGB and existing selected interior fabric probes remain exact. Other eight existing masks remain exact and six unavailable masks retain fallback.

Visual inspection shows a substantially smaller mannequin neck / beige neckline band, with actual white piping, black cloth and logos retained in the inspected view. The source-native variant still has a faint outer neck outline and both variants retain shoulder residue and fine edge defects. **REVIEW, not PASS.** Full independent licensed garment truth is unavailable; retained prior opaque pixels are not fabric recall. No licensed accuracy / IoU percentage is claimed.

One action replaces manual placement of the emitted polygon vertices / wand seeds on this example. This demonstrates automatic proposal generation with zero manual seed placements; it does not prove a user-time saving or eliminate the remaining manual corrections. A color-wand prototype produced patchy holes and was rejected. The contour implementation and unchanged baseline remain separately available.

## Reproduce

Use `.github/workflows/work51-isolation-no-deploy.yml` for exact inherited pins and dependencies, then build the original integrated parent, Work50 benchmark and:

```
node scripts/build-work51-isolation-hold.mjs
node scripts/build-work51-benchmark.mjs
node --test tests/work51*.test.mjs
node scripts/test-work51-integration-browser.mjs
node scripts/test-work51-editor-browser.mjs
node scripts/test-work51-browser.mjs
```

Serve localhost and open `research/work51/index.html`. It shows the original JPEG, prior Work50 mask/native output, Work51 proposal, alpha-change map and previous/new fits using the unchanged humanoid and calibration, or truthful photo fallback. Existing manual review is reused. The generated review module is a build artifact produced from the existing editor; no editor implementation is forked.

CI runs Chromium/WebKit 320/390/430, fifteen-photo screenshots, actual new-action→download→reset→import→exact recovery and review/session refusal, inherited private-app save/reopen, manual corrections, Style My New Clothes, three looks, swaps, favorites, saved outfits, ownership/race/rollback and mobile navigation. Auth/cloud/classifier are mocked offline; real RLS/cloud restore and physical phones remain unverified.

Family Alpha HOLD. No merge/deploy, production/staging/provider settings, private family photos, spending or Drive Duel.
