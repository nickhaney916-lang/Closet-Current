"""Adversarial mask-boundary category tests, source provenance and no fake
expert/garment-approval. Real image test MUST independently retrieve and hash
the four museum images in Actions. Synthetic arrays are not independent GT.
"""
import os
import sys
import hashlib
import unittest
import numpy as np
import cv2

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),".."))
sys.path.insert(0,os.path.join(ROOT,"research","parallel89"))
from met_full_mask_proposal89 import SOURCES
from met_mask_boundary_triage89 import (
 REVIEW_ANCHORS,classify_disagreement89,review_original_met_mask89,
 make_boundary_review_overlay89)

class MetPhotoBoundaryQA(unittest.TestCase):
    def test_disputed_chromatic_pale_and_other_pixels_reconcile(self):
        rgb=np.full((50,70,3),230,dtype=np.uint8)
        core=np.zeros((50,70),dtype=np.uint8)
        union=np.zeros((50,70),dtype=np.uint8)
        core[15:40,20:50]=255
        union[:]=core
        union[8:15,20:50]=255
        union[20:30,50:60]=255
        rgb[8:15,20:50]=(42,95,175)
        rgb[20:30,50:60]=(245,244,236)
        before=(rgb.copy(),core.copy(),union.copy())
        m=classify_disagreement89(rgb,core,union)
        self.assertEqual(m["disputedPixelCount"],310)
        self.assertEqual(m["distinctlyChromaticPotentialClothPixels"],210)
        self.assertEqual(m["paleNearBackgroundOrWaistbandPixels"],100)
        self.assertEqual(m["otherAmbiguousDisputedPixels"],0)
        self.assertTrue(m["disputedPixelCategoryCountsReconcileExactly"])
        self.assertEqual(m["reviewRegionsLargestFirst"][0]["disputedPixelCount"],210)
        self.assertEqual(m["reviewRegionsLargestFirst"][1]["disputedPixelCount"],100)
        self.assertEqual(m["reviewRegionsLargestFirst"][0]["bboxOriginalPixels"],[20,8,49,14])
        self.assertTrue(np.array_equal(rgb,before[0]))
        self.assertTrue(np.array_equal(core,before[1]))
        self.assertTrue(np.array_equal(union,before[2]))
    def test_invalid_mask_pixels_or_unjustified_union_fail_closed(self):
        rgb=np.zeros((20,20,3),dtype=np.uint8)
        core=np.zeros((20,20),dtype=np.uint8)
        union=np.zeros((20,20),dtype=np.uint8)
        cases=[
          (np.zeros((20,20,4),dtype=np.uint8),core,union),
          (np.zeros((20,20,3),dtype=np.float32),core,union),
          (rgb,np.zeros((19,20),dtype=np.uint8),union),
          (rgb,np.ones((20,20),dtype=np.float32),union),
          (rgb,np.full((20,20),100,dtype=np.uint8),union)
        ]
        for a,b,c in cases:
            with self.subTest(shape=getattr(a,"shape",None),dtype=str(getattr(b,"dtype",None))):
                with self.assertRaises(ValueError):
                    classify_disagreement89(a,b,c)
        core[5,5]=255
        with self.assertRaisesRegex(ValueError,"subset"):
            classify_disagreement89(rgb,core,union)
    def test_museum_view_identity_and_visual_checkpoint_provenance(self):
        self.assertEqual(sorted(REVIEW_ANCHORS),sorted(SOURCES))
        self.assertEqual(REVIEW_ANCHORS[2551406]["independentMuseumViewCaption"],"a) front")
        self.assertTrue(SOURCES[2551406]["museum_caption_verified"])
        for id in (2551407,2551408,2551409):
            self.assertIsNone(REVIEW_ANCHORS[id]["independentMuseumViewCaption"])
            self.assertFalse(SOURCES[id]["museum_caption_verified"])
        for id,anchor in REVIEW_ANCHORS.items():
            self.assertGreaterEqual(len(anchor["interior"]),3)
            self.assertGreaterEqual(len(anchor["background"]),2)
            for kind in ("interior","background"):
                for x,y in anchor[kind]:
                    self.assertGreaterEqual(x,0)
                    self.assertLess(x,1200)
                    self.assertGreaterEqual(y,0)
                    self.assertLess(y,SOURCES[id]["height"])
    def test_fake_or_wrong_published_photo_and_identity_fails_before_review(self):
        for image_id,source in SOURCES.items():
            rgb=np.full((source["height"],1200,3),255,dtype=np.uint8)
            mask=np.zeros((source["height"],1200),dtype=np.uint8)
            wrong=hashlib.sha256(rgb.tobytes()).hexdigest()
            self.assertNotEqual(wrong,source["rgb_sha"])
            with self.assertRaisesRegex(ValueError,"hash"):
                review_original_met_mask89(rgb,image_id,mask,mask)
            with self.assertRaises(ValueError):
                review_original_met_mask89(rgb,source["height"],mask,mask)
            with self.assertRaises(ValueError):
                review_original_met_mask89(rgb[:100],image_id,mask,mask)
        with self.assertRaises(ValueError):
            review_original_met_mask89(np.zeros((100,200,3),dtype=np.uint8),
                                       5152,np.zeros((100,200),dtype=np.uint8),
                                       np.zeros((100,200),dtype=np.uint8))
    def test_manual_visual_review_overlay_is_only_a_visualization(self):
        rgb=np.full((60,80,3),239,dtype=np.uint8)
        core=np.zeros((60,80),dtype=np.uint8)
        core[12:48,14:62]=255
        union=core.copy()
        union[5:12,14:62]=255
        rgb[5:12,14:62]=(36,118,175)
        before=(rgb.copy(),core.copy(),union.copy())
        review={
          "largestConnectedDisputedReviewRegions":[
             {"bboxOriginalPixels":[14,5,61,11],"disputedPixelCount":336}],
          "sourceAttestedResearchInteriorAndBackgroundChecks":[
             {"pointOriginalPhotoPixels":[25,20],"kind":"interior"},
             {"pointOriginalPhotoPixels":[70,20],"kind":"background"}]}
        over=make_boundary_review_overlay89(rgb,core,union,review)
        self.assertEqual(over.shape,rgb.shape)
        self.assertEqual(over.dtype,np.uint8)
        self.assertFalse(np.array_equal(over,cv2.cvtColor(rgb,cv2.COLOR_RGB2BGR)))
        for x,y in zip((rgb,core,union),before):
            self.assertTrue(np.array_equal(x,y))

if __name__=="__main__":
    unittest.main()
