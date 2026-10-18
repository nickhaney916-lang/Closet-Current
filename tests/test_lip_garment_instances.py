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
        # This fixture includes 36 pixels of face/skin (label 13), so the
        # independent model's wearer-context heuristic has support. Still
        # not a confirmed coat/skirt instance mask or an automatic save.
        self.assertEqual(r["reviewDisposition"],"distinct-classes-needing-outline-review")
        self.assertTrue(r["onPersonContextSupported"])
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
        self.assertEqual(r["reviewDisposition"],"wearer-context-not-supported")
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
        self.assertEqual(r["reviewDisposition"],"no-garment-parsing-evidence")
        self.assertFalse(r["possibleSeparateCoatSkirtClassEvidence"])
    def test_supported_socks_pants_jumpsuit_pixels_are_not_dropped(self):
        # Synthetic labels test extraction, not real-photo recognition.
        a=np.zeros((40,50),dtype=np.uint8)
        a[0:4,:]=13
        a[5:10,4:30]=8
        a[11:20,4:30]=9
        a[21:30,4:30]=10
        before=a.copy()
        r=candidate_class_regions(a)
        by={c['role']:c for c in r['classCandidates']}
        for role,ident in [('socks',8),('pants',9),('jumpsuit',10)]:
            np.testing.assert_array_equal(by[role]['mask'],a==ident)
            self.assertEqual(by[role]['pixels'],int((a==ident).sum()))
            self.assertFalse(by[role]['verifiedSinglePhysicalGarment'])
        self.assertFalse(r['stockingsOrTightsSeparateClass'])
        self.assertFalse(r['socksPixelsVerifyTights'])
        self.assertFalse(r['productionAuthorized'])
        np.testing.assert_array_equal(a,before)

    def test_leg_and_shoe_pixels_never_substitute_for_missing_socks(self):
        a=np.zeros((40,50),dtype=np.uint8)
        a[0:10,:]=16;a[10:20,:]=17
        a[20:30,:]=18;a[30:40,:]=19
        r=candidate_class_regions(a)
        self.assertEqual([x['role'] for x in r['classCandidates']],['shoe_pair'])
        self.assertFalse(r['socksPixelsVerifyTights'])

    def test_fails_closed_on_shape_dtype_class_and_threshold(self):
        a=np.zeros((40,50),dtype=np.uint8)
        for bad in [np.ones((3,3),dtype=np.uint8),np.zeros((40,50),dtype=np.float32),
                    np.full((40,50),21,dtype=np.uint8)]:
            with self.assertRaises(ValueError):candidate_class_regions(bad)
        for value in [-1,0,.05,float("nan")]:
            with self.assertRaises(ValueError):
                candidate_class_regions(a,min_area_fraction=value)

    def test_on_person_class_separation_requires_real_body_labels_and_stays_review_only(self):
        a=np.zeros((50,60),dtype=np.uint8)
        a[1:13,20:36]=13   # face
        a[14:31,12:42]=7   # coat
        a[32:46,15:38]=12  # skirt
        r=candidate_class_regions(a)
        self.assertTrue(r["onPersonContextSupported"])
        self.assertEqual(r["reviewDisposition"],"distinct-classes-needing-outline-review")
        self.assertEqual(r["physicalInstancesConfirmed"],0)
        self.assertFalse(r["productionAuthorized"])

if __name__=="__main__":
    unittest.main()
