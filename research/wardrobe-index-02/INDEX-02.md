# INDEX-02 — Signed-in mobile closet indexing and saved corrections (DRAFT HOLD)

## Purpose
Make the completed INDEX-01 private metadata index usable in the actual Closet Current My Closet interface. This is a research-branch, opt-in integration, not a production deployment and not a new visual classification model.

## Activation
`/public/index.html?index02=after` served from the **full repository root** in an authenticated test environment. The default normal app (no flag) never loads the research index. The experimental module path is deliberately outside the normal production `dist` copy: production must remain unchanged. Before public release, a separate integration priority will package and secure it inside the app's approved deployment artifact.

## What is implemented
- After existing `closetAuth.ready`, verify the exact authenticated local IndexedDB database name `closet-current-user-<owner>`; only then attach a read-only metadata index to the actual My Closet interface.
- Accessible mobile controls for category, garment subtype, color, search terms, and needs-review. All results come from currently saved owner-bound wardrobe IDs; all old browse cards and Adjust details actions remain intact. The controls never mutate source pictures or create a second wardrobe database.
- Every existing successful `queued` save/edit/delete refreshes the saved index; cloud restore explicitly refreshes. The index reads the saved state again after the real write, never trusts stale in-memory AI proposals or provisional camera drafts.
- Owner switching or logout clears the index and denies private filtered IDs. In-flight owner changes reject stale snapshots. Existing per-account database isolation, source SHA semantics and original photos remain untouched.
- Unknown/estimated colors, mismatched garment types, and uncertain source identities remain reviewable. No automatic override of user-corrected skirt/dress, shorts/skirt, sneaker/boot categories.
- 44px tap targets and responsive controls at 320, 390 and 430 pixel widths. The no-deploy browser test uses actual public/index.html and an isolated synthetic authenticated user with real IndexedDB saves. The Supabase API is mocked and all outbound network requests are forbidden.

## Verification
`node --test tests/wardrobe-index-01.test.mjs tests/wardrobe-index-02.test.mjs` + original full Node app suite + `node scripts/build.mjs` + real Chromium mobile screenshots at 320/390/430. The browser scenario changes a previously user-corrected skirt record in the actual saved IndexedDB and proves corrected category and 2D browsing update. It then logs out and proves private indexed results vanish.

### Explicit limitations
- Mobile browser simulation is not real Android/iPhone hardware testing.
- Synthetic saved-clothing picture fixtures are NOT the project's licensed 15-photo recognition benchmark and do NOT measure real clothing model accuracy, mixed-outfit capture, source RGB recognition, or cutout correctness. These remain an independent high-priority recognition QA workstream.
- Source package is not included in the default published `dist` build. The default app is unchanged without the experimental URL flag. No production deployment, no PR merge, no Family Alpha release; issue #255 HOLD.
- Denim PR #535 stays isolated; no Drive Duel or Delta Ebb modifications.

## Next work after verification
INDEX-03 — benchmark actual original licensed clothing captures, owner/private SHA matching and human-reviewed category and color improvements; then package the verified index for approved staging with physical mobile acceptance. No automatic model accuracy claims.
