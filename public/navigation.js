'use strict';
document.querySelectorAll('[data-go-view]').forEach(button=>button.onclick=event=>{event.preventDefault();switchView(button.dataset.goView);if(button.id==='styleNewClothes'&&typeof setCaptureMode==='function')setCaptureMode('single');});
const occasionChips=[...document.querySelectorAll('[data-occasion]')];
function syncOccasionChips(){for(const chip of occasionChips)chip.setAttribute('aria-pressed',String(chip.dataset.occasion===$('stylistOccasion').value));}
for(const chip of occasionChips)chip.onclick=()=>{const select=$('stylistOccasion');select.value=chip.dataset.occasion;select.onchange?.();syncOccasionChips();};
$('stylistOccasion').addEventListener('change',syncOccasionChips);
$('moreMenu').addEventListener('keydown',event=>{if(event.key==='Escape'){$('moreMenu').open=false;$('moreMenu').querySelector('summary').focus();}});
document.addEventListener('click',event=>{const more=$('moreMenu');if(more.open&&!more.contains(event.target))more.open=false;});
// Open the exact clothing record, never a name search. Two saved shirts may
// share a name; a stale shoes/season/layer filter must not hide the tapped item.
function openExactHomeClosetPiece(id){
 const piece=items.find(item=>item.id===id);
 if(!piece)return false; // It may have been removed in another session.
 for(const field of ['search','seasonFilter','sleeveFilter'])$(field).value='';
 $('filter').value='All categories';
 window.closetBrowseAll=true;
 window.closetTargetSlot=null;
 window.closetSlotFilter=null;
 window.closetItemType='';
 window.closetSleeves=null;
 window.closetActiveItemId=null; // Don't restore a previously browsed piece.
 window.closetPresentationMode='rack';
 switchView('closet');
 const grid=$('closetGrid'),rack=typeof ClosetRackEngine!=='undefined'?ClosetRackEngine:null;
 const card=[...grid.querySelectorAll('[data-item-id]')].find(x=>x.dataset.itemId===id);
 if(!card||!rack)return false;
 rack.restore(grid,id);
 if(typeof updateClosetRackPosition==='function')updateClosetRackPosition();
 $('closetCollection').scrollIntoView?.({block:'start',behavior:'instant'});
 card.tabIndex=-1;card.focus({preventScroll:true});
 return true;
}
function renderHomePieces(){
 const grid=$('homePieces');if(!grid)return;grid.replaceChildren();
 $('homeClosetSummary').textContent=items.length?items.length+' piece'+(items.length===1?'':'s')+' in your collection. Every one is a new possibility.':'Start with a snap 📸';
 if(!items.length){const box=node('div',null,'home-empty');box.append(node('span','✦','empty-spark'),node('h3','Your closet starts here ✨'),node('p','Snap your first piece.'));const start=node('button','Add a photo','primary');start.type='button';start.onclick=()=>switchView('scan');box.append(start);grid.append(box);return;}
 const recent=[...items].sort((a,b)=>String(b.savedAt||'').localeCompare(String(a.savedAt||''))).slice(0,4);
 for(const item of recent){
  const button=node('button',null,'home-piece'),image=node('img');
  button.type='button';button.dataset.itemId=item.id;
  image.src=item.image;image.alt=item.name||item.itemType||'Your clothing photo';
  button.append(image,node('strong',item.name||item.itemType||'Closet piece'),node('span',item.category));
  button.setAttribute('aria-label','Open '+(item.name||item.itemType||'clothing piece')+' in My closet');
  button.onclick=()=>openExactHomeClosetPiece(item.id);
  grid.append(button);
 }
}
syncOccasionChips();renderHomePieces();
