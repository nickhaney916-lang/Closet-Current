"""Offline, source-locked qualified-reviewer HANDOFF, never an approval.

This module binds any subsequent annotation *proposal* to exact independently
verified Met-70759 original decoded RGB, candidate mask SHA, original pixel ROI,
and museum-caption provenance. A typed review form cannot prove professional
identity or confer 3D/Family Alpha authorization.

The original photo, machine mask and uncertainty pixels remain immutable.
"""
import hashlib
import json
from pathlib import Path

SOURCE_RGB_SHA={
 2551406:"e0b7738db57ac4b7c27d4f03f724442f53c8e85f09f7a139839dfaa04c86cbec",
 2551407:"e59253bef19ccc908b7cb1519c1ef4c92e011e9ae955bca878de14f40a9f9678",
 2551408:"dddbda448c32667a0ab5c1b90a43d139b5917c1b9955dc428987beec035e06c0",
 2551409:"1cd4c7f71ebbb00a27f769e46a438a03f19393bd6a6ba200af14a092d1461e3f"
}
SOURCE_HEIGHTS={2551406:933,2551407:945,2551408:978,2551409:959}
EXPECTED_MUSEUM_CAPTIONS={2551406:"a) front",2551407:None,2551408:None,2551409:None}
DECISIONS=frozenset({
 "retain_excluded_background","propose_add_garment_fabric",
 "uncertain_request_more_evidence","request_manual_redraw"
})
EXPORT_SCHEMA="M2-met70759-original-photo-boundary-review-proposal/v1"

def sha256(payload):
    return hashlib.sha256(payload).hexdigest()

def require_source_review_manifest(report):
    """Ground the queue in actual previous CI receipts, not typed provenance."""
    if not isinstance(report,dict) or report.get("schema")!=(
       "M2-original-Met-four-mask-targeted-human-review-queue/v1"):
        raise ValueError("verified-source-review-queue-schema-required")
    if (report.get("officialMetObjectNumber")!="1983.21a, b" or
        report.get("qualifiedIndependentReviewerIdentityOrApprovalNotReceived") is not True or
        report.get("consumer3DAdmitted") is not False or
        report.get("releaseAuthorized") is not False or
        report.get("familyAlpha")!="HOLD"):
        raise ValueError("source-review-queue-must-still-be-unapproved")
    original=report.get("sourceOriginalFullImageDigestAndMaskPerPhotoReceipts")
    if not isinstance(original,list) or len(original)!=4:
        raise ValueError("four-real-source-photo-review-receipts-required")
    result={}
    for rec in original:
        if not isinstance(rec,dict):
            raise ValueError("source-receipt-object-required")
        id=rec.get("imageId")
        if id not in SOURCE_RGB_SHA or id in result:
            raise ValueError("duplicate-or-wrong-original-museum-photo-ID")
        if (rec.get("originalMuseumSourceRGBSHA256")!=SOURCE_RGB_SHA[id] or
            rec.get("sourceOriginalWidthHeight")!=[1200,SOURCE_HEIGHTS[id]] or
            rec.get("museumVerifiedExactViewCaption")!=EXPECTED_MUSEUM_CAPTIONS[id] or
            rec.get("externalQualifiedAnnotatorReviewActuallyProvided") is not False or
            rec.get("manualGroundTruthSegmentationOrCorrectionsReceived") is not False or
            rec.get("consumer3DAdmitted") is not False or
            rec.get("releaseAuthorized") is not False or
            rec.get("status")!="SOURCE_PHOTO_ANCHOR_CHECKS_PASS_BOUNDARY_HUMAN_REVIEW_STILL_REQUIRED"):
            raise ValueError("original-source-digest-caption-or-review-provenance-wrong")
        mask=rec.get("originalMaskCoreSHA256")
        union=rec.get("uncertaintyUnionSHA256")
        if (not isinstance(mask,str) or len(mask)!=64 or
            not isinstance(union,str) or len(union)!=64 or
            not all(c in "0123456789abcdef" for c in mask+union)):
            raise ValueError("original-foreground-and-uncertain-source-mask-hashes-required")
        regions=rec.get("largestConnectedDisputedReviewRegions")
        if not isinstance(regions,list) or not regions or len(regions)>12:
            raise ValueError("source-disputed-region-evidence-required")
        total=0
        for j,reg in enumerate(regions):
            bbox=reg.get("bboxOriginalPixels",[]) if isinstance(reg,dict) else []
            if (len(bbox)!=4 or any(type(v)!=int for v in bbox) or
                not(0<=bbox[0]<=bbox[2]<1200 and
                    0<=bbox[1]<=bbox[3]<SOURCE_HEIGHTS[id]) or
                type(reg.get("disputedPixelCount"))!=int or
                reg["disputedPixelCount"]<16 or
                reg.get("reliablyAssignedAsGarmentByThisReport") is not False):
                raise ValueError("original-source-photo-ROI-evidence-invalid")
            total+=reg["disputedPixelCount"]
        if total>rec.get("disputedPixelCount",0) or rec.get("disputedPixelCount",0)<=0:
            raise ValueError("review-region-disputed-source-pixel-accounting-invalid")
        result[id]=rec
    return result

