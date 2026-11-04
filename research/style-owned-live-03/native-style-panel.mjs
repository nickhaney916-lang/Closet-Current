/**
 * STYLE-OWNED-LIVE-03 — mounted inside the ACTUAL native Style page, reuses
 * existing native BOARD04 owner/session, unsaved draft, CAS and backup V4.
 * Absolutely no additional saved outfit DB, JSON writer or fake 3D mesh.
 */
import {suggestThreeNativeOwned03,validateOwnedSwap03,eligibleSlot03}
 from './three-owned-looks-native.mjs';
import {verifyOriginalPhoto01} from '../user-photo-3d-01/photo-readiness.mjs';

const STATUS=Object.freeze({featureGate:'styleOwned03=research',
 actualNativeStyleScreen:true,existingNativeCAS:true,releaseAuthorized:false,
 sourceBound3DOnly:true,realSignedRLSVerified:false,familyAlpha:'HOLD'});
const slotNames=Object.freeze({top:'Top / dress',bottom:'Pants / bottom',
 shoes:'Shoes',layer2:'Jacket',layer3:'Coat'});
const validId=x=>typeof x==='string'&&x.length>0&&x.length<=160;
function confirmed(row){
 return row?.userAdjusted===true||
  row?.confirmedDetails?.category===row?.category&&
   row?.confirmedDetails?.itemType===row?.itemType||
  row?.localAnalyzed===true&&row?.indexingLevel==='specific-type'&&
   typeof row?.indexedAt==='string'&&row?.scanFailed!==true;
}
function allowed(row,{reviewedSingle=false}={}){
 return row?.requiresOwnershipConfirmation!==true&&row?.possibleDuplicate!==true&&
  (row?.singleGarmentVerified!==false||reviewedSingle===true)&&row?.multipleGarments!==true&&
  // A recognition worker failure must stay recorded; human corrected category,
  // exact original SHA and explicit one-photo confirmation can still permit
  // original-photo-only styling without falsely claiming model success.
  (row?.scanFailed!==true||(row?.userAdjusted===true&&
    (row?.singleGarmentVerified!==false||reviewedSingle===true)))&&
  row?.saveFailed!==true&&row?.category!=='Uncategorized';
}
function needsExplicitSingleReview(row){
 return confirmed(row)&&row?.userAdjusted===true&&row?.singleGarmentVerified===false&&
  row?.multipleGarments!==true&&row?.requiresOwnershipConfirmation!==true&&
  row?.possibleDuplicate!==true&&row?.saveFailed!==true&&
  row?.category!=='Uncategorized';
}
export async function verifiedPrivateStyleRoster03(board,{singleItemReviews=new Map()}={}){
 if(!(singleItemReviews instanceof Map))throw Error('STYLE03 owner-bound single-item reviews required');
 if(!board?.readOnlyWardrobe||!board?.sessionLease||!board?.status?.().active)
  throw Error('STYLE03 native owner-only Outfit Builder unavailable');
 const first=board.readOnlyWardrobe(),now=board.sessionLease();
 if(first.ownerId!==now.ownerId||first.generation!==now.generation||
    !Array.isArray(first.items)||first.items.length>1000)
  throw Error('STYLE03 signed-in owner changed before reading wardrobe');
 const all=new Set(),verified=[],pending=[],rejected=[];
 for(const row of first.items){
  if(!validId(row?.id)||all.has(row.id)||row.ownerId!==first.ownerId)
   throw Error('STYLE03 private wardrobe ID or account mismatch');
  all.add(row.id);
  const reviewable=needsExplicitSingleReview(row);
  const authorization=singleItemReviews.get(row.id);
  const explicitlyApproved=reviewable&&authorization?.ownerId===first.ownerId&&
   authorization.generation===first.generation&&authorization.sha256===row.sourceSHA256&&
   authorization.category===row.category&&authorization.itemType===row.itemType;
  if(!confirmed(row)||!allowed(row,{reviewedSingle:explicitlyApproved})){
   if(reviewable){
    try{
     const proof=await verifyOriginalPhoto01(row,{ownerId:first.ownerId});
     const lease=board.sessionLease();
     if(lease.ownerId!==first.ownerId||lease.generation!==first.generation)
      throw Error('STYLE03 original photo owner changed during review');
     pending.push(Object.freeze({id:row.id,ownerId:first.ownerId,
      category:row.category,itemType:row.itemType,color:row.color||'',
      name:row.name||row.itemType,sourceSHA256:proof.sha256,
      genuinePhoto:row.originalPhoto.image,
      reason:'Confirm this photograph shows exactly one item before styling'}));
    }catch(error){
     if(!board.status().active)throw Error('STYLE03 review photo session revoked');
     rejected.push({id:row.id,reason:'Unverified original: '+String(error.message||error)});
    }
   }else rejected.push({id:row.id,reason:'Category, ownership, duplicates or garment count needs review'});
   continue;
  }
  try{
   const proof=await verifyOriginalPhoto01(row,{ownerId:first.ownerId});
   const after=board.sessionLease();
   if(after.ownerId!==first.ownerId||after.generation!==first.generation)
    throw Error('STYLE03 owner changed during original photograph digest');
   verified.push(Object.freeze({...row,sourceVerified:true,categoryConfirmed:true,
    sourceSHA256:proof.sha256,originalByteLength:proof.byteLength,
    genuinePhoto:row.originalPhoto.image}));
  }catch(error){
   if(!board.status().active)throw Error('STYLE03 authentication revoked during source verification');
   rejected.push({id:row.id,reason:String(error.message||error)});
  }
 }
 const after=board.readOnlyWardrobe();
 if(after.ownerId!==first.ownerId||after.generation!==first.generation||
    after.boardFingerprint!==first.boardFingerprint||
    after.items.length!==first.items.length)
  throw Error('STYLE03 wardrobe/owner changed while verifying source photos');
 // Check the fields used by the outfit generator against the fresh owner
 // snapshot; never rely on an out-of-date cached category after a correction.
 const byId=new Map(after.items.map(row=>[row.id,row]));
 for(const item of [...verified,...pending]){
  const fresh=byId.get(item.id);
  if(!fresh||fresh.category!==item.category||fresh.itemType!==item.itemType||
     fresh.sourceSHA256!==item.sourceSHA256||
     fresh.originalPhoto?.sha256!==item.sourceSHA256||
     fresh.originalPhoto?.image!==(item.originalPhoto?.image||item.genuinePhoto))
   throw Error('STYLE03 wardrobe photo or category changed during verification');
 }
 return Object.freeze({ownerId:first.ownerId,generation:first.generation,
  fingerprint:first.boardFingerprint,items:Object.freeze(verified),
  pending:Object.freeze(pending),rejected:Object.freeze(rejected),originalSHA256Verified:true,
  noDatabaseMutation:true,releaseAuthorized:false});
}

