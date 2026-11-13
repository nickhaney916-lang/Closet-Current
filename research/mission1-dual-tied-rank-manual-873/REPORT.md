# Mission 1 P873 — Tied top rank requires manual review

**Family Alpha HOLD #255 OPEN. DRAFT, UNMERGED, UNDEPLOYED.**

## Verified parent
Mission 1 P872 PR #1066, exact SHA 6403e530d179b8a40e6f9793b0c653538d5bb82a; no-deploy run #43514603348 SUCCESS with 584/584 native tests and 6/6 browser policy profiles.

## Source-verified weakness
The unchanged cross-family arbitration already sets `top_rank_tied` and `status:'abstain'` if either model's top two labels have exactly equal scores. Previously the optional comparison panel still rendered actionable `Use` subtype buttons for those ranks. The lexicographic ordering used to sort tied labels is not independent evidence of which garment subtype is correct. This is a conservative UX safety change, not proof of a wrong owner save.

## Code and test
The panel now blocks model suggestion buttons when `decision.reasons` includes `top_rank_tied`, presents a manual Adjust/Unknown message, and never changes the clothing draft or source JPEG. Existing nonclothing veto stays first. The browser test drives real observation81/arbitrate81 on synthetic Shorts/Skirt exact ties for both pinned model identities, checks no actionable buttons, no owner application and zero saves across Chromium/WebKit at widths 320/390/430. Existing normal owner confirmation, false-success refusal, owner-session invalidations and original-photo IDB persistence tests remain.

## Scope and limits
Only dual panel, browser test, this report and an exact-head no-deploy workflow are changed. The arbitration math, model weights, vectors, private wardrobes, source originals, 2D fallback, hosted Supabase, production/staging and siblings remain unchanged. Exact top-score ties may be rare in real model inference; no real-photo accuracy, subtype recall improvement or mobile stability is claimed. Genuine continuous WebKit two-model crash #83, physical iPhone/Android acceptance and independent source-disjoint human-labelled image validation remain BLOCKED. Family Alpha HOLD #255 stays active.
