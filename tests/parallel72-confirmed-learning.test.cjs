const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const M=require('../public/clothing-memory.js');
const photo=n=>'data:image/jpeg;base64,'+Buffer.from([255,216,n,n+1,n+2,255,217]).toString('base64');
const mem=(axis=0,key='fashion-clip/whole-v1/pinned')=>({
 version:1,modelKey:key,features:Array.from({length:512},(_,i)=>i===axis?1:0)
});
const garment=(id,idx,extra={})=>({id,image:photo(idx),category:'Tops',
 itemType:'Polo',color:'Blue',pattern:'Striped',sleeveLength:'Short sleeve',
 fit:'Regular',recognitionMemory:mem(),...extra});
const learning=async(scope,g)=>{
 const token=await M.begin72(g,scope,{reviewedKeys:['category','itemType','pattern','sleeveLength','fit']});
 assert.ok(token,'original + model required for review');
 const learned=await M.accept72(g,token,scope,{ownerChecked:true});
 assert.ok(learned?.correctionReceipt72);
 return learned;
};
test('P72 original JPEG is SHA-256 bound and rejects fake source and missing FFD8/FFD9',async()=>{
 const sha=await M.photoHash72(photo(4));
 assert.match(sha,/^[a-f0-9]{64}$/);
 assert.notEqual(sha,await M.photoHash72(photo(5)));
 await assert.rejects(()=>M.photoHash72('data:image/jpeg;base64,aGVsbG8='),/P72_INVALID_SOURCE_JPEG/);
 await assert.rejects(()=>M.photoHash72('data:image/png;base64,AAAA'),/P72_ORIGINAL_JPEG_REQUIRED/);
 const real=readFileSync('benchmark/fixtures/commons-0003.jpg');
 const realSha=await M.photoHash72('data:image/jpeg;base64,'+real.toString('base64'));
 assert.match(realSha,/^[a-f0-9]{64}$/);
});
test('P72 null and AI proposals never count as owner confirmations',async()=>{
 const a=M.open72({ownerId:'private-A',sessionId:'session-0001'});
 const draft=garment('one',1);
 const token=await M.begin72(draft,a);
 assert.equal(await M.accept72(draft,token,a,{ownerChecked:false}),null);
 assert.equal(await M.verified72(draft,a),false);
 const q=garment('new',4,{category:'Uncategorized',itemType:'Unknown'});
 assert.equal(await M.suggest72(q,[draft,garment('two',2)],a),null);
 M.close72(a);
});
test('P72 two owner-confirmed independent sources can suggest but never copy color',async()=>{
 const a=M.open72({ownerId:'private-A',sessionId:'session-0002'});
 const r1=await learning(a,garment('one',1)),r2=await learning(a,garment('two',2));
 const q=garment('three',3,{category:'Tops',itemType:'Unknown',pattern:'Unknown',color:'Green'});
 const s=await M.suggest72(q,[r1,r2],a);
 assert.equal(s.requiresConfirmation,true);assert.equal(s.evidenceCount,2);
 assert.equal(s.fields.itemType,'Polo');assert.equal(s.fields.pattern,'Striped');
 assert.equal(s.fields.color,undefined);
 assert.equal(q.itemType,'Unknown','proposal cannot mutate');
 assert.equal((await M.apply72(q,s,a,{ownerChecked:false})).itemType,'Unknown');
 // Unaccepted recommendation consumed only on actual affirmative click.
 const again=await M.suggest72(q,[r1,r2],a);
 const applied=await M.apply72(q,again,a,{ownerChecked:true});
 assert.equal(applied.itemType,'Polo');
 assert.equal(applied.color,'Green');
 assert.equal(applied.correctionReceipt72,undefined);
 assert.equal((await M.apply72(q,again,a,{ownerChecked:true})).itemType,'Unknown','one-shot review token');
 M.close72(a);
});
test('P72 duplicate source/origin, repeated unit and single example cannot poison minimum consensus',async()=>{
 const a=M.open72({ownerId:'private-A',sessionId:'session-0003'});
 const one=await learning(a,garment('one',1));
 const sameSource=await learning(a,garment('another',1));
 const sameUnit=await learning(a,garment('different',2,{ownedUnitId:'unit-one'}));
 const oneWithUnit={...one,ownedUnitId:'unit-one'};
 const q=garment('new',3,{itemType:'Unknown'});
 assert.equal(await M.suggest72(q,[one,sameSource],a),null);
 assert.equal(await M.suggest72(q,[oneWithUnit,sameUnit],a),null);
 assert.equal(await M.suggest72(q,[one],a),null);
 M.close72(a);
});
test('P72 cross owner, ended lease, changed image/mask/model or field revoke provenance',async()=>{
 const a=M.open72({ownerId:'private-A',sessionId:'session-0004'});
 const b=M.open72({ownerId:'private-B',sessionId:'session-0005'});
 const one=await learning(a,garment('one',1));
 assert.equal(await M.verified72(one,a),true);
 assert.equal(await M.verified72(one,b),false);
 for(const mutation of [
  x=>{x.image=photo(12);},
  x=>{x.recognitionPhoto={image:photo(12)};},
  x=>{x.segmentHint={clipped:true};},
  x=>{x.recognitionMemory=mem(0,'model-v2');},
  x=>{x.recognitionMemory.features[0]=.8;},
  x=>{x.itemType='T-shirt';},
  x=>{x.color='Red';},
  x=>{x.pattern='Solid';},
  x=>{x.id='other-id';},
  x=>{x.correctionReceipt72.ownerId='private-B';},
 ]){
  const copy=structuredClone(one);mutation(copy);
  assert.equal(await M.verified72(copy,a),false);
 }
 const token=await M.begin72(garment('two',2),a);
 assert.equal(await M.accept72(garment('two',2),token,b,{ownerChecked:true}),null);
 M.close72(a);assert.equal(await M.verified72(one,a),false);
 M.close72(b);
});
test('P72 owner switch, changed editor value, resegment and stale model invalidate pending confirmation',async()=>{
 const a=M.open72({ownerId:'private-A',sessionId:'session-0006'});
 for(const modify of [
  g=>{g.color='Red';},
  g=>{g.category='Bottoms';},
  g=>{g.image=photo(20);},
  g=>{g.recognitionPhoto={image:photo(22)};},
  g=>{g.segmentHint={maskSha256:'replaced'};},
  g=>{g.recognitionMemory.modelKey='new-worker';},
  g=>{g.recognitionMemory.features[1]=.2;},
 ]){
  const g=garment('pending',1),t=await M.begin72(g,a);
  modify(g);assert.equal(await M.accept72(g,t,a,{ownerChecked:true}),null);
 }
 const g=garment('pending',1),t=await M.begin72(g,a);
 M.close72(a);assert.equal(await M.accept72(g,t,a,{ownerChecked:true}),null);
});
test('P72 no contradictions, overconfident synthetic majority or dissimilar features',async()=>{
 const a=M.open72({ownerId:'private-A',sessionId:'session-0007'});
 const one=await learning(a,garment('one',1));
 const two=await learning(a,garment('two',2));
 const conflicting=await learning(a,garment('three',3,{itemType:'T-shirt'}));
 const q=garment('new',4,{itemType:'Unknown'});
 assert.equal(await M.suggest72(q,[one,two,conflicting],a),null);
 assert.equal(await M.suggest72(garment('diff',5,{itemType:'Unknown',recognitionMemory:mem(1)}),[one,two],a),null);
 assert.equal(await M.suggest72(garment('other',6,{itemType:'Unknown',recognitionMemory:mem(0,'model-v2')}),[one,two],a),null);
 assert.equal(await M.suggest72(garment('mask',7,{itemType:'Unknown',segmentHint:{clipped:true}}),[one,two],a),null);
 assert.equal(await M.suggest72(garment('known',8,{itemType:'Sneakers'}),[one,two],a),null);
 assert.equal(await M.suggest72(q,[one,two],a).then(x=>x?.fields.itemType),'Polo');
 M.close72(a);
});
test('P72 old proposal cannot change a different source, crop, owner or model',async()=>{
 const a=M.open72({ownerId:'private-A',sessionId:'session-0008'});
 const b=M.open72({ownerId:'private-B',sessionId:'session-0009'});
 const refs=[await learning(a,garment('one',1)),await learning(a,garment('two',2))];
 for(const mutation of [
  q=>{q.image=photo(30);},
  q=>{q.recognitionPhoto={image:photo(30)};},
  q=>{q.category='Dresses';},
  q=>{q.itemType='T-shirt';},
  q=>{q.color='Yellow';},
  q=>{q.segmentHint={clipped:true};},
  q=>{q.recognitionMemory.modelKey='other-model';},
 ]){
  const q=garment('new',3,{itemType:'Unknown'});
  const s=await M.suggest72(q,refs,a);
  mutation(q);
  const result=await M.apply72(q,s,a,{ownerChecked:true});
  assert.equal(result.itemType,q.itemType);
 }
 const q=garment('new',3,{itemType:'Unknown'}),s=await M.suggest72(q,refs,a);
 assert.equal((await M.apply72(q,s,b,{ownerChecked:true})).itemType,'Unknown');
 M.close72(a);assert.equal((await M.apply72(q,s,a,{ownerChecked:true})).itemType,'Unknown');
 M.close72(b);
});

