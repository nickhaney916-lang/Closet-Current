#!/usr/bin/env python3
"""P787 synthetic-only decoder invariants; never substitutes for real-photo metrics."""
import importlib.util
import pathlib
import unittest
import numpy as np

path=pathlib.Path("scripts/score-independent-instance-787.py")
spec=importlib.util.spec_from_file_location("p787",path)
p=importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)

class InstanceDecoder(unittest.TestCase):
    def test_letterboxed_portrait_returns_exact_original_size_and_crops(self):
        proto=np.zeros((32,104,104),dtype=np.float32)
        proto[0]=5.0
        coeff=np.zeros((32,),dtype=np.float32); coeff[0]=2.0
        m=p.project_instance_mask(coeff,proto,(80,50,210,370),682,1024)
        self.assertEqual(m.shape,(1024,682))
        self.assertTrue(m[500,180])
        self.assertFalse(m[500,0])
        self.assertFalse(m[2,180])

    def test_source_polygon_raster_and_exact_one_to_one_matching(self):
        ann={"id":11,"category_id":8,"iscrowd":0,
             "segmentation":[[10,10,40,10,40,40,10,40]]}
        m=p.source_mask(ann,60,60)
        self.assertTrue(m[20,20])
        self.assertFalse(m[0,0])
        preds=[{"modelClass":8,"confidence":.8,"mask":m.copy(),"sourceArea":int(m.sum()),"modelRowIndex":0},
               {"modelClass":8,"confidence":.7,"mask":m.copy(),"sourceArea":int(m.sum()),"modelRowIndex":1}]
        scored=p.score(preds,[ann],60,60)
        self.assertEqual((scored["truePositives"],scored["falsePositives"],scored["falseNegatives"]),(1,1,0))
        self.assertEqual(scored["precision"],.5)
        self.assertEqual(scored["recall"],1.0)

    def test_wrong_category_never_matches_identical_pixels(self):
        ann={"id":12,"category_id":10,"iscrowd":0,
             "segmentation":[[10,10,40,10,40,40,10,40]]}
        m=p.source_mask(ann,60,60)
        r=p.score([{"modelClass":0,"confidence":.99,"mask":m,
                    "sourceArea":int(m.sum()),"modelRowIndex":0}],[ann],60,60)
        self.assertEqual((r["truePositives"],r["falsePositives"],r["falseNegatives"]),(0,1,1))

    def test_unrepresented_publisher_categories_are_explicitly_excluded(self):
        ann={"id":13,"category_id":23,"iscrowd":0,
             "segmentation":[[10,10,40,10,40,40,10,40]]}
        r=p.score([],[ann],60,60)
        self.assertEqual(r["publisherUnsupportedExcluded"],1)
        self.assertEqual(r["falseNegatives"],0)

    def test_actual_mask_prototype_required_and_fake_layout_rejected(self):
        raw=np.zeros((1,300,38),dtype=np.float32)
        raw[0,0,:6]=[20,20,380,380,.85,10]
        raw[0,0,6]=3.0
        proto=np.zeros((1,32,104,104),dtype=np.float32)
        proto[0,0,:,:]=5.0
        pred=p.candidates(raw,proto,416,416)
        self.assertEqual(len(pred),1)
        self.assertEqual(pred[0]["modelClass"],10)
        self.assertTrue(pred[0]["mask"][150,150])
        self.assertFalse(pred[0]["mask"][5,5])
        with self.assertRaises(ValueError):
            p.candidates(raw,np.zeros((1,32,103,104),dtype=np.float32),416,416)

    def test_nonfinite_and_bad_masks_fail_closed(self):
        ann={"id":4,"category_id":10,"segmentation":[[0,0,float("nan"),1,2,3]]}
        with self.assertRaises(ValueError):p.source_mask(ann,10,10)
        with self.assertRaises(ValueError):
            p.project_instance_mask(np.full((32,),np.nan,dtype=np.float32),
                                     np.zeros((32,104,104),dtype=np.float32),
                                     (1,1,20,20),60,60)

if __name__=="__main__":
    unittest.main()
