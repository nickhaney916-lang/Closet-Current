"""TRUE original Met 70759 photographic evidence for two boundary decisions.

Inspect *original museum pixels*, conservative and uncertainty masks, and
source-only connected region RGB comparison. 1406 pale exterior -> exclude
background research hypothesis; 1408 colored cream tie -> separate research
only candidate includes exactly 549 previously disputed source pixels.
No independent expert segmentation, camera measurement or human fit claim.

CI derives the ORIGINAL RGB and masks from institutionally downloaded,
independently SHA-pinned museum images; no fabricated source fixture allowed.
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
from met_source_component_correction89 import (
 REGIONS,source_photo_component_shape89,sha256_bytes)

SRC=ROOT/"benchmark"/"parallel89-met70759-four-photo-research"
REVIEW=ROOT/"benchmark"/"parallel89-met70759-boundary-review-UNAPPROVED"
OUT=ROOT/"benchmark"/"parallel89-met70759-ORIGINAL-photo-boundary-candidates-UNAPPROVED"
OUT.mkdir(parents=True,exist_ok=True)
report=json.loads((REVIEW/"met-70759-four-photo-BOUNDARY-REVIEW-QUEUE.json").read_text())
assert report["officialMetObjectNumber"]=="1983.21a, b"
receipts={}
for id in sorted(REGIONS):
    source=SOURCES[id]
    raw=(SRC/f"met-70759-gallery-{id}.rgb").read_bytes()
    if len(raw)!=source["height"]*1200*3 or hashlib.sha256(raw).hexdigest()!=source["rgb_sha"]:
        raise RuntimeError("real-institutional-Met-image-SHA256-required")
    rgb=np.frombuffer(raw,dtype=np.uint8).reshape((source["height"],1200,3)).copy()
    core,union,original=propose_full_mask(rgb,id)
    evidence=next(x for x in report["sourceOriginalFullImageDigestAndMaskPerPhotoReceipts"] if x["imageId"]==id)
    prior=[sha256_bytes(x) for x in (rgb,core,union)]
    candidate,component,receipt=source_photo_component_shape89(rgb,core,union,id,evidence)
    assert [sha256_bytes(x) for x in (rgb,core,union)]==prior
    assert receipt["originalDecodedRGBSHA256"]==source["rgb_sha"]
    assert receipt["originalMaskCoreSHA256"]==evidence["originalMaskCoreSHA256"]
    assert receipt["originalMaskUncertaintyUnionSHA256"]==evidence["uncertaintyUnionSHA256"]
    assert not receipt["humanGroundTruthMaskApproved"]
    assert not receipt["independentQualifiedReviewerActuallyAcceptedThisCorrection"]
    assert not receipt["consumer3DAdmitted"]
    assert not receipt["releaseAuthorized"]
    delta=(candidate>0)&(core==0)
    assert not np.any(delta&~((union>0)&(core==0)))
    assert receipt["candidatePixelsAddedOnlyFromExistingUncertainUnion"]==int(delta.sum())
    if id==2551406:
        assert int(delta.sum())==0
        assert np.array_equal(candidate,core)
        assert receipt["paleOriginalPhotographPixelCount"]>=13000
        assert receipt["chromaOriginalPhotographPixelCount"]<=5
        assert receipt["photoPixelRGBEuclideanDistanceToExterior"]<12
        assert receipt["photoPixelRGBEuclideanDistanceToCloth"]>100
        assert receipt["tentativePhotographicComponentClassification"].startswith("KEEP_EXCLUDED")
        assert receipt["onlyCaptionVerifiedMuseumView"]=="a) front"
    else:
        assert int(delta.sum())==549
        assert np.array_equal(delta,component)
        assert receipt["paleOriginalPhotographPixelCount"]<20
        assert receipt["chromaOriginalPhotographPixelCount"]>500
        assert receipt["photoPixelRGBEuclideanDistanceToExterior"]>55
        assert receipt["photoPixelRGBEuclideanDistanceToCloth"]<45
        assert receipt["tentativePhotographicComponentClassification"].startswith("PREVIEW_ONLY")
        assert receipt["onlyCaptionVerifiedMuseumView"] is None
    # Source-locked adversarial acceptance: arbitrary mask substitution,
    # forged human review, wrong photographed pixels, or different donor ID
    # must never be allowed to produce a correction candidate.
    invalidReview=copy.deepcopy(evidence)
    invalidReview["externalQualifiedAnnotatorReviewActuallyProvided"]=True
    alteredRGB=rgb.copy()
    alteredRGB[0,0,0]=alteredRGB[0,0,0]^1
    alteredUnion=union.copy();alteredUnion[0,0]=255
    alteredCore=core.copy();alteredCore[0,0]=255
    for inputs in [
      (alteredRGB,core,union,id,evidence),
      (rgb,alteredCore,union,id,evidence),
      (rgb,core,alteredUnion,id,evidence),
      (rgb,core,union,id,invalidReview),
      (rgb,core,union,5152,evidence)
    ]:
        try:
            source_photo_component_shape89(*inputs)
        except ValueError:
            pass
        else:
            raise RuntimeError("fake-original-source-or-mask-acceptance-must-fail")
    # Produce transparent research artifacts WITHOUT changing original masks.
    resRGB=np.array(rgb,copy=True)
    resBGR=cv2.cvtColor(resRGB,cv2.COLOR_RGB2BGR)
    boundary,_=cv2.findContours(core,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(resBGR,boundary,-1,(38,222,36),2)
    x0,y0,x1,y1=receipt["originalBboxSourcePixels"]
    cv2.rectangle(resBGR,(x0,y0),(x1,y1),(20,70,220),2)
    if id==2551406:
        # Excluded original pale background wedge = yellow *review* witness.
        resBGR[component]=(40,210,230)
    else:
        # Potential original cream tie = magenta independent candidate pixels.
        resBGR[delta]=(210,55,215)
    image=OUT/f"original-Met-{id}-full-source-photo-boundary-RESEARCH-ONLY.png"
    if not cv2.imwrite(str(image),resBGR):
        raise RuntimeError("original-source-photo-correction-evidence-PNG-write-failed")
    _,maskPNG=cv2.imencode(".png",candidate)
    (OUT/f"original-Met-{id}-separate-source-CANDIDATE-NOT-ACCEPTED.png").write_bytes(
      maskPNG.tobytes())
    receipts[id]=receipt
    print("M2_MET_ORIGINAL_PHOTO_CAUSAL_BOUNDARY_WITNESS_HOLD "+json.dumps({
       "id":id,"originalSourceSHA256":source["rgb_sha"],
       "originalMaskCoreSHA256":receipt["originalMaskCoreSHA256"],
       "uncertainRegionPixels":receipt["originalConnectedDisputedPixelCount"],
       "paleOriginalPixels":receipt["paleOriginalPhotographPixelCount"],
       "chromaticOriginalPixels":receipt["chromaOriginalPhotographPixelCount"],
       "localBackgroundRGBDistance":receipt["photoPixelRGBEuclideanDistanceToExterior"],
       "localClothRGBDistance":receipt["photoPixelRGBEuclideanDistanceToCloth"],
       "researchOnlyCandidatePixelsAdded":receipt["candidatePixelsAddedOnlyFromExistingUncertainUnion"],
       "qualifiedHumanReviewReceived":False,
       "familyAlpha":"HOLD"
    },sort_keys=True))
if set(receipts)!={2551406,2551408}:
    raise RuntimeError("must-compare-both-independent-source-problem-regions")
assert receipts[2551406]["candidatePixelsAddedOnlyFromExistingUncertainUnion"]==0
assert receipts[2551408]["candidatePixelsAddedOnlyFromExistingUncertainUnion"]==549
output={
  "schema":"M2-Met-70759-two-source-photo-component-corrections-HUMAN-UNAPPROVED/v1",
  "originalMuseumSource":"https://www.metmuseum.org/art/collection/search/70759",
  "originalMuseumObjectNumber":"1983.21a, b",
  "researchPhotoBoundaryCases":[receipts[2551406],receipts[2551408]],
  "originalMuseumPhotoRGBCanonicalAttested":True,
  "originalConservativeMaskAndUnionUnmodified":True,
  "sourceSideLabelOtherThan2551406IsUnverified":True,
  "sourcePhotoRGBColorComparisonIsHeuristicNotQualifiedGroundTruth":True,
  "source1406BackgroundRiskExcluded":True,
  "source1408CreamTie549PixelsInSeparateCandidateOnly":True,
  "actualQualifiedHumanBoundaryReview":False,
  "actual3DSewnGarmentOrWearerFitValidated":False,
  "originalHonolulu5152_1PhotoAndFallbackUnchanged":True,
  "consumer3DAdmitted":False,
  "releaseAuthorized":False,"familyAlpha":"HOLD"
}
(OUT/"met-70759-source-photo-evidence-UNAPPROVED-receipt.json").write_text(
 json.dumps(output,indent=2)+"\n",encoding="utf8")
print("M2_MET_TRUE_PHOTO_BOUNDARY_CANDIDATE_RESEARCH_COMPLETE "+json.dumps({
 "originalMuseumPhotoRegionsAnalyzed":2,
 "realOriginalSource2551406ExcludedBackgroundRegion":13180,
 "realOriginalSource2551408PotentialCreamTiePreviewAdded":549,
 "existingAcceptedSourceMaskPixelsChanged":0,
 "humanReviewed":False,"consumer3DAdmitted":False,
 "source2DFallbackRequired":True,"familyAlpha":"HOLD"
},sort_keys=True))
