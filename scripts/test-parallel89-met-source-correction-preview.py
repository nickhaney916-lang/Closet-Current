"""Genuine four original museum photographs + original conserved masks:
source-locked reviewer PROPOSAL -> non-destructive uncertain-region-only delta.

The request payload in this *test* is SCRIPT-GENERATED, NOT a real qualified
annotator. It exercises the previously blocked human handoff end-to-end;
no human/curator approval, source mask changes, 3D or device testing occurs.
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
from met_review_handoff89 import (
 build_source_review_packet,EXPORT_SCHEMA,validate_offline_proposal)
from met_review_delta89 import build_original_photo_proposal_preview89

SRC=ROOT/"benchmark"/"parallel89-met70759-four-photo-research"
QA=ROOT/"benchmark"/"parallel89-met70759-boundary-review-UNAPPROVED"
OUT=ROOT/"benchmark"/"parallel89-met70759-PREVIEW-not-accepted"
OUT.mkdir(parents=True,exist_ok=True)
report=json.loads((QA/"met-70759-four-photo-BOUNDARY-REVIEW-QUEUE.json").read_text())
packet=build_source_review_packet(report)
rgb_by_id={}
masks_by_id={}
saved={}
for id,src in sorted(SOURCES.items()):
    raw=(SRC/f"met-70759-gallery-{id}.rgb").read_bytes()
    if len(raw)!=1200*src["height"]*3 or hashlib.sha256(raw).hexdigest()!=src["rgb_sha"]:
        raise RuntimeError("genuine-source-photo-RGB-identity-required")
    rgb=np.frombuffer(raw,np.uint8).reshape(src["height"],1200,3).copy()
    core,union,receipt=propose_full_mask(rgb,id)
    original=next(x for x in report["sourceOriginalFullImageDigestAndMaskPerPhotoReceipts"] if x["imageId"]==id)
    if (hashlib.sha256(core.tobytes()).hexdigest()!=original["originalMaskCoreSHA256"] or
        hashlib.sha256(union.tobytes()).hexdigest()!=original["uncertaintyUnionSHA256"]):
        raise RuntimeError("source-alpha-does-not-match-original-review-receipt")
    saved[id]=hashlib.sha256(rgb.tobytes()+core.tobytes()+union.tobytes()).hexdigest()
    rgb_by_id[id]=rgb
    masks_by_id[id]=(core,union)
def region(id,rank=0):
    return next(x for x in packet["images"] if x["imageId"]==id)["regions"][rank]
first=region(2551406)
third=region(2551408)
# These are TEST FIXTURE alternatives, not claims a real human inspected them.
# Exclude pale 1406; exercise proposed addition inside 1408's true source
# 2D unresolved chromatic waistband bbox. Polygon clipped to candidate
# union-minus-core by the separate pure simulator.
x0,y0,x1,y1=third["bboxOriginalPixels"]
def entry(r,decision,polygon=None,comment=""):
    return {
      "regionId":r["id"],"imageId":r["imageId"],
      "originalRGBSHA256":r["sourceOriginalRGBSHA256"],
      "originalMaskSHA256":r["originalMaskCoreSHA256"],
      "bboxOriginalPixels":r["bboxOriginalPixels"],
      "decision":decision,"comment":comment,
      "polygonOriginalPixels":polygon or []
    }
payload={
 "schema":EXPORT_SCHEMA,
 "sourceMuseumObjectNumber":"1983.21a, b",
 "proposedRegionDecisions":[
    entry(first,"retain_excluded_background"),
    entry(third,"propose_add_garment_fabric",
      [[x0,y0],[x1,y0],[x1,y1],[x0,y1]],
      "SYNTHETIC TEST fixture only: possible colored original waistband pixels")
 ],
 "testFixtureNotActualQualifiedReviewer":True,
 "qualifiedReviewerVerified":False,"sourceMaskHumanApproved":False,
 "consumer3DAdmitted":False,"releaseAuthorized":False,
 "familyAlpha":"HOLD"
}
assert validate_offline_proposal(payload,packet)["proposedRegionCount"]==2
output,receipt=build_original_photo_proposal_preview89(report,payload,rgb_by_id,masks_by_id)
if receipt["totalPreviewedSourceUncertaintyOnlyAddedPixels"]<=0:
    raise RuntimeError("source-only genuine colored waistband candidate failed to preview")
if receipt["humanAcceptedGarmentAlphaMask"] or receipt["releaseAuthorized"]:
    raise RuntimeError("dangerous-false-original-source-review-approval")
for id in sorted(SOURCES):
    result=output[id]
    core,union=masks_by_id[id]
    delta=result["proposedAddedPixelsMask"]
    cand=result["candidatePreviewMask"]
    assert not np.any((delta>0)&(union==0))
    assert not np.any((delta>0)&(core>0))
    assert np.array_equal(cand>0,(delta>0)|(core>0))
    assert hashlib.sha256(rgb_by_id[id].tobytes()+core.tobytes()+union.tobytes()).hexdigest()==saved[id]
    if id==2551406 and np.any(delta):
        raise RuntimeError("pale original photo retained background proposal must not include cloth")
    if id!=2551408 and np.any(delta):
        raise RuntimeError("proposal contaminated unreviewed other museum photograph")
    rgb=rgb_by_id[id].copy()
    bgr=cv2.cvtColor(rgb,cv2.COLOR_RGB2BGR)
    bgr[delta>0]=(240,65,200)
    contours,_=cv2.findContours(core,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(bgr,contours,-1,(15,220,40),2)
    name=f"met-{id}-SOURCE-LOCKED-PROPOSED-NOT-ACCEPTED.png"
    if not cv2.imwrite(str(OUT/name),bgr):
        raise RuntimeError("candidate-review-source-preview-write-failed")
    _,mask_png=cv2.imencode(".png",cand)
    (OUT/f"met-{id}-SOURCE-UNCERTAINTY-ONLY-CANDIDATE-NOT-ACCEPTED.png").write_bytes(
      mask_png.tobytes())
(OUT/"source-review-SYNTHETIC-NOT-APPROVED-proposal.json").write_text(
 json.dumps(payload,indent=2)+"\n")
rec={
  "schema":"M2-original-Met-source-review-import-correction-preview-genuine/v1",
  "originalMuseumObjectNumber":"1983.21a, b",
  "sourcePhotoAndPriorMaskSHA256Attested":True,
  "sourceOnlyColorRegionAcceptedIntoPreview":True,
  "simulatedTestAnnotationNotActualQualifiedReview":True,
  "sourceOriginalPhotographsNeverModified":True,
  "originalMaskAndUncertaintyUnionNeverModified":True,
  "originalPhoto2551406RetainPaleRegionExcluded":True,
  "photo2551408ColorBandOnlyUnapprovedCandidate":True,
  "researchCandidateDeltaPixels":receipt["totalPreviewedSourceUncertaintyOnlyAddedPixels"],
  "perOriginalImage":{str(id):output[id]["receipt"] for id in sorted(SOURCES)},
  "actualHumanSourceReviewReceived":False,
  "actualSourceImagePartSideVerifiedBeyondAFront":False,
  "sourceOriginal2DFallbackRequired":True,
  "consumer3DAdmitted":False,
  "sourceMaskHumanApproved":False,
  "releaseAuthorized":False,
  "familyAlpha":"HOLD"
}
(OUT/"source-review-genuine-MET-correction-PREVIEW-receipt.json").write_text(
 json.dumps(rec,indent=2)+"\n")
print("M2_MET_REVIEW_CORRECTION_TRUE_SOURCE_CANDIDATE_NOT_APPROVED "+
 json.dumps({
 "actualMuseumSourceImages":4,
 "syntheticTestRegionDecisions":2,
 "testProposedAddedSourcePixels":rec["researchCandidateDeltaPixels"],
 "onlyOneActualSourceRegionChangedInDisposablePreview":True,
 "independentHumanApproved":False,
 "realPhoto2DFallbackRequired":True,
 "familyAlpha":"HOLD"
},sort_keys=True))
