'use strict';
(function(root){
 function support(item){
  if(item?.category==='Bottoms')return 'clips';
  if(['Shoes','Accessories','Uncategorized'].includes(item?.category))return 'shelf';
  return 'hanger'; // tops, jackets, coats, dresses; unknown stays ordinary photo
 }
 function modeIsRack(mode){return mode==='rack';}
 function scrollAmount(width){
  if(!Number.isFinite(width)||width<=0)throw Error('Invalid closet rack dimensions');
  return Math.max(180,Math.round(width*.76));
 }
 root.ClosetRackEngine={support,modeIsRack,scrollAmount};
 if(typeof module!=='undefined')module.exports=root.ClosetRackEngine;
})(typeof window!=='undefined'?window:globalThis);
