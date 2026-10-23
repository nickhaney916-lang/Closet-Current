# Closet Current — Pilot tester instructions

**Pilot is not live until the owner explicitly approves a protected test build.** Do not share an unapproved staging link or production URL. No real user photographs or personal information should be committed to GitHub.

## Tester preparation
Use an authorized test account, a supported physical phone, and clothing photos you consent to use for testing. Do not upload photos of children or people, identity documents, addresses, passwords, or financial information. Avoid sharing login codes. If the build has no approved photo-consent and deletion workflow, use licensed/synthetic garments only.

## Ten-minute walkthrough
1. Record device model, operating system, and test build version; use an anonymous session ID rather than your name.
2. Add one shirt, one bottom, and shoes. Confirm each category and color. Record errors rather than repeatedly correcting them without noting the first result.
3. Add one new item and select **Style this** (or the equivalent control). Check whether three distinct combinations appear, using items already in the closet.
4. Keep the new item selected; swap one other garment. Confirm only that garment changes.
5. Save the outfit, close/reopen the app, and confirm the correct pieces remain.
6. Try a difficult photo (dark/patterned clothing or cluttered background). Note whether the app requests review instead of guessing.
7. Log out and switch to a different authorized test account only if the test administrator has provided one. Verify no garments from the prior account appear.
8. Rate overall ease of use from 1–5, and whether you would use this weekly (yes/maybe/no).

## Result capture
Use [pilot-test-intake.csv](pilot-test-intake.csv) to record one row per task. Use [physical-phone-test-sheet.md](physical-phone-test-sheet.md) for the detailed visual-fidelity review. Record task duration in seconds and number of taps, marking blocked tasks **blocked**, not failed or passed. Do not attach photos or screenshots containing private garments to public issues. For a defect, record reproduction steps, app version, device, expected/actual result, and an anonymous defect ID.

## Success and reporting
Calculate task completion only over attempted tasks and report blocked tasks separately. Show numerator/denominator for recognition, three-outfit validity, pin/swap correctness and crash-free tasks. Do not claim a phone was tested without device evidence. Do not claim texture/fit fidelity without independent human review. No competitive superiority claim should be made without matched competitor tasks and comparable participants.

## Tester feedback prompts
- What was confusing or required extra taps?
- Did any garment appear to be the wrong type or color?
- Would you wear at least one suggested outfit? Why or why not?
- What would make you trust this app with your wardrobe?
- Which app, if any, do you currently use for closet organization? (Optional; don't guess.)

## Stop conditions
Stop and report immediately if another account's clothing appears, an original garment image is replaced, a private image is exposed, or a purchase/payment prompt appears unexpectedly. The owner decides whether to pause the pilot and whether to deploy or merge any fix.

**State:** Instructions prepared; no participants recruited, no tests run, no customer photos accessed, no launch approved.
