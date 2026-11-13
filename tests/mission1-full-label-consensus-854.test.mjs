import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../scripts/p79-synthetic-fixtures.mjs';
import { independentAgreement, verifyHumanReceipt } from '../scripts/p75-dataset-core.mjs';
import { reviewHandoff } from '../scripts/p79-workstation-core.mjs';
import { evaluateMission1Evidence } from '../scripts/m1-release-evidence-851.mjs';

// All receipts below are generated on the fly from synthetic PNG pixels and
// ephemeral Ed25519 TEST keys. They are NOT real human annotations or vetted
// reviewer identities and never qualify as independent recognition evidence.
function garment(f) {
  return {
    ...f.label,
    presence:'single-garment',category:'Tops',subtype:'T-shirt',
    primaryColor:'Blue',instanceCount:1,wardrobeUnit:'single-unit',
    instances:[{id:'shirt_1',box:[0.1,0.12,0.5,0.72],
      maskSha256:null,clipped:false,occluded:false}],
    quality:{lighting:'ok',focus:'ok',framing:'ok',background:'ok'}
  };
}
test('P854 accepts structural consensus of exact SAME signed synthetic label regardless of JSON key ordering', async()=>{
 const f=await fixture();
 try {
  const s=f.bundle.sources[0].source,l=garment(f);
  const reordered=Object.fromEntries(Object.entries(l).reverse());
  const a=f.receipt(0,l),b=f.receipt(1,reordered);
  assert.deepEqual(verifyHumanReceipt(s,a,f.bundle.registry,f.bundle.approvedFingerprint),[]);
  assert.deepEqual(verifyHumanReceipt(s,b,f.bundle.registry,f.bundle.approvedFingerprint),[]);
  const x=independentAgreement(s,[a,b],f.bundle.registry,f.bundle.approvedFingerprint);
  assert.equal(x.eligible,true);
  assert.deepEqual(x.agreement,{equal:12,total:12,ratio:1});
  assert.equal(reviewHandoff(s,[a,b],f.bundle.registry,f.bundle.approvedFingerprint).status,'READY FOR P75 CUSTODIAN AUDIT');
 }finally{await f.cleanup();}
});
test('P854 requires full label consensus: changed box, mask, region, cast, quality or extensions BLOCKED', async()=>{
 const f=await fixture();
 try{
  const s=f.bundle.sources[0].source,l=garment(f);
  const variations=[
   {name:'bounding box',next:{...l,instances:[{...l.instances[0],box:[0.11,0.12,0.5,0.72]}]},field:'instances'},
   {name:'region identity',next:{...l,instances:[{...l.instances[0],id:'shirt_2'}]},field:'instances'},
   {name:'clipped cuff',next:{...l,instances:[{...l.instances[0],clipped:true}]},field:'instances'},
   {name:'occluded sleeve',next:{...l,instances:[{...l.instances[0],occluded:true}]},field:'instances'},
   {name:'synthetic mask digest',next:{...l,instances:[{...l.instances[0],maskSha256:'a'.repeat(64)}]},field:'instances'},
   {name:'color cast',next:{...l,colorCast:true},field:'colorCast'},
   {name:'lighting',next:{...l,quality:{...l.quality,lighting:'dim'}},field:'quality'},
   {name:'framing',next:{...l,quality:{...l.quality,framing:'clipped'}},field:'quality'},
   {name:'region observations',next:{...l,instances:[{...l.instances[0],observed:{category:'Tops',subtype:'T-shirt',primaryColor:'Blue',secondaryColor:'Unknown'}}]},field:'instances'},
   {name:'unrecognized signed extension',next:{...l,newUnreviewedField:'different'},field:'complete signed label'}
  ];
  for(const v of variations){
   const a=f.receipt(0,l),b=f.receipt(1,v.next);
   assert.deepEqual(verifyHumanReceipt(s,b,f.bundle.registry,f.bundle.approvedFingerprint),[],v.name);
   const x=independentAgreement(s,[a,b],f.bundle.registry,f.bundle.approvedFingerprint);
   assert.equal(x.eligible,false,v.name);
   assert.ok(x.issues.some(e=>e.includes('full-label disagreement')),v.name);
   assert.equal(x.agreement.total,12,v.name);
   assert.ok(x.agreement.equal<12,v.name);
   assert.ok(x.agreement.ratio<1,v.name);
   if(v.name!=='synthetic mask digest'&&v.name!=='unrecognized signed extension')
    assert.match(reviewHandoff(s,[a,b],f.bundle.registry,f.bundle.approvedFingerprint).status,/BLOCKED/,v.name);
  }
 }finally{await f.cleanup();}
});
test('P854 mismatched signed receipt cannot be counted as genuine blind evaluation evidence',async()=>{
 const f=await fixture();
 try{
  const source=f.bundle.sources[0].source,label=garment(f);
  const receipts=[f.receipt(0,label),f.receipt(1,{...label,quality:{...label.quality,focus:'soft'}})];
  const audit=independentAgreement(source,receipts,f.bundle.registry,f.bundle.approvedFingerprint);
  assert.equal(audit.eligible,false);
  const report=evaluateMission1Evidence(null);
  assert.equal(report.status,'BLOCKED');
  assert.equal(report.shouldLiftFamilyAlphaHold,false);
  assert.equal(report.countOfIndependentHumanBlindSources,0);
 }finally{await f.cleanup();}
});
