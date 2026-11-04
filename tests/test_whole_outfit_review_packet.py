"""Synthetic-only provenance tests. No genuine human annotations are fabricated."""
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from PIL import Image
from whole_outfit_review_packet import make_complete_review_packet

class FullPhotoReviewHandoffTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name)
        self.photos=self.root/"photos"
        self.photos.mkdir()
        self.review=self.root/"packet"
        self.rows=[]
        for i,id in enumerate(("commons-0035","validation-0031"),1):
            photo=self.photos/(id+".jpg")
            Image.new("RGB",(16+i,15+i),(i*30,40,60)).save(photo,format="JPEG")
            h=hashlib.sha256(photo.read_bytes()).hexdigest()
            proposal=id+"-candidate-01"
            self.rows.append(dict(id=id,image=id+".jpg",sourceSha256=h,
                reviewFirst=i==2,exactOriginalIncludedForReview=True,
                allMasksUnapproved=True,userPhotoModified=False,
                attribution=dict(title="Synthetic test image",author="Unit Test",
                   license="CC BY-SA 4.0",
                   licenseUrl="https://creativecommons.org/licenses/by-sa/4.0/",
                   source="https://commons.wikimedia.org/wiki/File:Example.jpg"),
                candidateSeeds=[dict(id=proposal,
                    prediction="independent-outline-review/model-seeds/"+
                       proposal+".prediction.json",
                    referenceStatus="pending-human-annotation",
                    approvedReference=None)]))

    def run_packet(self,rows=None):
        return make_complete_review_packet(self.review,self.photos,
                self.rows if rows is None else rows,expected_count=2)

    def test_all_exact_originals_and_priority_queue_included(self):
        r=self.run_packet()
        self.assertEqual(r["sourcePhotoCount"],2)
        self.assertEqual(r["verifiedOriginalCount"],2)
        self.assertEqual(r["reviewPrioritySourceCount"],1)
        self.assertEqual(r["independentlyApprovedGarmentMasks"],0)
        self.assertFalse(r["canAutoSaveOrPromote"])
        self.assertIsNone(r["measuredPhysicalGarmentAccuracy"])
        for row in self.rows:
            original=self.review/"original-photos"/row["image"]
            self.assertEqual(original.read_bytes(),(self.photos/row["image"]).read_bytes())
            self.assertEqual(hashlib.sha256(original.read_bytes()).hexdigest(),
                             row["sourceSha256"])
        html=(self.review/"REVIEW-QUEUE.html").read_text()
        self.assertIn("First reviewer",html)
        self.assertIn("without opening ai proposals",html.lower())
        self.assertIn("commons-0035.jpg",html)
        self.assertIn("license terms",html)
        self.assertIn("Unit Test",html)
        self.assertIn("validation-0031.jpg",html)
        self.assertLess(html.index("validation-0031 · review first"),
                        html.index("commons-0035</h2>"))
        self.assertNotIn('reviewStatus":"approved"',html)

    def test_wrong_hash_rejects_all_before_any_output(self):
        r=[dict(x) for x in self.rows]
        r[1]["sourceSha256"]="f"*64
        with self.assertRaisesRegex(ValueError,"SHA-256 mismatch"):
            self.run_packet(r)
        self.assertFalse((self.review/"original-photos").exists())

    def test_missing_source_not_treated_as_empty_photo(self):
        (self.photos/"validation-0031.jpg").unlink()
        with self.assertRaisesRegex(ValueError,"Missing unchanged original"):
            self.run_packet()
        self.assertFalse((self.review/"original-photos").exists())

    def test_rejects_duplicate_missing_and_tampered_review_entries(self):
        invalid=[
         self.rows[:1],
         [self.rows[0],self.rows[0]],
         [{**self.rows[0],"image":"../bad.jpg"},self.rows[1]],
         [{**self.rows[0],"id":"../../commons-0035"},self.rows[1]],
         [{**self.rows[0],"allMasksUnapproved":False},self.rows[1]],
         [{**self.rows[0],"attribution":{**self.rows[0]["attribution"],
             "source":"javascript:unsafe()"}},self.rows[1]],
         [{**self.rows[0],"exactOriginalIncludedForReview":False},self.rows[1]],
         [{**self.rows[0],"candidateSeeds":[{
             **self.rows[0]["candidateSeeds"][0],"approvedReference":"fake"
         }]},self.rows[1]]
        ]
        for rows in invalid:
            with self.subTest(rows=repr(rows)[:100]):
                with self.assertRaises(ValueError):
                    self.run_packet(rows)
        self.assertFalse((self.review/"original-photos").exists())

    def test_disguised_non_jpeg_cannot_masquerade_as_original(self):
        data=b"this is not a JPEG"
        (self.photos/"commons-0035.jpg").write_bytes(data)
        rows=[dict(x) for x in self.rows]
        rows[0]["sourceSha256"]=hashlib.sha256(data).hexdigest()
        with self.assertRaisesRegex(ValueError,"not JPEG"):
            self.run_packet(rows)
        self.assertFalse((self.review/"original-photos").exists())

if __name__=="__main__":
    unittest.main()
