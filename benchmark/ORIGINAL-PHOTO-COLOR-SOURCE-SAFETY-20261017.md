# Source-photo classification and garment-only color protection
Whole-outfit garment recognition continues to inspect the original RGB
photographic crop, not the modified display cutout or AI-normalized asset.
A crop may include room walls, flooring, another garment or visible skin.
Previously its generic photo-quality palette could silently become the saved
garment color even when display clipping was unreliable.

Now `trustedAutomaticPhotoColor` declines generic unmasked color estimates
for whole-outfit pieces in automatic recognition, the details editor, and
manual crop saves. Camera-original photo quality/blank checks and model
classification are unchanged. A trusted garment-mask palette captured
separately remains usable; single-garment photo colors are unaffected.

Without a reliable color the user can still use the existing one-tap color
confirmation; no invented garment color, additional tab or paid model.
This is a source-trust engineering fix, not verified real-photo color
accuracy. Draft PR #7 only. No production deploy or Drive Duel changes.
