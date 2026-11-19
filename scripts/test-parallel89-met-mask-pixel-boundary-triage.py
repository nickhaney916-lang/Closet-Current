"""Genuine SHA-attested Met four original source-mask boundary research QA.
Produces review visual aids and structured NON-APPROVAL annotations. No human
label is forged. Source RGB buffers come from exact-museum JPEG+Sharp SHA
checks in the inherited genuine no-deploy runner.
"""
import hashlib
import json
import sys
from pathlib import Path
import cv2
import numpy as np

ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT/"research"/"parallel89"))
from met_full_mask_proposal89 import SOURCES,propose_full_mask
from met_mask_boundary_triage89 import (
 REVIEW_ANCHORS,review_original_met_mask89,make_boundary_review_overlay89)

SOURCE=ROOT/"benchmark"/"parallel89-met70759-four-photo-research"
OUT=ROOT/"benchmark"/"parallel89-met70759-boundary-review-UNAPPROVED"
OUT.mkdir(parents=True,exist_ok=True)
receipts=[]
for image_id,src in sorted(SOURCES.items()):
    f=SOURCE/f"met-70759-gallery-{image_id}.rgb"
    if not f.is_file():
        raise RuntimeError("missing-independent-original-museum-rgb-source")
    raw=f.read_bytes()
    if len(raw)!=1200*src["height"]*3 or hashlib.sha256(raw).hexdigest()!=src["rgb_sha"]:
        raise RuntimeError("original-museum-photo-pixels-not-verified")
    rgb=np.frombuffer(raw,dtype=np.uint8).reshape((src["height"],1200,3)).copy()
    originalSHA=hashlib.sha256(rgb.tobytes()).hexdigest()
    core,union,seg=propose_full_mask(rgb,image_id)
    review=review_original_met_mask89(rgb,image_id,core,union)
    if hashlib.sha256(rgb.tobytes()).hexdigest()!=originalSHA:
        raise RuntimeError("source-pixel-alteration-detected")
    if review["status"]!="SOURCE_PHOTO_ANCHOR_CHECKS_PASS_BOUNDARY_HUMAN_REVIEW_STILL_REQUIRED":
        raise RuntimeError("boundary-review-should-remain-pending")
    if not review["researchAnchorChecksAllPassed"] or review["externalQualifiedAnnotatorReviewActuallyProvided"]:
        raise RuntimeError("false-research-annotation-approval")
    if review["disputedPixelCount"]!=seg["uncertainBoundaryPixelCount"]:
        raise RuntimeError("disputed-source-boundary-count-does-not-reconcile")
    if (review["distinctlyChromaticPotentialClothPixels"]+
        review["paleNearBackgroundOrWaistbandPixels"]+
        review["otherAmbiguousDisputedPixels"]!=review["disputedPixelCount"]):
        raise RuntimeError("untracked-source-boundary-pixel-category")
    if review["consumer3DAdmitted"] or review["releaseAuthorized"]:
        raise RuntimeError("consumer-release-forbidden")
    if image_id==2551406:
        if review["highestPriorityRegionRequiresExpertBoundaryAdjudication"]!="HIGHEST-BOUNDARY-REVIEW-PRIORITY":
            raise RuntimeError("source-2551406-upper-right-near-white-boundary-risk-overlooked")
    annotated=make_boundary_review_overlay89(rgb,core,union,review)
    if not cv2.imwrite(str(OUT/f"met-{image_id}-SOURCE-BOUNDARY-REVIEW-NEEDED.png"),annotated):
        raise RuntimeError("failed-to-write-original-pixel-review-annotation")
    for rank,reg in enumerate(review["largestConnectedDisputedReviewRegions"][:3]):
        x0,y0,x1,y1=reg["bboxOriginalPixels"]
        pad=55
        x0=max(0,x0-pad);y0=max(0,y0-pad)
        x1=min(1199,x1+pad);y1=min(src["height"]-1,y1+pad)
        if not cv2.imwrite(
          str(OUT/f"met-{image_id}-uncertain-source-region-{rank+1}-REVIEW.png"),
          annotated[y0:y1+1,x0:x1+1]):
            raise RuntimeError("failed-source-risk-crop")
    review["sourceConservativeForegroundMaskPNGNotModified"]=True
    review["actualOriginalImagePixelsUnchanged"]=True
    receipts.append(review)
    print("M2_MET_REAL_MASK_BOUNDARY_REVIEW_UNAPPROVED "+json.dumps({
      "id":image_id,
      "sourceRGBSHA256":review["originalMuseumSourceRGBSHA256"],
      "maskSHA256":review["originalMaskCoreSHA256"],
      "interiorBackgroundAnchors":review["researchInteriorBackgroundSentinelCount"],
      "unresolvedPixelCount":review["disputedPixelCount"],
      "chromaticPotentialCloth":review["distinctlyChromaticPotentialClothPixels"],
      "nearNeutralAmbiguity":review["paleNearBackgroundOrWaistbandPixels"],
      "reviewPriority":review["highestPriorityRegionRequiresExpertBoundaryAdjudication"],
      "expertAccepted":False,"consumer3DAdmitted":False,
      "familyAlpha":"HOLD"
    },sort_keys=True))
if len(receipts)!=4:
    raise RuntimeError("must-cover-every-independent-museum-source-photo")
if sum(x["museumVerifiedExactViewCaption"] is not None for x in receipts)!=1:
    raise RuntimeError("unknown-met-part-view-labels-were-promoted")
if not all(x["externalQualifiedAnnotatorReviewActuallyProvided"] is False for x in receipts):
    raise RuntimeError("human-review-status-misrepresented")
report={
 "schema":"M2-original-Met-four-mask-targeted-human-review-queue/v1",
 "officialMetSourcePage":"https://www.metmuseum.org/art/collection/search/70759",
 "officialMetObjectNumber":"1983.21a, b",
 "sourceOriginalFullImageDigestAndMaskPerPhotoReceipts":receipts,
 "targetHighestUncertaintyFirst":sorted(
   [x["imageId"] for x in receipts],
   key=lambda i:next(v["disputedPixelCount"] for v in receipts if v["imageId"]==i),
   reverse=True),
 "onlyExternallyCaptionVerifiedPhotoId":2551406,
 "sideAndPartLabelsForRemainingPhotosStillUnverified":True,
 "qualifiedIndependentReviewerIdentityOrApprovalNotReceived":True,
 "researchVisualSentinelsNotFullPixelGroundTruth":True,
 "sourceRGBAndAlphaCandidateImmutable":True,
 "allDisputedPossibleFabricPixelsStillExcludedFromMask":True,
 "noPhysicalCameraOrSignedBodyClothFitValidation":True,
 "originalHonoluluSourceAndFallbackUntouched":True,
 "consumer3DAdmitted":False,"releaseAuthorized":False,"familyAlpha":"HOLD"
}
(OUT/"met-70759-four-photo-BOUNDARY-REVIEW-QUEUE.json").write_text(
 json.dumps(report,indent=2)+"\n",encoding="utf8")
print("M2_MET_FOUR_MASK_REVIEW_QUEUE_COMPLETE_HOLD "+json.dumps({
 "sourceImageCount":4,
 "mostDisputedOriginalSourceId":report["targetHighestUncertaintyFirst"][0],
 "allQualifiedReviewStillRequired":True,
 "actual3DOrConsumerApproval":False,"familyAlpha":"HOLD"
},sort_keys=True))
