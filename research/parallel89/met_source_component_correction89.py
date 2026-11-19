"""Met 70759 original-photo disputed-region causal witnesses, research only.

Two observed source-image uncertainty regions receive independent *photographic*
color-reference checks: an exterior near-white wedge at 2551406 and the
colored/cream cloth-looking tie at 2551408. These are SOURCE-LOCKED research
hypotheses, not curator/expert segmentations, not physical camera calibration
and not validated wearable 3D.

The true original RGB full-image SHA, original prior mask SHA, and source
uncertainty-union SHA must ALL reconcile before any candidate changes. The
original mask/source are NEVER mutated. Only a separated 2551408 candidate
can contain its exact already-disputed component. Every other disputed pixel
stays excluded. No source background guess becomes false human approval.
"""
import hashlib
import math

import cv2
import numpy as np
from met_full_mask_proposal89 import SOURCES

REGIONS={
  2551406:{
    "expectedBBox":[864,115,1076,522],"expectedUncertainPixels":13180,
    "exteriorBackgroundReferencePixel":[1100,250],
    "photographedClothReferencePixel":[900,200],
    "sourceResearchHypothesis":"retain_excluded_probable_photo_background",
    "museumExactViewCaption":"a) front"
  },
  2551408:{
    "expectedBBox":[580,64,626,85],"expectedUncertainPixels":549,
    "exteriorBackgroundReferencePixel":[610,10],
    "photographedClothReferencePixel":[600,95],
    "sourceResearchHypothesis":"research_only_candidate_add_possible_fabric",
    "museumExactViewCaption":None
  }
}
def sha256_bytes(arr):
    return hashlib.sha256(np.ascontiguousarray(arr).tobytes()).hexdigest()

