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
