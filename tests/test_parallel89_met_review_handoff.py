"""Negative source-bound local review proposal tests. A successful format check
NEVER constitutes qualified expert approval or changes the original mask."""
import copy
import os
import sys
import unittest

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),".."))
sys.path.insert(0,os.path.join(ROOT,"research","parallel89"))
from met_review_handoff89 import (SOURCE_RGB_SHA,SOURCE_HEIGHTS,
 EXPECTED_MUSEUM_CAPTIONS,require_source_review_manifest,
 build_source_review_packet,validate_offline_proposal,EXPORT_SCHEMA)

def source_report():
    entries=[]
    for id,sha in SOURCE_RGB_SHA.items():
        entries.append({
          "imageId":id,"sourceOriginalWidthHeight":[1200,SOURCE_HEIGHTS[id]],
          "originalMuseumSourceRGBSHA256":sha,
          "originalMaskCoreSHA256":"a"*64,
          "uncertaintyUnionSHA256":"b"*64,
          "museumVerifiedExactViewCaption":EXPECTED_MUSEUM_CAPTIONS[id],
          "status":"SOURCE_PHOTO_ANCHOR_CHECKS_PASS_BOUNDARY_HUMAN_REVIEW_STILL_REQUIRED",
          "externalQualifiedAnnotatorReviewActuallyProvided":False,
          "manualGroundTruthSegmentationOrCorrectionsReceived":False,
          "consumer3DAdmitted":False,"releaseAuthorized":False,
          "disputedPixelCount":30,
          "largestConnectedDisputedReviewRegions":[{
            "bboxOriginalPixels":[450,80,480,100],
            "disputedPixelCount":25,
            "distinctlyChromaticPotentialClothPixels":10,
            "paleNearBackgroundOrWaistbandPixels":8,
            "reliablyAssignedAsGarmentByThisReport":False
          }]
        })
    return {
      "schema":"M2-original-Met-four-mask-targeted-human-review-queue/v1",
      "officialMetObjectNumber":"1983.21a, b",
      "qualifiedIndependentReviewerIdentityOrApprovalNotReceived":True,
      "consumer3DAdmitted":False,"releaseAuthorized":False,
      "familyAlpha":"HOLD",
      "sourceOriginalFullImageDigestAndMaskPerPhotoReceipts":entries
    }

def proposed(packet):
    ref=packet["images"][0]["regions"][0]
    return {
      "schema":EXPORT_SCHEMA,"sourceMuseumObjectNumber":"1983.21a, b",
      "proposedRegionDecisions":[{
        "regionId":ref["id"],"imageId":ref["imageId"],
        "originalRGBSHA256":ref["sourceOriginalRGBSHA256"],
        "originalMaskSHA256":ref["originalMaskCoreSHA256"],
        "bboxOriginalPixels":ref["bboxOriginalPixels"],
        "decision":"propose_add_garment_fabric",
        "comment":"Possible original photographed waistband seam; external inspection required",
        "polygonOriginalPixels":[[452,84],[478,87],[467,99]]
      }],
      "qualifiedReviewerVerified":False,"sourceMaskHumanApproved":False,
      "consumer3DAdmitted":False,"releaseAuthorized":False,"familyAlpha":"HOLD"
    }

