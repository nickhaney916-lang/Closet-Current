'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
globalThis.crypto ||= require('node:crypto').webcrypto;
const C=require('../public/cross-capture-duplicate-77.js');
const jpeg=(seed=1)=>'data:image/jpeg;base64,'+Buffer.from([255,216,255,224,seed,seed+1,0,1,255,217]).toString('base64');
const visual=(color=12)=>Array(768).fill(color);
const vec=(x=0)=>{const a=Array(512).fill(0);a[x]=1;return {modelKey:'synthetic-v1',features:a};};
function item(id,seed,overrides={}){return {id,ownerId:'owner-A',name:id,category:'Tops',
 image:jpeg(seed),visualSignature:visual(12),visualAspect:1.5,
 recognitionMemory:vec(0),segmentHint:{region:'full'},...overrides};}
function owner(){const auth={id:'owner-A'},session={current:auth};
 return {session,scope:C.open({ownerId:'owner-A',sessionId:'session-fixture-1234',live:()=>session.current?.id})};}
test('old 16x16 RGB labels separate lookalike products as possible duplicates: never a physical-item verdict',()=>{
 const a=item('shirt-A',1,{recognitionMemory:null}),b=item('shirt-B',2,{recognitionMemory:null});
 assert.equal(C.baseline(a,b),true);
 const rank=C.candidateRank(a,[b]);
 assert.equal(rank.totalCandidates,0);assert.equal(rank.abstained,true);
 assert.match(rank.evidenceType,/not-physical-identity/);
});
test('lighting changes can break the RGB heuristic while same-model retrieval provides a conservative candidate',()=>{
 const incoming=item('new',3,{visualSignature:visual(30)});
 const saved=item('old',4,{visualSignature:visual(12)});
 assert.equal(C.baseline(incoming,saved),false);
 const r=C.candidateRank(incoming,[saved]);
 assert.equal(r.top[0].id,'old');assert.equal(r.top[0].signal,'same-model-embedding');
});
test('mismatched 512-feature model is not comparable, and abstention is available',()=>{
 const incoming=item('new',3,{visualSignature:visual(40)}),saved=item('old',4,{
  visualSignature:visual(10),recognitionMemory:{modelKey:'different-model',features:vec().features}});
 assert.equal(C.candidateRank(incoming,[saved]).abstained,true);
});
test('flat and white-on-white pixels abstain; normalised structure resists constant lighting offset',()=>{
 const flat=new Uint8ClampedArray(64*64*4).fill(250);
 assert.equal(C.describe(flat,64,64),null);
 const a=new Uint8ClampedArray(64*64*4),b=new Uint8ClampedArray(64*64*4);
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){
  const v=50+((x*y+x*13+y*17)%120),i=(y*64+x)*4;
  for(let c=0;c<3;c++){a[i+c]=v;b[i+c]=v+30;}a[i+3]=b[i+3]=255;
 }
 const d1=C.describe(a,64,64),d2=C.describe(b,64,64);
 assert.ok(C.structural(d1,d2)>.9);
 assert.throws(()=>C.describe(a,4000,4000),/BOUNDED_PIXELS/);
});
test('unbounded indexes and top-k requests are rejected',()=>{
 const incoming=item('new',1),long=Array.from({length:1201},(_,i)=>item('old-'+i,2,{recognitionMemory:null}));
 assert.throws(()=>C.candidateRank(incoming,long),/UNBOUNDED_INDEX/);
 assert.throws(()=>C.candidateRank(incoming,[],{topK:4}),/UNBOUNDED_INDEX/);
});
test('same source different masks/outfit regions are not physical garment duplicates',async()=>{
 const {scope}=owner(),source=jpeg(7);
 const incoming=item('new',7,{image:source,segmentHint:{region:'left'}});
 const existing=item('other',7,{image:source,segmentHint:{region:'right'}});
 const proposal=await C.propose(incoming,[existing],scope);
 assert.equal(proposal.abstained,true);
});
test('source-bound explicit same-item decision remains unlinked, unsaved and one use only',async()=>{
 const {scope}=owner(),incoming=item('new',10),saved=item('old',11);
 const proposal=await C.propose(incoming,[saved],scope);
 assert.equal(proposal.candidates.length,1);
 assert.equal(proposal.candidates[0].exactSameSource,false);
 await assert.rejects(C.decide(proposal,scope,{action:'same-pending',candidateId:'old'}),/ACK_REQUIRED/);
 const receipt=await C.decide(proposal,scope,{action:'same-pending',candidateId:'old',acknowledged:true});
 assert.equal(receipt.linked,false);assert.equal(receipt.persisted,false);assert.equal(receipt.needsAtomicAdapter,true);
 assert.equal(incoming.image,jpeg(10));assert.equal(saved.image,jpeg(11));
 assert.equal(saved.alternateViews77,undefined);
 await assert.rejects(C.decide(proposal,scope,{action:'different',candidateId:'old',acknowledged:true}),/STALE_PROPOSAL/);
});
test('different item decision cannot suppress future evidence; review later does not delete a draft',async()=>{
 const {scope}=owner(),incoming=item('new',12),saved=item('old',13);
 const p1=await C.propose(incoming,[saved],scope);
 const different=await C.decide(p1,scope,{action:'different',candidateId:'old',acknowledged:true});
 assert.equal(different.action,'different');
 const p2=await C.propose(incoming,[saved],scope);assert.equal(p2.candidates.length,1);
 const later=await C.decide(p2,scope,{action:'later',candidateId:'old',acknowledged:true});
 assert.equal(later.persisted,false);assert.equal(incoming.image,jpeg(12));
});
test('photo recrop, new source bytes and mask changes invalidate proposals',async()=>{
 for(const change of [
  i=>{i.image=jpeg(22);},i=>{i.originalPhoto={image:jpeg(23)};},
  i=>{i.segmentHint={region:'edited'};}
 ]){
  const {scope}=owner(),incoming=item('new',14),saved=item('old',15);
  const p=await C.propose(incoming,[saved],scope);change(incoming);
  await assert.rejects(C.decide(p,scope,{action:'different',candidateId:'old',acknowledged:true}),/STALE_PROPOSAL/);
 }
});
test('candidate edits/deletion and owner change revoke source/decision authority',async()=>{
 const {scope,session}=owner(),incoming=item('new',16),saved=item('old',17);
 const p=await C.propose(incoming,[saved],scope);saved.name='edited in another tab';
 await assert.rejects(C.decide(p,scope,{action:'same-pending',candidateId:'old',acknowledged:true}),/STALE_PROPOSAL/);
 const q=await C.propose(incoming,[saved],scope);session.current={id:'owner-B'};
 await assert.rejects(C.decide(q,scope,{action:'different',candidateId:'old',acknowledged:true}),/STALE_PROPOSAL|OWNER/);
});
test('cross-owner inventory never emits a foreign photograph or matching receipt',async()=>{
 const {scope}=owner(),incoming=item('new',18),foreign=item('secret',19,{ownerId:'owner-B'});
 const p=await C.propose(incoming,[foreign],scope);
 assert.equal(p.abstained,true);assert.equal(JSON.stringify(p).includes('secret'),false);
});
test('canonical source SHA catches alternate encodings and provides exact source identity but no auto-link',async()=>{
 const {scope}=owner(),same=jpeg(20);
 const incoming=item('draft',20,{image:same}),saved=item('saved',20,{image:same});
 const p=await C.propose(incoming,[saved],scope);assert.equal(p.candidates.length,1);
 assert.equal(p.candidates[0].exactSameSource,true);
 const src=await C.evidence(incoming,scope);
 assert.match(src.sourceSha256,/^[a-f0-9]{64}$/);
 assert.equal(src.revisionSha256.length,64);
});
test('invalid non-JPEG and owner fields fail closed',async()=>{
 const {scope}=owner();
 await assert.rejects(C.evidence(item('bad',1,{image:'data:image/png;base64,abcd'}),scope),/JPEG_REQUIRED/);
 await assert.rejects(C.evidence(item('bad',1,{ownerId:'owner-B'}),scope),/OWNER_OR_ITEM_CHANGED/);
});
test('index is bounded at 100/500/1000 and does no original-photo decode',()=>{
 const incoming=item('new',42,{recognitionMemory:null});
 for(const n of [100,500,1000]){
  const inventory=Array.from({length:n},(_,i)=>({id:'saved-'+i,category:'Tops',
   visualAspect:1.5,visualSignature:visual(13)}));
  const before=performance.now(),result=C.candidateRank(incoming,inventory),elapsed=performance.now()-before;
  assert.equal(result.scanned,n);assert.equal(result.top.length,0);
  assert.equal(result.totalCandidates,0);assert.ok(elapsed<10000);
  // Outputs intentionally omit source pixels/photos.
  assert.equal(JSON.stringify(result).includes('data:image'),false);
 }
});
test('session close prevents later approvals; source bytes are never mutated',async()=>{
 const {scope}=owner(),newItem=item('new',25),saved=item('old',26);
 const p=await C.propose(newItem,[saved],scope);C.close(scope);
 await assert.rejects(C.decide(p,scope,{action:'same-pending',candidateId:'old',acknowledged:true}),/STALE_PROPOSAL/);
 assert.equal(saved.image,jpeg(26));
});
