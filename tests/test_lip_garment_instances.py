import unittest
import numpy as np
from lip_garment_instance_candidates import candidate_class_regions

class LIPGarmentClassCandidateTests(unittest.TestCase):
    def test_distinct_coat_skirt_and_shoes_are_review_regions_only(self):
        a=np.zeros((40,50),dtype=np.uint8)
        a[4:19,10:35]=7
        a[20:34,12:34]=12
        a[35:39,13:20]=18
        a[35:39,26:33]=19
        a[9:15,22:28]=13 # face or skin, not coat
        r=candidate_class_regions(a)
        by={x["role"]:x for x in r["classCandidates"]}
        self.assertTrue(r["possibleSeparateCoatSkirtClassEvidence"])
        self.assertTrue(by["coat"]["substantialModelRegion"])
        self.assertTrue(by["skirt"]["substantialModelRegion"])
        self.assertEqual(by["shoe_pair"]["pixels"],56)
        self.assertFalse(by["coat"]["mask"][10,24])
        self.assertTrue(all(x["reviewRequired"] for x in by.values()))
        self.assertEqual(r["physicalInstancesConfirmed"],0)
        self.assertEqual(r["automaticallySavedGarments"],0)
        self.assertFalse(r["pixelAccuracyMeasured"])
        self.assertFalse(r["productionAuthorized"])
    def test_pure_dress_is_not_split_into_invented_coat_and_skirt(self):
        a=np.zeros((40,50),dtype=np.uint8);a[3:30,8:40]=6
        r=candidate_class_regions(a)
        self.assertFalse(r["possibleSeparateCoatSkirtClassEvidence"])
        self.assertEqual([x["role"] for x in r["classCandidates"]],["dress"])
    def test_two_labels_do_not_imply_two_instances_of_same_garment(self):
        a=np.zeros((40,50),dtype=np.uint8);a[6:21,8:19]=7;a[24:38,8:19]=7
        r=candidate_class_regions(a)
        self.assertEqual(len(r["classCandidates"]),1)
        self.assertFalse(r["classCandidates"][0]["verifiedSinglePhysicalGarment"])
    def test_skin_background_hair_and_limbs_are_not_garment_masks(self):
        a=np.full((40,50),13,dtype=np.uint8);a[0:4,:]=2
        r=candidate_class_regions(a)
        self.assertEqual(r["classCandidates"],[])
        self.assertFalse(r["possibleSeparateCoatSkirtClassEvidence"])
    def test_fails_closed_on_shape_dtype_class_and_threshold(self):
        a=np.zeros((40,50),dtype=np.uint8)
        for bad in [np.ones((3,3),dtype=np.uint8),np.zeros((40,50),dtype=np.float32),
                    np.full((40,50),21,dtype=np.uint8)]:
            with self.assertRaises(ValueError):candidate_class_regions(bad)
        for value in [-1,0,.05,float("nan")]:
            with self.assertRaises(ValueError):
                candidate_class_regions(a,min_area_fraction=value)

if __name__=="__main__":
    unittest.main()