class MetReviewProposalTests(unittest.TestCase):
    def test_four_exact_original_photo_hashes_and_one_caption(self):
        original=source_report()
        verified=require_source_review_manifest(original)
        self.assertEqual(set(verified),set(SOURCE_RGB_SHA))
        packet=build_source_review_packet(original)
        self.assertEqual(len(packet["images"]),4)
        self.assertEqual(packet["images"][0]["museumVerifiedExactCaption"],"a) front")
        self.assertTrue(all(x["otherPartAndSideLabelsStillUnverified"] for x in packet["images"][1:]))
        self.assertFalse(packet["externalQualifiedAnnotatorApprovalAlreadyObtained"])
        self.assertFalse(packet["consumer3DAdmitted"])
        self.assertEqual(original,source_report())
    def test_forgeries_of_source_or_review_receipts_fail_closed(self):
        changes=[
          lambda x:x.update(officialMetObjectNumber="5152.1"),
          lambda x:x.update(consumer3DAdmitted=True),
          lambda x:x.update(qualifiedIndependentReviewerIdentityOrApprovalNotReceived=False),
          lambda x:x["sourceOriginalFullImageDigestAndMaskPerPhotoReceipts"][0].update(
             originalMuseumSourceRGBSHA256="0"*64),
          lambda x:x["sourceOriginalFullImageDigestAndMaskPerPhotoReceipts"][1].update(
             museumVerifiedExactViewCaption="b) front"),
          lambda x:x["sourceOriginalFullImageDigestAndMaskPerPhotoReceipts"][2].update(
             externalQualifiedAnnotatorReviewActuallyProvided=True),
          lambda x:x["sourceOriginalFullImageDigestAndMaskPerPhotoReceipts"][3].update(
             originalMaskCoreSHA256="wrong"),
          lambda x:x["sourceOriginalFullImageDigestAndMaskPerPhotoReceipts"][0][
             "largestConnectedDisputedReviewRegions"][0].update(
             bboxOriginalPixels=[-1,80,480,100])
        ]
        for change in changes:
            doc=source_report();change(doc)
            with self.assertRaises(ValueError):
                require_source_review_manifest(doc)
    def test_valid_polygon_proposal_only_verifies_format_not_expert(self):
        pkt=build_source_review_packet(source_report())
        res=validate_offline_proposal(proposed(pkt),pkt)
        self.assertEqual(res["proposedRegionCount"],1)
        self.assertEqual(res["totalRegionsAvailable"],4)
        self.assertFalse(res["sourceMaskHumanApproved"])
        self.assertFalse(res["qualifiedReviewerVerified"])
        self.assertFalse(res["consumer3DAdmitted"])
    def test_release_source_and_polygon_tampering_forbidden(self):
        pkt=build_source_review_packet(source_report())
        changes=[
          lambda x:x.update(qualifiedReviewerVerified=True),
          lambda x:x.update(sourceMaskHumanApproved=True),
          lambda x:x.update(consumer3DAdmitted=True),
          lambda x:x.update(releaseAuthorized=True),
          lambda x:x.update(sourceMuseumObjectNumber="5152.1"),
          lambda x:x["proposedRegionDecisions"][0].update(originalRGBSHA256="0"*64),
          lambda x:x["proposedRegionDecisions"][0].update(originalMaskSHA256="0"*64),
          lambda x:x["proposedRegionDecisions"][0].update(bboxOriginalPixels=[0,0,50,50]),
          lambda x:x["proposedRegionDecisions"][0].update(regionId="other-object-region"),
          lambda x:x["proposedRegionDecisions"][0].update(decision="consumer_3D_approved"),
          lambda x:x["proposedRegionDecisions"][0].update(comment=""),
          lambda x:x["proposedRegionDecisions"][0].update(polygonOriginalPixels=[]),
          lambda x:x["proposedRegionDecisions"][0].update(polygonOriginalPixels=[
            [452,84],[478,87],[925,400]]),
          lambda x:x["proposedRegionDecisions"].append(
            copy.deepcopy(x["proposedRegionDecisions"][0]))
        ]
        for change in changes:
            doc=proposed(pkt);change(doc)
            with self.assertRaises(ValueError):
                validate_offline_proposal(doc,pkt)
    def test_background_and_uncertain_work_without_fabric_polygon(self):
        pkt=build_source_review_packet(source_report())
        for label in ["retain_excluded_background","uncertain_request_more_evidence"]:
            doc=proposed(pkt)
            doc["proposedRegionDecisions"][0].update(
              decision=label,comment="",polygonOriginalPixels=[])
            res=validate_offline_proposal(doc,pkt)
            self.assertEqual(res["proposedRegionCount"],1)
            self.assertFalse(res["sourceMaskHumanApproved"])

if __name__=="__main__":
    unittest.main()
