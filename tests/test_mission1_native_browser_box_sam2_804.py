"""P804 negative gates for actual native browser source-prompt to real SAM2 bridge.

The test arguments are synthetic fixtures, not actual independent human inputs.
Do not mistake a passing contract test for SAM2 accuracy or phone memory proof.
"""
import copy
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
spec=importlib.util.spec_from_file_location("m1p804",ROOT/"scripts/test-mission1-browser-box-sam2-804.py")
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class BrowserBoxReceiptContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        _,cls.digest,cls.attrib=mod.pinned_source()

    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.original_input=mod.INPUT
        mod.INPUT=Path(self.temp.name)/"browser-results.json"
        self.payload=self.fixture()

    def tearDown(self):
        mod.INPUT=self.original_input
        self.temp.cleanup()

    def fixture(self):
        src={
            "schema":mod.SCHEMA,"sourceId":"commons-0053",
            "sourceSHA256":self.digest,"originalWidth":320,"originalHeight":480,
            "originalPixelBox":[61,72,267,423],"originalPixelPositivePoint":[160,240],
            "actualOriginalGestureInNativeAdjust":True,
            "automatedPlaywrightFixture":True,
            "publisherPolygonNotUsedToConstructPrompt":True,
            "independentHumanDrawnBox":False,
            "ownerApprovedMask":False,"privateOwnerPhoto":False,
            "autoSaveAllowed":False
        }
        return {
            "researchOnly":True,"familyAlpha":"HOLD","releaseAuthorized":False,
            "scenarios":[{
                "browser":name,
                "sourcePromptForActualSAM2804":copy.deepcopy(src),
                "actualOriginalSourceOwnerBox800BrowserDrawn":True,
                "actualOriginalSourceOwnerPoint798ReviewedInNativeAdjust":True,
                "actualHumanGroundTruthIndependentlyVerified":False,
            } for name in ("chromium","webkit")]
        }

    def run_prompt_check(self):
        mod.INPUT.write_text(json.dumps(self.payload))
        return mod.read_actual_native_prompts(self.digest)

    def test_original_sha_pinned_and_two_browsers_source_coordinates(self):
        p=self.run_prompt_check()
        self.assertEqual(len(p),2)
        self.assertEqual(p[0]["box"],[61,72,267,423])
        self.assertEqual(p[1]["point"],[160,240])

    def test_cross_photo_hash_and_unverified_schema_rejected(self):
        for field,value in (("sourceSHA256","0"*64),("originalHeight",479),("schema","incorrect")):
            with self.subTest(field=field):
                self.payload=self.fixture()
                self.payload["scenarios"][0]["sourcePromptForActualSAM2804"][field]=value
                with self.assertRaisesRegex(ValueError,"original|dimensions"):
                    self.run_prompt_check()

    def test_oracle_or_human_claim_and_auto_approval_rejected(self):
        for key,val in (("publisherPolygonNotUsedToConstructPrompt",False),
                        ("independentHumanDrawnBox",True),
                        ("ownerApprovedMask",True),
                        ("privateOwnerPhoto",True),
                        ("autoSaveAllowed",True)):
            with self.subTest(key=key):
                self.payload=self.fixture()
                self.payload["scenarios"][1]["sourcePromptForActualSAM2804"][key]=val
                with self.assertRaisesRegex(ValueError,"honest"):
                    self.run_prompt_check()

    def test_off_box_seed_bad_coordinates_and_missing_browser_rejected(self):
        self.payload["scenarios"][0]["sourcePromptForActualSAM2804"]["originalPixelPositivePoint"]=[0,0]
        with self.assertRaisesRegex(ValueError,"rectangle"):
            self.run_prompt_check()
        self.payload=self.fixture()
        self.payload["scenarios"][1]["browser"]="chromium"
        with self.assertRaisesRegex(ValueError,"BOTH"):
            self.run_prompt_check()

    def test_photo_rights_and_original_bytes_not_ignored(self):
        src=ROOT/"benchmark/locked-photo-sources.json"
        catalog=json.loads(src.read_text())
        entry=next(x for x in catalog if x["id"]=="commons-0053")
        self.assertEqual(entry["sha256"],self.digest)
        self.assertEqual(entry["attribution"]["license"],"CC BY 4.0")
        self.assertEqual(self.attrib["source"],entry["attribution"]["source"])

if __name__=="__main__":unittest.main(verbosity=2)
