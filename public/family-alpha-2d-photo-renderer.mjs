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

/**
 * Family Alpha visual candidate: actual articulated front-facing 2D HUMAN
 * silhouette behind verified garment-photo layers. No generated garments,
 * image URLs, user likeness or external assets. Anatomical outlines do not
 * simulate fabric drape or guarantee garment-specific body fit.
 *
 * Fixed 360x600 virtual space matches the stage's 3:5 frame. Head, shoulders,
 * separate arms/hands, waist, two legs and feet remain distinct even when
 * a garment cutout is missing. This replaces the old rounded-rectangle blob.
 */
export function createAlphaHumanoidFigure(doc=document){
 if(typeof doc?.createElementNS!=='function'&&typeof doc?.createElement!=='function')
  throw new TypeError('SVG-compatible document required');
 const ns='http://www.w3.org/2000/svg';
 // Real browsers always have createElementNS. The createElement fallback keeps
 // pre-existing headless/Node DOM fakes usable; it is not a browser SVG path.
 const element=(tag)=>typeof doc.createElementNS==='function'
  ?doc.createElementNS(ns,tag):doc.createElement(tag);
 const node=(tag,attrs)=>{
  const el=element(tag);
  for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));
  return el;
 };
 const svg=node('svg',{
  'viewBox':'0 0 360 600','preserveAspectRatio':'xMidYMid meet',
  'aria-hidden':'true','data-humanoid':'articulated-2d-v1'
 });
 Object.assign(svg.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none'});
 const skin='#d9bfae',shade='#c2a395',edge='#8c7168',highlight='#ead4c6';
 const part=(name,d,fill=skin)=>{
  svg.append(node('path',{'data-part':name,d,fill,stroke:edge,'stroke-width':1.5,
   'stroke-linecap':'round','stroke-linejoin':'round'}));
 };
 // Anchor shadows must remain behind photo layers, not fake cutout geometry.
 svg.append(node('ellipse',{'data-part':'ground-shadow',cx:180,cy:576,rx:82,ry:9,fill:'#d6d9da',opacity:'.65'}));
 // Separate legs with visible space between knees and ankles.
 part('left-leg','M149 316 Q143 347 143 370 L138 440 L137 527 Q137 541 146 547 L162 547 Q170 540 170 528 L174 439 L179 339 Z');
 part('right-leg','M181 339 L186 439 L190 528 Q190 540 198 547 L214 547 Q223 541 223 527 L222 440 L217 370 Q217 347 211 316 Z');
 part('left-foot','M141 535 Q135 547 125 553 Q113 555 112 564 Q113 571 125 571 L161 571 Q170 568 168 557 L163 539 Z',shade);
 part('right-foot','M197 539 L192 557 Q190 568 199 571 L235 571 Q247 571 248 564 Q247 555 235 553 Q225 547 219 535 Z',shade);
 // Independently shaped arms make this recognizably human, not one torso oval.
 part('left-arm','M129 138 Q112 139 101 153 Q96 171 93 198 L85 279 Q83 309 90 335 L98 345 Q108 339 109 323 L117 273 L127 211 Q135 189 143 164 Z');
 part('right-arm','M231 138 Q248 139 259 153 Q264 171 267 198 L275 279 Q277 309 270 335 L262 345 Q252 339 251 323 L243 273 L233 211 Q225 189 217 164 Z');
 part('left-hand','M90 327 Q82 342 83 355 L91 365 Q95 370 100 360 L108 340 Z',shade);
 part('right-hand','M270 327 Q278 342 277 355 L269 365 Q265 370 260 360 L252 340 Z',shade);
 // Waist/hip anatomy and connected chest prevent artificial disconnected pieces.
 part('torso','M146 125 Q160 121 180 122 Q200 121 214 125 L231 144 Q239 165 230 196 L218 256 Q211 279 214 310 Q213 328 197 337 Q180 343 163 337 Q147 328 146 310 Q149 279 142 256 L130 196 Q121 165 129 144 Z',skin);
 part('neck','M163 104 L162 129 Q180 143 198 129 L197 104 Z',shade);
 // Subtle face cues rather than pasted flat oval, with neck and ears.
 svg.append(node('ellipse',{'data-part':'left-ear',cx:145,cy:75,rx:7,ry:12,fill:skin,stroke:edge,'stroke-width':1}));
 svg.append(node('ellipse',{'data-part':'right-ear',cx:215,cy:75,rx:7,ry:12,fill:skin,stroke:edge,'stroke-width':1}));
 svg.append(node('ellipse',{'data-part':'head',cx:180,cy:72,rx:34,ry:44,fill:skin,stroke:edge,'stroke-width':1.5}));
 svg.append(node('path',{'data-part':'face-shading',d:'M166 104 Q181 111 197 103',fill:'none',stroke:shade,'stroke-width':2}));
 svg.append(node('path',{'data-part':'shoulder-highlight',d:'M137 150 Q155 141 165 147 M195 147 Q206 141 223 150',fill:'none',stroke:highlight,'stroke-width':3,'stroke-linecap':'round'}));
 return svg;
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
 frame.append(createAlphaHumanoidFigure(document));
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
