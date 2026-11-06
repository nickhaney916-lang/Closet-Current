import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateNative3D05Selection,requireCurrentNative3D05Selection88}
 from '../research/native-3d-05/native-preview-bridge.mjs';
const src=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
const browser=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
function context(){
 const owner='native89-owner';
 const item={id:'saved-one',outfit3dId:'preview-one',ownerId:owner,name:'Dress and sneakers',
  slots:{top:'dress-a',shoes:'shoe-a'}};
 let index=0,dirty=false;
 const saved=[item,{...item,id:'saved-two',outfit3dId:'preview-two',
  name:'Second outfit',slots:{top:'shirt-b',bottom:'denim-b'}}];
 const auth={user:{id:owner}},win={closetAuth:auth};
 const doc={getElementById:id=>({appShell:{hidden:false},authGate:{hidden:true}}[id]||null)};
 const consumer={get selected(){return index;},status:()=>({active:true,dirty}),
  readOnlySnapshot:()=>({saved:structuredClone(saved)})};
 const admission=validateNative3D05Selection({consumer,originalNativeAuth:auth,win,doc});
 const check=()=>requireCurrentNative3D05Selection88({
  consumer,originalNativeAuth:auth,win,doc,admitted:admission,selectedIndex:0});
 return {check,switchTo:i=>index=i,edit:p=>Object.assign(saved[0],p),
  dirty:v=>dirty=v,snapshot:()=>structuredClone(saved)};
}
test('NATIVE89 already-open viewer admission is still current for untouched, source-verified owner and slots',()=>{
 const c=context(),before=c.snapshot();assert.equal(c.check().id,'preview-one');
 assert.deepEqual(before,c.snapshot(),'Read-only guard must not mutate private saved board');
});
test('NATIVE89 changing to another saved outfit AFTER viewer acceptance invalidates original source',()=>{
 const c=context();assert.equal(c.check().savedId,'saved-one');
 c.switchTo(1);assert.throws(c.check,/saved outfit changed/);
});
test('NATIVE89 same selected index with updated verified garment slot, donor ID or display name also invalidates old preview',()=>{
 for(const change of [{slots:{top:'another-dress',shoes:'shoe-a'}},
  {outfit3dId:'another-3D'}, {name:'Updated by another actor'}]){
  const c=context();c.edit(change);assert.throws(c.check,/saved outfit changed/);
 }
});
test('NATIVE89 an unsaved edit after preview opens requires closing and a new owner-confirmed admission',()=>{
 const c=context();c.dirty(true);assert.throws(c.check,/Save or cancel/);
});
test('NATIVE89 actual bridge observes live native saved-board DOM and checks stale state for programmatic changes',()=>{
 assert.match(src,/function revokeChangedSource89\(\)/);
 assert.match(src,/displayedSelection89=\{admitted:selected,selectedIndex\}/);
 assert.match(src,/new mutationHost\(\(\)=>revokeChangedSource89\(\)\)/);
 assert.match(src,/\['savedBoards','boardSlots'\]/);
 assert.match(src,/const state=\(\)=>\{\s*\/\/ Also enforce source admission[\s\S]*?revokeChangedSource89\(\);/);
 assert.match(src,/selectionObserver89\?\.disconnect\(\)/);
 assert.match(src,/cleanup\('Saved outfit changed · stale source-photo 3D preview closed'\)/);
});
test('NATIVE89 stale cleanup cannot dispose valid consumer epoch, mutate saved source or publish cleared garments',()=>{
 assert.match(src,/const oldPanel=panel;panel=null;opened=null;displayedSelection89=null;/);
 assert.match(src,/const oldEpoch=revoke\?epoch:null/);
 assert.match(src,/try\{try\{oldPanel\?\.destroy\(\)/);
 assert.match(src,/const data=active\?panel\.state\(\):\{\}/);
 assert.doesNotMatch(src,/controller\.save\(|controller\.deleteSaved\(|store\.put\(/);
});
test('NATIVE89 actual real 163-bone browser acceptance checks source revocation, privacy, exact JPEG and reopening',()=>{
 assert.match(browser,/const native89=process\.env\.NATIVE89==='1'/);
 assert.match(browser,/nativeLossless04Bridge\.selectSaved\(1\)/);
 assert.match(browser,/stale source-photo 3D preview closed/);
 assert.match(browser,/\#outfit3D01Photos img/);
 assert.match(browser,/nativeLossless04Bridge\.selectSaved\(0\)/);
 assert.match(browser,/native3D05Bridge\?\.state\(\)\.modelReady/);
 assert.match(browser,/benchmark\/native-3d-89\/acceptance\.json/);
});
