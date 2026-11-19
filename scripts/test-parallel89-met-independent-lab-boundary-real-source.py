"""True original Met 2551406 and 2551408: alternative local Lab boundary test.

Read SHA-pinned true museum original 1200-pixel decoded RGB bytes produced
by the prior native official museum JPEG fetch and decoded-image gate, use
unchanged original research core and union and source-bound review receipts.
Classify source-photo ambiguous pixels by LAB color similarity to nearest
original-IMAGE pixels of foreground vs exterior at four source smoothings.

This is a different METHOD but not independently labelled ground truth:
core/exterior classes derive from original automatic masks. If outcomes are
split, quarantine the previously proposed 549-pixel recovery rather than
pretend it is visually / physically wearable-garment approved.
"""
import copy
import hashlib
import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT/"research"/"parallel89"))
from met_full_mask_proposal89 import SOURCES,propose_full_mask
from met_local_lab_boundary_stability89 import (
 audit_real_met_boundary_stability89,sha256_ndarray)

SRC=ROOT/"benchmark"/"parallel89-met70759-four-photo-research"
REVIEW=ROOT/"benchmark"/"parallel89-met70759-boundary-review-UNAPPROVED"
OUT=ROOT/"benchmark"/"parallel89-met70759-independent-LAB-boundary-HUMAN-UNAPPROVED"
OUT.mkdir(parents=True,exist_ok=True)
manifest=json.loads((REVIEW/"met-70759-four-photo-BOUNDARY-REVIEW-QUEUE.json").read_text())
if (manifest.get("officialMetObjectNumber")!="1983.21a, b" or
    manifest.get("qualifiedIndependentReviewerIdentityOrApprovalNotReceived") is not True):
    raise RuntimeError("original-unapproved-Met-source-boundary-queue-required")
results={}
for id in (2551406,2551408):
    src=SOURCES[id]
    raw=(SRC/f"met-70759-gallery-{id}.rgb").read_bytes()
    if (len(raw)!=1200*src["height"]*3 or
        hashlib.sha256(raw).hexdigest()!=src["rgb_sha"]):
        raise RuntimeError("actual-published-original-museum-image-RGB-SHA256-not-valid")
    rgb=np.frombuffer(raw,np.uint8).reshape((src["height"],1200,3)).copy()
    core,union,alpha=propose_full_mask(rgb,id)
    receipt=next(x for x in manifest["sourceOriginalFullImageDigestAndMaskPerPhotoReceipts"]
                 if x["imageId"]==id)
    before=[sha256_ndarray(a) for a in (rgb,core,union)]
    classified,report=audit_real_met_boundary_stability89(
      rgb,core,union,receipt,id)
    assert before==[sha256_ndarray(a) for a in (rgb,core,union)]
    assert report["sourcePhotoOriginalCorePixelsChanged"]==0
    assert report["sourceOriginalPhotoPixelsChanged"]==0
    assert report["consumer3DAdmitted"] is False
    assert report["releaseAuthorized"] is False
    assert report["noExternalHumanSegmentationGroundTruth"] is True
    assert report["sourceOriginal2DFallbackRequired"] is True
    assert report["smoothingSensitiveMixedVotePixels"]>0
    count=report["originalConnectedDisputedPixelCount"]
    totals={name:int(np.count_nonzero(mask)) for name,mask in classified.items()}
    assert sum(totals.values())==count
    for name,mask in classified.items():
        assert not np.any((mask>0)&~((union>0)&(core==0)))
        _,png=cv2.imencode(".png",mask)
        (OUT/f"Met-{id}-research-LAB-{name}-NOT-GROUND-TRUTH.png").write_bytes(
          png.tobytes())
    # Explicit three-color proposed *evidence only* overlay, never garment
    # alpha: cyan = smoothing-consensus cloth candidate, warm orange = local
    # background-consensus, magenta = source-image smoothing instability.
    image=cv2.cvtColor(rgb,cv2.COLOR_RGB2BGR)
    image[classified["all_background"]>0]=(20,165,240)
    image[classified["all_cloth"]>0]=(235,220,30)
    image[classified["mixed"]>0]=(220,40,190)
    bbox=report["originalPhotoSourceBBoxPixels"]
    cv2.rectangle(image,(bbox[0],bbox[1]),(bbox[2],bbox[3]),(25,65,220),1)
    output=OUT/f"Met-{id}-original-photo-independent-LAB-boundary-QUARANTINED.png"
    if not cv2.imwrite(str(output),image):
        raise RuntimeError("original-photo-source-risk-evidence-image-write-failed")
    # Fake published JPEG or changed original core/union cannot manufacture
    # an independent new garment body/source approval receipt.
    forged=copy.deepcopy(receipt)
    forged["externalQualifiedAnnotatorReviewActuallyProvided"]=True
    wrong_image=rgb.copy();wrong_image[0,0,0]^=1
    wrong_mask=core.copy();wrong_mask[0,0]=255
    wrong_union=union.copy();wrong_union[0,0]=255
    for args in [
      (wrong_image,core,union,receipt,id),
      (rgb,wrong_mask,union,receipt,id),
      (rgb,core,wrong_union,receipt,id),
      (rgb,core,union,forged,id),
      (rgb,core,union,receipt,5152)
    ]:
        try:
            audit_real_met_boundary_stability89(*args)
        except ValueError:
            pass
        else:
            raise RuntimeError("forged-Met-source-image-or-mask-must-not-pass")
    results[str(id)]=report
    print("M2_MET_REAL_SOURCE_ALTERNATIVE_LOCAL_LAB_BOUNDARY_HOLD "+json.dumps({
      "id":id,
      "originalPhotoSHA256":report["originalRealPhotoFullRGBSHA256"],
      "sourceDisputedPixelCount":count,
      "robustClothVotes":totals["all_cloth"],
      "robustBackgroundVotes":totals["all_background"],
      "smoothingSensitiveVotes":totals["mixed"],
      "perSmoothingClothVoteFractions":[
         x["nearestColorClassClothVoteFraction"]
         for x in report["smoothingScaleReceipt"]],
      "classification":report["interpretation"],
      "externalHumanApproved":False,
      "consumer3DAdmitted":False,"familyAlpha":"HOLD"
    },sort_keys=True))
