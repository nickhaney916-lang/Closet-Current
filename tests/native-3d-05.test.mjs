import test from 'node:test';
import assert from 'node:assert/strict';
import {NATIVE_3D_05,validateNative3D05Selection,mountNative3D05}
 from '../research/native-3d-05/native-preview-bridge.mjs';
const owner='qa-owner-A';
const value={id:'saved-original',outfit3dId:'saved-3d-verified',ownerId:owner,
 slots:{top:'dress-05',layer2:'jacket-05',layer3:'coat-05',shoes:'shoe-05'},extra:{keep:true}};
function ctx({selected=0,dirty=false,login=true,slots=value.slots}={}){
 const board={...value,slots};
 const fake={user:login?{id:owner}:null,getAccessToken:async()=>login?'auth':'',ready:Promise.resolve()};
 const consumer={
  status:()=>({active:login,dirty,selected}),
  get selected(){return selected;},
  readOnlySnapshot:()=>({saved:[board],current:{},futureState:{keep:true}})
 };
 const elements={appShell:{hidden:!login},authGate:{hidden:login},
  builder:{},logout:{},nativeLossless04Controls:{parentElement:{}}};
 const doc={getElementById:id=>elements[id]||null};
 const win={closetAuth:fake,location:{search:'?native3D05=research&nativeLossless04=research'},document:doc};
 return {win,doc,consumer,originalNativeAuth:fake};
}
test('NATIVE05 fixed nonrelease source identity, 163-bone viewer and fallback safeguards',()=>{
 assert.equal(NATIVE_3D_05.sourceHonest3DOnly,true);
 assert.equal(NATIVE_3D_05.anatomicalRigBones,163);
 assert.equal(NATIVE_3D_05.savedOutfitViewReadOnly,true);
 assert.equal(NATIVE_3D_05.originalPhotoSHARequired,true);
 assert.equal(NATIVE_3D_05.noPhotoFabrication,true);
 assert.equal(NATIVE_3D_05.realSignedAccountsVerified,false);
 assert.equal(NATIVE_3D_05.releaseAuthorized,false);
 assert.equal(NATIVE_3D_05.familyAlpha,'HOLD');
});
test('NATIVE05 rejects missing saved ID, active draft, other owner and missing native session',()=>{
 for(const [args,code]of [
  [{dirty:true},/Save or cancel/],
  [{selected:null},/Open an existing/],
  [{login:false},/Save or cancel|original native/],
 ]){
  const v=ctx(args);assert.throws(()=>validateNative3D05Selection(v),code);
 }
 const v=ctx();v.consumer.readOnlySnapshot=()=>({saved:[{...value,ownerId:'other-user'}]});
 assert.throws(()=>validateNative3D05Selection(v),/owner-private outfit3dId required/);
 const w=ctx();w.consumer.readOnlySnapshot=()=>({saved:[{...value,outfit3dId:''}]});
 assert.throws(()=>validateNative3D05Selection(w),/outfit3dId required/);
});
test('NATIVE05 never strips original valid dress/jacket/coat/shoes IDs or future metadata',()=>{
 const v=ctx(),snapshot=v.consumer.readOnlySnapshot();
 const saved=JSON.stringify(snapshot);
 const result=validateNative3D05Selection(v);
 assert.deepEqual(result.slots,value.slots);
 assert.equal(result.ownerId,owner);
 assert.equal(JSON.stringify(v.consumer.readOnlySnapshot()),saved);
 result.slots.layer3='modified clone';
 assert.equal(value.slots.layer3,'coat-05');
});
test('NATIVE05 rejects unsupported slot or malformed garment identifier before importing donor',()=>{
 for(const slots of [{top:'dress',backdoor:'foreign'},{top:'ok',layer2:''},{top:'x'.repeat(161)},{}]){
  const v=ctx({slots});assert.throws(()=>validateNative3D05Selection(v),/invalid saved garment identity/);
 }
});
test('NATIVE05 cannot mount on normal consumer path or incomplete native page',async()=>{
 const v=ctx();v.win.location.search='';
 await assert.rejects(mountNative3D05({...v,importPinnedDonor:()=>{throw Error('should not be called');}}),
  /explicit original signed-in Outfit Builder research gate/);
});
test('NATIVE05 never calls donor source-mutating save/delete through preview bridge',async()=>{
 const {readFileSync}=await import('node:fs');
 const s=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.ok(s.includes('createNativeAuthEpoch01('));
 assert.ok(s.includes("sourceTrue:true"));
 assert.ok(s.includes('panel.controller.openSaved(selected.id)'));
 assert.ok(s.includes('sameSlots(selected.slots,plan.slots)'));
 assert.ok(s.includes('lockDonorEditing()'));
 assert.ok(s.includes('donorWriteControlsDisabled:true'));
 assert.ok(!s.includes('controller.save('));
 assert.ok(!s.includes('controller.deleteSaved('));
 assert.ok(!s.includes('store.put('));
 assert.ok(!s.includes('service_role'));
});