def source_photo_component_shape89(rgb,core,union,id,review):
    """Verify full real museum source and original mask, then classify one
    predetermined source component. Return original mask and an unapproved
    candidate, plus measurable and reproducible local source-pixel color
    comparisons. No annotation credentials implied.
    """
    case=REGIONS.get(id); original=SOURCES.get(id)
    if not case or not original:
        raise ValueError("only-two-independently-inspected-original-Met-region-IDs")
    if (not isinstance(rgb,np.ndarray) or rgb.dtype!=np.uint8 or
        rgb.shape!=(original["height"],1200,3) or
        sha256_bytes(rgb)!=original["rgb_sha"]):
        raise ValueError("actual-unmodified-original-museum-photo-RGB-hash-required")
    if (not isinstance(core,np.ndarray) or not isinstance(union,np.ndarray) or
        core.dtype!=np.uint8 or union.dtype!=np.uint8 or
        core.shape!=rgb.shape[:2] or union.shape!=rgb.shape[:2] or
        not np.isin(core,[0,255]).all() or
        not np.isin(union,[0,255]).all() or
        np.any((core>0)&(union==0))):
        raise ValueError("original-binary-core-subset-original-uncertainty-union-required")
    if (not isinstance(review,dict) or
        review.get("imageId")!=id or
        review.get("originalMuseumSourceRGBSHA256")!=original["rgb_sha"] or
        review.get("originalMaskCoreSHA256")!=sha256_bytes(core) or
        review.get("uncertaintyUnionSHA256")!=sha256_bytes(union) or
        review.get("status")!=
          "SOURCE_PHOTO_ANCHOR_CHECKS_PASS_BOUNDARY_HUMAN_REVIEW_STILL_REQUIRED" or
        review.get("museumVerifiedExactViewCaption")!=case["museumExactViewCaption"] or
        review.get("externalQualifiedAnnotatorReviewActuallyProvided") is not False or
        review.get("consumer3DAdmitted") is not False or
        review.get("releaseAuthorized") is not False):
        raise ValueError("source-locked-review-original-mask-unapproved-receipt-required")
    before=[sha256_bytes(a) for a in (rgb,core,union)]
    uncertain=((union>0)&(core==0)).astype(np.uint8)
    count,labels,stats,_=cv2.connectedComponentsWithStats(uncertain,8)
    bbox=case["expectedBBox"]
    found=[]
    for i in range(1,count):
        x,y,w,h,a=(int(v) for v in stats[i])
        if [x,y,x+w-1,y+h-1]==bbox:
            found.append((i,a))
    if len(found)!=1 or found[0][1]!=case["expectedUncertainPixels"]:
        raise ValueError("visually-inspected-Met-original-component-has-drifted")
    component=(labels==found[0][0])
    pixels=rgb[component]
    median=np.median(pixels,axis=0)
    meanRGB=np.mean(pixels,axis=0)
    hi=pixels.max(axis=1).astype(np.int16)
    lo=pixels.min(axis=1).astype(np.int16)
    brightness=pixels.mean(axis=1)
    pale=(hi-lo<=26)&(brightness>=200)
    chromatic=(hi-lo>=35)&(brightness<230)
    def swatch(pt):
        x,y=pt
        return np.median(rgb[y-3:y+4,x-3:x+4,:].reshape(-1,3),axis=0)
    exterior=swatch(case["exteriorBackgroundReferencePixel"])
    garment=swatch(case["photographedClothReferencePixel"])
    to_exterior=float(np.linalg.norm(median-exterior))
    to_cloth=float(np.linalg.norm(median-garment))
    if id==2551406:
        # The original source region is 99%+ pale, photo-color-identical
        # to unambiguous adjacent exterior background, unlike true green
        # neighboring cloth. Keep the conservative source alpha unchanged.
        if not(pale.mean()>.98 and
               to_exterior<12 and to_cloth>100 and
               to_exterior*6<to_cloth):
            raise ValueError("probable-exterior-background-causal-color-check-failed")
        recommendation="KEEP_EXCLUDED_HIGH_BACKGROUND_SIMILARITY_RESEARCH_HYPOTHESIS"
        candidate=core.copy()
    else:
        # The original image ROI visually overlaps a cream cloth tie.
        # Require distinctly colored potential textile pixels, substantial
        # similarity to independently sampled lower tie fabric vs exterior,
        # and only restore the EXACT pre-existing uncertain component into
        # a separate research candidate, never original accepted alpha.
        if not(chromatic.mean()>.90 and pale.mean()<.05 and
               to_cloth<45 and to_exterior>55 and
               to_cloth*.90<to_exterior):
            raise ValueError("potential-cream-garment-causal-color-check-failed")
        recommendation="PREVIEW_ONLY_POSSIBLE_ORIGINAL_CREAM_WAIST_TIE_FABRIC"
        candidate=np.where((core>0)|component,255,0).astype(np.uint8)
    changed=(candidate>0)&(core==0)
    if (np.any(changed&~(uncertain>0)) or
        id==2551406 and np.any(changed) or
        id==2551408 and not np.array_equal(changed,component) or
        [sha256_bytes(a) for a in (rgb,core,union)]!=before):
        raise ValueError("original-source-photo-or-conservative-mask-was-modified")
    return candidate,component,{
       "schema":"M2-Met-original-photograph-high-risk-pixel-component-correction/v1",
       "status":"SOURCE_IMAGE_INSPECTION_BASED_HYPOTHESIS_NOT_HUMAN_APPROVAL",
       "originalMetMuseumObjectNumber":"1983.21a, b",
       "imageId":id,"originalDecodedRGBSHA256":before[0],
       "originalMaskCoreSHA256":before[1],
       "originalMaskUncertaintyUnionSHA256":before[2],
       "originalBboxSourcePixels":bbox,
       "originalConnectedDisputedPixelCount":int(component.sum()),
       "originalComponentMedianRGB":median.astype(int).tolist(),
       "originalComponentMeanRGBRounded":[round(float(x),3) for x in meanRGB],
       "referenceExteriorSamplePixelOriginalXY":case["exteriorBackgroundReferencePixel"],
       "referenceInteriorClothSamplePixelOriginalXY":case["photographedClothReferencePixel"],
       "referenceExteriorMedianRGB":exterior.astype(int).tolist(),
       "referenceInteriorClothMedianRGB":garment.astype(int).tolist(),
       "photoPixelRGBEuclideanDistanceToExterior":round(to_exterior,3),
       "photoPixelRGBEuclideanDistanceToCloth":round(to_cloth,3),
       "paleOriginalPhotographPixelCount":int(pale.sum()),
       "chromaOriginalPhotographPixelCount":int(chromatic.sum()),
       "tentativePhotographicComponentClassification":recommendation,
       "nonapprovedResearchCandidateFullMaskSHA256":sha256_bytes(candidate),
       "candidatePixelsAddedOnlyFromExistingUncertainUnion":int(changed.sum()),
       "allOtherOriginalSourceUncertaintyPixelsLeftExcluded":True,
       "sourceSamplePointsAreReproducibleResearchNotExpertLabeled":True,
       "onlyCaptionVerifiedMuseumView":case["museumExactViewCaption"],
       "additionalMuseumPhotoPartAndSideStillUnverified":id!=2551406,
       "independentQualifiedReviewerActuallyAcceptedThisCorrection":False,
       "humanGroundTruthMaskApproved":False,
       "noOriginalSourcePixelOrMaskMutation":True,
       "originalMuseumSizeCannotCalibrateOriginalHonolulu":True,
       "notBodyDrapeOrPhotorealisticWearable3D":True,
       "source2DFallbackRequired":True,
       "consumer3DAdmitted":False,
       "releaseAuthorized":False,
       "familyAlpha":"HOLD"
    }
