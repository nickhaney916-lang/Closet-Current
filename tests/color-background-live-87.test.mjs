import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessCropBackdropRisk85} from '../research/crop-background-color-safety-85/color-safety.mjs';
import photoColor from '../public/photo-color.js';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('COLOR87 native app still withholds background-dominated pixel advice and requires explicit human confirmed color',()=>{
 const src=file('research/multi-garment-capture-01/review-ui.mjs');
 assert.match(src,/backdropRisk85\?\.unsafeToSuggestColor\?null:boundedCropColor46/);
 assert.match(src,/!result\.color&&!backdropRisk85\?\.unsafeToSuggestColor&&typeof window\.checkPhoto/);
 assert.match(src,/dataset\.colorRisk85='review-required'/);
 assert.match(src,/p\.color=v\.trim\(\);p\.confirmed=false/);
});
test('COLOR87 synthetic classifier cannot claim real-model inference or certify a suggestion',()=>{
 const mock=file('research/color-background-live-ui-87/classifier-fixture.js');
 assert.match(mock,/TEST FIXTURE ONLY/);
 assert.match(mock,/if\(!isDetection&&!isClassifier\)return new NativeWorker/);
 assert.match(mock,/strong:false,categoryConfirmed:false/);
 assert.match(mock,/choices:\[\],details:\{\}/);
 assert.doesNotMatch(mock,/fetch\(|importScripts\(/);
});
test('COLOR87 live-browser harness checks actual original source bytes and private human-only saves',()=>{
 const s=file('scripts/test-color-background-live-87-browser.mjs');
 for(const phrase of ['#outfitUpload','Whole photo','Save crop',
  'Suggest category, type and color','data-color-risk85',
  'data-color-review46','sourceSHA256','originalPhoto.image',
  "colorSource,'user'","ownerId,'multi24-A'","login(page,'multi24-B')"])
  assert.ok(s.includes(phrase),'Missing native evidence: '+phrase);
 assert.match(s,/independentHumanColorLabels:false/);
 assert.match(s,/actualModelExecuted:false/);
 assert.match(s,/model workers are QA mocks|Local model workers are QA mocks/);
});
test('COLOR87 conservative background conflict only suppresses dangerously misleading colors',()=>{
 const p=new Uint8ClampedArray(48*48*4);
 for(let y=0;y<48;y++)for(let x=0;x<48;x++){
  const a=x<11||x>=37||y<11||y>=37?[255,255,255]:[19,39,218];
  p.set([...a,255],4*(y*48+x));
 }
 assert.equal(photoColor.maskedPalette(p,48,48).primary,'White');
 assert.equal(assessCropBackdropRisk85(p,48,48,photoColor.family).unsafeToSuggestColor,true);
 for(let i=0;i<p.length;i+=4)p.set([19,39,218,255],i);
 assert.equal(assessCropBackdropRisk85(p,48,48,photoColor.family).unsafeToSuggestColor,false);
});
