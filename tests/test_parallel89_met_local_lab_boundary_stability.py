"""The new LAB-nearest source boundary method has distinct synthetic controls.

A true external expert pixelwise alpha mask is NOT available. Unit fixtures
are NOT genuine museum photographic evidence; original full-image SHA and
source original conservative masks are audited separately by genuine CI.
"""
import os
import sys
import unittest
import numpy as np

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),".."))
sys.path.insert(0,os.path.join(ROOT,"research","parallel89"))
from met_local_lab_boundary_stability89 import (
 independent_nearest_label_lab_votes89,audit_real_met_boundary_stability89,
 ROI_PADDING_PIXELS,SIGMAS
)

def fixture():
    rgb=np.full((60,100,3),[248,246,237],dtype=np.uint8)
    core=np.zeros((60,100),dtype=bool)
    union=np.zeros((60,100),dtype=bool)
    core[15:45,15:45]=True
    union[15:45,15:54]=True
    rgb[core]=[45,118,52]
    # Real-photo-level disagreement between two possible segments:
    # the unverified uncertain band is paper-colored, except near left side.
    rgb[15:45,45:49]=[190,205,158]
    component=union&~core
    return rgb,core,union,component,[45,15,53,44]


class AlternativePhotoMethodNegativeTests(unittest.TestCase):
    def test_controlled_synthetic_source_nearest_lab_vote_counts_reconcile(self):
        rgb,core,union,component,bbox=fixture()
        prior=(rgb.copy(),core.copy(),union.copy())
        maps,receipt=independent_nearest_label_lab_votes89(
          rgb,core,union,component,bbox)
        self.assertEqual(tuple(SIGMAS),(0.0,1.5,3.0,5.0))
        self.assertEqual(ROI_PADDING_PIXELS,25)
        self.assertEqual(receipt["numberOfSmoothingScales"],4)
        self.assertEqual(len(receipt["smoothingScaleReceipt"]),4)
        self.assertTrue(receipt["sourceRegionTotalVoteCountsReconcile"])
        self.assertEqual(
          receipt["allSmoothingClothVotePixels"]+
          receipt["allSmoothingBackgroundVotePixels"]+
          receipt["smoothingSensitiveMixedVotePixels"],
          int(component.sum()))
        for mask in maps.values():
            self.assertEqual(mask.shape,core.shape)
            self.assertEqual(mask.dtype,np.uint8)
            self.assertTrue(set(np.unique(mask)).issubset({0,255}))
            self.assertFalse(np.any((mask>0)&~component))
        self.assertTrue(np.array_equal(rgb,prior[0]))
        self.assertTrue(np.array_equal(core,prior[1]))
        self.assertTrue(np.array_equal(union,prior[2]))
        self.assertTrue(receipt["independentAlternativeMethodNotIndependentHumanSegmentation"])
        self.assertTrue(receipt["maskDerivedStableCoreAndExteriorReferenceLabelsNotExpertGT"])

    def test_source_cloth_vs_background_nearest_votes_can_disagree(self):
        rgb,core,union,component,bbox=fixture()
        maps,report=independent_nearest_label_lab_votes89(
          rgb,core,union,component,bbox)
        self.assertGreater(report["allSmoothingBackgroundVotePixels"],0)
        self.assertGreater(report["allSmoothingClothVotePixels"]+
                           report["smoothingSensitiveMixedVotePixels"],0)
        self.assertEqual(sum(int(np.count_nonzero(x)) for x in maps.values()),
                         int(component.sum()))
        self.assertEqual(len(report["smoothingScaleReceipt"]),4)

    def test_wrong_binary_source_prior_component_and_out_of_range_parameters_refused(self):
        rgb,core,union,component,bbox=fixture()
        cases=[
         (rgb.astype(np.float32),core,union,component,bbox),
         (rgb[:30,:,:],core,union,component,bbox),
         (rgb,core.astype(np.uint8),union,component,bbox),
         (rgb,core,union.astype(np.uint8),component,bbox),
         (rgb,core,union,component.astype(np.uint8),bbox),
         (rgb,core,core,component,bbox),
         (rgb,component,core,component,bbox),
         (rgb,core,union,component,[45,15,300,44]),
         (rgb,core,union,component,[45,15,53,100]),
         (rgb,core,union,component,[45.1,15,53,44])
        ]
        for p in cases:
            with self.subTest(casestr=str([getattr(x,"shape",x) for x in p])),self.assertRaises(ValueError):
                independent_nearest_label_lab_votes89(*p)
        for kwargs in ({"smoothing":[-1]},{"smoothing":[9]},
                       {"pad":0},{"pad":101},{"smoothing":[]},
                       {"smoothing":list(range(9))}):
            with self.assertRaises(ValueError):
                independent_nearest_label_lab_votes89(
                  rgb,core,union,component,bbox,**kwargs)

    def test_fake_or_wrong_original_museum_photo_never_enters_real_source_audit(self):
        rgb,core,union,component,bbox=fixture()
        for id in (2551406,2551408,2551407,5152,0):
            with self.assertRaises(ValueError):
                audit_real_met_boundary_stability89(
                  rgb,core.astype(np.uint8)*255,union.astype(np.uint8)*255,
                  {"imageId":id},id)
        self.assertTrue(np.all((component&~union)==False))

if __name__=="__main__":
    unittest.main()
