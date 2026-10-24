# Four-account Family Alpha guide — only after staging authorization

Allow 25–40 minutes each. Main owner must first approve the protected staging
URL, account access, privacy and phone test. This guide does not authorize
hosting, invitations or creation of accounts. Use the approved private process.

Use local tester labels A, B, C, D; keep the mapping privately outside GitHub.
Do not record real names, ages, credentials, email addresses, tokens, photo
filenames, photos, signed URLs, or identifiers in public issues or QA artifacts.
Use the feedback CSV locally on a private device. Never commit completed forms.
Share only sanitized aggregate counts and non-identifying reproduction steps.

## Per-account photo selection

Target 18 distinct garments (15–20 acceptable): four short-sleeve tops, three
long-sleeve tops, three pants, two shorts/skirts, one dress where applicable,
two jackets/outerwear, and three pairs of shoes. Substitute appropriate clothes
when a category is unavailable; mark that step NOT TESTED. Nobody needs to
photograph themselves or another person. Avoid faces, room details and labels
with personal information. Photograph one garment at a time against plain,
contrasting background with even light and the entire garment visible.

## Sequence for each tester

| Step | Action | Expected result |
| --- | --- | --- |
| LOGIN | Open approved private URL and sign in with own approved account | Own closet only; no prior tester photos |
| MANUAL | Take five individual garment photos using shutter button | Each photo retained; no accidental capture on cancel |
| AUTO | Use five-second automatic mode for five more garments, then Done | Readable countdown; earlier garments retained; no duplicate invented pieces |
| INTERRUPT | Start camera, background app, return and restart; deny permission once and retry | Camera stops safely, explains recovery; prior photos remain |
| REMAINDER | Photograph remaining 5–10 items, including shoes and outerwear | 15–20 distinct photos total, no silent loss |
| REVIEW | Compare original against cutout for every item | Correct garment, edges/color/texture recognizable; original retained |
| RETAKE | Try one poor-contrast or clipped garment then retake on plain background | Clear review/retry message; unsuitable image never becomes generic clothing |
| DETAILS | Correct category and color through Adjust; re-open saved item | Saved correction retained; garment photo visible |
| THREE | Build three different outfits from saved owned clothing | Distinct valid selections when wardrobe supports them; no shopping substitutes |
| SWAP | Swap top, then shoes, then rapidly swap twice | Only selected piece changes; last requested item wins |
| NEW | Add one new garment and use it with older clothes | New item available without losing older wardrobe |
| DRESS | Choose dress where available | Dress replaces incompatible top/pants; shoes remain |
| JACKET | Add, remove and replace outerwear | Correct layer order; underlying garments remain |
| NAVIGATE | Save outfit, open closet, return and reload | Own saved selection recovered or clear recoverable message |
| SWITCH | Log out, verify photos hidden; next tester signs in separately | No earlier tester photos in closet, review or avatar |
| RECOVER | Original tester signs in again | Own wardrobe/outfit restored; no cross-account photos |

Run at least one actual Android browser and one actual iPhone Safari, recording
only platform family, orientation and step outcomes privately. Test portrait and
landscape, comfortable taps, image proportions and sideways scroll. Browser
emulation results do not replace these steps. No need to install additional apps.

## When something fails

Stop that step; record expected/actual result using safe codes in the CSV.
Try once with clearer light/plain background or Retry. Record whether it helped.
If another account's content appears, stop testing and privately notify the main
owner without sharing photos or identifiers in GitHub. Do not delete evidence,
change settings or continue account switching to investigate.

Severity: BLOCKER = privacy leak/data loss/unusable login; HIGH = cannot capture,
save or form outfit; MEDIUM = wrong category/color/crop or swap; LOW = layout or
wording. Pass/fail and severity are separate: do not mark an unexecuted step pass.
Main conversation reviews sanitized results and owns release approval.
