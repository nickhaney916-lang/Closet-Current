import {planPhotoLayers} from './family-alpha-2d-layer-plan.mjs';

/**
 * Research-only photo geometry. The avatar frame is 3:5, while placement
 * bounds are percentages of that frame. Preserve decoded image proportions
 * rather than forcing the image into the slot's unrelated width/height.
 * This is contain-within-slot placement, NOT anatomical fit or body drape.
 */
export function fitPhotoLayerToSlot(slot,naturalWidth,naturalHeight){
 if(!slot||!['x','y','width','height'].every(k=>Number.isFinite(slot[k]))||
  slot.width<=0||slot.height<=0||slot.x<0||slot.x>1||slot.y<0||slot.y>1||
  !Number.isFinite(naturalWidth)||!Number.isFinite(naturalHeight)||
  naturalWidth<=0||naturalHeight<=0)throw new TypeError('Valid slot and decoded garment dimensions required');
 const frameWidth=3,frameHeight=5;
 const scale=Math.min(slot.width*frameWidth/naturalWidth,slot.height*frameHeight/naturalHeight);
 const width=naturalWidth*scale/frameWidth,height=naturalHeight*scale/frameHeight;
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)
  throw new TypeError('Invalid garment containment geometry');
 return Object.freeze({x:slot.x,y:slot.y,width,height});
}

/** Research-only renderer. Caller MUST pre-verify masked image and account/photo provenance. */
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
  if(!(image instanceof HTMLImageElement)||!image.complete||image.naturalWidth===0||image.naturalHeight===0)
   throw new Error('Preloaded verified masked garment image required for '+layer.slot);
  const fit=fitPhotoLayerToSlot(layer,image.naturalWidth,image.naturalHeight);
  const el=image.cloneNode(false);
  el.alt='';
  el.dataset.slot=layer.slot;
  Object.assign(el.style,{position:'absolute',left:(fit.x*100)+'%',top:(fit.y*100)+'%',width:(fit.width*100)+'%',height:(fit.height*100)+'%',transform:'translate(-50%,-50%)',objectFit:'contain',pointerEvents:'none'});
  frame.append(el);
 }
 container.replaceChildren(frame);
 return layers.length;
}
