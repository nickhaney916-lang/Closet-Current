import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateClippingAcceptance,clippingPolicy}
 from '../benchmark/clipping-acceptance.mjs';
const sha='a'.repeat(64);
const encode=(bits,width=12,height=12)=>{
 const runs=[];let prev=0,n=0;
 for(const bit of bits){if(bit!==prev){runs.push(n);n=0;prev=bit;}n++;}
 runs.push(n);return {width,height,runs};
};
function rectangle(){
 const mask=new Uint8Array(144);
 for(let y=2;y<10;y++)for(let x=2;x<10;x++)mask[y*12+x]=1;
 return mask;
}
function scene(id,change='repair'){
 const image=id+'.jpg',entry={id,image,sourceSha256:sha,
  reviewStatus:'approved',referenceMask:'approved/'+id+'.json'};
 const truth=rectangle(),base=new Uint8Array(truth),after=new Uint8Array(truth);
 base[6*12+5]=0;
 if(change==='same')after.set(base);
 if(change==='leak')after[0]=1;
 if(change==='lost-lower')for(let x=3;x<9;x++)after[9*12+x]=0;
 if(change==='person-shadow')for(let y=0;y<2;y++)after[y*12+1]=1;
 const reference={schemaVersion:1,reviewStatus:'approved',reviewer:'Reviewer A',
  approvedBy:'Reviewer B',image,sourceSha256:sha,...encode(truth)};
 const baseline={image,sourceSha256:sha,...encode(base)};
 const candidate={image,sourceSha256:sha,...encode(after)};
 return {entry,evidence:{reference,baseline,candidate}};
}
function fixture(change='repair'){
 const ids=['commons-0035','commons-0049','commons-0053',
  'commons-0065','commons-0079','commons-0094'];
 const scenes=ids.map(id=>scene(id,change));
 return {manifest:{schemaVersion:1,cases:scenes.map(x=>x.entry)},
  evidence:new Map(scenes.map(x=>[x.entry.id,x.evidence]))};
}
test('six distinct approved real-photo-shaped fixtures admit only an experimental mobile review',()=>{
 const x=fixture();
 const result=evaluateClippingAcceptance(x.manifest,x.evidence);
 assert.equal(result.status,'eligible-for-independent-mobile-review');
 assert.equal(result.reviewedPassingPhotos,6);
 assert.equal(result.improvedPhotos,6);
 assert.equal(result.eligibleForIndependentMobileReview,true);
 assert.equal(result.productionAuthorized,false);
 assert.equal(result.actualPhoneClippingVerified,false);
 assert.ok(clippingPolicy.minimumBoundaryRecall>=0.98);
 assert.equal(result.cases[0].candidate.lowerBoundaryRecall,1);
});
test('unreviewed, unsigned and partial garment references block release',()=>{
 const x=fixture();x.manifest.cases[0].reviewStatus='pending';
 let result=evaluateClippingAcceptance(x.manifest,x.evidence);
 assert.equal(result.eligibleForIndependentMobileReview,false);
 assert.equal(result.reviewedPassingPhotos,5);
 assert.equal(result.cases[0].status,'blocked-unapproved-reference');
 const y=fixture();y.evidence.get('commons-0035').reference.approvedBy='Reviewer A';
 result=evaluateClippingAcceptance(y.manifest,y.evidence);
 assert.equal(result.cases[0].status,'blocked-invalid-source-or-annotation');
 const z=fixture();z.evidence.delete('commons-0094');
 assert.equal(evaluateClippingAcceptance(z.manifest,z.evidence).productionAuthorized,false);
});
test('additional background, source substitution, and lower edge loss reject a candidate',()=>{
 for(const problem of ['leak','lost-lower','person-shadow']){
  const x=fixture();
  x.evidence.set('commons-0094',scene('commons-0094',problem).evidence);
  const r=evaluateClippingAcceptance(x.manifest,x.evidence);
  assert.equal(r.eligibleForIndependentMobileReview,false,problem);
  assert.equal(r.cases.at(-1).status,'blocked-quality-regression',problem);
 }
 const s=fixture();s.evidence.get('commons-0094').candidate.sourceSha256='b'.repeat(64);
 assert.equal(evaluateClippingAcceptance(s.manifest,s.evidence).cases.at(-1).status,
  'blocked-invalid-source-or-annotation');
});
test('even six safe unchanged outputs cannot count as demonstrated improvement',()=>{
 const x=fixture('same'),result=evaluateClippingAcceptance(x.manifest,x.evidence);
 assert.equal(result.reviewedPassingPhotos,6);
 assert.equal(result.improvedPhotos,0);
 assert.equal(result.eligibleForIndependentMobileReview,false);
});
test('insufficient cases and repeated IDs never satisfy the reviewed benchmark',()=>{
 const x=fixture();x.manifest.cases.pop();
 assert.equal(evaluateClippingAcceptance(x.manifest,x.evidence).eligibleForIndependentMobileReview,false);
 const y=fixture();y.manifest.cases.push(y.manifest.cases[0]);
 assert.throws(()=>evaluateClippingAcceptance(y.manifest,y.evidence),/repeated/);
});
