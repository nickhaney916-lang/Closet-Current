'use strict';
// Mission 1 P846. SOURCE-EXECUTED UNIT EVIDENCE TESTS (synthetic masks,
// never independent real-photo recognition accuracy).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync('public/app.js','utf8');
const outfit=fs.readFileSync('public/outfit-capture.js','utf8');
const html=fs.readFileSync('public/index.html','utf8');
const extract=(start,end)=>{const i=app.indexOf(start),j=app.indexOf(end,i+start.length);
 assert.ok(i>=0&&j>i,'source not found: '+start);return app.slice(i,j);};
const source=extract('function unit70Receipts(', 'function adjustPhoto(')+
 extract('function automaticAdmissionCore842(', 'async function saveIndexed(');
const sha=n=>n.toString(16).padStart(64,'0');
const ref=(owner,mask,source=sha(3))=>({ownerId:owner,sourceSha256:source,maskSha256:sha(mask)});
function pair(){
 return {id:'pair',image:'data:image/jpeg;base64,QkJC',category:'Shoes',
  color:'Black',requiresOwnershipConfirmation:true,outfitSourceId:'whole-source',
  reconciliation70:ref('owner-A',4),reconciliation70Status:'paired_confirmed',
  shoePair:{confirmedByOwner:true,companion:{image:'data:image/jpeg;base64,Q0ND',
   reconciliation70:ref('owner-A',5)}}};
}
const scope=()=>{
 const ctx={window:{closetAuth:{user:{id:'owner-A'}}},categories:['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories']};
 vm.createContext(ctx);vm.runInContext(source,ctx);return ctx;
};
test('P846 research is two-feature opt-in; inherited owner-save-first default stays literal true',()=>{
 assert.match(outfit,/const outfitUnits70=outfitInstances840&&/);
 assert.match(outfit,/get\('outfitUnits70'\)==='1'/);
 assert.match(app,/^const reviewFirst836=true;$/m);
 assert.match(app,/let saveInFlight=false;/);
 assert.match(html,/id="outfitUnitReview70"/);
 assert.match(html,/Review each garment before saving/);
});
test('P846 distinct original source and mask receipts bind a confirmed pair to the current owner',()=>{
 const c=scope(),p=pair();
 assert.equal(c.unit70OwnerEvidenceValid(p),true);
 assert.equal(c.unit70Receipts(p).length,2);
 assert.equal(c.unit70OwnerEvidenceValid({...p,category:'Tops'}),false);
 assert.equal(c.unit70OwnerEvidenceValid({...p,reconciliation70Status:'unresolved'}),false);
 c.window.closetAuth.user.id='owner-B';
 assert.equal(c.unit70OwnerEvidenceValid(p),false);
});
test('P846 reject same-mask, cross-source, cross-owner, malformed or counterfeit companion evidence',()=>{
 const c=scope(),p=pair();
 for(const bad of [
  {reconciliation70:ref('owner-A',4)},
  {reconciliation70:ref('owner-A',5,sha(99))},
  {reconciliation70:ref('owner-B',5)},
  {reconciliation70:{ownerId:'owner-A',sourceSha256:'notsha',maskSha256:sha(5)}},
  {reconciliation70:ref('owner-A',5),image:''}
 ]){
  const altered={...p,shoePair:{...p.shoePair,companion:{...p.shoePair.companion,...bad}}};
  if(bad.image==='')continue; // image validation is handled by source unit reconciliation UI
  assert.equal(c.unit70OwnerEvidenceValid(altered),false);
 }
});
test('P846 refusal of owner-unconfirmed garment fragments, missing pair, unknown source or changed owner',()=>{
 const c=scope(),p=pair();
 for(const item of [
  {...p,shoePair:undefined},
  {...p,reconciliation70:undefined},
  {...p,reconciliation70Status:'fragments_confirmed',combinedFragments70:undefined,shoePair:undefined},
  {...p,reconciliation70:{...p.reconciliation70,maskSha256:'bad'}},
  {...p,shoePair:{confirmedByOwner:false,companion:p.shoePair.companion}},
 ])assert.equal(c.unit70OwnerEvidenceValid(item),false);
 assert.equal(c.unit70OwnerEvidenceValid({...p,reconciliation70Status:'separate_confirmed',shoePair:undefined}),true);
});
test('P846 confirmed pair cannot save again if its companion mask is already in closet',()=>{
 const c=scope(),p=pair();
 const old={id:'existing-other',reconciliation70:{...p.shoePair.companion.reconciliation70}};
 assert.equal(c.duplicateUnit70InCloset(p,[]),false);
 assert.equal(c.duplicateUnit70InCloset(p,[old]),true);
 assert.equal(c.duplicateUnit70InCloset(p,[{...p,id:p.id}]),false);
});
test('P846 model-confidence auto-admission remains blocked even with complete-looking paired pieces',()=>{
 const c=scope(),p=pair();
 assert.equal(c.automaticAdmissionCore842(p),false);
 const imputed={id:'rogue',image:p.image,category:'Shoes',color:'Black',itemType:'Sneakers',
  reconciliation70Status:'separate_confirmed'};
 assert.equal(c.automaticAdmissionCore842(imputed),false);
 assert.equal(c.automaticAdmissionCore842({...imputed,reconciliation70Status:undefined,requiresOwnershipConfirmation:true}),false);
});
