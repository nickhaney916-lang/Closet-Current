# Family Alpha #75 — recover all reviewed outfit fits from one local file (HOLD)

An actual in-app convenience improvement to the protected Family Alpha #74 candidate, **not** an isolation or natural-fitting algorithm change. Work #53 owns detailed cutouts, Work #54 remains the source of the natural starting fit, and Work #55 owns real-photo visual acceptance.

Previously, the garment-fitting editor could download and restore **only the currently selected garment's** locally reviewed fit adjustments. This feature adds, inside that same protected editor, **Download all reviewed outfit fits** and **Restore all reviewed outfit fits JSON**. A single user-directed JSON file can contain 1–4 already reviewed garment fits; it never includes an original photograph, a PNG/data URL, actual clothing pixel content, a user/email/account identifier, phone information or token.

The file contains only a strictly fixed schema of existing Work47 source-bound SHA-256 fit recipes. The secure handler requires the currently active protected viewer, exact existing reviewed PNG identity and dimensions for **every** item, same complete outfit slot inventory and current garment record identity. Before changing a preview, it validates all entries. It then uses the existing **atomic** preview renderer; on any failure it restores every pre-existing record, preview canvas and fit geometry instead of partially applying an outfit. It cannot create a garment, impersonate a wardrobe owner, bypass original-photo cutout review, or approve an avatar. It is deliberately local only: no cloud, automatic saved outfit association, browser storage, upload or external sending.

The existing single-garment Download fit adjustments/Restore fit adjustments remains unchanged. Manual edits and Work54's **Suggest starting fit** remain available, and actual garment fitting is still human-reviewed. The app retains its #71 private issue note and #72 on-phone checklist.

## Source and byte-level boundaries

Parent green [PR #389](https://github.com/nickhaney916-lang/Closet-Current/pull/389), exact `90ec4ac471c255ea096edadaf1d86463d7951e3a`, [CI #40764866072](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40764866072) SUCCESS.

The new builder copies the entire compiled #74 candidate; only `__alpha_research/work47/editor.mjs` is augmented and one source-bound `__alpha_research/family-alpha-75/outfit-fit-pack.mjs` is added, with a HOLD marker. Every other inherited compiled asset is compared byte-for-byte, including original-photo JPEG treatment, source identity, Auth, cloud backup, private account controls, mask cleanup and garment fitting, outfit storage/swapping, browser session guard, and testing UI.

## Reproduce the exact offline checks

```sh
node scripts/build-family-alpha-75-fit-pack-hold.mjs
node --test tests/family-alpha-75-outfit-fit-pack.test.mjs tests/family-alpha-74-work54-phone-integration.test.mjs
node scripts/test-family-alpha-75-outfit-fit-pack-browser.mjs
node scripts/test-family-alpha-72-guided-phone-browser.mjs
node scripts/test-family-alpha-71-feedback-browser.mjs
```

The node tests include multiple actual garment slots, same-source round-trip, changing one pixel identity, missing or duplicated items, unknown slots, unsafe geometry, forged approvals and private fields, entire-pack fail closed, and immutable compiled asset checks. The browser test reuses #74's **actual protected full Work54 cutout/fit/outfit/storage/security journey**, injects a trusted-click pack download, modifies the preview, restores the exact original pixels, attempts a forged-approval pack import and verifies no change.

**Family Alpha still HOLD:** no new licensed-photo human PASS (0 PASS / 5 REVIEW / 10 FAIL), Work53/55 still independent; no live two-account JWT, physical phone, cloud restore or invitation approval. No merge/deploy, production/staging changes, private photos, paid services or Drive Duel modification.
