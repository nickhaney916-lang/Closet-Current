# NATIVE-BOARD-HANDOFF-03 — Native login → lossless saved outfit → verified 3D decision

**Main-controller integration research only. Family Alpha #255 HOLD. NEVER MERGE OR DEPLOY.**

## Exact pinned sources, isolation and reason

- BOARD-LOSSLESS-02 Parallel #18 PR #552, research candidate exact starting commit `14cfa56eaa537170ede18898b1b948eb80f58c4d`. This branch is a child of the **specific immutable commit**, never an edit to #552 or its CI. Existing consumer `public/outfit-board.js` remains unchanged/lossy. Parent #552 WebGL CI may still be in progress at handoff; do not claim independent green until exact-head verified.
- AUTH-EPOCH-01 #550 exact immutable commit `58d2178820b8a949cb49715696cfc977f79b72ef` — exact no-deploy Actions #41727687719 SUCCESS.
- Original OUTFIT-3D-01 #541 exact immutable source SHA `df6885d6011cb33fb22dceb81a08f35a0ac4dd61`, donor's 163-bone anatomical WebGL verification distinct from our 3D **decision** only.
- Earlier non-destructive native saved-loss audit #551 exact dedicated Actions #41734678104 SUCCESS; Cloud #553 and signed staging A/B harness #554 are separate priorities.

**The exact missing integration bug:** Parallel #18's opt-in lossless editor required `getSessionGeneration()` on its owner auth, but the real native `public/auth.js` only exposes `getAccessToken()` and `ready/user`; original PR #552 browser QA injected an artificial `window.closetAuth.getSessionGeneration()`. That does not prove its save/edit works under genuine app login/logout/refresh. AUTH01 supplies an independently attested epoch without monkey-patching the native provider.

## Implementation

`native-board-handoff.mjs` opt-in research bridge requires both `?nativeBoardHandoff03=research` and `?boardLossless02=research`, actual original native provider and DOM login/logout, an independently pinned epoch factory, and actual PR541 source-honest decision. It attests native `getAccessToken()`, mounts the original PR552 lossless editor with the delegate `bridge.auth`, prevents storing or rendering stale private photos after refresh/logout/pagehide and rejects injected session-generation methods in native auth. It exposes no access tokens and no app database migration. Research-only manual mount through test harness; no public source scripts are modified.

Genuine original-page browser test `scripts/test-native-board-handoff-03-browser.mjs`:

- Reads **six actual repository licensed JPEG files**; each SHA-256 matches `benchmark/locked-photo-sources.json` before use and is unchanged afterward.
- Launches original `public/index.html` and **unchanged real** `public/auth.js`. No fake auth JS injections. Only the live Supabase **HTTP authentication RESPONSE** is intercepted with deterministic fixture tokens (no real cloud account, no server RLS claim). All external PUT/POST other than the synthetic login are rejected.
- Tests Chromium/WebKit × 320/390/430. A logs into actual native form, receives a real native account/IDB database, seeds preserved original outfit records, opens and verifies lossless dress + jacket + coat + shoes and one deleted garment ID, source-hashes the genuine original JPEGs and delegates to exact donor #541 3D source-honest fallback. The native normalizer still demonstrably drops the dress's jacket/coat, so the migration is **NOT deployed**.
- A performs explicit lossless shoe swap and atomic CAS save, preserving durable `outfit3dId`, coat/jacket and unrelated original saved record; previews and original open are read-only. Genuine native token refresh rotates stored token and invalidates native-epoch: private preview thumbnails must clear and stale editor must refuse access. Browser reload restores original native login with a newly attested epoch and saved outfit. Actual logout closes the app gate; B logs into the same browser origin, reads only its distinct owned records and cannot use B's lease to read A's owner database.
- 5 captured real browser stages for each of 6 engine/width cases: 30 genuine viewport PNGs PLUS 12 independently captured original garment-card element closeups (four original JPEGs visible per owner), all SHA-256-checked, and 6 review contact strips. Read-only photo retrieval and synthetic account fixtures are not production authentication. **No 3D mesh is rendered by this harness**; PR541's earlier genuine separate WebGL tests remain its own evidence, not falsely reattributed.
- Complete inherited source build + Node tests and strict research-only scope whitelist; exact detached AUTH01 and OUTFIT01 worktrees. No Supabase write or production deployment.

