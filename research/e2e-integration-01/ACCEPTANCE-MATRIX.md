# E2E-INTEGRATION-01 — Camera → verified saved closet → real anatomical outfit (DRAFT HOLD)

This is an **isolated cross-branch research harness**, not a merge, not a production change and not the user's connected account. The original main Closet Current conversation controls integration.

## Exact donor commits / source-of-truth

| Component | Commit | Retrieval / use |
|---|---|---|
| PR #545 CAPTURE-PROOF-01, includes PR #543 INDEX-04 and INDEX-01/02/03 gates | `dbc3a75e508d006d6d87ffce69832246c2087890` | exact E2E branch parent; real `public/index.html`, `public/app.js`, SHA producer, actual private IndexedDB |
| PR #541 OUTFIT-3D-01 | `df6885d6011cb33fb22dceb81a08f35a0ac4dd61` | detached read-only Git worktree `.e2e-outfit-541`; exact controller/IDB and authentic 163-bone viewer modules, original registered licensed garments, GLBs |
| PR #544 DENIM-VISUAL-27 | `eaccc4d7f945e2ea5af746f9486c5cccf03047e0` | detached read-only worktree `.e2e-denim-544`, its own visual QA tests; visible cloth change remains REVIEW |
| PR #539 INDEX-03 | `6e6ccac4437d220226e6a8b3db79bc729755e5b8` | source-honest recognition safety tests copied into the exact #543 ancestor, not independently modified |

Both donor trees are obtained by `git fetch origin SHA` then `git worktree add --detach PATH SHA` in GitHub Actions. They do **not** become commits in this branch, and original PRs #541/#544 are untouched. App and donor paths are mapped independently by the local no-network QA server. Original licensed denim/shirt/dress fixture JPEGs and approved CC0 anatomical male/female GLB assets are **generated or restored by the exact donor scripts** before WebGL browser tests. `three` packages are test-only.

## Real compatibility defect and isolation

- PR #545 public `auth.js` exposes `closetAuth.ready`, `.user`, `.getAccessToken`, but **does not implement `getSessionGeneration()`**.
- PR #541 `owner-outfit-controller.mjs`, `saved-outfit-idb.mjs` and `research-panel.mjs` **require a monotonic session-generation API** to invalidate pending owner data across logout, account switching and stale IndexedDB actions.
- The E2E research adapter **explicitly refuses to mount without this API**. Acceptance uses **two explicitly simulated authenticated fixture accounts** with a monotonic generation epoch plus a real `closet-current-user-<owner>` IndexedDB for each; this is NOT proof of real Supabase auth/RLS. The production path still needs an authentic generation interface, account switching logout integration and real account acceptance.
- The existing public outfit-builder normalization may silently omit missing IDs / jacket layers on a dress. The donor controller preserves missing IDs as warnings and supports a dress+outer jacket photo fallback, without modifying the original builder. Final production integration must reconcile these contracts. The E2E adapter does not overwrite production boards or source branches.

## End-to-end experience and precise test authenticity

