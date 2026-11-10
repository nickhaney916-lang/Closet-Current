"""P795 synthetic mathematical oracles only, not real model/human evidence."""
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest

import numpy as np
from PIL import Image
spec=importlib.util.spec_from_file_location("m1sam2",Path("scripts/test-mission1-real-owner-prompt-sam2-795.py"))
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
class P795SourcePromptTests(unittest.TestCase):
 def test_original_source_mask_math_counts_every_false_positive(self):
  w=h=16
  truth=np.zeros((h,w),dtype=bool)
  truth[3:12,3:12]=True
  logit=np.full((h,w),-1,np.float32)
  logit[3:12,3:12]=1
  a=m.score_logits(logit,truth,w,h)
  self.assertEqual((a["truePositives"],a["falsePositives"],a["falseNegatives"]),(81,0,0))
  spurious=np.full((h,w),1,np.float32)
  b=m.score_logits(spurious,truth,w,h)
  self.assertEqual((b["truePositives"],b["falsePositives"],b["falseNegatives"]),(81,175,0))
  self.assertLess(b["sourcePixelMaskIoU"],a["sourcePixelMaskIoU"])
 def test_source_original_publisher_polygon_always_supplies_interior_oracle_point(self):
  with tempfile.TemporaryDirectory() as root:
   before=m.BASE
   try:
    m.BASE=Path(root)
    originals=m.BASE/"originals";originals.mkdir()
    img=Image.new("RGB",(64,64),color=(120,140,90))
    buf=io.BytesIO();img.save(buf,format="JPEG")
    raw=buf.getvalue()
    (originals/"unit-synthetic.jpg").write_bytes(raw)
    a={"file_name":"unit-synthetic.jpg","sha256":m.sha(raw),
       "width":64,"height":64,
       "annotations":[{"id":11,"category_id":10,
         "segmentation":[[8,8,42,8,42,42,8,42]]}]}
    _,mask,point,id,cat=m.source_truth(a)
    self.assertEqual((id,cat),(11,10))
    self.assertTrue(mask[int(point[1]),int(point[0])])
   finally:m.BASE=before
 def test_real_original_jpeg_sha_not_replaceable_by_another_reencoded_photo(self):
  with tempfile.TemporaryDirectory() as root:
   before=m.BASE
   try:
    m.BASE=Path(root);(m.BASE/"originals").mkdir()
    img=Image.new("RGB",(64,64),color=(120,140,90))
    b=io.BytesIO();img.save(b,format="JPEG")
    raw=b.getvalue();(m.BASE/"originals"/"original.jpg").write_bytes(raw)
    with self.assertRaisesRegex(RuntimeError,"source SHA mismatch"):
     m.source_truth({"file_name":"original.jpg","sha256":"f"*64,
       "width":64,"height":64,"annotations":[{"id":1,"category_id":7,
        "segmentation":[[8,8,50,8,50,50,8,50]]}]})
   finally:m.BASE=before
 def test_image_model_preprocessing_keeps_expected_1024_shape_and_finite_pixels(self):
  photo=Image.new("RGB",(40,96),color=(100,120,140))
  x=m.preprocess(photo)
  self.assertEqual(x.shape,(1,3,1024,1024))
  self.assertEqual(x.dtype,np.float32)
  self.assertTrue(np.isfinite(x).all())
if __name__=="__main__":unittest.main()
