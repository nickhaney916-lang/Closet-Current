"""Original Met four-image mask BOUNDARY review triage; not human approval.

The source-visible visual research anchors are purposely sparse and conservative.
They check the main photographed skirt and unrelated detached fabric/background,
not ground-truth garment segmentation or a curator-approved alpha boundary.

The same real photo must have been independently decoded+SHA-verified before
the source-mask candidate and union are passed here. A high GrabCut IoU is NOT
agreement with a real physical garment or expert annotation.

Requires exact source pixels and refuses all owner/consumer 3D promotion.
"""
import hashlib
import cv2
import numpy as np
from met_full_mask_proposal89 import SOURCES

REVIEW_ANCHORS = {
  2551406: {
    "interior":[(600,500),(300,600),(950,650),(500,98)],
    "background":[(40,20),(1130,100),(1150,300),(600,920)],
    "independentMuseumViewCaption":"a) front",
    "reviewHint":"Upper-right near-white background/olive garment edge"
  },
  2551407: {
    "interior":[(600,500),(300,600),(950,650),(780,100)],
    "background":[(100,60),(1120,100),(600,930)],
    "independentMuseumViewCaption":None,
    "reviewHint":"Loose pale detached cloth at upper left and right garment edge"
  },
  2551408: {
    "interior":[(600,500),(250,650),(1000,700),(700,100)],
    "background":[(1150,100),(50,100)],
    "independentMuseumViewCaption":None,
    "reviewHint":"Pale waistband/top loops require independent edge inspection"
  },
  2551409: {
    "interior":[(600,500),(250,600),(960,650),(750,130)],
    "background":[(1130,100),(30,40)],
    "independentMuseumViewCaption":None,
    "reviewHint":"Loose detached cream cloth in upper-right margin"
  }
}

def _hash(a):
    return hashlib.sha256(np.ascontiguousarray(a).tobytes()).hexdigest()

def _ensure_binary(x,h,w):
    if not isinstance(x,np.ndarray) or x.shape!=(h,w) or x.dtype!=np.uint8:
        raise ValueError("exact-source-original-size-grayscale-masks-required")
    if not np.isin(x,[0,255]).all():
        raise ValueError("candidate-masks-must-have-only-binary-0-255-values")

def classify_disagreement89(rgb,core,union):
    """Pure unit-testable RGB uncertainty categorization; no approvals."""
    if not isinstance(rgb,np.ndarray) or rgb.dtype!=np.uint8 or rgb.ndim!=3 or rgb.shape[2]!=3:
        raise ValueError("source-24bit-rgb-required")
    h,w=rgb.shape[:2]
    _ensure_binary(core,h,w)
    _ensure_binary(union,h,w)
    if np.any((core>0)&(union==0)):
        raise ValueError("candidate-foreground-not-subset-of-uncertainty-union")
    disagreement=(union>0)&(core==0)
    color=rgb.astype(np.int16)
    chroma=color.max(axis=2)-color.min(axis=2)
    brightness=color.mean(axis=2)
    colorful=disagreement&(chroma>=35)&(brightness<230)
    pale=disagreement&(chroma<=26)&(brightness>=200)
    residual=disagreement&~colorful&~pale
    n=int(disagreement.sum())
    # Contact connected components describe WHERE to review, not what is cloth.
    count,labels,stats,centroids=cv2.connectedComponentsWithStats(
       disagreement.astype(np.uint8),connectivity=8)
    regions=[]
    for idx in range(1,count):
        x,y,ww,hh,area=(int(v) for v in stats[idx])
        if area<16:
            continue
        roi=(labels[y:y+hh,x:x+ww]==idx)
        color_roi=colorful[y:y+hh,x:x+ww]
        pale_roi=pale[y:y+hh,x:x+ww]
        regions.append({
            "bboxOriginalPixels":[x,y,x+ww-1,y+hh-1],
            "disputedPixelCount":area,
            "distinctlyChromaticPotentialClothPixels":int(np.count_nonzero(roi&color_roi)),
            "paleNearBackgroundOrWaistbandPixels":int(np.count_nonzero(roi&pale_roi)),
            "reliablyAssignedAsGarmentByThisReport":False
        })
    regions.sort(key=lambda r:r["disputedPixelCount"],reverse=True)
    return {
      "disputedPixelCount":n,
      "distinctlyChromaticPotentialClothPixels":int(colorful.sum()),
      "paleNearBackgroundOrWaistbandPixels":int(pale.sum()),
      "otherAmbiguousDisputedPixels":int(residual.sum()),
      "disputedPixelCategoryCountsReconcileExactly":(
         int(colorful.sum()+pale.sum()+residual.sum())==n),
      "disputedMaskAreaFraction":round(n/(h*w),6),
      "reviewRegionsLargestFirst":regions[:12],
      "disagreementPixels":disagreement, "chromaticPixels":colorful,
      "palePixels":pale
    }

