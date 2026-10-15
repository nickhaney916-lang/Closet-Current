'use strict';
let currentBoard=cleanOutfitBoard({},[]),savedOutfitBoards=[],boardInitialized=false,choosingSlot='shoes';
function boardLink(text,url,className='textlink'){const a=node('a',text,className);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function boardBackup(){return {current:structuredClone(currentBoard),saved:structuredClone(savedOutfitBoards)};}
async function persistBoardState(){
 if(!db){$('boardSaveStatus').textContent='Browser storage is unavailable. Keep this page open.';throw Error('Browser storage is unavailable.');}
 const snapshot=boardBackup();
 await queued(()=>new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put({id:'outfit-board',...snapshot});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);}));
}
async function storeBoard(){try{await persistBoardState();return true;}catch{$('boardSaveStatus').textContent='This outfit could not be saved. Please try again.';return false;}}
function syncBoardInputs(){for(const [id,key]of Object.entries({boardName:'name',boardOccasion:'occasion',boardSeason:'season',boardAudience:'audience',boardSize:'size',boardBudget:'budget'}))$(id).value=currentBoard[key]||'';}
function selectBoardPiece(slotId,itemId){
 delete currentBoard.ideas[slotId];
 for(const key of Object.keys(currentBoard.slots))if(currentBoard.slots[key]===itemId)delete currentBoard.slots[key];
 if(itemId)currentBoard.slots[slotId]=itemId;else delete currentBoard.slots[slotId];
 currentBoard=cleanOutfitBoard(currentBoard,items);renderOutfitBoard();return storeBoard();
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
 $('outfitFigure').classList.toggle('has-outer-coat',currentBoard.layerCount>=3);const slots=$('boardSlots');slots.replaceChildren();
 for(const slot of outfitSlots){
  if(dress&&slot.level||slot.extra&&currentBoard.layerCount<slot.level)continue;
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
 renderBoardSuggestions();renderSavedOutfitBoards();if(typeof renderClosetBrowser==='function')renderClosetBrowser();
}
function renderBoardSuggestions(){
 const target=$('boardTarget').value||'shoes',slot=outfitSlots.find(s=>s.id===target),owned=closetGapOptions(target,currentBoard,items).slice(0,3);
 $('boardGapStatus').textContent=(['bag','accessory','finish'].includes(target)?'Optional finishing ideas. No accessory photos are needed. ':'')+(currentBoard.slots[target]?'Alternatives for your '+slot.label.toLowerCase()+'. ':'Ideas for the '+slot.label.toLowerCase()+' space. ')+(owned.length?'Try a piece you already own first.':'Compare the directions below, then open a purchase source.');
 const ownGrid=$('boardOwnedOptions');ownGrid.replaceChildren();
 for(const item of owned){const b=node('button',null,'board-owned-pick');b.type='button';const im=node('img');im.src=item.image;im.alt=item.name;b.append(im,node('span','Already in your closet'),node('strong',item.name),node('small','Use this piece'));b.onclick=()=>selectBoardPiece(target,item.id);ownGrid.append(b);}
 const grid=$('boardRecommendations');grid.replaceChildren();
 if((target==='bottom'||slot.level)&&items.find(x=>x.id===currentBoard.slots.top)?.category==='Dresses'){$('boardGapStatus').textContent='Choose shoes or optional finishing ideas for your dress.';ownGrid.replaceChildren();return;}
 for(const idea of wardrobeGapIdeas(target,currentBoard,items)){
  const card=node('article',null,'gap-idea-card');card.append(node('p',idea.trendSource?'TREND-INSPIRED DIRECTION':'STYLING DIRECTION','eyebrow'),node('h3',idea.color+' '+(idea.label||idea.type)),node('p',idea.reason));
  if(idea.trendSource)card.append(boardLink('Read the magazine reference',idea.trendSource.url));
  const preview=node('button','Try this idea on the board','secondary');preview.type='button';preview.onclick=()=>{delete currentBoard.slots[target];currentBoard.ideas[target]={type:idea.type,color:idea.color};renderOutfitBoard();storeBoard();};card.append(preview);
  for(const example of idea.examples){const box=node('div',null,'product-example');box.append(node('small','PRODUCT EXAMPLE · CHECK SIZE / COLOR'),boardLink(example.name,example.url,'shop-link'),node('p',(Number.isFinite(example.priceAtCheck)?'Price at check: $'+example.priceAtCheck:'Price not confirmed')+' · '+trendLibraryDate(example.checkedAt||activeTrendLibrary?.updatedAt||'2026-10-12')+'. Confirm current price, color and size.','fine'));card.append(box);}
  for(const retailer of idea.retailerLinks||[])card.append(boardLink('Browse '+retailer.name,retailer.url,'shop-link'));
  card.append(boardLink('Compare stores for this piece',idea.shoppingUrl,'shop-link'),node('p','Search: '+idea.query,'fine'));grid.append(card);
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
function renderTrendReferences(){const grid=$('boardTrendSources');grid.replaceChildren();for(const source of outfitTrendSources)grid.append(boardLink(source.title,source.url));}
renderTrendReferences();
const outfitBoardReady=(async()=>{await closetReady;if(db){try{const state=await new Promise((resolve,reject)=>{const r=db.transaction('state').objectStore('state').get('outfit-board');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});if(state){currentBoard=cleanOutfitBoard(state.current,items);savedOutfitBoards=(state.saved||[]).slice(0,50).map(x=>cleanOutfitBoard(x,items));}}catch{$('boardSaveStatus').textContent='Saved outfits could not be loaded.';}}boardInitialized=true;syncBoardInputs();renderOutfitBoard();})();

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

async function reloadCloudBoard(){const state=await new Promise((resolve,reject)=>{const r=db.transaction('state').objectStore('state').get('outfit-board');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});currentBoard=cleanOutfitBoard(state?.current||{},items);savedOutfitBoards=(state?.saved||[]).map(x=>cleanOutfitBoard(x,items));syncBoardInputs();renderOutfitBoard();}
