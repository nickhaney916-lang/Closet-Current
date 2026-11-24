'use strict';
const nativeLossless04Active=typeof URLSearchParams==='function'&&typeof location!=='undefined'&&new URLSearchParams(location.search).get('nativeLossless04')==='research';
let nativeLossless04=null;
// P99 isolated HOLD: signed-source photo-only viewer is a normal Outfit Builder action.
// No unreviewed admission, research gallery, 3D fitting or release authority.
const mission4Preview1054Active=true;
let mission4Preview1054Viewer=null;
let mission4Preview1054ClickSerial=0,mission4Preview1054Pinned=null;
// M95 research-only: compare the selected owner's exact JPEG strings by
// reference (no duplicate Base64 allocation) and source-review receipts.
// Harmless UI redraws retain a currently verified preview; changing the
// board, photo, reviewed attributes or session still revokes old pixels.
function mission4Preview1054SourceSnapshot(){
 try{
  if(!boardInitialized||!currentBoard?.slots||!Array.isArray(items))return null;
  const selected=[];
  for(const [slot,id] of Object.entries(currentBoard.slots)){
   const row=items.find(item=>item?.id===id);
   if(!row)return null;
   selected.push({slot,id,image:row.image,original:row.originalPhoto?.image,
    details:JSON.stringify([
     row.id,row.ownerId,row.sourceSHA256,row.originalPhoto?.sha256,
     row.originalPhoto?.ownerId,row.ownerReviewed,row.userAdjusted,
     row.sourceHashVerified,row.sourcePhotoOriginal,row.singleGarmentVerified,
     row.category,row.itemType,row.color,row.colorSource,row.confirmedCategory,
     row.confirmedColor,row.sourcePieceKey,row.ownerSourceReview88,
     row.segmentHint?.cutoutSHA256,row.segmentHint?.ownerReviewedInstance,
     row.segmentHint?.verified,row.segmentHint?.clipped,
     row.deleted,row.sourceRevoked
    ])});
  }
  return {board:JSON.stringify(currentBoard),selected};
 }catch{return null;}
}
function mission4Preview1054SameSource(left,right){
 return !!left&&!!right&&left.board===right.board&&
  left.selected.length===right.selected.length&&
  left.selected.every((one,index)=>{
   const two=right.selected[index];
   return one.slot===two.slot&&one.id===two.id&&one.details===two.details&&
    one.image===two.image&&one.original===two.original;
  });
}
// P95: a persisted original may be valid while the native in-memory selected
// JPEG has changed. Never describe persisted pixels as the *current* selection.
// The native viewer remains the authority for owner, DB lease and SHA receipts.
function mission4Preview1054DisplayedExactSource(pinned,photos,count){
 const rendered=Array.from(photos?.querySelectorAll?.('img')||[]);
 if(!Array.isArray(pinned?.selected)||!Number.isSafeInteger(count)||count<1||
    rendered.length!==count||pinned.selected.length!==count)return false;
 const bySlot=new Map(rendered.map(img=>
  [img.getAttribute('alt'),img.getAttribute('src')]));
 return bySlot.size===count&&pinned.selected.every(one=>
  typeof one.original==='string'&&
  bySlot.get('Original saved clothing photograph: '+one.slot)===one.original);
}
function mission4Preview1054ReconcileRedraw(){
 if(!mission4Preview1054Active)return;
 const viewer=mission4Preview1054Viewer;
 const button=document.querySelector('#mission4Preview1054Section button');
 const status=document.getElementById('mission4Preview1054Status');
 let state=null;try{state=viewer?.status;}catch{}
 const unchanged=mission4Preview1054SameSource(
  mission4Preview1054Pinned,mission4Preview1054SourceSnapshot());
 // The previous viewer can still report "visible" for one microtask
 // after a repeat click has replaced its image DOM, but the button already
 // indicates a new in-flight verification. Preserve only when the exact
 // board/source snapshot is unchanged; the refresh still rechecks the
 // signed owner/session, original JPEG SHA and every selected source.
 const checking=button?.disabled===true;
 const visible=state?.phase==='visible'&&state.hasOwnerPhotos===true;
 if(unchanged&&(checking||visible))return;
 const hadPinned=mission4Preview1054Pinned!==null;
 mission4Preview1054Pinned=null;
 if(!hadPinned&&!viewer)return;
 ++mission4Preview1054ClickSerial;
 viewer?.clear();
 if(button)button.disabled=false;
 if(status&&(hadPinned||/verified|Verifying/.test(status.textContent||'')))
  status.textContent='Outfit or saved photo changed. Verify the original clothing photos again.';
}

// M62: explicit DOUBLE opt-in. The ordinary consumer never imports M59 or
// mounts any physical-unit-unverified research gallery.
const mission4PhotoOnly59Active=mission4Preview1054Active&&
 typeof URLSearchParams==='function'&&typeof location!=='undefined'&&
 new URLSearchParams(location.search).get('reviewedPhotoGallery59')==='research';
let mission4PhotoOnly59Viewer=null;
let currentBoard=cleanOutfitBoard({},[]),savedOutfitBoards=[],boardInitialized=false,choosingSlot='shoes';
let boardCommittedDraft=null,boardPendingWrites=0,boardDraftTimer=null,boardStatusSerial=0;
let boardExpectedStoredDraft='null',boardConflictDraft=null;

 // MAIN1054 M33: opt-in native Outfit Builder picker source validation only.
 // The default app keeps its existing behavior until independent acceptance.
 const ownerPicker33Active=!nativeLossless04Active&&typeof URLSearchParams==='function'&&
  typeof location!=='undefined'&&new URLSearchParams(location.search).get('ownerPicker33')==='research';
 // M34 is a SECOND explicit opt-in. Older M33 and normal owner workflow
 // retain their exact behavior; never force a large roster scan on default UI.
 const ownerRevision34Active=ownerPicker33Active&&
  new URLSearchParams(location.search).get('ownerRevision34')==='research';
 let ownerPicker33Serial=0;
 // Observes the local UI roster; not a durable cross-tab database revision.
 // Each M33 write also compares the complete private owner row atomically.
 function ownerPicker33Revision(){
  let hash=2166136261,length=0;
  const rows=Array.isArray(items)?items:[];
  for(const row of rows){
   const words=JSON.stringify([row?.id,row?.ownerId,row?.category,
    row?.itemType,row?.color,row?.sourceSHA256,row?.sourceHashVerified,
    row?.originalPhoto?.sha256,row?.confirmedDetails,
    row?.confirmedDetailsSource31,row?.deleted,row?.sourceRevoked]);
   length+=words.length;
   for(let i=0;i<words.length;i++)hash=Math.imul(hash^words.charCodeAt(i),16777619)>>>0;
  }
  return 'm33-'+rows.length+'-'+length+'-'+hash.toString(16).padStart(8,'0');
 }
 async function ownerPicker33Gate(){
  if(!ownerPicker33Active||typeof currentPhotoOwnerSession167!=='function'||
     typeof readAllFrom!=='function')throw Error('M33 signed source unavailable');
  const mod=await import('../research/main1054-picker33/native-picker-bridge.mjs');
  return mod.createNativeOutfitPicker33({
   getSession:currentPhotoOwnerSession167,
   getRevision:ownerPicker33Revision,getBoard:()=>currentBoard,
   durableRoster34:ownerRevision34Active,
   readOwnerItems:async scope=>{
    scope.assertCurrent();
    const rows=await readAllFrom(scope.privateDbRef);
    scope.assertCurrent();return rows;
   }
  });
 }
 async function ownerPicker33Choose(slotId,itemId,button,lease,{closePicker=false}={}){
  const serial=++ownerPicker33Serial;
  if(!lease?.current()||!button?.isConnected)return false;
  let gate;
  const before=structuredClone(currentBoard),stamp=JSON.stringify(currentBoard);
  button.disabled=true;
  try{
   gate=await ownerPicker33Gate();
   if(serial!==ownerPicker33Serial||!lease.current()||!button.isConnected)return false;
   const decision=await gate.authorize(slotId,itemId);
   if(serial!==ownerPicker33Serial||!lease.current()||!button.isConnected||
      JSON.stringify(currentBoard)!==stamp)return false;
   if(decision.status!=='authorized-for-immediate-2d-selection-only'){
    $('boardSaveStatus').textContent='Review this garment and original photo in My Closet, then reopen the outfit picker.';
    return false;
   }
   const pending=selectBoardPiece(slotId,itemId);
   const candidate=JSON.stringify(currentBoard);
   const saved=await pending;
   if(!lease.current())return false;
   if(!saved){
    if(JSON.stringify(currentBoard)===candidate){
     currentBoard=before;renderOutfitBoard();
    }
    $('boardSaveStatus').textContent='Outfit not saved. This garment or private source changed; reopen the picker.';
    return false;
   }
   if(closePicker&&$('boardPicker').open)$('boardPicker').close();
   return true;
  }catch{
   if(lease.current())$('boardSaveStatus').textContent='Owner/source verification unavailable. Outfit unchanged; reopen the picker.';
   return false;
  }finally{
   try{gate?.dispose();}catch{}
   if(lease.current()&&button.isConnected)button.disabled=false;
  }
 }