def review_original_met_mask89(rgb,image_id,core,union):
    """Original-pixel attested research QA; NEVER certifies human mask accuracy."""
    src=SOURCES.get(image_id)
    anchors=REVIEW_ANCHORS.get(image_id)
    if src is None or anchors is None:
        raise ValueError("incorrect-met-object-original-image-identity")
    if (not isinstance(rgb,np.ndarray) or rgb.dtype!=np.uint8 or
        rgb.shape!=(src["height"],1200,3)):
        raise ValueError("wrong-original-met-source-rgb-size")
    rgb=np.ascontiguousarray(rgb)
    if _hash(rgb)!=src["rgb_sha"]:
        raise ValueError("original-published-met-photo-pixel-hash-mismatch")
    metrics=classify_disagreement89(rgb,core,union)
    problems=[]
    checks=[]
    for kind in ("interior","background"):
        for x,y in anchors[kind]:
            if not 0<=x<1200 or not 0<=y<rgb.shape[0]:
                raise ValueError("visual-research-review-anchor-outside-original-image")
            # Tiny center patch stays away from visible edges; not pixelwise GT.
            y0=max(0,y-2);y1=min(rgb.shape[0],y+3)
            x0=max(0,x-2);x1=min(1200,x+3)
            vote=float(np.count_nonzero(core[y0:y1,x0:x1]))/float((y1-y0)*(x1-x0))
            expected=kind=="interior"
            passed=(vote>=.96) if expected else (vote<=.04)
            checks.append({"kind":kind,"pointOriginalPhotoPixels":[x,y],
                           "foregroundFractionInFivePixelPatch":round(vote,4),
                           "researchVisualAnchorPassed":passed,
                           "sourceHumanOrCuratorGroundTruth":False})
            if not passed:
                problems.append({"kind":kind,"pixel":[x,y],"observed":round(vote,4)})
    if problems:
        raise ValueError("source-photo-main-garment-and-unrelated-prop-anchor-control-failed:"+str(problems))
    all_disputed=metrics["disputedPixelCount"]
    if all_disputed>rgb.shape[0]*1200*.06:
        raise ValueError("original-photo-segmentation-boundary-too-unstable")
    category=(
      "HIGHEST-BOUNDARY-REVIEW-PRIORITY" if all_disputed>8000
      else "REVIEW-NEAR-NEUTRAL-AND-COLOR-BORDERS"
    )
    return {
       "schema":"M2-Met70759-four-source-mask-boundary-triage/v1",
       "status":"SOURCE_PHOTO_ANCHOR_CHECKS_PASS_BOUNDARY_HUMAN_REVIEW_STILL_REQUIRED",
       "objectNumber":"1983.21a, b",
       "imageId":int(image_id),
       "originalMuseumSourceRGBSHA256":src["rgb_sha"],
       "originalMaskCoreSHA256":_hash(core),
       "uncertaintyUnionSHA256":_hash(union),
       "sourceOriginalWidthHeight":[1200,src["height"]],
       "museumVerifiedExactViewCaption":anchors["independentMuseumViewCaption"],
       "otherMuseumViewAndPartLabelsUnverified":not src["museum_caption_verified"],
       "researchOnlyVisualAnchorProvenanceNotExpertGroundTruth":True,
       "researchInteriorBackgroundSentinelCount":len(checks),
       "sourceAttestedResearchInteriorAndBackgroundChecks":checks,
       "researchAnchorChecksAllPassed":True,
       "disputedPixelCount":all_disputed,
       "disagreementAreaFraction":metrics["disputedMaskAreaFraction"],
       "disputedPixelCategoryCountsReconcileExactly":metrics[
           "disputedPixelCategoryCountsReconcileExactly"],
       "distinctlyChromaticPotentialClothPixels":metrics[
           "distinctlyChromaticPotentialClothPixels"],
       "paleNearBackgroundOrWaistbandPixels":metrics[
           "paleNearBackgroundOrWaistbandPixels"],
       "otherAmbiguousDisputedPixels":metrics[
           "otherAmbiguousDisputedPixels"],
       "largestConnectedDisputedReviewRegions":metrics["reviewRegionsLargestFirst"],
       "highestPriorityRegionRequiresExpertBoundaryAdjudication":category,
       "sourceBoundaryReviewHint":anchors["reviewHint"],
       "detachedFabricBackgroundCannotBeSilentlyAddedToGarmentMask":True,
       "disputedPhotographicClothPixelsRemainExcludedPendingReview":True,
       "externalQualifiedAnnotatorReviewActuallyProvided":False,
       "manualGroundTruthSegmentationOrCorrectionsReceived":False,
       "verifiedSourceOnlyAFrontCaption":True,
       "physicalCameraDepthOrWearableFitDetermined":False,
       "originalHonoluluObject5152_1CalibratedFromMet":False,
       "originalPhoto2DFallbackRequired":True,
       "consumer3DAdmitted":False,"releaseAuthorized":False,
       "familyAlpha":"HOLD"
    }

def make_boundary_review_overlay89(rgb,core,union,review):
    """Make 2D reviewer aid, no mask/attestation approval or image alteration."""
    metrics=classify_disagreement89(rgb,core,union)
    bgr=cv2.cvtColor(rgb,cv2.COLOR_RGB2BGR)
    bgr=np.ascontiguousarray(bgr.copy())
    outlines,_=cv2.findContours(core,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(bgr,outlines,-1,(45,230,35),2)
    # orange = pale suspect region; violet = high-chroma possible skirt fabric.
    bgr[metrics["palePixels"]]=(0,170,255)
    bgr[metrics["chromaticPixels"]]=(225,45,215)
    for reg in review["largestConnectedDisputedReviewRegions"][:4]:
        x0,y0,x1,y1=reg["bboxOriginalPixels"]
        cv2.rectangle(bgr,(x0,y0),(x1,y1),(20,75,235),1)
    for c in review["sourceAttestedResearchInteriorAndBackgroundChecks"]:
        x,y=c["pointOriginalPhotoPixels"]
        color=(0,255,255) if c["kind"]=="interior" else (255,220,60)
        cv2.circle(bgr,(x,y),5,color,1)
    return bgr
