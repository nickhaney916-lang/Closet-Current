'use strict';
(function(root){
 const placements={top:{left:24,top:19,width:52,height:31,z:2},bottom:{left:31,top:46,width:38,height:43,z:3},layer:{left:21,top:18,width:58,height:35,z:4},layer2:{left:18,top:16,width:64,height:39,z:5},layer3:{left:15,top:15,width:70,height:49,z:6},shoes:{left:23,top:88,width:54,height:11,z:7}};
 const base='<svg viewBox="0 0 300 500" aria-hidden="true" focusable="false"><g fill="#d6d5d3" stroke="#aaa9a7" stroke-width="2"><ellipse cx="150" cy="42" rx="29" ry="36"/><path d="M140 76h20l4 20-14 19-14-19z"/><path d="M128 92Q94 93 88 121L79 241Q77 266 87 279L101 279 111 166 115 254 184 254 189 166 199 279 213 279Q223 267 221 241L212 121Q206 94 172 92L150 116z"/><path d="M115 248L108 333 113 436 139 437 149 329 161 437 187 436 193 333 185 248z"/><path d="M112 433L102 469Q99 481 112 484L143 484 140 434zM161 434L159 484 190 484Q202 481 198 469L187 433z"/></g></svg>';
 function render(target,board,closet,{size='card'}={}){
  target.replaceChildren();
  target.className='outfit-mannequin outfit-mannequin-'+size;
  target.setAttribute('role','group');
  target.setAttribute('aria-label','Approximate outfit figure; original garment photos below show exact colors and details');
  const silhouette=document.createElement('div');silhouette.className='outfit-mannequin-base';silhouette.innerHTML=base;target.append(silhouette);
  const byId=new Map(closet.map(item=>[item.id,item]));
  const dress=byId.get(board.slots?.top)?.category==='Dresses';
  for(const slot of ['top','bottom','layer','layer2','layer3','shoes']){
   if(dress&&slot==='bottom')continue;
   const item=byId.get(board.slots?.[slot]);if(!item||typeof item.image!=='string')continue;
   const p={...placements[slot]};
   if(dress&&slot==='top'){p.top=18;p.left=24;p.width=52;p.height=70;}
   if(slot==='bottom'&&item.itemType==='Shorts')p.height=23;
   if(slot==='bottom'&&item.itemType==='Skirt')p.width=47;
   const region=document.createElement('div');region.className='outfit-mannequin-garment outfit-mannequin-'+slot;
   Object.assign(region.style,{left:p.left+'%',top:p.top+'%',width:p.width+'%',height:p.height+'%',zIndex:String(p.z)});
   const img=document.createElement('img');img.src=item.image;img.alt='';img.loading='lazy';img.decoding='async';
   const fallback=document.createElement('span');fallback.className='outfit-mannequin-fallback';fallback.textContent=item.itemType||item.category||'Clothing';fallback.hidden=true;
   img.addEventListener('error',()=>{img.hidden=true;fallback.hidden=false;},{once:true});
   region.append(img,fallback);target.append(region);
  }
  const caption=document.createElement('span');caption.className='outfit-mannequin-caption';caption.textContent='Styling preview · photos show actual garments';target.append(caption);
  return target;
 }
 root.OutfitFigure={render};
 if(typeof module!=='undefined')module.exports={render,placements};
})(typeof window!=='undefined'?window:globalThis);
