'use strict';
(function(root){
 function support(item){
  if(item?.category==='Bottoms')return 'clips';
  if(['Shoes','Accessories','Uncategorized'].includes(item?.category))return 'shelf';
  return 'hanger';
 }
 function modeIsRack(mode){return mode==='rack';}
 function scrollAmount(width){
  if(!Number.isFinite(width)||width<=0)throw Error('Invalid closet rack dimensions');
  return Math.max(180,Math.round(width*.76));
 }
 // Stable nearest-card calculation avoids viewport-dependent swiping that
 // skips multiple items on a wide browser screen.
 function nearestIndex(centers,viewportCenter){
  if(!Array.isArray(centers)||!centers.length)return -1;
  if(!Number.isFinite(viewportCenter)||centers.some(x=>!Number.isFinite(x)))
   throw Error('Invalid closet rack positions');
  let best=0,distance=Infinity;
  for(let i=0;i<centers.length;i++){
   const delta=Math.abs(centers[i]-viewportCenter);
   if(delta<distance){distance=delta;best=i;}
  }
  return best;
 }
 function cards(grid){
  return grid?Array.from(grid.querySelectorAll('.card[data-item-id]')):[];
 }
 function activeIndex(grid){
  const all=cards(grid);if(!all.length)return -1;
  const region=grid.getBoundingClientRect(),center=(region.left+region.right)/2;
  return nearestIndex(all.map(card=>{
   const r=card.getBoundingClientRect();return (r.left+r.right)/2;
  }),center);
 }
 function activeItemId(grid){
  const list=cards(grid),index=activeIndex(grid);
  return index<0?null:list[index]?.dataset.itemId||null;
 }
 function jump(grid,index,behavior='smooth'){
  const list=cards(grid);
  if(!list.length||!Number.isInteger(index))return null;
  const target=Math.max(0,Math.min(index,list.length-1)),rect=list[target].getBoundingClientRect();
  const container=grid.getBoundingClientRect();
  const shift=(rect.left+rect.right-container.left-container.right)/2;
  const left=grid.scrollLeft+shift;
  if(typeof grid.scrollTo==='function')grid.scrollTo({left,behavior});
  else grid.scrollLeft=left;
  return {index:target,total:list.length,id:list[target].dataset.itemId};
 }
 function jumpBy(grid,amount){
  if(!Number.isInteger(amount)||Math.abs(amount)!==1)throw Error('Invalid rack step');
  return jump(grid,Math.max(0,activeIndex(grid))+amount);
 }
 function restore(grid,id){
  const list=cards(grid);
  if(!list.length)return null;
  const match=id?list.findIndex(x=>x.dataset.itemId===String(id)):-1;
  return jump(grid,match>=0?match:0,'instant');
 }
 root.ClosetRackEngine={support,modeIsRack,scrollAmount,nearestIndex,
  cards,activeIndex,activeItemId,jump,jumpBy,restore};
 if(typeof module!=='undefined')module.exports=root.ClosetRackEngine;
})(typeof window!=='undefined'?window:globalThis);
