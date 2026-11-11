# Mission 1 P809 — independently traceable inner garment-hole annotation

**FAMILY ALPHA HOLD #255 — research branch only; DRAFT, UNMERGED, UNDEPLOYED.**

P809 is a narrowly scoped improvement on the exact green P808 controller HEAD `d008c651d35c083ebf4ed52f235a91676ceafc01`, [verified Actions #42956329423](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42956329423). The app, private wardrobe, model and cloud are unchanged.

## Actual implementation

The already existing offline *blind* human-original-photo annotation UI could draw only outer polygons, even though the signed per-pixel annotation adapter supported subtractive `holes`. That meant a human reviewer could not correctly trace completely enclosed absent-fabric regions such as garment cutouts, open pockets, or openings without hand-editing the export. Reviewers can now explicitly select **Draw outer edge** or **Draw inner hole** after at least one outer outline. Holes render distinctly, are stored with their own garment, and are preserved as source-pixel polygons in the UNSIGNED local JSON. Finishing one garment clears its inner and outer state before the next. Switching while a polygon is unfinished is disabled, and no partial traces can be exported.

The existing `drawHumanSourcePixels774` pixel-exact deterministic rasterizer subtracts the union of hole polygons from the union of garment outer polygons; the existing prospective sealed independent human review signer consumes those source-pixel holes. The new Chromium/WebKit test verifies a drawn hole is zero in the encoded binary RLE and adjacent fabric remains one on a synthetic (not real human) photo at two phone widths. The browser is forbidden from making external network calls.

## Verification and limits

Dedicated `.github/workflows/mission1-independent-human-holes-809-no-deploy.yml`: exact P808 parent, four-path allowlist, full Node/native build, genuine headless Chromium and WebKit at 320/390 CSS widths, four individually SHA-256 checked screenshots and no external requests. Record the exact new HEAD and final CI result in PR metadata; **do not assert PASS before CI completes**.

The 64×64 synthetic image and automated clicks are fixtures only. No real independently recruited or blinded human, physical phone, new rights-cleared unseen image, two independent masks or IoU acceptance is established by this change. This is annotation *tooling*, not new scientific model accuracy. A human reviewer must manually inspect the original photo and sign their own isolated, independently prepared label. **Mission 1 is NOT yet 100% complete.**
