# Conservative automatic extraction proposals on real photos

Separate branch based on PR #36 `9943f7e`. PR #35/#36/#37 branches are unchanged. The 12-case manifest is reused unchanged from PR #37. No recognition source, high-resolution photograph, saved closet item, cache or paid-service setting is replaced.

## New local algorithm

`public/dark-studio-garment-mask.js` proposes an alpha mask only for a bounded original-pixel analysis copy with a near-completely dark neutral exterior and substantial distinct saturated fabric. Four-connected flood fill removes only dark neutral pixels connected to the exterior. Enclosed dark logos, buttons and seams remain untouched; no interior hole filling, erosion, color painting or new fabric is performed. Ambiguous dark/pale clothing, bottom/shoe categories, border clutter, existing alpha, oversized data, weak fabric contrast and substantial separate foreground components are refused. Existing transparent garments continue through the unchanged native-alpha path.

`applyAlpha` returns a copy, preserves every RGB byte and can only decrease original opacity. Diagnostic candidates are trimmed and passed through the existing local inverse mesh warp by the benchmark and browser probes. Resampling in the mesh is separate from the zero-RGB-edit extraction claim.

**New masks have `proposalAvailable:true` but `eligible:false` and `displayEligible:false`.** A useful mask proposal is not proof of complete garment-only boundaries. The module is available locally for diagnostics, and unreviewed new masks cannot enter the default figure display/cache. The current normal preview continues to hold these original scenes. No manual crop or extra review UI was added to the customer flow.

## Reproduce and inspect

Use Node 22 and Python 3.12 with Pillow 11.3.0:

```sh
python -m pip install Pillow==11.3.0
python scripts/benchmark-dark-studio-extraction.py
node scripts/assert-dark-studio-evidence.cjs
node --test tests/dark-studio-garment-mask.test.cjs
```

Open `artifacts/dark-studio-extraction/index.html`. It includes the unchanged source thumbnails, a checkerboard cutout and local mesh diagnostic for the proposal, original attribution/license links and derivative notices. `results.json` binds exact source bytes and pipeline hashes. Run twice and compare the JSON for deterministic output. CI also runs the built application and the new extraction API in Android Chromium/iPhone WebKit emulation, with licensed public fixtures only.

## Actual local measurements

Pinned Pillow analysis of 12 licensed original photographs produces **1 automatic proposal**, `commons-0002` (red Diesel T-shirt), and **11 cases without a new proposal**. There are **0 newly approved automatic displays** and **0 independently scored full masks**.

At 316×473 analysis resolution, the red-shirt proposal removes **87,179 exterior-connected dark pixels (58.3262% of the frame)**, including the sampled mannequin neck and stand. **0 RGB bytes change before warp**. All **5,694 pixels in 8 source-inspected garment-core patches** remain opaque, including logo, pocket, left sleeve, right-sleeve core, both shoulder cores, collar and hem. All **7,993 pixels in 4 sampled exterior/neck/stand patches** become transparent. Original JPEG SHA-256 remains unchanged. This measures partial source-patch retention/removal, not whole-mask precision, recall, realistic fit or brand-identity correctness.

The source-patch rectangles were inspected by the assistant, not independent human annotators. Three initial rectangles straddled the visible background at shoulder/sleeve edges; they remain unchanged in the witness file as **boundary-ambiguous** probes, with both retained and removed counts reported. Separate clearly interior core rectangles were added rather than pretending those initial boxes were pure fabric. No full garment mask, independent reviewer or fabricated accuracy score was created.

Visual diagnostic inspection shows a retained dark fringe around parts of the collar/cuffs. Black trim that is indistinguishable from the backdrop could still be removed, and non-neutral body parts or props can remain in other unseen photographs. That uncertainty is why proposals remain held. Buttons and some texture/soft-alpha cases are synthetic regression checks, not new positive real-button or fabric-fidelity evidence.

## Remaining real-photo failures

- Pale printed top: dark/neutral/pale material ambiguity; no new proposal.
- Black AJ long-sleeve shirt: dark fabric plus mannequin/trousers scene; no new proposal.
- Two jeans, orange shorts and patterned skirt: waist/mannequin/shoes/hangers or multi-object scenes; bottom extraction unsupported here.
- Black dress: pale attached mannequin neck remains a white-matte HOLD; dark proposal unavailable.
- Gray lapel jacket, rear-view fur coat and pale embroidered coat: neutral material, nonuniform backdrop, rear pose or lining ambiguity; no new proposal.
- Black shoe outdoors: shoe/ground/sole/lace ambiguity; unsupported here.

Next quality evidence requires independently reviewed full garment outlines, boundary-specific scoring, dark-cuff/black-trim counterexamples, and real multi-garment layering. Physical phones, full-resolution licensed figure assets and realistic cloth drape remain unresolved. Browser emulation verifies execution and source-patch behavior in those engines; it cannot prove physical-phone speed or complete real-photo visual quality.

No paid inference, external model service, purchases, customer uploads, merge, deployment or Drive Duel changes.
