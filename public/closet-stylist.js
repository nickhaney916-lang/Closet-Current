'use strict';
let styledCollectionResults=[],stylistAnchorItemId=null;
function stylistSupportsPiece(piece){
 return !!piece&&typeof piece.id==='string'&&
  ['Tops','Bottoms','Dresses','Outerwear','Shoes'].includes(piece.category);
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
function styleNewClosetItem(id){
 const piece=items.find(x=>x.id===id);
 if(!stylistSupportsPiece(piece))return false;
 stylistAnchorItemId=piece.id;styledCollectionResults=[];
 renderStyledCollection();switchView('stylist');
 $('stylistStatus').textContent='Finding outfits for '+(piece.name||piece.itemType||'this piece')+'…';
 $('styleCollectionForm').requestSubmit();
 return true;
}
function renderStyledCollection(){
 renderStylistAnchor();
 const grid=$('styledCollectionResults');grid.replaceChildren();
 $('stylistFreshness').textContent=trendFreshnessText();
 for(const [index,result]of styledCollectionResults.entries()){
  const board=cleanOutfitBoard(result.board,items),changed=Object.keys(board.slots).length!==Object.keys(result.board.slots).length;
  const card=node('article',null,'styled-outfit');card.append(node('p','FROM YOUR COLLECTION','eyebrow'),node('h3',result.context.request+' · option '+(index+1)));
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
  if(result.swapMessage)card.append(node('p',result.swapMessage,'styled-swap-status'));
  // One tap replaces exactly ONE non-pinned piece inside the current option.
  // These are reversible previews; no board or garment is stored until Save.
  const swapControls=node('div',null,'styled-swap-actions');
  for(const [slot,label] of [['top','Swap top'],['bottom','Swap bottoms'],
    ['shoes','Swap shoes'],['layer','Swap layer']]){
   if(changed||!stylistSwapChoices(result,slot,items,stylistAnchorItemId).length)continue;
   const swap=node('button',label,'secondary styled-swap-button');
   swap.type='button';swap.setAttribute('aria-label',label+' in option '+(index+1));
   swap.onclick=()=>{
    const selected=stylistSwapOne(result,slot,items,stylistAnchorItemId);
    if(!selected)return;
    result.board=selected.board;
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
  const actions=node('div',null,'actions'),edit=node('button','Adjust on outfit board','secondary'),save=node('button','Save outfit','primary');edit.type=save.type='button';save.disabled=changed;
  if(changed)card.append(node('p','A selected garment was removed or recategorized. Create outfits again.','fine'));
  edit.onclick=async()=>{await outfitBoardReady;currentBoard=cleanOutfitBoard({...board,name:result.context.request+' · option '+(index+1)},items);syncBoardInputs();renderOutfitBoard();await storeBoard();switchView('builder');};
  save.onclick=async()=>{save.disabled=true;const status=node('p',null,'fine');card.append(status);try{await outfitBoardReady;if(savedOutfitBoards.length>=50)throw Error('You can save up to 50 outfits.');const saved=cleanOutfitBoard({...board,name:result.context.request+' · option '+(index+1)},items);savedOutfitBoards.push(saved);try{await persistBoardState();}catch(error){savedOutfitBoards.pop();throw error;}status.textContent='Saved. Find it in Outfit builder → Saved outfits.';save.textContent='Saved';renderSavedOutfitBoards();}catch(error){status.textContent=error.message||'Could not save this outfit.';save.disabled=false;}};
  actions.append(edit,save);card.append(actions);grid.append(card);
 }
}
$('styleCollectionForm').onsubmit=async event=>{
 event.preventDefault();const button=$('createCollectionOutfits');button.disabled=true;$('stylistStatus').textContent='Matching your clothes with the latest verified trends…';
 // Owned-outfit suggestions must work immediately without waiting for a
 // weekly magazine-data request. The trend cache and normal refresh process
 // update independently; an offline device still knows what clothes it owns.
 try{await closetReady;
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
 }catch{$('stylistStatus').textContent='Could not create outfits. Your closet is unchanged; try again.';}finally{button.disabled=false;}
};
for(const id of ['stylistOccasion','stylistAudience','stylistSeason'])$(id).onchange=()=>{styledCollectionResults=[];renderStyledCollection();$('stylistStatus').textContent='Create outfits for your new preferences.';};
$('stylistSeason').value=['Winter','Winter','Spring','Spring','Spring','Summer','Summer','Summer','Fall','Fall','Fall','Winter'][new Date().getMonth()];
$('stylistClearAnchor').onclick=()=>{
 stylistAnchorItemId=null;styledCollectionResults=[];
 renderStyledCollection();
 $('stylistStatus').textContent='Style my whole closet. Choose an occasion and create outfits.';
};
$('stylistAddClothes').onclick=()=>switchView('scan');