if set(results)!={"2551406","2551408"}:
    raise RuntimeError("wrong-two-original-published-source-images")
first=results["2551406"];second=results["2551408"]
if (first["allSmoothingBackgroundVotePixels"]<=10000 or
    second["allSmoothingClothVotePixels"]<=50 or
    second["allSmoothingBackgroundVotePixels"]<=50 or
    second["smoothingSensitiveMixedVotePixels"]<=50):
    raise RuntimeError("original-photo-classification-robustness-regression")
report={
 "schema":"M2-Met-70759-original-photo-independent-local-Lab-boundary-research/v1",
 "museumObjectNumber":"1983.21a, b",
 "sourcePhotographIDs":[2551406,2551408],
 "originalMuseumFullSourceRGBSHA256AndMaskHashVerified":True,
 "sourceImageObservations":results,
 "firstPhotoPaleRegionExclusionSupported":True,
 "secondPhotoAll549PixelCandidateFailsIndependentSmoothingRobustness":True,
 "secondPhotoProposedRecoveryStillNotHumanApproved":True,
 "maskDerivedSourceReferenceLabelsNotExpertTruth":True,
 "fourSmoothingsSameMethodNotFourIndependentModels":True,
 "noStableAcceptanceOfAny544Or549PhotographicPixel":True,
 "sourceOriginalCoreAndUnionAndPhotoRemainUnchanged":True,
 "neverAppliedToOriginalHonoluluSkirt":True,
 "physicalWorn3DClothFitNotDemonstrated":True,
 "independentQualifiedReviewerPixelGroundTruthMissing":True,
 "source2DFallbackRequired":True,
 "consumer3DAdmitted":False,"releaseAuthorized":False,"familyAlpha":"HOLD"
}
(OUT/"met-70759-independent-LAB-original-photo-unapproved-boundary-report.json").write_text(
 json.dumps(report,indent=2)+"\n",encoding="utf8")
print("M2_MET_TWO_ORIGINAL_PHOTO_NEAREST_LAB_ROBUSTNESS_GATE_VERIFIED "+json.dumps({
  "firstPhotoResearchSupportsExcludingPaleBackground":True,
  "secondPhotoEntire549PixelGarmentAdditionApproved":False,
  "secondPhotoMachineMethodSmoothingUnstable":True,
  "actualHumanPixelGroundTruthReceived":False,
  "sourcePhotosAndResearchMasksUnchanged":True,
  "consumer3DAdmitted":False,"familyAlpha":"HOLD"
},sort_keys=True))
