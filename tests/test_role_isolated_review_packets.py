"""Role-separated human review delivery with real SHA-locked originals.

These tests verify archive integrity and model-blind separation, NOT actual
two-person annotations, licenses, physical phones or mask accuracy.
"""
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
P = ROOT / "scripts/build-role-isolated-review-packets.py"
spec = importlib.util.spec_from_file_location("role_packets", P)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
sha = lambda x: hashlib.sha256(x).hexdigest()


class RolePacketTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import sys
        stage_path = ROOT / "scripts/stage-independent-twelve-mask-review.py"
        stage_spec = importlib.util.spec_from_file_location("offline_packet_builder", stage_path)
        stage = importlib.util.module_from_spec(stage_spec)
        stage_spec.loader.exec_module(stage)
        cls.work = ROOT / "artifacts/role-package-unit"
        cls.source = cls.work / "original-review-packet"
        cls.out = cls.work / "roles"
        # Source bytes remain unchanged. CI generates only internal fixtures.
        stage.stage(str(cls.source.relative_to(ROOT)))
        cls.record = module.build(str(cls.source), str(cls.out))

    def test_first_and_second_archives_are_separate_with_identical_original_jpegs(self):
        self.assertEqual(self.record["sourceOriginalsVerified"], 12)
        self.assertFalse(self.record["productionAuthorized"])
        self.assertFalse(self.record["realPhotoMaskAccuracyMeasured"])
        self.assertEqual(self.record["referenceMasksAuthenticated"], 0)
        archives = self.record["archives"]
        self.assertEqual(len(archives), 2)
        first_path, second_path = [self.out / a["filename"] for a in archives]
        with ZipFile(first_path) as first, ZipFile(second_path) as second:
            self.assertEqual(first.testzip(), None)
            self.assertEqual(second.testzip(), None)
            names1, names2 = set(first.namelist()), set(second.namelist())
            self.assertIn("FIRST-REVIEW.html", names1)
            self.assertIn("FIRST-ANNOTATE.html", names1)
            self.assertIn("BLIND-FIRST-SOURCES.json", names1)
            self.assertNotIn("SECOND-REVIEW.html", names1)
            self.assertNotIn("SECOND-APPROVE.html", names1)
            self.assertNotIn("RIGHTS-AUDIT.json", names1)
            self.assertIn("SECOND-APPROVE.html", names2)
            self.assertIn("SECOND-REVIEW.html", names2)
            self.assertIn("RIGHTS-AUDIT.json", names2)
            self.assertNotIn("FIRST-REVIEW.html", names2)
            self.assertNotIn("FIRST-ANNOTATE.html", names2)
            self.assertNotIn("BLIND-FIRST-SOURCES.json", names2)
            originals = sorted(x for x in names1 if x.startswith("originals/"))
            self.assertEqual(len(originals), 12)
            self.assertEqual(originals, sorted(x for x in names2 if x.startswith("originals/")))
            for name in originals:
                raw = (ROOT / "benchmark/fixtures" / name.split("/")[1]).read_bytes()
                self.assertEqual(first.read(name), raw)
                self.assertEqual(second.read(name), raw)
                self.assertEqual(sha(raw), next(x["sourceSha256"] for x in
                    json.loads(first.read("BLIND-FIRST-SOURCES.json"))["sourceOriginals"]
                    if x["sourceRelativePath"] == name))
            for z in [first, second]:
                manifest = json.loads(z.read("PACKAGE-MANIFEST.json"))
                self.assertEqual(manifest["humanAnnotationsPresent"], 0)
                self.assertFalse(manifest["commercialRightsApproved"])
                self.assertEqual(manifest["originalPhotos"], 12)
                for name, digest in manifest["files"].items():
                    self.assertEqual(sha(z.read(name)), digest)
            assert all(not name.endswith(".mask.approved.json") for name in names1 | names2)

    def test_blind_review_keeps_risk_notes_and_reference_data_out_of_all_first_role_files(self):
        with ZipFile(self.out / "first-human-originals.zip") as packet:
            first = packet.read("FIRST-REVIEW.html").decode()
            manifest = json.loads(packet.read("BLIND-FIRST-SOURCES.json"))
            self.assertEqual(manifest["modelPredictionsIncluded"], 0)
            self.assertEqual(manifest["manifestCategoryLabelsIncluded"], 0)
            for record in manifest["sourceOriginals"]:
                self.assertEqual(record["firstReviewState"], "not-started")
                self.assertIsNone(record["approvedReferenceMask"])
                for forbidden in ("category", "visibleFeatures", "expectedDisposition", "sourceInspection"):
                    self.assertNotIn(forbidden, record)
            for row in json.loads((ROOT / "benchmark/local-fitting-real-photo-manifest.json").read_text())["cases"]:
                self.assertNotIn(row["sourceInspection"], first)
            self.assertIn('href="FIRST-ANNOTATE.html"', first)
            self.assertNotIn("SECOND-REVIEW.html", first)
            self.assertNotIn("SECOND-APPROVE.html", first)
            self.assertEqual(first.count("<article>"), 12)

    def test_zip_hash_manifest_is_stable_and_packet_files_are_append_only(self):
        for info in self.record["archives"]:
            file = self.out / info["filename"]
            self.assertEqual(sha(file.read_bytes()), info["sha256"])
        with self.assertRaisesRegex(ValueError, "Existing review package"):
            module.build(str(self.source), str(self.out))
        # Reproducible archives can be independently verified at any time.
        other = self.work / "another-output"
        second = module.build(str(self.source), str(other))
        self.assertEqual([x["sha256"] for x in self.record["archives"]],
                         [x["sha256"] for x in second["archives"]])
        self.assertEqual(json.loads((self.out / "ROLE-DELIVERY-MANIFEST.json").read_text()),
                         self.record)

    def test_unknown_original_digest_fails_before_any_packet_is_sent(self):
        wrong = self.work / "damaged"
        wrong.mkdir(exist_ok=True)
        # Copy only tiny JSON and the pointer to a damaged image, while keeping
        # every other file a proper standalone copy.
        from shutil import copytree
        clone = wrong / "source"
        copytree(self.source, clone)
        jpeg = clone / "originals/commons-0001.jpg"
        img = jpeg.read_bytes()
        jpeg.write_bytes(img[:-16] + b"0" * 16)
        dest = self.work / "untrusted-output"
        with self.assertRaisesRegex(ValueError, "Original image bytes changed"):
            module.build(str(clone), str(dest))
        self.assertFalse((dest / "first-human-originals.zip").exists())

if __name__ == "__main__":
    unittest.main()
