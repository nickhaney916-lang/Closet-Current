# STYLE-OWNED-LIVE-03 — Actual Style My New Clothes (research draft HOLD)

Source controller: PR #563 exact **d913e4f0b65c6b92cfbd1de4083e84692740707e**. No production merge/deploy/staging/cloud changes. Family Alpha Issue #255 HOLD. Parallel #22 new photographed-shirt anatomical fitting remains independent and unmodified.

## Initial real-app integration matrix (from source inspection)

| Existing component | Before #23 | #23 isolated research change |
|---|---|---|
| Production-facing public/index.html Style tab | Style collection and trend suggestions; no pinned new photographed garment → three saved-owner combinations → CAS path | Mount inside the **actual existing Stylist page**, behind `styleOwned03=research`; retain existing Style tools unchanged |
| PR #547 three-owned-looks.mjs | Independently verified PR541 research donor controller, three owner-only combinations, signature uniqueness and insufficient combinations; not available from actual native app | Adapt **its deterministic owned-ID/slot plan** to native BOARD04, with source-verification, distinct ranking and dress/layer rules; no second DB |
| PR #561 nativeIndex07 | Freshly saved original JPEG indexes and refreshes actual native BOARD04 cached saved wardrobe | Re-read the native owner's snapshot after commits; show new saved piece without reload |
| PR #556 BOARD04 + PR #552 BOARD02 | Existing owner-epoch, unsaved draft, native CAS, ID-safe backups and atomic failure protections; only single-slot edits | Research-only `readOnlyWardrobe`, `sessionLease`, `applyOwnedSlots` on **same controller**, applying whole verified suggestion in one atomic unsaved in-memory change; explicit `persist({asNew:true})` only |
| Existing My Closet | Saved original photos, category correction, manual Adjust | One-click `Style this piece` on real closet cards when research flag on |
| PR #562 photo readiness | Original JPEG SHA and supported 3D readiness gate; 0/15 new sources accepted 3D Ready | `verifyOriginalPhoto01` per owner item before display/recommendation; unsupported sources shown as original photos **never fictitious meshes** |
| PR #559 v4 atomic backup/restore | Owner-original outfit bytes and garment slots survive loss/restore | Test new style-produced saved record through actual export and atomic reimport |
| PR #563 mobile native | 48px+ native actions, genuine 163-bone WebGL and owner QA | 48px+ touch targets, no horizontal overflow, actual native Style/mobile Chromium and WebKit screenshot acceptance |

## What really ships in research

- A single opt-in panel in the **actual native Style tab** and one opt-in action on existing My Closet cards. Existing Style collection remains available; no standalone HTML demo.
- A selected SHA-verified original JPEG from the same native owner only; category, subtype, color and full identity visible. Newly captured photos flagged as singleGarmentVerified=false require a separate visible user confirmation of one clothing item before styling; the original flag is never rewritten and this is NOT 3D readiness. A failed local recognition check (scanFailed=true) remains explicitly recorded; if the owner manually corrected the category and separately confirms the JPEG shows one garment, its untouched source may still be styled as a photograph—never as AI-certified recognition or 3D fitting. That confirmed exact photograph is automatically pinned in the Style screen. Casual recommendations penalize unnecessary simultaneous jacket-and-coat layering; optional coats become more suitable for verified cold-weather occasions. Invalid/multi-garment/uncertain categories remain excluded with a truthful review count. Exact owner + generation is rechecked after every asynchronous SHA digest.
- Up to three distinct complete looks from actual native owned IDs; all include pinned original, real top/dress, real shoes and bottoms unless a one-piece dress. Optional compatible jacket or coat. No duplicate IDs, invented photos, category conflicts, auto-save, arbitrary AI-generated meshes or universal 3D approval.
- Card previews and swaps use the original saved JPEGs. Pinned slot remains locked; other slots can be changed to compatible owner records. Undo, cancel, explicit save, and reopen use the existing BOARD04 workflow. The existing whole native draft can be changed in **one validated `applyOwnedSlots` call**, so a rejected swap does not partially overwrite it.
- Before initial preview, native BOARD04 `startNew` refuses any preexisting unsaved draft; all existing saved outfit entries (including missing references and unknown metadata) are preserved. Save creates a new distinct record through the **existing** CAS/cloud-marker transaction, not a replacement database or a direct outfit-state write.
- On logout/owner epoch change all original-photo images in the new panel are cleared; pin, candidates and draft cannot carry across owners. On new import the panel refreshes from the newly saved owner wardrobe only.

## Verification plan and hard gates

Genuine `scripts/test-style-owned-live-03-browser.mjs` tests the actual original native app with synthetic Supabase authentication **HTTP responses only** and private owner IndexedDB: import real licensed `commons-0002` red T-shirt original JPEG, real user Adjust Tops/T-shirt/Red, save, select/pin, show three real owner combinations, swap bottom, undo, reject pinned-category tamper, save via original CAS, reopen exact saved IDs, export V4, delete genuine owner item/saved outfit and atomically restore, logout A, open independent B. Chromium and WebKit at 320/390/430, 51 source-safe PNG screenshots plus six multi-stage contact galleries, SHA audit. Exact original JPEG hash fef606d6ed7354a2238f1bcc2584942747ca6fa4a2b16b2e9eec21f639d10667.

Dedicated no-deploy GitHub Actions must execute full inherited Node tests and true native 3D donor smoke/visual browser flow, indexed photo, photo readiness, Mobile09 controls, owner backup and 15-original-photo benchmark. **Do not mark complete until exact final SHA CI is green and the screenshot artifacts are actually inspected.**

## True remaining release restrictions

This does not verify real signed Supabase JWT/RLS, real cloud cross-device restore, real handset camera/hardware WebGL, neural classifier accuracy, independently approved arbitrary photographed garment fitting, human fashion acceptance or 10/10 realism. Unapproved garments must stay original-photo-only; #22 owns fitting. Production remains untouched, no merge/deploy, Family Alpha remains HOLD.
