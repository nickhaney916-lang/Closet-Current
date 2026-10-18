"""Independent LIP semantic garment *review* candidates, never wardrobe items.

Slicing LIP labels into class-specific source-RGB masks is useful for
inspecting coat-versus-skirt predictions; those masks are not independently
annotated garment instances and must never trigger automatic catalog writes.
"""
import numpy as np

GARMENT_CLASSES = {
    "upper": (5,),
    "dress": (6,),
    "coat": (7,),
    "skirt": (12,),
    "shoe_pair": (18, 19),
}
BODY_CLASSES = (2, 13, 14, 15, 16, 17)


def candidate_class_regions(labels, *, min_area_fraction=0.003):
    array = np.asarray(labels)
    if (array.ndim != 2 or array.size < 64 or array.size > 4_000_000
            or not np.issubdtype(array.dtype, np.integer)
            or np.any(array < 0) or np.any(array > 19)
            or not np.isfinite(min_area_fraction)
            or not 0.0005 <= min_area_fraction <= 0.02):
        raise ValueError("Invalid pinned 20-class human parsing map")
    threshold = max(24, int(round(array.size * min_area_fraction)))
    results = []
    for name, class_ids in GARMENT_CLASSES.items():
        mask = np.isin(array, class_ids)
        rows, cols = np.where(mask)
        pixels = int(rows.size)
        if pixels == 0:
            continue
        bounding = {
            "left": int(cols.min()), "top": int(rows.min()),
            "right": int(cols.max() + 1), "bottom": int(rows.max() + 1)
        }
        results.append({
            "role": name, "labelIds": list(class_ids),
            "pixels": pixels, "bounds": bounding,
            "centerY": float(rows.mean()),
            "substantialModelRegion": pixels >= threshold,
            "verifiedSinglePhysicalGarment": False,
            "reviewRequired": True,
            "mask": mask
        })
    lookup = {r["role"]: r for r in results}
    coat, skirt = lookup.get("coat"), lookup.get("skirt")
    possible = bool(
        coat and skirt and coat["substantialModelRegion"]
        and skirt["substantialModelRegion"]
        and coat["centerY"] < skirt["centerY"]
    )
    return {
        "minimumCandidatePixels": threshold,
        "possibleSeparateCoatSkirtClassEvidence": possible,
        "classCandidates": results,
        "modelIsSemanticOnly": True,
        "physicalInstancesConfirmed": 0,
        "automaticallySavedGarments": 0,
        "originalPhotoModified": False,
        "pixelAccuracyMeasured": False,
        "productionAuthorized": False,
        "humanBodyClassesExcluded": list(BODY_CLASSES),
    }
