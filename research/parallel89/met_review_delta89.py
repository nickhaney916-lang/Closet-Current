"""Research-only *simulation* of proposed original-photo mask corrections.

An actual self-reported offline reviewer proposal is not expert approval.
This module verifies exact known published Met 1983.21a,b RGB and original
mask/union SHA receipts, validates review ROI+polygon, then computes ONLY a
disposable candidate *delta* confined to already-disputed union-minus-core
pixels. No edit is ever made to original alpha, source photos, owner data,
consumer app or original unrelated Honolulu 5152.1 skirt.

A proposed background exclusion and unresolved/manual-redraw proposal NEVER
adds garment pixels. Propose-add may touch ONLY the photographed uncertain
union, not stable background/undisputed garment. Even a "pass" remains
external-review-pending, not qualified expert acceptance nor physical 3D.
"""
import hashlib

import cv2
import numpy as np

from met_review_handoff89 import (
    SOURCE_RGB_SHA,SOURCE_HEIGHTS,build_source_review_packet,
    require_source_review_manifest,validate_offline_proposal,
)

def sha256_array(arr):
    return hashlib.sha256(np.ascontiguousarray(arr).tobytes()).hexdigest()

def simulate_one_photo_uncertain_additions89(core,union,polygons):
    """Pure native-pixel mask operation; never mutates input core/union."""
    if (not isinstance(core,np.ndarray) or not isinstance(union,np.ndarray) or
        core.ndim!=2 or core.dtype!=np.uint8 or
        union.shape!=core.shape or union.dtype!=np.uint8 or
        not np.isin(core,(0,255)).all() or
        not np.isin(union,(0,255)).all() or
        np.any((core>0)&(union==0))):
        raise ValueError("binary-original-photo-core-subset-union-required")
    if not isinstance(polygons,list) or len(polygons)>25:
        raise ValueError("bounded-review-polygon-list-required")
    before_core=sha256_array(core)
    before_union=sha256_array(union)
    disputed=(union>0)&(core==0)
    proposed=np.zeros_like(core)
    painted=np.zeros_like(core)
    per_poly=[]
    for vertices in polygons:
        if (not isinstance(vertices,list) or
            not 3<=len(vertices)<=500 or
            any(not isinstance(v,list) or len(v)!=2 or
                any(type(n)!=int for n in v) or
                not (0<=v[0]<core.shape[1] and 0<=v[1]<core.shape[0])
                for v in vertices)):
            raise ValueError("review-polygon-source-pixel-coordinates-invalid")
        poly=np.array([vertices],dtype=np.int32)
        area=np.zeros_like(core)
        cv2.fillPoly(area,poly,255)
        overlap=(area>0)&disputed
        possible=int(np.count_nonzero(overlap))
        requested=int(np.count_nonzero(area))
        if not possible:
            raise ValueError("proposed-correction-has-no-previously-disputed-source-pixels")
        proposed[overlap]=255
        painted[area>0]=255
        per_poly.append({
          "proposedPolygonAreaPixels":requested,
          "conditionallyPreviewedUncertainPixelCount":possible,
          "stablePhotographicBackgroundPixelsNeverAdmitted":True
        })
    candidate=np.where((core>0)|(proposed>0),255,0).astype(np.uint8)
    diff=(candidate>0)&(core==0)
    if (not np.array_equal(diff,proposed>0) or
        np.any(diff&~disputed) or
        sha256_array(core)!=before_core or
        sha256_array(union)!=before_union):
        raise ValueError("research-proposal-must-not-alter-original-source-mask")
    return candidate,proposed,{
      "status":"PROPOSED_UNREVIEWED_SOURCE_UNCERTAINTY_ONLY_DELTA",
      "originalCoreSHA256":before_core,
      "originalUnionSHA256":before_union,
      "candidateOnlySHA256":sha256_array(candidate),
      "unverifiedProposedChangedPixelCount":int(np.count_nonzero(diff)),
      "originalUncertainPixelsAvailable":int(np.count_nonzero(disputed)),
      "stableBackgroundOrAlreadyApprovedCoreNeverModified":True,
      "onlyOriginalSourceUncertaintyPixelsPreviewed":True,
      "perPolygonEvidence":per_poly,
      "humanOrQualifiedReviewerApproved":False,
      "sourceOriginalMaskAndPhotoImmutable":True,
      "consumer3DAdmitted":False,"releaseAuthorized":False,"familyAlpha":"HOLD"
    }

