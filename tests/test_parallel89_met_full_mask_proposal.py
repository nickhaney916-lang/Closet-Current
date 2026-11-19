"""Negative source-provenance, nonrelease, seed-uncertainty and foreground tests.
Synthetic RGB means nothing about original Met garment acceptance; real gallery
JPEG+canonical decoded RGB must run separately in exact-head CI.
"""
import hashlib
import os
import sys
import unittest
import cv2
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__),".."))
sys.path.insert(0,os.path.join(ROOT,"research","parallel89"))
from met_full_mask_proposal89 import (
  SOURCES,CATALOG_PART_MEASUREMENTS_MM,seeded_grabcut,propose_full_mask
)

class MetRealSourceAlphaProposalTests(unittest.TestCase):
    def test_only_first_source_view_has_museum_caption(self):
        self.assertEqual(sorted(SOURCES),[2551406,2551407,2551408,2551409])
        self.assertEqual(SOURCES[2551406]["museum_caption"],"a) front")
        self.assertTrue(SOURCES[2551406]["museum_caption_verified"])
        for image_id in (2551407,2551408,2551409):
            self.assertFalse(SOURCES[image_id]["museum_caption_verified"])
            self.assertIsNone(SOURCES[image_id]["museum_caption"])
        self.assertEqual(CATALOG_PART_MEASUREMENTS_MM[0]["catalogLengthMm"],990.60)
        self.assertEqual(CATALOG_PART_MEASUREMENTS_MM[1]["catalogLengthMm"],965.20)
        self.assertTrue(all("catalogWaistbandWidthWithoutFastenerMm" in p
                            for p in CATALOG_PART_MEASUREMENTS_MM))

    def test_wrong_original_rgb_and_wrong_identity_fail_before_mask_generation(self):
        fake=np.zeros((933,1200,3),dtype=np.uint8)
        before=hashlib.sha256(fake.tobytes()).hexdigest()
        for id in (0,70759,2551405,2551406,2551407,2551408,2551409):
            with self.subTest(id=id), self.assertRaises(ValueError):
                propose_full_mask(fake,id)
        self.assertEqual(before,hashlib.sha256(fake.tobytes()).hexdigest())
        with self.assertRaises(ValueError):
            propose_full_mask(np.zeros((933,1200,4),dtype=np.uint8),2551406)
        with self.assertRaises(ValueError):
            propose_full_mask(np.zeros((933,1200,3),dtype=np.float32),2551406)

    def test_synthetic_colorful_skirt_with_neutral_waistband_separates_from_paper(self):
        height,width=240,260
        rgb=np.full((height,width,3),(240,239,231),dtype=np.uint8)
        outer=[(.27,.06),(.78,.04),(.85,.19),(.97,.83),
               (.75,.93),(.50,.98),(.20,.93),(.02,.83),(.17,.19)]
        inner=[(.38,.18),(.70,.18),(.81,.43),(.86,.79),
               (.70,.82),(.49,.87),(.26,.80),(.12,.75),(.26,.40)]
        skirtpoly=np.array([[(int(x*width),int(y*height)) for x,y in outer]],np.int32)
        cv2.fillPoly(rgb,skirtpoly,(48,134,91))
        waistband=np.array([[(int(x*width),int(y*height)) for x,y in [
          (.27,.06),(.78,.04),(.83,.23),(.72,.26),(.49,.31),(.29,.25)] ]],np.int32)
        cv2.fillPoly(rgb,waistband,(208,199,157))
        original=rgb.copy()
        primary,meta=seeded_grabcut(rgb,outer,inner,0)
        secondary,_=seeded_grabcut(rgb,outer,inner,1)
        self.assertTrue(np.array_equal(rgb,original))
        self.assertEqual(primary.shape,(height,width))
        self.assertTrue(set(np.unique(primary)).issubset({0,255}))
        self.assertEqual(primary[0,0],0)
        self.assertEqual(primary[-1,-1],0)
        self.assertEqual(primary[int(height*.6),int(width*.5)],255)
        self.assertEqual(primary[int(height*.13),int(width*.5)],255)
        self.assertGreater(np.count_nonzero(primary),10000)
        self.assertGreater(meta["largestComponentPixelCount"],10000)
        self.assertGreater(
          np.count_nonzero((primary>0)&(secondary>0))/
          np.count_nonzero((primary>0)|(secondary>0)),.90)

    def test_invalid_seed_input_must_not_silently_pass(self):
        o=SOURCES[2551406]["outer"]
        i=SOURCES[2551406]["inner"]
        fake=np.zeros((200,200,3),dtype=np.uint8)
        with self.assertRaises(ValueError):
            seeded_grabcut(fake,o,i,variant=10)
        with self.assertRaises(ValueError):
            seeded_grabcut(np.zeros((50,50,3),dtype=np.uint8),o,i)
        with self.assertRaises(ValueError):
            seeded_grabcut(np.zeros((200,200,4),dtype=np.uint8),o,i)
        with self.assertRaises(ValueError):
            seeded_grabcut(np.zeros((200,200,3),dtype=np.float32),o,i)

if __name__=="__main__":
    unittest.main()
