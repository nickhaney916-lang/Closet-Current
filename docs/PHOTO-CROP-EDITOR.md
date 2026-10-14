# Garment crop editor

Saved closet cards and completed photo results now offer **Crop photo**. Drag the frame to move it or drag a corner to resize. Corners and the frame also support arrow keys (Shift for larger steps). Include the full garment, dress hem and shoe soles; cropping does not remove overlapping garments or infer missing portions.

The preview updates while editing. **Check recognition** runs the existing local model on the same JPEG pixels that **Save crop** will save. Confident, segmentation-compatible category/type suggestions can be applied explicitly with the checkbox. Other clothing details are retained. Uncertain or unavailable recognition does not prevent saving the crop. Moving the selection invalidates the previous suggestion. Existing segmentation safety checks remain in force.

Coordinates are normalized against the original image, independent of screen dimensions. JPEG output keeps the crop's aspect ratio, quality 0.94, maximum dimension 2048, and never enlarges small crops. Small selections show a clarity warning. Capture resolutions remain unchanged.

The pre-edit photo is retained as `originalPhoto.image`; `cropBounds` retains the selection. Later edits start from that original, so repeated cropping does not compound image loss. **Whole photo** resets the selection. Both images pass through existing private cloud image encoding, hashing and authenticated restoration. Cancel and failed local saves preserve the prior image. Crop saves refresh visual duplicate-check signatures and invalidate stale indexing metadata.

Validation: 191 Node tests cover bounds, corner inversion, tall/wide aspect ratios, pixel alignment, resolution limits, invalid coordinates and photo-result actions. The browser recovery suite exercises keyboard and emulated touch resizing, cancel, a deliberately failed local save, exact recognition/save pixel equality, explicit category application, restoration of both images in an empty browser and resetting to the original.

The browser test uses a licensed sample and a controlled recognition result to verify wiring. It is not an accuracy benchmark, real-phone hardware test, or measurement of the owner's photos. No recognition model, vector index or thresholds were changed. No personal wardrobe photos were accessed. Drive Duel was not accessed or modified.

[Validated browser run](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/38624334472). Boolean results are in `photo-crop-results.json`.
