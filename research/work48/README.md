# Work48: rigid sleeves, shoulder coverage and waist placement

Independent development branch on PR363 `6689b4f23016b1b1886e16a0fdb4aad0d347e98c`. Production is untouched. Family Alpha HOLD.

This extends Work47's actual-pixel fitting pipeline. PR361's sampled panel-coverage floor and canvas-bound checks remain. PR362's existing humanoid face/hand/neck path definitions and PR363's reversible alpha-only edge cleanup are reused unchanged. The before renderer is the exact pinned PR363 fit module, with its import path relocated only.

The old blouse polygons left some opaque source fabric unassigned and assigned some twice. They rotated about independent pivots and pulled cuffs inward. New source-exclusive sleeve polygons and their torso complement preserve sampled source coverage, rotate around actual manually marked shoulder attachments, and put the sleeve behind the torso. A raster check refuses a separated shoulder/underarm join before replacing the current preview. These checks do not certify realism or mask truth.

Five calibrated profiles adjust shoulder width/height, dress proportions and skirt waistband placement. Every panel remains a uniform scale plus rotation/translation: no independent stretch, recoloring, generated cloth or fabricated shoes. A collar alpha mask keeps the existing neck anatomy from painting skin over opaque garment fabric; the existing face and hands remain in front. A face-collision check refuses large material overlap rather than silently concealing it.

The protected offline editor now supports proportional width/length, shoulder tilt, horizontal placement and vertical/hem alignment; the hem control explicitly moves the entire garment. Users can trace each sleeve beginning at its shoulder attachment and ending at its underarm, then adjust that sleeve's angle. Source outlines, fit coordinates and alpha derivatives stay volatile under the existing user/session/source guard. Reset restores the reviewed source. Detached views dispose their source references and controls.

The new `/research/work48/index.html` localhost prototype uses the same fifteen originals and the same nine provisional cutouts, not new masking proposals. Five supported profiles show original, cutout, prior fit, new fit, and attachment/waist close-ups. Ten unsupported sources retain fallback. **PASS 0 / REVIEW 5 / FAIL 10 remains unchanged.** No owner approval is implied.

Reproduce:

```
npm install --no-save --no-package-lock sharp@0.34.3 playwright@1.56.1 fake-indexeddb@6.2.4
node scripts/build-work47-parent.mjs
node scripts/build-work47-benchmark.mjs
node --test tests/work47*.test.mjs tests/work48*.test.mjs tests/work43/*.test.mjs tests/work46-session-races.test.mjs
node scripts/test-work48-integration-browser.mjs
node scripts/test-family-alpha-51-mobile-nav-browser.mjs
node scripts/test-work48-browser.mjs
```

The full matrix is Chromium/WebKit × 320/390/430 × fifteen sources. Test-only Chromium smoke flags do not apply in CI. The inherited protected app build checks every parent asset except the pre-existing offline boot/UI hook byte-for-byte; recognition, originals, private storage, Auth, backup, styling and navigation logic are unchanged.

Remaining: manual sleeve annotations, source-pose/perspective mismatch, fringe, imperfect underarm occlusion, no cloth simulation, occluded garment reconstruction, single-shoe references, no persistent fit, and no physical-phone/live-account validation. Sleeve tracing can choose a poor boundary despite geometric guards; a reversible REVIEW preview is not an accepted garment. All angles can be refused when they detach fabric, clip the frame or cover the face. No merge/deploy, provider changes, accounts, private family photos, paid services or Drive Duel changes.
