import unittest
import numpy as np
from lip_mask_evidence import analyze_lip_labels

class ConservativeLIPLabels(unittest.TestCase):
    def test_socks_and_shoes_detected_but_never_auto_saved(self):
        a = np.zeros((50, 50), dtype=np.uint8)
        a[10:29, 10:20] = 8
        a[30:42, 10:20] = 18
        a[30:42, 30:40] = 19
        result = analyze_lip_labels(a)
        self.assertTrue(result["sockAndShoeLabelsPresent"])
        self.assertEqual(result["sockPixels"], 190)
        self.assertEqual(result["shoePixels"], 240)
        self.assertEqual(result["automaticallySavedGarments"], 0)
        self.assertFalse(result["differentPhysicalGarmentsVerified"])
        self.assertFalse(result["productionAuthorized"])

    def test_exposed_skin_never_mislabeled_stockings_by_rule(self):
        a = np.full((30, 30), 16, dtype=np.uint8)
        a[20:28, 3:12] = 18
        r = analyze_lip_labels(a)
        self.assertEqual(r["sockPixels"], 0)
        self.assertFalse(r["sockAndShoeLabelsPresent"])
        self.assertFalse(r["dedicatedStockingsOrTightsClass"])

    def test_small_noise_is_not_substantial_socks(self):
        a = np.zeros((50, 50), dtype=np.uint8)
        a[1:3, 1:4] = 8
        a[30:40, 10:30] = 19
        r = analyze_lip_labels(a)
        self.assertFalse(r["hasSubstantialSockClass"])
        self.assertEqual(r["automaticallySavedGarments"], 0)

    def test_mask_geometry_and_invalid_labels(self):
        with self.assertRaises(ValueError):
            analyze_lip_labels(np.array([0, 1, 8], dtype=np.uint8))
        with self.assertRaises(ValueError):
            analyze_lip_labels(np.array([[0, 20]], dtype=np.uint8))
        with self.assertRaises(ValueError):
            analyze_lip_labels(np.array([[8.0]], dtype=np.float32))
        with self.assertRaises(ValueError):
            analyze_lip_labels(np.array([], dtype=np.uint8))

    def test_coat_and_top_are_separate_classes_not_instances(self):
        a = np.zeros((60, 60), dtype=np.uint8)
        a[5:25, 10:30] = 7
        a[10:22, 17:25] = 5
        r = analyze_lip_labels(a)
        self.assertGreater(r["coatPixels"], 0)
        self.assertGreater(r["upperGarmentPixels"], 0)
        self.assertFalse(r["independentGarmentInstanceMasks"])

if __name__ == "__main__":
    unittest.main()
