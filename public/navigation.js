'use strict';
document.querySelectorAll('[data-go-view]').forEach(button=>button.onclick=event=>{event.preventDefault();switchView(button.dataset.goView);});
const occasionChips=[...document.querySelectorAll('[data-occasion]')];
function syncOccasionChips(){for(const chip of occasionChips)chip.setAttribute('aria-pressed',String(chip.dataset.occasion===$('stylistOccasion').value));}
for(const chip of occasionChips)chip.onclick=()=>{const select=$('stylistOccasion');select.value=chip.dataset.occasion;select.onchange?.();syncOccasionChips();};
$('stylistOccasion').addEventListener('change',syncOccasionChips);
$('moreMenu').addEventListener('keydown',event=>{if(event.key==='Escape'){$('moreMenu').open=false;$('moreMenu').querySelector('summary').focus();}});
document.addEventListener('click',event=>{const more=$('moreMenu');if(more.open&&!more.contains(event.target))more.open=false;});
function renderHomePieces(){
 const grid=$('homePieces');if(!grid)return;grid.replaceChildren();
 $('homeClosetSummary').textContent=items.length?items.length+' piece'+(items.length===1?'':'s')+' in your collection. Every one is a new possibility.':'Start with a snap 📸';
 if(!items.length){const box=node('div',null,'home-empty');box.append(node('span','✦','empty-spark'),node('h3','Your closet starts here ✨'),node('p','Snap your first piece.'));const start=node('button','Add a photo','primary');start.type='button';start.onclick=()=>switchView('scan');box.append(start);grid.append(box);return;}
 const recent=[...items].sort((a,b)=>String(b.savedAt||'').localeCompare(String(a.savedAt||''))).slice(0,4);
 for(const item of recent){const button=node('button',null,'home-piece'),image=node('img');image.src=item.image;image.alt=item.name||item.itemType||'Your clothing photo';button.type='button';button.append(image,node('strong',item.name||item.itemType||'Closet piece'),node('span',item.category));button.onclick=()=>{$('search').value=item.name||'';$('filter').value='All categories';$('seasonFilter').value='';$('sleeveFilter').value='';switchView('closet');};grid.append(button);}
}
syncOccasionChips();renderHomePieces();
