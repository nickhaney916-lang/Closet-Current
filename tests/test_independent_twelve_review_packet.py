import hashlib
import importlib.util
import json
import pathlib
import shutil
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
SCRIPT=ROOT/'scripts/stage-independent-twelve-mask-review.py'
spec=importlib.util.spec_from_file_location('twelve_mask_packet',SCRIPT)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
sha=lambda b:hashlib.sha256(b).hexdigest()

class IndependentTwelvePacketTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.path=ROOT/'artifacts/independent-mask-review-unit'
        mod.stage('artifacts/independent-mask-review-unit')
        cls.blind=json.loads((cls.path/'BLIND-FIRST-SOURCES.json').read_text())
        cls.status=json.loads((cls.path/'REVIEW-STATUS.json').read_text())

    def test_exact_source_bytes_and_no invented reviewer_or_reference(self):
        self.assertEqual(len(self.blind['sourceOriginals']),12)
        self.assertEqual(self.status['actualLicensedOriginalHashesVerified'],12)
        self.assertEqual(self.status['humanReviewerOneCompleted'],0)
        self.assertEqual(self.status['humanReviewerTwoApproved'],0)
        self.assertEqual(self.status['independentlyReviewedFullSizeReferenceMasks'],0)
        self.assertEqual(self.status['evaluatedRealMaskQualityPasses'],0)
        self.assertFalse(self.status['productionAuthorized'])
        self.assertFalse(self.status['independentRightsApproval'])
        self.assertFalse(self.status['currentEditorOutputsExactOriginalGrid'])
        self.assertEqual(self.blind['modelPredictionsIncluded'],0)
        self.assertEqual(self.blind['manifestCategoryLabelsIncluded'],0)
        for photo in self.blind['sourceOriginals']:
            raw=(self.path/photo['sourceRelativePath']).read_bytes()
            baseline=(ROOT/'benchmark/fixtures'/photo['image']).read_bytes()
            self.assertEqual(raw,baseline)
            self.assertEqual(sha(raw),photo['sourceSha256'])
            self.assertIsNone(photo['approvedReferenceMask'])

    def test_reviewers_are_separate_and_blind_packet_does_not_seed_labels(self):
        first=(self.path/'FIRST-REVIEW.html').read_text()
        second=(self.path/'SECOND-REVIEW.html').read_text()
        self.assertEqual(first.count('<article>'),12)
        self.assertEqual(second.count('<article>'),12)
        self.assertIn('FIRST-ANNOTATE.html',first)
        self.assertIn('SECOND-APPROVE.html',second)
        self.assertIn('768 px',first)
        self.assertNotIn('candidate.png',first)
        for row in json.loads((ROOT/'benchmark/local-fitting-real-photo-manifest.json').read_text())['cases']:
            self.assertNotIn(row['sourceInspection'],first)
        self.assertNotIn('primaryColor',first)
        self.assertNotIn('visibleFeatures',first)
        self.assertNotIn('expectedDisposition',first)
        self.assertIn('originals/',first)
        self.assertIn('independently',second.lower())
        for path,original in [('FIRST-ANNOTATE.html','benchmark/annotate-garment.html'),
                               ('SECOND-APPROVE.html','benchmark/approve-garment-mask.html')]:
            self.assertEqual((self.path/path).read_bytes(),(ROOT/original).read_bytes())

    def test_no_untracked_or_outside_artifacts_staging(self):
        with self.assertRaises(ValueError):
            mod.stage('../outside-review-packet')
        with self.assertRaises(ValueError):
            mod.stage('benchmark/fixtures')

if __name__=='__main__':
    unittest.main()