def build_source_review_packet(report):
    """No pixel approval; immutable grounded fields for an OFFLINE review UI."""
    receipts=require_source_review_manifest(report)
    images=[]
    for photo_id,rec in sorted(receipts.items()):
        regions=[]
        for i,region in enumerate(rec["largestConnectedDisputedReviewRegions"]):
            bbox=region["bboxOriginalPixels"]
            regions.append({
               "id":f"{photo_id}-region-{i+1}",
               "imageId":photo_id,
               "sourceOriginalRGBSHA256":SOURCE_RGB_SHA[photo_id],
               "originalMaskCoreSHA256":rec["originalMaskCoreSHA256"],
               "originalUncertaintyUnionSHA256":rec["uncertaintyUnionSHA256"],
               "bboxOriginalPixels":bbox,
               "disputedPixelCount":region["disputedPixelCount"],
               "possibleChromaticFabricPixels":region["distinctlyChromaticPotentialClothPixels"],
               "paleBackgroundOrWaistbandPixels":region["paleNearBackgroundOrWaistbandPixels"],
               "partAndSideIdentityFromMuseumCertified":photo_id==2551406,
               "reviewDecision":"not_reviewed",
               "qualifiedReviewerApproved":False
            })
        images.append({
           "imageId":photo_id,
           "originalFullDecodedRGBSHA256":SOURCE_RGB_SHA[photo_id],
           "originalMaskCoreSHA256":rec["originalMaskCoreSHA256"],
           "originalUncertaintyUnionSHA256":rec["uncertaintyUnionSHA256"],
           "width":1200,"height":SOURCE_HEIGHTS[photo_id],
           "museumVerifiedExactCaption":EXPECTED_MUSEUM_CAPTIONS[photo_id],
           "otherPartAndSideLabelsStillUnverified":photo_id!=2551406,
           "regions":regions
        })
    return {
      "schema":"M2-met70759-four-original-source-photo-offline-review-packet/v1",
      "sourceMuseumObjectNumber":"1983.21a, b",
      "sourceOriginalCollectionPage":"https://www.metmuseum.org/art/collection/search/70759",
      "images":images,
      "onlyAuthoritativelyCaptionedPhotoId":2551406,
      "externalQualifiedAnnotatorApprovalAlreadyObtained":False,
      "noAutomaticAcceptanceOfAnyForegroundOrUnknownSideLabels":True,
      "reviewerSubmissionsNotAuthenticatedExpertApproval":True,
      "originalSourceAndCandidateMaskAreImmutable":True,
      "originalHonolulu5152_1Calibrated":False,
      "consumer3DAdmitted":False,"releaseAuthorized":False,
      "originalPhoto2DFallbackRequired":True,"familyAlpha":"HOLD"
    }

def validate_offline_proposal(payload,packet):
    """Verify submitted provenance and bounds; valid != authentic/approved."""
    if not isinstance(payload,dict) or not isinstance(packet,dict):
        raise ValueError("review-document-and-original-source-packet-required")
    if (payload.get("schema")!=EXPORT_SCHEMA or
        payload.get("sourceMuseumObjectNumber")!="1983.21a, b" or
        payload.get("consumer3DAdmitted") is not False or
        payload.get("releaseAuthorized") is not False or
        payload.get("qualifiedReviewerVerified") is not False or
        payload.get("sourceMaskHumanApproved") is not False or
        payload.get("familyAlpha")!="HOLD"):
        raise ValueError("source-bound-proposed-annotations-cannot-be-released")
    if packet.get("schema")!="M2-met70759-four-original-source-photo-offline-review-packet/v1":
        raise ValueError("unverified-review-packet")
    source_regions={}
    for img in packet["images"]:
        for reg in img["regions"]:
            source_regions[reg["id"]]=reg
    selections=payload.get("proposedRegionDecisions")
    if not isinstance(selections,list) or len(selections)>len(source_regions):
        raise ValueError("malformed-review-decision-list")
    seen=set()
    for entry in selections:
        if not isinstance(entry,dict) or entry.get("regionId") not in source_regions:
            raise ValueError("review-annotation-region-not-in-original-source")
        region_id=entry["regionId"]
        if region_id in seen:
            raise ValueError("duplicate-review-of-same-source-region")
        seen.add(region_id)
        ref=source_regions[region_id]
        if (entry.get("imageId")!=ref["imageId"] or
            entry.get("originalRGBSHA256")!=ref["sourceOriginalRGBSHA256"] or
            entry.get("originalMaskSHA256")!=ref["originalMaskCoreSHA256"] or
            entry.get("bboxOriginalPixels")!=ref["bboxOriginalPixels"] or
            entry.get("decision") not in DECISIONS):
            raise ValueError("review-submission-changed-source-or-made-invalid-decision")
        note=entry.get("comment","")
        if not isinstance(note,str) or len(note)>2500:
            raise ValueError("review-note-too-long-or-not-text")
        poly=entry.get("polygonOriginalPixels",[])
        if not isinstance(poly,list) or len(poly)>500:
            raise ValueError("review-polygon-size-invalid")
        if entry["decision"] in ("propose_add_garment_fabric","request_manual_redraw"):
            if len(poly)<3 or not note.strip():
                raise ValueError("proposed-foreground-change-needs-actual-polygon-and-explanation")
        x0,y0,x1,y1=ref["bboxOriginalPixels"]
        for point in poly:
            if (not isinstance(point,list) or len(point)!=2 or
                any(type(n)!=int for n in point) or
                not(x0-35<=point[0]<=x1+35 and
                    y0-35<=point[1]<=y1+35)):
                raise ValueError("proposed-photo-correction-vertices-outside-source-review-region")
    return {
      "schema":"M2-met70759-review-proposal-integrity-validation/v1",
      "status":"ORIGINAL_IMAGE_BOUND_REVIEW_PROPOSAL_FORMAT_VERIFIED_NOT_EXPERT_APPROVED",
      "proposedRegionCount":len(seen),
      "totalRegionsAvailable":len(source_regions),
      "qualifiedReviewerVerified":False,
      "sourceMaskHumanApproved":False,
      "originalPhotoAndCandidateMaskImmutable":True,
      "consumer3DAdmitted":False,"releaseAuthorized":False,
      "familyAlpha":"HOLD"
    }
