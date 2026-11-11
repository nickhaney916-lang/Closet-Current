# Mission 3 — cold signed-owner first-login photo memory probe

## Lineage / release boundaries

Direct verified parent **PR #828** at exact HEAD `feeaad7edf1d744411609a7fa6dd290bdf6a0cad` with [NO DEPLOY CI #42957976473](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42957976473), **1,454 / 1,454 Node tests** and eight independent **6/6 real Chromium/WebKit 320/390/430 CSS-viewport** journeys. Research branch only; **FAMILY ALPHA HOLD #255 remains active**. No merges, deployments, production/staging, hosted Supabase mutations or real owner photo access.

## Reproduced first-login memory problem

A signed owner's first cloud sync has `cloud-sync.baseVersion === 0`. The parent immediately runs `items.getAll()` on `m.dirty || !m.baseVersion`, which clones every original private JPEG from IndexedDB **even if the account's local wardrobe is empty or no initial backup has been requested**. If existing local items are present without a dirty marker, the same first sync subsequently marks dirty and calls `snapshot()` **again**, cloning up to 1,000 original JPEGs twice before uploading. The early read is unnecessary to determine whether any local data needs initial backup.

This differs from the already solved clean account **with an existing cloud revision**, where the parent uses revision-only network reads and skips `getAll`. Both branches must avoid an avoidable high-resolution original photo clone.

## Implementation

- Keep an initial `snapshot()` only when the owner already has a dirty local revision.
- If `baseVersion===0` and `dirty===false`, first query `items.count()` and the three whitelisted owner-visible state records (`draft`, `looks`, `outfit-board`) using one readonly IndexedDB transaction; do not clone all private JPEGs before checking whether any local data exists.
- If local garments/drafts/outfits exist, revalidate the signed owner lease, atomically mark the local revision dirty, then take **one** full source-JPEG snapshot for the actual initial backup. No data loss, silent promotion of ownerless evidence, remote session or credential mixing, or change to the real backup content.
- If no local data exists, never call `items.getAll()`; permit the signed owner to restore a legitimate newer cloud revision or remain empty without uploading.
- Keep all prior owner-tag, private photo-reference, SHA, remote/device 413/507 quota and corruption pauses, bounded 8 MiB private JPEG reads, merge safeguards and owner manual recovery.

## Evidence matrix

1. Exact-parent independent fake IndexedDB proof: first empty login clones items once, initial 1,000-item clean owner with no cloud revision clones twice; new implementation requires 0 and 1 respectively. Cold remote cloud restore must still work. Inherited complete Node app regression runs on exact changed HEAD.
2. **Actual Chromium/WebKit 320/390/430** runs 1,000 visually distinct high-resolution **synthetic rendered garment JPEGs**, each **1280×1680 pixels**, sha-unique. Seeds IndexedDB in batches, starts the real built cloud controller with a clean local revision 0 and a synthetic authenticated owner, intercepts fake cloud responses, triggers a safe 413 at the first upload, checks exactly one `items.getAll()`, `items.count()` metadata probe, preserved 1,000 originals, unchanged revision, paused retry across reload, zero cloud publish. The test records input source byte total and source SHA uniqueness.
3. On Chromium, sample `JSHeapUsedSize` via DevTools Performance during initial sync and require below a **768 MiB synthetic QA ceiling**. WebKit has no equivalent supported CDP metric; do not invent comparable measurements. Browser runtime and JavaScript heaps are not the same as total OS resident RAM.
4. Inherited real app privacy, storage, camera-to-closet styling, cloud capacity, owner SHA, quota, mobile accessibility and original garment backup checks in the dedicated **NO DEPLOY** workflow.

## Limitations

The 1,000 high-resolution JPEGs are *synthetically drawn*, visually different garments, **not 1,000 independently captured real photographs**. A Chromium JS-heap sample is **not** device peak memory/OS termination evidence, especially for physical iPhone Safari. Hosted signed two-account JWT/RLS/Storage and real Android Chrome/iPhone Safari remain unverified; no individual user photograph, login or storage record is accessed.

**At creation: exact-head CI pending.** No percentages of mission completion may be inferred from this one milestone. Family Alpha HOLD #255 remains open.
