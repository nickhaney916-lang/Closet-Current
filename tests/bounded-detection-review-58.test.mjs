import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {intakeProposal58,MAX_AUTO_REGIONS58,MAX_TOTAL_REGIONS58,MAX_WORKER_PROPOSALS58} from '../research/multi-garment-capture-01/detection-intake-58.mjs';
const raw=(i=1)=>({
 instanceKey:'seg-'+i+'-100-100-700-700-1',
 cropBounds:{x:.2,y:.08,width:.4,height:.42},personDetected:true,
 colorEstimate:{color:'Blue'},
 hint:{categories:['Tops'],types:['T-shirt'],confidence:1,clipped:false}
});
test('BOUNDS58 first legitimate worker proposal is sanitized and still unverified',()=>{
 const candidate=raw();
 candidate.ownerId='secret';candidate.image='data:image/jpeg;base64,secret';
 candidate.hint.ownerId='secret';candidate.hint.fetchUrl='https://example.test/leak';
 const result=intakeProposal58(candidate,[],1);
 assert.equal(result.accepted,true);
 assert.deepEqual(Object.keys(result.piece).sort(),['colorEstimate','cropBounds','hint','instanceKey','personDetected']);
 assert.deepEqual(result.piece.hint,{categories:['Tops'],types:['T-shirt'],clipped:false,confidence:1});
 assert.equal(JSON.stringify(result.piece).includes('secret'),false);
 assert.equal(JSON.stringify(result.piece).includes('https:'),false);
 assert.equal(candidate.image,'data:image/jpeg;base64,secret','untrusted raw worker source not mutated');
});
test('BOUNDS58 caps auto proposals to 12 and preserves manual capacity up to 24',()=>{
 assert.equal(MAX_AUTO_REGIONS58,12);
 assert.equal(MAX_TOTAL_REGIONS58,24);
 const accepted=[];
 for(let i=1;i<=100;i++){
  const outcome=intakeProposal58(raw(i),accepted,i);
  if(outcome.accepted)accepted.push({...outcome.piece,manual:false});
 }
 assert.equal(accepted.length,12);
 assert.equal(intakeProposal58(raw(101),accepted,101).reason,'review-region-budget');
 const twelveManual=Array.from({length:12},(_,i)=>({instanceKey:'manual-'+i,manual:true}));
 assert.equal(intakeProposal58(raw(102),[...accepted,...twelveManual],102).accepted,false);
});
test('BOUNDS58 finite worker message ceiling prevents unbounded parse/crop work even when UI has space',()=>{
 assert.equal(MAX_WORKER_PROPOSALS58,128);
 assert.equal(intakeProposal58(raw(129),[],129).reason,'worker-message-budget');
 assert.equal(intakeProposal58(raw(3),[],Number.MAX_SAFE_INTEGER+1).reason,'worker-message-budget');
});
test('BOUNDS58 deduplicates exact segment identity but permits distinct overlapping same-category garments',()=>{
 const a=intakeProposal58(raw(1),[],1);
 assert.equal(a.accepted,true);
 const prior=[{...a.piece,manual:false}];
 assert.equal(intakeProposal58(raw(1),prior,2).reason,'invalid-or-duplicate-proposal');
 assert.equal(intakeProposal58(raw(2),prior,2).accepted,true,
  'Distinct same-class garments may overlap and must not be suppressed merely for bounding-box overlap');
});
test('BOUNDS58 rejects malformed, nonsensical and unsupported segments without trusting model confidence',()=>{
 const cases=[
  null,[],42,{...raw(),instanceKey:'seg-'+('1'.repeat(200))},
  {...raw(),instanceKey:'../owner'}, {...raw(),instanceKey:'seg-__proto__'},
  {...raw(),cropBounds:{x:Infinity,y:0,width:.5,height:.5}},
  {...raw(),cropBounds:{x:0,y:0,width:2,height:.5}},
  {...raw(),hint:{categories:['Untrusted']}},
  {...raw(),hint:{categories:'Tops'}},
  {...raw(),hint:{categories:[]}},
 ];
 for(const c of cases)assert.equal(intakeProposal58(c,[],1).accepted,false);
});
test('BOUNDS58 only bounded valid palette data and recognized taxonomy survive worker metadata',()=>{
 const c=raw(3);
 c.colorEstimate={color:'CUSTOM COLOR',photo:'secret'};
 c.hint={categories:['Tops','Untrusted','Tops'],types:['T-shirt','secret'],confidence:Infinity,
  clipped:'true',url:'https://example.invalid'};
 const r=intakeProposal58(c,[],1);
 assert.equal(r.accepted,true);
 assert.deepEqual(r.piece.colorEstimate,{color:''});
 assert.deepEqual(r.piece.hint,{categories:['Tops'],types:['T-shirt'],clipped:null,confidence:null});
});
test('BOUNDS58 native review handler caps worker messages before crop JPEG and preserves user fallback',()=>{
 const text=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 assert.match(text,/intakeProposal58\(data\.piece,state\?\.pieces\|\|\[\],next\.received\)/);
 assert.match(text,/if\(accepted\.accepted\)next\.pending\.push\(addDetected\(accepted\.piece,next\)\)/);
 assert.match(text,/state\.pieces\.length>=MAX_TOTAL_REGIONS58/);
 assert.match(text,/ignored for mobile reliability/);
 assert.match(text,/cropReviewed:false/);
 assert.match(text,/canConfirmScene32\(x,schema\)/);
 assert.match(text,/atomicSaveGarments24/);
});
