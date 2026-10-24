# Closet Current — integration checkpoint: verified source identity and backup integrity

**October 24, 2026 · Development-only · No merge, deploy, database/cloud/Resend/Cloudflare changes or customer photographs.**

## Scope and parallel work reviewed

| Parallel assignment | PR | Verified outcome | Main-thread decision |
| --- | --- | --- | --- |
| Work #20 licensed original-photo benchmark | #280 | 47/56 category correct (83.93%); jackets 1/4; 3/3 nonclothing rejected | No new model accuracy, do not change classifier or claim unseen-photo quality |
| Chat #21 scanner error recovery | #281 | Invalid worker message and per-image decode isolation safeguards; 24 targeted checks pass | Ready for a separate conflict-controlled worker-controller integration; current main bundle still lacks these changes |
| Work #22 source-to-wardrobe integrity | #283 | 4/7 baseline fail → 7/7 after fixes; 6 browser IndexedDB cases; original/crop, draft and type-loss protection | **Selected for this isolated composition**, direct source-pinned replacement of coherent PR #283 code including base #282 |
| Chat #23 mobile Adjust acknowledgement | #284 | 12 emulated mobile browser cases pass with required review acknowledgement | Separate manual editor changes touch app.js; reconcile with #283 after integrity baseline and explicit review |

## Actual integration

This branch stacks on protected staging + full modern-original recognition/2D avatar draft PR #285 at `1db5017045c231751800866f0cc3b86ac3e24726`. It **does not overwrite `public/app.js` or alter the production/real staging site**.

The **offline combined artifact builder** `scripts/build-family-alpha-recognition-integrated-hold.mjs` takes all modern recognition files from **immutable #283 source `795ad6637f8d4f782bc99751211b25e8e72a3a7d`**, which already includes #282's source-only recognition and guarded one-choice color confirmation. This keeps model/worker/file-backup versions coherent; no piecemeal copying.

The existing Family Alpha staged authentication client/cloud backup builder retains project `fbnplztkbsteuzrmbgib`, blank publishable key and callback, `HOLD-NO-CALLBACK-OR-KEY`, restricted offline-only CSP and localhost-only reviewed-JPEG photo-avatar preview. Paid AI try-on remains disabled. A raw recognition branch's production Supabase client is never allowed into this artifact.

The integrated build now fails closed unless:
- The current recognized original source, garment review and transient human color proof are preserved.
- The **manual Adjust transaction resolves the remaining draft inside the queued write**, so later captures are retained and removed drafts are not resurrected.
- The **automatic closet admission deep-clones nested originalPhoto / recognitionPhoto / crop / segmentHint metadata** before putting the saved record into IndexedDB, avoiding divergence between persisted and styled copies.
- The wardrobe backup engine **rejects explicitly unsupported clothing subtypes** instead of silently replacing a confirmed human correction with `Unknown`.
- The compiled backup engine and app remain pinned to the exact audited #283 source revision; any silently changed Auth, private owner or release flag blocks the artifact.

The adapted `tests/integration/family-alpha-assignment22-integrity.test.cjs` executes **the actual compiled staged-HOLD app and backup engine**, not the parallel branch's raw files. Seven baseline/candidate lifecycle tests cover queued additions/removals, original/crop/hint identity, aborted transactions, explicit unknown backup types, safe legacy absent subtype and outfits tied to restored corrected garments. Its success is integration evidence, not a real backend test.

Existing 454 source/server integration Node regressions plus modern recognition-to-avatar Chromium/WebKit synthetic browser checks are rerun through a separate draft PR workflow.

## Known remaining blockers

No actual independently labeled real-photo accuracy improvement was developed; the current verified 47/56 score does not establish real-world quality or correct wardrobe colors. Work #21 worker failure handling and Chat #23 manual-editor confirmation must be reconciled without losing queued-save or source/crop preflight safety. The reviewed 2D photo layer remains a beta preview, not photorealistic fit.

No signed-in protected staging login, four individual real JWTs, cross-owner Supabase RLS and private Storage/backup tests, SMTP deliverability, Cloudflare Access review, or actual mobile camera testing were performed here. Family Alpha remains **HOLD**. The user controls any staging deployment, production update, merges, email/SMTP activation or spending.
