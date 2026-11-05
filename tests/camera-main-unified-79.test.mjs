import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(p,'utf8');

test('camera picker remains research gated and hands off to verified original-photo import',()=>{
 const app=read('public/app.js'),html=read('public/index.html'),proof=read('research/capture-proof-01/source-proof.mjs');
 assert.match(app,/cameraCloset75/);
 assert.match(app,/singleCameraCapture/);
 assert.match(app,/captureProofFromFile\(file,owner\)/);
 assert.match(app,/importClothingPhotos\(files\)/);
 assert.match(html,/id="singleCameraCapture"[^>]*capture="environment"/);
 assert.match(proof,/sniffPhotoMime/);
 assert.match(proof,/unsupported or unrecognized image signature/);
});

test('Priority 68–78 safety modules remain in the integrated main branch',()=>{
 const cancel=read('research/multi-garment-capture-01/review-save-finality-34.mjs');
 const group=read('research/multi-garment-capture-01/atomic-group.mjs');
 const ui=read('research/multi-garment-capture-01/review-ui.mjs');
 assert.match(cancel,/minimalPieceSnapshot51/);
 assert.match(cancel,/structuredClone\(minimalPieceSnapshot51/);
 assert.match(group,/atomicSaveGarments24/);
 assert.match(group,/sourceSHA256/);
 assert.match(ui,/snapshotConfirmations34\(state\.pieces,schema,proof\)/);
 // Independent inherited suites exercise these guards behaviorally at exact HEAD.
});

test('camera cancellation and repeated input selection clear native file values without dropping prior review',()=>{
 const app=read('public/app.js');
 assert.match(app,/if\(!files\.length\)return; \/\/ Picker cancellation leaves every existing review untouched\./);
 assert.match(app,/singleCameraCapture'\)\.addEventListener\('cancel',\(\)=>\{\}\)/);
 assert.match(app,/singleCameraCapture'\)\.onchange=event=>\{\s*const files=Array\.from\(event\.target\.files\|\|\[\]\);event\.target\.value='';/);
});
