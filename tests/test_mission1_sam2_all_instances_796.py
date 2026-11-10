"""P796 fixed-source/annotation-score unit tests: synthetic only, not humans."""
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest
import numpy as np
from PIL import Image
spec=importlib.util.spec_from_file_location("m1sam2all",Path("scripts/test-mission1-sam2-all-original-instances-796.py"))
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class P796ActualPublisherInstanceIntegrity(unittest.TestCase):
 def test_full_original_real_publisher_source_ids_pre_registered_once(self):
  self.assertEqual(len(m.SOURCE_IDS),10)
  self.assertEqual(len(set(m.SOURCE_IDS)),10)
  self.assertEqual(m.SOURCE_IDS[:3],[15201,20490,13428])
  self.assertEqual(set(m.MODEL_FILES),{"encoder.onnx","decoder.onnx"})
  self.assertTrue(all(len(d)==64 for d in m.MODEL_FILES.values()))
 def test_one_original_photo_can_supply_two_DISTINCT_original_publisher_polygons(self):
  with tempfile.TemporaryDirectory() as d:
   original=m.BASE
   try:
    m.BASE=Path(d)
    (m.BASE/"originals").mkdir()
    im=Image.new("RGB",(64,64),(150,80,50))
    f=io.BytesIO()
    im.save(f,format="JPEG")
    blob=f.getvalue()
    (m.BASE/"originals"/"source.jpg").write_bytes(blob)
    anns=[
     {"id":2,"category_id":0,"segmentation":[[2,2,27,2,27,28,2,28]]},
     {"id":3,"category_id":7,"segmentation":[[36,34,60,34,60,59,36,59]]}
    ]
    row={"file_name":"source.jpg","sha256":m.sha(blob),"width":64,"height":64,
      "annotations":anns}
    a,mask_a,point_a,id_a,cat_a=m.source_truth(row,anns[0])
    bb,mask_b,point_b,id_b,cat_b=m.source_truth(row,anns[1])
    self.assertEqual(a.size,bb.size)
    self.assertNotEqual(id_a,id_b)
    self.assertNotEqual(cat_a,cat_b)
    self.assertNotEqual(point_a,point_b)
    self.assertTrue(mask_a[int(point_a[1]),int(point_a[0])])
    self.assertTrue(mask_b[int(point_b[1]),int(point_b[0])])
    self.assertFalse(np.logical_and(mask_a,mask_b).any())
   finally:
    m.BASE=original
 def test_all_original_publisher_instance_mask_arithmetic_counts_false_and_missing_pixels(self):
  target=np.zeros((16,16),dtype=bool)
  target[2:10,2:10]=True
  p=np.full((16,16),-2.,np.float32)
  p[2:6,2:10]=2.
  r=m.score_logits(p,target,16,16)
  self.assertEqual((r["truePositives"],r["falsePositives"],r["falseNegatives"]),(32,0,32))
  self.assertEqual(r["sourcePixelMaskIoU"],.5)
if __name__=="__main__":
 unittest.main()
