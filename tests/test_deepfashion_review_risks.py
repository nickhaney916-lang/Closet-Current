import unittest
from deepfashion_review_risks import review_instance_scene,category_union_preview

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
 def test_disconnected_trouser_legs_can_be_viewed_as_one_unverified_source_union(self):
    import numpy as np
    left=np.zeros((30,32),dtype=bool);right=left.copy()
    left[3:28,3:12]=True;right[3:28,18:27]=True
    old_left=left.copy()
    r=category_union_preview([dict(itemType='trousers',mask=left),
         dict(itemType='trousers',mask=right)],'Bottoms')
    self.assertEqual(r['modelProposals'],2)
    self.assertEqual(r['unionPixels'],450)
    self.assertEqual(r['sharedOrDuplicatePixels'],0)
    self.assertFalse(r['certifiedSingleArticle'])
    self.assertFalse(r['autoSaveAllowed'])
    self.assertTrue(np.array_equal(left,old_left))
 def test_overlapping_jacket_panels_do_not_double_count_photographic_pixels(self):
    import numpy as np
    jacket=np.zeros((20,20),dtype=bool);sleeve=jacket.copy()
    jacket[2:12,3:12]=True;sleeve[7:17,7:16]=True
    r=category_union_preview([dict(itemType='long_sleeve_outwear',mask=jacket),
          dict(itemType='short_sleeve_outwear',mask=sleeve)],'Outerwear')
    self.assertEqual(r['sharedOrDuplicatePixels'],25)
    self.assertEqual(r['unionPixels'],155)
    self.assertFalse(r['garmentOnlyVerified'])
 def test_never_combine_shoes_or_different_photographs(self):
    import numpy as np
    a=np.ones((10,10),dtype=bool);b=np.ones((12,12),dtype=bool)
    with self.assertRaises(ValueError):
      category_union_preview([dict(itemType='trousers',mask=a),
        dict(itemType='shorts',mask=b)],'Bottoms')
    self.assertIsNone(category_union_preview([dict(itemType='trousers',mask=a),
      dict(itemType='long_sleeve_top',mask=a)],'Bottoms'))
    with self.assertRaises(ValueError):category_union_preview([], 'Shoes')
if __name__=='__main__':unittest.main()
