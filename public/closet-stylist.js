'use strict';
let styledCollectionResults=[];
const styledCollectionSaveStates=new WeakMap();
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
  edit.onclick=async()=>{await outfitBoardReady;$('savedOutfitReview').hidden=true;currentBoard=cleanOutfitBoard({...board,name:result.context.request+' · option '+(index+1)},items);syncBoardInputs();renderOutfitBoard();await storeBoard();switchView('builder');};
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
  const updateSaveState=(phase,message)=>{styledCollectionSaveStates.set(result,{phase,message});if(card.isConnected)applySaveState();else renderStyledCollection();};
  refresh.onclick=async()=>{refresh.disabled=true;try{await refreshSavedWardrobeForOutfits();$('createCollectionOutfits').focus({preventScroll:true});}catch(error){updateSaveState('wardrobe-changed',error.message);refresh.disabled=false;}};
  save.onclick=async()=>{
   if(['saving','saved','wardrobe-changed'].includes(styledCollectionSaveStates.get(result)?.phase))return;
   updateSaveState('saving','Saving outfit…');
   try{
    await outfitBoardReady;if(savedOutfitBoards.length>=50)throw Error('You can save up to 50 outfits.');
    const saved={...board,name:result.context.request+' · option '+(index+1)};
    await saveOwnedOutfit(saved);updateSaveState('saved','Saved. Find it in Outfit builder → Saved outfits.');renderSavedOutfitBoards();
   }catch(error){updateSaveState(error?.code==='OUTFIT_WARDROBE_CHANGED'?'wardrobe-changed':'error',error.message||'Could not save this outfit.');}
  };
  actions.append(edit,save,refresh);card.append(actions,status);applySaveState();grid.append(card);
 }
 void mountOriginalPhotoPreview167();
}
$('styleCollectionForm').onsubmit=async event=>{
 event.preventDefault();const button=$('createCollectionOutfits');button.disabled=true;$('stylistStatus').textContent='Matching your clothes with the latest verified trends…';
 try{await closetReady;refreshStylistFocusItems();await refreshTrendLibrary(true);
  styledCollectionResults=styleOwnedCollection(items,{request:$('stylistOccasion').value,audience:$('stylistAudience').value,season:$('stylistSeason').value,focusItemId:$('stylistFocusItem').value||undefined},activeTrendLibrary);
  renderStyledCollection();$('stylistStatus').textContent=styledCollectionResults.length?'Here are '+styledCollectionResults.length+' outfit option'+(styledCollectionResults.length===1?'':'s')+' from your collection.':items.length?'No suitable combination for this occasion yet. Add or adjust the clothing categories in My closet.':'Add clothing photos to My closet first, then create an outfit.';
 }catch{$('stylistStatus').textContent='Could not create outfits. Your closet is unchanged; try again.';}finally{button.disabled=false;}
};
for(const id of ['stylistOccasion','stylistAudience','stylistSeason'])$(id).onchange=()=>{styledCollectionResults=[];renderStyledCollection();$('stylistStatus').textContent='Create outfits for your new preferences.';};
$('stylistSeason').value=['Winter','Winter','Spring','Spring','Spring','Summer','Summer','Summer','Fall','Fall','Fall','Winter'][new Date().getMonth()];
$('stylistAddClothes').onclick=()=>switchView('scan');
