'use strict';
// M1 P847 source-executes actual #72 bridge, with P846 owner first and shoe
// unit review preserved. Synthetic vectors/JPEGs are NOT real-photo accuracy.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync('public/app.js','utf8');
const memory=require('../public/clothing-memory.js');
const get=(a,b)=>{const i=app.indexOf(a),j=app.indexOf(b,i+a.length);assert.ok(i>=0&&j>i,'source missing '+a);return app.slice(i,j);};
const bridge=get('function learningMode72(){','function clothingFields(');
const feature=()=>({version:1,modelKey:'verified-model',features:Array.from({length:512},(_,i)=>i===0?1:0)});
const photo=n=>'data:image/jpeg;base64,'+Buffer.from([255,216,n,n+1,255,217]).toString('base64');
const piece=(id,n,more={})=>({id,image:photo(n),category:'Tops',itemType:'Polo',color:'Blue',name:'A top',recognitionMemory:feature(),...more});
const scene=(url='https://research.example.test/?confirmedLearning72=1',owner='owner-A')=>{
 const c={URLSearchParams,location:new URL(url),window:{closetAuth:{user:{id:owner}},__closetCurrentOwnerScope72:null},ClothingMemory:memory};
 vm.createContext(c);vm.runInContext(bridge,c);
 return c;
};
test('P847 keeps owner first, shoe source constraints and duplicate-save lock',()=>{
 assert.match(app,/^const reviewFirst836=true;$/m);
 assert.match(app,/let saveInFlight=false;/);
 assert.match(app,/function unit70OwnerEvidenceValid\(/);
 assert.match(app,/duplicateUnit70InCloset\(item,items\)/);
 assert.match(app,/purgePhotoQualityHints845/);
 assert.match(app,/function attachLearningConsent72\(/);
 assert.match(app,/if\(value\.shoePair\|\|value\.combinedFragments70\|\|value\.reconciliation70Status\)/);
 assert.match(app,/delete value\.correctionReceipt72/);
 assert.match(app,/I reviewed this saved garment photograph for learning/);
});
test('P847 never activates in default app even with injected owner scope',()=>{
 const c=scene('https://research.example.test/');
 const scope=memory.open72({ownerId:'owner-A',sessionId:'signed-session-a'});
 c.window.__closetCurrentOwnerScope72=scope;
 assert.equal(c.learningMode72(),false);assert.equal(c.learningScope72(),null);
 memory.close72(scope);
});
test('P847 refuses missing, mismatched, inactive or revoked owner scope',()=>{
 const c=scene();
 assert.equal(c.learningScope72(),null);
 const scope=memory.open72({ownerId:'owner-A',sessionId:'signed-session-a'});
 c.window.__closetCurrentOwnerScope72=scope;
 assert.equal(c.learningScope72(),scope);
 c.window.closetAuth.user.id='owner-B';
 assert.equal(c.learningScope72(),null);
 c.window.closetAuth.user.id='owner-A';memory.close72(scope);
 assert.equal(c.learningScope72(),null);
});
test('P847 research unconsented photo save may be manually saved, but has NO independent learning receipt',async()=>{
 const c=scene();
 const scope=memory.open72({ownerId:'owner-A',sessionId:'signed-session-b'});
 c.window.__closetCurrentOwnerScope72=scope;
 const g=piece('unconsented',4);
 const x=await c.confirmedLearningValue72(g,false,c.learningScope72());
 assert.equal(x.correctionReceipt72,undefined);
 assert.equal(x.confirmedDetails,undefined);
 assert.equal(x.id,g.id);
 memory.close72(scope);
});
test('P847 a real item-specific research consent creates source-verified correction receipt; not blanket learning',async()=>{
 const c=scene();
 const scope=memory.open72({ownerId:'owner-A',sessionId:'signed-session-c'});
 c.window.__closetCurrentOwnerScope72=scope;
 const item=piece('reviewed',7);
 const result=await c.confirmedLearningValue72(item,true,scope);
 assert.match(result.correctionReceipt72.sourceSha256,/^[a-f0-9]{64}$/);
 assert.equal(result.correctionReceipt72.ownerId,'owner-A');
 assert.equal(result.correctionReceipt72.review,'owner-explicit-photo-consent');
 assert.equal(await memory.verified72(result,scope),true);
 assert.equal(result.confirmedDetails.category,'Tops');
 assert.equal(result.confirmedDetails.itemType,'Polo');
 assert.equal(result.confirmedDetails.color,undefined,'color is not learned from an unchecked inferred field');
 memory.close72(scope);
});
test('P847 new shoe pair/fragment reconciliation never becomes a standalone training example',async()=>{
 const c=scene(),scope=memory.open72({ownerId:'owner-A',sessionId:'signed-session-d'});
 c.window.__closetCurrentOwnerScope72=scope;
 for(const extra of [{reconciliation70Status:'paired_confirmed'},{shoePair:{confirmedByOwner:true}},{combinedFragments70:{confirmedByOwner:true}}]){
  const r=await c.confirmedLearningValue72({...piece('pair',8),...extra},true,scope);
  assert.equal(r.correctionReceipt72,undefined);
  assert.equal(r.confirmedDetails,undefined);
 }
 memory.close72(scope);
});
test('P847 authorizing evidence cannot complete if the signed owner changes during hashing',async()=>{
 let resolve;
 const stub={confirm:x=>x,begin72:()=>new Promise(ok=>{resolve=ok;}),accept72:()=>{throw Error('must not accept stale owner');}};
 const c={URLSearchParams,location:new URL('https://research.example.test/?confirmedLearning72=1'),window:{closetAuth:{user:{id:'owner-A'}}},ClothingMemory:stub};
 vm.createContext(c);vm.runInContext(bridge,c);
 const scope={ownerId:'owner-A',active:true};
 c.window.__closetCurrentOwnerScope72=scope;
 const pending=c.confirmedLearningValue72(piece('late',9),true,scope);
 c.window.closetAuth.user.id='owner-B';
 resolve({pending:true});
 await assert.rejects(pending,/P72_OWNER_CHANGED/);
});
test('P847 no research mode cannot silently opt into P72, preserving legacy behavior until separate promotion',async()=>{
 const c=scene('https://research.example.test/'),input=piece('legacy',10);
 const out=await c.confirmedLearningValue72(input,true,null);
 assert.equal(out.correctionReceipt72,undefined);
 assert.equal(out.id,input.id);
});
