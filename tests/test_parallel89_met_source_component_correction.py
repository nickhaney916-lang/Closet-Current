"""Negative authenticity and research-only shape gates for Met image regions.
Actual 1406/1408 PHOTO pixels must be acquired and checked separately in CI.
"""
import copy
import sys
import unittest
from pathlib import Path

import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/"research"/"parallel89"))
from met_source_component_correction89 import (
 REGIONS,source_photo_component_shape89)

class PhotoBoundResearchColorEvidenceTests(unittest.TestCase):
    def test_exact_named_difficult_source_regions_and_view_provenance(self):
        self.assertEqual(set(REGIONS),{2551406,2551408})
        self.assertEqual(REGIONS[2551406]["expectedBBox"],[864,115,1076,522])
        self.assertEqual(REGIONS[2551406]["expectedUncertainPixels"],13180)
        self.assertEqual(REGIONS[2551406]["museumExactViewCaption"],"a) front")
        self.assertEqual(REGIONS[2551408]["expectedBBox"],[580,64,626,85])
        self.assertEqual(REGIONS[2551408]["expectedUncertainPixels"],549)
        self.assertIsNone(REGIONS[2551408]["museumExactViewCaption"])
    def test_wrong_or_fabricated_photo_and_candidate_masks_never_decide_a_real_region(self):
        for id,height in ((2551406,933),(2551408,978)):
            rgb=np.zeros((height,1200,3),dtype=np.uint8)
            core=np.zeros((height,1200),dtype=np.uint8)
            union=core.copy()
            bad={"imageId":id,
              "originalMuseumSourceRGBSHA256":"0"*64,
              "originalMaskCoreSHA256":"0"*64,
              "uncertaintyUnionSHA256":"0"*64,
              "status":"SOURCE_PHOTO_ANCHOR_CHECKS_PASS_BOUNDARY_HUMAN_REVIEW_STILL_REQUIRED",
              "museumVerifiedExactViewCaption":"a) front" if id==2551406 else None,
              "externalQualifiedAnnotatorReviewActuallyProvided":False,
              "consumer3DAdmitted":False,"releaseAuthorized":False}
            for mutated in [
             (rgb,core,union,id,bad),
             (rgb,core,union,id+1,bad),
             (rgb,core.astype(np.float32),union,id,bad),
             (rgb,core,np.full_like(union,128),id,bad),
             (np.zeros((height,1200,4),dtype=np.uint8),core,union,id,bad),
             (np.zeros((height,1199,3),dtype=np.uint8),core,union,id,bad),
             (rgb,core,union,id,{**bad,"externalQualifiedAnnotatorReviewActuallyProvided":True}),
             (rgb,core,union,id,{**bad,"consumer3DAdmitted":True}),
            ]:
                with self.subTest(id=id),self.assertRaises(ValueError):
                    source_photo_component_shape89(*mutated)
            self.assertEqual(np.count_nonzero(core),0)
    def test_original_photo_caption_of_b_other_side_is_not_asserted(self):
        self.assertIsNone(REGIONS[2551408]["museumExactViewCaption"])
        self.assertNotEqual(REGIONS[2551406]["sourceResearchHypothesis"],
                            REGIONS[2551408]["sourceResearchHypothesis"])

if __name__=="__main__":
    unittest.main()
