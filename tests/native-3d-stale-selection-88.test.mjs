import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 validateNative3D05Selection,requireCurrentNative3D05Selection88
} from '../research/native-3d-05/native-preview-bridge.mjs';
const owner='qa-native88-A';
const one={id:'saved-outfit-one',outfit3dId:'source-photo-3D-one',ownerId:owner,
 name:'Human confirmed dress',slots:{top:'verified-dress',shoes:'verified-shoes'}};
const two={id:'saved-outfit-two',outfit3dId:'source-photo-3D-two',ownerId:owner,
 name:'Human confirmed outfit B',slots:{top:'verified-shirt',bottom:'verified-jeans'}};
function setup(){
 let selected=0,dirty=false,active=true,saved=[structuredClone(one),structuredClone(two)];
 const auth={user:{id:owner},getAccessToken:async()=>'',ready:Promise.resolve()};
 const consumer={
  get selected(){return selected;},
  status:()=>({active,dirty,selected}),
  readOnlySnapshot:()=>({saved:structuredClone(saved),current:{}})
 };
 const doc={getElementById:id=>({appShell:{hidden:!active},authGate:{hidden:active}}[id]||null)};
 const win={closetAuth:auth};
 const admission=validateNative3D05Selection({consumer,originalNativeAuth:auth,win,doc});
 const verify=()=>requireCurrentNative3D05Selection88({
  consumer,originalNativeAuth:auth,win,doc,admitted:admission,selectedIndex:0
 });
 return {consumer,auth,doc,win,admission,verify,
  switchTo:x=>{selected=x;},dirty:x=>{dirty=x;},active:x=>{active=x;},
  edit:(i,patch)=>{saved[i]={...saved[i],...patch};},
  changeOwner:()=>{win.closetAuth={user:{id:'foreign-owner'}};},
  snapshot:()=>structuredClone(saved)};
}
test('NATIVE88 unchanged selected saved outfit remains exactly source/owner bound after async boundaries',()=>{
 const x=setup(),before=x.snapshot();
 const now=x.verify();
 assert.equal(now.id,x.admission.id);
 assert.equal(now.savedId,'saved-outfit-one');
 assert.equal(now.ownerId,owner);
 assert.deepEqual(now.slots,one.slots);
 now.slots.top='mutated-unsafe-only-copy';
 assert.deepEqual(x.snapshot(),before,'Read-only selection guard must never modify original board');
 assert.deepEqual(x.verify().slots,one.slots);
});
test('NATIVE88 selecting a different genuine saved outfit during donor import rejects stale preview',()=>{
 const x=setup();x.switchTo(1);
 assert.throws(x.verify,/NATIVE88 saved outfit changed/);
});
test('NATIVE88 same-index saved row replacement or changed source3d ID rejects even if owner matches',()=>{
 for(const change of [
  {id:'different-outfit'}, {outfit3dId:'different-3D-id'},
  {slots:{top:'foreign-photo-dress',shoes:'verified-shoes'}},
  {slots:{top:'verified-dress',shoes:'verified-shoes',layer:'unknown-coat'}},
  {name:'Different outfit now loaded'}
 ]){
  const x=setup();x.edit(0,change);
  assert.throws(x.verify,/NATIVE88 saved outfit changed/,JSON.stringify(change));
 }
});
test('NATIVE88 human unsaved edits and switched native auth refuse asynchronous admission',()=>{
 const dirty=setup();dirty.dirty(true);
 assert.throws(dirty.verify,/Save or cancel/);
 const logout=setup();logout.active(false);
 assert.throws(logout.verify,/Save or cancel|original native/);
 const replaced=setup();replaced.changeOwner();
 assert.throws(replaced.verify,/original native auth replaced/);
});
test('NATIVE88 foreign saved outfit owner rejected before source3d donor admission',()=>{
 const x=setup();x.edit(0,{ownerId:'another-owner'});
 assert.throws(x.verify,/owner-private outfit3dId required/);
});
test('NATIVE88 no forged admission accepted and no stale board silently proceeds',()=>{
 const x=setup();
 assert.throws(()=>requireCurrentNative3D05Selection88({
  consumer:x.consumer,originalNativeAuth:x.auth,win:x.win,doc:x.doc,
  admitted:null,selectedIndex:0
 }),/invalid original outfit admission/);
 assert.throws(()=>requireCurrentNative3D05Selection88({
  consumer:x.consumer,originalNativeAuth:x.auth,win:x.win,doc:x.doc,
  admitted:x.admission,selectedIndex:-1
 }),/invalid original outfit admission/);
});
test('NATIVE88 real bridge verifies current selection on every async donor and WebGL boundary and disallows double opens',()=>{
 const source=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.match(source,/opening=true;button.disabled=true/);
 assert.match(source,/if\(opened\|\|opening\)throw Error/);
 assert.match(source,/}finally\{opening=false;button.disabled=false;}/);
 assert.match(source,/const donor=await importPinnedDonor\(\);\s*requireFresh\(\)/);
 assert.match(source,/panel=await donor\.mountOutfit3D01Research\(\{doc,auth:epoch\.auth\}\);\s*requireFresh\(\)/);
 assert.match(source,/await panel\.open\(\);[\s\S]*?requireFresh\(\)/);
 assert.match(source,/const plan=panel\.controller\.openSaved\(selected\.id\);\s*requireFresh\(\)/);
 assert.match(source,/requireFresh\(\); \/\/ The public successful preview receipt/);
 assert.ok((source.match(/requireFresh\(\)/g)||[]).length>=6);
});
test('NATIVE88 browser regression intercepts original donor import, changes saved outfit and verifies no owner photo or wardrobe mutation',()=>{
 const s=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 assert.match(s,/NATIVE88==='1'/);
 assert.match(s,/page\.route\(path,async route/);
 assert.match(s,/window\.native3D05Bridge\.open\(\)/);
 assert.match(s,/savedBoards button'\)\.nth\(1\)\.click\(\)/);
 assert.match(s,/NATIVE88 saved outfit changed/);
 assert.match(s,/readBoard\(page\),ownerOriginal/);
 assert.match(s,/staleSelectionBlocked88=true/);
});