## Independent acceptance / explicit nonclaims

After an exact-head GitHub Actions SUCCESS and review, one may mark **research native-auth × lossless board compatibility** PASS. One must NOT claim family or release acceptance: no signed production/staging account A/B JWT data isolation, no cloud saved-outfit restoration across devices, native `public/outfit-board.js` migration/fix, user-facing capture acceptance, actual integrated WebGL clothes from arbitrary photo, physical Android or iPhone testing, or 10/10 photorealism.

**Only explicit opt-in and isolated synthetic identity/browser records**, no production/default app/Parallel #18 donor modifications. Production is untouched, Family Alpha #255 HOLD.

## Known source/security acceptance details

The native auth wrapper is fail-closed upon a legitimate token refresh, so the research panel must be explicitly remounted/re-attested. This is intentional to prevent older signed-in leases from reading or writing after a user changes account/session. The original native application and saved-3D donor must not be changed to weaken the epoch check.

The consumer native outfit board can still silently delete garment IDs via its native `cleanOutfitBoard`; this research bridge leaves it unchanged. It does not authorize production data migration. Opt-in capability makes a prototype testable, not publicly usable.

Do not claim complete acceptance if the new browser CI fails or has never run; fix actual problems on this isolated main-controller research branch and retest.

## Visual artifact quality correction

The first successful native-login integration run [#41741435036](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41741435036) passed 6/6 browser cases, all strict proof and 30 screenshot SHA checks. However, a separate human visual review of the six actual contact strips found **the original garment photo cards were not brought into view in the 30 viewport PNGs**. That is not sufficient consumer-facing visual proof, despite the passing source-hash assertions. This follow-on exact research commit adds an epoch-guarded `show()` forwarding method, explicitly renders each original dress/jacket/coat/shoe photo card before view captures, verifies four decoded original JPEG images visible, and captures **12 additional real element screenshots** (A and B, both engines and all widths). The revised 42-screenshot final-head CI MUST pass and evidence must be visually inspected; **do not cite the earlier 30 screenshots as demonstrated visible garment fit.** No app or parallel donor changes occurred.

## Final mobile visual acceptance refinement

The next [42-image genuine browser run #41741926019](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41741926019) passed all SHA-256 and source-card visibility assertions and I independently downloaded/visually inspected all 12 original garment-card crops. This revealed **fixed bottom navigation partially occluding shoe-card pixels in some 320/390-width real screenshots**, even though the browser had indeed rendered all four original JPEGs. The latest isolated main-controller test therefore explicitly centers `#board02Preview` and requires `rect.y>=4` and `rect.y+rect.height <= viewport.height-90` before every photo-card/viewport capture. This is a meaningful stronger visual assertion (not lowered acceptance). A new exact-head run and independent human image review are mandatory before final status. Only test infrastructure was changed; default native product UI remains unmodified and photo source SHA pins remain the original locked references.

## Original-page screenshot crop correction

CI on previous exact commit `d95a5738d781f334722178ea1747f84998f1103e` [#41742323013](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41742323013) passed source/auth/42 SHA assertions. **Independent visual inspection of the individual 320/390 source-card PNGs, however, exposed a mismatch in Playwright's element screenshot scroll/clip behavior:** the element crop could include buttons above the card region and truncate the lower shoe card. This is an evidence-capture defect, not a claim that saved data disappeared. We switched to full original native page screenshots plus `getBoundingClientRect()+window.scrollX/Y` absolute document coordinates for the original photo-card crop. The research-only script asserts that crop lies in the unmodified full screenshot and requires exactly four fully decoded JPEG images in the card DOM. That strictly strengthens screenshot provenance. Original DOM/layout, JPEG bytes, saved outfit, auth, Supabase and parallel donor files are unchanged. **Only a new successful exact-head CI AND individual four-image visual review can close this priority.**
