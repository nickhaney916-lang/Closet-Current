import unittest
import numpy as np
from deepfashion_instance_decode import decode,instance_overlap_review,NAMES
class Decoder(unittest.TestCase):
 def test_model_taxonomy_covers_shorts_pants_skirts_outerwear_dresses_but_not_shoes(self):
    self.assertIn('shorts',NAMES)
    self.assertIn('trousers',NAMES)
    self.assertIn('skirt',NAMES)
    self.assertIn('long_sleeve_outwear',NAMES)
    self.assertIn('short_sleeve_dress',NAMES)
    self.assertFalse(any('shoe' in x or 'sneaker' in x for x in NAMES))

 def sample(self):
    det=np.zeros((1,300,38),dtype=np.float32)
    det[0,0,:6]=[80,100,250,310,.91,8];det[0,0,6]=4
    proto=np.zeros((1,32,104,104),dtype=np.float32);proto[0,0]=2
    geo=dict(inputSize=416,originalWidth=416,originalHeight=416,scale=1,xPad=0,yPad=0)
    return det,proto,geo
 def test_source_pixels_and_never_autosave(self):
    d,p,g=self.sample();r=decode(d,p,g)
    self.assertEqual(r['candidates'][0]['itemType'],'skirt')
    self.assertTrue(r['candidates'][0]['mask'][150,150])
    self.assertFalse(r['candidates'][0]['mask'][15,15])
    self.assertEqual(r['physicalInstancesVerified'],0)
    self.assertIsNone(r['pixelGroundTruthAccuracy'])
    self.assertEqual(r['automaticSavedItems'],0)
 def test_source_dimensions_and_untrusted_shapes(self):
    d,p,g=self.sample()
    g.update(originalWidth=960,originalHeight=1440,scale=416/1440,xPad=69)
    self.assertEqual(decode(d,p,g)['candidates'][0]['mask'].shape,(1440,960))
    for bad,pr in [(d[:,:,:30],p),(d,p[:,:,:80,:80]),(np.full_like(d,np.nan),p)]:
      with self.assertRaises(ValueError):decode(bad,pr,g)
    edge=d.copy();edge[0,0,0]=-2;edge[0,0,2]=417
    self.assertEqual(len(decode(edge,p,g)['candidates']),1)
    far=d.copy();far[0,0,0]=-200
    with self.assertRaises(ValueError):decode(far,p,g)
    wrong=d.copy();wrong[0,0,5]=39
    with self.assertRaises(ValueError):decode(wrong,p,g)
 def test_ninth_lower_confidence_skirt_is_not_silently_lost(self):
    # Synthetic logits exercise proposal coverage, not real garment accuracy.
    d,p,g=self.sample()
    for i in range(9):
      d[0,i]=d[0,0];d[0,i,4]=.95-i*.02;d[0,i,5]=3 if i<8 else 8
    before=d.copy();original_proto=p.copy()
    old_limit=decode(d,p,g,max_candidates=8)
    current=decode(d,p,g)
    self.assertEqual(len(old_limit['candidates']),8)
    self.assertTrue(old_limit['proposalCoverage']['truncated'])
    self.assertEqual(old_limit['proposalCoverage']['unexaminedRows'],1)
    self.assertEqual(current['candidates'][-1]['itemType'],'skirt')
    self.assertEqual(len(current['candidates']),9)
    self.assertTrue(current['proposalCoverage']['completeAboveThresholdReview'])
    self.assertIsNone(current['proposalCoverage']['missingPhysicalGarments'])
    np.testing.assert_array_equal(d,before)
    np.testing.assert_array_equal(p,original_proto)
 def test_bounded_review_reports_remaining_rows_and_exact_limit(self):
    d,p,g=self.sample()
    d[0,:21]=d[0,0]
    result=decode(d,p,g)
    self.assertEqual(len(result['candidates']),20)
    self.assertEqual(result['proposalCoverage']['unexaminedRows'],1)
    self.assertTrue(result['proposalCoverage']['truncated'])
    d[0,20]=0
    self.assertFalse(decode(d,p,g)['proposalCoverage']['truncated'])
    for limit in [0,21,True,8.5,None]:
      with self.assertRaises(ValueError):decode(d,p,g,max_candidates=limit)
 def test_small_rejected_masks_do_not_consume_review_capacity(self):
    d,p,g=self.sample()
    d[0,1]=d[0,0];d[0,0,:4]=[0,0,1,1]
    result=decode(d,p,g,max_candidates=1)
    self.assertEqual(len(result['candidates']),1)
    self.assertEqual(result['proposalCoverage']['examinedRows'],2)
    self.assertFalse(result['proposalCoverage']['truncated'])
 def test_duplicate_vs_disjoint_and_layered_masks_flagged_without_deletion(self):
    d,p,g=self.sample()
    item=decode(d,p,g)['candidates'][0]
    twin={**item,'classId':10,'itemType':'long_sleeve_dress'}
    r=instance_overlap_review([item,twin])
    self.assertEqual(len(r['conflicts']),1)
    self.assertTrue(r['conflicts'][0]['crossCategory'])
    self.assertEqual(r['ambiguousProposalCount'],2)
    self.assertFalse(r['canAutoSaveAnyProposal'])
    half=item['mask'].copy();half[:,:]=False;half[150:160,150:160]=True
    other={**item,'mask':half,'classId':3}
    self.assertEqual(len(instance_overlap_review([item,other])['conflicts']),1)
    empty=item['mask'].copy();empty[:]=False;empty[0:10,0:10]=True
    far={**item,'mask':empty}
    self.assertEqual(instance_overlap_review([item,far])['conflicts'],[])
if __name__=='__main__':unittest.main()