function nativeLossless04Notify(error){
 // Raw storage/auth exceptions can contain private original-photo metadata.
 const value=typeof error==='string'?error:
  'The private outfit action could not finish. Reopen Outfit Builder and try again.';
 $('boardSaveStatus').textContent='Research safety: '+value;
}
function nativeLossless04Edit(call){
 const lease=beginOwnerBoardUiLease(),consumer=nativeLossless04;
 if(!lease||!consumer||!consumer.status().active)return;
 try{call();}catch(error){
  if(lease.current()&&nativeLossless04===consumer)nativeLossless04Notify(error);
 }
}
function nativeLossless04ClearPreview(){
 $('boardSlots').replaceChildren();$('savedBoards').replaceChildren();
 $('boardPickerItems').replaceChildren();$('boardOwnedOptions').replaceChildren();
 $('boardRecommendations').replaceChildren();
 if($('boardPicker').open)$('boardPicker').close();
}
function boardLink(text,url,className='textlink'){const a=node('a',text,className);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function boardBackup(){
 // Export is a private read: never return a previous owner's outfit state
 // to a guest or a newly signed account even when a button was retained.
 const lease=beginOwnerBoardUiLease();
 if(!lease)throw Error('Private outfit export requires a verified owner session');
 if(nativeLossless04Active){
  if(!nativeLossless04||!nativeLossless04.status().active)
   throw Error('Private outfit export requires an active owner session');
  const snapshot=nativeLossless04.readOnlySnapshot();
  if(!lease.current())throw Error('Private owner session changed during export');
  return snapshot;
 }
 const snapshot={current:structuredClone(currentBoard),saved:structuredClone(savedOutfitBoards)};
 if(!lease.current())throw Error('Private owner session changed during export');
 return snapshot;
}
function boardHasUnsavedDraft(){
 return !nativeLossless04Active&&boardInitialized&&Boolean(db)&&
  (boardDraftTimer!==null||boardPendingWrites>0||Boolean(boardConflictDraft)||boardCommittedDraft!==JSON.stringify(currentBoard));
}
// The private transaction checks owner identity; asynchronous board UI
// completion must independently retain the *exact* initiating login.
function beginOwnerBoardUiLease(){
 const auth=window.closetAuth,owner=auth?.user?.id,ownerDB=db,
  epoch=captureOperationEpoch;
 const current=()=>{
  if(typeof owner!=='string'||!owner||
     window.closetAuth!==auth||auth.user?.id!==owner||
     db!==ownerDB||ownerDB?.name!=='closet-current-user-'+owner||
     epoch!==captureOperationEpoch||
     $('authGate')?.hidden!==true||$('appShell')?.hidden!==false)return false;
  try{auth.assertCurrent?.();return true;}catch{return false;}
 };
 return current()?{current}:null;
}
// Native BOARD04 may emit callbacks before it finishes loading. Pin them to
// the originating signed owner and to the exact controller once mounted.
function beginNativeBoardMountLease(){
 const lease=beginOwnerBoardUiLease();
 if(!lease)return null;
 let controller=null;
 const current=()=>lease.current()&&(!controller||nativeLossless04===controller);
 return {
  current,
  bind(value){controller=value;},
  onChange(value,{revoked}={}){
   if(!current())return;
   window.nativePhotoReadiness08Bridge?.clear();
   if(revoked){currentBoard=cleanOutfitBoard({},[]);savedOutfitBoards=[];
    nativeLossless04ClearPreview();return;}
   if(value){currentBoard=value;
    if(nativeLossless04&&nativeLossless04.status().active){
     savedOutfitBoards=nativeLossless04.readOnlySnapshot().saved;
     if(boardInitialized){syncBoardInputs();renderOutfitBoard();}
    }
   }
  },
  onStatus(message){
   if(current())$('boardSaveStatus').textContent=message;
  }
 };
}
// MASTER1054: delayed optional panels belong to the initiating active controller.
// An unchanged owner lease alone does not mean its controller is still usable.
function publishNative04OwnerPanel(lease,consumer,panel,bridgeName){
 let current=false;
 try{current=!!lease?.current()&&nativeLossless04===consumer&&
  consumer?.status?.().active===true;}catch{}
 if(!current){
  try{panel?.dispose?.();}catch{}
  return false;
 }
 window[bridgeName]=panel;
 return true;
}
function boardDraftStatus(text,retry=false){
 $('boardSaveStatus').textContent=text;$('retryBoardDraft').hidden=!retry;
 const actions=$('boardDraftConflictActions');if(actions)actions.hidden=!boardConflictDraft;
}
function cancelBoardDraftTimer(){clearTimeout(boardDraftTimer);boardDraftTimer=null;}
function scheduleBoardDraftSave(){
 cancelBoardDraftTimer();++boardStatusSerial;
 boardDraftStatus('Unsaved changes · saving shortly…');
 const scheduledDB=db,scheduledAuth=window.closetAuth,
  scheduledOwner=scheduledAuth?.user?.id,scheduledEpoch=captureOperationEpoch;
 boardDraftTimer=setTimeout(()=>{
  boardDraftTimer=null;
  // Old timer cannot show a warning in a newer owner's board.
  if(db!==scheduledDB||window.closetAuth!==scheduledAuth||
     scheduledAuth?.user?.id!==scheduledOwner||
     captureOperationEpoch!==scheduledEpoch)return;
  try{scheduledAuth?.assertCurrent?.();}catch{return;}
  void storeBoard();
 },250);
}
window.addEventListener('beforeunload',event=>{
 if(boardHasUnsavedDraft()){event.preventDefault();event.returnValue='';}
});
window.addEventListener('closet:session-locked',()=>{
 if(typeof ownerPicker33Serial!=='undefined')++ownerPicker33Serial;
 cancelBoardDraftTimer();++boardStatusSerial;boardConflictDraft=null;$('retryBoardDraft').hidden=true;
 const actions=$('boardDraftConflictActions');if(actions)actions.hidden=true;
 // The default private Outfit Builder carries owner names, garment IDs and
 // stored outfit summaries too. Scrub BOTH modes synchronously at AUTH36 lock,
 // without touching the signed owner's durable wardrobe or unsaved originals.
 const nativeMode=nativeLossless04Active;
 if(nativeMode)nativeLossless04=null;
 currentBoard=cleanOutfitBoard({},[]);
 savedOutfitBoards=[];
 boardCommittedDraft=JSON.stringify(currentBoard);
 boardExpectedStoredDraft='null';
 choosingSlot='shoes';
 syncBoardInputs();
 nativeLossless04ClearPreview();
 // Synchronously clear even unverified original-source research previews
 // before another authenticated account can see the builder DOM.
 try{mission4PhotoOnly59Viewer?.dispose();}catch{}
 mission4PhotoOnly59Viewer=null;
 $('boardSummary').textContent='Private outfits locked · sign in again.';
 $('boardGapStatus').textContent='';
 $('boardPickerTitle').textContent='Choose clothing after sign-in';
 if(nativeMode){
  // Retire the controller BEFORE disposal: old callbacks cannot republish.
  // Research-only preview bridges may retain private source JPEG context.
  for(const key of ['native3D05Bridge','nativePhotoReadiness08Bridge',
                    'styleOwnedLive03Bridge','nativeMobile09Bridge',
                    'nativeLossless04Bridge']){
   const bridge=window[key];
   window[key]=null;
   try{bridge?.dispose?.();}catch{}
  }
 }
 $('boardSaveStatus').textContent='Signed-out private outfit cleared. Reopen Outfit Builder.';
});
async function persistBoardState({appendSaved=null,replaceSaved=null,replaceDraft=null,expectedClothing=null,replaceCurrent=null}={}){
 if(nativeLossless04Active)throw Error('Unsafe native outfit write blocked; use lossless Save changes or Save outfit');
 if(!db){$('boardSaveStatus').textContent='Browser storage is unavailable. Keep this page open.';throw Error('Browser storage is unavailable.');}
 const ownerDB=db,auth=window.closetAuth,owner=auth?.user?.id;
 const assertOwner=()=>{
  auth?.assertCurrent?.();
  if(!owner||window.closetAuth!==auth||auth.user?.id!==owner||db!==ownerDB||ownerDB.name!=='closet-current-user-'+owner||
     (replaceDraft&&(replaceDraft.ownerDB!==ownerDB||replaceDraft.auth!==auth||replaceDraft.owner!==owner)))
   throw Error('Your account changed. Reopen your closet before saving this outfit.');
 };
 assertOwner();
 const current=structuredClone(replaceCurrent===null?currentBoard:replaceCurrent),candidate=appendSaved?structuredClone(appendSaved):null,
  replacement=replaceSaved===null?null:structuredClone(replaceSaved);
 let proof33=null,picker33Gate=null;
 if(typeof ownerPicker33Active!=='undefined'&&ownerPicker33Active){
  try{
   picker33Gate=await ownerPicker33Gate();
   assertOwner();
   proof33=await picker33Gate.prepareWrite(current);
   assertOwner();
   if(candidate&&(Object.keys(candidate.slots).length!==Object.keys(current.slots).length||
     Object.entries(candidate.slots).some(([slot,id])=>current.slots[slot]!==id)))
    throw outfitWardrobeChanged();
  }catch{
   try{picker33Gate?.dispose();}catch{}
   throw outfitWardrobeChanged();
  }
 }
 ++boardPendingWrites;
 try{await queued(()=>new Promise((resolve,reject)=>{
  assertOwner();proof33?.assertCurrent();
  const draftSlots=replacement===null?Object.entries(current.slots):[];
  const draftStores=draftSlots.length?['state','items']:'state';
  const tx=ownerDB.transaction(candidate||proof33?['state','items']:draftStores,'readwrite'),store=tx.objectStore('state');
  let failure,saved,keepStoredDraft=false;
  if(candidate||proof33)for(const [slotId,id]of Object.entries(candidate?.slots||current.slots)){
   const selected=tx.objectStore('items').get(id);
   selected.onsuccess=()=>{try{
    assertOwner();proof33?.assertCurrent();
    const row=selected.result,slot=outfitSlots.find(x=>x.id===slotId),
     expected=expectedClothing?.[id],actual=row?outfitSavedItemFacts(row):null;
    if(!row||!slot||!slotAllows(slot,normalizeClothing(row))||
       (row.ownerId&&row.ownerId!==owner)||proof33&&!proof33.matches(id,row)||
       candidate&&(!expected||!actual||expected.length!==actual.length||
         !expected.every((v,i)=>v===actual[i])))
     throw outfitWardrobeChanged();
   }catch(error){failure=error;tx.abort();}};
  }
  if(proof33?.durableContentChecked){
   // This read and the outfit state put share one exclusive IDB transaction.
   // Every item—including unrelated rows and source edits by another tab—
   // must equal the last preverified durable private wardrobe snapshot.
   const roster=tx.objectStore('items').getAll();
   roster.onsuccess=()=>{try{
    assertOwner();proof33.assertCurrent();
    if(!proof33.matchesRoster(roster.result))throw outfitWardrobeChanged();
   }catch(error){failure=error;tx.abort();}};
  }
  const request=store.get('outfit-board');
  request.onsuccess=()=>{try{
   assertOwner();proof33?.assertCurrent();
   const observed=JSON.stringify(request.result?.current??null),expected=replaceDraft?replaceDraft.stored:boardExpectedStoredDraft;
   if(replacement===null&&observed!==expected){
    boardConflictDraft={ownerDB,auth,owner,stored:observed};
    if(!candidate){const error=Error('Another tab changed this outfit draft.');error.code='OUTFIT_DRAFT_CONFLICT';throw error;}
    keepStoredDraft=true;
   }
   // Read the committed roster INSIDE this transaction. Other tabs and queued
   // autosaves cannot persist speculative saves or erase successful appends.
   saved=structuredClone(replacement===null?(request.result?.saved||[]):replacement);
   if(!Array.isArray(saved)||saved.length>50)throw Error('Saved outfit storage needs review. Reload your closet.');
   if(candidate){if(saved.length>=50)throw Error('You can save up to 50 outfits.');saved.push(candidate);}
   const put=()=>store.put({id:'outfit-board',current:keepStoredDraft?(request.result?.current??null):current,saved});
   if(keepStoredDraft||!draftSlots.length){put();return;}
   // Validate the draft actually being published, even when no named outfit
   // is being saved. The items lock orders this check with garment deletion.
   let remaining=draftSlots.length;
   for(const [slotId,id] of draftSlots){
    const selected=tx.objectStore('items').get(id);
    selected.onsuccess=()=>{try{
     assertOwner();proof33?.assertCurrent();
     const row=selected.result,slot=outfitSlots.find(x=>x.id===slotId);
     if(!row||!slot||(row.ownerId&&row.ownerId!==owner)||!slotAllows(slot,normalizeClothing(row)))
      throw outfitWardrobeChanged();
     if(--remaining===0)put();
    }catch(error){failure=error;tx.abort();}};
   }
  }catch(error){failure=error;tx.abort();}};
  tx.oncomplete=()=>{try{assertOwner();proof33?.assertCurrent();proof33?.consume();savedOutfitBoards=structuredClone(saved);if(!keepStoredDraft){boardCommittedDraft=JSON.stringify(current);boardExpectedStoredDraft=JSON.stringify(current);boardConflictDraft=null;}resolve();}catch(error){reject(error);}};
  tx.onerror=tx.onabort=()=>reject(failure||tx.error||Error('Could not save this outfit.'));
 }));}finally{--boardPendingWrites;try{picker33Gate?.dispose();}catch{}}
}
function outfitSavedItemFacts(item){
 const row=normalizeClothing(item);
 // M76: the atomic save must reject a same-owner source-review/mask change
 // even when the JPEG thumbnail, name and category remain identical. This
 // fingerprint is compared again against the durable IDB item inside the
 // outfit write transaction. Never infer 3D fitness from owner review.
 // Preserve full original JPEG *references* (no extra image copy/rehash);
 // stringify only bounded source/receipt metadata.
 return [row.id,row.ownerId||null,row.category,row.itemType,row.color,row.colorSource,
  row.pattern,row.sleeveLength,row.fit,row.material,row.occasion,
  [...row.seasons].sort().join('|'),row.image,row.sourceSHA256,
  row.sourcePieceKey,row.originalPhoto?.image,row.originalPhoto?.sha256,
  row.photoOnly===true,row.sourceHashVerified===true,
  row.sourceCropReviewed===true,row.ownerReviewed===true,
  row.sourcePhotoOriginal===true,row.singleGarmentVerified===true,
  row.independentPhysicalItemVerified===true,row.threeDReady===true,
  row.segmentHint?.clipped===true,row.segmentHint?.verified===true,
  row.segmentHint?.rawMaskPixelsIndependentlyVerified===true,
  JSON.stringify(row.cropBounds??null),
  row.reconciliation70Status??null,row.reconciliation70?.maskSha256??null,
  row.shoePair?.companion?.reconciliation70?.maskSha256??null,
  row.combinedFragments70?.companion?.reconciliation70?.maskSha256??null,
  JSON.stringify(row.ownerSourceReview88??null)];
}
function outfitWardrobeChanged(){
 const error=Error('Selected clothing changed in another tab. Refresh your closet and create this outfit again.');
 error.code='OUTFIT_WARDROBE_CHANGED';return error;
}
async function saveOwnedOutfit(board){
 const saved=cleanOutfitBoard(structuredClone(board),items);
 if(Object.entries(board?.slots||{}).some(([slot,id])=>id&&saved.slots[slot]!==id))throw outfitWardrobeChanged();
 if(!Object.keys(saved.slots).length)throw Error('Choose at least one piece from your own closet first.');
 const expectedClothing=Object.fromEntries(Object.values(saved.slots).map(id=>[id,outfitSavedItemFacts(items.find(row=>row.id===id))]));
 await persistBoardState({appendSaved:saved,expectedClothing});
}
async function refreshSavedWardrobeForOutfits(){
 if(nativeLossless04Active)throw Error('Use the private research wardrobe refresh in this mode.');
 const ownerDB=db,auth=window.closetAuth,owner=auth?.user?.id;
 const assertOwner=()=>{auth?.assertCurrent?.();if(!owner||db!==ownerDB||window.closetAuth!==auth||auth.user?.id!==owner||ownerDB?.name!=='closet-current-user-'+owner)throw Error('Your account changed. Reopen your closet.');};
 assertOwner();await writes;assertOwner();
 const rows=await new Promise((resolve,reject)=>{const r=ownerDB.transaction('items').objectStore('items').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 assertOwner();items=rows.map(normalizeClothing);
 if(typeof styledCollectionResults!=='undefined')styledCollectionResults=[];
 $('refreshOutfitWardrobe').hidden=true;
 if(typeof refreshStylistFocusItems==='function')refreshStylistFocusItems();
 render();$('stylistStatus').textContent='Closet refreshed. Create outfits again using your current clothing.';
 boardDraftStatus('Closet refreshed. Review your selected pieces before saving.');
}
async function storeBoard({replaceDraft=null}={}){
 const lease=beginOwnerBoardUiLease();
 if(!lease)return false;
 cancelBoardDraftTimer();const serial=++boardStatusSerial;
 boardDraftStatus('Saving outfit changes…');
 try{
  await persistBoardState({replaceDraft});
  if(!lease.current())return false;
  renderSavedOutfitBoards();
  if(serial===boardStatusSerial)boardDraftStatus(boardHasUnsavedDraft()?
   'Newer changes are waiting to save.':'Outfit changes saved on this device.');
  return true;
 }catch(error){
  if(!lease.current()||serial!==boardStatusSerial)return false;
  if(error?.code==='OUTFIT_DRAFT_CONFLICT'){
   boardDraftStatus('Another tab changed this outfit draft. Your changes are still here. Load latest replaces your unsaved changes, or choose Save my draft instead.');
   return false;
  }
  if(error?.code==='OUTFIT_WARDROBE_CHANGED'){
   $('refreshOutfitWardrobe').hidden=false;
   boardDraftStatus('Selected clothing changed. Refresh your closet, then review and save this draft. Your draft is still here.');
   return false;
  }
  boardDraftStatus('This outfit could not be saved. Your changes are still here. Retry saving changes before leaving.',true);
  return false;
 }
}
async function loadLatestBoardDraft(){
 cancelBoardDraftTimer();const serial=++boardStatusSerial;
 const ownerDB=db,auth=window.closetAuth,owner=auth?.user?.id,
  epoch=captureOperationEpoch,local=JSON.stringify(currentBoard);
 const assertOwner=()=>{auth?.assertCurrent?.();if(!owner||db!==ownerDB||
  window.closetAuth!==auth||auth.user?.id!==owner||
  epoch!==captureOperationEpoch||ownerDB?.name!=='closet-current-user-'+owner)
  throw Error('Your account changed. Reopen your closet.');};
 assertOwner();
 const state=await queued(()=>{assertOwner();return new Promise((resolve,reject)=>{const r=ownerDB.transaction('state').objectStore('state').get('outfit-board');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});});
 assertOwner();
 if(serial!==boardStatusSerial||local!==JSON.stringify(currentBoard))throw Error('Your draft changed while loading. Try Load latest again.');
 currentBoard=cleanOutfitBoard(state?.current||{},items);savedOutfitBoards=(state?.saved||[]).map(x=>cleanOutfitBoard(x,items));
 boardExpectedStoredDraft=JSON.stringify(state?.current??null);boardCommittedDraft=JSON.stringify(currentBoard);boardConflictDraft=null;
 syncBoardInputs();renderOutfitBoard();boardDraftStatus('Latest outfit draft loaded.');
}
function syncBoardInputs(){for(const [id,key]of Object.entries({boardName:'name',boardOccasion:'occasion',boardSeason:'season',boardAudience:'audience',boardSize:'size',boardBudget:'budget'}))$(id).value=currentBoard[key]||'';}
function selectBoardPiece(slotId,itemId){
 if(nativeLossless04Active){
  nativeLossless04Edit(()=>nativeLossless04.setSlot(slotId,itemId||null));
  return Promise.resolve(false);
 }
 delete currentBoard.ideas[slotId];
 for(const key of Object.keys(currentBoard.slots))if(currentBoard.slots[key]===itemId)delete currentBoard.slots[key];
 if(itemId)currentBoard.slots[slotId]=itemId;else delete currentBoard.slots[slotId];
 currentBoard=cleanOutfitBoard(currentBoard,items);renderOutfitBoard();return storeBoard();
}
// M73: identical provenance cue on the selected native outfit card and
// on the owner-private photo picker BEFORE the item is selected. An edited
// crop or claimed single-piece flag is not independent geometry/3D evidence.
function boardPhotoRequiresUnitReview(item){
 // M76: no independent, source-bound physical-unit/mask/3D admission receipt
 // is consumed by this normal owner 2D board. An absent P88 review receipt
 // is NOT affirmative physical proof; imported/editable positive flags and
 // model predictions cannot hide the 2D original-photo warning either.
 // Future trusted admission must check its own live owner/source/revision
 // contract here, not accept the existing optimistic garment booleans.
 return !!item;
}
// M74: Mission 1 owner-source-review/v1 is an owner DECISION record, never
// independent proof of a physical unit, a sound pixel mask, or fitted 3D.
// Show that difference in the normal UI only when the live owner's entire
// locally available receipt still refers to the SAME saved source/crop.
// No private JPEG bytes or owner receipt are sent to other services.
function boardHasMatchingOwnerSourceReview88(item){
 const r=item?.ownerSourceReview88,owner=window.closetAuth?.user?.id,
  companion=item?.shoePair?.companion||item?.combinedFragments70?.companion,
  companionMask=companion?.reconciliation70?.maskSha256||null;
 if(!item||!r||typeof r!=='object'||Array.isArray(r)||!owner||
    db?.name!=='closet-current-user-'+owner||
    item.ownerId!==owner||r.schema!=='p88-owner-source-review/v1'||
    r.ownerId!==owner||r.itemId!==item.id||
    r.sourceId!==item.outfitSourceId||
    r.originalPhotoSha256!==item.sourceSHA256||
    item.originalPhoto?.sha256!==item.sourceSHA256||
    !/^[a-f0-9]{64}$/.test(item.sourceSHA256||'')||
    !/^[a-f0-9]{64}$/.test(r.derivedImageSha256||'')||
    r.derivedImageBytesVerified!==true||
    r.selectedMaskSha256!==item.reconciliation70?.maskSha256||
    !/^[a-f0-9]{64}$/.test(r.selectedMaskSha256||'')||
    r.companionMaskSha256!==companionMask||
    r.companionImageBytesVerified!==Boolean(companion)||
    (companion?!/^[a-f0-9]{64}$/.test(r.companionImageSha256||''):
      r.companionImageSha256!==null)||
    r.physicalUnitDecision!==item.reconciliation70Status||
    r.category!==item.category||r.itemType!==(item.itemType||'Unknown')||
    r.color!==item.color||
    JSON.stringify(r.cropBounds??null)!==JSON.stringify(item.cropBounds??null)||
    r.ownerReviewed!==true||r.sourcePhotoOriginal!==true||
    r.rawMaskPixelsIndependentlyVerified!==false||
    r.independentPhysicalItemVerified!==false||
    r.singleGarmentVerified!==false||r.threeDReady!==false)
  return false;
 return true;
}
function boardPhotoSourceNotice88(item){
 // A valid owner-review receipt changes wording only. Never change the
 // default 2D/unverified class or 3D admission based on this metadata.
 return boardHasMatchingOwnerSourceReview88(item)?
  'Owner-reviewed photo · independent garment outline unverified':
  'Photo reference only · garment outline unverified';
}
function boardPhotoSourceAria88(item){
 return boardHasMatchingOwnerSourceReview88(item)?
  'Owner-reviewed photo; physical garment outline not independently verified':
  'Photo reference only; individual garment outline unverified';
}
function openBoardPicker(slotId){
 // A picker can remain queued or be retained by an old card after sign-out.
 // Its clothing thumbnails belong to the exact session that opened it.
 const pickerLease=beginOwnerBoardUiLease();
 if(!pickerLease)return;
 choosingSlot=slotId;const slot=outfitSlots.find(s=>s.id===slotId);$('boardPickerTitle').textContent='Choose '+slot.label.toLowerCase();
 const grid=$('boardPickerItems');grid.replaceChildren();const options=items.filter(item=>slotAllows(slot,item));
 if(!options.length){grid.append(node('p','No saved pieces for this space yet. Add clothes or adjust their category in My closet.'));const add=node('button','Add clothing photos','secondary');add.onclick=()=>{if(!pickerLease.current()||add.isConnected===false)return;
  $('boardPicker').close();switchView('scan');};grid.append(add);}
 for(const item of options){const b=node('button',null,'board-pick');b.type='button';const im=node('img');im.src=item.image;im.alt=item.name;b.append(im,node('strong',item.name||'Closet piece'),node('span',[item.itemType,item.color].filter(x=>x&&x!=='Unknown').join(' · ')));
  // Keep styling a source-only image possible; never imply a 3D-ready mask.
  if(boardPhotoRequiresUnitReview(item)){
   b.classList.add('source-unverified');
   b.append(node('small',boardPhotoSourceNotice88(item)));
   b.setAttribute('aria-label',(item.name||'Closet piece')+
    ' · '+boardPhotoSourceAria88(item)+'. Select for 2D outfit');
  }
  b.onclick=()=>{
   if(!pickerLease.current()||b.isConnected===false||!items.includes(item))return;
   if(typeof ownerPicker33Active!=='undefined'&&ownerPicker33Active){void ownerPicker33Choose(slotId,item.id,b,pickerLease,{closePicker:true});return;}
   selectBoardPiece(slotId,item.id);$('boardPicker').close();
  };grid.append(b);}
 $('boardPicker').showModal();
}
function renderOutfitBoard(){
 // M95: only a changed source/board revokes owner-private original pixels.
 if(mission4PhotoOnly59Active)mission4PhotoOnly59Viewer?.clear();
 if(!boardInitialized){mission4Preview1054ReconcileRedraw();return;}
 if(nativeLossless04Active){
  if(!nativeLossless04||!nativeLossless04.status().active){
   mission4Preview1054Pinned=null;mission4Preview1054ReconcileRedraw();
   nativeLossless04ClearPreview();$('boardSummary').textContent='Private saved outfits locked · sign in again';return;
  }
  currentBoard=nativeLossless04.view();
 }else currentBoard=cleanOutfitBoard(currentBoard,items);
 mission4Preview1054ReconcileRedraw();
 const top=items.find(x=>x.id===currentBoard.slots.top),dress=top?.category==='Dresses';
 $('outfitFigure').classList.toggle('has-outer-coat',currentBoard.layerCount>=3);const slots=$('boardSlots');slots.replaceChildren();
 for(const slot of outfitSlots){
  if((!nativeLossless04Active&&dress&&slot.level)||slot.extra&&currentBoard.layerCount<slot.level)continue;
  const item=items.find(x=>x.id===currentBoard.slots[slot.id]),idea=currentBoard.ideas[slot.id],covered=dress&&slot.id==='bottom';
  const retainedId=nativeLossless04Active&&!item?currentBoard.slots[slot.id]:null;
  const needsReview=nativeLossless04Active&&item&&!slotAllows(slot,item);
  // M70: selecting an owner-reviewed crop is NOT evidence of one independently
  // verified physical garment. Keep the normal native Outfit Builder useful,
  // but make the 2D source-only limitation visible without opening research UI.
  const unverifiedPhysicalUnit=boardPhotoRequiresUnitReview(item);
  const b=node('button',null,'board-slot board-slot-'+slot.id+(item?' owned':retainedId?' missing':idea?' planned':' blank')+(needsReview?' review':'')+(unverifiedPhysicalUnit?' source-unverified':'')+(covered?' covered':'')+(dress&&slot.id==='top'?' dress':''));b.type='button';b.disabled=covered;b.setAttribute('aria-label',covered?'Bottoms covered by your dress':slot.label+': '+(needsReview?'Category needs review · ':'')+(item?.name||(retainedId?'Missing original '+retainedId:idea?idea.color+' '+idea.type:'empty'))+(unverifiedPhysicalUnit?' · '+boardPhotoSourceAria88(item):'')+'. Choose a piece');
  b.append(node('span',slot.label,'slot-label'));
  if(item){const im=node('img');im.src=item.image;im.alt=item.name;b.append(im,node('span',item.name||item.itemType,'slot-name'));
   if(unverifiedPhysicalUnit)b.append(node('small',boardPhotoSourceNotice88(item)));
   if(needsReview)b.append(node('small','Review category · original reference kept'));}
  else if(retainedId)b.append(node('span','Missing saved clothing','slot-name'),node('small','Original ID retained · replace this piece'));
  else if(covered)b.append(node('span','Covered by dress','slot-name'));
  else if(idea)b.append(node('span',idea.color+' '+idea.type,'slot-idea'),node('small','Shopping idea · not owned'));
  else b.append(node('span','+','slot-plus'),node('small',slot.optional?'Optional space':'Choose or find a piece'));
  b.onclick=()=>openBoardPicker(slot.id);slots.append(b);
 }
 const count=Object.keys(currentBoard.slots).length,gaps=boardGaps(currentBoard,items);$('boardSummary').textContent=count+' of your own pieces selected · '+gaps.length+' open spaces'+(dress?' · dress covers top and bottoms':'');
 renderBoardSuggestions();renderSavedOutfitBoards();if(typeof renderClosetBrowser==='function')renderClosetBrowser();
}
function renderBoardSuggestions(){
 // Each private suggestion originates from a specific signed owner/DB epoch.
 // Its click may fire after sign-out, same-ID re-login, or a stale DOM rerender.
 const suggestionLease=beginOwnerBoardUiLease(),suggestionConsumer=nativeLossless04;
 const suggestionsCurrent=()=>suggestionLease?.current()&&
  (!nativeLossless04Active||(nativeLossless04===suggestionConsumer&&
   suggestionConsumer?.status?.().active===true));
 const target=$('boardTarget').value||'shoes',slot=outfitSlots.find(s=>s.id===target),owned=closetGapOptions(target,currentBoard,items).slice(0,3);
 $('boardGapStatus').textContent=(['bag','accessory','finish'].includes(target)?'Optional finishing ideas. No accessory photos are needed. ':'')+(currentBoard.slots[target]?'Alternatives for your '+slot.label.toLowerCase()+'. ':'Ideas for the '+slot.label.toLowerCase()+' space. ')+(owned.length?'Try a piece you already own first.':'Compare the directions below, then open a purchase source.');
 const ownGrid=$('boardOwnedOptions');ownGrid.replaceChildren();
 for(const item of owned){const b=node('button',null,'board-owned-pick');b.type='button';const im=node('img');im.src=item.image;im.alt=item.name;b.append(im,node('span','Already in your closet'),node('strong',item.name),node('small','Use this piece'));
  // This owner-private alternatives button bypasses the modal picker.
  // Disclose the same source uncertainty before applying the garment.
  if(boardPhotoRequiresUnitReview(item)){
   b.classList.add('source-unverified');
   b.append(node('small',boardPhotoSourceNotice88(item)));
   b.setAttribute('aria-label',(item.name||'Closet piece')+
    ' · '+boardPhotoSourceAria88(item)+'. Use for a 2D outfit');
  }
  b.onclick=()=>{
  if(!suggestionsCurrent()||b.isConnected===false||
     ($('boardTarget').value||'shoes')!==target||!items.includes(item))return;
  if(typeof ownerPicker33Active!=='undefined'&&ownerPicker33Active){void ownerPicker33Choose(target,item.id,b,suggestionLease);return;}
  selectBoardPiece(target,item.id);
 };ownGrid.append(b);}
 const grid=$('boardRecommendations');grid.replaceChildren();
 if((target==='bottom'||(!nativeLossless04Active&&slot.level))&&items.find(x=>x.id===currentBoard.slots.top)?.category==='Dresses'){$('boardGapStatus').textContent='Choose shoes or optional finishing ideas for your dress.';ownGrid.replaceChildren();return;}
 for(const idea of wardrobeGapIdeas(target,currentBoard,items)){
  const card=node('article',null,'gap-idea-card');card.append(node('p',idea.trendSource?'TREND-INSPIRED DIRECTION':'STYLING DIRECTION','eyebrow'),node('h3',idea.color+' '+(idea.label||idea.type)),node('p',idea.reason));
  if(idea.trendSource)card.append(boardLink('Read the magazine reference',idea.trendSource.url));
  const preview=node('button','Try this idea on the board','secondary');preview.type='button';preview.onclick=()=>{
   if(!suggestionsCurrent()||preview.isConnected===false||
      ($('boardTarget').value||'shoes')!==target)return;
   if(nativeLossless04Active)return nativeLossless04Edit(()=>suggestionConsumer.setIdea(target,idea));
   delete currentBoard.slots[target];currentBoard.ideas[target]={type:idea.type,color:idea.color};
   renderOutfitBoard();storeBoard();
  };card.append(preview);
  for(const example of idea.examples){const box=node('div',null,'product-example');box.append(node('small','PRODUCT EXAMPLE · CHECK SIZE / COLOR'),boardLink(example.name,example.url,'shop-link'),node('p',(Number.isFinite(example.priceAtCheck)?'Price at check: $'+example.priceAtCheck:'Price not confirmed')+' · '+trendLibraryDate(example.checkedAt||activeTrendLibrary?.updatedAt||'2026-10-12')+'. Confirm current price, color and size.','fine'));card.append(box);}
  for(const retailer of idea.retailerLinks||[])card.append(boardLink('Browse '+retailer.name,retailer.url,'shop-link'));
  card.append(boardLink('Compare stores for this piece',idea.shoppingUrl,'shop-link'),node('p','Search: '+idea.query,'fine'));grid.append(card);
 }
}
function renderSavedOutfitBoards(){
 const grid=$('savedBoards');grid.replaceChildren();
 // Bind saved outfit cards to the owner who produced their labels and IDs.
 // A stale click must not select a former owner's outfit in a new session.
 const savedListLease=nativeLossless04Active?null:beginOwnerBoardUiLease();
 if(!nativeLossless04Active&&!savedListLease)return;
 if(!savedOutfitBoards.length){grid.append(node('p','Save a combination to return to it later.'));return;}
 for(const [index,value] of savedOutfitBoards.entries()){
  const label=(value.name||'My outfit')+(nativeLossless04Active&&Object.values(value.slots||{}).some(id=>!items.find(x=>x.id===id))?' · missing piece':'');
  const b=node('button',label,'secondary');b.type='button';
  b.onclick=()=>{
   if(nativeLossless04Active)return nativeLossless04Edit(()=>nativeLossless04.selectSaved(index));
   if(!savedListLease?.current()||b.isConnected===false||
      savedOutfitBoards[index]!==value)return;
   currentBoard=cleanOutfitBoard(value,items);syncBoardInputs();renderOutfitBoard();storeBoard();
  };grid.append(b);
 }
}
async function importBoardBackup(value){
 if(nativeLossless04Active)
  throw Error('Native backup import blocked in lossless research mode; atomic items/outfit restore is not yet accepted');
 // Legacy v1–v3 outfit restore must never publish a previous signed owner's
 // data into a new account during a delayed startup or private IDB write.
 const lease=beginOwnerBoardUiLease();
 if(!lease)throw Error('Sign in again before restoring private outfits.');
 if(!boardInitialized)await outfitBoardReady;
 if(!lease.current())throw Error('Your account changed. Restart this outfit restore.');
 if(!value||!Array.isArray(value.saved)||value.saved.length>50)
  throw Error('Invalid outfit board backup.');
 // Keep proposed private names, source IDs and garment selections off-screen
 // until the exact signed owner transaction has committed successfully.
 const incomingCurrent=cleanOutfitBoard(value.current,items),
  incomingSaved=value.saved.map(board=>cleanOutfitBoard(board,items));
 if(!lease.current())throw Error('Your account changed. Restart this outfit restore.');
 await persistBoardState({replaceSaved:incomingSaved,replaceCurrent:incomingCurrent});
 if(!lease.current())return;
 currentBoard=incomingCurrent;
 savedOutfitBoards=incomingSaved;
 syncBoardInputs();renderOutfitBoard();
}
for(const slot of outfitSlots){const option=node('option',slot.label);option.value=slot.id;$('boardTarget').append(option);}$('boardTarget').value='shoes';$('boardTarget').onchange=renderBoardSuggestions;
for(const [id,key]of Object.entries({boardName:'name',boardOccasion:'occasion',boardSeason:'season',boardAudience:'audience',boardSize:'size',boardBudget:'budget'})){
 const updateDraft=()=>{currentBoard[key]=$(id).value;currentBoard=cleanOutfitBoard(currentBoard,items);renderOutfitBoard();};
 $(id).onchange=()=>{
  if(nativeLossless04Active)return nativeLossless04Edit(()=>nativeLossless04.setField(key,$(id).value));
  updateDraft();void storeBoard();
 };
 if($(id).tagName==='INPUT')$(id).oninput=()=>{
  if(nativeLossless04Active)return;
  updateDraft();scheduleBoardDraftSave();
 };
}
$('refreshOutfitWardrobe').onclick=async()=>{
 const lease=beginOwnerBoardUiLease();if(!lease)return;
 try{
  await refreshSavedWardrobeForOutfits();
  if(lease.current())$('boardName').focus({preventScroll:true});
 }catch{
  if(lease.current())boardDraftStatus('Could not refresh your private closet. Reopen My Closet and try again.');
 }
};
$('retryBoardDraft').onclick=async()=>{
 const lease=beginOwnerBoardUiLease();if(!lease)return;
 const saved=await storeBoard();
 if(saved&&lease.current())$('boardName').focus({preventScroll:true});
};
$('loadLatestBoardDraft').onclick=async()=>{
 const lease=beginOwnerBoardUiLease();if(!lease)return;
 try{
  await loadLatestBoardDraft();
  if(lease.current())$('boardName').focus({preventScroll:true});
 }catch{
  if(lease.current())boardDraftStatus('Could not load the latest outfit draft. Your unsaved changes are still here.');
 }
};
$('keepLocalBoardDraft').onclick=async()=>{
 const lease=beginOwnerBoardUiLease(),conflict=boardConflictDraft;
 if(!lease||!conflict)return;
 const saved=await storeBoard({replaceDraft:conflict});
 if(saved&&lease.current())$('boardName').focus({preventScroll:true});
};
$('closeBoardPicker').onclick=()=>$('boardPicker').close();
$('emptyBoardSlot').onclick=()=>{selectBoardPiece(choosingSlot,'');$('boardPicker').close();};
$('shopBoardSlot').onclick=()=>{$('boardTarget').value=choosingSlot;$('boardPicker').close();renderBoardSuggestions();$('boardGapStatus').scrollIntoView({behavior:'smooth',block:'start'});};
$('clearBoard').onclick=()=>{
 if(nativeLossless04Active)return nativeLossless04Edit(()=>nativeLossless04.startNew());
 currentBoard=cleanOutfitBoard({},items);syncBoardInputs();renderOutfitBoard();storeBoard();
};
$('saveBoard').onclick=async()=>{
 if(nativeLossless04Active){
  const lease=beginOwnerBoardUiLease(),consumer=nativeLossless04;
  if(!lease||!consumer||!consumer.status().active)return;
  const current=()=>lease.current()&&nativeLossless04===consumer&&consumer.status().active;
  const button=$('saveBoard');
  button.disabled=true;
  try{await consumer.persist({asNew:true});}
  catch(error){if(current())nativeLossless04Notify(error);}
  finally{if(current())button.disabled=false;}
  return;
 }
 const lease=beginOwnerBoardUiLease();if(!lease)return;
 cancelBoardDraftTimer();++boardStatusSerial;$('retryBoardDraft').hidden=true;
 if(!Object.keys(currentBoard.slots).length){
  $('boardSaveStatus').textContent='Choose at least one piece from your own closet first.';return;
 }
 if(savedOutfitBoards.length>=50){
  $('boardSaveStatus').textContent='You can save up to 50 outfits.';return;
 }
 $('saveBoard').disabled=true;
 try{
  await saveOwnedOutfit(currentBoard);
  if(!lease.current())return;
  boardDraftStatus('Outfit saved with references to your clothing photos.'+
   (boardConflictDraft?' Another tab changed the working draft; choose how to resolve it below.':''));
  renderSavedOutfitBoards();
 }catch(error){
  if(!lease.current())return;
  $('boardSaveStatus').textContent=error?.code==='OUTFIT_WARDROBE_CHANGED'?
   'Could not save this outfit. Selected clothing changed. Refresh your closet and create this outfit again.':
   'Could not save this outfit. Please try again.';
  $('refreshOutfitWardrobe').hidden=error?.code!=='OUTFIT_WARDROBE_CHANGED';
 }finally{
  if(lease.current())$('saveBoard').disabled=false;
 }
};
function renderTrendReferences(){const grid=$('boardTrendSources');grid.replaceChildren();for(const source of outfitTrendSources)grid.append(boardLink(source.title,source.url));}
renderTrendReferences();
const outfitBoardReady=(async()=>{
 await closetReady;
 if(!db)return;
 let nativeMountLease=null,ordinaryBoardLease=null;
 if(nativeLossless04Active){
  nativeMountLease=beginNativeBoardMountLease();
  if(!nativeMountLease)return;
  try{
   if(!db)throw Error('Authenticated owner database unavailable');
   const {createNativeConsumerBoard04}=await import('../research/native-consumer-board-04/consumer-board-controller.mjs');
   if(!nativeMountLease.current())return;
   const created=await createNativeConsumerBoard04({
    onChange:nativeMountLease.onChange,onStatus:nativeMountLease.onStatus
   });
   // A same-ID re-login is a new owner session even with the same DB name.
   if(!nativeMountLease.current()){created.dispose();return;}
   nativeLossless04=created;nativeMountLease.bind(created);
   window.nativeLossless04Bridge=created;
   savedOutfitBoards=nativeLossless04.readOnlySnapshot().saved;
   currentBoard=nativeLossless04.view();
   const controls=node('div',null,'actions');controls.id='nativeLossless04Controls';
   function addControl(id,label,fn){
    const button=node('button',label,'secondary');button.type='button';button.id=id;
    button.onclick=async()=>{
     const lease=beginOwnerBoardUiLease(),consumer=nativeLossless04;
     if(!lease||!consumer||!consumer.status().active||!button.isConnected)return;
     const current=()=>lease.current()&&nativeLossless04===consumer&&consumer.status().active;
     button.disabled=true;
     try{await fn(consumer);}
     catch(error){if(current())nativeLossless04Notify(error);}
     finally{if(current()&&button.isConnected)button.disabled=false;}
    };controls.append(button);
   }
   addControl('native04SaveChanges','Save changes',consumer=>consumer.persist({asNew:false}));
   addControl('native04CancelChanges','Cancel changes',consumer=>consumer.cancel());
   addControl('native04DeleteOutfit','Delete saved outfit',async consumer=>{
    const index=consumer.selected;
    if(index===null)return nativeLossless04Notify('Open a saved outfit to delete it');
    if(!confirm('Delete ONLY this saved outfit? Your clothing photos stay in My Closet.'))return;
    await consumer.remove(index,{confirmed:true});
   });
   $('saveBoard').after(controls);
   if(typeof URLSearchParams==='function'&&
     new URLSearchParams(location.search).get('native3D05')==='research'){
    try{
     const {mountNative3D05}=await import('../research/native-3d-05/native-preview-bridge.mjs');
     if(!nativeMountLease.current())return;
     // M39 only: actual native app lexical signed auth / owner IDB scope.
     // Never obtain private DB references from global research/viewer inputs.
     // Existing M33 ownerPicker remains disabled in nativeLossless04 mode;
     // this independently scoped adapter calls unchanged M34 read-only guards.
     let ownerScope38=null;
     const mode39=new URLSearchParams(location.search);
     if(mode39.get('main39')==='research'&&
        mode39.get('main38')==='research'){
      const originalAuth39=window.closetAuth,ownerDb39=db,
       originalEpoch39=captureOperationEpoch,originalOwner39=originalAuth39?.user?.id;
      const assertOriginalOwner39=()=>{
       if(!nativeMountLease.current()||nativeLossless04!==created||
          !created.status().active||db!==ownerDb39||
          window.closetAuth!==originalAuth39||
          originalAuth39?.user?.id!==originalOwner39||
          captureOperationEpoch!==originalEpoch39||
          ownerDb39?.name!=='closet-current-user-'+originalOwner39)
        throw Error('MAIN39 owner/source private lease revoked');
       originalAuth39.assertCurrent();
      };
      const {createTrustedNativeOwnerScope39}=await import(
       '../research/main1054-handoff39/trusted-native-owner-scope.mjs');
      assertOriginalOwner39();
      ownerScope38=createTrustedNativeOwnerScope39({
       consumer:created,authRef:originalAuth39,privateDbRef:ownerDb39,
       getActualOperationEpoch:()=>captureOperationEpoch,
       assertOwnerLive:assertOriginalOwner39,
       readActualOwnerItems:async scope=>{
        scope.assertCurrent();assertOriginalOwner39();
        const rows=await readAllFrom(scope.privateDbRef);
        scope.assertCurrent();assertOriginalOwner39();
        return rows;
       }
      });
     }
     const viewer=await mountNative3D05({consumer:created,
      onStatus:nativeMountLease.onStatus,ownerScope38});
     if(!publishNative04OwnerPanel(nativeMountLease,created,viewer,'native3D05Bridge'))return;
    }catch(error){if(!nativeMountLease.current())return;nativeLossless04Notify(error);}
   }
   // NATIVE-PHOTO-08: attach only after actual owner Outfit Builder controls
   // are active; the underlying #560 source-original assessor stays unchanged.
   if(new URLSearchParams(location.search).get('sourceReadiness08')==='research'&&
      new URLSearchParams(location.search).get('native3D05')==='research'){
    try{
     const {mountNativeReadiness08}=await import('../research/native-photo-readiness-08/native-readiness-panel.mjs');
     if(!nativeMountLease.current())return;
     const readiness=await mountNativeReadiness08({
      board:created,db,onStatus:nativeMountLease.onStatus
     });
     if(!publishNative04OwnerPanel(nativeMountLease,created,readiness,'nativePhotoReadiness08Bridge'))return;
    }catch(error){if(!nativeMountLease.current())return;nativeLossless04Notify(error);}
   }
   // STYLE03: Actual native Style screen, not a separate wardrobe editor.
   // Guarded original photos and pinned owned looks use this very same native
   // authenticated BOARD04 controller and its lossless compare-and-swap.
   if(new URLSearchParams(location.search).get('styleOwned03')==='research'&&
      new URLSearchParams(location.search).get('nativeIndex07')==='research'){
    try{
     const {mountStyleOwnedLive03}=await import('../research/style-owned-live-03/native-style-panel.mjs');
     if(!nativeMountLease.current())return;
     const style=await mountStyleOwnedLive03({board:created,onStatus:()=>{}});
     if(!publishNative04OwnerPanel(nativeMountLease,created,style,'styleOwnedLive03Bridge'))return;
    }catch(error){if(!nativeMountLease.current())return;nativeLossless04Notify(error);}
   }
   // MOBILE09: Research-only tactile and safe-area polish. It changes no
   // saved record, cloth geometry, owner permission, or released stylesheet.
   if(new URLSearchParams(location.search).get('nativeMobile09')==='research'){
    try{
     const {mountNativeMobile09}=await import('../research/native-mobile-09/mobile-comfort.mjs');
     if(!nativeMountLease.current())return;
     const mobile=mountNativeMobile09({board:created});
     if(!publishNative04OwnerPanel(nativeMountLease,created,mobile,'nativeMobile09Bridge'))return;
    }catch(error){if(!nativeMountLease.current())return;nativeLossless04Notify(error);}
   }
  }catch(error){
   if(!nativeMountLease.current())return;
   nativeLossless04Notify(error);nativeLossless04ClearPreview();
  }
 }else if(db){
  // Default private Board IDB can resolve after sign-out or same-ID re-login.
  // Verify the original signed owner before and after the asynchronous read;
  // never repopulate a new owner's empty/working board from the old database.
  ordinaryBoardLease=beginOwnerBoardUiLease();
  if(!ordinaryBoardLease)return;
  const ownerDB=db;
  try{
   const state=await new Promise((resolve,reject)=>{
    const r=ownerDB.transaction('state').objectStore('state').get('outfit-board');
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   if(!ordinaryBoardLease.current())return;
   assertCompleteWardrobe(items,state===undefined?[]:[state],window.closetAuth.user.id);
   boardExpectedStoredDraft=JSON.stringify(state?.current??null);
   if(state){currentBoard=cleanOutfitBoard(state.current,items);
    savedOutfitBoards=(state.saved||[]).slice(0,50).map(x=>cleanOutfitBoard(x,items));}
  }catch(error){
   if(!ordinaryBoardLease.current())return;
   if(error?.code==='CLOSET_INCOMPLETE_WARDROBE'){
    ownerDB.close();db=null;startupWardrobeRecoveryCount=1;render();return;
   }
   $('boardSaveStatus').textContent='Saved outfits could not be loaded.';
  }
 }
 if(nativeMountLease&&!nativeMountLease.current())return;
 if(ordinaryBoardLease&&!ordinaryBoardLease.current())return;
 boardCommittedDraft=JSON.stringify(currentBoard);boardInitialized=true;syncBoardInputs();renderOutfitBoard();
})();

const TREND_DATA_URL='https://raw.githubusercontent.com/nickhaney916-lang/Closet-Current/main/public/trend-data.json';
const TREND_CACHE='closet-current-trend-library-v1';let trendLoading=false,trendLastCheck=0;
function trendLibraryDate(value){const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'date unavailable';}
function trendFreshnessText(failed=false){
 if(!activeTrendLibrary)return 'Current trend research is unavailable. Showing general styling ideas.';
 const age=Date.now()-Date.parse(activeTrendLibrary.updatedAt),late=age>8*86400000;
 return (late?'Weekly research refresh is overdue. ':'')+'Last verified '+trendLibraryDate(activeTrendLibrary.updatedAt)+' · '+new Set(activeTrendLibrary.sources.map(s=>new URL(s.url).hostname)).size+' publication sites · '+new Set(activeTrendLibrary.products.map(p=>new URL(p.url).hostname)).size+' retailer sites. '+(failed?'Could not check for newer data; keeping the last verified library.':'Weekly background research; no app install or update needed.');
}
async function refreshTrendLibrary(force=false){
 if(trendLoading||(!force&&Date.now()-trendLastCheck<1800000))return;
 trendLoading=true;trendLastCheck=Date.now();const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await fetch(TREND_DATA_URL+'?checked='+Math.floor(Date.now()/300000),{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('Recommendation data unavailable');
  const data=await response.json(),library=normalizeTrendLibrary(data);
  if(!activeTrendLibrary||Date.parse(library.updatedAt)>=Date.parse(activeTrendLibrary.updatedAt)){applyLoadedTrendLibrary(data);try{localStorage.setItem(TREND_CACHE,JSON.stringify(data));}catch{}}
  $('trendFreshness').textContent=trendFreshnessText();renderTrendReferences();if(boardInitialized)renderBoardSuggestions();if(typeof renderStyledCollection==='function')renderStyledCollection();
 }catch{$('trendFreshness').textContent=trendFreshnessText(true);}
 finally{clearTimeout(timeout);trendLoading=false;}
}
(async()=>{
 try{const cached=JSON.parse(localStorage.getItem(TREND_CACHE)||'null');if(cached)applyLoadedTrendLibrary(cached);}catch{}
 if(!activeTrendLibrary){try{const response=await fetch('./trend-data.json');if(response.ok)applyLoadedTrendLibrary(await response.json());}catch{}}
 renderTrendReferences();$('trendFreshness').textContent=trendFreshnessText();if(boardInitialized)renderBoardSuggestions();refreshTrendLibrary(true);
})();
window.addEventListener('focus',()=>refreshTrendLibrary());document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshTrendLibrary();});setInterval(()=>refreshTrendLibrary(),3600000);


/**
 * MAIN1054: opt-in read-only research preview using the genuine native
 * authenticated saved wardrobe, real slot IDs and original JPEG receipts.
 * No deployment, no writes, no arbitrary private-photo 3D claims.
 */
if(mission4Preview1054Active){
 (async()=>{
  try{
   await outfitBoardReady;
   const builder=$('builder');
   if(!builder)return;
   const section=document.createElement('section');
   section.id='mission4Preview1054Section';
   section.dataset.sourceVerifiedOnly='true';
   const button=document.createElement('button');
   button.type='button';button.className='secondary';
   button.textContent='View verified original clothing photos (2D)';
   const status=document.createElement('p');
   status.id='mission4Preview1054Status';status.setAttribute('role','status');
   status.textContent='Select saved clothing, then verify its original photos. Only reviewed originals can open.';
   const photos=document.createElement('div');
   photos.id='mission4Preview1054Photos';
   section.append(button,status,photos);builder.append(section);
   // M68: strict original-photo verification is asynchronous and may finish
   // after an owner/logout/DB revision. A stale request must not overwrite
   // newer signed-owner preview status or reenable its active request.
   button.onclick=async()=>{
    const lease=beginOwnerBoardUiLease();
    if(!lease||button.disabled||!button.isConnected)return;
    const pinned=mission4Preview1054SourceSnapshot();
    if(!pinned){
     status.textContent='Choose a signed-owner saved outfit and review its photos first.';
     return;
    }
    mission4Preview1054Pinned=pinned;
    const serial=++mission4Preview1054ClickSerial;
    const live=()=>serial===mission4Preview1054ClickSerial&&
     mission4Preview1054Pinned===pinned&&
     mission4Preview1054SameSource(pinned,mission4Preview1054SourceSnapshot())&&
     lease.current()&&button.isConnected;
    button.disabled=true;photos.replaceChildren();
    status.textContent='Verifying the signed owner, source photographs and selected outfit…';
    try{
     if(typeof currentPhotoOwnerSession167!=='function'||
        typeof signedOwnerSavedRows167!=='function')
      throw Error('Native signed photo source unavailable');
     const {mountOwnerOutfitPhotoPreview1054}=await import(
      './native-2d-preview-p99.mjs');
     if(!live())return;
     if(!mission4Preview1054Viewer)
      mission4Preview1054Viewer=mountOwnerOutfitPhotoPreview1054({
       target:photos,
       getSession:currentPhotoOwnerSession167,
       readOwnerItems:signedOwnerSavedRows167,
       getBoard:()=>nativeLossless04Active
        ?nativeLossless04?.view():structuredClone(currentBoard),
       cleanBoard:cleanOutfitBoard,
       events:window,doc:document
      });
     const viewer=mission4Preview1054Viewer;
     const result=await viewer.refresh();
     if(!live()||mission4Preview1054Viewer!==viewer){
      // M147: a previous click may finish after the new owner's/board's
      // preview has reused this exact viewer and already published valid
      // pixels. Only the currently owned click can revoke the shared DOM;
      // late stale continuations must NOT clear newer verified originals.
      if(serial===mission4Preview1054ClickSerial&&
         mission4Preview1054Viewer===viewer) viewer.clear();
      return;
     }
     if(viewer.status.phase!=='visible'||
        !mission4Preview1054DisplayedExactSource(pinned,photos,result.slotCount))
      throw Error('Source-bound original photo presentation was revoked');
     status.textContent=result.slotCount+
      ' owner-confirmed original photo(s) verified. 2D only; realistic 3D fit is not established.';
    }catch{
     if(!live())return;
     mission4Preview1054Pinned=null;
     mission4Preview1054Viewer?.clear();
     photos.replaceChildren();
     status.textContent='Preview refused. Recheck the signed account, garment review, original photographs and outfit slots.';
    }finally{
     if(serial===mission4Preview1054ClickSerial&&button.isConnected){
      // M103: an invalidated owner/source lease must not leave this click
      // showing Verifying after a guarded stale return. Never publish pixels.
      if((status.textContent||'').startsWith('Verifying')&&!live()){
       mission4Preview1054Pinned=null;
       mission4Preview1054Viewer?.clear();photos.replaceChildren();
       status.textContent='Verification stopped because the signed account, private session or selected outfit changed. Reopen the signed-owner photo preview.';
      }
      button.disabled=false;
     }
    }
   };
   window.addEventListener('closet:session-locked',()=>{
    ++mission4Preview1054ClickSerial;mission4Preview1054Pinned=null;
    mission4Preview1054Viewer?.clear();photos.replaceChildren();
    button.disabled=false;
    status.textContent='Private preview cleared on account-session change.';
   });
  }catch{
   // No UI or photo disclosure if the isolated research mount is unavailable.
  }
 })();
}

/**
 * M62 opt-in ORIGINAL PHOTO ONLY (no garment-boundary proof or 3D fitting).
 * The verified M59 read-only admission/gallery modules remain independent
 * of the stricter MAIN1054 M51 certified-source preview.
 * This panel is lazy, signed-owner-scoped and entirely disabled by default.
 */
if(mission4PhotoOnly59Active){
 (async()=>{
  try{
   await outfitBoardReady;
   const builder=$('builder');
   if(!builder)return;
   const section=document.createElement('section');
   section.id='mission4PhotoOnly59Section';
   section.dataset.researchOnly='true';
   section.dataset.render3d='denied';
   const button=document.createElement('button');
   button.type='button';button.className='secondary';
   button.id='mission4PhotoOnly59Open';
   button.textContent='View reviewed original photos only (research)';
   const status=document.createElement('p');
   status.id='mission4PhotoOnly59Status';status.setAttribute('role','status');
   status.textContent='Research only: photo boundaries are unverified. No fitted 3D clothing.';
   const photos=document.createElement('div');photos.id='mission4PhotoOnly59Photos';
   section.append(button,status,photos);builder.append(section);
   // M65: bind the photo-only async request to one exact signed-owner
   // session. Stale A callbacks must not overwrite B's gallery controls.
   let photoGalleryClickSerial59=0;
   button.onclick=async()=>{
    const ownerLease=beginOwnerBoardUiLease();
    if(!ownerLease||button.disabled||!button.isConnected)return;
    const serial=++photoGalleryClickSerial59;
    const live=()=>serial===photoGalleryClickSerial59&&
     ownerLease.current()&&button.isConnected;
    button.disabled=true;photos.replaceChildren();
    section.dataset.render3d='denied';
    status.textContent='Checking signed owner, private saved photographs and selected outfit…';
    try{
     if(typeof currentPhotoOwnerSession167!=='function'||
        typeof signedOwnerSavedRows167!=='function')
      throw Error('Native owner-backed source unavailable');
     const {mountReviewedPhotoOnlyGallery59}=await import(
      '../research/master-consolidation-1054/reviewed-photo-only-gallery59.mjs');
     if(!live())return;
     if(!mission4PhotoOnly59Viewer)
      mission4PhotoOnly59Viewer=mountReviewedPhotoOnlyGallery59({
       target:photos,
       getSession:currentPhotoOwnerSession167,
       readOwnerItems:signedOwnerSavedRows167,
       getBoard:()=>nativeLossless04Active
        ?structuredClone(nativeLossless04?.view()):structuredClone(currentBoard),
       cleanBoard:cleanOutfitBoard,
       events:window,doc:document
      });
     const viewer=mission4PhotoOnly59Viewer;
     const result=await viewer.refresh();
     if(!live()||mission4PhotoOnly59Viewer!==viewer)return;
     if(result.renderAuthorized3D!==false||
        result.fittedOutfitAuthorized!==false||
        result.releaseAuthorized!==false)
      throw Error('Unverified photo claimed fitted-garment authority');
     section.dataset.render3d='denied';
     status.textContent=result.photoCount+
      ' original source photo(s) displayed. Physical garment units unverified; 3D denied.';
    }catch{
     if(!live())return;
     mission4PhotoOnly59Viewer?.clear();
     photos.replaceChildren();
     status.textContent='Photo-only gallery refused. Recheck this account, review, original source and selected outfit.';
    }finally{
     // A stale request may unlock its own button only until B starts another
     // request. The session-lock callback also restores the enabled state.
     if(serial===photoGalleryClickSerial59&&button.isConnected)button.disabled=false;
    }
   };
   window.addEventListener('closet:session-locked',()=>{
    ++photoGalleryClickSerial59;
    try{mission4PhotoOnly59Viewer?.dispose();}catch{}
    mission4PhotoOnly59Viewer=null;
    photos.replaceChildren();
    button.disabled=false;
    status.textContent='Private original photos cleared after owner-session change.';
   });
  }catch{
   // Fail closed; no default UI and no private original on mount failure.
  }
 })();
}

async function reloadCloudBoard({ownerDB=db,assertLease=()=>{}}={}){
 assertLease();
 if(nativeLossless04Active){
  if(!nativeLossless04)throw Error('Private lossless reload unavailable');
  await nativeLossless04.load();
  assertLease();
  currentBoard=nativeLossless04.view();
  savedOutfitBoards=nativeLossless04.readOnlySnapshot().saved;
  syncBoardInputs();renderOutfitBoard();return;
 }
 const auth=window.closetAuth,owner=auth?.user?.id;
 assertLease();
 const state=await new Promise((resolve,reject)=>{
  const r=ownerDB.transaction('state').objectStore('state').get('outfit-board');
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
 assertLease();
 if(db!==ownerDB||window.closetAuth!==auth||auth?.user?.id!==owner)throw Error('Owner changed while reloading outfit draft');
 const loaded=cleanOutfitBoard(state?.current||{},items),stored=JSON.stringify(state?.current??null);
 if(boardHasUnsavedDraft()&&JSON.stringify(currentBoard)!==JSON.stringify(loaded)){
  savedOutfitBoards=(state?.saved||[]).map(x=>cleanOutfitBoard(x,items));renderSavedOutfitBoards();
  if(stored!==boardExpectedStoredDraft){cancelBoardDraftTimer();++boardStatusSerial;boardConflictDraft={ownerDB,auth,owner,stored};boardDraftStatus('Another tab changed this outfit draft. Your changes are still here. Load latest replaces your unsaved changes, or choose Save my draft instead.');}
  return;
 }
 currentBoard=loaded;savedOutfitBoards=(state?.saved||[]).map(x=>cleanOutfitBoard(x,items));
 boardExpectedStoredDraft=stored;boardConflictDraft=null;boardCommittedDraft=JSON.stringify(currentBoard);
 syncBoardInputs();renderOutfitBoard();
}
