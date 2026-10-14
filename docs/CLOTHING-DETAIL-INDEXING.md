# Clothing detail indexing

The crop recheck now carries the model's verified color, pattern, fit and sleeve details into its preview and explicit **Use suggested clothing details** action. Previously this path retained category/type/sleeves and dropped other returned details. Automatic indexing already retained verified attributes; it now shares the same whitelisted application rules, with garment fit marked not applicable for shoes/accessories and sleeves marked not applicable for bottoms/shoes/accessories.

**Adjust details → Fill missing details from photo** fills empty or Unknown visible fields using the existing confidence and segmentation checks. It operates on the editor's draft until Save changes. Existing names, categories, types, manual colors, fit and sleeves are preserved, including manual edits made during an in-flight check. A conflicting category is reported for review via Crop photo. Canceled dialogs and uncertain/unavailable recognition preserve saved data.

The editor lists unresolved core fields. Seasons are confirmed by the wearer. Brand, size, material, occasion and notes remain user-entered; visual recognition does not read tags or invent this information. Optional label fields are excluded from core completion status. No model, vectors, prompts, confidence thresholds, camera settings or crop resolution were changed.

## Validation

197 Node tests passed, including typed field validation, manual preservation, explicit overwrite limits, inappropriate fit/sleeve rejection, unsupported metadata rejection and completion requirements. Browser tests exercise retained crop attributes, filling missing fields, preserving a manual color entered during recognition, label metadata preservation, season confirmation and saving alongside the existing private recovery suite.

Real FashionCLIP inference was rerun on 32 reviewed photos, 16 additional/negative photos and 11 independent fresh photos. Locked category/type/acceptance regression checks passed for every set. On the 32-photo set, categories remain correct for 26/32 (81.25%), including one dress requiring subtype review. Shoes remain 12/13 by category. The 16-photo set rejects all three negatives; 7/13 clothing categories match. The independent set remains 10/11 by category. Exact subtype identification remains weaker than category identification and needs further work.

For the 25 strongly accepted garments in the 32-photo set, the previous crop action retained 0 color, 0 pattern, 0 garment-fit and 3 sleeve results. Applying the new path to the identical production model outputs retains **12 color, 8 pattern, 2 garment-fit and 3 sleeve results**. This is a field-retention comparison, not a before/after model accuracy claim. These photos have category/type annotations, not attribute ground truth. Attribute correctness is not measured by the counts. Unknown attributes remain unknown.

[Real inference and regressions](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/38626580716). Reports contain licensed-fixture metadata only; no real user wardrobe photos were inspected. Drive Duel was not accessed or modified.

[Browser editing and recovery run](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/38626869682). Field-retention rows are in `clothing-detail-coverage.json`; browser booleans are in `clothing-detail-flow-results.json`.
