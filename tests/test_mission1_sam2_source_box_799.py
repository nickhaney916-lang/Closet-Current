"""M1 P799: synthetic mask geometry only; never a real human box/tap."""
import importlib.util
from pathlib import Path
import unittest
import numpy as np

p=Path("scripts/test-mission1-sam2-box-prompt-799.py")
spec=importlib.util.spec_from_file_location("m1_p799_source_box",p)
runner=importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)

class P799OracleSourceBoxContract(unittest.TestCase):
    def test_source_box_covers_all_published_polygon_pixels_and_stays_inside_original(self):
        truth=np.zeros((36,44),dtype=bool)
        truth[5:10,9:15]=True
        truth[24:30,31:37]=True
        bbox=runner.oracle_rect_source799(truth)
        self.assertEqual(bbox,(9,5,37,30))
        yy,xx=np.where(truth)
        self.assertTrue(all(bbox[0]<=int(x)<bbox[2] and bbox[1]<=int(y)<bbox[3] for x,y in zip(xx,yy)))
    def test_owner_point_box_and_point_plus_box_keep_original_scaled_dimensions_and_fixed_label_conventions(self):
        bbox=(20,40,120,180)
        point=(45,60)
        width,height=200,240
        for arm,expected in (("point",[1]),("box",[2,3]),("pointBox",[1,2,3])):
            coords,labels=runner.sam2_source_prompt799(arm,point,bbox,width,height)
            self.assertEqual(labels.tolist(),[expected])
            self.assertEqual(coords.shape,(1,len(expected),2))
            self.assertEqual(coords.dtype,np.float32)
            self.assertEqual(labels.dtype,np.int64)
            if arm!="box":
                self.assertAlmostEqual(float(coords[0,0,0]),45*1024/width,places=3)
            if arm!="point":
                offset=0 if arm=="box" else 1
                self.assertAlmostEqual(float(coords[0,offset,0]),20*1024/width,places=3)
                self.assertAlmostEqual(float(coords[0,offset+1,1]),180*1024/height,places=3)
    def test_invalid_box_point_labels_and_empty_publisher_source_fail_closed(self):
        with self.assertRaisesRegex(RuntimeError,"nonempty"):
            runner.oracle_rect_source799(np.zeros((16,16),dtype=bool))
        with self.assertRaisesRegex(RuntimeError,"unknown"):
            runner.sam2_source_prompt799("unknown",(3,3),(1,1,8,8),16,16)
        with self.assertRaisesRegex(RuntimeError,"outside source"):
            runner.sam2_source_prompt799("box",(3,3),(1,1,17,8),16,16)
        with self.assertRaisesRegex(RuntimeError,"positive oracle point"):
            runner.sam2_source_prompt799("point",(-1,3),(1,1,8,8),16,16)
    def test_source_pixel_iou_scores_wrong_full_frame_mask_with_all_false_positive_pixels(self):
        truth=np.zeros((20,20),dtype=bool)
        truth[4:10,7:14]=True
        all_fg=np.ones((20,20),dtype=np.float32)
        result=runner.score_logits(all_fg,truth,20,20)
        self.assertEqual(result["truePositives"],42)
        self.assertEqual(result["falsePositives"],358)
        self.assertEqual(result["falseNegatives"],0)
        self.assertEqual(result["sourcePixelMaskIoU"],.105)
    def test_all_original_photo_id_census_is_frozen_and_model_weights_remain_exactly_pinned(self):
        self.assertEqual(runner.SOURCE_IDS,[15201,20490,13428,12197,15461,18553,19659,13585,17509,17401])
        self.assertEqual(len(set(runner.SOURCE_IDS)),10)
        self.assertEqual(set(runner.MODEL_FILES),{"encoder.onnx","decoder.onnx"})
        self.assertTrue(all(len(z)==64 for z in runner.MODEL_FILES.values()))
if __name__=="__main__":unittest.main()