export async function mountStyleOwnedLive03({
 win=window,doc=win.document,board,onStatus=()=>{}
}={}){
 if(new URLSearchParams(win.location.search).get('styleOwned03')!=='research'||
    new URLSearchParams(win.location.search).get('nativeLossless04')!=='research'||
    new URLSearchParams(win.location.search).get('nativeIndex07')!=='research'||
    !doc.getElementById('stylist')||!board?.applyOwnedSlots||
    !board?.persist||!board?.cancel||!board?.startNew)
  throw Error('STYLE03 requires current actual native app, lossless owner and explicit research gates');
 const create=(name,text,cls)=>{const e=doc.createElement(name);
  if(text!==undefined&&text!==null)e.textContent=text;
  if(cls)e.className=cls;return e;};
 const style=create('style');style.id='styleOwned03CSS';
 style.textContent=[
 '#styleOwned03{min-width:0;max-width:100%;padding:12px;margin:8px 0 20px;border:1px solid #cbdcd2;border-radius:14px;background:#f9fcfa;overflow-wrap:anywhere;box-sizing:border-box}',
 '#styleOwned03 *{box-sizing:border-box;min-width:0}',
 '#styleOwned03 h3{margin:0 0 4px;font-size:20px}#styleOwned03 .small{font-size:12px;line-height:1.4;margin:6px 0}',
 '#styleOwned03 label{display:block;font-weight:600;font-size:13px}',
 '#styleOwned03 select,#styleOwned03 button{font-size:14px;min-height:48px;max-width:100%}',
 '#styleOwned03 select{width:100%;padding:5px;border:1px solid #acc0b7;background:white;border-radius:8px}',
 '#styleOwned03 button{padding:7px 9px;border:1px solid #9dbbb0;border-radius:8px;background:white;color:#19392d;cursor:pointer}',
 '#styleOwned03 button.primary{background:#245c49;color:white;font-weight:700}',
 '#styleOwned03 button:focus-visible,#styleOwned03 select:focus-visible{outline:3px solid #b276df;outline-offset:2px}',
 '#styleOwned03 .toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}',
 '#styleOwned03 .toolbar>*{flex:1 1 118px}',
 '#styleOwned03 .pinned{display:grid;grid-template-columns:86px minmax(0,1fr);gap:9px;align-items:center}',
 '#styleOwned03 .pinned img{width:86px;height:102px;object-fit:contain;background:#f1f4f0;border-radius:7px}',
 '#styleOwned03 .looks{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:9px;margin:10px 0}',
 '#styleOwned03 .look{background:#fff;padding:9px;border:1px solid #bdd0c4;border-radius:9px}',
 '#styleOwned03 .photos{display:flex;gap:4px;overflow:hidden;max-width:100%}',
 '#styleOwned03 .photos img{width:20%;flex:1 1 0;min-width:0;max-width:70px;height:62px;object-fit:contain;background:#f1f4f0}',
 '#styleOwned03 .look button{width:100%;margin-top:6px}',
 '#styleOwned03 .piece{display:grid;grid-template-columns:64px minmax(0,1fr);align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #e0e9e3}',
 '#styleOwned03 .piece img{width:64px;height:70px;object-fit:contain;background:#f1f4f0}',
 '#styleOwned03 .piece button{min-height:44px;margin-top:4px}',
 '#styleOwned03 .pending-review{background:#fff;border:1px solid #bfcfc6;padding:8px;border-radius:8px;margin:8px 0}',
 '#styleOwned03 .pending-item{display:grid;grid-template-columns:72px minmax(0,1fr);gap:8px;align-items:center;margin:7px 0}',
 '#styleOwned03 .pending-item img{width:72px;height:83px;object-fit:contain;background:#f1f4f0}',
 '#styleOwned03 .pending-item button{width:100%;margin-top:5px;min-height:48px}',
 '#styleOwned03 .note{font-size:12px;color:#37584b}',
 '#styleOwned03 #styleOwned03Status{font-size:13px;font-weight:600;margin:7px 0;overflow-wrap:anywhere}',
 '#styleOwned03 [hidden]{display:none!important}',
 '@media(max-width:360px){#styleOwned03{padding:8px}#styleOwned03 .toolbar{gap:5px}#styleOwned03 .toolbar>*{flex-basis:125px}}',
 '@media(prefers-reduced-motion:reduce){#styleOwned03 *{scroll-behavior:auto!important}}'
 ].join('\n');
 doc.head.append(style);
 const section=create('section',null,'style-owned-research');section.id='styleOwned03';
 const heading=create('h3','Style My New Clothes');
 const explain=create('p','Pick a saved or newly photographed piece. Keep it pinned while trying three looks from your own closet. Original photos only; unapproved garments are not 3D fitted.','small');
 const selectLabel=create('label','Choose a saved clothing item');
 const selector=create('select');selector.id='styleOwned03Item';
 selector.setAttribute('aria-label','Choose your new owned clothing item');
 selectLabel.append(selector);
 const pending=create('section',null,'pending-review');pending.id='styleOwned03Pending';pending.hidden=true;
 const pin=create('div',null,'pinned');pin.id='styleOwned03Pinned';
 const refreshButton=create('button','Refresh my saved clothes');refreshButton.id='styleOwned03Refresh';
 const generate=create('button','Generate my three outfits','primary');generate.id='styleOwned03Generate';
 const toolbar=create('div',null,'toolbar');toolbar.append(refreshButton,generate);
 const status=create('p','Checking this account’s saved clothing…');status.id='styleOwned03Status';
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const looks=create('div',null,'looks');looks.id='styleOwned03Suggestions';
 const workspace=create('section');workspace.id='styleOwned03Workspace';
 const caution=create('p','Research-only. Approved, source-bound 163-bone 3D previews remain in the existing Outfit Builder after you save. Any other clothing stays as its genuine original photo.','note');
 section.append(heading,explain,selectLabel,pending,pin,toolbar,status,looks,workspace,caution);
 const actualStyle=doc.getElementById('stylist');
 actualStyle.insertBefore(section,actualStyle.querySelector('.occasion-choices')||actualStyle.firstChild);
 let snapshot=null,active=null,current=null,history=[],generated=null,
  pinId=null,styleDraft=false,savedId=null,busy=false,revoked=false,
  requestedReviewId=null,singleItemReviews=new Map();
 const fail=message=>{throw Error('STYLE03 '+message);};
 const text=message=>{status.textContent=message;onStatus(message);};
 const rows=()=>snapshot?.items||[];
 const byId=id=>rows().find(x=>x.id===id);
 const live=()=>{
  const session=board.sessionLease();
  if(!snapshot||session.ownerId!==snapshot.ownerId||
      session.generation!==snapshot.generation||!board.status().active)
   fail('SESSION_CHANGED');
  return session;
 };
 const clearPrivate=()=>{
  revoked=true;snapshot=null;active=null;current=null;history=[];generated=null;
  pinId=null;styleDraft=false;savedId=null;requestedReviewId=null;
  singleItemReviews.clear();pending.replaceChildren();pending.hidden=true;
  selector.replaceChildren();pin.replaceChildren();looks.replaceChildren();
  workspace.replaceChildren();text('Account changed · private photographed outfits cleared. Sign in to load this closet.');
 };
 const img=(row,width=64)=>{
  const photo=create('img');photo.src=row?.genuinePhoto||'';photo.alt='Original photograph: '+(row?.name||row?.itemType||'Owned garment');
  photo.loading='eager';photo.width=width;return photo;
 };
 function displayPinned(){
  pin.replaceChildren();const item=byId(pinId);
  if(!item)return;
  pin.append(img(item,86));
  const details=create('div');
  details.append(create('strong',(item.name||item.itemType)+' · pinned'),
   create('p',[item.category,item.itemType,item.color].filter(Boolean).join(' · '),'small'),
   create('p','Original JPEG SHA-256 verified '+item.sourceSHA256.slice(0,16)+'… · original saved ID retained','note'));
  pin.append(details);
 }
 function renderOptions(){
  const prior=pinId;
  selector.replaceChildren();
  for(const row of rows()){
   const option=create('option',(row.name||row.itemType||row.id)+' · '+row.category+' · '+(row.color||'color unconfirmed'));
   option.value=row.id;selector.append(option);
  }
  pinId=rows().some(x=>x.id===prior)?prior:rows()[0]?.id||null;
  if(pinId)selector.value=pinId;
  displayPinned();
 }

 function renderPending(){
  pending.replaceChildren();
  const rowsPending=snapshot?.pending||[];
  pending.hidden=!rowsPending.length;
  if(!rowsPending.length)return;
  pending.append(create('strong','One quick photo check'),
   create('p','These saved originals have confirmed clothing details but were not yet checked to show one item. Confirm each photo before allowing it into outfits. This never changes the photo or makes it 3D Ready.','small'));
  for(const row of rowsPending){
   const card=create('div',null,'pending-item');card.append(img(row,72));
   const body=create('div');
   body.append(create('strong',row.name||row.itemType),
    create('p',[row.category,row.itemType,row.color].filter(Boolean).join(' · '),'small'),
    create('p','Original SHA-256 '+row.sourceSHA256.slice(0,14)+'…','note'));
   const confirm=create('button','Yes, this photo shows one clothing item');
   confirm.type='button';confirm.dataset.photoItemId=row.id;
   confirm.onclick=async()=>{
    confirm.disabled=true;
    try{
     const lease=live(),snapshotNow=board.readOnlyWardrobe();
     const original=snapshotNow.items.find(x=>x.id===row.id);
     if(!original||original.ownerId!==lease.ownerId||
        original.sourceSHA256!==row.sourceSHA256||
        original.originalPhoto?.sha256!==row.sourceSHA256||
        original.originalPhoto?.image!==row.genuinePhoto||
        original.category!==row.category||original.itemType!==row.itemType||
        !needsExplicitSingleReview(original))
      fail('ONE_ITEM_PHOTO_CHANGED_OR_NOT_ELIGIBLE');
     singleItemReviews.set(row.id,{ownerId:lease.ownerId,generation:lease.generation,
      sha256:row.sourceSHA256,category:row.category,itemType:row.itemType});
     await refresh({quiet:false});
     if(!byId(row.id))fail('ONE_ITEM_REVIEW_NOT_VERIFIED');
     // The person explicitly reviewed THIS pictured garment. Make that
     // source the visible pin instead of retaining an unrelated default coat.
     pinId=row.id;selector.value=row.id;displayPinned();requestedReviewId=null;
     text('One original clothing photo confirmed. This does not approve 3D fitting. You can now generate owned outfits.');
    }catch(error){text('Unable to confirm this photograph: '+String(error.message||error));}
    finally{confirm.disabled=false;}
   };
   body.append(confirm);card.append(body);pending.append(card);
  }
 }
 async function refresh({quiet=false}={}){
  if(busy)return false;
  busy=true;refreshButton.disabled=true;
  try{
   const previous=snapshot,loaded=await verifiedPrivateStyleRoster03(board,{singleItemReviews});
   snapshot=loaded;revoked=false;
   if(previous&&(previous.ownerId!==loaded.ownerId||previous.generation!==loaded.generation)){
    generated=null;current=null;history=[];styleDraft=false;savedId=null;
    looks.replaceChildren();workspace.replaceChildren();
    singleItemReviews.clear();requestedReviewId=null;
   }
   renderOptions();renderPending();
   if(!quiet||loaded.pending.length)text(rows().length+' SHA-verified owned pieces ready. '+
     loaded.pending.length+' originals need one-item photo confirmation; '+
     loaded.rejected.length+' need further category/source review.');
   return true;
  }catch(error){clearPrivate();text(String(error.message||error));throw error;}
  finally{busy=false;refreshButton.disabled=false;}
 }
 function ensurePin(){
  live();
  if(!byId(pinId))fail('SELECTED_ORIGINAL_MISSING');
  if(board.status().dirty&&!styleDraft)fail('SAVE_OR_CANCEL_EXISTING_UNSAVED_NATIVE_OUTFIT_FIRST');
 }
 function renderLooks(){
  looks.replaceChildren();
  for(const [i,proposal] of (generated?.combinations||[]).entries()){
   const card=create('article',null,'look');
   card.append(create('strong','Look '+(i+1)),
    create('p',Object.entries(proposal.slots).map(([slot,id])=>{
     const original=byId(id),part=[original?.color,original?.itemType].filter(Boolean).join(' ');
     return slotNames[slot]+': '+(part||'Missing original');
    }).join(' · '),'small'));
   const photos=create('div',null,'photos');
   for(const id of Object.values(proposal.slots))photos.append(img(byId(id)));
   card.append(photos);
   const choose=create('button','Try this owned outfit');
   choose.id='styleOwned03Choose'+(i+1);
   choose.onclick=()=>{try{chooseLook(i);}catch(error){text(String(error.message||error));}};
   card.append(choose);looks.append(card);
  }
 }
 function ensureSameCurrentSources(){
  live();
  const fresh=board.readOnlyWardrobe();
  if(fresh.boardFingerprint!==snapshot.fingerprint||fresh.ownerId!==snapshot.ownerId||
    fresh.generation!==snapshot.generation)fail('STALE_WARDROBE_OR_BOARD');
  const map=new Map(fresh.items.map(x=>[x.id,x]));
  for(const [id,hash] of Object.entries(active?.sourceSHA256ById||{})){
   const row=map.get(id);
   if(!row||row.ownerId!==snapshot.ownerId||row.sourceSHA256!==hash||
       row.originalPhoto?.sha256!==hash||
       row.originalPhoto?.image!==byId(id)?.originalPhoto?.image)
    fail('SOURCE_CHANGED_OR_GARMENT_DELETED');
  }
 }
 function applySlots(slots,hashes){
  ensureSameCurrentSources();
  const result=board.applyOwnedSlots({selected:slots,sourceHashes:hashes,
   ownerId:snapshot.ownerId,generation:snapshot.generation,fingerprint:snapshot.fingerprint});
  return result;
 }
 function renderWorkspace(){
  workspace.replaceChildren();
  if(!current)return;
  workspace.append(create('h3','Edit this outfit'));
  const slotDiv=create('div');
  for(const [slot,id]of Object.entries(current.slots)){
   const item=byId(id),piece=create('div',null,'piece');piece.append(img(item));
   const inner=create('div'),mark=slot===generated?.pinnedSlot;
   inner.append(create('strong',slotNames[slot]+': '+(item?.name||item?.itemType||id)));
   if(mark)inner.append(create('p','Pinned · this item cannot be replaced','note'));
   else{
    const selector=create('select');selector.id='styleOwned03Swap-'+slot;
    selector.setAttribute('aria-label','Swap '+slotNames[slot]);
    for(const option of rows().filter(row=>eligibleSlot03(slot,row))){
     const opt=create('option',option.name||option.itemType||option.id);opt.value=option.id;
     selector.append(opt);
    }
    selector.value=id;
    const swap=create('button','Swap '+slotNames[slot]);swap.id='styleOwned03SwapButton-'+slot;
    swap.onclick=()=>{try{swapPiece(slot,selector.value);}catch(error){text(String(error.message||error));}};
    inner.append(selector,swap);
   }
   piece.append(inner);slotDiv.append(piece);
  }
  workspace.append(slotDiv);
  const actions=create('div',null,'toolbar');
  const undo=create('button','Undo last swap');undo.id='styleOwned03Undo';
  undo.disabled=!history.length;
  undo.onclick=()=>{try{undoSwap();}catch(error){text(String(error.message||error));}};
  const cancel=create('button','Cancel changes');cancel.id='styleOwned03Cancel';
  cancel.onclick=()=>{try{cancelChanges();}catch(error){text(String(error.message||error));}};
  const save=create('button','Save this outfit','primary');save.id='styleOwned03Save';
  save.onclick=async()=>{save.disabled=true;try{await saveCurrent();}
   catch(error){text('Outfit not saved: '+String(error.message||error)+'. Correct the issue and try again.');}
   finally{save.disabled=false;}};
  actions.append(undo,cancel,save);workspace.append(actions);
  if(savedId){
   const reopen=create('button','Reopen saved outfit');reopen.id='styleOwned03Reopen';
   reopen.onclick=()=>{try{reopenSaved();}catch(error){text(String(error.message||error));}};
   workspace.append(reopen);
  }
 }
 async function generateLooks(){
  if(busy)fail('BUSY');
  ensurePin();
  busy=true;generate.disabled=true;
  try{
   // Reverify source and owner after any newly committed photo/index change.
   snapshot=await verifiedPrivateStyleRoster03(board,{singleItemReviews});
   live();
   if(!byId(pinId))fail('SELECTED_PHOTO_WAS_REMOVED_OR_UNVERIFIED');
   generated=suggestThreeNativeOwned03(rows(),{
    ownerId:snapshot.ownerId,pinnedId:pinId,
    occasion:doc.getElementById('stylistOccasion')?.value||'Casual'});
   current=null;active=null;history=[];savedId=null;
   looks.replaceChildren();workspace.replaceChildren();
   renderLooks();
   text(generated.reason+' Selected item stays pinned. Choose a look to swap or save it.');
   return generated;
  }finally{busy=false;generate.disabled=false;}
 }
 function chooseLook(index){
  ensurePin();
  const proposal=generated?.combinations[index];
  if(!proposal||proposal.pinnedId!==pinId)fail('UNKNOWN_OR_STALE_SUGGESTION');
  if(!styleDraft){
   if(board.status().dirty)fail('SAVE_OR_CANCEL_PREVIOUS_UNSAVED_OUTFIT');
   board.startNew();styleDraft=true;
  }
  active=proposal;
  applySlots(proposal.slots,proposal.sourceSHA256ById);
  current={slots:{...proposal.slots},sourceSHA256ById:{...proposal.sourceSHA256ById}};
  history=[];savedId=null;
  renderWorkspace();text('Original '+(byId(pinId)?.name||'clothing')+
   ' stays pinned. Swap one piece at a time; no outfit is saved yet.');
  return current;
 }
 function swapPiece(slot,itemId){
  if(!current||!styleDraft)fail('CHOOSE_OWNED_OUTFIT_FIRST');
  const next=validateOwnedSwap03(rows(),{ownerId:snapshot.ownerId,pinnedId:pinId,
   slots:current.slots,slot,itemId});
  if(next.signature===Object.entries(current.slots).sort(([a],[b])=>a.localeCompare(b))
   .map(([slot,id])=>slot+':'+id).join('|'))return current;
  const old={slots:{...current.slots},sourceSHA256ById:{...current.sourceSHA256ById}};
  applySlots(next.slots,next.sourceSHA256ById);
  history.push(old);
  current={slots:{...next.slots},sourceSHA256ById:{...next.sourceSHA256ById}};
  renderWorkspace();text('Swapped with another genuine owned garment · unsaved. Pinned photo unchanged.');
  return current;
 }
 function undoSwap(){
  if(!history.length||!current)fail('NO_SWAP_TO_UNDO');
  const previous=history.at(-1);
  applySlots(previous.slots,previous.sourceSHA256ById);
  current=history.pop();
  renderWorkspace();text('Last swap undone. Original pinned clothing still selected.');
  return current;
 }
 function cancelChanges(){
  if(styleDraft&&board.status().active)board.cancel();
  styleDraft=false;current=null;active=null;history=[];savedId=null;
  workspace.replaceChildren();text('Canceled unsaved edits. Existing saved outfits and original photos unchanged.');
 }
 async function saveCurrent(){
  if(!styleDraft||!current)fail('CHOOSE_SUGGESTION_BEFORE_SAVING');
  ensureSameCurrentSources();
  const before=board.readOnlySnapshot();
  const receipt=await board.persist({asNew:true});
  const stored=board.readOnlySnapshot(),saved=stored.saved[receipt.selected];
  if(!receipt.saved||!saved||
    Object.entries(current.slots).some(([slot,id])=>saved.slots?.[slot]!==id||
      saved.slotSources?.[slot]?.sha256!==current.sourceSHA256ById[id])||
    before.saved.some(x=>!stored.saved.some(y=>y.id===x.id&&JSON.stringify(y)===JSON.stringify(x))))
   fail('SAVED_OUTFIT_VERIFY_FAILED');
  savedId=saved.id;styleDraft=false;history=[];
  renderWorkspace();
  text('Saved! Outfit '+(saved.name||'Owned outfit')+
   ' is in your existing Saved outfits list. Backup sync pending; original clothing unchanged.');
  return receipt;
 }
 function reopenSaved(){
  live();if(board.status().dirty)fail('SAVE_OR_CANCEL_UNSAVED_EDITS_BEFORE_REOPEN');
  const boardSnapshot=board.readOnlySnapshot();
  const index=boardSnapshot.saved.findIndex(x=>x.id===savedId);
  if(index<0)fail('SAVED_OUTFIT_MISSING');
  const record=board.selectSaved(index);
  if(!Object.entries(current?.slots||{}).every(([slot,id])=>record.slots[slot]===id))
   fail('REOPENED_OUTFIT_REFERENCES_CHANGED');
  text('Reopened saved look with original garment IDs; missing items are retained.');
  return record;
 }
 async function selectGarment(itemId){
  if(styleDraft&&board.status().dirty)fail('CANCEL_UNSAVED_OUTFIT_BEFORE_CHANGING_PIN');
  await refresh({quiet:true});
  if(!byId(itemId)){
   if(snapshot?.pending?.some(row=>row.id===itemId)){
    requestedReviewId=itemId;
    pending.scrollIntoView({block:'center',behavior:'auto'});
    text('Confirm the one-item photograph shown above to make this saved garment selectable.');
    return itemId;
   }
   fail('SELECTED_ITEM_MISSING_OR_NOT_VERIFIED');
  }
  requestedReviewId=null;pinId=itemId;selector.value=itemId;generated=null;current=null;active=null;
  styleDraft=false;history=[];savedId=null;
  looks.replaceChildren();workspace.replaceChildren();displayPinned();
  text('New original garment selected and pinned. Generate your owned outfits.');
  return itemId;
 }
 selector.onchange=()=>{
  if(styleDraft&&board.status().dirty){
   selector.value=pinId;text('Cancel the current unsaved look before changing your pinned piece.');return;
  }
  pinId=selector.value;generated=null;current=null;active=null;
  history=[];savedId=null;looks.replaceChildren();workspace.replaceChildren();displayPinned();
 };
 refreshButton.onclick=()=>refresh().catch(error=>text(String(error.message||error)));
 generate.onclick=()=>generateLooks().catch(error=>text(String(error.message||error)));
 const onInventory=()=>{if(!revoked)refresh({quiet:true}).catch(error=>text('Saved closet refresh needs review: '+String(error.message||error)));};
 win.addEventListener('closet:style-owned-inventory-committed',onInventory);
 const onRevoked=()=>clearPrivate();
 win.addEventListener('closet:alpha-session-changed',onRevoked);
 const logout=doc.getElementById('logout');
 logout?.addEventListener('click',onRevoked,true);
 await refresh();
 return Object.freeze({status:()=>({
  active:!!snapshot&&board.status().active,ownerId:snapshot?.ownerId||null,
  pinnedId:pinId,lookCount:generated?.combinations.length||0,
  dirty:styleDraft&&board.status().dirty,selectedSlots:current?{...current.slots}:null,
  savedId,sourceSHA256Verified:!!snapshot?.originalSHA256Verified,
  fallback:'genuine-original-photo-only-unless-independent-3d-donor-vetted',
  realSignedRLSVerified:false,releaseAuthorized:false,familyAlpha:'HOLD'}),
  refresh,selectGarment,generate:generateLooks,suggestions:()=>{live();return generated?structuredClone(generated):null;},selectSuggestion:chooseLook,
  swap:swapPiece,undo:undoSwap,cancel:cancelChanges,save:saveCurrent,reopen:reopenSaved,
  dispose(){win.removeEventListener('closet:style-owned-inventory-committed',onInventory);
   win.removeEventListener('closet:alpha-session-changed',onRevoked);
   logout?.removeEventListener('click',onRevoked,true);
   section.remove();style.remove();clearPrivate();},
  researchOnly:true,releaseAuthorized:false});
}
