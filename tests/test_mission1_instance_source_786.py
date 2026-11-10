"""Small synthetic mathematical-oracle tests only: never independent human labels."""
import unittest,sys,pathlib
import numpy as np
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from score_independent_instance_masks_786 import (
  choose_detections,decode_real_mask,source_truth,match_instances,sha
)
class SourceModelScorer786(unittest.TestCase):
 def test_real_contract_top_class_and_sorted_box_suppression(self):
  d=np.zeros((1,300,38),np.float32)
  d[0,0,:6]=[50,50,210,210,.92,9]
  d[0,1,:6]=[52,52,208,208,.81,9]
  d[0,2,:6]=[300,300,390,390,.75,7]
  d[0,3,:6]=[200,200,280,280,.01,6]
  chosen,above=choose_detections(d,416)
  self.assertEqual(above,3)
  self.assertEqual(len(chosen),2)
  self.assertEqual([x['classId'] for x in chosen],[9,7])
 def test_source_original_polygon_and_one_to_one_mask_matching(self):
  row={'annotations':[{'id':1,'category_id':10,'segmentation':[[4,4,27,4,27,27,4,27]]},
                      {'id':2,'category_id':23,'segmentation':[[32,32,40,32,40,40,32,40]]}]}
  t=source_truth(row,64,64)
  pred={'row':0,'category':'Dresses','classId':9,'confidence':.8,
        'mask':t[0]['mask'].copy(),'maskSHA256':sha(t[0]['mask'])}
  scores=match_instances(t,[pred,pred])
  self.assertEqual((scores['truePositives'],scores['falsePositives'],scores['falseNegatives']), (1,1,1))
  self.assertAlmostEqual(scores['recall'],.5)
  self.assertEqual(scores['matches'][0]['publisherInstanceId'],1)
 def test_mask_prototypes_require_actual_32dim_coefficients_and_original_source_bounds(self):
  proto=np.full((1,32,104,104),-10.,np.float32)
  proto[0,0,:,:]=10.
  meta={'side':416,'width':416,'height':416,'newWidth':416,'newHeight':416,
        'padX':0,'padY':0,'scale':1}
  p={'box':[104,104,312,312],'coefficients':np.array([1.]+[0.]*31,dtype=np.float32)}
  mask=decode_real_mask(proto,p,meta)
  self.assertEqual(mask.shape,(416,416))
  self.assertEqual(mask[10,10],0)
  self.assertEqual(mask[200,200],1)
  self.assertEqual(mask[400,400],0)
 def test_invalid_shapes_are_not_silently_reinterpreted(self):
  with self.assertRaises(ValueError):
   choose_detections(np.zeros((1,38,300),np.float32),416)
  with self.assertRaises(ValueError):
   decode_real_mask(np.zeros((1,16,104,104),np.float32),
    {'box':[0,0,100,100],'coefficients':np.zeros(32,np.float32)},
    {'side':416,'width':416,'height':416,'newWidth':416,'newHeight':416,
     'padX':0,'padY':0,'scale':1})
if __name__=='__main__':
 unittest.main()
