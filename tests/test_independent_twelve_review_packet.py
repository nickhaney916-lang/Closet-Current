import hashlib
import importlib.util
import json
import pathlib
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

    def test_exact_source_bytes_and_no_invented_reviewer_or_reference(self):
        self.assertEqual(len(self.blind['sourceOriginals']),12)
        self.assertEqual(self.status['actualLicensedOriginalHashesVerified'],12)
        self.assertEqual(self.status['humanReviewerOneCompleted'],0)
        self.assertEqual(self.status['humanReviewerTwoApproved'],0)
        self.assertEqual(self.status['independentlyReviewedFullSizeReferenceMasks'],0)
        self.assertEqual(self.status['evaluatedRealMaskQualityPasses'],0)
        self.assertFalse(self.status['productionAuthorized'])
        self.assertFalse(self.status['independentRightsApproval'])
        self.assertTrue(self.status['currentEditorOutputsExactOriginalGrid'])
        self.assertEqual(self.status['annotationEditorNativePixelLimit'],12000000)
        self.assertEqual(self.status['annotationEditorNativeSideLimit'],6000)
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
        self.assertIn('full photo pixel lattice',first)
        self.assertNotIn('candidate.png',first)
        for row in json.loads((ROOT/'benchmark/local-fitting-real-photo-manifest.json').read_text())['cases']:
            self.assertNotIn(row['sourceInspection'],first)
        self.assertNotIn('primaryColor',first)
        self.assertNotIn('visibleFeatures',first)
        self.assertNotIn('expectedDisposition',first)
        self.assertIn('originals/',first)
        self.assertIn('independent',second.lower())
        for path,original in [('FIRST-ANNOTATE.html','benchmark/annotate-garment-native.html'),
                               ('SECOND-APPROVE.html','benchmark/approve-garment-mask-native.html')]:
            self.assertEqual((self.path/path).read_bytes(),(ROOT/original).read_bytes())

    def test_native_pixel_review_supported_flags_match_full_original_dimensions(self):
        originals=self.blind['sourceOriginals']
        supported=sum(x['nativeGridReviewSupported'] for x in originals)
        self.assertEqual(self.status['nativeGridSupportedOriginals'],supported)
        self.assertEqual(self.status['nativeGridUnsupportedOriginals'],12-supported)
        for x in originals:
            should=(x['width']<=6000 and x['height']<=6000 and x['width']*x['height']<=12000000)
            self.assertEqual(x['nativeGridReviewSupported'],should)
            self.assertIsNone(x['approvedReferenceMask'])
        first=(self.path/'FIRST-ANNOTATE.html').read_text()
        second=(self.path/'SECOND-APPROVE.html').read_text()
        for code in [first,second]:
            self.assertIn('nativeSourceGrid',code)
            self.assertIn('MAX_NATIVE_GRID_PIXELS=12000000',code)
            self.assertIn("annotationGrid",code)
            self.assertNotIn('Math.min(1,768/',code)
            self.assertNotIn('Math.round(picture.naturalWidth*scale)',code)
        self.assertIn('if(!inventoryMode.checked)return false',first)
        self.assertIn('data.physicalTargetId==null',second)

    def test_no_untracked_or_outside_artifacts_staging(self):
        with self.assertRaises(ValueError):
            mod.stage('../outside-review-packet')
        with self.assertRaises(ValueError):
            mod.stage('benchmark/fixtures')

if __name__=='__main__':
    unittest.main()
