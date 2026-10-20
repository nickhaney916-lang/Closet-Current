# Local original-grid annotation — sparse undo and redo

**2026-10-20.** Main-thread development branch stacked on PR #71; separate from integrated customer styling PR #69, native 3D figure artwork and the production app.

## Concrete performance bottleneck

The independent first-human annotation editor formerly created a **complete copy of its native-resolution mask** at the beginning of every brush stroke or filled polygon. The safety limit is 12,000,000 mask pixels. With three undo snapshots and three redo snapshots, that can temporarily hold tens of megabytes, even for a one-pixel correction. This creates unnecessary mobile memory pressure while tracing a collar or hem.

## Implemented

- A change transaction saves **only original-grid 128 × 128 tiles first touched by the stroke**. Subsequent brush movement in the same tile keeps the exact mask state from before that stroke; each tile is copied once.
- Undo applies only saved original-grid tile bytes, capturing their inverse into redo. Multiple strokes, small eraser corrections, polygon fills, three-level history, source changes and draft restores follow the same stack semantics.
- RGB sources, annotation masks, first/second human review metadata, native JPEG hash and source-grid RLE remain unchanged. The local fitting/customer workflow is not edited.
- A genuinely large polygon may legitimately require many tiles; memory savings apply particularly to small strokes and small corrections. It is **not** a promise of constant memory or faster rendering in every scenario.

## Measured browser evidence

A mobile-width Chromium browser emulates a 1.4-million-pixel source, draws two individual brush edits, verifies stored undo bytes against the old full-mask snapshot cost, then proves **byte-identical mask SHA-256** through undo, redo, replacement edit, polygon fill and erase. The previous dirty-region rendering browser suite and first/second reviewer delayed-original tests also run in CI. The UI continues to prevent source changes from resurrecting a stale draft and never enables review without genuine human confirmation.

Browser emulation and synthetic photos do **not** provide physical-phone FPS, real mask accuracy, independent human labels, commercial clearance or the real-first/second-person review record. Twelve original photographs remain unapproved, and their clipping accuracy is unmeasured.

No production merge, paid AI services, private photo uploads or Drive Duel changes.
