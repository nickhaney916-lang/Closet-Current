import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {sha,sampling,evaluateProductionFigures} from '../benchmark/figure-readiness/production-figure-metrics.mjs';

const require=createRequire(import.meta.url);
const figure=require('../public/reusable-figure-engine.js');
const geometry=require('../public/garment-fit-geometry.js');
const policy=JSON.parse(fs.readFileSync('benchmark/figure-readiness/production-policy.json','utf8'));
const evidence=JSON.parse(fs.readFileSync('benchmark/figure-readiness/production-evidence.json','utf8'));

test('both current actual model assets match pinned Work bytes and still fail production readiness',()=>{
 assert.deepEqual(Object.keys(figure.FIGURES).sort(),['female','male']);
 const observations=evidence.figures.map(f=>{
  const stored='public/'+figure.FIGURES[f.id];
  assert.equal(stored,f.previewPath);
  assert.equal(sha(fs.readFileSync(stored)),f.previewSha256);
  return {id:f.id,preview:{sha256:f.previewSha256,width:160,height:297},master:null};
 });
 const result=evaluateProductionFigures(policy,evidence,observations);
 assert.equal(result.status,'blocked');assert.equal(result.productionAuthorized,false);
 assert.equal(result.figures.filter(f=>f.ready).length,0);
 for(const f of result.figures){
  assert.ok(f.blockers.includes('full-resolution-master-missing'));
  assert.ok(f.blockers.includes('exact-asset-rights-evidence-missing'));
  assert.ok(f.previewSampling.every(s=>!s.nativeSamplingSufficient));
 }
});

test('male/female fitting remains calibrated to Work canonical stage, not pixel-upscaled asset fiction',()=>{
 assert.deepEqual(policy.canonicalStage,{width:647,height:1199});
 for(const id of ['female','male']){
  for(const slot of ['top','bottom','layer','layer2','layer3']){
   const category=slot==='bottom'?'Bottoms':slot==='top'?'Tops':'Outerwear';
   const rect=figure.placementRect(slot,{category,itemType:'Jacket'},id);
   assert.ok(rect.width>0&&rect.height>0);
   const placement=geometry.fitPlacement(rect,120,180,{slot,category});
   assert.ok(placement,'the draft preview may remain usable for layering tests');
   assert.ok(placement.left>=rect.left&&placement.left+placement.width<=rect.left+rect.width+1e-8);
   assert.ok(placement.top>=rect.top&&placement.top+placement.height<=rect.top+rect.height+1e-8);
   assert.equal(placement.sourcePixelsChanged,false);
   assert.equal(placement.fitVerified,false);
  }
  const s=sampling(160,297,{cssWidth:270,dpr:3,cssZoom:1},policy.canonicalStage);
  assert.equal(s.nativeSamplingSufficient,false);
  assert.ok(s.linearUpscale>1);
 }
});

test('integrated UI never presents preview models as licensed high-res or switches to unapproved masters',()=>{
 const preview=fs.readFileSync('public/reusable-figure-preview.js','utf8');
 const page=fs.readFileSync('public/index.html','utf8');
 const css=fs.readFileSync('public/style.css','utf8');
 assert.match(page,/This first preview is a styling collage, not a realistic fitting or size prediction/);
 assert.ok(!/productionAuthorized|nativeResolutionVerified/.test(preview));
 assert.match(css,/aspect-ratio:647 \/ 1199/);
 assert.match(preview,/ClosetGarmentEdgeFinish\?\.finish/);
 assert.match(preview,/ClosetGarmentFitGeometry\?\.silhouetteAnchor/);
 assert.ok(!/ClosetSourceGuidedMask|ClosetDarkStudioMask/.test(preview));
 assert.ok(!/fetch\(|localStorage|indexedDB|sessionStorage/.test(preview));
});
