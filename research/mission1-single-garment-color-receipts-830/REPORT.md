# Closet Current — Mission 1 P830: honest primary-color evidence for one-garment photo trial

**FAMILY ALPHA HOLD #255 — research-only, draft, unmerged, undeployed. No hosted family account or customer photo, no cloud/staging/production writes.**

## Intent
Make the **optional family recognition-only tester** measure what matters to a closet user: original photograph → broad category, specific item type, and **primary color**. This does not claim the app's recognition model became more accurate, and does NOT authorize a wife/family deployment.

## Verified independent parent
[P829 exact-HEAD browser/Node green](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43102764048), `0435cd55cd1708a2b375a9ef7dd1cb9182df5eac`, 3/3 success: 263/263 Node, Chromium and WebKit original production FashionCLIP worker, two SHA-verified pre-existing publisher photos, 320/390/430 touch viewports, privacy-safe report and review/abstention. Work stacked exactly on this head with no changes to model, threshold, local-worker, cloud, deployment or repository main.

## P830 behavior and sources
- Optional **Primary color** field (13 fixed garment color categories, matching the actual `garmentDetailGroups(choice)` scorer): Black, White, Gray, Beige, Brown, Blue, Green, Red, Pink, Purple, Yellow, Orange, Multicolor. Disabled until a **clothing** category is selected, disabled for Not clothing, changes locked **before** inference. No source photo or arbitrary notes enter a reported value.
- Color result comes **only from `raw.details.color` in existing local FashionCLIP strong garment classification**, which is emitted by an independent confirmatory detail pass when usable. No model color invented from primary color of the pixels, no source image filename, no private tokens, no unverified category-only `details`. Unknown, unsupported, and category-review color are null/abstentions.
- Score color independently from category/type: `colorsChecked` includes every externally labeled color including timeouts, `colorPredicted` when the actual verified strong worker supplied a supported color, `colorMatches`, `incorrectAutomaticColors` only when verified color **conflicts** with selected label, and `colorUnreported` for missing/abstained/error results (never a false accuracy credit). Add explicit per-photo label/color evidence, safe out-of-band from original image, to the existing sanitized JSON.
- Per-photo UI uses P829's existing honest verdict, making a confident wrong color a **FAIL** even when category and type matched; withholding color makes it **REVIEW** instead of pass if a color was labeled. Multiple attempts may be restarted. If no primary color label was supplied, do not imply that any color accuracy was tested.
- Two synthetic privacy/security focused tests cover confident correct/wrong/missing model color, reviewed category-only color suppression, closed palette, signed independently frozen human labels, runtime error denominator, no private strings. Actual two-browser original-worker run exercises the color selection/lock control but **deliberately clears the selection** for publicly sourced positive fixture rather than fabricate independent human color truth.

## Evidence requirements
Strict dedicated no-deploy CI: exact known verified P829 parent; seven allowlisted paths only; native build; 265 expected test cases including original P829; full Node suite; actual browser worker for Chromium AND WebKit on SHA-verified public publisher garment + non-garment, 320/390/430 CSS mobile widths, report safe, no mock model or automatic color claim without genuinely human labeled original. **Do not assert this finished until exact final-head 3/3 CI success.**

## Trial and release boundary
The new P830 preview stays only in a DRAFT research branch, not available to a family member at the production URL. An authorized, protected, separately deployed preview (or locally served approved demo) and actual physical iPhone/Android real photos remain unverified; EMAIL and owner-private cloud acceptance gates unresolved. The future blind test should involve genuine independent human labels for category, subtype and primary color before inference. The 23-label P828 group/segmentation benchmark is a separate, development-exposed cohort with 13 repeated missed garments across browsers. No general accuracy estimate or alpha release claimed.

**Family Alpha HOLD #255 remains open.**