- Real HTML/CSS/JS of PR #545 is opened with `?captureProof01=after&index02=after&index04=after`, and the real `Add clothes` camera/shutter fires on a **browser-simulated media stream of an original 1600×2400 canvas fixture**. Genuine browser JPEG data, WebCrypto SHA-256, source hash, private draft and manual Adjust/Review/Save run unmodified. **Model recognition is mocked low-confidence**, therefore cannot automatically confirm an item's true category/color; manual correction is the real production UI.
- A **genuinely licensed, pre-existing original** `commons-0003.jpg` is imported through the actual browser file input, checked against the pinned SHA and manually confirmed. Other exact pre-existing donor licensed fixtures are independently SHA-checked against `locked-photo-sources.json` and seeded into the same real private IndexedDB **only to create enough test outfits**. A generated bag is clearly marked as a **synthetic test accessory**, with an independently SHA-checked full JPEG. These fixture-seeded records are not misreported as camera imports or new customer photos.
- PR #543 real opt-in saved index (Index-02/04) and the donor PR #541 `createExistingClosetOutfitIO` operate on the exact same owner database and source original bytes. The donor `createOwnerOutfit3DController` rejects tampered/uncategorized IDs and owner mismatch, and its UI persists outfit ID references to existing state[`outfit-board`]. Three suggestions are computed only from donor `available(slot)` (verified owner records), with a selected item **pinned**; fewer than three genuine compatible options result in an explicit insufficiency status, never fabricated clothing.
- Actual donor anatomical GLB/Three.js + registered photographed shirt, denim, dress meshes are used. No mesh mocking. Unknown shoes, skirts, jackets, any arbitrary camera photo, and undocumented back fabrics remain **original-photo/2D-only**. Source truth and 163-bone acceptance are separate from visual photorealism review.
- Chromium: 320/390/430, female and male, real WebGL 3D + source-honest dress/denim + rotations, save, cross-reload reopen, swaps and manual source/categorization corrections. WebKit: 320/390/430 genuine app import/review/private indexed wardrobe + outfits and browser viewport. If WebGL2 is unavailable on this runner it is honestly **HOLD**, not a claimed 3D success.
- Browser route interception blocks all external traffic; any non-GET external requests fail. **No third-party services receive photos or authenticated user data** in this test. Test fake auth and seeded licensed images are fully synthetic/approved fixtures. Physical Android/iPhone hardware, real person wearing outfit, live model inference, production Supabase RLS and arbitrary photo-to-mesh are NOT verified.

## Acceptance matrix (filled from final CI evidence)

| Requirement | Automated scope | Release boundary |
|---|---|---|
| Camera snapshot / original SHA / source proof | Browser JPEG, SHA256, 1600×2400 simulated camera, true import bytes | Physical camera sensor / orientation HOLD |
| Recognition / subtype & color | Actual app worker handoff; deliberately **mocked** low-confidence result; **human UI correction real** | Fresh model identity accuracy HOLD |
| Privacy and duplicate/stale owner | Account A/B independently owned IndexedDB, original ID proof, logout 3D clearing, duplicate-free reload, owner-signed 3D | Real Supabase RLS / arbitrary user sessions HOLD |
| Categories | Tops, Bottoms, Dresses, Outerwear, Shoes, Accessories verified from stored owner records; correction via actual app storage + index refresh | Human categorization accuracy on arbitrary consumer garments HOLD |
| Three outfit suggestions / pin | Isolated deterministic adapter over actual PR541 verified available items; insufficiency reported | Product-level Style My New Clothes UI integration HOLD |
| Swaps / dress layering / save / reopen | Real PR541 owner controller, original app state board, no 3D invented garments, reload | Original public board merge/interaction contract HOLD |
| 3D male/female source-bound WebGL | Genuine 163 bone anatomical rigs + specifically approved photographed shirt/jeans/dress; Chromium | Arbitrary captured garments / unsupported clothes photo fallback; WebKit WebGL2 conditional; photorealism REVIEW |
| 360 views | Browser front/side/back and rotate on real rig, no photographed rear assertion | Physical touch/orientation and human 10/10 aesthetic HOLD |
| Denim visual QA | PR544 source/manifest independent audit gate retained unmodified | Tiny drape changes remain visual REVIEW; no photorealism approval |
| Production | No merge, no deploy, research-only URLs and detached donors | Family Alpha #255 HOLD |

## Known post-research blockers

1. Production/real authentication needs `getSessionGeneration` or equivalent monotonic revocation; must be enforced before connecting PR541 controller to real app. Fake test epoch is not a production substitute.
2. Full app native saved outfit board and PR541 research controller have different missing-item/layer semantics; cannot merge UI while silently dropping owner-selected garments.
3. Model inference mocked due offline test runner. Real human-checked clothing recognition, confidence calibration, multi-photo segmentation and authentic consumer photo fitting remain HOLD.
4. Most user-captured clothes are not independently reconstructed as verified deformable 3D mesh. Original front source is valid; rear/side modeling is **neutral modeled approximation**; see #544. Never describe as photographed rear fabric.
5. Physical Android and iPhone cameras, performance, Safari hardware WebGL, cloud RLS and backup/restore not tested.
6. All findings are **draft research**. Main controller retains authority over staging, integration/merges, Family Alpha and production.
