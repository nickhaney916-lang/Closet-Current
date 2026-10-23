'use strict';
window.closetBrowseAll=false;
window.closetItemType='';
window.closetDressPreview=false;
window.closetTargetSlot=null;
window.closetSlotFilter=null;
const closetSections=[
 {category:'Tops',label:'Base shirt',slot:'top',position:'base',torso:true},
 {category:'Tops',label:'Shirt / sweater',slot:'layer',position:'layer',level:1,mixed:true,torso:true},
 {category:'Outerwear',label:'Jacket',slot:'layer2',position:'layer2',level:2,torso:true},
 {category:'Outerwear',label:'Outer coat',slot:'layer3',position:'layer3',level:3,torso:true},
 {category:'Bottoms',label:'Bottoms',slot:'bottom',position:'bottom'},
 {category:'Shoes',label:'Shoes',slot:'shoes',position:'shoes'},
 {category:'Dresses',label:'Dresses',slot:'top',position:'dresses'}
];
window.closetSleeves=null;
function closetLayerCount(){return typeof boardInitialized!=='undefined'&&boardInitialized?currentBoard.layerCount||0:0;}
function closetReviewMatches(item){return item.category==='Uncategorized';}
function closetDressMode(){return window.closetDressPreview||typeof boardInitialized!=='undefined'&&boardInitialized&&items.find(item=>item.id===currentBoard.slots.top)?.category==='Dresses';}
function closetVisibleSections(){return closetDressMode()?[{category:'Dresses',label:'Dress',slot:'top',position:'base',torso:true},closetSections.find(section=>section.position==='shoes')]:closetSections.filter(section=>!section.level||section.level<=closetLayerCount());}

