# First-human original-grid review — multi-pointer and gesture interruption safety

October 20, 2026. An isolated follow-up to draft PR #73, with Work-owned outfit recommendation PR #74 and production app untouched.

## Concrete original-photo correctness risks

- The main brush followed any `pointermove` while `painting` was true. A different finger or pen could write an unwanted line to the real human mask. The 4×/8× precision editor similarly failed to confirm moving pointer identity.
- A tap on the large photo when precision editing was enabled **marked a garment pixel** even though the user may have only intended to navigate to a new detail region.
- Lost capture or canceled touch gestures and zoom changes could leave the previous brush stroke using the wrong magnifier pixel mapping.

## New behavior

- Main brush and precision magnifier each have one explicit active pointer ID. Secondary touches, foreign pointer movements and non-primary down events cannot affect the current mask or move its focus. A current pointer's up/cancel/lostpointercapture releases ownership.
- The main photo becomes **navigation only** when precision mode is enabled: tap to position the 4×/8× magnifier, then mark or erase ONLY inside its separate overlay.
- Changing 4× ↔ 8× during a stroke ends the prior stroke before using the new pixel mapping. Switching tool/precision-mode or source photo also clears pointer owners.
- Interrupted strokes remain visible and undoable by the first human; no synthetic sign-offs are created or hidden history exported. Source-native RLE, original JPEG pixels, original-before-clipping recognition, sparse undo and original-grid brush remain unchanged.

## Test evidence

The new mobile-width Chromium test paints with a real pointer and dispatches foreign simulated touch gestures. It verifies original mask pixel counts and magnifier center do not change from second-finger events, supports normal pointer gestures, cancels an active main brush, loses capture in the magnifier, changes zoom mid-stroke, tests navigation-only source tapping, undo after interruption and switching original photos. The full Node suite and previous five browser tools are re-run.

This is a safety/correctness test of browser events, not verification of real physical touch hardware or real-photo clipping accuracy. The 12 original photos still require actual first and independent second person annotations and rights proof. No deployment, merges, paid AI or Drive Duel edits.
