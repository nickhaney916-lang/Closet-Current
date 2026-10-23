import {renderPhotoLayers} from './family-alpha-2d-photo-renderer.mjs';
const avatar=document.querySelector('#avatar'),status=document.querySelector('#status');
const garment=(slot,itemId)=>({slot,itemId,sourceIdentity:'synthetic-source',sourceVersion:'v1'});
const data={
 shirt:[garment('top','shirt'),garment('bottom','pants'),garment('shoes','shoes')],
 dress:[garment('dress','dress'),garment('shoes','shoes')]
};
const colors={shirt:'#e45b5b',pants:'#4565b4',shoes:'#30323a',dress:'#40a67b'};
const images={};
for(const [id,color] of Object.entries(colors)){
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="180" height="220"><path fill="'+color+'" d="M45 20 L135 20 L175 70 L150 100 L135 85 L140 215 L40 215 L45 85 L30 100 L5 70 Z"/><path fill="none" stroke="#fff" stroke-width="5" d="M60 50 L120 50 M65 95 L115 95"/></svg>';
 const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);images[id]=image;
}
await Promise.all(Object.values(images).map(image=>image.decode()));
function draw(kind){try{const count=renderPhotoLayers(avatar,data[kind],images);status.textContent=kind+': '+count+' synthetic garment overlays';}catch(error){status.textContent='Preview unavailable: '+error.message;}}
document.querySelector('#outfit').onclick=()=>draw('shirt');
document.querySelector('#dress').onclick=()=>draw('dress');
document.querySelector('#clear').onclick=()=>{avatar.replaceChildren();status.textContent='Cleared';};
draw('shirt');
