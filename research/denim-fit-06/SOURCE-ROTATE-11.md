# SOURCE-ROTATE-11 — real mobile browser pointer rotation provenance (research HOLD)

## Why this matters

F10 (draft PR #522, source SHA `136068f094de3713411bce0c2124415ea1a535bc`) labels the source-photographed front and the *modeled, unphotographed* side/back of original licensed denim. Its F09/F10 automated 360° tests exercise deterministic view presets, not an actual user drag on the real canvas. A genuine camera pointer drag could otherwise leave an incorrect stale "front photo" label while the back is shown.

## F11 acceptance

- Start with the original SHA-verified 163-bone female rig, first licensed denim, synthetic account A, 390px mobile viewport and genuine F07 WebGL viewer.
- Select the exact original front via a preset, then **physically dispatch a Playwright mouse down, multi-step drag, mouse up to the canvas**, not `ccWardrobe10View`, and observe `OrbitControls`/camera's actual view-change event.
- Confirm the label changes from `front-photo` to either `mixed-photo-and-model` or `unphotographed-rear`; reject any stale front claim after a drag.
- Verify >=50 true screenshot RGB changed pixels on the actual source-licensed WebGL canvas, current synthetic-owner identity, matching original 64-digit SHA, unchanged 163-bone anatomy and **no claim of a photographed rear**.
- On logout, inherited F10 tests must still immediately hide photo-provenance status and source image, and run all inherited 148 genuine WebGL screenshot and privacy/contact/regression gates unchanged.
- CI writes a specific JSON witness at `benchmark/source-rotate-11/results.json` and uploads it separately. No new photographs, synthetic rear textures, garment mesh geometry, shaders, production code, Supabase, live data, paid inference, release settings, merges or deployments.

## Honest limits

This is a **real browser mouse/pointer** acceptance check on a mobile-sized Chromium viewport, not hands-on Android Chrome/iPhone Safari touch QA. One fixture and width provide targeted pointer-path proof; it does not prove all finger gestures, devices, garments or a photorealistic 360° source. Original side/back photos were never supplied. Human aesthetics remains REVIEW and four-person Family Alpha #255 remains HOLD.

F11 technical completion requires the exact-head no-deploy GitHub Actions run SUCCESS, plus review of any source screenshots; creating a draft PR alone does not constitute verified completion.
