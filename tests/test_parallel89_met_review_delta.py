"""Original-source review proposals are NOT expert approval or wearable fit.

Pure mask-delta test fixtures are synthetic; real exact published photo SHA,
original mask receipts and genuine OpenCV output run separately in CI.
"""
import hashlib
import os
import sys
import unittest

import numpy as np

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),".."))
sys.path.insert(0,os.path.join(ROOT,"research","parallel89"))
from met_review_delta89 import (
 simulate_one_photo_uncertain_additions89,
 build_original_photo_proposal_preview89,
)

def sample_masks():
    core=np.zeros((60,80),dtype=np.uint8)
    core[15:45,17:62]=255
    union=core.copy()
    union[8:15,20:60]=255
    union[20:35,62:69]=255
    return core,union

class SourceBoundMaskPreviewTests(unittest.TestCase):
    def test_candidate_additions_only_include_existing_uncertainty_pixels(self):
        core,union=sample_masks()
        b=core.copy(),union.copy()
        sha=lambda a:hashlib.sha256(a.tobytes()).hexdigest()
        candidate,added,receipt=simulate_one_photo_uncertain_additions89(
          core,union,[[[20,7],[60,8],[59,15]]])
        self.assertGreater(receipt["unverifiedProposedChangedPixelCount"],0)
        self.assertLessEqual(receipt["unverifiedProposedChangedPixelCount"],280)
        self.assertEqual(receipt["unverifiedProposedChangedPixelCount"],
                         int(np.count_nonzero(added)))
        self.assertTrue(np.all((candidate>0)<=(union>0)))
        self.assertTrue(np.all((core>0)<=(candidate>0)))
        self.assertEqual(sha(core),sha(b[0]))
        self.assertEqual(sha(union),sha(b[1]))
        self.assertEqual(receipt["originalCoreSHA256"],sha(core))
        self.assertEqual(receipt["originalUnionSHA256"],sha(union))
        self.assertTrue(receipt["onlyOriginalSourceUncertaintyPixelsPreviewed"])
        self.assertFalse(receipt["humanOrQualifiedReviewerApproved"])
        self.assertFalse(receipt["consumer3DAdmitted"])
        self.assertFalse(receipt["releaseAuthorized"])
    def test_no_proposal_leaves_original_mask_pixel_exact(self):
        core,union=sample_masks()
        c,d,receipt=simulate_one_photo_uncertain_additions89(core,union,[])
        self.assertTrue(np.array_equal(c,core))
        self.assertEqual(np.count_nonzero(d),0)
        self.assertEqual(receipt["unverifiedProposedChangedPixelCount"],0)
    def test_illegal_polygons_or_unjustified_masks_fail(self):
        core,union=sample_masks()
        bad_polygons=[
          [[[1,1],[2,2]]],
          [[[1,1],[2,2],[3,3]]],  # no overlap with old uncertain fabric
          [[[0,0],[300,0],[300,15]]],
          [[[1,1],[2,2],[-2,3]]],
          [[[20.0,7],[60,8],[59,15]]],
          [[["20",7],[60,8],[59,15]]],
          [[20,7],[60,8],[59,15]],
          [[[[20,7],[60,8],[59,15]]]]*26
        ]
        for p in bad_polygons:
            with self.subTest(bad=p),self.assertRaises((ValueError,TypeError)):
                simulate_one_photo_uncertain_additions89(core,union,p)
        fake=core.copy()
        fake[1,1]=128
        with self.assertRaises(ValueError):
            simulate_one_photo_uncertain_additions89(fake,union,[])
        fake=union.copy();fake[14,60]=0
        fake[40,40]=0
        with self.assertRaises(ValueError):
            simulate_one_photo_uncertain_additions89(core,fake,[])
        with self.assertRaises(ValueError):
            simulate_one_photo_uncertain_additions89(core.astype(np.float32),union,[])
    def test_unverified_garment_objects_cannot_pass_real_source_witness(self):
        with self.assertRaises(ValueError):
            build_original_photo_proposal_preview89({}, {}, {}, {})
        with self.assertRaises(ValueError):
            build_original_photo_proposal_preview89(
              {"schema":"M2-original-Met-four-mask-targeted-human-review-queue/v1"},
              {"qualifiedReviewerVerified":True},{},{})

if __name__=="__main__":
    unittest.main()
