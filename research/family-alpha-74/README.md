# Family Alpha #74 — integrate verified Work54 starting fits into main-thread protected candidate (HOLD)

## Scope

The source-pinned **Suggest starting fit** action from Work54 draft [PR #386](https://github.com/nickhaney916-lang/Closet-Current/pull/386) now operates in the main-thread **Family Alpha #72** protected development candidate, while retaining its private in-app feedback and nine-step on-phone QA. The original Work54 narrow-screen licensed-photo viewer failed CI; its isolated responsive remedy [PR #388](https://github.com/nickhaney916-lang/Closet-Current/pull/388) passed its **full** [no-deploy CI #40759167361](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40759167361): 144/144 Node, 2/2 mobile reviewer source, 21/21 baseline integration and 90-photo Chromium/WebKit 320/390/430 Work54 licensed browser cases. This establishes safe browser layout and geometry mechanics, **not** subjective visual acceptance.

**Main-thread base:** #72 exact `195d230539a58d1cf23a33367b9d13d395955565` (previous PR #387 passed 14/14 Node, 6/6 Chromium/WebKit phone UI and inherited garment-editor browser tests).

**Work54 source:** original #386 exact `4ae94144e1348efe7bd27427fee41dbedf0e030f`. `research/work54/starting-fit.mjs` and `scripts/build-work54-fit-hold.mjs` are **unchanged Git blobs**, validated against their exact SHA-1 Git blob identities before integration, and compared to the separate Work54 compiled editor. Tests/scripts likewise come from exact Work54 source. The responsive review-page CSS from #388 is deliberately not mixed into the protected app: its successful independent CI is linked as evidence, and Work #55 owns independent visual review.

## Functional implementation

1. Build the protected #72 Family Alpha candidate using its exact inherited implementation.
2. Build the separately audited Work54 candidate using the exact pinned Work54 builder and planner.
3. Copy the full #72 candidate into an **isolated** #74 output directory.
4. Change **one** compiled asset, `__alpha_research/work47/editor.mjs`, using Work54's existing exact `patchEditor()` function. Assert byte-for-byte equality to the separately built Work54 editor.
5. Add only `__alpha_research/work54/starting-fit.mjs` and a HOLD marker. All other protected app assets — original JPEG, wardrobe, source SHA binding, review cancellation, manual fit, fit recipe, layer engine, photos, Auth, backup, private feedback, phone checklist, navigation, index — must be **byte-identical** to parent #72.
6. The new action is offered **after human review of a source cutout**, requires a trusted user click, preserves existing manual or restored fits, rejects unstable/opaque/unsafe/footwear sources, and leaves the user able to revise or reset suggestions. A mechanical suggestion does not authorize avatar or family testing.

## Verification

```sh
node scripts/build-family-alpha-74-work54-phone-hold.mjs
node --test tests/work54-starting-fit.test.mjs tests/work54-source.test.mjs tests/family-alpha-74-work54-phone-integration.test.mjs
node scripts/test-family-alpha-74-work54-integrated-browser.mjs
```

The real protected browser test reuses Work54's full click-to-review, fit edit/export/import, authored 3-outfit generation, swap/save, rollback and owner privacy workflow against the **combined** #74 directory. The #72 mobile phone checklist and #71 private issue-note browser tests also run. All in GitHub Actions without staging credentials or writes.

## Release interpretation

Work54 demonstrated earlier garment placement improvements on licensed shirt, dress and skirt examples, but those remain **human review required**. The standing **15 licensed photo visual grades are 0 PASS / 5 REVIEW / 10 FAIL**. The integration test covers mechanics and safety, not new quality ratings. Never claim physical-phone, live JWT/RLS, real two-account photo download, cloud-backup restore or owner visual approval.

Work #53 fine-detail isolation and Work #55 visual acceptance remain independent. No merge/deploy, production/staging changes, account invitations, paid services, external images, credentials or Drive Duel modifications. **Family Alpha remains HOLD.**
