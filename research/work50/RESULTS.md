# Work50 visual findings — HOLD

Assistant visual assessment, not owner approval. Reviewed all fifteen original / old automatic / new native automatic / frozen provisional / automatic-cleanup image rows and native dress / boot close-ups. Mobile fitted screenshots require the no-deploy browser matrix; run evidence is linked from PR373 and issue255. Passing software checks never promotes a visual grade.

## Measured changes

- Existing frozen dress alpha: **3,414** alpha pixels removed. Existing frozen black boot alpha: **338** removed. Seven other masks remain exact; six unavailable cutouts remain unavailable. All source RGB bytes are preserved, including transparent pixels; the encoder is decoded and compared against native RGBA.
- This is cleanup of provisional input masks, some with manual outlines. It is not proof that source-only automatic isolation solved these photos. The gallery separately shows previous automatic border-connected outputs and improved source-native proposals.
- Source-native automatic processing produces only the dress proposal in this cohort. It retains mannequin neck / shoulder material and remains unapproved. Other source-native attempts refuse unstable, complex or clipped backgrounds and keep existing extraction / source-photo fallback.
- The synthetic pale-fabric fixture that the previous global threshold rejected now matches its independently constructed reference exactly (IoU 1.0). Pale narrow straps, light-on-dark, dark-on-light and two distinct shoe silhouettes also match synthetic truth. Those controlled cases do **not** establish real-photo accuracy.
- No independent full licensed reference masks are available. Licensed mask IoU, fabric recall and semantic accuracy are **unmeasured**. Threshold disagreement, opaque counts, component counts and run protection are risk indicators, not accuracy percentages.
- Small visible-residue changes do not demonstrate a convincing additional worn garment. **No grade promotions: 0 PASS / 5 REVIEW / 10 FAIL for worn-avatar eligibility.** General automatic mannequin/hanger removal remains unsolved; all fifteen require review, manual correction or better capture. The broader success criterion of more independently accepted real-photo cutouts is not demonstrated by this candidate.

## Fifteen-photo assessment

REVIEW means a provisional fitting example still needs deliberate visual correction; FAIL means it remains a truthful original-photo / footwear reference fallback for worn-avatar eligibility. Neither grade denotes owner approval. Prior frozen/manual masks and source-native attempts are kept distinct.

| Photo | Worn grade | Automatic behavior and remaining defects |
| --- | --- | --- |
| commons-0001 shirt | REVIEW | Pale cloth / dark background uncertainty refuses cleanup. Collar / mannequin residue, sleeve perspective and hem edges need manual review. Frozen mask unchanged. |
| commons-0003 long sleeves | REVIEW | Person / pants scene refuses source-native masking; existing provisional manually outlined shirt retained. Cuffs, neckline and silhouette still need checking. |
| commons-0065 jacket | FAIL | No reliable cutout. Dark details, belt/straps, sleeve clipping and light background need manual isolation / better photograph. |
| commons-0068 coat | FAIL | Complex outdoor background and rear view; no reliable front-facing cutout or fit. Fur silhouette and hem need a better capture. |
| commons-0053 dress | REVIEW | 3,414 alpha removals reduce small near-white outer-edge residue. Fine shoulder piping and logos remain photographic. Residual mannequin material along neckline / shoulder persists; source-native automatic output includes the neck. No clear worn-realism improvement. |
| commons-0043 skirt | REVIEW | Pale waistband / studio scene refuses cleanup. Retains manual outline; waistband, hem, pleat edges and fit need review. |
| commons-0033 shorts | FAIL | Person, shirt and outdoor background remain inseparable with this local heuristic. No automatic shorts cutout; retain original photo. |
| commons-0021 pants | FAIL | Person, shirt, hands, shoes and background need semantic separation. No reliable mask; never split trouser legs into independent garments. |
| commons-0082 sneaker | FAIL | Pale shoe against light background triggers uncertainty. Existing mask retained. Laces, collar opening, sole edges and single-shoe limitation need review / photo-reference fallback. |
| commons-0088 black boot | FAIL | 338 alpha removals affect tiny boundary residue; no clear change at avatar scale. Gloss/highlights preserved. Single side-view boot cannot become two worn shoes. |
| commons-0016 blouse | REVIEW | Pale patterned cloth against pale background refuses cleanup. Pattern retained; sleeve openings, cuffs, neckline and flat sleeve fitting still require manual review. |
| commons-0079 difficult sneakers | FAIL | Busy scene and overlapping footwear; no dependable automatic mask or worn pair. Preserve photograph. |
| commons-0089 gradient boot | FAIL | Gradient background refuses processing. Existing provisional mask unchanged; boot shape / ties and single-shoe reference remain unresolved for worn fitting. |
| commons-0094 light-background boot | FAIL | Inconsistent backdrop refuses processing. Existing mask retained; thin laces / upper strap and single side-view source need review. |
| commons-0059 difficult dress | FAIL | Clipped / oblique garment and background; no reliable cutout, missing fabric cannot be invented. Retake or manually isolate visible cloth and keep photo fallback. |

## Verification boundaries

Protected app tests use offline mocked Auth/cloud/classification and synthetic records with licensed images. They can verify save/reopen, manual corrections, recommendations, swaps, favorites, original JPEG binding, account/session invalidation and storage-fault behavior; they cannot establish live Supabase RLS, physical Android/iPhone results or real cloud restore. Those remain untested. No settings, accounts, production, staging, paid services or Drive Duel changed. Family Alpha HOLD.

Reproduction, exact source and browser evidence: PR373, issue255 and `.github/workflows/work47-fit-no-deploy.yml`.
