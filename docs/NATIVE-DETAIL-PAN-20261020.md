# Original-image 4×/8× reviewer detail panning

**2026-10-20 — draft follow-up to PR #75.** Isolated human-review tooling; separate from Work PR #74 and the parallel Work session addressing customer camera/recognition issues.

## Usability problem

The original photograph may be millions of pixels wide. At 8× zoom the native-detail window spans only 27.5 original pixels. Previously, to move a few pixels across a seam, the human reviewer had to repeatedly tap a coarse full-image preview—an imprecise task on a phone.

## Fix

Four 48px-minimum touch targets (**Left, Up, Down, Right**) pan the 4×/8× inspection window in **source-pixel coordinates** by one quarter of its current field of view. Pan is clamped to the exact original-image bounds, preserving orientation and the original source digest.

Navigation is **not an edit**: it never mutates mask pixels, creates undo history, edits labels or approvals, changes recognition/indexing, or exports annotations. The buttons are disabled when no valid original source/mask is selected. When pressed during a held precision brush gesture, navigation terminates that gesture before moving the source window, preventing an accidental line between old and new focus positions.

A mobile-width Chromium browser test checks disabled-no-photo controls, finger-sized button geometry, exact original-grid position at 4× and 8×, no pixel/history edits while panning, edge clamps, cancel-before-pan, no ghost stroke after panning, undo/redo integrity and source-change revocation. Existing multi-pointer, stale-photo/draft, magnifier, sparse undo and full original-grid brush tests rerun.

## Boundaries

Zero independently reviewed full-real-photo masks exist in the authenticated registry. Human review from genuine first and separate second annotators and image rights must be independently verified before comparing against mask proposals. This branch includes no production app changes, billable AI, fabricated labels, real physical-phone checks, or Drive Duel edits.