def build_original_photo_proposal_preview89(report,payload,rgb_by_id,
                                             masks_by_id):
    """Real exact-source 4-photo proposal -> nonaccepted ephemeral preview.

    report: exact original boundary reviewer source queue JSON
    payload: untrusted local submitted proposal JSON
    rgb_by_id: independently hash-verified full 4 original decoded RGB arrays
    masks_by_id: computed original conservative core and uncertainty union
    """
    verified=require_source_review_manifest(report)
    packet=build_source_review_packet(report)
    parsed=validate_offline_proposal(payload,packet)
    if (set(rgb_by_id)!=set(SOURCE_RGB_SHA) or
        set(masks_by_id)!=set(SOURCE_RGB_SHA)):
        raise ValueError("all-four-published-source-photo-witnesses-required")
    for id,rec in verified.items():
        img=rgb_by_id[id]
        if (not isinstance(img,np.ndarray) or
            img.shape!=(SOURCE_HEIGHTS[id],1200,3) or
            img.dtype!=np.uint8 or
            sha256_array(img)!=SOURCE_RGB_SHA[id]):
            raise ValueError("proposed-review-original-photograph-identity-wrong")
        masks=masks_by_id[id]
        if not isinstance(masks,(tuple,list)) or len(masks)!=2:
            raise ValueError("original-alpha-core-and-uncertain-union-required")
        core,union=masks
        if (sha256_array(core)!=rec["originalMaskCoreSHA256"] or
            sha256_array(union)!=rec["uncertaintyUnionSHA256"]):
            raise ValueError("source-review-core-or-union-differs-from-locked-original")
    region_by_id={reg["id"]:reg for img in packet["images"] for reg in img["regions"]}
    included={id:[] for id in SOURCE_RGB_SHA}
    ignored=[]
    for item in payload["proposedRegionDecisions"]:
        region=region_by_id[item["regionId"]]
        if item["decision"]=="propose_add_garment_fabric":
            included[region["imageId"]].append(item["polygonOriginalPixels"])
        else:
            ignored.append(item["regionId"])
    outputs={}
    for id in sorted(SOURCE_RGB_SHA):
        core,union=masks_by_id[id]
        candidate,delta,evidence=simulate_one_photo_uncertain_additions89(
          core,union,included[id])
        outputs[id]={
          "candidatePreviewMask":candidate,
          "proposedAddedPixelsMask":delta,
          "sourcePhotoRGB":rgb_by_id[id],
          "receipt":{
            **evidence,
            "originalImageId":id,
            "originalRGBSHA256":SOURCE_RGB_SHA[id],
            "independentExpertPixelGroundTruthCompared":False,
            "retainedAsResearchPreviewOnly":True
          }
        }
    meta={
      "schema":"M2-four-photo-source-uncertain-mask-correction-PREVIEW-NOT-APPROVED/v1",
      "status":"ORIGINAL_MASK_UNTOUCHED_SOURCE_BOUND_PROPOSAL_PREVIEW_ONLY",
      "sourceObjectNumber":"1983.21a, b",
      "validatedProposalFormatReceipt":parsed,
      "allFourIndependentPhotosSourceHashVerified":True,
      "proposedRegionDecisionsCount":len(payload["proposedRegionDecisions"]),
      "regionsWithNoAppliedChanges":ignored,
      "sourceRegionToOriginalImageNotMixed":True,
      "totalPreviewedSourceUncertaintyOnlyAddedPixels":sum(
        x["receipt"]["unverifiedProposedChangedPixelCount"] for x in outputs.values()),
      "reviewedByIndependentQualifiedExpert":False,
      "humanAcceptedGarmentAlphaMask":False,
      "originalActualSourcePhotosAndCandidateMasksUnmodified":True,
      "originalHonoluluSourceCalibratedFromMet":False,
      "originalPhoto2DFallbackRequired":True,
      "consumer3DAdmitted":False,
      "releaseAuthorized":False,"familyAlpha":"HOLD"
    }
    return outputs,meta
