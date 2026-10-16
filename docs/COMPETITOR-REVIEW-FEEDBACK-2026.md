# Competitor feedback: Whering and Acloset — 2026-10-15

Research basis: sampled public Google Play, App Store and Reddit reviews as of October 2026. Individual complaints are examples and do not establish market-wide prevalence. Do not claim an absent feature without checking current competitor documentation.

## Evidence and problems
1. **High-friction wardrobe import**: Whering camera upload retries and crop failures; Acloset photo drafts and correcting tags. Sources: https://play.google.com/store/apps/details?id=com.whering.app ; https://play.google.com/store/apps/details?id=com.looko.acloset ; https://www.reddit.com/r/whering/comments/1k9b6lq
2. **Wrong categorization and image fidelity**: users report incorrect colors/tags/categories in Whering and Acloset AI image enhancer modifying original details. Sources: https://www.appbrain.com/app/com.whering.app ; https://play.google.com/store/apps/details?id=com.looko.acloset
3. **Poor recommendations**: outfit mismatch, repetition, seasonal issues. Sources: https://www.reddit.com/r/whering/comments/1n5vhp6/not_user_friendly_at_times/ ; https://play.google.com/store/apps/details?id=com.looko.acloset
4. **Complex UI and charges**: reviews mention unresponsive buttons, confusing navigation, abrupt free tier threshold and extra virtual-try-on credits. Sources: https://apps.apple.com/us/app/acloset-ai-fashion-assistant/id1542311809?see-all=reviews ; https://play.google.com/store/apps/details?id=com.looko.acloset
5. **Desire for wearable realistic visualization**: https://www.reddit.com/r/complaints/comments/1qaz5uk/why_do_all_virtual_closet_apps_suck_i_just_want/

**Critical competitor feature parity:** Acloset already provides AI detection of garments in selfies/full-body photos, auto background removal, AI styling, and VTON on an avatar made from the user's photo. https://www.acloset.app/support/ . Whering already offers extensive wardrobe capture, outfit suggestions, background removal and weather planning; do not claim these are unique.

## Priority backlog — no new features implemented by this brief
P0: one-tap photo capture, lossless original storage, resilient background processing and retries, batch full-outfit segmentation with user review only on low confidence. Test with real Android/iOS photos, offline/poor connection, and broad garment taxonomy (skirt/shorts, sleeve length, trousers/jeans).
P0: garment fidelity benchmark — compare crop and AI visualization to original photos by silhouette, logos, patterns, colors, stitching, sleeve and hem lengths. Never substitute invented garments silently; show original reference photos.
P0: four clear large-touch targets on first screen: Photograph Clothing, Photograph Full Outfit, My Closet, Create Outfit. Single-step ambiguous category confirmation; no duplicated dashboard screens. Test task completion with nontechnical users.
P1: useful recommendations from actual items only, compatible categories, season/occasion constraints, negative feedback, availability/laundry rotation, avoid repeating rejected outfits. Add consistent reproducible recommendation tests.
P1: clear limits and pricing upfront; keep useful core features free, no surprise fees, opt-in paid AI credits only once provider costs and billing are validated. Ability to export originals and catalog to avoid lock-in.
P2: optional borrowed-items list, wardrobe-gaps/capsule planning, email/retailer import only after privacy and consent are solved.

## Release quality gates — targets, NOT current performance
- Photo-to-index reliability measured on a held-out real-photo dataset; no lost images under interrupted uploads.
- Aspirational >=98% broad category, >=95% detailed subtype accuracy on pre-agreed realistic labeled dataset. Per-class results, confusion matrix, false positives, and manual corrections published internally.
- >=95% completed batch upload sessions on poor-network test scenarios; target to be validated and adjusted from pilot.
- Zero silent garment swaps/alterations in accepted AI previews; if uncertain or model changes key details, warn or refuse. The current FLUX proposal is general image generation, NOT verified virtual try-on.
- Usability study: unassisted first garment upload and outfit creation, capture median taps/time and successful completions. Target <=3 user actions per item when high confidence.
- No production rollouts or paid image-generation requests until the user approves.
