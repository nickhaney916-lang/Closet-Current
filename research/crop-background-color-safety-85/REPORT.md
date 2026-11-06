# Closet Current — Priority #85: Background-dominated crop-color safety

**RESEARCH ONLY / Family Alpha Issue #255 HOLD. Never merge, deploy or change production/existing staging.**

**Starting exact verified integration:** Priority #83 [draft PR #639](https://github.com/nickhaney916-lang/Closet-Current/pull/639), HEAD `0700306a63e4409cd8e2e03ee1c812684c1be39a`, [dedicated no-deploy CI #42133626127](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42133626127) SUCCESS (803/803 inherited Node, 24 browser workflows). Existing historic PR-wide path-scope gate failures remain a separate HOLD.

## Why this change is required

The existing COLOR46 review path transforms an ordinary *opaque rectangular JPEG crop* into 48x48 pixels, then runs `PhotoColor.maskedPalette`. Without trustworthy garment masking, a large wall/table/background can dominate the pixels and give an unverified **background** color as the apparent garment color. In a deterministic 48×48 example, a blue inner garment surrounded by a wide white border yields `White` as the majority pixel family, although the center is blue. The UI already requires humans to confirm color; this safeguard also refuses to display confidently misleading pixel-primary guidance.

## Implementation

The pure `assessCropBackdropRisk85` algorithm compares high-support border-vs-center color families and triggers only when the overall dominant opaque color agrees strongly with the border, while the center has a distinctly different dominant color. When flagged, the native multiple-garment reviewer:

1. Withholds both primary and secondary **pixel-color hints** from `boundedCropColor46`.
2. Blocks the unmasked `window.checkPhoto` pixel-color fallback for that crop.
3. Displays a visible warning advising the user to adjust crop/mask and confirm the fabric color visually.
4. Preserves existing local FashionCLIP class hints as unverified, the original JPEG bytes and SHA identity, human-written category/subtype/color, explicit confirmations, and owner-private atomic save.

No model weights or independent model accuracy improved. A heuristic detecting *possible* rectangular-image background contamination is not garment segmentation. Contrasting garment borders or patterns may conservatively withhold otherwise correct pixel hints; no auto-filled label or owner-private save behavior is changed.

## Evidence and scientific limits

Six Node regressions cover false color on white-background/blue-fabric synthetic pixels, solid red fabric, true transparent mask, invalid input, SHA-256 pinned genuine licensed JPEG analysis (without pretending its color is independently ground-truthed), and the actual UI suppression/warning guards.

The previous scientific recognition audit (#60) identified provisional 9/13 broad category and 4/13 exact subtype results from a very small locked clothing subset, and no independently adjudicated primary-color truth. It did not establish current model accuracy. Actual independently labeled 100–200 diverse genuine household photographs, frozen holdouts, model execution, negative controls and physical Android/iPhone camera testing remain required. This Priority #85 must not claim new scientific category/subtype/color precision.

## Complete engineering acceptance target

- Strict five-path research-only changed-file allowlist and exact validated #83 ancestry, no production/staging/deployment changes.
- Full app build, complete inherited 803 Node suite plus six COLOR85 tests.
- Independent native Chromium/WebKit at 320/390/430: CAMERA84, MIXED80, CAMERA79 and SNAPSHOT78 authentic licensed-photo human review → private wardrobe / Style / V4 restore / owner isolation. Screenshot proof 78+72+72 plus separate CAMERA79 captures.
- Dedicated GitHub Actions exact-HEAD completion and sanitized evidence.

**Engineering verdict PENDING until CI runs on the final research SHA; scientific accuracy NEEDS REWORK.** Family Alpha #255 HOLD; PR remains draft and unmerged.
