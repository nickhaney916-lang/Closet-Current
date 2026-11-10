'use strict';
const nativeLossless04Active=typeof URLSearchParams==='function'&&typeof location!=='undefined'&&new URLSearchParams(location.search).get('nativeLossless04')==='research';
let nativeLossless04=null;
let currentBoard=cleanOutfitBoard({},[]),savedOutfitBoards=[],boardInitialized=false,choosingSlot='shoes';
let boardCommittedDraft=null,boardPendingWrites=0,boardDraftTimer=null,boardStatusSerial=0;
function nativeLossless04Notify(error){
 const value=typeof error==='string'?error:String(error?.message||error);
 $('boardSaveStatus').textContent='Research safety: '+value;
}
function nativeLossless04Edit(call){
 if(!nativeLossless04||!nativeLossless04.status().active)
  return nativeLossless04Notify('Signed-in private board not ready; no changes saved');
 try{call();}catch(error){nativeLossless04Notify(error);}
}
function nativeLossless04ClearPreview(){
 $('boardSlots').replaceChildren();$('savedBoards').replaceChildren();
 $('boardPickerItems').replaceChildren();$('boardOwnedOptions').replaceChildren();
 $('boardRecommendations').replaceChildren();
 if($('boardPicker').open)$('boardPicker').close();
}
function boardLink(text,url,className='textlink'){const a=node('a',text,className);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function boardBackup(){
 if(nativeLossless04Active){
  if(!nativeLossless04||!nativeLossless04.status().active)
   throw Error('Private outfit export requires a verified owner session');
  return nativeLossless04.readOnlySnapshot();
 }
 return {current:structuredClone(currentBoard),saved:structuredClone(savedOutfitBoards)};
}
function boardHasUnsavedDraft(){
 return !nativeLossless04Active&&boardInitialized&&Boolean(db)&&
  (boardDraftTimer!==null||boardPendingWrites>0||boardCommittedDraft!==JSON.stringify(currentBoard));
}
function boardDraftStatus(text,retry=false){
 $('boardSaveStatus').textContent=text;$('retryBoardDraft').hidden=!retry;
}
function cancelBoardDraftTimer(){clearTimeout(boardDraftTimer);boardDraftTimer=null;}
function scheduleBoardDraftSave(){
 cancelBoardDraftTimer();++boardStatusSerial;
 boardDraftStatus('Unsaved changes · saving shortly…');
 const scheduledDB=db,scheduledAuth=window.closetAuth,scheduledOwner=scheduledAuth?.user?.id;
 boardDraftTimer=setTimeout(()=>{
  boardDraftTimer=null;
  if(db!==scheduledDB||window.closetAuth!==scheduledAuth||scheduledAuth?.user?.id!==scheduledOwner){
   boardDraftStatus('Your account changed. Reopen your closet before saving changes.');return;
  }
  void storeBoard();
 },250);
}
window.addEventListener('beforeunload',event=>{
 if(boardHasUnsavedDraft()){event.preventDefault();event.returnValue='';}
});
window.addEventListener('closet:session-locked',()=>{
 cancelBoardDraftTimer();++boardStatusSerial;$('retryBoardDraft').hidden=true;
});
async function persistBoardState({appendSaved=null,replaceSaved=null}={}){
 if(nativeLossless04Active)throw Error('Unsafe native outfit write blocked; use lossless Save changes or Save outfit');
 if(!db){$('boardSaveStatus').textContent='Browser storage is unavailable. Keep this page open.';throw Error('Browser storage is unavailable.');}
 const ownerDB=db,auth=window.closetAuth,owner=auth?.user?.id;
 const assertOwner=()=>{
  auth?.assertCurrent?.();
  if(!owner||window.closetAuth!==auth||auth.user?.id!==owner||db!==ownerDB||ownerDB.name!=='closet-current-user-'+owner)
   throw Error('Your account changed. Reopen your closet before saving this outfit.');
 };
 assertOwner();
 const current=structuredClone(currentBoard),candidate=appendSaved?structuredClone(appendSaved):null,
  replacement=replaceSaved===null?null:structuredClone(replaceSaved);
 ++boardPendingWrites;
 try{await queued(()=>new Promise((resolve,reject)=>{
  assertOwner();const tx=ownerDB.transaction('state','readwrite'),store=tx.objectStore('state');
  let failure,saved;const request=store.get('outfit-board');
  request.onsuccess=()=>{try{
   assertOwner();
   // Read the committed roster INSIDE this transaction. Other tabs and queued
   // autosaves cannot persist speculative saves or erase successful appends.
   saved=structuredClone(replacement===null?(request.result?.saved||[]):replacement);
   if(!Array.isArray(saved)||saved.length>50)throw Error('Saved outfit storage needs review. Reload your closet.');
   if(candidate){if(saved.length>=50)throw Error('You can save up to 50 outfits.');saved.push(candidate);}
   store.put({id:'outfit-board',current,saved});
  }catch(error){failure=error;tx.abort();}};
  tx.oncomplete=()=>{try{assertOwner();savedOutfitBoards=structuredClone(saved);boardCommittedDraft=JSON.stringify(current);resolve();}catch(error){reject(error);}};
  tx.onerror=tx.onabort=()=>reject(failure||tx.error||Error('Could not save this outfit.'));
 }));}finally{--boardPendingWrites;}
}
async function saveOwnedOutfit(board){
 const saved=cleanOutfitBoard(structuredClone(board),items);
 if(!Object.keys(saved.slots).length)throw Error('Choose at least one piece from your own closet first.');
 await persistBoardState({appendSaved:saved});
}
async function storeBoard(){
 cancelBoardDraftTimer();const serial=++boardStatusSerial;
 boardDraftStatus('Saving outfit changes…');
 try{
  await persistBoardState();renderSavedOutfitBoards();
  if(serial===boardStatusSerial)boardDraftStatus(boardHasUnsavedDraft()?
   'Newer changes are waiting to save.':'Outfit changes saved on this device.');
  return true;
 }catch{
  if(serial===boardStatusSerial)boardDraftStatus('This outfit could not be saved. Your changes are still here. Retry saving changes before leaving.',true);
  return false;
 }
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
function openBoardPicker(slotId){
 choosingSlot=slotId;const slot=outfitSlots.find(s=>s.id===slotId);$('boardPickerTitle').textContent='Choose '+slot.label.toLowerCase();
 const grid=$('boardPickerItems');grid.replaceChildren();const options=items.filter(item=>slotAllows(slot,item));
 if(!options.length){grid.append(node('p','No saved pieces for this space yet. Add clothes or adjust their category in My closet.'));const add=node('button','Add clothing photos','secondary');add.onclick=()=>{$('boardPicker').close();switchView('scan');};grid.append(add);}
 for(const item of options){const b=node('button',null,'board-pick');b.type='button';const im=node('img');im.src=item.image;im.alt=item.name;b.append(im,node('strong',item.name||'Closet piece'),node('span',[item.itemType,item.color].filter(x=>x&&x!=='Unknown').join(' · ')));b.onclick=()=>{selectBoardPiece(slotId,item.id);$('boardPicker').close();};grid.append(b);}
 $('boardPicker').showModal();
}
function renderOutfitBoard(){
 if(!boardInitialized)return;
 if(nativeLossless04Active){
  if(!nativeLossless04||!nativeLossless04.status().active){
   nativeLossless04ClearPreview();$('boardSummary').textContent='Private saved outfits locked · sign in again';return;
  }
  currentBoard=nativeLossless04.view();
 }else currentBoard=cleanOutfitBoard(currentBoard,items);
 const top=items.find(x=>x.id===currentBoard.slots.top),dress=top?.category==='Dresses';
 $('outfitFigure').classList.toggle('has-outer-coat',currentBoard.layerCount>=3);const slots=$('boardSlots');slots.replaceChildren();
 for(const slot of outfitSlots){
  if((!nativeLossless04Active&&dress&&slot.level)||slot.extra&&currentBoard.layerCount<slot.level)continue;
  const item=items.find(x=>x.id===currentBoard.slots[slot.id]),idea=currentBoard.ideas[slot.id],covered=dress&&slot.id==='bottom';
  const retainedId=nativeLossless04Active&&!item?currentBoard.slots[slot.id]:null;
  const needsReview=nativeLossless04Active&&item&&!slotAllows(slot,item);
  const b=node('button',null,'board-slot board-slot-'+slot.id+(item?' owned':retainedId?' missing':idea?' planned':' blank')+(needsReview?' review':'')+(covered?' covered':'')+(dress&&slot.id==='top'?' dress':''));b.type='button';b.disabled=covered;b.setAttribute('aria-label',covered?'Bottoms covered by your dress':slot.label+': '+(needsReview?'Category needs review · ':'')+(item?.name||(retainedId?'Missing original '+retainedId:idea?idea.color+' '+idea.type:'empty'))+'. Choose a piece');
  b.append(node('span',slot.label,'slot-label'));
  if(item){const im=node('img');im.src=item.image;im.alt=item.name;b.append(im,node('span',item.name||item.itemType,'slot-name'));
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
 const target=$('boardTarget').value||'shoes',slot=outfitSlots.find(s=>s.id===target),owned=closetGapOptions(target,currentBoard,items).slice(0,3);
 $('boardGapStatus').textContent=(['bag','accessory','finish'].includes(target)?'Optional finishing ideas. No accessory photos are needed. ':'')+(currentBoard.slots[target]?'Alternatives for your '+slot.label.toLowerCase()+'. ':'Ideas for the '+slot.label.toLowerCase()+' space. ')+(owned.length?'Try a piece you already own first.':'Compare the directions below, then open a purchase source.');
 const ownGrid=$('boardOwnedOptions');ownGrid.replaceChildren();
 for(const item of owned){const b=node('button',null,'board-owned-pick');b.type='button';const im=node('img');im.src=item.image;im.alt=item.name;b.append(im,node('span','Already in your closet'),node('strong',item.name),node('small','Use this piece'));b.onclick=()=>selectBoardPiece(target,item.id);ownGrid.append(b);}
 const grid=$('boardRecommendations');grid.replaceChildren();
 if((target==='bottom'||(!nativeLossless04Active&&slot.level))&&items.find(x=>x.id===currentBoard.slots.top)?.category==='Dresses'){$('boardGapStatus').textContent='Choose shoes or optional finishing ideas for your dress.';ownGrid.replaceChildren();return;}
 for(const idea of wardrobeGapIdeas(target,currentBoard,items)){
  const card=node('article',null,'gap-idea-card');card.append(node('p',idea.trendSource?'TREND-INSPIRED DIRECTION':'STYLING DIRECTION','eyebrow'),node('h3',idea.color+' '+(idea.label||idea.type)),node('p',idea.reason));
  if(idea.trendSource)card.append(boardLink('Read the magazine reference',idea.trendSource.url));
  const preview=node('button','Try this idea on the board','secondary');preview.type='button';preview.onclick=()=>{
   if(nativeLossless04Active)return nativeLossless04Edit(()=>nativeLossless04.setIdea(target,idea));
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
 if(!savedOutfitBoards.length){grid.append(node('p','Save a combination to return to it later.'));return;}
 for(const [index,value] of savedOutfitBoards.entries()){
  const label=(value.name||'My outfit')+(nativeLossless04Active&&Object.values(value.slots||{}).some(id=>!items.find(x=>x.id===id))?' · missing piece':'');
  const b=node('button',label,'secondary');b.type='button';
  b.onclick=()=>{
   if(nativeLossless04Active)return nativeLossless04Edit(()=>nativeLossless04.selectSaved(index));
   currentBoard=cleanOutfitBoard(value,items);syncBoardInputs();renderOutfitBoard();storeBoard();
  };grid.append(b);
 }
}
async function importBoardBackup(value){
 if(nativeLossless04Active)
  throw Error('Native backup import blocked in lossless research mode; atomic items/outfit restore is not yet accepted');
 if(!boardInitialized)await outfitBoardReady;
 if(!value||!Array.isArray(value.saved)||value.saved.length>50)throw Error('Invalid outfit board backup.');
 currentBoard=cleanOutfitBoard(value.current,items);savedOutfitBoards=value.saved.map(board=>cleanOutfitBoard(board,items));syncBoardInputs();await persistBoardState({replaceSaved:savedOutfitBoards});renderOutfitBoard();
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
$('retryBoardDraft').onclick=async()=>{if(await storeBoard())$('boardName').focus({preventScroll:true});};
$('closeBoardPicker').onclick=()=>$('boardPicker').close();
$('emptyBoardSlot').onclick=()=>{selectBoardPiece(choosingSlot,'');$('boardPicker').close();};
$('shopBoardSlot').onclick=()=>{$('boardTarget').value=choosingSlot;$('boardPicker').close();renderBoardSuggestions();$('boardGapStatus').scrollIntoView({behavior:'smooth',block:'start'});};
$('clearBoard').onclick=()=>{
 if(nativeLossless04Active)return nativeLossless04Edit(()=>nativeLossless04.startNew());
 currentBoard=cleanOutfitBoard({},items);syncBoardInputs();renderOutfitBoard();storeBoard();
};
$('saveBoard').onclick=async()=>{
 if(nativeLossless04Active){
  if(!nativeLossless04||!nativeLossless04.status().active)return nativeLossless04Notify('Owner session required');
  $('saveBoard').disabled=true;
  try{await nativeLossless04.persist({asNew:true});}
  catch(e){nativeLossless04Notify(e);}
  finally{$('saveBoard').disabled=false;}
  return;
 }
 cancelBoardDraftTimer();++boardStatusSerial;$('retryBoardDraft').hidden=true;
 if(!Object.keys(currentBoard.slots).length)return $('boardSaveStatus').textContent='Choose at least one piece from your own closet first.';if(savedOutfitBoards.length>=50)return $('boardSaveStatus').textContent='You can save up to 50 outfits.';$('saveBoard').disabled=true;try{await saveOwnedOutfit(currentBoard);$('boardSaveStatus').textContent='Outfit saved with references to your clothing photos.';renderSavedOutfitBoards();}catch{$('boardSaveStatus').textContent='Could not save this outfit. Please try again.';}finally{$('saveBoard').disabled=false;}};
function renderTrendReferences(){const grid=$('boardTrendSources');grid.replaceChildren();for(const source of outfitTrendSources)grid.append(boardLink(source.title,source.url));}
renderTrendReferences();
const outfitBoardReady=(async()=>{
 await closetReady;
 if(nativeLossless04Active){
  try{
   if(!db)throw Error('Authenticated owner database unavailable');
   const {createNativeConsumerBoard04}=await import('../research/native-consumer-board-04/consumer-board-controller.mjs');
   nativeLossless04=await createNativeConsumerBoard04({
    onChange(value,{revoked}={}){
     window.nativePhotoReadiness08Bridge?.clear();
     if(revoked){currentBoard=cleanOutfitBoard({},[]);savedOutfitBoards=[];nativeLossless04ClearPreview();return;}
     if(value){currentBoard=value;
      if(nativeLossless04&&nativeLossless04.status().active){
       savedOutfitBoards=nativeLossless04.readOnlySnapshot().saved;
       if(boardInitialized){syncBoardInputs();renderOutfitBoard();}
      }
     }
    },
    onStatus:message=>$('boardSaveStatus').textContent=message
   });
   window.nativeLossless04Bridge=nativeLossless04;
   savedOutfitBoards=nativeLossless04.readOnlySnapshot().saved;
   currentBoard=nativeLossless04.view();
   const controls=node('div',null,'actions');controls.id='nativeLossless04Controls';
   function addControl(id,label,fn){
    const button=node('button',label,'secondary');button.type='button';button.id=id;
    button.onclick=async()=>{
     button.disabled=true;
     try{await fn();}
     catch(error){nativeLossless04Notify(error);}
     finally{button.disabled=false;}
    };controls.append(button);
   }
   addControl('native04SaveChanges','Save changes',()=>nativeLossless04.persist({asNew:false}));
   addControl('native04CancelChanges','Cancel changes',()=>nativeLossless04.cancel());
   addControl('native04DeleteOutfit','Delete saved outfit',async()=>{
    const index=nativeLossless04.selected;
    if(index===null)return nativeLossless04Notify('Open a saved outfit to delete it');
    if(!confirm('Delete ONLY this saved outfit? Your clothing photos stay in My Closet.'))return;
    await nativeLossless04.remove(index,{confirmed:true});
   });
   $('saveBoard').after(controls);
   if(typeof URLSearchParams==='function'&&
     new URLSearchParams(location.search).get('native3D05')==='research'){
    try{
     const {mountNative3D05}=await import('../research/native-3d-05/native-preview-bridge.mjs');
     window.native3D05Bridge=await mountNative3D05({consumer:nativeLossless04,
      onStatus:value=>$('boardSaveStatus').textContent=value});
    }catch(error){nativeLossless04Notify(error);}
   }
   // NATIVE-PHOTO-08: attach only after actual owner Outfit Builder controls
   // are active; the underlying #560 source-original assessor stays unchanged.
   if(new URLSearchParams(location.search).get('sourceReadiness08')==='research'&&
      new URLSearchParams(location.search).get('native3D05')==='research'){
    try{
     const {mountNativeReadiness08}=await import('../research/native-photo-readiness-08/native-readiness-panel.mjs');
     window.nativePhotoReadiness08Bridge=await mountNativeReadiness08({
      board:nativeLossless04,db,
      onStatus:value=>$('boardSaveStatus').textContent=value
     });
    }catch(error){nativeLossless04Notify(error);}
   }
   // STYLE03: Actual native Style screen, not a separate wardrobe editor.
   // Guarded original photos and pinned owned looks use this very same native
   // authenticated BOARD04 controller and its lossless compare-and-swap.
   if(new URLSearchParams(location.search).get('styleOwned03')==='research'&&
      new URLSearchParams(location.search).get('nativeIndex07')==='research'){
    try{
     const {mountStyleOwnedLive03}=await import('../research/style-owned-live-03/native-style-panel.mjs');
     window.styleOwnedLive03Bridge=await mountStyleOwnedLive03({
      board:nativeLossless04,onStatus:()=>{}
     });
    }catch(error){nativeLossless04Notify(error);}
   }
   // MOBILE09: Research-only tactile and safe-area polish. It changes no
   // saved record, cloth geometry, owner permission, or released stylesheet.
   if(new URLSearchParams(location.search).get('nativeMobile09')==='research'){
    try{
     const {mountNativeMobile09}=await import('../research/native-mobile-09/mobile-comfort.mjs');
     window.nativeMobile09Bridge=mountNativeMobile09({board:nativeLossless04});
    }catch(error){nativeLossless04Notify(error);}
   }
  }catch(error){nativeLossless04Notify(error);nativeLossless04ClearPreview();}
 }else if(db){
  try{
   const state=await new Promise((resolve,reject)=>{
    const r=db.transaction('state').objectStore('state').get('outfit-board');
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
   });
   if(state){currentBoard=cleanOutfitBoard(state.current,items);
    savedOutfitBoards=(state.saved||[]).slice(0,50).map(x=>cleanOutfitBoard(x,items));}
  }catch{$('boardSaveStatus').textContent='Saved outfits could not be loaded.';}
 }
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

async function reloadCloudBoard(){
 if(nativeLossless04Active){
  if(!nativeLossless04)throw Error('Private lossless reload unavailable');
  await nativeLossless04.load();
  currentBoard=nativeLossless04.view();
  savedOutfitBoards=nativeLossless04.readOnlySnapshot().saved;
  syncBoardInputs();renderOutfitBoard();return;
 }
 const state=await new Promise((resolve,reject)=>{
  const r=db.transaction('state').objectStore('state').get('outfit-board');
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
 });
 currentBoard=cleanOutfitBoard(state?.current||{},items);
 savedOutfitBoards=(state?.saved||[]).map(x=>cleanOutfitBoard(x,items));
 boardCommittedDraft=JSON.stringify(currentBoard);
 syncBoardInputs();renderOutfitBoard();
}
