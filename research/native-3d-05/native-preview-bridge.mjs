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
 if(!goodId(item?.id)||!goodId(item?.outfit3dId)||item.ownerId!==undefined&&item.ownerId!==originalNativeAuth.user.id)
  throw Error('NATIVE05 existing owner-private outfit3dId required');
 if(!item.slots||typeof item.slots!=='object'||Array.isArray(item.slots)||
  !Object.keys(item.slots).length||!Object.entries(item.slots).every(([k,id])=>slotNames.has(k)&&goodId(id)))
  throw Error('NATIVE05 invalid saved garment identity');
 return {id:item.outfit3dId,savedId:item.id,slots:structuredClone(item.slots),
  name:item.name||'My outfit',ownerId:originalNativeAuth.user.id};
}
/**
 * PRIORITY88: A request captures exactly one owner, selected saved-board row,
 * donor ID, photo-bound slot identities and display name. Every asynchronous
 * boundary must recheck the LIVE native consumer state before showing a
 * source-bound WebGL garment. Neither a stale slot nor a merely restored
 * matching 3D ID is authorization to preview another saved outfit.
 */
export function requireCurrentNative3D05Selection88({
 consumer,originalNativeAuth,win,doc,admitted,selectedIndex
}={}){
 if(!admitted||!Number.isInteger(selectedIndex)||selectedIndex<0)
  throw Error('NATIVE88 invalid original outfit admission');
 const current=validateNative3D05Selection({consumer,originalNativeAuth,win,doc});
 if(consumer.selected!==selectedIndex||
    current.savedId!==admitted.savedId||
    current.id!==admitted.id||
    current.ownerId!==admitted.ownerId||
    current.name!==admitted.name||
    !sameSlots(current.slots,admitted.slots))
  throw Error('NATIVE88 saved outfit changed during 3D loading; reopen a current outfit');
 return current;
}
/**
 * NATIVE91: the saved garment ID is NOT the complete photographic identity.
 * The live wardrobe may replace the JPEG, color or subtype under the same ID.
 * Match the owner's bounded source SHA receipts at every asynchronous viewer
 * boundary and while a 3D garment is visible; no JPEG bytes are copied here.
 */
export function captureNative3D05Sources91({consumer,admitted,expected}={}){
 if(!consumer||typeof consumer.readOnlyGarmentSources91!=='function'||
    !admitted||!admitted.slots||!admitted.ownerId)
  throw Error('NATIVE91 source-bound read-only owner wardrobe required');
 const ids=Object.values(admitted.slots);
 const actual=consumer.readOnlyGarmentSources91(ids);
 if(actual.ownerId!==admitted.ownerId||
    !Array.isArray(actual.sources)||actual.sources.length!==ids.length||
    actual.sources.some((r,i)=>r.id!==ids[i]))
  throw Error('NATIVE91 mismatched owner or garment source identities');
 if(expected&&JSON.stringify(actual)!==JSON.stringify(expected))
  throw Error('NATIVE91 photographed garment source changed; reopen current outfit');
 return actual;
}
/**
 * NATIVE93: source SHA metadata can remain unchanged after a wardrobe refresh
 * while the original JPEG bytes were replaced. A successful NATIVE92 byte
 * digest is not permanent approval: a new owner-private wardrobe snapshot
 * ends the old 3D admission. Fresh explicit preview must rehash JPEG bytes.
 */
export function requireNative3D05WardrobeRevision93({
 consumer,ownerId,expected
}={}){
 if(typeof consumer?.readOnlyWardrobeRevision93!=='function'||
    !ownerId||typeof ownerId!=='string')
  throw Error('NATIVE93 owner-private wardrobe revision unavailable');
 const actual=consumer.readOnlyWardrobeRevision93();
 if(!actual||actual.ownerId!==ownerId||
    !Number.isSafeInteger(actual.revision)||actual.revision<1||
    !Number.isSafeInteger(actual.generation))
  throw Error('NATIVE93 invalid owner-private wardrobe revision');
 if(expected&&(actual.ownerId!==expected.ownerId||
    actual.generation!==expected.generation||
    actual.revision!==expected.revision))
  throw Error('NATIVE93 private wardrobe refreshed; reverify JPEG bytes before 3D');
 return Object.freeze({...actual});
}
/**
 * NATIVE102: Mobile OS/browser backgrounding is not evidence that an existing
 * original-photo WebGL admission is still current. Never admit while hidden.
 * The owner must explicitly reopen after becoming visible, re-running the
 * independent original-JPEG WebCrypto admissions from NATIVE92.
 */
