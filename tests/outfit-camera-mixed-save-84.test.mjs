import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('CAMERA84 actual rear camera input and saved-photo input share verified multi garment source handler',()=>{
 const html=read('public/index.html');
 const review=read('research/multi-garment-capture-01/review-ui.mjs');
 assert.match(html,/id="outfitCamera"[^>]*type="file"[^>]*accept="image\/\*"[^>]*capture="environment"/);
 assert.match(html,/id="outfitUpload"[^>]*type="file"/);
 assert.match(review,/const handle=event=>\{const file=event\.target\.files\?\.\[0\];event\.target\.value='';if\(file\)startFile\(file\);\}/);
 assert.match(review,/for\(const id of \['outfitCamera','outfitUpload'\]\)/);
 assert.match(review,/const proof=await makeProof\(file,owner\)/);
 assert.match(review,/keepHumanReviewOnSameSource72/);
 assert.match(review,/askMixedSavedConsent80/);
});

test('CAMERA84 native browser harness forces a real camera-source workflow and reports only measured proof',()=>{
 const s=read('scripts/test-multi-garment-capture-01-browser.mjs');
 assert.match(s,/const cameraMixed84=process\.env\.CAMERAMIXED84==='1'/);
 assert.match(s,/const mixed80=process\.env\.MIXED80==='1'\|\|cameraMixed84/);
 assert.match(s,/cameraMixed84\?'#outfitCamera':'#outfitUpload'/);
 assert.match(s,/native\.originalSHA256,sourceHash/);
 assert.match(s,/native\.pickerCleared,true/);
 assert.match(s,/dispatchEvent\('cancel'\)/);
 assert.match(s,/nativeOutfitCameraToMixedSave84:cameraMixed84/);
 assert.match(s,/Already-saved shirt row must remain byte-identical/);
});

test('CAMERA84 audit requires six original-JPEG browser cases and 78 independently hashed screenshots',()=>{
 const s=read('scripts/audit-outfit-camera-mixed-save-84-browser.mjs');
 assert.match(s,/report\.cases\.length,6/);
 assert.match(s,/report\.screenshots\.length,78/);
 assert.match(s,/c\.nativeOutfitCameraToMixedSave84,true/);
 assert.match(s,/02x-native-outfit-camera-cancel-preserves-reviewed-crops-all/);
 assert.match(s,/createHash\('sha256'\)/);
});
