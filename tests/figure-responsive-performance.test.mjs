import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {selectFigureAssetTier,WIDTHS} from '../benchmark/figure-creation/responsive-asset-policy.mjs';

test('smallest native figure asset covers screen DPI/zoom without accidental upscaling',()=>{
 const cases=[
  [270,1,1,'phone1x'],
  [270,2,1,'phone1x'],
  [270,3,1,'mobile'],
  [270,1,2,'phone1x'],
  [270,2,2,'tablet2x'],
  [270,3,2,'master'],
  [360,3,1,'tablet2x'],
  [360,3,2,'master',false]
 ];
 for(const [css,dpr,zoom,name,sufficient=true] of cases){
  const t=selectFigureAssetTier(css,dpr,zoom);
  assert.equal(t.name,name);assert.equal(t.nativeSamplingSufficient,sufficient);
  assert.equal(t.visualQualityOrRightsApproved,false);
  if(sufficient)assert.ok(t.width>=css*dpr*zoom);
  else assert.ok(t.width<css*dpr*zoom);
  assert.equal(t.width,(WIDTHS.find(x=>x.width>=css*dpr*zoom)||WIDTHS.at(-1)).width);
 }
});
test('quality gate refuses invalid device states and keeps master explicit for exceptionally high DPI',()=>{
 for(const args of [[0,1,1],[-1,1,1],[270,0,1],[270,5,1],
  [270,1,4],[NaN,2,1],[Infinity,1,1]]){
  assert.throws(()=>selectFigureAssetTier(...args));
 }
 const t=selectFigureAssetTier(1200,3,2);
 assert.equal(t.name,'master');
 assert.equal(t.nativeSamplingSufficient,false,'no invented native details from undersized masters');
});
test('responsive previews are a quality-verified candidate pipeline, not automatic deployment',()=>{
 const runner=fs.readFileSync('scripts/benchmark-created-figures.py','utf8');
 const mobile=fs.readFileSync('scripts/test-created-figure-browsers.mjs','utf8');
 const engine=fs.readFileSync('public/reusable-figure-engine.js','utf8');
 const service=fs.readFileSync('supabase/functions/ai-try-on/index.ts','utf8');
 assert.match(runner,/verify_lossless_visible_pixels/);
 assert.match(runner,/ImageChops\.difference/);
 assert.match(runner,/lossless=True,method=6/);
 assert.match(mobile,/selectFigureAssetTier/);
 assert.match(mobile,/nativeSamplingSelectedPassed:true/);
 assert.match(engine,/female-preview\.webp/);
 assert.match(engine,/male-preview\.webp/);
 assert.ok(!engine.includes('-tablet-1294.webp'), 'no silent promotion of unapproved assets');
 assert.match(service,/RESERVED_PAID_INFERENCE_APPROVED=false/);
 assert.match(service,/CHAINED_PAID_INFERENCE_APPROVED=false/);
});
