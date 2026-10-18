# Ten-photo category union visual assessment — October 18, 2026

**Source:** GitHub Actions experimental DeepFashion ONNX run 39153143239;
artifact `pinned-deepfashion-instance-feasibility`.
The model is the pinned free Apache-2.0 ONNX checkpoint in
`benchmark/deepfashion-instance-onnx-reference.json`, with SHA-256 source
photographs retained. This is qualitative image inspection,
**not** independently measured pixel precision, recall, or F1.

## What the independent garment-instance model actually showed

| Source | Model review | Observed problem |
|---|---|---|
| `commons-0035`, orange shorts | 3 masks labeled vest/vest/skirt; 2 overlap | The source clearly shows shorts; its model category is wrong even if significant material is covered |
| `validation-0017`, hanging jeans | 2 separate trousers panels; 0 substantial overlap conflicts | A review-only Bottoms union resembles the full pair of jeans but includes a mirrored person/shirt above the waistband and some surrounding scene |
| `commons-0049`, long dress on mannequin | 4 dress masks, 0 substantial overlap conflicts | Dress union outlines much of main body but loses sleeve cuff and parts of the hem; do not infer 4 dresses |
| `commons-0065`, jacket with separate sleeves | 7 masks, 6 outerwear; 0 overlap conflicts | Outerwear union reconstructs most silhouette but leaves gaps down center and around sleeve cuffs and retains hanging straps or hardware |
| `validation-0001`, summer dress | 1 sling-dress proposal | A plausible single class label is NOT evidence of accurate clipping |
| `commons-0059`, dress and jacket | 7 proposals, 3 overlap conflicts | Overlapping dress/top suggestions can describe the same physical fabric |
| `validation-0010`, dress with blouse | 8 proposals, 2 overlap conflicts | Ambiguous multi-layer assignments; category union cannot prove physical item count |
| `validation-0031`, blazer/skirt/person | 2 proposals | Skirt is more complete than prior LIP model but blazer predicted as top; outlines unverified |
| `commons-0079` and `validation-0019`, sneakers | No proposals | Missing shoes class in this model; not evidence the photos lack shoes |

## Diagnostic implementation and strict constraints

- `benchmark/deepfashion_review_risks.py` identifies missing **specific**
  garment predictions even when a broad category appears (shorts predicted skirt),
  and catches possibly fragmented clothes despite zero intersection of masks.
- `category_union_preview` creates an internal, **source-pixel-only**
  unverified union for repeated same-category proposals.
- Every union and individual mask remains unapproved. No actual garment
  classification or original high-resolution photo was overwritten, and
  no automatically saved wardrobe item is permitted.
- A single class can represent multiple garments and multiple class masks
  can represent one garment. An IoU=0 result does not establish separateness.
- **Do not promote this model or the unions** without independent reviewer
  outline masks for shorts, pants, jackets, dresses and worn layered outfits.

## Highest next priority

1. Obtain and independently approve per-instance pixel outlines, especially
   for `validation-0017` mirrored torso contamination,
   `commons-0065` jacket fabric/straps, `commons-0049` cuffs/hem,
   `commons-0035` shorts type, and `validation-0031` worn layers.
2. Run held-out original-RGB mask IoU, garment precision/recall, and
   contamination scoring against actual approved outlines.
3. Evaluate shoes through a separate appropriately licensed model; no
   footwear class exists in this DeepFashion checkpoint.
4. Continue phone performance and capture tests separately from cloud CPU
   inference speed; no customer model deployment, new paid services,
   production merge or Drive Duel changes have been made.
