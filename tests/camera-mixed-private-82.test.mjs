import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('CAMERA82 rear-phone photo input is source-gated and keeps canceled review intact',()=>{
 const html=code('public/index.html');
 const app=code('public/app.js');
 assert.match(html,/id="singleCameraCapture"[^>]*accept="image\/\*"[^>]*capture="environment"/);
 assert.match(app,/singleCameraCapture'\)\.onchange=event=>/);
 assert.match(app,/if\(!files\.length\)return;\s*\/\/ Picker cancellation/);
 assert.match(app,/mobileCameraToCloset75Active/);
 assert.match(app,/importClothingPhotos\(files\)/);
});

test('MIXED80 consent stays an explicit accessible in-app decision, never implicit',()=>{
 const review=code('research/multi-garment-capture-01/review-ui.mjs');
 assert.match(review,/function askMixedSavedConsent80\(/);
 assert.match(review,/multi24-mixed-dialog/);
 assert.match(review,/Review saved and new clothing/);
 assert.match(review,/Keep my review/);
 assert.match(review,/Save new garments only/);
 assert.match(review,/currentReview\(view,epoch\)/);
});

test('Both native browser suites target the source-verified private closet',()=>{
 const cam=code('scripts/test-camera-to-closet-79-browser.mjs');
 const mixed=code('scripts/test-multi-garment-capture-01-browser.mjs');
 assert.match(cam,/nativeCameraFixtureSHA/);
 assert.match(cam,/nativePickerCancelKeepsReview:true/);
 assert.match(cam,/realIndexedDB:true/);
 assert.match(mixed,/MIXED80/);
 assert.match(mixed,/mixedPreviouslySavedAndNew80:mixed80/);
 assert.match(mixed,/Already-saved shirt row must remain byte-identical/);
});
