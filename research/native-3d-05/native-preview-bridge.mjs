/**
 * NATIVE-3D-05: read-only link from ACTUAL consumer Outfit Builder (#556)
 * to the unmodified verified anatomical 163-bone source-true donor (#541).
 * Never fabricates photo meshes, edits outfits, signs in other owners, or
 * touches default app. Opt-in research path only. Family Alpha HOLD.
 */
import {createNativeAuthEpoch01} from '../native-consumer-board-04/native-session-epoch-550-pinned.mjs';
export const NATIVE_3D_05=Object.freeze({
 gate:'native3D05=research&nativeLossless04=research',
 requiresExistingSaved3DId:true,sourceHonest3DOnly:true,
 originalPhotoSHARequired:true,anatomicalRigBones:163,
 savedOutfitViewReadOnly:true,consumerExistingCASUnchanged:true,
 noPhotoFabrication:true,realSignedAccountsVerified:false,
 productionEnabled:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
const goodId=x=>typeof x==='string'&&x.length>0&&x.length<=160&&!/[\u0000-\u001f]/.test(x);
const slotNames=new Set(['top','bottom','layer','layer2','layer3','shoes','bag','accessory','finish']);
const editButtons=['outfit3D01Save','outfit3D01SaveNew','outfit3D01Delete','outfit3D01Clear','outfit3D01Refresh'];
const editInputs=['outfit3D01Name','outfit3D01Saved',...Array.from(slotNames,x=>'outfit3D01Slot-'+x)];
const sameSlots=(a,b)=>{
 const left=a&&typeof a==='object'?a:{},right=b&&typeof b==='object'?b:{};
 return Object.keys(left).length===Object.keys(right).length&&
  Object.keys(left).every(k=>slotNames.has(k)&&left[k]===right[k]);
};
export function validateNative3D05Selection({consumer,originalNativeAuth,win,doc}={}){
 if(!consumer?.status?.().active||consumer.status().dirty)
  throw Error('NATIVE05 Save or cancel unsaved outfit changes before 3D preview');
 if(!originalNativeAuth?.user?.id||!doc.getElementById('appShell')||
   doc.getElementById('appShell').hidden||!doc.getElementById('authGate')||
   !doc.getElementById('authGate').hidden)
  throw Error('NATIVE05 original native signed-in account required');
 if(win.closetAuth!==originalNativeAuth)
  throw Error('NATIVE05 original native auth replaced');
 const index=consumer.selected,storage=consumer.readOnlySnapshot();
 if(!Number.isInteger(index)||index<0||index>=storage.saved.length)
  throw Error('NATIVE05 Open an existing saved outfit before viewing in 3D');
 const item=storage.saved[index];
 if(!goodId(item?.outfit3dId)||item.ownerId!==undefined&&item.ownerId!==originalNativeAuth.user.id)
  throw Error('NATIVE05 existing owner-private outfit3dId required');
 if(!item.slots||typeof item.slots!=='object'||Array.isArray(item.slots)||
  !Object.keys(item.slots).length||!Object.entries(item.slots).every(([k,id])=>slotNames.has(k)&&goodId(id)))
  throw Error('NATIVE05 invalid saved garment identity');
 return {id:item.outfit3dId,slots:structuredClone(item.slots),
  name:item.name||'My outfit',ownerId:originalNativeAuth.user.id};
}
export async function mountNative3D05({
 win=globalThis.window,doc=win?.document,
 consumer=win?.nativeLossless04Bridge,
 importPinnedDonor=()=>import('/donor/research/outfit-3d-01/research-panel.mjs'),
 onStatus=()=>{}
}={}){
 const params=win?.location?.search&&new URLSearchParams(win.location.search);
 if(!win||!doc||params?.get('native3D05')!=='research'||
  params?.get('nativeLossless04')!=='research'||
  !consumer||typeof importPinnedDonor!=='function'||
  typeof win.closetAuth?.getAccessToken!=='function'||
  !doc.getElementById('builder')||!doc.getElementById('logout')||
  !doc.getElementById('appShell')||!doc.getElementById('authGate')||
  doc.getElementById('native3D05Preview'))
  throw Error('NATIVE05 explicit original signed-in Outfit Builder research gate required');
 const nativeAuth=win.closetAuth,button=doc.createElement('button');
 button.id='native3D05Preview';button.type='button';button.className='secondary';
 button.textContent='Preview saved outfit in 3D · research';
 const status=doc.createElement('p');status.id='native3D05Status';
 status.setAttribute('role','status');status.className='fine';
 button.after(status);
 const anchor=doc.getElementById('nativeLossless04Controls');
 if(!anchor||!anchor.parentElement)
  throw Error('NATIVE05 requires verified normal consumer Save Changes controls');
 anchor.after(button);button.after(status);
 let epoch=null,panel=null,opened=null,closed=false,attempt=0;
 const notify=value=>{const s=String(value);status.textContent=s;onStatus(s);};
 function cleanup(reason='Saved outfit preview closed'){
  attempt++;
  try{panel?.destroy();}catch{}
  panel=null;
  try{epoch?.dispose();}catch{}
  epoch=null;opened=null;
  notify(reason);
 }
 const invalidate=()=>cleanup('Account/session changed · private 3D preview cleared');
 const logout=()=>cleanup('Signed out · private 3D preview cleared');
 win.addEventListener('closet:alpha-session-changed',invalidate);
 win.addEventListener('pagehide',invalidate);
 doc.getElementById('logout').addEventListener('click',logout,true);
 function lockDonorEditing(){
  for(const id of [...editButtons,...editInputs]){
   const element=doc.getElementById(id);
   if(element){element.disabled=true;element.setAttribute('aria-disabled','true');}
  }
  // Disallow any restored donor editor writes even if the opt-in preview is
  // reopened after its 3D canvas is replaced on dialog close.
  const dialog=doc.getElementById('outfit3D01Dialog');
  if(dialog){
   dialog.addEventListener('click',e=>{
    if(e.target?.closest?.('#'+editButtons.join(',#'))){
     e.preventDefault();e.stopImmediatePropagation();
    }
   },true);
  }
 }
 async function open(){
  if(closed)throw Error('NATIVE05 private preview disposed');
  if(opened)throw Error('NATIVE05 close the current 3D preview before reopening');
  const request=++attempt;
  const selected=validateNative3D05Selection({consumer,originalNativeAuth:nativeAuth,win,doc});
  button.disabled=true;notify('Verifying owner wardrobe and loading original-photo anatomical 3D…');
  try{
   epoch=createNativeAuthEpoch01({nativeAuth,win,doc});
   const lease=await epoch.attest();
   if(request!==attempt||lease.ownerId!==selected.ownerId||!epoch.status().active)
    throw Error('NATIVE05 original account changed before viewer admission');
   const donor=await importPinnedDonor();
   if(typeof donor?.mountOutfit3D01Research!=='function')
    throw Error('NATIVE05 exact pinned 3D donor not available');
   panel=await donor.mountOutfit3D01Research({doc,auth:epoch.auth});
   lockDonorEditing();
   opened=selected.id;
   await panel.open(); // genuine anatomical WebGL rig and source-verified loaders
   if(request!==attempt||!epoch.status().active)
    throw Error('NATIVE05 owner/session changed while loading WebGL');
   const target=doc.getElementById('outfit3D01Saved');
   if(!target||![...target.options].some(x=>x.value===selected.id))
    throw Error('NATIVE05 saved outfit absent in verified owner 3D donor');
   target.value=selected.id;
   target.dispatchEvent(new win.Event('change',{bubbles:true}));
   const plan=panel.controller.openSaved(selected.id);
   if(!sameSlots(selected.slots,plan.slots)||plan.ownerId!==selected.ownerId)
    throw Error('NATIVE05 stale/out-of-date garment IDs; preview blocked');
   // Donor's source/3D selection changes happen asynchronously on event.
   // The read-only evidence below never calls the donor save/delete methods.
   lockDonorEditing();
   notify('Research 3D viewer opened · unsupported garments stay original-photo-only');
   return {opened:true,ownerAuthenticated:true,sourceTrue:true,
    originalSlotsPreserved:true,ready:panel.state().viewerReady,
    releaseAuthorized:false,familyAlpha:'HOLD'};
  }catch(e){
   cleanup('3D not available · original clothing photographs preserved. '+String(e.message||e));
   throw e;
  }finally{button.disabled=false;}
 }
 button.onclick=()=>open().catch(()=>{});
 const state=()=>{
  let active=false;
  try{active=!closed&&epoch?.status().active===true&&panel?.state().privateVisible===true;}
  catch{}
  const data=active?panel.state():{};
  return Object.freeze({active,opened:active?opened:null,
   modelReady:active&&data.viewerReady===true,
   bones:active?data.bones||0:0,
   meshCount:active?data.meshCount||0:0,
   viewerMode:active?data.viewerMode||'none':'none',
   fallbackCount:active?data.fallbackCount||0:0,
   photoOnlyUnsupported:true,donorWriteControlsDisabled:true,
   actualConsumerSavePathUnchanged:true,productionEnabled:false,
   realSignedAccountsVerified:false,releaseAuthorized:false,familyAlpha:'HOLD'});
 };
 const close=()=>cleanup();
 const dispose=()=>{
  if(closed)return;closed=true;
  win.removeEventListener('closet:alpha-session-changed',invalidate);
  win.removeEventListener('pagehide',invalidate);
  doc.getElementById('logout').removeEventListener('click',logout,true);
  cleanup('3D research viewer disposed');
  button.remove();status.remove();
 };
 notify('Choose a saved outfit, then preview verified 3D (unsaved edits must be saved).');
 return Object.freeze({open,close,dispose,state,researchOnly:true,releaseAuthorized:false});
}
