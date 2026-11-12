import importlib.util,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('reference_evaluate',Path(__file__).resolve().parents[2]/'scripts/parallel67-reference-evaluate.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class OneToOneTests(unittest.TestCase):
    def test_maximum_cardinality_beats_greedy(self):
        self.assertEqual(len(module.one_to_one([[.9,.6],[.8,.1]])),2)
    def test_one_prediction_cannot_match_two_garments(self):
        self.assertEqual(len(module.one_to_one([[.9],[.8]])),1)
    def test_category_disagreement_and_below_threshold_rejected(self):
        self.assertEqual(module.one_to_one([[.9]],[[False]]),[])
        self.assertEqual(module.one_to_one([[.499]]),[])
    def test_invalid_iou_fails_instead_of_inflating_counts(self):
        for values in [[[float('nan')]],[[1.01]],[[-.1]]]:
            with self.assertRaises(ValueError):module.one_to_one(values)
    def test_incomplete_or_duplicate_original_cohort_rejected(self):
        with self.assertRaises(ValueError):module.evaluate({'rows':[]},{'rows':[]})

if __name__=='__main__':unittest.main()
