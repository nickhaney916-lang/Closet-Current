'use strict';
let styledCollectionResults=[];
function renderStyledCollection(){
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
  const actions=node('div',null,'actions'),edit=node('button','Adjust on outfit board','secondary'),save=node('button','Save outfit','primary');edit.type=save.type='button';save.disabled=changed;
  if(changed)card.append(node('p','A selected garment was removed or recategorized. Create outfits again.','fine'));
  edit.onclick=async()=>{await outfitBoardReady;currentBoard=cleanOutfitBoard({...board,name:result.context.request+' · option '+(index+1)},items);syncBoardInputs();renderOutfitBoard();await storeBoard();switchView('builder');};
  save.onclick=async()=>{save.disabled=true;const status=node('p',null,'fine');card.append(status);try{await outfitBoardReady;if(savedOutfitBoards.length>=50)throw Error('You can save up to 50 outfits.');const saved=cleanOutfitBoard({...board,name:result.context.request+' · option '+(index+1)},items);savedOutfitBoards.push(saved);try{await persistBoardState();}catch(error){savedOutfitBoards.pop();throw error;}status.textContent='Saved. Find it in Outfit builder → Saved outfits.';save.textContent='Saved';renderSavedOutfitBoards();}catch(error){status.textContent=error.message||'Could not save this outfit.';save.disabled=false;}};
  actions.append(edit,save);card.append(actions);grid.append(card);
 }
}
$('styleCollectionForm').onsubmit=async event=>{
 event.preventDefault();const button=$('createCollectionOutfits');button.disabled=true;$('stylistStatus').textContent='Matching your clothes with the latest verified trends…';
 try{await closetReady;await refreshTrendLibrary(true);
  styledCollectionResults=styleOwnedCollection(items,{request:$('stylistOccasion').value,audience:$('stylistAudience').value,season:$('stylistSeason').value},activeTrendLibrary);
  renderStyledCollection();$('stylistStatus').textContent=styledCollectionResults.length?'Here are '+styledCollectionResults.length+' outfit option'+(styledCollectionResults.length===1?'':'s')+' from your collection.':items.length?'No suitable combination for this occasion yet. Add or adjust the clothing categories in My closet.':'Add clothing photos to My closet first, then create an outfit.';
 }catch{$('stylistStatus').textContent='Could not create outfits. Your closet is unchanged; try again.';}finally{button.disabled=false;}
};
for(const id of ['stylistOccasion','stylistAudience','stylistSeason'])$(id).onchange=()=>{styledCollectionResults=[];renderStyledCollection();$('stylistStatus').textContent='Create outfits for your new preferences.';};
$('stylistSeason').value=['Winter','Winter','Spring','Spring','Spring','Summer','Summer','Summer','Fall','Fall','Fall','Winter'][new Date().getMonth()];
$('stylistAddClothes').onclick=()=>switchView('scan');
