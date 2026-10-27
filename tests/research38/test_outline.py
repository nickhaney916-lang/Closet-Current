import hashlib, importlib.util, json, tempfile, unittest
from pathlib import Path
from PIL import Image, ImageOps
spec=importlib.util.spec_from_file_location('outline','research/family-alpha-38/outline.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
SOURCE=Path('benchmark/fixtures/commons-0043.jpg')
META=json.loads(Path('research/family-alpha-38/skirt-outline.json').read_text())
class OutlineTest(unittest.TestCase):
 def test_original_rgb_and_alpha(self):
  before=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
  with tempfile.TemporaryDirectory() as d:
   dest=Path(d)/'out.png';report=module.build(SOURCE,META,dest)
   with Image.open(dest) as result, Image.open(SOURCE) as im:
    original=ImageOps.exif_transpose(im).convert('RGB')
    self.assertEqual(result.size,original.size)
    self.assertEqual(result.convert('RGB').tobytes(),original.tobytes())
    alpha=result.getchannel('A');self.assertEqual(alpha.getextrema(),(0,255))
    self.assertEqual(alpha.getpixel((0,0)),0)
    self.assertEqual(alpha.getpixel((result.width//2,result.height//2)),255)
   self.assertEqual(report['status'],'PROVISIONAL — visual review required')
   with self.assertRaises(ValueError):module.build(SOURCE,META,dest)
  self.assertEqual(hashlib.sha256(SOURCE.read_bytes()).hexdigest(),before)
 def test_unbound_or_bad_polygon_rejected(self):
  with tempfile.TemporaryDirectory() as d:
   for metadata in [{**META,'source_sha256':'0'*64},{**META,'polygon':[[0,0],[1,1]]},{**META,'polygon':[[0,0],[1,1],[2,0]]}]:
    with self.assertRaises(ValueError):module.build(SOURCE,metadata,Path(d)/'out.png')
if __name__=='__main__':unittest.main()
