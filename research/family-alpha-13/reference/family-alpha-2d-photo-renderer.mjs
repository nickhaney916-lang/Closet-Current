import {planPhotoLayers} from './family-alpha-2d-layer-plan.mjs';
/** Research-only visual renderer. Images must be already masked and ownership-verified by caller. */
export function renderPhotoLayers(container,selections,images){
 if(!container||typeof container.replaceChildren!=='function')throw new TypeError('Container required');
 const layers=planPhotoLayers(selections);
 if(!images||typeof images!=='object')throw new TypeError('Verified masked image map required');
 const frame=document.createElement('div');
 frame.className='family-alpha-avatar';
 frame.setAttribute('role','img');
 frame.setAttribute('aria-label','2D avatar with '+layers.map(x=>x.slot).join(', '));
 Object.assign(frame.style,{position:'relative',width:'min(100%,360px)',aspectRatio:'3/5',margin:'auto',overflow:'hidden',background:'#f3f4f6',borderRadius:'16px'});
 const body=document.createElement('div');
 Object.assign(body.style,{position:'absolute',left:'24%',top:'8%',width:'52%',height:'85%',background:'#c6a990',borderRadius:'45% 45% 25% 25%',opacity:'.55'});
 frame.append(body);
 for(const layer of layers){
  const image=images[layer.itemId];
  if(!(image instanceof HTMLImageElement)||!image.complete||image.naturalWidth===0)throw new Error('Preloaded verified masked garment image required for '+layer.slot);
  const el=image.cloneNode(false);
  el.alt='';
  el.dataset.slot=layer.slot;
  Object.assign(el.style,{position:'absolute',left:(layer.x*100)+'%',top:(layer.y*100)+'%',width:(layer.width*100)+'%',height:(layer.height*100)+'%',transform:'translate(-50%,-50%)',objectFit:'fill',pointerEvents:'none'});
  frame.append(el);
 }
 container.replaceChildren(frame);
 return layers.length;
}
