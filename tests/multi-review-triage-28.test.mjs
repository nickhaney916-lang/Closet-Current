import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 TRIAGE28_MIN_CONFIDENCE,TRIAGE28_MIN_RELATIVE_BOX_AREA,
 reviewTier28,organizeReview28,rankFrozenProposal28
} from '../research/multi-garment-capture-01/review-triage-28.mjs';
import {scorePhoto} from '../research/multi-review-triage-28/frozen-scorer-16.mjs';

const box=(w,h,x=.1,y=.1)=>({x,y,width:w,height:h});
const p=(id,conf,w=.5,h=.3,extra={})=>({
 id,instanceKey:'seg-4-1-1-5-5-'+id,
 cropBounds:box(w,h),hint:{confidence:conf,categories:['Tops']},
 confirmed:false,category:'Uncategorized',color:'',...extra
});
test('conservative triage thresholds are explicitly exploratory and do not auto-confirm garments',()=>{
 assert.equal(TRIAGE28_MIN_CONFIDENCE,.925);
 assert.equal(TRIAGE28_MIN_RELATIVE_BOX_AREA,.08);
 assert.equal(reviewTier28(p('one',.925,.4,.2)),'priority');
 assert.equal(reviewTier28(p('small',1,.2,.2)),'additional');
 assert.equal(reviewTier28(p('uncertain',.9249,.6,.5)),'additional');
 assert.equal(reviewTier28(p('zero',0,.9,.9)),'additional');
});
test('proposal ordering is stable, lossless and never mutates source labels or categories',()=>{
 const inputs=[
  p('lower-confidence',.83),p('primary-one',.98),p('manual',undefined,.8,.8,{manual:true}),
  p('high-small',.99,.1,.1),p('primary-two',.93)
 ];
 const original=structuredClone(inputs),next=organizeReview28(inputs);
 assert.equal(next.total,5);
 assert.deepEqual(next.ordered.map(x=>x.id),[
  'primary-one','primary-two','manual','lower-confidence','high-small'
 ]);
 assert.deepEqual(next.priority.map(x=>x.id),['primary-one','primary-two']);
 assert.deepEqual(next.manual.map(x=>x.id),['manual']);
 assert.deepEqual(next.additional.map(x=>x.id),['lower-confidence','high-small']);
 assert.deepEqual(inputs,original);
 assert.equal(new Set(next.ordered).size,inputs.length);
 assert.ok(next.ordered.every(x=>x.confirmed===false&&x.category==='Uncategorized'&&x.color===''));
});
test('invalid area/score never gets priority; no synthetic confidence bypass',()=>{
 for(const invalid of [NaN,Infinity,-Infinity,'0.999',null,undefined,-1,1.01])
  assert.equal(reviewTier28(p('invalid-'+invalid,invalid)),'additional');
 for(const bounds of [null,{},box(0,.2),box(-.1,.1),box(.7,.7,.5,.5),
  {x:NaN,y:0,width:.8,height:.4},{x:0,y:0,width:.9,height:Infinity}]){
  const row=p('invalid-box',1);
  row.cropBounds=bounds;
  assert.equal(reviewTier28(row),'additional');
 }
 assert.equal(reviewTier28(null),'additional');
});
test('manual crop never becomes algorithmic high-signal suggestion regardless of confidence/area',()=>{
 const manual=p('manual',1,.99,.99,{manual:true,confirmed:true});
 assert.equal(reviewTier28(manual),'manual');
 assert.equal(organizeReview28([manual]).manual[0],manual);
});
test('a photo can have zero priority suggestions and still display every manually reviewable candidate',()=>{
 const src=[p('shoe',.83,.2,.1),p('shirt',.87,.4,.2)];
 const result=organizeReview28(src);
 assert.equal(result.priority.length,0);
 assert.equal(result.additional.length,2);
 assert.equal(result.total,2);
 assert.deepEqual(result.ordered,src);
});
test('frozen source geometry and confidence produce same priority on either engine metadata',()=>{
 const r={box:box(.6,.4),confidence:.95};
 assert.equal(rankFrozenProposal28(r),'priority');
 assert.equal(rankFrozenProposal28({...r,box:box(.1,.1)}),'additional');
 assert.equal(rankFrozenProposal28({...r,confidence:.91}),'additional');
});
test('MAX one-to-one scorer protects against double-counting repeated proposals as correct',()=>{
 const expected=[{family:'upper',box:box(.5,.4)}];
 const proposal={family:'upper',box:box(.5,.4)};
 const s=scorePhoto(expected,{status:'completed',proposals:[proposal,proposal]});
 assert.equal(s.matches.length,1);assert.equal(s.unmatched.length,1);
});
test('actual opt-in editor has visible sections, retains all regions and never marks detections confirmed',()=>{
 const code=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 assert.match(code,/organizeReview28\(state\.pieces\)/);
 assert.match(code,/for\(const \[i,p\]of review\.ordered\.entries\(\)\)/);
 assert.match(code,/grid\.append\(card\)/);
 assert.match(code,/still unverified/);
 assert.match(code,/Other unverified regions/);
 assert.match(code,/model mask score/);
 assert.doesNotMatch(code,/mask confidence/);
 assert.match(code,/manual:false,cropReviewed:false/);
 assert.match(code,/confirmed:false/);
 assert.match(code,/const selected=state\.pieces\.filter\(x=>x\.confirmed\)/);
 assert.match(code,/atomicSaveGarments24/);
 assert.match(code,/sourceSHA256/);
 assert.doesNotMatch(code,/autoConfirm|autoSaveWithoutApproval|threeDReady:true/);
});
test('non-review production worker, photo model and private storage remain untouched by ranking',()=>{
 const code=readFileSync('research/multi-garment-capture-01/review-triage-28.mjs','utf8');
 for(const dangerous of ['fetch(','.postMessage(','indexedDB.open','localStorage','document.cookie'])
  assert.ok(!code.includes(dangerous),'triage must be pure research-only');
 assert.equal(organizeReview28([]).total,0);
 assert.throws(()=>organizeReview28('not an array'),/requires review proposals array/);
});
