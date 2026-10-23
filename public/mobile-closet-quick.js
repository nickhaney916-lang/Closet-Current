'use strict';
/**
 * Simple mobile closet category shortcuts.
 *
 * Presentation only: category views never edit item records, active outfit
 * slots, wardrobe originals, photo metadata, cloud, account or Auth state.
 * No source photo reads or network calls.
 */
(function(root){
 const categories=Object.freeze([
  Object.freeze({key:'shirts',category:'Tops',label:'Shirts',hint:'Shirts & sweaters',symbol:'👕'}),
  Object.freeze({key:'pants',category:'Bottoms',label:'Pants',hint:'Pants, shorts & skirts',symbol:'👖'}),
  Object.freeze({key:'shoes',category:'Shoes',label:'Shoes',hint:'All your footwear',symbol:'👟'}),
  Object.freeze({key:'dresses',category:'Dresses',label:'Dresses',hint:'Your dresses',symbol:'👗'})
 ]);
 function summarize(items){
  const safe=Array.isArray(items)?items:[];
  return categories.map(group=>({
   ...group,count:safe.reduce((n,item)=>n+Number(item&&item.category===group.category),0)
  }));
 }
 function render(container,items,onSelect){
  if(!container||typeof container.replaceChildren!=='function'||typeof onSelect!=='function')return false;
  const doc=container.ownerDocument||document;
  const fragment=doc.createDocumentFragment();
  for(const entry of summarize(items)){
   const button=doc.createElement('button');
   button.type='button';button.className='closet-quick-tile';
   button.dataset.closetQuick=entry.key;
   button.dataset.category=entry.category;
   button.setAttribute('aria-controls','closetCollection');
   button.setAttribute('aria-label',entry.label+', '+entry.count+' '+(entry.count===1?'piece':'pieces')+'. '+entry.hint+'. Browse category');
   const emoji=doc.createElement('span');emoji.className='closet-quick-emoji';
   emoji.setAttribute('aria-hidden','true');emoji.textContent=entry.symbol;
   const name=doc.createElement('strong');name.textContent=entry.label;
   const count=doc.createElement('span');count.className='closet-quick-count';
   count.textContent=entry.count+' '+(entry.count===1?'piece':'pieces');
   const hint=doc.createElement('small');hint.textContent=entry.hint;
   button.append(emoji,name,count,hint);
   button.addEventListener('click',()=>onSelect(entry.category));
   fragment.append(button);
  }
  container.replaceChildren(fragment);
  return true;
 }
 root.MobileClosetQuick=Object.freeze({summarize,render});
})(typeof window!=='undefined'?window:globalThis);