test('P72 merely checking category/type never certifies untouched AI pattern, sleeves or fit',async()=>{
 const a=M.open72({ownerId:'private-A',sessionId:'session-0010'});
 const refs=[];
 for(const [id,n] of [['one',1],['two',2]]){
  const garmentCandidate=garment(id,n,{pattern:'Striped',sleeveLength:'Short sleeve',fit:'Regular'});
  const token=await M.begin72(garmentCandidate,a);
  const accepted=await M.accept72(garmentCandidate,token,a,{ownerChecked:true});
  assert.deepEqual(Object.keys(accepted.confirmedDetails).sort(),['category','itemType']);
  refs.push(accepted);
 }
 const query=garment('new',3,{itemType:'Unknown',pattern:'Unknown',sleeveLength:'Unknown',fit:'Unknown'});
 const proposal=await M.suggest72(query,refs,a);
 assert.equal(proposal.fields.itemType,'Polo');
 assert.equal(proposal.fields.pattern,undefined);
 assert.equal(proposal.fields.sleeveLength,undefined);
 assert.equal(proposal.fields.fit,undefined);
 assert.equal(proposal.fields.color,undefined);
 M.close72(a);
});

test('P72 same authenticated owner can reopen a persisted receipt without replaying approval token',async()=>{
 const a=M.open72({ownerId:'private-A',sessionId:'session-0011'});
 const saved=await learning(a,garment('saved',9));
 const serialized=JSON.stringify(saved);
 M.close72(a);
 const newScope=M.open72({ownerId:'private-A',sessionId:'session-0012'});
 const restored=JSON.parse(serialized);
 assert.equal(await M.verified72(restored,newScope),true,'persistence retains SHA-backed receipt');
 const other=M.open72({ownerId:'private-B',sessionId:'session-0013'});
 assert.equal(await M.verified72(restored,other),false,'another owner cannot restore A evidence');
 restored.image=photo(90);
 assert.equal(await M.verified72(restored,newScope),false,'replaced photo must relearn via new owner confirmation');
 M.close72(newScope);M.close72(other);
});
