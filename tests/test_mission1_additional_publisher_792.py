"""P792 selection mathematical oracles; synthetic data are NOT real publisher photos."""
import importlib.util
import io
import pathlib
import tempfile
import unittest
import zipfile

spec=importlib.util.spec_from_file_location("m1_p792",pathlib.Path("scripts/intake-additional-publisher-originals-792.py"))
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class PublisherSelection792(unittest.TestCase):
 def fixture(self,n=17):
  images=[];annotations=[]
  mem=io.BytesIO()
  with zipfile.ZipFile(mem,"w") as archive:
   for i in range(n):
    file_name=f"{i:032x}.jpg";image_id=100000+i
    images.append({"id":image_id,"file_name":file_name,
       "width":682,"height":1024,"license":8})
    annotations.append({"image_id":image_id,"id":i*2,"category_id":0,
       "segmentation":[[1,1,20,1,20,30,1,30]]})
    if i<(n+1)//2:
     annotations.append({"image_id":image_id,"id":i*2+1,"category_id":6,
       "segmentation":[[50,50,60,50,60,70,50,70]]})
    archive.writestr("test/"+file_name,b"\xff\xd8"+bytes([i+1])*700+b"\xff\xd9")
  # Synthetic fixture has no source rights, real decoded JPEG or human author.
  return {"images":images,"annotations":annotations},mem.getvalue()
 def run_selection(self,source,zip_blob,excluded=set()):
  with tempfile.TemporaryDirectory() as directory:
   before=module.OUTPUT
   try:
    module.OUTPUT=pathlib.Path(directory)
    (module.OUTPUT/"originals").mkdir()
    with zipfile.ZipFile(io.BytesIO(zip_blob)) as archive:
     rows=module.prepare(source,archive,excluded)
    self.assertTrue(all((module.OUTPUT/"originals"/r["file_name"]).exists() for r in rows))
   finally:
    module.OUTPUT=before
  return rows
 def test_deterministic_selection_not_affected_by_publisher_row_order(self):
  source,z=self.fixture()
  a=self.run_selection(source,z)
  b=self.run_selection({"images":list(reversed(source["images"])),
    "annotations":list(reversed(source["annotations"]))},z)
  self.assertEqual([x["id"] for x in a],[x["id"] for x in b])
  self.assertEqual(len(a),10)
  self.assertEqual(len({x["sha256"] for x in a}),10)
  self.assertGreaterEqual(sum(len(x["annotations"]) for x in a),10)
  self.assertEqual(sum(x["sourceSelectionStratum"]=="multi" for x in a)+
   sum(x["sourceSelectionStratum"]=="single" for x in a),10)
 def test_source_hash_exposure_quarantine_is_applied_before_model(self):
  source,z=self.fixture()
  a=self.run_selection(source,z)
  excluded={a[0]["sha256"]}
  result=self.run_selection(source,z,excluded)
  self.assertEqual(len(result),10)
  self.assertNotIn(a[0]["sha256"],{x["sha256"] for x in result})
 def test_bad_source_license_and_unlabelled_images_do_not_qualify(self):
  source,z=self.fixture(11)
  source["images"][0]["license"]=5
  source["annotations"]=[a for a in source["annotations"] if a["image_id"]!=source["images"][1]["id"]]
  with self.assertRaisesRegex(RuntimeError,"cannot find 12"):
   self.run_selection(source,z)
 def test_source_selection_does_not_require_real_model_or_synthesize_human_truth(self):
  source,z=self.fixture()
  selected=self.run_selection(source,z)
  self.assertTrue(all(x["primaryColor"] is None and x["exactAppSubtype"] is None for x in selected))
  self.assertTrue(all("publisher human polygons only" in x["groundTruthProvenance"] for x in selected))
if __name__=="__main__":
 unittest.main()
