"""Conservative class evidence for a 20-class LIP human parsing model.

A semantic Socks region is NOT proof of a distinct pair of socks, tights, or
stockings. The helper intentionally never returns a wardrobe-save approval.
"""
import numpy as np

SOCKS = 8
SHOES = (18, 19)
LEG_SKIN = (16, 17)
COAT = 7
UPPER = 5


def analyze_lip_labels(labels):
    arr = np.asarray(labels)
    if arr.ndim != 2 or arr.size == 0 or arr.size > 4_000_000:
        raise ValueError("Invalid LIP map dimensions")
    if not np.issubdtype(arr.dtype, np.integer):
        raise ValueError("LIP labels must be integers")
    if np.any((arr < 0) | (arr > 19)):
        raise ValueError("Unexpected class ID")
    counts = np.bincount(arr.ravel(), minlength=20)
    mask_socks = arr == SOCKS
    mask_shoes = np.isin(arr, SHOES)
    mask_coat = arr == COAT
    mask_top = arr == UPPER
    mask_leg = np.isin(arr, LEG_SKIN)
    min_pixels = max(16, round(arr.size * 0.0002))

    def bounds(mask):
        rows, cols = np.where(mask)
        return None if rows.size == 0 else dict(
            left=int(cols.min()), top=int(rows.min()),
            right=int(cols.max() + 1), bottom=int(rows.max() + 1))

    sock_pixels = int(mask_socks.sum())
    shoe_pixels = int(mask_shoes.sum())
    visible_socks = sock_pixels >= min_pixels
    visible_shoes = shoe_pixels >= min_pixels
    return {
        "pixelCounts": {str(i): int(counts[i]) for i in range(20)},
        "sockPixels": sock_pixels,
        "shoePixels": shoe_pixels,
        "coatPixels": int(mask_coat.sum()),
        "upperGarmentPixels": int(mask_top.sum()),
        "legSkinPixels": int(mask_leg.sum()),
        "sockBounds": bounds(mask_socks),
        "shoeBounds": bounds(mask_shoes),
        "hasSubstantialSockClass": visible_socks,
        "hasSubstantialShoeClass": visible_shoes,
        "sockAndShoeLabelsPresent": visible_socks and visible_shoes,
        "dedicatedStockingsOrTightsClass": False,
        "independentGarmentInstanceMasks": False,
        "differentPhysicalGarmentsVerified": False,
        "pixelAccuracyMeasured": False,
        "automaticallySavedGarments": 0,
        "productionAuthorized": False,
        "captureRequiresExtraButton": False,
    }
