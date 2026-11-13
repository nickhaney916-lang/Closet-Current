'use strict';
let styledCollectionResults=[];
const styledCollectionSaveStates=new WeakMap();
let styledCollectionRequestSerial=0;
function refreshStylistFocusItems(){
 const select=$('stylistFocusItem');if(!select)return;
 const selected=select.value;select.replaceChildren(new Option('Use my whole closet',''));
 const eligible=items.filter(item=>item&&typeof item.id==='string'&&
  ['Tops','Dresses','Bottoms','Shoes','Outerwear'].includes(item.category));
 for(const item of eligible){
  const details=[item.name||item.itemType||item.category,item.color].filter(Boolean).join(' · ');
  select.add(new Option(details.slice(0,140),item.id));
 }
 select.value=eligible.some(item=>item.id===selected)?selected:'';
}
closetReady.then(refreshStylistFocusItems).catch(()=>{});
window.addEventListener('closet:style-owned-inventory-committed',refreshStylistFocusItems);
window.addEventListener('closet:session-locked',()=>{
 // A previous owner's trend fetch may resolve after sign-out. Revoke its UI lease.
 styledCollectionRequestSerial++;
 $('createCollectionOutfits').disabled=false;
 $('stylistFocusItem').replaceChildren(new Option('Use my whole closet',''));
 styledCollectionResults=[];renderStyledCollection();
});
// P167 research integration: signed original photo preview is part of the
// normal Style My New Clothes card rendering in this isolated app branch.
// No arbitrary-photo 3D garment is substituted or claimed.
let originalPhotoPreview167=null,originalPhotoMountSerial167=0;
function currentPhotoOwnerSession167(){
 const a=window.closetAuth;
 a?.assertCurrent?.();
 let token=null;
 try{token=JSON.parse(localStorage.getItem('closet-current-auth-v1')||'null');}catch{}
 return {authenticated:!!a?.user?.id&&$('authGate')?.hidden===true&&$('appShell')?.hidden===false,
  ownerId:a?.user?.id,epoch:token?.epoch,privateDbName:db?.name};
}
async function signedOwnerSavedRows167(){
 const start=currentPhotoOwnerSession167();
 if(!start.authenticated||start.privateDbName!=='closet-current-user-'+start.ownerId||!start.epoch)
  throw Error('Private owner session is unavailable');
 const saved=await readAll();
 const end=currentPhotoOwnerSession167();
 if(!end.authenticated||start.ownerId!==end.ownerId||start.epoch!==end.epoch||
   start.privateDbName!==end.privateDbName)
  throw Error('Owner changed while reading private saved garments');
 return saved;
}
async function mountOriginalPhotoPreview167(){
 const ticket=++originalPhotoMountSerial167;
 originalPhotoPreview167?.dispose();
 originalPhotoPreview167=null;
 if(!styledCollectionResults.some(x=>!!x?.focusItemId))return;
 try{
  const mod=await import('./style-photo-preview-gate-165.mjs');
  if(ticket!==originalPhotoMountSerial167)return;
  const viewer=mod.createStyledOwnerPhotoPreview165({
    grid:$('styledCollectionResults'),
    readResults:()=>styledCollectionResults,
    readOwnerItems:signedOwnerSavedRows167,
    getSession:currentPhotoOwnerSession167,
    events:window
  });
  if(ticket!==originalPhotoMountSerial167){viewer.dispose();return;}
  viewer.mount();
  originalPhotoPreview167=viewer;
 }catch{
  if(ticket===originalPhotoMountSerial167&&styledCollectionResults.length)
   $('stylistStatus').textContent='Outfits are ready. Original clothing photo preview is unavailable in this session; sign in and try again.';
 }
}
// Generated outfit cards may finish asynchronous work after their owner,
// wardrobe or original styling request changed. Bind all three actions to
// one exact source session and original rendered combination.
function beginStyledCollectionCardOwnerLease(result,card){
 const auth=window.closetAuth,owner=auth?.user?.id,ownerDB=db,
  epoch=captureOperationEpoch,serial=styledCollectionRequestSerial,
  wardrobe=[...items];
 const ownsSession=()=>{
  if(typeof owner!=='string'||!owner||window.closetAuth!==auth||
     auth.user?.id!==owner||ownerDB!==db||
     ownerDB?.name!=='closet-current-user-'+owner||
     epoch!==captureOperationEpoch||
     $('authGate')?.hidden!==true||$('appShell')?.hidden!==false)return false;
  try{auth.assertCurrent?.();return true;}catch{return false;}
 };
 const current=()=>ownsSession()&&serial===styledCollectionRequestSerial&&
  styledCollectionResults.includes(result)&&
  items.length===wardrobe.length&&wardrobe.every((row,i)=>row===items[i]);
 if(!current()||!card.isConnected)return null;
 return {ownsSession,current};
}
function renderStyledCollection(){
 const grid=$('styledCollectionResults');
 ++originalPhotoMountSerial167;
 originalPhotoPreview167?.dispose();originalPhotoPreview167=null;
 grid.replaceChildren();
 $('stylistFreshness').textContent=trendFreshnessText();
 for(const [index,result]of styledCollectionResults.entries()){
  const board=cleanOutfitBoard(result.board,items),changed=Object.keys(board.slots).length!==Object.keys(result.board.slots).length;
  const card=node('article',null,'styled-outfit');card.append(node('p','FROM YOUR COLLECTION','eyebrow'),node('h3',result.context.request+' · option '+(index+1)));
  if(result.focusItemId){const focused=items.find(x=>x.id===result.focusItemId);if(!focused)continue;card.append(node('p','Includes '+(focused.name||focused.itemType)+' from your saved closet.','fine'));}
  const photos=node('div',null,'styled-outfit-photos');
  for(const slot of outfitSlots){const item=items.find(x=>x.id===board.slots[slot.id]);if(!item)continue;const piece=node('figure'),img=node('img');img.src=item.image;img.alt=item.name||item.itemType;piece.append(img,node('figcaption',item.name||item.itemType));photos.append(piece);}card.append(photos);
  const missing=boardGaps(board,items).filter(s=>!s.optional);
  card.append(node('p',missing.length?'Still needed from your closet: '+missing.map(s=>s.label).join(', '):'A complete outfit using clothes you own.'));
  card.append(node('p','Chosen for '+result.context.request.toLowerCase()+', with coordinating colors and fewer competing patterns. Unknown details are not assumed.','fine'));
  for(const notice of result.notices)card.append(node('p',notice,'fine'));
  const current=(activeTrendLibrary?.updatedAt||null)===result.trendUpdatedAt;
  if(!current)card.append(node('p','The trend library has changed. Create outfits again to use the newest research.','fine'));
  if(result.references.length){const details=node('details');details.append(node('summary','How current trends informed this outfit'));const seen=new Set();for(const reference of result.references){if(seen.has(reference.label)||!items.some(x=>x.id===reference.itemId))continue;seen.add(reference.label);details.append(node('p',reference.label+' — '+reference.reason));details.append(boardLink(reference.source.title,reference.source.url));}details.append(node('p','References match the recorded garment type. Exact cut and material may differ.','fine'));card.append(details);}
  else card.append(node('p','No matching trend direction in the current library for these pieces. This combination uses general styling rules.','fine'));
  const actions=node('div',null,'actions'),edit=node('button','Adjust on outfit board','secondary'),save=node('button','Save outfit','primary');edit.type=save.type='button';save.disabled=changed;
  if(changed)card.append(node('p','A selected garment was removed or recategorized. Create outfits again.','fine'));
  edit.onclick=async()=>{
   const lease=beginStyledCollectionCardOwnerLease(result,card);
   if(!lease||!edit.isConnected)return;
   try{
    await outfitBoardReady;
    if(!lease.current()||!edit.isConnected)return;
    currentBoard=cleanOutfitBoard({...board,name:result.context.request+' · option '+(index+1)},items);
    syncBoardInputs();renderOutfitBoard();
    if(!lease.current())return;
    const saved=await storeBoard();
    if(!lease.current())return;
    if(!saved){
     updateSaveState('error','Could not save this outfit draft. Review the outfit board and try again.');
     return;
    }
    // Do not navigate away if the user switched pages while saving.
    if($('stylist')?.hidden!==false)return;
    switchView('builder');
   }catch{
    if(lease.current()&&card.isConnected)
     updateSaveState('error','Could not open this outfit safely. Reopen My Closet and try again.');
   }
  };
  const status=node('p',null,'fine styled-save-status');status.setAttribute('role','status');
  const refresh=node('button','Refresh my closet','secondary refresh-outfit-wardrobe');refresh.type='button';
  const applySaveState=()=>{
   const state=styledCollectionSaveStates.get(result);
   status.textContent=state?.message||'';
   save.textContent=state?.phase==='saved'?'Saved':'Save outfit';
   save.disabled=changed||['saving','saved','wardrobe-changed'].includes(state?.phase);
   edit.disabled=changed||state?.phase==='wardrobe-changed';
   refresh.hidden=state?.phase!=='wardrobe-changed';
  };
  // Detached cards never re-render a later owner's outfit list.
  const updateSaveState=(phase,message)=>{
   styledCollectionSaveStates.set(result,{phase,message});
   if(card.isConnected)applySaveState();
  };
  refresh.onclick=async()=>{
   const lease=beginStyledCollectionCardOwnerLease(result,card);
   if(!lease||!refresh.isConnected)return;
   refresh.disabled=true;
   try{
    await refreshSavedWardrobeForOutfits();
    if(lease.ownsSession())$('createCollectionOutfits')?.focus({preventScroll:true});
   }catch{
    if(lease.current())
     updateSaveState('wardrobe-changed','Refresh your private closet and create these outfits again.');
   }finally{
    if(lease.current()&&card.isConnected)refresh.disabled=false;
   }
  };
  save.onclick=async()=>{
   const lease=beginStyledCollectionCardOwnerLease(result,card);
   if(!lease||!save.isConnected||
      ['saving','saved','wardrobe-changed'].includes(styledCollectionSaveStates.get(result)?.phase))return;
   updateSaveState('saving','Saving outfit…');
   try{
    await outfitBoardReady;
    if(!lease.current())return;
    if(savedOutfitBoards.length>=50)throw Error('You can save up to 50 outfits.');
    const saved={...board,name:result.context.request+' · option '+(index+1)};
    await saveOwnedOutfit(saved);
    if(!lease.current())return;
    updateSaveState('saved','Saved. Find it in Outfit builder → Saved outfits.');
    renderSavedOutfitBoards();
   }catch(error){
    if(!lease.current())return;
    updateSaveState(error?.code==='OUTFIT_WARDROBE_CHANGED'?'wardrobe-changed':'error',
     error?.code==='OUTFIT_WARDROBE_CHANGED'?
      'Selected clothing changed. Refresh your closet and create these outfits again.':
      'Could not save this outfit. Your saved clothing is unchanged; try again.');
   }
  };
  actions.append(edit,save,refresh);card.append(actions,status);applySaveState();grid.append(card);
 }
 void mountOriginalPhotoPreview167();
}
// The Stylist form waits for trend research and closet readiness. Do not
// publish an old owner's combination after those awaits, or let a superseded
// request overwrite a newer result. Pin the exact private session, live
// wardrobe objects, and four requested form inputs at submission.
function beginOwnerStyledCollectionRequest(){
 const auth=window.closetAuth,owner=auth?.user?.id,ownerDB=db,
  epoch=captureOperationEpoch,wardrobe=[...items];
 const values={
  stylistOccasion:$('stylistOccasion')?.value,
  stylistAudience:$('stylistAudience')?.value,
  stylistSeason:$('stylistSeason')?.value,
  stylistFocusItem:$('stylistFocusItem')?.value
 };
 const ownsSession=()=>{
  if(typeof owner!=='string'||!owner||window.closetAuth!==auth||
     auth.user?.id!==owner||db!==ownerDB||
     ownerDB?.name!=='closet-current-user-'+owner||
     epoch!==captureOperationEpoch||
     $('authGate')?.hidden!==true||$('appShell')?.hidden!==false)return false;
  try{auth.assertCurrent?.();return true;}catch{return false;}
 };
 if(!ownsSession())return null;
 const serial=++styledCollectionRequestSerial;
 const current=()=>serial===styledCollectionRequestSerial&&ownsSession()&&
  items.length===wardrobe.length&&wardrobe.every((item,i)=>items[i]===item)&&
  Object.entries(values).every(([id,value])=>$(id)?.value===value);
 return {serial,current,ownsSession,values};
}
$('styleCollectionForm').onsubmit=async event=>{
 event.preventDefault();
 const lease=beginOwnerStyledCollectionRequest();
 if(!lease)return;
 const button=$('createCollectionOutfits');
 button.disabled=true;
 $('stylistStatus').textContent='Matching your clothes with the latest verified trends…';
 try{
  await closetReady;
  if(!lease.current())return;
  refreshStylistFocusItems();
  if(!lease.current())return;
  await refreshTrendLibrary(true);
  if(!lease.current())return;
  const request={
   request:lease.values.stylistOccasion,
   audience:lease.values.stylistAudience,
   season:lease.values.stylistSeason,
   focusItemId:lease.values.stylistFocusItem||undefined
  };
  const created=styleOwnedCollection(items,request,activeTrendLibrary);
  if(!lease.current())return;
  styledCollectionResults=created;
  renderStyledCollection();
  if(!lease.current())return;
  $('stylistStatus').textContent=styledCollectionResults.length?
   'Here are '+styledCollectionResults.length+' outfit option'+(styledCollectionResults.length===1?'':'s')+' from your collection.':
   items.length?'No suitable combination for this occasion yet. Add or adjust the clothing categories in My closet.':
   'Add clothing photos to My closet first, then create an outfit.';
 }catch{
  if(lease.current())
   $('stylistStatus').textContent='Could not create outfits. Your closet is unchanged; try again.';
 }finally{
  // Do not re-enable a newer owner's or a newer request's control from a
  // previous asynchronous completion.
  if(lease.ownsSession()&&lease.serial===styledCollectionRequestSerial)
   button.disabled=false;
 }
};
for(const id of ['stylistOccasion','stylistAudience','stylistSeason'])$(id).onchange=()=>{
 // A preference edit explicitly replaces the earlier request, even if the
 // user returns to the previous value before its trend fetch resolves.
 styledCollectionRequestSerial++;
 $('createCollectionOutfits').disabled=false;
 styledCollectionResults=[];
 renderStyledCollection();
 $('stylistStatus').textContent='Create outfits for your new preferences.';
};
$('stylistSeason').value=['Winter','Winter','Spring','Spring','Spring','Summer','Summer','Summer','Fall','Fall','Fall','Winter'][new Date().getMonth()];
$('stylistAddClothes').onclick=()=>switchView('scan');
