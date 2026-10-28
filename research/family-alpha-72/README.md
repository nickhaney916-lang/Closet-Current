# Family Alpha #72 — guided phone checklist (NO DEPLOY; HOLD)

This main-thread improvement adds a real nine-step tester checklist to the existing authenticated **My account → Device help** screen in the offline Family Alpha candidate. It builds on green [PR #385](https://github.com/nickhaney916-lang/Closet-Current/pull/385) without changing the original camera/recognition, cutout editor, source JPEGs, 2D fitter, Auth, saved wardrobe, private backup, or #385 local feedback.

The nine steps match P01–P09 in the existing 47-case four-person checklist (PR #384): camera preview and retake; full original photo; type/color correction; multi-garment review; save/reload; three owned outfits and a swap; reviewed cutout-on-avatar fit; logout privacy; fresh-session own-item restore.

Each dropdown allows **not tried / worked / needs help / blocked**. An on-screen counter shows progress and outstanding problems. A trusted click downloads a status-only, strictly fixed-schema JSON file on the user's own device. The report has no names, email, accounts, filenames, photos, tokens, notes, IPs, identifiers or network transmission; it never claims launch approval. Nothing persists automatically. Start again and session change discard answers; users need to download before intentionally logging out. Hidden Device help and programmatic downloads are refused.

The full 47-case test matrix remains the separate authoritative **manual planning** artifact. This nine-step self-report is not proof of RLS enforcement, a physical-device completion, a real cloud restore, a four-account pass, or visual approval, even when every answer is marked worked. There is still no private support inbox: the user must review and share the JSON privately.

## Scope and verification

- Source parent: PR #385 verified head ee5bb27bdbbc5c78d32f001990034eb8eccf3293.
- Builder overlays only index.html plus one new local module and HOLD marker; every inherited compiled asset including privacy and source identity is byte-compared.
- Run: node scripts/build-family-alpha-72-guided-phone-hold.mjs
- Run: node --test tests/family-alpha-72-guided-phone.test.mjs
- Run: node scripts/test-family-alpha-72-guided-phone-browser.mjs
- Chromium and WebKit at 320/390/430; local download, strict schema, fake-click rejection, session reset, hidden-view refusal and no external requests.
- No customer photos, signed-in staging accounts, app deployment, staging/production setting changes, spending, merges, or Drive Duel modifications.

## Parallel tracks

Work #53 owns fine garment cutouts. Work #54 owns new starting-fit geometry. Work #55 owns the independent 15-photo visual acceptance benchmark. Work #54 [PR #386](https://github.com/nickhaney916-lang/Closet-Current/pull/386) is NOT imported: [no-deploy CI #40753907291](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40753907291) failed on scripts/test-work54-browser.mjs. The blocker is reported to its owner. Main-thread integration waits for an exact verified Work54 head and independently reviewed visual evidence.

**Family Alpha remains HOLD**: 0 human visual PASS, 5 REVIEW, 10 FAIL; real cloud restore, live two-owner JWT/RLS and physical phone tests not verified. No family invites or release authorized.
