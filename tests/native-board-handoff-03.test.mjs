import test from 'node:test';
import assert from 'node:assert/strict';
import {mountNativeBoardHandoff03,NATIVE_BOARD_HANDOFF_03} from '../research/native-board-handoff-03/native-board-handoff.mjs';
const make=({url='https://localhost/?nativeBoardHandoff03=research&boardLossless02=research',
 native=true,gate=true,alreadyMounted=false}={})=>{
 const el={};
 const doc={getElementById(id){if(id==='boardLossless02Research')return alreadyMounted?el:null;
  if(id==='appShell'||id==='authGate'||id==='logout')return gate?el:null;return null;}};
 const auth=native?{ready:Promise.resolve(),user:{id:'test'},getAccessToken:async()=>'synthetic'}:{};
 const win={location:{search:new URL(url).search},document:doc,closetAuth:auth};
 return {win,doc,nativeAuth:auth};
};
const epoch=()=>({attest:async()=>({authenticated:true,ownerId:'fake',generation:1}),
 auth:{getSessionGeneration:()=>1},dispose:()=>{},status:()=>({active:true}),revoke:()=>{}});
const decide=()=>({mode:'none',fallbackIds:[]});
test('NATIVE03 always remains research-only; production default and release denied',()=>{
 assert.equal(NATIVE_BOARD_HANDOFF_03.productionEnabled,false);
 assert.equal(NATIVE_BOARD_HANDOFF_03.requiresIndependentEpochAttestation,true);
 assert.equal(NATIVE_BOARD_HANDOFF_03.serverVerifiedJWTRLS,false);
 assert.equal(NATIVE_BOARD_HANDOFF_03.releaseAuthorized,false);
 assert.equal(NATIVE_BOARD_HANDOFF_03.familyAlpha,'HOLD');
});
test('NATIVE03 refuses either absent explicit opt-in, native auth, gate, third-party 3D or old panel',async()=>{
 for(const args of [
  {...make({url:'https://localhost/'}),createNativeEpoch:epoch,sourceHonest3DDecision:decide},
  {...make({url:'https://localhost/?nativeBoardHandoff03=research'}),createNativeEpoch:epoch,sourceHonest3DDecision:decide},
  {...make({native:false}),createNativeEpoch:epoch,sourceHonest3DDecision:decide},
  {...make({gate:false}),createNativeEpoch:epoch,sourceHonest3DDecision:decide},
  {...make({alreadyMounted:true}),createNativeEpoch:epoch,sourceHonest3DDecision:decide},
  {...make(),createNativeEpoch:epoch},
  {...make(),sourceHonest3DDecision:decide}
 ]){
  await assert.rejects(mountNativeBoardHandoff03(args),/explicit research opt-ins/);
 }
});
test('NATIVE03 rejects fabricated epoch adapter contracts and never falls back to fixture owner',async()=>{
 const {win,doc,nativeAuth}=make();
 await assert.rejects(mountNativeBoardHandoff03({
  win,doc,nativeAuth,createNativeEpoch:()=>({}),sourceHonest3DDecision:decide
 }),/independent native session epoch adapter required/);
});
test('NATIVE03 refuses a generated session method injected into actual native auth',async()=>{
 const {win,doc,nativeAuth}=make();
 nativeAuth.getSessionGeneration=()=>2;
 let disposed=false;
 await assert.rejects(mountNativeBoardHandoff03({
  win,doc,nativeAuth,
  createNativeEpoch:()=>({...epoch(),dispose:()=>{disposed=true;}}),
  sourceHonest3DDecision:decide
 }),/original native provider\/verified lease contract rejected/);
 assert.equal(disposed,true);
});
test('NATIVE03 refuses native epoch admission revocation and disposes the adapter',async()=>{
 const {win,doc,nativeAuth}=make();
 let disposed=false;
 await assert.rejects(mountNativeBoardHandoff03({
  win,doc,nativeAuth,
  createNativeEpoch:()=>({...epoch(),attest:async()=>{throw Error('Session invalidated');},
   dispose:()=>{disposed=true;}}),
  sourceHonest3DDecision:decide
 }),/Session invalidated/);
 assert.equal(disposed,true);
});
