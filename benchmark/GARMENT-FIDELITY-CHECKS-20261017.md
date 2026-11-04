# Fidelity benchmark gate for AI-cleaned garment tiles — Oct 17, 2026

**Goal:** The AI is allowed to clean presentation, unfold garments and center closet views; it must NOT create a different article of clothing. The preceding generated contact sheet was illustrative only, not a direct source-conditioned image-edit result. Specific color, waistband, stitching, logo, and fabric-detail changes require review.

## Code
`public/garment-fidelity-review.js` introduces a fail-closed **pilot-only** checklist, tied into `public/garment-display-preview.js`. Even a correctly decoded preview with exact source/preview SHA checks and generic owner approval will not display without explicit owner comparison of **seven aspects**: category, dominant color, prints/graphics, visible construction (buttons/seams/zip), fabric appearance, silhouette, and number of garments. Invention of new logos or construction is a hard stop. Unknown = pending, any mismatch = reject. Independent owner comparison + source-conditioned generation attestation is required.

This is **not** an automatic proof of similarity: the checklist is manual pilot metadata and could be misrepresented. It does not authorize automatic saved-image replacement or change source photo, account, login, recognition crop or try-on. There are no new screens or required customer questions; it is an internal review gate for optional prototypes. A production design should use cryptographically server-authenticated provenance, original/private photo permissions, device measurements and actual paired-image evaluation before rollout.

`benchmark/AI-RECONSTRUCTION-CONCEPT-FIDELITY-20261017.json` documents clear limitations of the previous demonstration: specifically the new shorts waistband details, altered denim coloring and unverified jacket/shoe construction. Those are **qualitative observations**, not measured recognition accuracy or ground-truth fidelity scores.

**Next real-image milestone:** Obtain explicitly allowed source-conditioned normalized candidates using verified originals (no guessed provenance), compare actual garment details side-by-side, score key fidelity and false-change rate, and record mobile/render/billing cost. Only then enable controlled preview rendering. Draft PR #7; no live app or Drive Duel change.
