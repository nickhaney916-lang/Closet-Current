'use strict';
window.closetBrowseAll=false;
const closetSections=[{category:'Tops',label:'Tops',slot:'top',position:'top'},{category:'Bottoms',label:'Bottoms',slot:'bottom',position:'bottom'},{category:'Shoes',label:'Shoes',slot:'shoes',position:'shoes'},{category:'Outerwear',label:'Layers',slot:'layer',position:'layer'},{category:'Dresses',label:'Dresses',slot:'top',position:'dresses'},{category:'Accessories',label:'Accessories',position:'accessories'},{category:'Uncategorized',label:'Needs details',position:'unfinished'}];
function closetPieceSlot(item){if(['Tops','Dresses'].includes(item.category))return 'top';if(item.category==='Bottoms')return 'bottom';if(item.category==='Outerwear')return 'layer';if(item.category==='Shoes')return 'shoes';return item.category==='Accessories'?(item.itemType==='Bag'?'bag':['Jewelry','Sunglasses'].includes(item.itemType)?'accessory':['Hat','Scarf','Belt'].includes(item.itemType)?'finish':null):null;}
function closetDropSlot(section,item){const slot=section.category==='Accessories'?closetPieceSlot(item):section.slot;if(!slot)return null;if(section.category==='Dresses'&&item.category!=='Dresses'||section.category==='Accessories'&&item.category!=='Accessories')return null;return outfitSlots.find(x=>x.id===slot&&slotAllows(x,item))?slot:null;}
async function placeClosetPiece(item,slotId=closetPieceSlot(item)){
 await outfitBoardReady;if(!items.some(x=>x.id===item.id)||!outfitSlots.some(x=>x.id===slotId&&slotAllows(x,item))){$('closetLookStatus').textContent='Confirm this piece’s category and accessory type in Adjust details before placing it.';return false;}
 if(slotId==='bottom'&&items.find(x=>x.id===currentBoard.slots.top)?.category==='Dresses'){$('closetLookStatus').textContent='Your dress covers the bottoms space. Choose a top or clear the look to add bottoms.';return false;}
 const saved=await selectBoardPiece(slotId,item.id);$('closetLookStatus').textContent=saved?(item.name||'Your piece')+' added to your look.':'This look could not save. Your clothing photos are kept.';return saved;
}
function renderClosetBrowser(){
 const grid=$('closetCategories');if(!grid)return;grid.replaceChildren();
 const head=node('span',null,'closet-figure-head');head.setAttribute('aria-hidden','true');grid.append(head);
 for(const section of closetSections){
  const count=items.filter(x=>x.category===section.category).length,b=node('button',null,'closet-category closet-category-'+section.position);b.type='button';b.dataset.category=section.category;if(section.slot||section.category==='Accessories')b.dataset.closetSlot=section.position;
  b.setAttribute('aria-label',section.label+', '+count+' '+(count===1?'piece':'pieces')+'. Open category');b.append(node('strong',section.label),node('span',count+' '+(count===1?'piece':'pieces'),'closet-category-count'));
  const slot=section.slot,selected=typeof boardInitialized!=='undefined'&&boardInitialized?items.find(x=>x.id===currentBoard.slots[slot]):null;
  if(selected&&slot&&section.position!=='dresses'){const im=node('img');im.src=selected.image;im.alt=selected.name||'Piece on your look';b.append(im);b.classList.add('has-look');}
  if(section.position==='bottom'&&typeof boardInitialized!=='undefined'&&boardInitialized&&items.find(x=>x.id===currentBoard.slots.top)?.category==='Dresses')b.append(node('small','Dress covers this space'));
  b.onclick=()=>{window.closetBrowseAll=false;$('search').value='';$('filter').value=section.category;render();$('closetCollection').scrollIntoView({block:'start',behavior:'smooth'});};
  b.ondragover=event=>{const item=items.find(x=>x.id===window.closetDraggedId);if(item&&closetDropSlot(section,item)){event.preventDefault();b.classList.add('drag-over');event.dataTransfer.dropEffect='move';}};b.ondragleave=()=>b.classList.remove('drag-over');b.ondrop=event=>{event.preventDefault();b.classList.remove('drag-over');const item=items.find(x=>x.id===event.dataTransfer.getData('text/plain')),slot=item&&closetDropSlot(section,item);if(slot)placeClosetPiece(item,slot);else $('closetLookStatus').textContent='Move this piece to its matching space.';};grid.append(b);
 }
 const browsing=!!($('search').value.trim()||$('filter').value!=='All categories'||window.closetBrowseAll);$('closetCollection').hidden=!browsing;$('closetLayout').classList.toggle('is-browsing',browsing);$('closetCollectionTitle').textContent=$('search').value.trim()?'Search results':$('filter').value==='All categories'?'All pieces':closetSections.find(x=>x.category===$('filter').value)?.label||'Your pieces';
}
function enableClosetDrag(image,item){image.draggable=true;image.ondragstart=event=>{window.closetDraggedId=item.id;event.dataTransfer.setData('text/plain',item.id);event.dataTransfer.effectAllowed='move';};image.ondragend=()=>{window.closetDraggedId=null;document.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'));};}
function closetWearButton(item){
 const b=node('button','Wear this','secondary closet-wear');b.type='button';b.setAttribute('aria-label','Wear '+(item.name||'this piece'));let drag=null,suppressClick=false;
 b.onclick=()=>{if(suppressClick){suppressClick=false;return;}placeClosetPiece(item);};
 const end=event=>{if(!drag)return;const moved=drag.moved;let target;if(moved)target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-closet-slot]');drag.ghost?.remove();document.body.classList.remove('closet-pointer-dragging');drag=null;if(moved){suppressClick=true;setTimeout(()=>suppressClick=false,300);const section=closetSections.find(x=>x.position===target?.dataset.closetSlot),slot=section&&closetDropSlot(section,item);if(slot)placeClosetPiece(item,slot);else $('closetLookStatus').textContent='Move this piece to its matching space, or tap Wear this.';}};
 b.onpointerdown=event=>{if(event.button!==0)return;drag={x:event.clientX,y:event.clientY,moved:false};try{b.setPointerCapture(event.pointerId);}catch{}};
 b.onpointermove=event=>{if(!drag)return;if(!drag.moved&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>10){drag.moved=true;document.body.classList.add('closet-pointer-dragging');drag.ghost=node('div',item.name||'Closet piece','closet-drag-ghost');document.body.append(drag.ghost);}if(drag.moved){drag.ghost.style.left=event.clientX+'px';drag.ghost.style.top=event.clientY+'px';}};
 b.onpointerup=end;b.onpointercancel=()=>{drag?.ghost?.remove();drag=null;document.body.classList.remove('closet-pointer-dragging');};return b;
}
$('filter').onchange=()=>{window.closetBrowseAll=$('filter').value==='All categories';render();};
$('closetAllPieces').onclick=()=>{window.closetBrowseAll=true;$('filter').value='All categories';render();};
$('closetBack').onclick=()=>{window.closetBrowseAll=false;for(const id of ['search','seasonFilter','sleeveFilter'])$(id).value='';$('filter').value='All categories';render();$('closetCategories').scrollIntoView({block:'start',behavior:'smooth'});};
$('closetClearLook').onclick=()=>{$('clearBoard').onclick();$('closetLookStatus').textContent='Look cleared. Your closet pieces are kept.';};
$('closetSaveLook').onclick=async()=>{await outfitBoardReady;await $('saveBoard').onclick();$('closetLookStatus').textContent=$('boardSaveStatus').textContent;};
$('closetStyleLook').onclick=()=>switchView('builder');
Promise.all([closetReady,outfitBoardReady]).then(render);
