# MAIN1054 M39 — actual original-native signed-owner provider for M38 owner-photo 2D-only viewer

**RESEARCH ONLY, NO MERGE, NO DEPLOY. Family Alpha issue #255 remains OPEN/HOLD.**

## Why M39 exists

M38 [DRAFT PR #1181](https://github.com/nickhaney916-lang/Closet-Current/pull/1181), immutable HEAD \`b6deb8cfeb78168eee4d9456d8cce05cff94d491\`, proved the exact M37 real PHOTO119 + M34 sealed full owner roster can coexist with P90 actual 163-bone avatar source and viewer controls on one isolated research branch; [no-deploy CI #43628483308](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43628483308) **COMPLETED SUCCESS 16/16 focused + 2,685/2,685 full Node + Chromium/WebKit native viewer and strict 2D suites**. M38 deliberately blocked WebGL even after a successful M37 Node preflight, and the actual public app did not yet supply a trusted owner scope.

The original public Outfit Builder intentionally disables opt-in M33 owner-picker when \`nativeLossless04=research\`. The consumer-private native BOARD04 controller has *different actual saved-outfit and owner source identities* from the default board. M39 does **NOT** bypass this by turning on both original owner-picker and native controller save paths.

## Genuine native opt-in provider now implemented

- Adds \`research/main1054-handoff39/trusted-native-owner-scope.mjs\`: accepts ONLY trusted lexical references from the actual original application to its current \`window.closetAuth\`, exact \`closet-current-user-$owner\` IndexedDB object, actual native BOARD04 controller, capture-operation epoch, original owner UI lease, and a real read-only \`readAllFrom\` callback. Requires those exact objects and owner identity at every session/board/roster read and across async waits.
- The M34 \`getRevision\` is built from the native controller's verified monotonically advancing wardrobe revision / real generation plus original app capture epoch, not from a public request flag. It is backed by M34's full-content SHA/readback/transaction proof: the revision alone is not promoted as a cryptographic approval. Private row sources are returned transiently only to M34 and never from any verdict or public window property.
- \`public/outfit-board.js\` changes **only under the triple research opt-in** \`nativeLossless04=research&native3D05=research&main38=research&main39=research\`. The existing native controller mount logic creates a scoped provider using its real owner identity, current IDB and original capture epoch, then passes the provider directly to \`mountNative3D05\`. No default behavior change, no M33/legacy new save path, no client-supplied \`ownerScope38\`, no guessed storage, no live private photo disclosure.
- The existing M38 strict viewer still checks real P90 saved outfit + source bytes and real M37 original JPEG PHOTO119 private record + M34 full-roster source. Even when **every** trust check passes, it returns \`OWNER_ORIGINAL_2D_VIEWER_FALLBACK_ONLY\` and **denies 3D before donor import or WebGL allocation**. No owner account/row ID/JPEG digest/photo bytes returned.
- A separate new browser test mode \`M38=research M39=research\` seeds a **synthetic** signed owner account with a licensed Commons original and a *synthetic explicit owner-confirmation receipt* for one shirt; selects a real native saved Outfit Builder entry and checks the successful **2D-only** receipt in actual Chromium/WebKit at 320,390,430px. Synthetic labels/owner claims are not independently human approved. M37 Node tests also exercise the real PHOTO119 original-save API and fake IndexedDB signed-owner source. Normal P90 WebGL and M38 intentionally absent-owner-provider paths must remain unchanged.

## Security and test specifics

M39 source tests cover: one original-owner PHOTO119 source / P90 selected board / M34 private-roster successful **no-3D** proof; actual changed private color or source; logout and same-ID re-login; original capture epoch expiry; missing or switched owner/DB; wrong/missing garment selection; and foreign private row rejection. The browser test asserts actual original saved board unchanged, native owner still active, donor HTTP requests **zero**, WebGL canvas **zero**, and 2D source shown even after a click on “Preview saved outfit in 3D.”

Existing original M38 blocked path (\`main38\` without \`main39\`) and independent P90 research viewer (\`nativeLossless04&native3D05\`, *without* \`main38\`) both remain gated/unchanged; CI runs both browser engines for each mode. These are research controls, **not a default-release enablement**.

**Protected:** no app production deploy, production/staging Supabase, real private wardrobe, private family photos, 3D geometry/body rig, model weights, benchmark source binaries, cloud backup/restore, source-confirmation write mechanism or default release authorization changed. The only default-served file changed is a strictly research-gated *read-only provider* block inside the original Outfit Builder. The new provider does not itself mutate owner wardrobe.

## Acceptance and blockers

M39 dedicated workflow must show true exact-head immutable M38 parent ancestry, unchanged M37 blob, tight file-scope allowlist, unchanged default app build, all focused/fulls Node tests, inherited real M34 private picker native Chromium+WebKit, full original P90 real 163-bone browser matrix, M38 blocked path and M39 successful owner-confirmed *2D-only* path in both engines. **No acceptance claim until actual GitHub Actions completes.**

Still **NOT ACCEPTED:** arbitrary owner-photo 3D geometry, independently human-approved source-faithful fabric and backside, safe layered garments/collisions, 10/10 independent recognition, real mobile touch/GPU/memory, hosted account/RLS four-person acceptance, continuous WebKit model reliability and Family Alpha. Three legacy NATIVE06/07/08 stage workflows remain red in prior M38 reports; do not claim a whole-repository green.

**Next engineering priority:** source-reviewed and independent quality-vetted garment-to-3D admission: only after Mission 2 authentic source/mask/UV/rig/contact and honest human visual acceptance can the consumer viewer receive a real 3D garment permission. M39 deliberately does not add this authority.
