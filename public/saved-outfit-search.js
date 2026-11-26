'use strict';

function normalizeSavedOutfitSearch(value){
 return typeof value==='string'?value.normalize('NFC').toLowerCase().trim().replace(/\s+/g,' '):'';
}
function savedOutfitSearchText(board,wardrobe,owner){
 const fields=[board.name,board.occasion];
 for(const slot of outfitSlots){
  const garment=wardrobe.get(board.slots?.[slot.id]);
  if(!garment||(garment.ownerId!=null&&garment.ownerId!==owner)||!slotAllows(slot,garment))continue;
  fields.push(garment.name,garment.category,garment.itemType,garment.color);
 }
 return fields.map(normalizeSavedOutfitSearch).filter(Boolean).join(' ');
}

let savedOutfitSearchView=null;
function applySavedOutfitSearch(){
 const view=savedOutfitSearchView;
 if(!view?.lease.current())return;
 const input=$('savedOutfitSearch'),query=normalizeSavedOutfitSearch(input.value);
 const terms=query?query.split(' '):[];
 let shown=0;
 for(const {row,text} of view.entries){
  row.hidden=!terms.every(term=>text.includes(term));
  if(!row.hidden)shown++;
 }
 $('clearSavedOutfitSearch').disabled=!input.value;
 $('savedOutfitSearchCount').textContent=query
  ?shown+' of '+view.entries.length+' saved outfits'
  :shown===1?'1 saved outfit':shown+' saved outfits';
 $('savedOutfitSearchEmpty').hidden=!query||shown!==0||view.entries.length===0;
}
function refreshSavedOutfitSearch(lease){
 const panel=$('savedOutfitSearchPanel');
 savedOutfitSearchView=null;
 panel.hidden=!lease?.current();
 if(panel.hidden)return;
 const wardrobe=new Map(items.map(item=>[item.id,item]));
 const owner=window.closetAuth.user.id;
 const rows=$('savedBoards').children;
 savedOutfitSearchView={lease,entries:savedOutfitBoards.map((board,index)=>({
  row:rows[index],text:savedOutfitSearchText(board,wardrobe,owner)
 }))};
 applySavedOutfitSearch();
}
$('savedOutfitSearch').addEventListener('input',applySavedOutfitSearch);
$('clearSavedOutfitSearch').onclick=()=>{
 if(!savedOutfitSearchView?.lease.current())return;
 $('savedOutfitSearch').value='';
 applySavedOutfitSearch();
 $('savedOutfitSearch').focus();
};
window.addEventListener('closet:session-locked',()=>{
 savedOutfitSearchView=null;
 $('savedOutfitSearch').value='';
 $('savedOutfitSearchCount').textContent='';
 $('savedOutfitSearchEmpty').hidden=true;
 $('savedOutfitSearchPanel').hidden=true;
});
