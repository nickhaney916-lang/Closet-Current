import unittest
from deepfashion_review_risks import review_instance_scene

def overlap(conflicts=None):
 return dict(conflicts=conflicts or [],ambiguousProposalCount=2 if conflicts else 0)
def props(*names):
 return [dict(itemType=name) for name in names]

class Risks(unittest.TestCase):
 def test_shorts_photo_cannot_pass_from_skirt_or_vest_guess(self):
    r=review_instance_scene(props('vest','vest','skirt'),'Bottoms','shorts',overlap())
    self.assertEqual(r['matchingCategoryProposals'],1)
    self.assertEqual(r['matchingSpecificTypeProposals'],0)
    self.assertIn('no-expected-specific-garment-proposal',r['manualReviewFlags'])
    self.assertFalse(r['allowAutomaticSaving'])
 def test_jeans_multi_instance_warnings_even_when_disjoint(self):
    r=review_instance_scene(props('trousers','trousers'),'Bottoms','trousers',overlap())
    self.assertEqual(r['matchingSpecificTypeProposals'],2)
    self.assertIn('possible-single-garment-fragmentation',r['manualReviewFlags'])
    self.assertEqual(r['confirmedSeparateGarments'],0)
 def test_outerwear_multiple_proposals_reviewed_without_inventing_items(self):
    r=review_instance_scene(props('long_sleeve_outwear','short_sleeve_outwear'),
      'Outerwear','outerwear',overlap())
    self.assertIn('possible-single-garment-fragmentation',r['manualReviewFlags'])
 def test_shoes_are_unsupported_not_accuracy_failure_in_a_supported_class(self):
    r=review_instance_scene([], 'Shoes','shoes',overlap())
    self.assertEqual(r['taxonomySupportsCategory'],False)
    self.assertIsNone(r['matchingSpecificTypeProposals'])
    self.assertIn('unsupported-footwear-taxonomy',r['manualReviewFlags'])
    self.assertFalse(r['categoryAccuracyMeasured'])
 def test_layered_unknown_count_does_not_assert_single_item_ground_truth(self):
    r=review_instance_scene(props('long_sleeve_top','skirt'),'Layered','mixed',overlap(
     [dict(firstIndex=0,secondIndex=1)]))
    self.assertIsNone(r['taxonomySupportsCategory'])
    self.assertIn('potential-duplicate-or-layered-mask-overlap',r['manualReviewFlags'])
    self.assertEqual(r['confirmedSeparateGarments'],0)
 def test_invalid_proposals_or_taxonomy_fail_closed(self):
    with self.assertRaises(ValueError):review_instance_scene(props('banana'),'Bottoms','shorts',overlap())
    with self.assertRaises(ValueError):review_instance_scene(props('shorts'),'Shoes','shorts',overlap())
    with self.assertRaises(ValueError):review_instance_scene(props('shorts'),'Bottoms','mixed',overlap())
if __name__=='__main__':unittest.main()
