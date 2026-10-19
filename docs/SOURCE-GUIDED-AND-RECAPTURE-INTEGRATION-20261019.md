# Central Closet Current integration — PR #41 + PR #42

Date: October 19, 2026. Draft only, not deployed or merged.

## Branch ownership

- Parallel **ChatGPT Work session** authored [PR #41](https://github.com/nickhaney916-lang/Closet-Current/pull/41) on `feature/source-guided-mask-boundaries-20261019`. It derives an internally linked, up-to-600k-pixel dark-background boundary guide from source photo pixels. It preserves projected foreground, restricts changes to boundary band and never modifies source RGB; the candidate is always `eligible:false` and `displayEligible:false`. Partial photo witnesses are **not** independently verified full mask reference labels.
- The **main coordination chat** authored [PR #42](https://github.com/nickhaney916-lang/Closet-Current/pull/42) on `ux/local-figure-held-photo-recapture-20261019`, featuring a conditional one-button single-item photo retake workflow when a garment is held.
- This separate integration branch begins at verified PR #42 head `07f96197c1d5dd27dff5f89f904b732e26838d68` and copies over PR #41's bounded pure analysis module, source-reproducible fixtures, CLI bench, independent tests and diagnostic browser probes; **neither original PR branch was changed**.

## Integration acceptance

The in-app fitting renderer **does not invoke** the new higher-resolution proposal for display. A held real photo stays held. Its original high-resolution image continues to be analyzed and indexed before any clipped/warped local preview. The new module loads for offline testing/diagnostics only.

The built app's Android Chromium + iPhone WebKit emulation verifies source-guided diagnostic pixels, local projection alpha preservation, exact image RGB preservation, no changes outside declared boundary uncertainty, patch witnesses, 12 pinned originals, one still held proposal, both static male/female models, four-layer synthetic dressing, and held-photo retake UX. The original cached/atomic display, no stale results and ephemeral local selfie checks remain. Reproducible offline benchmark and full Node suite run separately.

Do not interpret green CI as pixel-accurate real-photo segmentation or photorealistic fitting. Indistinguishable dark trim, independently audited masks, physically validated phones and commercial model figure rights remain outstanding. We need independently labeled licensed full masks and blind human scoring before eligibility can change.

No paid inference calls, third-party customer uploads, asset purchases, production deployments, merges or Drive Duel modifications. Existing two-figure limitations and licensing gates remain.
