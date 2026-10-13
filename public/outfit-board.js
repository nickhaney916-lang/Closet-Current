'use strict';
let currentBoard=cleanOutfitBoard({},[]),savedOutfitBoards=[],boardInitialized=false,choosingSlot='shoes';
function boardLink(text,url,className='textlink'){const a=node('a',text,className);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function boardBackup(){return {current:structuredClone(currentBoard),saved:structuredClone(savedOutfitBoards)};}
async function persistBoardState(){
 if(!db){$('boardSaveStatus').textContent='Browser storage is unavailable. Keep this page open.';throw Error('Browser storage is unavailable.');}
 const snapshot=boardBackup();
 await queued(()=>new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put({id:'outfit-board',...snapshot});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);}));
}
async function storeBoard(){try{await persistBoardState();}catch{$('boardSaveStatus').textContent='This outfit could not be saved. Please try again.';}}
function syncBoardInputs(){for(const [id,key]of Object.entries({boardName:'name',boardOccasion:'occasion',boardSeason:'season',boardAudience:'audience',boardSize:'size',boardBudget:'budget'}))$(id).value=currentBoard[key]||'';}
function selectBoardPiece(slotId,itemId){
 delete currentBoard.ideas[slotId];
 for(const key of Object.keys(currentBoard.slots))if(currentBoard.slots[key]===itemId)delete currentBoard.slots[key];
 if(itemId)currentBoard.slots[slotId]=itemId;else delete currentBoard.slots[slotId];
 currentBoard=cleanOutfitBoard(currentBoard,items);renderOutfitBoard();storeBoard();
}
function openBoardPicker(slotId){
 choosingSlot=slotId;const slot=outfitSlots.find(s=>s.id===slotId);$('boardPickerTitle').textContent='Choose '+slot.label.toLowerCase();
 const grid=$('boardPickerItems');grid.replaceChildren();const options=items.filter(item=>slotAllows(slot,item));
 if(!options.length){grid.append(node('p','No saved pieces for this space yet. Add clothes or adjust their category in My closet.'));const add=node('button','Add clothing photos','secondary');add.onclick=()=>{$('boardPicker').close();switchView('scan');};grid.append(add);}
 for(const item of options){const b=node('button',null,'board-pick');b.type='button';const im=node('img');im.src=item.image;im.alt=item.name;b.append(im,node('strong',item.name||'Closet piece'),node('span',[item.itemType,item.color].filter(x=>x&&x!=='Unknown').join(' · ')));b.onclick=()=>{selectBoardPiece(slotId,item.id);$('boardPicker').close();};grid.append(b);}
 $('boardPicker').showModal();
}
function renderOutfitBoard(){
 if(!boardInitialized)return;
 currentBoard=cleanOutfitBoard(currentBoard,items);const top=items.find(x=>x.id===currentBoard.slots.top),dress=top?.category==='Dresses';
 const slots=$('boardSlots');slots.replaceChildren();
 for(const slot of outfitSlots){
  const item=items.find(x=>x.id===currentBoard.slots[slot.id]),idea=currentBoard.ideas[slot.id],covered=dress&&slot.id==='bottom';
  const b=node('button',null,'board-slot board-slot-'+slot.id+(item?' owned':idea?' planned':' blank')+(covered?' covered':'')+(dress&&slot.id==='top'?' dress':''));b.type='button';b.disabled=covered;b.setAttribute('aria-label',covered?'Bottoms covered by your dress':slot.label+': '+(item?.name||(idea?idea.color+' '+idea.type:'empty'))+'. Choose a piece');
  b.append(node('span',slot.label,'slot-label'));
  if(item){const im=node('img');im.src=item.image;im.alt=item.name;b.append(im,node('span',item.name||item.itemType,'slot-name'));}
  else if(covered)b.append(node('span','Covered by dress','slot-name'));
  else if(idea)b.append(node('span',idea.color+' '+idea.type,'slot-idea'),node('small','Shopping idea · not owned'));
  else b.append(node('span','+','slot-plus'),node('small',slot.optional?'Optional space':'Choose or find a piece'));
  b.onclick=()=>openBoardPicker(slot.id);slots.append(b);
 }
 const count=Object.keys(currentBoard.slots).length,gaps=boardGaps(currentBoard,items);$('boardSummary').textContent=count+' of your own pieces selected · '+gaps.length+' open spaces'+(dress?' · dress covers top and bottoms':'');
 renderBoardSuggestions();renderSavedOutfitBoards();
}
function renderBoardSuggestions(){
 const target=$('boardTarget').value||'shoes',slot=outfitSlots.find(s=>s.id===target),owned=closetGapOptions(target,currentBoard,items).slice(0,3);
 $('boardGapStatus').textContent=(currentBoard.slots[target]?'Alternatives for your '+slot.label.toLowerCase()+'. ':'Ideas for the '+slot.label.toLowerCase()+' space. ')+(owned.length?'Try a piece you already own first.':'Compare the directions below, then open a purchase source.');
 const ownGrid=$('boardOwnedOptions');ownGrid.replaceChildren();
 for(const item of owned){const b=node('button',null,'board-owned-pick');b.type='button';const im=node('img');im.src=item.image;im.alt=item.name;b.append(im,node('span','Already in your closet'),node('strong',item.name),node('small','Use this piece'));b.onclick=()=>selectBoardPiece(target,item.id);ownGrid.append(b);}
 const grid=$('boardRecommendations');grid.replaceChildren();
 if(target==='bottom'&&items.find(x=>x.id===currentBoard.slots.top)?.category==='Dresses'){$('boardGapStatus').textContent='Your dress already covers this space. Choose another piece to complete the look.';ownGrid.replaceChildren();return;}
 for(const idea of wardrobeGapIdeas(target,currentBoard,items)){
  const card=node('article',null,'gap-idea-card');card.append(node('p',idea.trendSource?'TREND-INSPIRED DIRECTION':'STYLING DIRECTION','eyebrow'),node('h3',idea.color+' '+idea.type),node('p',idea.reason));
  if(idea.trendSource)card.append(boardLink('Read the magazine reference',idea.trendSource.url));
  const preview=node('button','Try this idea on the board','secondary');preview.type='button';preview.onclick=()=>{delete currentBoard.slots[target];currentBoard.ideas[target]={type:idea.type,color:idea.color};renderOutfitBoard();storeBoard();};card.append(preview);
  for(const example of idea.examples){const box=node('div',null,'product-example');box.append(node('small','PRODUCT EXAMPLE · CHECK SIZE / COLOR'),boardLink(example.name,example.url,'shop-link'),node('p','Price at check: $'+example.priceAtCheck+' · Oct 12, 2026. Current price and available sizes may differ.','fine'));card.append(box);}
  card.append(boardLink('Search Nordstrom for this piece',idea.retailerUrl,'shop-link'),boardLink('Compare shopping results',idea.shoppingUrl,'textlink'),node('p','Search: '+idea.query,'fine'));grid.append(card);
 }
}
function renderSavedOutfitBoards(){
 const grid=$('savedBoards');grid.replaceChildren();
 if(!savedOutfitBoards.length){grid.append(node('p','Save a combination to return to it later.'));return;}
 for(const value of savedOutfitBoards){const b=node('button',value.name,'secondary');b.type='button';b.onclick=()=>{currentBoard=cleanOutfitBoard(value,items);syncBoardInputs();renderOutfitBoard();storeBoard();};grid.append(b);}
}
async function importBoardBackup(value){
 if(!boardInitialized)await outfitBoardReady;
 if(!value||!Array.isArray(value.saved)||value.saved.length>50)throw Error('Invalid outfit board backup.');
 currentBoard=cleanOutfitBoard(value.current,items);savedOutfitBoards=value.saved.map(board=>cleanOutfitBoard(board,items));syncBoardInputs();await persistBoardState();renderOutfitBoard();
}
for(const slot of outfitSlots){const option=node('option',slot.label);option.value=slot.id;$('boardTarget').append(option);}$('boardTarget').value='shoes';$('boardTarget').onchange=renderBoardSuggestions;
for(const [id,key]of Object.entries({boardName:'name',boardOccasion:'occasion',boardSeason:'season',boardAudience:'audience',boardSize:'size',boardBudget:'budget'}))$(id).onchange=()=>{currentBoard[key]=$(id).value;currentBoard=cleanOutfitBoard(currentBoard,items);renderOutfitBoard();storeBoard();};
$('closeBoardPicker').onclick=()=>$('boardPicker').close();
$('emptyBoardSlot').onclick=()=>{selectBoardPiece(choosingSlot,'');$('boardPicker').close();};
$('shopBoardSlot').onclick=()=>{$('boardTarget').value=choosingSlot;$('boardPicker').close();renderBoardSuggestions();$('boardGapStatus').scrollIntoView({behavior:'smooth',block:'start'});};
$('clearBoard').onclick=()=>{currentBoard=cleanOutfitBoard({},items);syncBoardInputs();renderOutfitBoard();storeBoard();};
$('saveBoard').onclick=async()=>{if(!Object.keys(currentBoard.slots).length)return $('boardSaveStatus').textContent='Choose at least one piece from your own closet first.';if(savedOutfitBoards.length>=50)return $('boardSaveStatus').textContent='You can save up to 50 outfits.';$('saveBoard').disabled=true;try{savedOutfitBoards.push(structuredClone(currentBoard));await persistBoardState();$('boardSaveStatus').textContent='Outfit saved with references to your clothing photos.';renderSavedOutfitBoards();}catch{savedOutfitBoards.pop();$('boardSaveStatus').textContent='Could not save this outfit. Please try again.';}finally{$('saveBoard').disabled=false;}};
for(const source of outfitTrendSources)$('boardTrendSources').append(boardLink(source.title,source.url));
const outfitBoardReady=(async()=>{await closetReady;if(db){try{const state=await new Promise((resolve,reject)=>{const r=db.transaction('state').objectStore('state').get('outfit-board');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});if(state){currentBoard=cleanOutfitBoard(state.current,items);savedOutfitBoards=(state.saved||[]).slice(0,50).map(x=>cleanOutfitBoard(x,items));}}catch{$('boardSaveStatus').textContent='Saved outfits could not be loaded.';}}boardInitialized=true;syncBoardInputs();renderOutfitBoard();})();
