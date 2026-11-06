# Priority #87 — actual browser acceptance of COLOR85 pixel-background abstention

**RESEARCH ONLY / NO DEPLOY / Family Alpha Issue #255 HOLD.**

Verified exact starting source: Priority #85 [draft PR #640](https://github.com/nickhaney916-lang/Closet-Current/pull/640), SHA `b5167567d4a47e2ce720ccd3727647c037974b3a`, [strict green CI #42137903494](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42137903494), 809/809 Node + 24/24 browser workflows.

## Missing proof in Priority #85
COLOR85 had Node-level and static source assertions for background-conflicted pixel color advice, but its inherited camera and wardrobe browser regressions did **not actually trigger or visually verify the specific new warning**. The new explicit human confirmation remained safe, but no Playwright test had shown the deliberate background-vs-garment misclassification's exact on-screen behavior.

## Independent completion scope
Only test code, tests, strict no-deploy CI and evidence; **zero application source changes**. The new native browser acceptance imports two different generated **synthetic** JPEG photographs through the genuine original-photo intake:

- An opaque white background with an identifiable blue center. Pixel-majority alone returns White; UI should show a background-risk message, suppress COLOR46 pixel-color hints, and leave human category/subtype/color inputs blank until explicitly chosen.
- A solid-blue test JPEG without background conflict. UI should show unverified Blue pixel evidence, without filling any authoritative input.

Playwright uses the actual app UI, native crop editor, true HTML Canvas pixels, WebCrypto SHA, owner-scoped IndexedDB and save transaction. Only the detector and classifier worker interfaces are injected by an **explicit isolated test fixture**; the synthetic classifier abstains, so **NO learned-model recognition accuracy is tested**. After each selection, human UI chooses Tops/T-shirt/Blue and saves one source-bound owner-A garment, preserving exact original JPEG and SHA. Logout must clear imagery and owner B sees zero rows.

Run six Chromium/WebKit cases at 320/390/430 CSS pixels with 30 independently audited screenshot PNGs, complete inherited Node suite, full original licensed-photo CAMERA84, MIXED80, CAMERA79, SNAPSHOT78 mobile-browser privacy regression and screenshot audits.

## Scientific / release limitations
The white-background and solid-color test photographs are deliberately **synthetic controlled quality-assurance scenes** (not real household garment imagery and not independently visually annotated). Mock worker abstention explicitly does not imply genuine FashionCLIP/segmentation performance. COLOR85 edge-versus-center test remains a *conservative heuristic*, not real semantic masking. Neither the previous 59 licensed photos nor the user household samples have a sufficient two-reviewer adjudicated locked set to validate actual category/subtype/color or automatic multi-instance accuracy.

**Engineering verdict PENDING exact-head no-deploy CI.** Scientific clothing accuracy NEEDS REWORK. Physical Android/iPhone hardware camera and signed live cloud accounts NOT tested. Prior historical PR-wide research path-scope failures remain a separate merge blocker. Never merge/deploy, touch production or existing staging, or modify unrelated projects.
