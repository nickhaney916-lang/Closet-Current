import test from 'node:test';
import assert from 'node:assert/strict';
import {mountNative3D05} from '../research/native-3d-05/native-preview-bridge.mjs';
async function harness(){
 const node=()=>({hidden:false,parentElement:{},after(){},remove(){},append(){},setAttribute(){},addEventListener(){},removeEventListener(){}});
 const elements={appShell:node(),authGate:{...node(),hidden:true},builder:node(),logout:node(),nativeLossless04Controls:node()};
 const doc={hidden:false,visibilityState:'visible',getElementById:id=>elements[id]||null,createElement:node,addEventListener(){},removeEventListener(){}};
 const auth={user:{id:'fixture-owner'},getAccessToken:async()=>''};
 const win={document:doc,location:{search:'?native3D05=research&nativeLossless04=research'},closetAuth:auth,addEventListener(){},removeEventListener(){}};
 let dirty=false,selected=0,calls=0;
 const rows=[{id:'saved-a',outfit3dId:'source-a',ownerId:'fixture-owner',slots:{top:'dress-a'}},
 {id:'saved-foreign',outfit3dId:'source-b',ownerId:'other-owner',slots:{top:'shirt-b'}}];
 const consumer={status:()=>({active:true,dirty}),get selected(){return selected;},readOnlySnapshot:()=>({saved:rows}),selectSaved(i){calls++;selected=i;}};
 const api=await mountNative3D05({win,doc,consumer});
 return {api,doc,win,rows,setDirty:x=>dirty=x,get calls(){return calls;}};
}
test('P90 invalid and foreign saved targets cannot change native selection',async()=>{
 const h=await harness();
 for(const i of [-1,1.5,99,1])await assert.rejects(h.api.switchSaved(i),/invalid owner saved outfit/);
 assert.equal(h.calls,0);h.api.dispose();
});
test('P90 unsaved native edits cannot be silently discarded by viewer switching',async()=>{
 const h=await harness();h.setDirty(true);
 await assert.rejects(h.api.switchSaved(0),/Save or cancel/);
 assert.equal(h.calls,0);h.api.dispose();
});
test('P90 hidden tab and replaced auth reject before native selection changes',async()=>{
 const h=await harness();h.doc.hidden=true;
 await assert.rejects(h.api.switchSaved(0),/hidden browser/);
 h.doc.hidden=false;h.win.closetAuth={...h.win.closetAuth};
 await assert.rejects(h.api.switchSaved(0),/auth replaced/);
 assert.equal(h.calls,0);h.api.dispose();
});
test('P90 disposed viewer cannot select or reopen a saved outfit',async()=>{
 const h=await harness();h.api.dispose();
 await assert.rejects(h.api.switchSaved(0),/busy or disposed/);
 assert.equal(h.calls,0);
});
