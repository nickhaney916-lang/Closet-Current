# Follow-up: responsive import retries — October 21, 2026 Pacific

Isolated from verified PR #123 head `61e4a87672ec603e29d9f10763d25d803ecbb801`.

Small originals previously revisited the same effective pixel frame for each of the five size limits. An 800×600 source exceeding the budget incurred 15 synchronous JPEG encodes. Deduplicate actual width/height frames: now only .94/.88/.82 are tried once (3 attempts). An 1800px source now tries 1800 then 1536, without revisiting 1800 at the 2560 and 2048 limits. Preserve all quality ordering, full-frame dimensions, no upscaling, timeout, object URL revocation and 2,850,000-character budget.

Yield with a zero-delay task before every retry encode so queued input, UI and account lifecycle tasks can run. The first encode remains immediate. A single canvas JPEG encode still runs synchronously; this is no guarantee of a frame-time ceiling or physical-phone speed. Recognition uses the existing full-frame source before masking. No app/auth/cloud/schema/recognizer/reviewer/evidence file changed.

Validation: local build and all Node regressions **1,329 passed / 0 failed / 3 skipped**. Focused tests cover native-size deduplication, queued UI before second encode, and recovery after encoding failure with URL cleanup and the next batch image accepted. Dedicated CI verifies these cases with actual synthetic JPEGs under forced budget pressure in Chromium Android / WebKit iPhone emulation, plus historical import, duplicate, original-before-crop, camera, owner-isolated cloud and styling regressions. CI status must be checked at the final commit before claiming browser completion.

No real garments/human labels are introduced; source-locked review files and all prior checkpoints preserved. Independent human accuracy remains null and promotion blocked. No physical phone, live customer account or hosted backend validation, paid services, merge or deploy.

---

# Imported-photo detail-first JPEG budget — October 21, 2026

**Scope:** Isolated draft PR stacked on source-verified PR #122; never an authorized production release.

## Concrete customer problem
Closet Current converts camera-roll imports into high-quality full-frame JPEG recognition sources without clipping or masking. Before this change, an input exceeding the existing **2,850,000-character data URL budget at JPEG quality .94** immediately dropped to a narrower pixel frame. Patterned fabric, high-top shoe seams and small garment details can be harder to inspect when the app unnecessarily drops from 3072 to 2560 or 2048 pixels.

## Implemented
Keep the original bounded resolution targets: **3072 → 2560 → 2048 → 1536 → 1024**, with no source upscaling. At each pixel size, attempt `0.94`, `0.88`, then `0.82` JPEG quality (for default quality) before reducing resolution. Return the first JPEG data URL at or below the preexisting 2,850,000-character budget. Reject oversized photos if **none** fits. Object URLs remain revoked and 15-second decode timeout stays active.

No original camera sensor bytes or metadata are preserved by this particular import conversion. It is still a **full-frame high-resolution JPEG derivative**, classified before masking or cropping. This change does not assert true optical sharpness or improved recognition accuracy. It can modestly increase JPEG compression at larger dimensions, and devices must be validated with actual garment imagery to assess real perceived quality. The chosen quality floor and max encoded size are deliberately limited, not unlimited retries.

## Source and privacy protections
Only `public/photo-import.js`, its associated tests, technical CI, scope guards and documentation are modified. Pinned exact Git source blob ensures this specific quality improvement is the only permitted customer-facing source change. Original-photo recognition pipeline, mask gates, photo identity, user closet, account-owned cloud, Supabase RLS and Auth, review packets, live provider and paid AI controls stay byte-identical. No use of real customer photos or accounts in automated tests. The original phone hardware, permissions and native camera capture pipeline are **not tested** by browser emulation.

## Verification
Full Node regression, existing source/owner release blockers, Chromium/WebKit with actual synthetic JPEG pixels at 3600 × 2700 and forced .94 budget overflow, plus exact original source crop/duplicate/native camera emulation. Success must be confirmed on the final exact head. Node tests verify no unnecessary redraw while changing JPEG quality, unchanged output storage cap, safe failure and URL cleanup. Artificial compression threshold injection is a *technical test*, not measured improvement in real clothing recognition.

No genuine human independent review data, production mask signoff, real physical phone, fully hosted Supabase, figure commercial rights or model accuracy approval. Promotion **BLOCKED**, merge/deploy not performed.
