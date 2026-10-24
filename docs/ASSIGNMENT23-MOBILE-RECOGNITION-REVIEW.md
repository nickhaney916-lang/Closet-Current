# Family Alpha — Parallel Chat Assignment #23: Recognition Review & Correction

**Development only.** Base is open draft PR #282 head `0586d08d9d40ce5da479f5ff656e03adf2c837e0`, stacked on #279/#234. This branch changes the *manual Adjust dialog and its presentation only*; PR #282's proven, source-bound **Choose color · save** route stays untouched, as does independent request recovery PR #281. The main chat controls merging and release. Issue #255 remains HOLD.

## Issues in the prior Adjust experience

- An ambiguous saved-photo review could be submitted with the model's inherited category/color without an additional acknowledgement that the person checked the original. In particular, Bottoms/Shorts/Skirt, Shoes and Dresses have known review-conflict cases.
- A new manually reviewed photo could be saved with `Uncategorized` or missing/unsupported color, making the saved closet less reliable.
- A display mask and its original unmasked RGB crop were not immediately side-by-side in the manual editor. The full outfit scene was collapsed by default even during a layered review.
- The save path had no inline accessible explanation of why a manual submission was blocked, or a positive save status after a successful commit.

## Small UX change and safety boundaries

1. Only the **new-photo Adjust dialog** displays source-verification instructions and an unmasked recognition-source figure when the display cutout differs. For outfit-derived pieces the already-retained original full scene starts expanded.
2. For a **new** Shoes or Dresses category, Bottoms/Shorts/Skirt/Unknown, duplicate or layered/outfit-derived/clipped photo, require a separate checkbox: **"I checked the original photo, category, item type and color."** It is hidden for unambiguous new categories and saved-item editing. Changing category, subtype or color clears prior acknowledgement.
3. Manual new-photo Save and Save & style must validate a real schema-approved garment category, a valid color, and a category-consistent subtype (allow `Unknown` deliberately, do not invent a type). A missing check or invalid field blocks before any transaction.
4. Manual editor is additionally pinned to display JPEG, full original scene and segmentation hint, besides existing unmasked recognition JPEG, owner/DB and item-membership guards. A retake or changed crop while the editor is open cannot acquire approval from the old photo.
5. Inline `role=status`/`aria-live=polite` feedback explains missing fields, missing acknowledgement, source changes, saving progress and failures. Successful committed saves show **Clothing saved to My closet** without implying model accuracy. All safeguards and explicit manual corrections are kept; no backend or source identity mutations were made.
6. Targeted CSS gives the confirmation control an adequately large touch area and keeps editable fields and action buttons finger-friendly at 320–390px.

**No changes** to recognizer thresholds, native/photo accuracy tests, admission flags or the preexisting reviewed-color admission proof. No automatic approving of uncertain categories. No forced model classification, cloud, account/Auth, staging or 2D outfit renderer changes.

## Automated quality checks

The development workflow builds the actual app and runs all Node regression tests, plus `scripts/test-assignment23-review-mobile.mjs` in Chromium and WebKit at 320×844 and 390×844 using fake account IDs and JavaScript-drawn synthetic JPEGs. It exercises:

- An unrecognized photo that cannot save with unknown category or missing color.
- Shorts/Skirt choice after a category change; missing acknowledgement rejection; acknowledgement invalidation after the user changes the garment type; explicit confirmation and saved draft transaction.
- An outfit cutout showing the original RGB and an expanded full-scene photo; ambiguous layered image cannot save on the first tap; Cancel leaves it unsaved.
- A changed source image while the editor is open cannot be approved.
- No external network requests/browser exceptions/horizontal overflow.

These tests are **synthetic UI safety tests**, not real original-photo recognition accuracy or real-device QA. Browser-emulated touch does not prove on-device accessibility, camera behavior or segmentation quality. Work #20/#22 and Chat #21 cover separate accuracy/provenance/worker tests.

## Human checks still required before Family Alpha release

On authenticated protected staging with explicit owner approval, confirm: large buttons, original-vs-mask readability, camera retakes, difficult shoes/dresses/bottoms/layers, edit persistence after reload and source association on Android/iPhone devices. Verify four independent accounts, protected photos, 15–20 garments per person, and issue #255 security release gates before any launch. Never label this candidate deployed.

## Restrictions

No merge, deploy, paid services/AI, spending, real customer photos, Supabase/Cloudflare/Resend edits or Drive Duel changes.
