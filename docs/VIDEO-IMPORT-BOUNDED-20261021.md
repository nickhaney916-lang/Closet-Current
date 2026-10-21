# Video upload: bounded photo sampling and account-switch protection

**21 October 2026 — isolated draft software change on verified PR #131; no deployment.**

## Problem and fix

In Add clothes → Choose a closet video, a 3-minute clip and selected 5-second interval could queue roughly **36 potentially large JPEG frames** with no per-clip bound. Each JPEG can approach the existing 2.85-million-character limit. Mobile browsing may become slow or memory constrained. The old extraction loop also continued awaiting asynchronous `seeked` events without rechecking the signed-in customer and announced a successful review flow even if no new frames were accepted.

Video sampling is now capped at **20 source-frame attempts per uploaded clip**. For clips with fewer candidates, the selected 5-, 8- or 10-second cadence is preserved; longer clips spread those twenty samples across the **entire duration** rather than merely skipping the end. No upscaled pixels, AI prediction rules, original-photo classification, per-photo encoding cap, source transform, outfit styling or saved closet schemas change.

Before reading metadata, after each asynchronous seek, and before queuing a sampled frame, the importer verifies that the original signed-in account still owns the session. A switched session cannot queue additional old-owner video frames. The browser video is paused, detached and its object URL revoked on both success and errors; the buttons recover from failure. If no frames were accepted, the app no longer claims an imported photo is ready. Earlier frames remain reviewable when a later frame seeks fail.

## Limits

The imported video is **not** physically proven to have been shot by the device; the test uses synthetic frames. Existing account-scope defenses and live Supabase RLS still require separate real-account verification. A switch after some frames were queued means those prior original-owner drafts were started under the old session; no new frames can cross the account-switch gate, but release acceptance still requires physical/account testing. Real subject recognition/accuracy remains unknown. This change improves bounded recovery, not model correctness.

Node regression verifies 180s/5s cap, 30s cadence, invalid interval, duplicate frames, unsigned, before-metadata and between-frame owner changes, partial seek failures, size and metadata rejection. Synthetic mobile Chromium/WebKit coverage exercises video frame planner and event-based import logic. No paid AI, production merge/deploy, alteration of Work #126/#128/#130/#132 responsibilities, or Drive Duel changes.
