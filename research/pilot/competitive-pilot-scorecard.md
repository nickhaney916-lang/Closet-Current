# Closet Current — Competitive Pilot Scorecard (v1)

**Status:** Research and pilot planning only. No results have been collected. No competitor user counts or revenue assumptions are treated as verified here.

## Objective
Measure whether Closet Current helps a user turn a newly photographed garment into three satisfactory outfits from their existing wardrobe **more accurately, quickly, and reliably** than alternative wardrobe apps.

## Comparator set
Whering, Acloset, and one additional app actually used by a pilot participant. Record app name, platform, version, pricing, and date tested. Do not assume all competitors support identical functionality; mark missing functionality **not supported**, not zero-quality.

## Recruitment and consent
Target 25–50 opt-in adult pilot participants for initial evaluation. Include a mix of experienced wardrobe-app users and new users. If minors are included in a later study, obtain appropriate parent/guardian permission and separate their data. No real customer photos in the repository, public issue comments, CI artifacts, or screenshots. Do not export competitors' user data or bypass access restrictions.

## Standardized tasks (same wardrobe and device where practical)
1. Add a photographed top, bottom, and pair of shoes; verify item type and color.
2. Add one new clothing item; generate three distinct outfits using existing items.
3. Pin the new item, swap exactly one other garment, and check whether other selections remain unchanged.
4. Reopen a saved outfit and confirm its source clothing is still correct.
5. Recover from a difficult photo (busy background, dark clothing, or patterned garment).
6. Confirm user can delete or correct an item without breaking unrelated outfits.

## Measurement definitions
- **First-outfit completion:** participant generates at least one satisfactory outfit without moderator intervention.
- **Time to first satisfactory outfit:** seconds from start of first garment capture to participant confirmation. Include retries.
- **Recognition accuracy:** independently adjudicated correct garment category and color / total evaluated items. Record category and color separately.
- **Correction burden:** manual edits or retakes per garment.
- **Three-outfit validity:** three distinct, compatible, correctly sourced outfits / attempted three-outfit sessions.
- **Swap fidelity:** swaps changing exactly the requested item / attempted swaps.
- **Original-photo fidelity:** blinded reviewer rating (1–5) for visible garment color, texture, pattern and source identity; record unsupported/occluded separately.
- **Crash-free task rate:** tasks without app crash / attempted tasks.
- **Recommendation intent:** 0–10 likelihood to recommend; report full distribution and response count.
- **Willingness to pay:** unaided answer before showing price, then response to clearly disclosed price points. Never equate interest with actual conversion.

## Study protocol
Use counterbalanced app order, the same task instructions, and comparable wardrobes. Record device, OS, connectivity, app version, account state, and whether any paid features were required. Avoid mixing physical-device observations with browser emulation. Do not claim a competitor win from incomparable task coverage. Use blinded scoring for image fidelity where feasible. Report sample size and uncertainty; do not extrapolate a small convenience sample to market share.

## Initial pilot thresholds (targets, not achieved results)
- >=95% independently adjudicated garment-category accuracy.
- >=98% successful upload completion.
- >=80% participants satisfied with at least one generated outfit.
- >=70% participants willing to recommend.
- 100% cross-account isolation and zero confirmed exposure of another account's garments.
- Zero release-blocking crashes in the pilot's core outfit flow.

## Release gate
A release recommendation requires independently executed automated regressions, reviewed security boundaries, real Android/iPhone task evidence, and an explicit list of remaining defects. No single aggregate percentage can substitute for these gates.

## Evidence table (fill only after tests)
| Date | App/version | Device | Participants | First-outfit completion | Median seconds | Category accuracy | Three-outfit validity | Swap fidelity | Crash-free tasks | Notes/evidence |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| TBD | Closet Current | TBD | 0 | Not measured | Not measured | Not measured | Not measured | Not measured | Not measured | Awaiting pilot |
| TBD | Whering | TBD | 0 | Not measured | Not measured | Not measured | Not measured | Not measured | Not measured | Feature parity to verify |
| TBD | Acloset | TBD | 0 | Not measured | Not measured | Not measured | Not measured | Not measured | Not measured | Feature parity to verify |
| TBD | Participant-selected app | TBD | 0 | Not measured | Not measured | Not measured | Not measured | Not measured | Not measured | App name pending |

## Marketing hypotheses to test
A. “Style something new with clothes you already own” is clearer than “AI digital wardrobe.”
B. A 15-second real-garment-to-three-outfits demonstration drives more pilot sign-ups than a static feature list.
C. Current wardrobe-app users value fewer manual corrections more than a larger number of features.
D. Sharing an outfit preview with no private closet metadata increases referrals.

Test copy with permission-based channels, no competitor impersonation, no unsubstantiated superiority claims, and no paid advertising until separately authorized.

## Competitive audience guardrails
Reported users, cumulative installs, monthly active users, subscribers, and paying customers are distinct metrics. Competitor audiences can overlap. Do not add them into a unique total or model acquisition as a guaranteed fraction of their reported audiences. Verify figures with dated primary sources before investor or public use.

## Ownership
The main Closet Current conversation owns pilot go/no-go, integration and launch decisions. Work #219 independently owns regression and 2D integration-readiness checks. This scorecard is a planning artifact and makes no changes to production.
