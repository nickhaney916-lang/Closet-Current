/**
 * NATIVE-BOARD-HANDOFF-03 — main-controller RESEARCH ONLY.
 *
 * Auth source: immutable exact AUTH-EPOCH-01 PR550 adapter, injected by an
 * independent source-pinned runner; NEVER replacement for native public/auth.js.
 * Board: unchanged exact BOARD-LOSSLESS-02 candidate PR552 behind explicit
 * boardLossless02=research, never the default native lossy editor.
 * Render: source-honest 3D donor decision PR541 only after SHA-verified bytes.
 *
 * This module contains no cloud endpoints, migrations, storage repair,
 * production HTML injections, user credentials or customer source photos.
 */
import {mountLosslessBoard02Research} from '../board-lossless-02/native-research-panel.mjs';

export const NATIVE_BOARD_HANDOFF_03=Object.freeze({
 researchOnly:true,productionEnabled:false,
 requiresNativeAuth:true,requiresIndependentEpochAttestation:true,
 preservesNativeAuthObject:true,losslessEditorReadOnlyOnOpen:true,
 originalCameraAndPhotoIdentityUnchanged:true,
 serverVerifiedJWTRLS:false,liveSignedAccountsTested:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
});

export async function mountNativeBoardHandoff03({
 win=globalThis.window,doc=win?.document,nativeAuth=win?.closetAuth,
 createNativeEpoch,sourceHonest3DDecision
}={}){
 if(!win||!doc||!nativeAuth||typeof nativeAuth.getAccessToken!=='function'||
  typeof createNativeEpoch!=='function'||typeof sourceHonest3DDecision!=='function'||
  new URLSearchParams(win.location.search).get('nativeBoardHandoff03')!=='research'||
  new URLSearchParams(win.location.search).get('boardLossless02')!=='research'||
  !doc.getElementById('appShell')||!doc.getElementById('authGate')||
  !doc.getElementById('logout')||
  doc.getElementById('boardLossless02Research'))
  throw Error('NATIVE03 exact original app, native auth and explicit research opt-ins required');
 // The real browser's provider must stay untouched by this research bridge.
 const originalNative=nativeAuth;
 const epoch=createNativeEpoch({nativeAuth:originalNative,win,doc});
 if(!epoch?.attest||!epoch?.auth?.getSessionGeneration||!epoch?.dispose||
   !epoch?.status||!epoch?.revoke)
  throw Error('NATIVE03 real independent native session epoch adapter required');
 let panel=null,closed=false;
 try{
  const attested=await epoch.attest();
  if(!attested?.authenticated||!attested.ownerId||
   !Number.isSafeInteger(attested.generation)||attested.generation<1||
   win.closetAuth!==originalNative||Object.hasOwn(originalNative,'getSessionGeneration'))
   throw Error('NATIVE03 original native provider/verified lease contract rejected');
  panel=await mountLosslessBoard02Research({
   doc,auth:epoch.auth,native3DDecision:sourceHonest3DDecision
  });
  if(win.closetAuth!==originalNative)
   throw Error('NATIVE03 native provider changed during research mount');
  return Object.freeze({
   get editor(){
    if(closed||!epoch.status().active)throw Error('NATIVE03 revoked: private board editor inaccessible');
    return panel.editor;
   },
   get status(){
    const alive=!closed&&epoch.status().active;
    return Object.freeze({active:alive,nativeAuthObjectUnchanged:win.closetAuth===originalNative,
     originalProviderHasNoSyntheticEpoch:!Object.hasOwn(originalNative,'getSessionGeneration'),
     ownerPrivatePreviewVisible:alive,
     nativeLosssyBoardRemainsDefault:true,releaseAuthorized:false,familyAlpha:'HOLD',
     signedTwoAccountRLSTested:false});
   },
   get section(){return !closed&&epoch.status().active?panel.section:null;},
   show(){
    if(closed||!epoch.status().active)
     throw Error('NATIVE03 revoked: private source photos inaccessible');
    return panel.show();
   },
   dispose(){
    if(closed)return;closed=true;
    try{panel?.dispose();}finally{epoch.dispose();}
   },
   researchOnly:true,releaseAuthorized:false
  });
 }catch(e){
  try{panel?.dispose();}finally{epoch.dispose();}
  throw e;
 }
}