export function requireNative3D05Visible102({doc}={}){
 if(!doc||doc.hidden===true||
   doc.visibilityState==='hidden'||doc.visibilityState==='prerender')
  throw Error('NATIVE102 hidden browser must close photographed 3D; reopen when visible');
 return true;
}
export async function mountNative3D05({
 win=globalThis.window,doc=win?.document,
 consumer=win?.nativeLossless04Bridge,
 importPinnedDonor=()=>import('/donor/research/outfit-3d-01/research-panel.mjs'),
 onStatus=()=>{}
}={}){
 const params=typeof win?.location?.search==='string'?
  new URLSearchParams(win.location.search):null;
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
 let epoch=null,panel=null,opened=null,closed=false,attempt=0,cleaning=false,opening=false;
 let displayedSelection89=null,displayedSources91=null,displayedRevision93=null,verifiedPhotographicFit171=null,verifiedPhotographicTorso173=null,verifiedPhotographicShoulder174=null,verifiedPhotographicDress175=null,verifiedPhotoSilhouette62=null,verifiedOwnerCutout186=null,displayedReviewLease187=null;
 const notify=value=>{const s=String(value);status.textContent=s;onStatus(s);};
 function cleanup(reason='Saved outfit preview closed',{revoke=false}={}){
  if(cleaning)return;
  cleaning=true;attempt++;
  const oldPanel=panel;panel=null;opened=null;displayedSelection89=null;displayedSources91=null;displayedRevision93=null;verifiedPhotographicFit171=null;verifiedPhotographicTorso173=null;verifiedPhotographicShoulder174=null;verifiedPhotographicDress175=null;verifiedPhotoSilhouette62=null;verifiedOwnerCutout186=null;displayedReviewLease187=null;
  const oldEpoch=revoke?epoch:null;
  if(revoke)epoch=null;
  try{try{oldPanel?.destroy();}catch{}try{oldEpoch?.dispose();}catch{}}
  finally{cleaning=false;notify(reason);}
  // Explicitly closing 3D never disposes the valid native auth epoch:
  // PR550 disposal broadcasts session-changed and would otherwise clear
  // the consumer's separately verified saved-outfit editor.
 }
 const invalidate=()=>cleanup('Account/session changed · private 3D preview cleared',{revoke:true});
 const logout=()=>cleanup('Signed out · private 3D preview cleared',{revoke:true});
 // NATIVE89: The source admission is not permanent. A change after the
 // WebGL scene opens must revoke that source photo and 3D mesh before any
 // public state() call reports it as still active. The actual consumer board
 // remains untouched; the donor view is read-only and may only be reopened
 // by a fresh explicit selection.
 function revokeChangedSource89(){
  if(!displayedSelection89||cleaning||closed)return false;
  try{
   requireNative3D05Visible102({doc});
   requireCurrentNative3D05Selection88({
    consumer,originalNativeAuth:nativeAuth,win,doc,
    admitted:displayedSelection89.admitted,
    selectedIndex:displayedSelection89.selectedIndex
   });
   captureNative3D05Sources91({
    consumer,admitted:displayedSelection89.admitted,expected:displayedSources91
   });
   requireNative3D05WardrobeRevision93({
    consumer,ownerId:displayedSelection89.admitted.ownerId,expected:displayedRevision93
   });
   if(displayedReviewLease187&&
      consumer.requireReviewedCutoutLease187(displayedReviewLease187)!==true)
    throw Error('P187 reviewed private cutout lease no longer current');
   if(!epoch?.status().active)throw Error('Native owner lease ended');
   return false;
  }catch{
   cleanup('Saved outfit changed · stale source-photo 3D preview closed');
   return true;
  }
 }
 // The native Outfit Builder re-renders these controls whenever it selects,
 // edits or restores an outfit. Watch the rendered user selection instead of
 // adding a separate save path or wrapping the consumer controller.
 const mutationHost=win.MutationObserver;
 const selectionObserver89=typeof mutationHost==='function'?
  new mutationHost(()=>revokeChangedSource89()):null;
 for(const id of ['savedBoards','boardSlots']){
  const target=doc.getElementById(id);
  if(target)selectionObserver89?.observe(target,{childList:true,subtree:true});
 }
 // NATIVE102: A mobile tab can be hidden/frozen without pagehide or a
 // wardrobe DOM mutation. Close the actual displayed private donor immediately
 // and invalidate any in-flight WebGL admission. Never dispose valid owner auth
 // or mutate the user's saved outfit/cloud state on a normal tab switch.
 const onBackground102=()=>{
  if(closed||cleaning||!(opened||panel||opening))return;
  if(doc.hidden===true||doc.visibilityState==='hidden'||
    doc.visibilityState==='prerender')
   cleanup('Browser backgrounded · photographed 3D preview closed; reopen to verify original JPEG');
 };
 const onFreeze102=()=>{
  if(!closed&&!cleaning&&(opened||panel||opening))
   cleanup('Browser frozen · photographed 3D preview closed; reopen to verify original JPEG');
 };
 doc.addEventListener('visibilitychange',onBackground102);
 doc.addEventListener('freeze',onFreeze102);
 win.addEventListener('closet:alpha-session-changed',invalidate);
 win.addEventListener('pagehide',invalidate);
 doc.getElementById('logout').addEventListener('click',logout,true);
 function lockDonorEditing(){
  const donorLauncher=doc.getElementById('outfit3D01Launch');
  if(donorLauncher){donorLauncher.hidden=true;donorLauncher.disabled=true;}
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
  requireNative3D05Visible102({doc});
  // Existing NATIVE102 visibility-first lifecycle must remain untouched.
  // P180 then blocks any asynchronous source admission during cloud restore.
  if(params?.get('cloud3D180')==='research'&&
     win.cloudToNative3D180Bridge?.pending?.())
   throw Error('P180 private cloud replacement pending; 3D must stay closed');
  if(opened||opening)throw Error('NATIVE05 close the current 3D preview before reopening');
  const selectedIndex=consumer.selected,request=++attempt;
  const selected=validateNative3D05Selection({consumer,originalNativeAuth:nativeAuth,win,doc});
  const selectedSources91=captureNative3D05Sources91({consumer,admitted:selected});
  const selectedRevision93=requireNative3D05WardrobeRevision93({consumer,ownerId:selected.ownerId});
  let preflightLease187=null;
  const requireFresh=()=>{
   if(closed||request!==attempt)throw Error('NATIVE88 stale or canceled 3D request');
   requireNative3D05Visible102({doc});
   // Preserve NATIVE102 original source lifecycle, then reject new WebGL
   // admission while a private cloud photo/outfit restore is pending.
   if(params?.get('cloud3D180')==='research'&&
      win.cloudToNative3D180Bridge?.pending?.())
    throw Error('P180 private cloud wardrobe restore pending; cannot open stale 3D');
   const current=requireCurrentNative3D05Selection88({
    consumer,originalNativeAuth:nativeAuth,win,doc,admitted:selected,selectedIndex
   });
   captureNative3D05Sources91({consumer,admitted:selected,expected:selectedSources91});
   requireNative3D05WardrobeRevision93({consumer,ownerId:selected.ownerId,expected:selectedRevision93});
   return current;
  };
  const attestOriginalBytes92=async()=>{
   if(typeof consumer.attestOriginalPhotoBytes92!=='function')
    throw Error('NATIVE92 private original-byte SHA attestation unavailable');
   const actual=await consumer.attestOriginalPhotoBytes92(Object.values(selected.slots));
   requireFresh(); // A concurrent source revision cannot finish an old attestation.
   if(JSON.stringify(actual)!==JSON.stringify(selectedSources91))
    throw Error('NATIVE92 original source receipt changed during byte attestation');
   return actual;
  };
  opening=true;button.disabled=true;
  try{
   notify('Verifying owner wardrobe and loading original-photo anatomical 3D…');
   if(!epoch)epoch=createNativeAuthEpoch01({nativeAuth,win,doc});
   const lease=epoch.status().active?
    {ownerId:nativeAuth.user.id,generation:epoch.auth.getSessionGeneration()}:
    await epoch.attest();
   if(request!==attempt||lease.ownerId!==selected.ownerId||!epoch.status().active)
    throw Error('NATIVE05 original account changed before viewer admission');
   requireFresh(); // A different saved board must not cross the donor import boundary.
   await attestOriginalBytes92(); // Cryptographic JPEG bytes, not metadata alone.
   if(params?.get('photoOwnerCutout187')==='research'){
    // Strict before-WebGL stage: no provisional blouse, borrowed mask or
    // stale owner review may ever reach donor import or anatomical render.
    if(params.get('photoOwnerCutout186')!=='research'||
       params.get('photoShoulder185')!=='research'||
       typeof consumer.attestReviewedCutoutLease187!=='function'||
       typeof consumer.requireReviewedCutoutLease187!=='function')
     throw Error('P187 requires exact owner double-JPEG preview lease research path');
    try{
     preflightLease187=await consumer.attestReviewedCutoutLease187(selected.slots.top);
     requireFresh();
     if(preflightLease187.ownerId!==selected.ownerId||
        preflightLease187.garmentId!==selected.slots.top||
        preflightLease187.originalSourceSHA256!==
          selectedSources91.sources.find(x=>x.id===selected.slots.top)?.sha256||
        consumer.requireReviewedCutoutLease187(preflightLease187)!==true)
      throw Error('Selected original source and reviewed cutout lease mismatch');
    }catch{
     throw Error('P187 unreviewed or changed original/cutout JPEG blocked BEFORE 3D donor import');
    }
   }
   const donor=await importPinnedDonor();
   requireFresh(); // The user may switch outfits or edit slots during lazy import.
   if(typeof donor?.mountOutfit3D01Research!=='function')
    throw Error('NATIVE05 exact pinned 3D donor not available');
   if(params?.get('photoOwnerAlpha189')==='research'&&
      params?.get('photoOwnerPositive188')!=='research')
    throw Error('P189 owner PNG alpha requires P188 private JPEG double-hash texture path');
   if(params?.get('photoOwnerPositive188')==='research'){
    if(!preflightLease187||
       params.get('photoOwnerCutout187')!=='research'||
       typeof consumer.withReviewedCutoutForRenderer188!=='function')
     throw Error('P188 owner-reviewed private texture requires current P187 lease');
    if(params?.get('photoOwnerTopology191')==='research'){
     if(typeof consumer.withReviewedCutoutForRenderer191!=='function')
      throw Error('P191 separate owner-reviewed private source topology renderer required');
     panel=await consumer.withReviewedCutoutForRenderer191(preflightLease187,asset=>
      donor.mountOutfit3D01Research({doc,auth:epoch.auth,ownerReviewedCutout188:asset}));
    }else{
     // Preserve the original P188 API and its separately verified source
     // receipt; no other camera, native owner or cloud path is changed.
     panel=await consumer.withReviewedCutoutForRenderer188(preflightLease187,asset=>
      donor.mountOutfit3D01Research({doc,auth:epoch.auth,ownerReviewedCutout188:asset}));
    }
    consumer.requireReviewedCutoutLease187(preflightLease187);
   }else panel=await donor.mountOutfit3D01Research({doc,auth:epoch.auth});
   requireFresh(); // Do not open a donor after the native outfit changed.
   lockDonorEditing();
   opened=selected.id;
   await panel.open(); // genuine anatomical WebGL rig and source-verified loaders
   // P180: fail closed if the original 163-bone donor never became ready.
   // Its fallback reason is read *before* the saved-outfit change event
   // overwrites its status with a generic "verifying" line.
   if(params?.get('cloud3D180')==='research'&&
      (panel.state()?.viewerReady!==true||panel.state()?.bones!==163)){
    const message=String(doc.getElementById('outfit3D01Status')?.textContent||
     'anatomical renderer unavailable').slice(0,240);
    throw Error('P180 source-verified real 163-bone donor not ready: '+message);
   }
   // P183: don't overwrite an original source load error with the generic
   // "verifying" text from a saved-outfit event. Preserve the *actual* donor
   // cause before the user source is selected, without leaking private data.
   if(params?.get('photoSilhouette62')==='research'&&
      (panel.state()?.viewerReady!==true||panel.state()?.bones!==163)){
    const diagnostic=String(doc.getElementById('outfit3D01Status')?.textContent||
     'unavailable').slice(0,280);
    throw Error('P183 source-bound provisional blouse donor 163-bone load failed: '+diagnostic);
   }
   if(request!==attempt||!epoch.status().active)
    throw Error('NATIVE05 owner/session changed while loading WebGL');
   requireFresh(); // The WebGL model may take seconds; recheck source + owner.
   await attestOriginalBytes92(); // Repeat after slow WebGL to close byte-level TOCTOU.
   const target=doc.getElementById('outfit3D01Saved');
   if(!target||![...target.options].some(x=>x.value===selected.id))
    throw Error('NATIVE05 saved outfit absent in verified owner 3D donor');
   target.value=selected.id;
   target.dispatchEvent(new win.Event('change',{bubbles:true}));
   const plan=panel.controller.openSaved(selected.id);
   requireFresh(); // No stale picked ID may finish after user switched outfits.
   if(!sameSlots(selected.slots,plan.slots)||plan.ownerId!==selected.ownerId)
    throw Error('NATIVE05 stale/out-of-date garment IDs; preview blocked');
   // Donor's source/3D selection changes happen asynchronously on event.
   // The read-only evidence below never calls the donor save/delete methods.
   lockDonorEditing();
   requireFresh(); // The public successful preview receipt must refer to the same row.
   displayedSelection89={admitted:selected,selectedIndex};
   displayedSources91=selectedSources91;
   displayedRevision93=selectedRevision93;
   // If native board mutation is queued during the final WebGL frame,
   // always re-check before announcing success.
   revokeChangedSource89();
   if(!displayedSelection89)throw Error('NATIVE89 saved outfit changed as 3D became visible');
   // P171 is explicitly opt-in on the pinned detached PR541+P60 donor only.
   // It may inspect the actual 163-bone photographed mesh receipts; never
   // substitute an owner JPEG into a generic donor mesh or claim photorealism.
   if(params?.get('photoFit171')==='research'){
    const fitModule=await import('../native-photo-anatomical-fit-integration-171/admission.mjs');
    requireFresh();
    let proof171=null;
    for(let i=0;i<40;i++){
     const render=panel?.state?.();
     const verdict=fitModule.inspectNativePhotoFit171({
      selection:selected,sources:selectedSources91,
      render:render?{...render,productionDeployed:false}:null
     });
     if(verdict.admitted){proof171=verdict;break;}
     if(i===39){
      // Research-only sanitized diagnostic: never print owner photos, saved
      // garment IDs, tokens, original JPEG bytes or private source hashes.
      const diag={ready:render?.viewerReady===true,visible:render?.privateVisible===true,
       bones:render?.bones||0,mode:render?.viewerMode||'none',
       receiptSlots:Object.keys(render?.fitReceipts171||{}),
       status:String(doc.getElementById('outfit3D01Status')?.textContent||'').slice(0,170)};
      throw Error('P171 source-bound anatomical 3D receipt not independently available: '+
       verdict.reason+'; sanitized-render='+JSON.stringify(diag));
     }
     await new Promise(resolve=>win.setTimeout(resolve,100));
     requireFresh();
    }
    await attestOriginalBytes92();
    requireFresh();
    verifiedPhotographicFit171=proof171;
   }
   if(params?.get('photoSilhouette62')==='research'){
    if(params?.get('photoFit171')!=='research'||!verifiedPhotographicFit171?.admitted)
     throw Error('P62 requires existing independently signed P171 source-true 3D admission');
    const render=panel?.state?.();
    const module=await import('../user-photo-to-anatomical-3d-62/admission.mjs');
    requireFresh();
    const result=module.inspectPhotoSilhouetteFit62({selection:selected,sources:selectedSources91,
     render:render?{...render,productionDeployed:false}:null,proof171:verifiedPhotographicFit171});
    if(!result.admitted)throw Error('P62 source-photo physical silhouette fit unavailable: '+result.reason);
    await attestOriginalBytes92();requireFresh();verifiedPhotoSilhouette62=result;
   }
   if(params?.get('photoShoulder185')==='research'){
    // The *actual skinned donor* must provide a new physical-shoulder receipt;
    // a camera cutout, slider flag or model dropdown is insufficient.
    if(params?.get('photoSilhouette62')!=='research'||!verifiedPhotoSilhouette62?.admitted)
     throw Error('P185 requires P62 verified native owner original-photo 3D admission');
    const candidate=panel?.state?.()?.fitReceipts171?.shirt?.silhouette62;
    if(candidate?.sourceShoulderEased185!==true||
      candidate?.shoulderHemWorldAxisCorrected185!==true||
      candidate?.independentShoulderCapSeamsRetained185!==true||
      !Number.isInteger(candidate?.independentlyJoinedShoulderCapMeshes185)||
      candidate.independentlyJoinedShoulderCapMeshes185<2||
      !Number.isInteger(candidate?.shoulderEasedVertices185)||
      candidate.shoulderEasedVertices185<20||
      !Number.isFinite(candidate.maxShoulderDisplacement185)||
      candidate.maxShoulderDisplacement185<.0001||
      candidate.maxShoulderDisplacement185>.025)
     throw Error('P185 actual shoulder-fall mesh fit and correct world-Y mapping not independently available');
    await attestOriginalBytes92();requireFresh();
   }
   if(params?.get('photoOwnerCutout186')==='research'){
    // A provisional licensed blouse is not an owner-reviewed cutout.
    // The selected owner's real P119 saved source and separate cutout bytes
    // must both independently hash-match before this 3D claim is permitted.
    if(params.get('photoShoulder185')!=='research'||
      !verifiedPhotoSilhouette62?.admitted||
      typeof consumer.attestReviewedCutout186!=='function')
     throw Error('P186 owner-review research requires genuine P185 photo fit');
    if(preflightLease187)consumer.requireReviewedCutoutLease187(preflightLease187);
    if(params?.get('photoOwnerPositive188')==='research'&&
       panel?.state?.()?.privateCutoutTexelsOnMesh188!==true)
     throw Error('P188 actual owner-private JPEG fabric texels not on source-fitted skinned mesh');
    const savedReview=await consumer.attestReviewedCutout186(selected.slots.top);
    requireFresh();
    if(preflightLease187){
     consumer.requireReviewedCutoutLease187(preflightLease187);
     if(JSON.stringify(savedReview)!==JSON.stringify(preflightLease187))
      throw Error('P187 owner review changed between WebCrypto preflight and 3D render');
    }
    const module=await import('../owner-cutout-photo-fit-186/review-contract.mjs');
    const render=panel?.state?.();
    const verdict=module.inspectOwnerReviewedCutout186({
     selection:selected,sources:selectedSources91,
     render:render?{...render,productionDeployed:false}:null,
     proof62:verifiedPhotoSilhouette62,verifiedCutout:savedReview
    });
    if(!verdict.admitted)
     throw Error('P186 owner original+cutout reviewed source unavailable: '+verdict.reason);
    if(params?.get('photoOwnerPositive188')==='research'&&
       verdict.actualPrivateJPEGTexelsOnSkinnedMesh188!==true)
     throw Error('P188 current verified private owner pixels not rendered into real 163-bone garment');
    if(params?.get('photoOwnerTopology191')==='research'&&
       params?.get('photoOwnerGeometry190')!=='research')
     throw Error('P191 original-source alpha topology requires actual P190 private-owner physical mesh');
    if(params?.get('photoOwnerGeometry190')==='research'&&
       params?.get('photoOwnerAlpha189')!=='research')
     throw Error('P190 owner physical blouse geometry requires current P189 separate alpha mask proof');
    if(params?.get('photoOwnerAlpha189')==='research'){
     // A second, independently WebCrypto-hashed private PNG must actually
     // mask the fitted source garment's photographed texture. This never
     // claims garment geometry was generated from the private PNG.
     const mask=panel?.state?.();
     if(mask?.ownerMaskPixelsOnSkinnedGarment189!==true||
        !/^[0-9a-f]{64}$/.test(mask?.reviewedPrivateOwnerMaskSHA189||'')||
        mask.ownerMaskGeometryFromPrivatePNG189!==false||
        mask.ownerMaskHumanReviewIndependentlyVerified189!==false)
      throw Error('P189 owner-private SHA-bound mask not applied to current 163-bone fabric');
     if(preflightLease187)consumer.requireReviewedCutoutLease187(preflightLease187);
    }
    if(params?.get('photoOwnerGeometry190')==='research'){
     // ONLY the current actual 163-bone skinned garment, with original P185
     // two-cap seams, can claim geometry physically derived from owner PNG.
     const render190=panel?.state?.();
     const fit190=render190?.fitReceipts171?.shirt?.silhouette62;
     if(render190?.viewerReady!==true||render190?.bones!==163||
        render190?.ownerMaskPixelsOnSkinnedGarment189!==true||
        fit190?.ownerAlphaMaskBasedPhysicalGeometry190!==true||
        fit190?.ownerAlphaMaskSHA256_190!==render190.reviewedPrivateOwnerMaskSHA189||
        fit190?.ownerMaskBilateralCapJoins190!==2||
        !Number.isInteger(fit190?.ownerMaskAdjustedVertices190)||
        fit190.ownerMaskAdjustedVertices190<20||
        !Number.isFinite(fit190.ownerMaskMaxMoveMeters190)||
        fit190.ownerMaskMaxMoveMeters190<.0005||
        fit190.ownerMaskMaxMoveMeters190>.00901||
        fit190?.ownerMaskOnlyUpperBlouse190!==true||
        fit190?.inferredOwnerMaskRear190!==true||
        fit190?.ownerMaskHumanReviewCertified190!==false||
        fit190?.generalizedUserPhotoTo3D190!==false)
      throw Error('P190 actual reviewed owner-mask derived bounded 163-bone geometry proof unavailable');
     if(preflightLease187)consumer.requireReviewedCutoutLease187(preflightLease187);
    }
    if(params?.get('photoOwnerTopology191')==='research'){
     // Independently require (1) original-licensed-vs-owner PNG alpha pixels
     // were decoded and topology-validated before fitting, and (2) the
     // actual current P190 163-bone shirt shell plus TWO shoulder cap joins
     // bears precisely the same SHA. The source and mesh are separate
     // receipts; one cannot synthesize the other's verification outcome.
     const now=panel?.state?.(),physical=now?.fitReceipts171?.shirt?.silhouette62;
     const source=now?.ownerSourceMaskTopologyVerified191===true&&
      now?.ownerSourceMaskSHA191===now?.reviewedPrivateOwnerMaskSHA189&&
      Number.isFinite(now?.ownerSourceMaskOverlapIoU191)&&
      now.ownerSourceMaskOverlapIoU191>=.80&&
      Number.isFinite(now?.ownerSourceMaskLargestConnected191)&&
      now.ownerSourceMaskLargestConnected191>=.87&&
      Number.isFinite(now?.ownerSourceMaskInsideSource191)&&
      now.ownerSourceMaskInsideSource191>=.965&&
      now?.ownerSourceMaskHumanReviewIndependent191===false;
     const fitted=physical?.ownerAlphaMaskBasedPhysicalGeometry190===true&&
      physical.ownerAlphaMaskSHA256_190===now?.ownerSourceMaskSHA191&&
      physical.ownerMaskBilateralCapJoins190===2&&
      physical.ownerMaskOnlyUpperBlouse190===true&&
      physical.inferredOwnerMaskRear190===true;
     if(now?.viewerReady!==true||now?.bones!==163||
       source!==true||fitted!==true)
      throw Error('P191 current private garment alpha fails true original-photo topology check: '+JSON.stringify({
       current163:now?.bones===163,
       sourcePixelTopology:source===true,
       assetRequested:now?.ownerSourceMaskRequested191===true,
       inCompositedSource:now?.ownerSourceMaskHeldByBlouse191===true,
       inGeometryProfile:now?.ownerSourceMaskProfileSeen191===true,
       sameOwnerMaskSHA:now?.ownerSourceMaskSHA191===now?.reviewedPrivateOwnerMaskSHA189,
       overlap:Number.isFinite(now?.ownerSourceMaskOverlapIoU191)?now.ownerSourceMaskOverlapIoU191:0,
       connected:Number.isFinite(now?.ownerSourceMaskLargestConnected191)?now.ownerSourceMaskLargestConnected191:0,
       inside:Number.isFinite(now?.ownerSourceMaskInsideSource191)?now.ownerSourceMaskInsideSource191:0,
       currentPhysical163BoneMesh:fitted===true
      }));
     if(preflightLease187)consumer.requireReviewedCutoutLease187(preflightLease187);
    }
    await attestOriginalBytes92();requireFresh();
    verifiedOwnerCutout186=verdict;
    if(preflightLease187){
     consumer.requireReviewedCutoutLease187(preflightLease187);
     displayedReviewLease187=preflightLease187;
    }
   }
   // P173: an explicitly selected owner shirt may claim a bounded 3D torso
   // contour ONLY when the real donor physically moved the original mesh.
   // Dress remains P171 source-only, not falsely labeled P173 shirt-fitted.
   if(params?.get('photoTorso173')==='research'){
    if(params?.get('photoFit171')!=='research'||!verifiedPhotographicFit171?.admitted)
     throw Error('P173 requires existing independently signed P171 source-true 3D admission');
    const render=panel?.state?.();
    if(render?.viewerMode==='shirt'||render?.viewerMode==='shirt-pants'){
     const module=await import('../native-photo-torso-173/admission.mjs');
     requireFresh();
     const verdict=module.inspectNativePhotoTorso173({
      selection:selected,sources:selectedSources91,
      render:render?{...render,productionDeployed:false}:null,
      proof171:verifiedPhotographicFit171
     });
     if(!verdict.admitted)throw Error('P173 original photographed shirt geometry unavailable: '+verdict.reason);
     await attestOriginalBytes92();
     requireFresh();
     verifiedPhotographicTorso173=verdict;
    }
   }
   // P174: independent original JPEG + 163-bone shoulder seam receipt.
   // Only physically modified original source shell AND both original
   // anatomically joined shoulder caps may report P174 source-fitted.
   if(params?.get('photoSleeve174')==='research'){
    const render=panel?.state?.();
    // P174 is a SHIRT-only independent source photo physical mesh. An
    // originally verified dress must never be blocked for lacking a shirt
    // torso, shoulder cap, or P173 shirt-specific source receipt.
    if(render?.viewerMode==='shirt'||render?.viewerMode==='shirt-pants'){
     if(params?.get('photoTorso173')!=='research'||
        !verifiedPhotographicTorso173?.admitted||
        !verifiedPhotographicFit171?.admitted)
      throw Error('P174 P171/P173 owner-signed original 3D shirt prerequisites unavailable');
     const module=await import('../source-shoulder-seam-174/admission.mjs');
     requireFresh();
     const result=module.inspectNativeShoulder174({
      selection:selected,sources:selectedSources91,
      render:render?{...render,productionDeployed:false}:null,
      proof173:verifiedPhotographicTorso173
     });
     if(!result.admitted)throw Error('P174 exact original photographed shoulder seam fit unavailable: '+result.reason);
     await attestOriginalBytes92();
     requireFresh();
     verifiedPhotographicShoulder174=result;
    }
   }
   // P175 physically fit the exact original licensed dress source from P61
   // in native signed-owner 3D; a selected shirt never requires dress proof.
   if(params?.get('photoDress175')==='research'){
    const render=panel?.state?.();
    if(render?.viewerMode==='dress'){
     if(params?.get('photoFit171')!=='research'||!verifiedPhotographicFit171?.admitted)
      throw Error('P175 original owner dress requires independently signed P171 source proof');
     const verify=await import('../native-original-dress-drape-175/admission.mjs');
     requireFresh();
     const verdict=verify.inspectNativeDressDrape175({
      selection:selected,sources:selectedSources91,
      render:render?{...render,productionDeployed:false}:null,
      proof171:verifiedPhotographicFit171
     });
     if(!verdict.admitted)
      throw Error('P175 original photographed dress bodice/skirt 3D unavailable: '+verdict.reason);
     await attestOriginalBytes92();
     requireFresh();
     verifiedPhotographicDress175=verdict;
    }
   }
   notify('Research 3D viewer opened · unsupported garments stay original-photo-only');
   return {opened:true,ownerAuthenticated:true,sourceTrue:true,
    originalSlotsPreserved:true,ready:panel.state().viewerReady,
    photoSourceFit171:verifiedPhotographicFit171?.admitted===true,
    photoSourceSilhouette62:verifiedPhotoSilhouette62?.admitted===true,
    photoSourceTorso173:verifiedPhotographicTorso173?.admitted===true,
    photoSourceShoulder174:verifiedPhotographicShoulder174?.admitted===true,
    photoSourceDress175:verifiedPhotographicDress175?.admitted===true,
    photorealismApproved:false,releaseAuthorized:false,familyAlpha:'HOLD'};
  }catch(e){
   cleanup('3D not available · original clothing photographs preserved. '+String(e.message||e));
   throw e;
  }finally{opening=false;button.disabled=false;}
 }
 button.onclick=()=>open().catch(()=>{});
 const state=()=>{
  // Also enforce source admission when a board state changed without a DOM
  // redraw, including programmatic imported/restore state and tab switches.
  // NATIVE102 additionally closes any photo 3D after an unobserved hide.
  onBackground102();
  revokeChangedSource89();
  let active=false;
  try{active=!closed&&epoch?.status().active===true&&panel?.state().privateVisible===true;}
  catch{}
  const data=active?panel.state():{};
  return Object.freeze({active,opened:active?opened:null,
   modelReady:active&&data.viewerReady===true,
   // P183: expose the ACTUAL loaded donor anatomical figure; never derive
   // female/male from a select value before a 163-bone model finished loading.
   figure:active&&data.viewerReady===true?data.figure||null:null,
   bones:active?data.bones||0:0,
   meshCount:active?data.meshCount||0:0,
   viewerMode:active?data.viewerMode||'none':'none',
   fallbackCount:active?data.fallbackCount||0:0,
   photoOnlyUnsupported:true,photoSourceFit171:active&&verifiedPhotographicFit171?.admitted===true,
   photoSourceSilhouette62:active&&verifiedPhotoSilhouette62?.admitted===true,
   silhouetteVertices62:active?verifiedPhotoSilhouette62?.movedVertices||0:0,
   silhouetteMaxMeters62:active?verifiedPhotoSilhouette62?.maxMovementMeters||0:0,
   // P185 source-mesh proof must be recomputed from current donor state when
   // switching anatomical gender, not from the prior female model receipt.
   photoSourceShoulder185:active&&
    data.fitReceipts171?.shirt?.silhouette62?.sourceShoulderEased185===true&&
    data.fitReceipts171?.shirt?.silhouette62?.shoulderHemWorldAxisCorrected185===true&&
    data.fitReceipts171?.shirt?.silhouette62?.independentShoulderCapSeamsRetained185===true&&
    data.fitReceipts171?.shirt?.silhouette62?.independentlyJoinedShoulderCapMeshes185>=2,
   shoulderCapSeamsRetained185:active&&
    data.fitReceipts171?.shirt?.silhouette62?.independentShoulderCapSeamsRetained185===true,
   sewnShoulderCaps185:active?
    data.fitReceipts171?.shirt?.silhouette62?.independentlyJoinedShoulderCapMeshes185||0:0,
   physicalShoulderVertices185:active?
    data.fitReceipts171?.shirt?.silhouette62?.shoulderEasedVertices185||0:0,
   physicalShoulderMaxMeters185:active?
    data.fitReceipts171?.shirt?.silhouette62?.maxShoulderDisplacement185||0:0,
   mannequinBaseCoverDisclosure185:active&&
    !!doc.getElementById('outfit3D01AnatomyCover185')?.textContent?.includes('mannequin'),
   photoOwnerCutout186:active&&verifiedOwnerCutout186?.admitted===true,
   photoOwnerCutout187:active&&!!displayedReviewLease187&&verifiedOwnerCutout186?.admitted===true,
   ownerReviewedCutoutTextureOnMesh188:active&&
    verifiedOwnerCutout186?.actualPrivateJPEGTexelsOnSkinnedMesh188===true&&
    data.privateCutoutTexelsOnMesh188===true,
   ownerCutoutMaskFromUser188:false,
   ownerCutoutHumanReviewIndependentlyWitnessed188:false,
   ownerAlphaMaskTextureApplied189:active&&
    verifiedOwnerCutout186?.admitted===true&&
    data.ownerMaskPixelsOnSkinnedGarment189===true,
   ownerAlphaMaskSourceGeometryChanged189:false,
   ownerAlphaMaskHumanReviewIndependentlyWitnessed189:false,
   ownerAlphaMaskSegmentationAccuracyVerified189:false,
   ownerAlphaPhysicalMeshFit190:active&&
    verifiedOwnerCutout186?.admitted===true&&
    data.ownerMaskPixelsOnSkinnedGarment189===true&&
    data.fitReceipts171?.shirt?.silhouette62?.ownerAlphaMaskBasedPhysicalGeometry190===true&&
    data.fitReceipts171?.shirt?.silhouette62?.ownerAlphaMaskSHA256_190===
     data.reviewedPrivateOwnerMaskSHA189,
   ownerAlphaPhysicalVertices190:active?
    data.fitReceipts171?.shirt?.silhouette62?.ownerMaskAdjustedVertices190||0:0,
   ownerAlphaPhysicalMoveMeters190:active?
    data.fitReceipts171?.shirt?.silhouette62?.ownerMaskMaxMoveMeters190||0:0,
   ownerAlphaBilateralCapJoins190:active?
    data.fitReceipts171?.shirt?.silhouette62?.ownerMaskBilateralCapJoins190||0:0,
   ownerAlphaGeneral3DApproved190:false,
   ownerAlphaRearActuallyPhotographed190:false,
   sourceMaskTopologyValid191:active&&verifiedOwnerCutout186?.admitted===true&&
    data.ownerSourceMaskTopologyVerified191===true&&
    data.ownerSourceMaskSHA191===data.reviewedPrivateOwnerMaskSHA189&&
    data.fitReceipts171?.shirt?.silhouette62?.ownerAlphaMaskBasedPhysicalGeometry190===true&&
    data.fitReceipts171?.shirt?.silhouette62?.ownerAlphaMaskSHA256_190===
     data.reviewedPrivateOwnerMaskSHA189,
   sourceMaskOverlapIoU191:active?data.ownerSourceMaskOverlapIoU191||0:0,
   sourceMaskLargestConnected191:active?data.ownerSourceMaskLargestConnected191||0:0,
   sourceMaskInsideSource191:active?data.ownerSourceMaskInsideSource191||0:0,
   independentHumanReviewCertified191:false,
   generalGarmentSegmentationAccepted191:false,
   ownerPhotoBackPhotographed191:false,
   reviewedCutoutLeaseLive187:active&&!!displayedReviewLease187,
   ownerCutoutSHA186:active&&verifiedOwnerCutout186?.originalAndCutoutJPEGBytesIndependentlySHA256Verified===true,
   photoSourceTorso173:active&&verifiedPhotographicTorso173?.admitted===true,
   photoSourceShoulder174:active&&verifiedPhotographicShoulder174?.admitted===true,
   photoSourceDress175:active&&verifiedPhotographicDress175?.admitted===true,
   physicalDressBodiceVertices175:active?verifiedPhotographicDress175?.bodiceMovedVertices||0:0,
   physicalDressSkirtVertices175:active?verifiedPhotographicDress175?.skirtMovedVertices||0:0,
   physicalDressMaxBodiceMeters175:active?verifiedPhotographicDress175?.maxBodiceMeters||0:0,
   physicalDressMaxSkirtMeters175:active?verifiedPhotographicDress175?.maxSkirtMeters||0:0,
   shoulderMovedVertices174:active?verifiedPhotographicShoulder174?.movedVertices||0:0,
   shoulderMaxMeters174:active?verifiedPhotographicShoulder174?.maximumDisplacementMeters||0:0,
   physicalShirtVertices173:active?verifiedPhotographicTorso173?.physicalTorsoMovedVertices||0:0,
   physicalShirtMaxMoveMeters173:active?verifiedPhotographicTorso173?.physicalTorsoMaxMoveMeters||0:0,
   ownerPhoto3DArbitraryFittingApproved:false,photorealismApproved:false,
   donorWriteControlsDisabled:true,
   actualConsumerSavePathUnchanged:true,productionEnabled:false,
   realSignedAccountsVerified:false,releaseAuthorized:false,familyAlpha:'HOLD'});
 };
 const close=()=>cleanup();
 const dispose=()=>{
  if(closed)return;closed=true;
  doc.removeEventListener('visibilitychange',onBackground102);
  doc.removeEventListener('freeze',onFreeze102);
  win.removeEventListener('closet:alpha-session-changed',invalidate);
  win.removeEventListener('pagehide',invalidate);
  doc.getElementById('logout').removeEventListener('click',logout,true);
  cleanup('3D research viewer disposed',{revoke:true});
  selectionObserver89?.disconnect();
  button.remove();status.remove();
 };
 notify('Choose a saved outfit, then preview verified 3D (unsaved edits must be saved).');
 return Object.freeze({open,close,dispose,state,researchOnly:true,releaseAuthorized:false});
}
