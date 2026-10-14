# Private phone-photo validation

The existing 59-photo benchmark measures licensed public photographs. The available uploaded files inspected during the October 14 checkpoint were setup screenshots; no user phone garment dataset was established. This work does not claim new phone-photo accuracy results.

## Collect useful results

Open `phone-photo-check.html` on the app's website, or My account → Device help → Check clothing photo recognition. This optional page does not change the main navigation or add clothing to a wardrobe.

1. Choose up to 20 single-garment photos, each smaller than 10 MB. Start with five to ten different items, including dresses, long tops, sneakers and boots. Include the full hem or soles and use ordinary backgrounds and lighting.
2. Choose each expected category yourself before running recognition. Choose an expected type only when you are sure; otherwise leave Check category only. Not clothing supports a negative example.
3. Run the check. Labels remain locked through the completed test so predictions cannot influence the expected answers. Start over to change photos or labels.
4. Download `closet-phone-photo-results.json` and attach it to the development conversation. Photos and original filenames are not included. If a particular error needs visual investigation, separately attach that garment photo and identify its numbered row.

Photos stay in memory in the user's browser, use the same `photoToJPEG` import conversion as the app, and run through the production local FashionCLIP worker. No clothing is saved, no report is sent automatically, and no account or database is accessed. The separate test page does not alter the camera capture or outfit segmentation paths.

## What the report measures

The report records independently supplied category/type labels, recognized category/type, automatic versus category-review outcomes, bounded scanner rejection diagnostics, error codes and elapsed times. It includes the release identifier and recognition-vector SHA256 to identify the version tested. Personal clothing names, file names, photos, data URLs, account identifiers, email addresses, raw exceptions and arbitrary diagnostic text are excluded.

Category and subtype accuracy are separate. A confirmed dress category with Unknown type counts as a category match and a type miss when the user supplied a type. Unlabeled types are excluded from type scoring. Runtime failures remain in the denominator rather than disappearing from the report. Incorrect automatic categories and types are explicitly counted; nonclothing rejections are scored separately.

Model setup is bounded to five minutes and individual classifications to one minute. Start over cancels pending recognition and discards the current test. Failed decoding or classification is recorded per photo; a stopped worker produces errors rather than fabricated predictions.

## Validation limits

Node tests cover label consistency, independent label snapshots, review-versus-automatic scoring, negative examples, report privacy, missing/duplicate results, timeouts and cancellation. The browser flow uses two licensed existing fixtures at a 390×844 touch viewport with the actual worker, checks the downloadable report and locked controls, and verifies restart during model loading. This validates the tooling, not physical phone hardware or broader accuracy. Actual phone test reports are still required before recognition tuning can use this new evidence.