function closetPieceSlot(item){
 if(window.closetTargetSlot&&outfitSlots.some(slot=>slot.id===window.closetTargetSlot&&slotAllows(slot,item)))return window.closetTargetSlot;
 const ready=typeof boardInitialized!=='undefined'&&boardInitialized;
 const existing=ready?Object.keys(currentBoard.slots).find(slot=>currentBoard.slots[slot]===item.id):null;if(existing)return existing;
 if(item.category==='Dresses')return 'top';
 if(item.category==='Tops'&&window.closetDressPreview)return 'top';
 if(item.category==='Tops')return ready&&currentBoard.slots.top&&closetLayerCount()>=1?'layer':'top';
 if(item.category==='Bottoms')return 'bottom';
 if(item.category==='Outerwear')return ['Coat','Raincoat'].includes(item.itemType)?'layer3':['Cardigan','Vest'].includes(item.itemType)?'layer':'layer2';
 if(item.category==='Shoes')return 'shoes';
 return item.category==='Accessories'?(item.itemType==='Bag'?'bag':['Jewelry','Sunglasses'].includes(item.itemType)?'accessory':['Hat','Scarf','Belt'].includes(item.itemType)?'finish':null):null;
}
function closetSectionMatches(section,item){return (section.mixed?outfitSlots.some(slot=>slot.id===section.slot&&slotAllows(slot,item)):item.category===section.category)&&(!section.itemType||section.itemType===item.itemType)&&(!section.sleeves||section.sleeves.includes(item.sleeveLength));}
function closetDropSlot(section,item){if((section.itemType||section.sleeves)&&!closetSectionMatches(section,item))return null;const slot=section.category==='Accessories'?closetPieceSlot(item):section.slot;if(!slot)return null;if(section.category==='Dresses'&&item.category!=='Dresses'||section.category==='Accessories'&&item.category!=='Accessories')return null;return outfitSlots.find(x=>x.id===slot&&slotAllows(x,item))?slot:null;}
async function placeClosetPiece(item,slotId){
 await outfitBoardReady;slotId=slotId||closetPieceSlot(item);if(!items.some(x=>x.id===item.id)||!outfitSlots.some(x=>x.id===slotId&&slotAllows(x,item))){$('closetLookStatus').textContent='Confirm this piece’s category and accessory type in Adjust details before placing it.';return false;}
 const level=outfitSlots.find(slot=>slot.id===slotId)?.level;if(closetDressMode()&&(slotId==='bottom'||level)){$('closetLookStatus').textContent='Switch to Shirts & pants to add pants or layers.';return false;}if(level)currentBoard.layerCount=Math.max(currentBoard.layerCount||0,level);
 if(slotId==='bottom'&&items.find(x=>x.id===currentBoard.slots.top)?.category==='Dresses'){$('closetLookStatus').textContent='Your dress covers the bottoms space. Choose a top or clear the look to add bottoms.';return false;}
 const saved=await selectBoardPiece(slotId,item.id);if(['Tops','Dresses'].includes(item.category))window.closetDressPreview=false;render();$('closetLookStatus').textContent=saved?(item.name||'Your piece')+' added to your look.':'This look could not save. Your clothing photos are kept.';return saved;
}
function renderClosetBrowser(){
 if(window.MobileClosetQuick){
  window.MobileClosetQuick.render($('closetQuickCategories'),items,category=>{
   if(!['Tops','Bottoms','Shoes','Dresses'].includes(category))return;
   window.closetBrowseAll=false;
   window.closetTargetSlot=null;
   window.closetSlotFilter=null;
   window.closetItemType='';
   window.closetSleeves=null;
   for(const id of ['search','seasonFilter','sleeveFilter'])$(id).value='';
   $('filter').value=category;
   render();
   const collection=$('closetCollection');
   if(!collection.hidden){
    $('closetBack').focus({preventScroll:true});
    collection.scrollIntoView({block:'start',behavior:'auto'});
   }
  });
 }
 const grid=$('closetCategories');if(!grid)return;grid.replaceChildren();grid.classList.remove('split-layers');grid.dataset.layers=closetLayerCount();
 const ready=typeof boardInitialized!=='undefined'&&boardInitialized;
 const top=ready?items.find(x=>x.id===currentBoard.slots.top):null;const dressMode=closetDressMode();grid.classList.toggle('wearing-dress',dressMode);grid.classList.toggle('dress-mode',dressMode);delete grid.dataset.audience;
 $('closetSeparates').hidden=!dressMode;$('closetLayerCount').closest('label').hidden=dressMode;$('closetSaveLook').disabled=dressMode&&top?.category!=='Dresses';$('closetStyleLook').disabled=$('closetSaveLook').disabled;
 $('closetLayerCount').value=String(closetLayerCount());$('closetLayerHelp').textContent=dressMode?(top?.category==='Dresses'?'Pair your dress with shoes.':'Choose a dress to finish this look.'):['One base shirt: short or long sleeve.','Base shirt + a shirt or sweater.','Base shirt + shirt or sweater + jacket.','Base shirt + shirt or sweater + jacket + outer coat.'][closetLayerCount()];
 const head=node('span',null,'closet-figure-head');head.setAttribute('aria-hidden','true');grid.append(head);
 const activeSections=closetVisibleSections(),torso=activeSections.filter(section=>section.torso);
 for(const section of activeSections){
  const count=items.filter(x=>closetSectionMatches(section,x)).length,b=node('button',null,'closet-category closet-category-'+section.position);b.type='button';b.dataset.category=section.category;if(section.slot||section.category==='Accessories')b.dataset.closetSlot=section.position;
  const torsoIndex=torso.indexOf(section);if(torsoIndex>=0){b.classList.add('closet-torso-panel');b.style.left=(16+64*torsoIndex/torso.length)+'%';b.style.width=64/torso.length+'%';b.style.setProperty('--torso-panels',torso.length);b.style.setProperty('--torso-index',torsoIndex);}
  b.dataset.itemType=section.itemType||'';b.setAttribute('aria-label',section.label+', '+count+' '+(count===1?'piece':'pieces')+'. Open category');const caption=node('span',null,'closet-category-caption');caption.append(node('strong',section.position==='base'&&top?.category==='Dresses'?'Dress':section.label),node('span',count+' '+(count===1?'piece':'pieces'),'closet-category-count'));b.append(caption);
  const slot=section.slot,selected=ready?items.find(x=>x.id===currentBoard.slots[slot]&&(!section.itemType||x.itemType===section.itemType)&&(!section.sleeves||top?.category==='Dresses'||!top?.sleeveLength||top.sleeveLength==='Unknown'||section.sleeves.includes(x.sleeveLength))):null;
  if(selected&&slot&&section.position!=='dresses'&&(!dressMode||section.position!=='base'||selected.category==='Dresses')){const im=node('img');im.className='closet-look-photo';im.src=selected.image;im.alt=selected.name||'Piece on your look';b.append(im);b.classList.add('has-look');if(section.sleeves&&selected.sleeveLength==='Unknown'&&selected.category!=='Dresses')b.classList.add('sleeve-unconfirmed');}
  if(section.position==='bottom'&&top?.category==='Dresses'){b.disabled=true;b.setAttribute('aria-label','Dress covers the bottoms space');}
  b.onclick=()=>{if(section.category==='Dresses'){window.closetDressPreview=true;$('closetLookStatus').textContent='';}window.closetBrowseAll=false;window.closetTargetSlot=section.slot;window.closetSlotFilter=section.slot;window.closetItemType=section.itemType||'';window.closetSleeves=section.sleeves||null;$('sleeveFilter').value='';$('seasonFilter').value='';$('search').value='';$('filter').value=section.mixed?'All categories':section.category;render();$('closetCollection').scrollIntoView({block:'start',behavior:'smooth'});};
  b.ondragover=event=>{const item=items.find(x=>x.id===window.closetDraggedId);if(item&&closetDropSlot(section,item)){event.preventDefault();b.classList.add('drag-over');event.dataTransfer.dropEffect='move';}};b.ondragleave=()=>b.classList.remove('drag-over');b.ondrop=event=>{event.preventDefault();b.classList.remove('drag-over');const item=items.find(x=>x.id===event.dataTransfer.getData('text/plain')),slot=item&&closetDropSlot(section,item);if(slot)placeClosetPiece(item,slot);else $('closetLookStatus').textContent='Move this piece to its matching space.';};grid.append(b);
 }
 const unsorted=items.filter(closetReviewMatches).length;$('closetUnsorted').hidden=!unsorted;$('closetUnsorted').textContent='Unsorted clothing ('+unsorted+')';
 const browsing=!!(window.closetSlotFilter||$('search').value.trim()||$('filter').value!=='All categories'||window.closetBrowseAll);$('closetCollection').hidden=!browsing;$('closetLayout').classList.toggle('is-browsing',browsing);$('closetCollectionTitle').textContent=$('search').value.trim()?'Search results':dressMode&&window.closetSlotFilter==='top'?'Dresses':window.closetSlotFilter?closetSections.find(section=>section.slot===window.closetSlotFilter)?.label||'Your pieces':$('filter').value==='All categories'?'All pieces':$('filter').value==='Tops'&&!window.closetSleeves?'Shirts':$('filter').value==='Outerwear'?'Layers':closetSections.find(x=>x.category===$('filter').value&&(x.itemType||'')===window.closetItemType&&(!window.closetSleeves||x.sleeves===window.closetSleeves))?.label||'Your pieces';
}
function enableClosetDrag(image,item){image.draggable=true;image.ondragstart=event=>{window.closetDraggedId=item.id;event.dataTransfer.setData('text/plain',item.id);event.dataTransfer.effectAllowed='move';};image.ondragend=()=>{window.closetDraggedId=null;document.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'));};}
function closetWearButton(item){
 const slot=closetPieceSlot(item),label=slot==='top'?(item.category==='Dresses'?'Use as dress':'Use as base shirt'):slot==='layer'?'Add shirt / sweater':slot==='layer2'?'Add jacket':slot==='layer3'?'Add outer coat':'Wear this';const b=node('button',label,'secondary closet-wear');b.type='button';if(closetDressMode()&&(slot==='bottom'||outfitSlots.find(value=>value.id===slot)?.level)){b.disabled=true;b.textContent='Shirts & pants only';b.title='Switch to Shirts & pants to use this piece.';}b.setAttribute('aria-label','Wear '+(item.name||'this piece'));let drag=null,suppressClick=false;
 b.onclick=()=>{if(suppressClick){suppressClick=false;return;}placeClosetPiece(item);};
 const end=event=>{if(!drag)return;const moved=drag.moved;let target;if(moved)target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-closet-slot]');drag.ghost?.remove();document.body.classList.remove('closet-pointer-dragging');drag=null;if(moved){suppressClick=true;setTimeout(()=>suppressClick=false,300);const section=closetVisibleSections().find(x=>x.position===target?.dataset.closetSlot),slot=section&&closetDropSlot(section,item);if(slot)placeClosetPiece(item,slot);else $('closetLookStatus').textContent='Move this piece to its matching space, or tap Wear this.';}};
 b.onpointerdown=event=>{if(event.button!==0)return;drag={x:event.clientX,y:event.clientY,moved:false};try{b.setPointerCapture(event.pointerId);}catch{}};
 b.onpointermove=event=>{if(!drag)return;if(!drag.moved&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>10){drag.moved=true;document.body.classList.add('closet-pointer-dragging');drag.ghost=node('div',item.name||'Closet piece','closet-drag-ghost');document.body.append(drag.ghost);}if(drag.moved){drag.ghost.style.left=event.clientX+'px';drag.ghost.style.top=event.clientY+'px';}};
 b.onpointerup=end;b.onpointercancel=()=>{drag?.ghost?.remove();drag=null;document.body.classList.remove('closet-pointer-dragging');};return b;
}
$('filter').onchange=()=>{window.closetTargetSlot=null;window.closetSlotFilter=null;window.closetItemType='';window.closetSleeves=null;window.closetBrowseAll=$('filter').value==='All categories';render();};
$('closetAllPieces').onclick=()=>{window.closetTargetSlot=null;window.closetSlotFilter=null;window.closetItemType='';window.closetSleeves=null;window.closetBrowseAll=true;$('filter').value='All categories';render();};
$('closetBack').onclick=()=>{window.closetTargetSlot=null;window.closetSlotFilter=null;window.closetItemType='';window.closetSleeves=null;window.closetBrowseAll=false;for(const id of ['search','seasonFilter','sleeveFilter'])$(id).value='';$('filter').value='All categories';render();$('closetCategories').scrollIntoView({block:'start',behavior:'smooth'});};
$('closetClearLook').onclick=async()=>{await outfitBoardReady;window.closetDressPreview=false;currentBoard=cleanOutfitBoard({...currentBoard,slots:{},ideas:{}},items);syncBoardInputs();renderOutfitBoard();const saved=await storeBoard();$('closetLookStatus').textContent=saved?'Look cleared. Your closet pieces are kept.':'Cleared look could not save. Please try again.';};
$('closetSaveLook').onclick=async()=>{await outfitBoardReady;await $('saveBoard').onclick();$('closetLookStatus').textContent=$('boardSaveStatus').textContent;};
$('search').oninput=()=>{window.closetTargetSlot=null;window.closetSlotFilter=null;window.closetItemType='';window.closetSleeves=null;render();};
$('closetLayerCount').onchange=async()=>{await outfitBoardReady;const count=Number($('closetLayerCount').value);currentBoard.layerCount=count;for(const [slot,level]of [['layer',1],['layer2',2],['layer3',3]])if(level>count){delete currentBoard.slots[slot];delete currentBoard.ideas[slot];}window.closetTargetSlot=null;window.closetSlotFilter=null;render();const saved=await storeBoard();$('closetLookStatus').textContent=saved?(count?'Choose clothing for each layer.':'Choose one base shirt: short or long sleeve.'):'Layer choice could not save. Please try again.';};
$('closetUnsorted').onclick=()=>{window.closetTargetSlot=null;window.closetSlotFilter=null;window.closetSleeves=null;window.closetItemType='';window.closetBrowseAll=false;$('search').value='';$('filter').value='Uncategorized';render();$('closetCollection').scrollIntoView({block:'start',behavior:'smooth'});};
$('closetSeparates').onclick=async()=>{await outfitBoardReady;window.closetDressPreview=false;const selectedDress=items.find(item=>item.id===currentBoard.slots.top)?.category==='Dresses';if(selectedDress){delete currentBoard.slots.top;delete currentBoard.ideas.top;currentBoard=cleanOutfitBoard(currentBoard,items);syncBoardInputs();}window.closetTargetSlot=null;window.closetSlotFilter=null;window.closetItemType='';window.closetSleeves=null;window.closetBrowseAll=false;for(const id of ['search','seasonFilter','sleeveFilter'])$(id).value='';$('filter').value='All categories';render();if(selectedDress&&!await storeBoard())$('closetLookStatus').textContent='Outfit change could not save. Please try again.';};
$('closetStyleLook').onclick=()=>{switchView('builder');$('boardTarget').value='accessory';renderBoardSuggestions();refreshTrendLibrary(true);$('boardGapStatus').scrollIntoView({block:'start',behavior:'smooth'});};
Promise.all([closetReady,outfitBoardReady]).then(render);
