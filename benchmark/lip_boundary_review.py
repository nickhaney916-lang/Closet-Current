"""Research-only ambiguity along the boundary of pinned LIP clothing classes.

Only existing garment-class labels can supply a competing target; no pixels
predicted as body, hair, face or background are added to experimental outlines.
Raw model-logit margins are not probability, accuracy or physical instances.
"""
import numpy as np

TARGETS = {"coat": (7,), "skirt": (12,), "shoe_pair": (18, 19)}
CLOTHING_CLASSES = (5, 6, 7, 9, 10, 12, 18, 19)


def _nearby(mask, radius):
    near = mask.copy()
    h, w = mask.shape
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            if not (dx or dy):
                continue
            dsty0, dsty1 = max(0, dy), min(h, h + dy)
            dstx0, dstx1 = max(0, dx), min(w, w + dx)
            srcy0, srcy1 = max(0, -dy), min(h, h - dy)
            srcx0, srcx1 = max(0, -dx), min(w, w - dx)
            if dsty1 > dsty0 and dstx1 > dstx0:
                near[dsty0:dsty1, dstx0:dstx1] |= mask[srcy0:srcy1, srcx0:srcx1]
    return near


def lip_boundary_review(labels, logits, *, radius=2, max_logit_gap=1.5):
    labels = np.asarray(labels)
    logits = np.asarray(logits)
    if (labels.ndim != 2 or labels.size < 64 or labels.size > 4_000_000
            or not np.issubdtype(labels.dtype, np.integer)
            or np.any((labels < 0) | (labels > 19))
            or logits.shape != (20, *labels.shape)
            or not np.issubdtype(logits.dtype, np.floating)
            or not np.isfinite(logits).all()
            or not np.array_equal(labels, np.argmax(logits, axis=0))
            or not isinstance(radius, int) or radius < 1 or radius > 2
            or not np.isfinite(max_logit_gap)
            or not (0.25 <= max_logit_gap <= 3)):
        raise ValueError("Invalid LIP garment score evidence")

    best = np.take_along_axis(logits, labels[None], axis=0)[0]
    garment = np.isin(labels, CLOTHING_CLASSES)
    masks = {}
    detail = []
    for role, class_ids in TARGETS.items():
        strict = np.isin(labels, class_ids)
        target_logits = np.max(logits[list(class_ids)], axis=0)
        difference = best - target_logits
        plausible = ((~strict) & garment & _nearby(strict, radius)
                     & (difference >= 0) & (difference <= max_logit_gap))
        result_mask = strict | plausible
        masks[role] = {"strict": strict, "ambiguous": plausible,
                       "reviewUnion": result_mask}
        detail.append({
            "role": role,
            "strictModelPixels": int(strict.sum()),
            "additionalUncertainModelPixels": int(plausible.sum()),
            "sourceBackgroundOrBodyPixelsAdmitted": 0,
            "unverifiedCompetingGarmentClass": True,
            "independentMaskAccuracyVerified": False,
            "reviewOnly": True,
        })
    ambiguous_counts = sum(masks[name]["ambiguous"].astype(np.uint8)
                           for name in TARGETS)
    return {
        "classes": detail, "masks": masks,
        "pixelsClaimedByMultipleReviewVariants": int(np.count_nonzero(ambiguous_counts > 1)),
        "radius": radius, "maximumLogitGap": max_logit_gap,
        "sourceRgbModified": False, "newWardrobeItems": 0,
        "verifiedRecoveredFabricPixels": 0,
        "independentGarmentAccuracyMeasured": False,
        "productionAuthorized": False,
    }
