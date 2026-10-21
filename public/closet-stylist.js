'use strict';
let styledCollectionResults=[],stylistAnchorItemId=null,stylistRequestRevision=0,stylistPreviewRevision=0;
function stylistSupportsPiece(piece){
 return !!piece&&typeof piece.id==='string'&&
  ['Tops','Bottoms','Dresses','Outerwear','Shoes'].includes(piece.category);
}
// Pin what the customer actually saw, not just garment IDs. A new crop,
// edited category/color or replacement photo with the same ID is a new item
// for a previously prepared outfit. Check again inside the queued DB write.
function stylistSelectedSources(board){
 return Object.entries(board.slots||{}).map(([slot,id])=>{
  const item=items.find(piece=>piece.id===id);
  return {slot,id,image:item?.image,category:item?.category,itemType:item?.itemType,
   color:item?.color,pattern:item?.pattern,
   seasons:JSON.stringify(item?.seasons||[])};
 });
}
function stylistSourcesCurrent(sources){
 return stylistOwnsCloset()&&sources.length>0&&sources.every(source=>{
  const item=items.find(piece=>piece.id===source.id);
  return !!item&&item.image===source.image&&item.category===source.category&&
   item.itemType===source.itemType&&item.color===source.color&&
   item.pattern===source.pattern&&JSON.stringify(item.seasons||[])===source.seasons;
 });
}
function renderStylistAnchor(){
 let piece=items.find(x=>x.id===stylistAnchorItemId);
 if(stylistAnchorItemId&&!stylistSupportsPiece(piece)){
  stylistAnchorItemId=null;styledCollectionResults=[];piece=null;
 }
 $('stylistAnchor').hidden=!piece;
 if(piece){
  $('stylistAnchorPhoto').src=piece.image;
  $('stylistAnchorPhoto').alt=piece.name||piece.itemType||'Selected piece';
  $('stylistAnchorName').textContent=piece.name||piece.itemType||piece.category;
 }else $('stylistAnchorPhoto').removeAttribute('src');
}
function stylistOwnsCloset(){
 return typeof boardWriteContext==='function'&&boardWriteContext().current();
}
function refuseStylistAccount(){
 ++stylistRequestRevision;stylistAnchorItemId=null;styledCollectionResults=[];
 $('createCollectionOutfits').disabled=false;renderStyledCollection();
 $('stylistStatus').textContent='Your closet account changed. Reload this page and sign in again before styling.';
}
function styleNewClosetItem(id){
 if(!stylistOwnsCloset()){refuseStylistAccount();return false;}
 const piece=items.find(x=>x.id===id);
 if(!stylistSupportsPiece(piece))return false;
 stylistAnchorItemId=piece.id;styledCollectionResults=[];
 renderStyledCollection();switchView('stylist');
 $('stylistStatus').textContent='Finding outfits for '+(piece.name||piece.itemType||'this piece')+'…';
 $('styleCollectionForm').requestSubmit();
 return true;
}
async function previewStyledOutfit(result,board,index,button,status){
 if(button.disabled)return;
 const revision=++stylistPreviewRevision,request=stylistRequestRevision;
 const owner=window.closetAuth?.user?.id||null,selection=result.board;
 const sources=stylistSelectedSources(board);
 const current=()=>revision===stylistPreviewRevision&&request===stylistRequestRevision&&
  owner===(window.closetAuth?.user?.id||null)&&result.board===selection&&
  styledCollectionResults.includes(result)&&stylistSourcesCurrent(sources);
 button.disabled=true;status.textContent='Opening preview…';let displayed=null;
 try{
  await outfitBoardReady;
  if(!current()){status.textContent='This outfit changed. Choose the current option again.';return;}
  const next=cleanOutfitBoard({...board,name:result.context.request+' · option '+(index+1)},items);
  if(Object.keys(next.slots).length!==Object.keys(board.slots).length)
   throw Error('This outfit changed. Create outfits again.');
  currentBoard=next;syncBoardInputs();renderOutfitBoard();
  // Navigation is immediate; a slow/failed storage write cannot later steal
  // focus back from the customer's next screen or prevent a local preview.
  $('boardSaveStatus').textContent='';switchView('builder');displayed=currentBoard;
  const panel=$('reusableFigureStage');
  panel?.scrollIntoView?.({block:'center',behavior:'instant'});
  if(panel){panel.tabIndex=-1;panel.focus?.({preventScroll:true});}
  await persistBoardState();
 }catch(error){
  if(displayed&&currentBoard===displayed&&owner===(window.closetAuth?.user?.id||null))
   $('boardSaveStatus').textContent='Your preview is available, but changes could not be saved. Keep this page open and try saving again.';
  else if(!displayed)status.textContent=error?.message||'Could not open this preview. Try again.';
 }finally{button.disabled=false;}
}
function renderStyledCollection(){
 renderStylistAnchor();
 const grid=$('styledCollectionResults');grid.replaceChildren();
 $('stylistFreshness').textContent=trendFreshnessText();
 for(const [index,result]of styledCollectionResults.entries()){
  const board=cleanOutfitBoard(result.board,items),changed=Object.keys(board.slots).length!==Object.keys(result.board.slots).length;
  const card=node('article',null,'styled-outfit');card.append(node('p','FROM YOUR COLLECTION','eyebrow'),node('h3',result.context.request+' · option '+(index+1)));
  const photos=node('div',null,'styled-outfit-photos');
  for(const slot of outfitSlots){const item=items.find(x=>x.id===board.slots[slot.id]);if(!item)continue;const piece=node('figure'),img=node('img');img.src=item.image;img.alt=item.name||item.itemType;img.decoding='async';img.loading=index===0?'eager':'lazy';img.width=240;img.height=260;img.onerror=()=>{img.hidden=true;piece.append(node('p','Photo unavailable. Open this piece in My closet to check its photo.','fine'));};piece.append(img,node('figcaption',item.name||item.itemType));photos.append(piece);}card.append(photos);
  const missing=boardGaps(board,items).filter(s=>!s.optional);
  card.append(node('p',missing.length?'Still needed from your closet: '+missing.map(s=>s.label).join(', '):'A complete outfit using clothes you own.'));
  card.append(node('p','Chosen for '+result.context.request.toLowerCase()+', with coordinating colors and fewer competing patterns. Unknown details are not assumed.','fine'));
  for(const notice of result.notices)card.append(node('p',notice,'fine'));
  const current=(activeTrendLibrary?.updatedAt||null)===result.trendUpdatedAt;
  if(!current)card.append(node('p','The trend library has changed. Create outfits again to use the newest research.','fine'));
  if(result.references.length){const details=node('details');details.append(node('summary','How current trends informed this outfit'));const seen=new Set();for(const reference of result.references){if(seen.has(reference.label)||!items.some(x=>x.id===reference.itemId))continue;seen.add(reference.label);details.append(node('p',reference.label+' — '+reference.reason));details.append(boardLink(reference.source.title,reference.source.url));}details.append(node('p','References match the recorded garment type. Exact cut and material may differ.','fine'));card.append(details);}
  else card.append(node('p','No matching trend direction in the current library for these pieces. This combination uses general styling rules.','fine'));
  if(result.swapMessage)card.append(node('p',result.swapMessage,'styled-swap-status'));
  // One tap replaces exactly ONE non-pinned piece inside the current option.
  // These are reversible previews; no board or garment is stored until Save.
  const swapControls=node('div',null,'styled-swap-actions');
  const topPiece=items.find(x=>x.id===board.slots.top);
  const topSwapLabel=topPiece?.category==='Dresses'?(['Jumpsuit','Romper'].includes(topPiece.itemType)?'Swap one-piece':'Swap dress'):'Swap top';
  for(const [slot,label] of [['top',topSwapLabel],['bottom','Swap bottoms'],
    ['shoes','Swap shoes'],['layer','Swap layer']]){
   if(changed||!stylistSwapChoices(result,slot,items,stylistAnchorItemId).length)continue;
   const swap=node('button',label,'secondary styled-swap-button');
   swap.type='button';swap.setAttribute('aria-label',label+' in option '+(index+1));
   swap.onclick=()=>{
    const selected=stylistSwapOne(result,slot,items,stylistAnchorItemId);
    if(!selected)return;
    result.board=selected.board;result.saveMessage='';
    result.swapHistory={...result.swapHistory,[slot]:selected.history};
    result.signature=Object.entries(result.board.slots).sort()
     .map(([k,v])=>k+':'+v).join('|');
    result.missing=boardGaps(result.board,items).filter(x=>!x.optional).map(x=>x.id);
    // A recommendation for a different selected garment must never retain
    // retailer/trend references from a previous piece.
    result.references=[];
    result.notices=['Swapped using another saved closet piece. Check the photos and fit together.'];
    result.swapMessage=label.replace('Swap ','Swapped ')+' to '+selected.name+
     '. Preview only — tap Save outfit when you like it.';
    renderStyledCollection();
   };
   swapControls.append(swap);
  }
  if(swapControls.childElementCount){
   const title=node('p','Change one piece without leaving this outfit','fine');
   card.append(title,swapControls);
  }
  const actions=node('div',null,'actions'),edit=node('button','Preview on model','secondary'),save=node('button','Save outfit','primary');edit.type=save.type='button';edit.disabled=changed;
  save.disabled=changed||missing.length>0||!!result.savePending||result.savedBoard===result.board;
  if(result.savePending)save.textContent='Saving outfit…';
  else if(result.savedBoard===result.board)save.textContent='Saved';
  if(missing.length)card.append(node('p','Preview this starting combination, then add the missing clothes before saving a complete styled outfit.','fine'));
  if(changed)card.append(node('p','A selected garment was removed or recategorized. Create outfits again.','fine'));
  const actionStatus=node('p',result.saveMessage||null,'fine');
  edit.onclick=()=>previewStyledOutfit(result,board,index,edit,actionStatus);
  save.onclick=async()=>{
   if(save.disabled||result.savePending)return;result.savePending=true;save.disabled=true;actionStatus.textContent='Saving outfit…';
   const owner=window.closetAuth?.user?.id||null,selection=result.board,
    request=stylistRequestRevision,sources=stylistSelectedSources(board);
   const current=()=>owner===(window.closetAuth?.user?.id||null)&&
    request===stylistRequestRevision&&result.board===selection&&
    styledCollectionResults.includes(result)&&stylistSourcesCurrent(sources);
   try{await outfitBoardReady;
    if(!current())throw Error('This outfit or closet changed. Create outfits again before saving.');
    // The account, photo and garment details must STILL match when this
    // queued storage operation finally begins. A matching ID is insufficient.
    await saveOwnedOutfitBoard({...board,name:result.context.request+' · option '+(index+1)},current);
    if(current()){result.savedBoard=selection;result.saveMessage='Saved. Find it in Outfit builder → Saved outfits.';}
    save.textContent='Saved';renderSavedOutfitBoards();
   }catch(error){if(result.board===selection)result.saveMessage=error?.message||'Could not save this outfit.';}
   finally{result.savePending=false;if(styledCollectionResults.includes(result))renderStyledCollection();}
  };
  actions.append(edit,save);card.append(actions,actionStatus);grid.append(card);
 }
}
$('styleCollectionForm').onsubmit=async event=>{
 event.preventDefault();const revision=++stylistRequestRevision;
 const owner=window.closetAuth?.user?.id||null;
 const anchor=stylistAnchorItemId;
 const preferences={request:$('stylistOccasion').value,audience:$('stylistAudience').value,season:$('stylistSeason').value,anchorItemId:anchor||undefined};
 const isCurrent=()=>revision===stylistRequestRevision&&anchor===stylistAnchorItemId&&
  owner===(window.closetAuth?.user?.id||null)&&
  preferences.request===$('stylistOccasion').value&&preferences.audience===$('stylistAudience').value&&preferences.season===$('stylistSeason').value;
 const button=$('createCollectionOutfits');button.disabled=true;$('stylistStatus').textContent='Matching your clothes with the latest verified trends…';
 // Owned-outfit suggestions must work immediately without waiting for a
 // weekly magazine-data request. The trend cache and normal refresh process
 // update independently; an offline device still knows what clothes it owns.
 try{await closetReady;
  if(!isCurrent())return;
  if(!stylistOwnsCloset()){refuseStylistAccount();return;}
  styledCollectionResults=styleOwnedCollection(items,{request:$('stylistOccasion').value,audience:$('stylistAudience').value,season:$('stylistSeason').value,anchorItemId:stylistAnchorItemId||undefined},activeTrendLibrary);
  renderStyledCollection();
  // The scorer intentionally returns partial outfits for sparse closets.
  // Describe them as starting combinations rather than completed outfits.
  // Each card states its actual missing slots; we never invent garments.
  const onlyPartial=styledCollectionResults.length>0&&
   styledCollectionResults.every(result=>result.missing.length>0);
  $('stylistStatus').textContent=onlyPartial?
   (stylistAnchorItemId?'Your chosen piece is included in a partial look. ':
    'Your closet has starting combinations, but no complete outfit yet. ')+
    'Add the missing clothes listed below to finish an outfit.':
   styledCollectionResults.length?
    'Here are '+styledCollectionResults.length+' outfit option'+(styledCollectionResults.length===1?'':'s')+
    (stylistAnchorItemId?' using your chosen piece and clothes you own.':' from your collection.'):
    stylistAnchorItemId?'No compatible outfit for that piece yet. Try Casual or adjust its details.':
    items.length?'No suitable combination for this occasion yet. Add or adjust the clothing categories in My closet.':
    'Add clothing photos to My closet first, then create an outfit.';
 }catch{if(isCurrent())$('stylistStatus').textContent='Could not create outfits. Your closet is unchanged; try again.';}finally{if(revision===stylistRequestRevision)button.disabled=false;}
};
for(const id of ['stylistOccasion','stylistAudience','stylistSeason'])$(id).onchange=()=>{styledCollectionResults=[];++stylistRequestRevision;$('createCollectionOutfits').disabled=false;renderStyledCollection();$('stylistStatus').textContent='Create outfits for your new preferences.';};
$('stylistSeason').value=['Winter','Winter','Spring','Spring','Spring','Summer','Summer','Summer','Fall','Fall','Fall','Winter'][new Date().getMonth()];
$('stylistClearAnchor').onclick=()=>{
 ++stylistRequestRevision;$('createCollectionOutfits').disabled=false;
 stylistAnchorItemId=null;styledCollectionResults=[];
 renderStyledCollection();
 $('stylistStatus').textContent='Style my whole closet. Choose an occasion and create outfits.';
};
$('stylistAddClothes').onclick=()=>switchView('scan');
