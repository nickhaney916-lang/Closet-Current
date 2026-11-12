# Closet Current Mission 1 P837 — provisional worker identification fence

**FAMILY ALPHA HOLD #255** — RESEARCH ONLY, DRAFT PR, UNMERGED, UNDEPLOYED. No real family photos, paid inference, hosted owner accounts, existing staging, production, model weights or Supabase changes.

## Source and concrete defect

Verified [P836 draft PR #910](https://github.com/nickhaney916-lang/Closet-Current/pull/910) exact green head `5bf247a50f8bd074e3accc39c7cef3fcd57c12d1` adds opt-in `?reviewFirst836=1` to require owner confirmation before automatic wardrobe saving. The unchanged worker can emit a preliminary `identified` event before completing subtype, details, and final status; `public/app.js` previously attached this early, not-final response to the review item as if it were already recognized. This is particularly misleading given P834's observed strong, wrong Sweatshirt/Tunic/Ankle-boots classifications on real publisher originals. The preliminary UI mutation occurred *before* P836's final review-first save guard. It can remain visible if the worker later returns an error/uncertainty.

## P837 change

While the P836 review-first trial flag is explicitly enabled, ignore **preliminary** worker `identified` messages in `localRequest` and wait for the complete terminal recognition response. The existing final `recognizeItem` code still supplies a *review-required suggestion* and retains the owner photo in the private batch; it does **not** index a guessed type. Under default/legacy mode, the prior identified callback logic is exactly unchanged, allowing scientific control without changing the production path.

Four new Node behavioral tests use the **actual source handler**, mocked Worker messaging (no fake ML accuracy), and assert:
1. A preliminary wrong Sweatshirt is not stamped on the review item before the complete successful final result.
2. If a previously promising worker ends uncertain, no phantom type persists in the review item.
3. Existing unflagged behavior remains unchanged.
4. A clipped photo with a failed worker cannot inherit an optimistic type.

## Verification and boundaries

Exact P836 SHA-parent and four-file allowed-scope check, new behavioral tests, 24 existing automatic-indexing tests, full Node regressions and native build. No photo images or personal account records are placed in CI.

This is a UI integrity/safety fix **not a recognition accuracy improvement**. Independent unseen owner-quality labels, color, whole-outfit masks, physical Android/iPhone acceptance, protected authentication, and viable phone inference remain unproven. Parallel #67 owns independent classifier research, #68 true garment-instance and independent labels. No promotion or family trial. Report success ONLY after actual exact-HEAD green GitHub Actions.
