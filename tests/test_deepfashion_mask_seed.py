import unittest
import numpy as np
from deepfashion_mask_seed import encode_binary_runs,proposal_seed

SOURCE={"image":"commons-0035.jpg","sha256":"a"*64}
MODEL="example-pinned-instance-model"

def decode(runs,length):
    output=[];on=False
    for count in runs:
        output.extend([1 if on else 0]*count);on=not on
    assert len(output)==length
    return output

class UnapprovedInstanceMaskSeedTests(unittest.TestCase):
    def test_source_mask_encoding_exact_and_editor_compatible(self):
        m=np.array([[False,True,True],[True,False,True]],dtype=bool)
        seed=proposal_seed(SOURCE,{"mask":m,"score":.61,"itemType":"shorts"},1,MODEL)
        self.assertEqual(seed["runs"],[1,3,1,1])
        self.assertEqual(decode(seed["runs"],6),m.astype(int).ravel().tolist())
        self.assertEqual((seed["width"],seed["height"]),(3,2))
        self.assertEqual(seed["image"],SOURCE["image"])
        self.assertEqual(seed["sourceSha256"],SOURCE["sha256"])
        self.assertEqual(seed["reviewStatus"],"prediction-unreviewed")
        self.assertFalse(seed["independentReference"])
        self.assertFalse(seed["canSaveToCustomerCloset"])
        self.assertIsNone(seed["approvedBy"])
    def test_foreground_first_has_zero_length_background_run(self):
        m=np.array([[True,True,False,False]],dtype=bool)
        self.assertEqual(encode_binary_runs(m),[0,2,2])
        self.assertEqual(decode(encode_binary_runs(m),4),[1,1,0,0])
    def test_solid_mask_does_not_become_approved_garment(self):
        mask=np.ones((3,3),dtype=bool)
        seed=proposal_seed(SOURCE,{"mask":mask,"score":.99,"itemType":"skirt"},2,MODEL)
        self.assertEqual(seed["runs"],[0,9])
        self.assertFalse(seed["independentReference"])
        self.assertNotEqual(seed["reviewStatus"],"approved")
    def test_nonbinary_and_changed_source_refused(self):
        for mask in [np.ones((3,3),dtype=np.uint8),np.ones((2,3),dtype=float),
                     np.ones((2,2,2),dtype=bool)]:
            with self.assertRaises(ValueError):encode_binary_runs(mask)
        m={"mask":np.ones((3,3),dtype=bool),"score":.5,"itemType":"trousers"}
        for bad in [{"image":"wrong.jpg","sha256":"bad"}, {"image":"../../a.png","sha256":"a"*10}]:
            with self.assertRaises(ValueError):proposal_seed(bad,m,1,MODEL)
        with self.assertRaises(ValueError):proposal_seed(SOURCE,m,0,MODEL)
        with self.assertRaises(ValueError):proposal_seed(SOURCE,{**m,"score":float("nan")},1,MODEL)

if __name__=="__main__":
    unittest.main()
