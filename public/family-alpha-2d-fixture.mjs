import {renderPhotoLayers} from './family-alpha-2d-photo-renderer.mjs';
const avatar=document.querySelector('#avatar'),status=document.querySelector('#status');
const garment=(slot,itemId)=>({slot,itemId,sourceIdentity:'synthetic-source',sourceVersion:'v1'});
const data={
 shirt:[garment('top','shirt'),garment('bottom','pants'),garment('shoes','shoes'),garment('layer','jacket')],
 dress:[garment('dress','dress'),garment('shoes','shoes')]
};
const colors={shirt:'#e45b5b',pants:'#4565b4',shoes:'#30323a',dress:'#40a67b',jacket:'#c7a06e'};
const images={};
for(const [id,color] of Object.entries(colors)){
 const paths={shirt:'M45 20L135 20L175 70L150 100L135 85L140 215L40 215L45 85L30 100L5 70Z',pants:'M35 10L145 10L160 210L105 210L90 110L75 210L20 210Z',shoes:'M5 135L70 135L85 175L85 190L0 190L0 165ZM100 135L165 135L180 165L180 190L95 190L95 175Z',dress:'M45 10L135 10L170 65L145 90L130 75L175 215L5 215L50 75L35 90L10 65Z',jacket:'M40 15L5 65L25 170L50 145L50 210L85 210L85 30L95 30L95 210L130 210L130 145L155 170L175 65L140 15Z'};const svg='<svg xmlns="http://www.w3.org/2000/svg" width="180" height="220"><path fill="'+color+'" d="'+paths[id]+'"/><path fill="none" stroke="#fff" stroke-width="3" opacity=".7" d="M60 50 L120 50 M65 95 L115 95"/></svg>';
 const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);images[id]=image;
}
await Promise.all(Object.values(images).map(image=>image.decode()));
function draw(kind){try{const count=renderPhotoLayers(avatar,data[kind],images);status.textContent=kind+': '+count+' synthetic garment overlays';}catch(error){status.textContent='Preview unavailable: '+error.message;}}
document.querySelector('#outfit').onclick=()=>draw('shirt');
document.querySelector('#dress').onclick=()=>draw('dress');
document.querySelector('#clear').onclick=()=>{avatar.replaceChildren();status.textContent='Cleared';};
draw('shirt');
