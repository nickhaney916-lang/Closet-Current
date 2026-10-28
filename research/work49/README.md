# Work49: reversible source cutout refinement — HOLD

Independent branch on PR368 `7feb8110775b7195eb68f89fbcdfb1585f4ad597`, preserving integrated PR367 fitting, atomic redraw, PR365 opaque-background rejection, existing anatomy, private source/audit/wardrobe storage, and PR363 edge cleanup. Production and provider settings are untouched.

The existing Work35 cutout-review interface now adds source-pixel add, initial-alpha restore, selected one-native-pixel edge softening, a bounded local connected-color background wand, brush sizing, 1×/2×/4× zoom/pan, redo, undo and reset. Every actual edit clears the explicit review checkbox. Confirmation still requires a trusted action and current source/account; the unchanged private provider independently replays the operations and audits the resulting RGB against the original JPEG before returning a temporary presentation. Recognition and indexing still use the original.

No unseen fabric or pixels are synthesized. Add reveals RGB already present in the same audited crop and is capped at 3% of initial opaque foreground (with a 32-pixel floor for tiny fixtures). Restore returns to initial alpha. The wand is seed-local, color-tolerance bounded to 24, circle-limited and capped at 3% removal per action; it never automatically searches for skin, mannequins or garments. Existing overall removal safeguards remain. Softening only affects the selected frozen-alpha contour ring. These are defensive limits, not segmentation accuracy or fabric-preservation proof.

`build-work49-cutout-hold.mjs` overlays exactly the existing review UI and mask replay module on the protected compiled app and adds the pure refinement engine. Every other parent asset is byte-compared, including independent source auditing, recognition, storage, Auth, atomic fitting, opaque-background rejection and backup. Original JPEGs and reviewed input PNGs are never rewritten; candidate masks are separate transient derivatives. No new wardrobe save or cloud storage path is introduced.

The existing Work48 page is extended in place with original/existing/refined cutouts and previous/refined garment fits plus close-ups. Its Refine button reuses the same review editor. New candidates are staged before replacing the safe preview. The PR368 manual-review panel is reused: edited rows are reset to NOT_REVIEWED, and importing an older review cannot restore grades for locally revised rows. No human decision is auto-generated; all exports remain HOLD and ownerApproved:false.

## Current visual evidence

The source-bound dress proposal removes residual mannequin material outside the genuine shoulder piping and selected near-white hem contamination. It changes 19,313 native alpha pixels, removes 8,643 previously opaque pixels, retains 99.56% of the prior opaque mask, preserves all RGB and all selected interior fabric probes. These are manually delimited nonfabric test regions, not full independent ground truth; do not call the retained foreground fraction fabric recall or an IoU score.

Other four supported examples use small selected contour-softening proposals (22–304 native alpha pixels). Some differences are subpixel at avatar size; they are not claimed as clear realism improvements. Nine cutouts remain provisional, six unavailable. Unsupported pants, shorts, jackets, back-view coats, clipped dresses and single shoes retain their existing source-photo/reference fallback. No grade promotions: **0 PASS / 5 REVIEW / 10 FAIL; Family Alpha HOLD**.

Reproduce the source-pinned parent, then:

```
node scripts/build-work49-cutout-hold.mjs
node scripts/build-work49-benchmark.mjs
node --test tests/work47*.test.mjs tests/work48*.test.mjs tests/work49*.test.mjs tests/work43/*.test.mjs tests/work46-session-races.test.mjs
node scripts/test-work49-integration-browser.mjs
node scripts/test-family-alpha-51-mobile-nav-browser.mjs
node scripts/test-work48-visual-review-browser.mjs
node scripts/test-work49-editor-browser.mjs
node scripts/test-work49-browser.mjs
```

The browser matrix covers Chromium/WebKit 320/390/430 and all fifteen licensed originals, plus the actual protected app, editor undo/redo/add/restore/reset, explicit review, session interruption, original-photo saving, source/account invalidation, swaps/favorites and twelve storage fault probes. Software checks do not grant visual acceptance. Physical phones and real account/RLS validation are separate and untested here.

Remaining: reliable general automatic isolation, ambiguous pale fabric/background boundaries, opaque contamination outside marked areas, fine trim/straps, missing or occluded fabric, all six unavailable cutouts and five single-shoe/front-view limitations. Manual edits can still be semantically wrong despite bounds and exact RGB; compare the original and retain fallback. New edits remain volatile; no durable mask/fitting storage is claimed. No merge/deploy, staging/Supabase/Cloudflare changes, accounts, private family photographs, paid services, spending or Drive Duel changes.
