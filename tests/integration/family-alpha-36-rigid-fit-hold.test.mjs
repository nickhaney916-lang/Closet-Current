import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {adjustReviewedGarmentGeometry,FIT_LIMITS}
 from '../../research/family-alpha-36/manual-fit.mjs';
import {assert36HOLD,OUTPUT}
 from '../../scripts/build-family-alpha-36-rigid-fit-hold.mjs';
const base={x:.5,y:.4,width:.5,height:.35};
test('manual shirt neck/shoulder adjustment translates genuine photo without stretch',()=>{
 const original={...base};
 const result=adjustReviewedGarmentGeometry(base,{dx:-.024,dy:-.045,scale:1.12});
 assert.equal(result.x,.476);assert.equal(result.y,.355);
 assert.ok(Math.abs(result.width/result.height-base.width/base.height)<1e-12);
 assert.equal(result.sourcePixelsResampled,false);
 assert.deepEqual(base,original);
});
test('waist / dress / trousers remain within 3:5 frame and cannot be excessively scaled',()=>{
 assert.ok(adjustReviewedGarmentGeometry({x:.5,y:.49,width:.66,height:.65},{dy:.03}).height>.6);
 for(const change of [
  {dx:.10},{dy:-.11},{scale:1.5},{scale:.5},{scale:NaN},{dx:Infinity},{dy:NaN}
 ])assert.throws(()=>adjustReviewedGarmentGeometry(base,change),/Invalid/);
 for(const b of [
  {x:.5,y:.5,width:.99,height:.8},
  {x:.1,y:.5,width:.5,height:.7},
  {x:.5,y:.11,width:.65,height:.6}
 ])assert.throws(()=>adjustReviewedGarmentGeometry(b,{scale:1.15}),/clipped/);
 assert.equal(FIT_LIMITS.maxScale,1.22);
});
test('source and all Work 35 original-JPEG, atomic-save, footwear and visual privacy gates remain exact',async()=>{
 const m=await assert36HOLD();
 assert.equal(m.releaseGate,'HOLD');assert.equal(m.rigidFitOnly,true);
 assert.equal(m.manualAdjustmentsPersisted,false);
 assert.equal(m.footwearReferenceCannotBeAdjusted,true);
 assert.equal(m.realFamilyAccountIsolationVerified,false);
 assert.equal(m.ownerVisualApproved,false);
 const boot=await readFile(OUTPUT+'/__alpha_research/family-alpha-29/boot.js','utf8');
 assert.match(boot,/mountManualGarmentAlignment/);
 assert.match(boot,/confirmReviewedCutoutWithEraser/);
 assert.match(boot,/guard\(\);return !abort\.signal\.aborted/);
});
test('deceptive real fitting, persistent fit or staging flags are hard rejected',async()=>{
 const path=OUTPUT+'/alpha36-rigid-align-HOLD-manifest.json';
 const original=await readFile(path,'utf8');
 try{
  for(const [field,val] of [
   ['releaseGate','READY'],['manualAdjustmentsPersisted',true],
   ['realFamilyAccountIsolationVerified',true],['phoneFitValidated',true],
   ['ownerVisualApproved',true],['deployAuthorized',true],['noSourcePixelEdits',false]
  ]){
   const changed=JSON.parse(original);changed[field]=val;
   await writeFile(path,JSON.stringify(changed));
   await assert.rejects(()=>assert36HOLD());
  }
 }finally{await writeFile(path,original);}
 await assert36HOLD();
});
