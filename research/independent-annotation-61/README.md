# Closet Current — BLINDED-HUMAN-COLOR-REVIEW-61

**Research only | Family Alpha Issue #255 HOLD | Never merge/deploy/change production or existing staging.** Exact verified starting SHA: Priority #60 `6b385c5a0fabb55031f81191bb2dc9819623af56`, [no-deploy Actions #42054954639 SUCCESS](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42054954639), 653/653 Node tests, 59 original JPEG SHA checks, six real private browser cases.

## What this priority actually delivers

1. A local offline **two-reviewer blinded annotation system**. Each reviewer sees the same 59 original SHA-verified licensed JPEGs in a different predetermined order. Packets contain only anonymous source IDs, local image paths and original SHA-256 identities. **They contain no previous garment category/type/color, no model predictions, no other reviewer's choices, no locked-holdout membership or expected labels.**
2. A responsive standalone research [review.html](./review.html) that renders the actual original JPEG on 320/390/430-pixel-wide browser windows and provides manual category, current Closet Current subtype, primary and optional secondary color fields. A real person can mark a photograph **Cannot determine / out of scope** with a written explanation rather than inventing a label. Non-clothing labels must explicitly be Uncategorized/Unknown with null colors. A photo must visibly load before the reviewer records anything.
3. User-initiated local JSON export with original photo SHA, self-attested reviewer ID, independent visual review statement and timestamp, one review per source, and a **partial/incomplete marker** if any photos remain. No original photo bytes, private customer items, or user credentials are embedded. No browser network request to a hosted model.
4. Independent input validator and reconciliation CLI. Distinct A/B source-bound reviews must have full valid category, subtype and color. Disagreement requires a third human: generate **only a blinded C packet of conflicting IDs**, without exposing the original two answers. Ambiguous/out-of-scope reviews remain pending. It is impossible for the software to self-generate real human answers.
5. A related fix in Priority #60's scientific gate: newly independently adjudicated ground truth, **not historical provisional filenames/categories**, determines whether a locked photograph is a garment or negative control. For example, two actual independent human reviewers may correctly identify a historical garment label as non-clothing (or the reverse). Scientific denominators follow that truth instead of the legacy manifest. Existing 59-photo categories are retained solely as provisional dataset descriptors.
6. Dedicated adversarial Node tests and actual local licensed-JPEG Chromium/WebKit mobile-width browser tests at 320, 390, 430. Browser test automation mimics button presses to prove UI/export behavior; it is **NOT a human annotation session and cannot improve scientific accuracy measurements**. Save 18 original-image screen captures, then independently SHA/dimension/nonblank audit them.

## For two real independent people to use it

From the research branch repository root:

```bash
npm install
node scripts/build-blinded-human-review-61.mjs
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/research/independent-annotation-61/review.html` locally.

- Give reviewer A only `benchmark/independent-annotation-61/packet-A.json`; give reviewer B only `packet-B.json`. Do not provide historical manifests, predictions or other reviewer files.
- Each person must personally inspect all photographs, record category/type/colors, or explicitly mark uncertainty. Both enter **distinct** reviewer IDs, acknowledge no peer/model input, and export separate JSON files from their browsers. Never treat an automation-driven or copied review as genuinely independent.
- Store the human review exports privately, outside GitHub. They are self-attested, **not cryptographically signed or identity-verified**. Obtain an outside reviewer-identity/process audit before considering them independently trustworthy.

Then reconcile only after both finish:

```bash
node scripts/reconcile-blinded-human-review-61.mjs --a /secure/review-A.json --b /secure/review-B.json
```

For disagreements the CLI writes a blinded `packet-C.json`, which a separate independent third human can review without seeing reviewer A/B conclusions. After C's own export:

```bash
node scripts/reconcile-blinded-human-review-61.mjs --a /secure/review-A.json --b /secure/review-B.json --c /secure/review-C.json
```

Only after external identity/process vetting may the reconciled claim JSON be provided to Priority #60's scientific gate as a **candidate**, not automatically approved accuracy.

## Scientific limitations and release boundary

At completion of engineering research, **no real human label study has been run here**, no one has independently judged category/subtype/color in the supplied 59 photographs, no new image-source dataset has been collected, and no actual FashionCLIP or instance model accuracy was improved or remeasured. The existing data are too small and lack independent labels: scientific verdict remains **NEEDS REWORK**. One historical validation record `validation-0008: Accessories/Scarf` remains out-of-scope, never silently recoded or discarded.

The protocol offers a path to independent human evidence; it cannot guarantee real independence or license completeness based on self-attested flags alone. Additional 100–200 truly representative, properly licensed photographs, real independent human reviewers, an untouched locked holdout, verified model inference and actual physical Android/iPhone testing remain required before Family Alpha. Production, staging, Delta Ebb and Drive Duel must never be touched in this branch.
