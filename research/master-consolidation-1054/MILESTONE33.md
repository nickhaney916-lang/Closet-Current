# MAIN1054 M33 — actual native Outfit Builder source-locked picker and atomic write veto

**DRAFT / UNMERGED / UNDEPLOYED / Family Alpha #255 OPEN/HOLD.**

## Exact source and configuration

- Parent M32 [PR #1164](https://github.com/nickhaney916-lang/Closet-Current/pull/1164) immutable successful HEAD \`3693842255cc8af2d0f5a57d232017f687ef80a7\`, [CI #43617440610](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43617440610) (2,648 full Node; licensed Chromium 13/13 and WebKit 13/13; 12 native UI browser receipts).
- M33 branch \`research/main1054-native-picker33-HOLD\`; one **opt-in** change in \`public/outfit-board.js\`, one research module, one Node test, one native-browser runner, this report and one isolated workflow. Production/default behavior is deliberately unchanged.
- To exercise in an authorized research checkout only: query \`?ownerPicker33=research\`. This requires the genuine signed owner session and private IndexedDB; no simulated approval bypass, no hosted Supabase writes, no private family photo collection.

## Newly connected boundary

1. The **real** \`openBoardPicker\` card's click and the owned item suggestions now call M32's live owner/source/photo/field-receipt \`authorize\` under a same-auth/DB/operation-epoch/board UI lease, before invoking the existing \`selectBoardPiece\`. An invalid choice returns a generic re-review message rather than an outfit save. Superseding actions/signout revoke stale callbacks.
2. Every existing **draft and saved outfit** \`persistBoardState\` action in opt-in mode calls \`createNativeOutfitPicker33.prepareWrite\` with the actual current board. This verifies all chosen slot identities against the M31/P87 owner-field receipt, source JPEG SHA, live signed private DB and full-row snapshot.
3. Inside the existing atomic \`state\` write, the transaction now includes \`items\`. Each selected item must match its complete preverified private record **in that same IndexedDB transaction**. The requested \`state.put\` is aborted if any changed owner/receipt/source/item is found. This covers a previously verified garment modified by another tab before the outfit write.
4. Old owner records remain unchanged. Legacy unreceipted garments remain in My Closet but cannot be silently promoted to an approved outfit in the research mode. No image pixels, auth tokens or DB references appear in the public authorization verdict. Only original-owner 2D fallback is admitted; 3D stays unauthorized.

## Planned exact-head no-deploy tests

- Licensed public Commons-0053 JPEG, synthetic authenticated owner and synthetic owner-confirmation metadata; NO independent genuine human ground truth.
- Node: M32 admission + PHOTO119 commit, exact source read/write, stale row mutation between hash and state transaction, forged receipt, stale original SHA, same-owner login replacement, revocation and board/revision changes.
- Real native app under Playwright Chromium and WebKit at 320/390/430 mobile viewports: existing \`auth.js\`, \`app.js\`, \`outfit-board.js\`, actual original private IndexedDB/board; only HTTP auth/cloud external network stubbed. Test picker click → actual signed board draft → saved outfit → original receipt tampering → subsequent save denied.
- Inherited full Node and source/2D browser checks. No claims until **exact M33 head** CI completes and its logs are inspected.

## Explicit limitations / next stage

- The synchronous M33 local \`ownerPicker33Revision()\` detects changes in the loaded local roster; **it is NOT a durable cross-tab/private-DB revision producer**. Safety also depends on freshly read signed owner items and full private row comparison inside the existing atomic outfit state write. Implement a durable IDB revision updated by all writers, including cloud restore, prior to promoting this to default UI.
- The normal URL without the research flag is unchanged, and the native lossless BOARD04 research mode is not silently rewritten.
- The native status after a transaction commit cannot be interpreted as proof of a concurrent session lock occurring strictly after IDB commit; do not claim an impossible atomic commit/logout race cancellation.
- Independent human blind recognition, real-photo source-3D multi-piece drape, physical Android/iPhone Safari, real authorized hosted four-account privacy are separately BLOCKED. No 10/10, 3D realism or protected-family trial readiness claim.
- No merge/deploy, staging/production/hosted database edits or owner-private data inspection. Family Alpha #255 HOLD.

[Master coordination #1054](https://github.com/nickhaney916-lang/Closet-Current/issues/1054).