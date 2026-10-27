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
 * Visual-only alignment of an ALREADY human-approved transparent photo. The
 * RGBA pixels, original photo, class/type and mask are NEVER changed here.
 * Fit the actually visible alpha pixels rather than huge transparent PNG
 * margins. Bound scale gain to avoid pixelated clothing and unsafe zoom.
 * Any invalid/nontransparent image falls back to the old contain placement.
 */
export function fitVisibleAlphaBoundsToSlot(slot,naturalWidth,naturalHeight,bounds){
 const fallback=fitPhotoLayerToSlot(slot,naturalWidth,naturalHeight);
 if(!bounds||!['left','top','right','bottom'].every(k=>Number.isFinite(bounds[k]))||
    bounds.left<0||bounds.top<0||bounds.right>naturalWidth||
    bounds.bottom>naturalHeight||bounds.right<=bounds.left||
    bounds.bottom<=bounds.top)return fallback;
 const bw=bounds.right-bounds.left,bh=bounds.bottom-bounds.top;
 // Tiny isolated specks, very thin slivers and near-full-rect masks cannot
 // provide dependable evidence of how a photographed garment should align.
 if(bw/naturalWidth<.18||bh/naturalHeight<.18||
    bw*bh/(naturalWidth*naturalHeight)<.06||
    (bw/naturalWidth>.94&&bh/naturalHeight>.94))return fallback;
 const baseScale=fallback.width*3/naturalWidth;
 const nextScale=Math.min(
  slot.width*3/bw,slot.height*5/bh,baseScale*1.35);
 if(!Number.isFinite(nextScale)||nextScale<=baseScale)return fallback;
 const visibleCx=(bounds.left+bounds.right)/2;
 const visibleCy=(bounds.top+bounds.bottom)/2;
 const width=naturalWidth*nextScale/3,height=naturalHeight*nextScale/5;
 const x=slot.x+(naturalWidth/2-visibleCx)*nextScale/3;
 const y=slot.y+(naturalHeight/2-visibleCy)*nextScale/5;
 if(![width,height,x,y].every(Number.isFinite)||width<=0||height<=0)
  return fallback;
 return Object.freeze({x,y,width,height});
}

/** Inspect transparency on an already decoded data-PNG in an offline canvas.
 * Never infer a mask from a JPEG (including fake white backgrounds) or fetch
 * external URLs. Any failure silently retains existing geometrical contain.
 * The low-resolution alpha sample is used ONLY for placement, not for masking.
 */
export function measureTransparentGarmentBounds(image,doc=document){
 const src=typeof image?.currentSrc==='string'&&image.currentSrc
  ?image.currentSrc:image?.src;
 if(typeof src!=='string'||!src.startsWith('data:image/png;base64,')||
    !image.complete||!Number.isFinite(image.naturalWidth)||
    !Number.isFinite(image.naturalHeight)||image.naturalWidth<16||
    image.naturalHeight<16||image.naturalWidth*image.naturalHeight>8_000_000||
    typeof doc?.createElement!=='function')return null;
 try{
  const canvas=doc.createElement('canvas');
  if(!canvas||typeof canvas.getContext!=='function')return null;
  const scale=Math.min(1,144/Math.max(image.naturalWidth,image.naturalHeight));
  const w=Math.max(1,Math.ceil(image.naturalWidth*scale));
  const h=Math.max(1,Math.ceil(image.naturalHeight*scale));
  canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx||typeof ctx.drawImage!=='function'||typeof ctx.getImageData!=='function')return null;
  ctx.drawImage(image,0,0,w,h);
  const pixels=ctx.getImageData(0,0,w,h).data;
  if(pixels.length!==w*h*4)return null;
  let left=w,right=-1,top=h,bottom=-1,visible=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   if(pixels[(y*w+x)*4+3]<40)continue;
   left=Math.min(left,x);right=Math.max(right,x);
   top=Math.min(top,y);bottom=Math.max(bottom,y);visible++;
  }
  if(visible/w/h<.035||right<left||bottom<top)return null;
  return Object.freeze({
   left:left/w*image.naturalWidth,
   right:(right+1)/w*image.naturalWidth,
   top:top/h*image.naturalHeight,
   bottom:(bottom+1)/h*image.naturalHeight
  });
 }catch{return null;}
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
 // Smaller, separated hands and slight finger contours, not large mittens.
 part('left-hand','M91 328 Q86 333 84 343 L83 355 Q84 360 92 365 Q97 369 100 360 L106 346 L109 339 Z',skin);
 part('right-hand','M269 328 Q274 333 276 343 L277 355 Q276 360 268 365 Q263 369 260 360 L254 346 L251 339 Z',skin);
 const detail=(name,d,stroke='#ad897a',width=1.45)=>svg.append(node('path',{
  'data-part':name,d,fill:'none',stroke,'stroke-width':width,
  'stroke-linecap':'round','stroke-linejoin':'round'
 }));
 detail('left-fingers','M88 354 L94 358 M91 348 L98 352 M95 344 L102 348');
 detail('right-fingers','M272 354 L266 358 M269 348 L262 352 M265 344 L258 348');
 // Waist/hip anatomy and connected chest prevent artificial disconnected pieces.
 part('torso','M146 125 Q160 121 180 122 Q200 121 214 125 L231 144 Q239 165 230 196 L218 256 Q211 279 214 310 Q213 328 197 337 Q180 343 163 337 Q147 328 146 310 Q149 279 142 256 L130 196 Q121 165 129 144 Z',skin);
 part('neck','M163 104 L162 129 Q180 143 198 129 L197 104 Z',shade);
 // Neutral, non-user-specific face details. No real facial likeness,
 // hairstyle inference or body metrics. Maintain the same 360x600 anchors.
 svg.append(node('ellipse',{'data-part':'left-ear',cx:146,cy:82,rx:5.5,ry:10,fill:skin,stroke:edge,'stroke-width':1}));
 svg.append(node('ellipse',{'data-part':'right-ear',cx:214,cy:82,rx:5.5,ry:10,fill:skin,stroke:edge,'stroke-width':1}));
 // Chin and cheek taper improve the mannequin's featureless oval while
 // remaining underneath all caller-reviewed, source-backed clothing photos.
 part('head','M180 28 C199 28 210 40 214 58 Q216 75 209 94 Q206 107 194 116 Q180 125 166 116 Q154 107 151 94 Q144 75 146 58 C150 40 161 28 180 28 Z');
 detail('face-hairline','M152 54 Q169 43 179 48 Q196 42 208 54',shade,1.2);
 detail('left-brow','M159 69 Q165 65 172 68','#94776a',1.9);
 detail('right-brow','M188 68 Q195 65 201 69','#94776a',1.9);
 detail('left-eyelid','M159 80 Q165 82 172 80','#745d55',1.7);
 detail('right-eyelid','M188 80 Q195 82 201 80','#745d55',1.7);
 svg.append(node('ellipse',{'data-part':'left-eye',cx:166,cy:79.7,rx:1.85,ry:2.25,fill:'#57463e'}));
 svg.append(node('ellipse',{'data-part':'right-eye',cx:194,cy:79.7,rx:1.85,ry:2.25,fill:'#57463e'}));
 detail('nose','M180 79 Q178 86 178 91 Q180 94 183 92','#a88a7e',1.7);
 detail('mouth','M171 103 Q179 106 188 103','#a67e75',1.8);
 detail('chin','M174 113 Q180 115 186 113','#c7a898',1.1);
 detail('left-inner-ear','M143 80 Q146 77 147 84','#b49383',1.05);
 detail('right-inner-ear','M217 80 Q214 77 213 84','#b49383',1.05);
 detail('collarbone','M163 133 Q174 138 180 138 Q186 138 197 133',highlight,1.9);
 detail('shoulder-highlight','M137 150 Q155 141 165 147 M195 147 Q206 141 223 150',highlight,3);
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
  const bounds=measureTransparentGarmentBounds(image,document);
  const fit=bounds
   ?fitVisibleAlphaBoundsToSlot(layer,image.naturalWidth,image.naturalHeight,bounds)
   :fitPhotoLayerToSlot(layer,image.naturalWidth,image.naturalHeight);
  const el=image.cloneNode(false);
  el.alt='';
  el.dataset.slot=layer.slot;
  Object.assign(el.style,{position:'absolute',left:(fit.x*100)+'%',top:(fit.y*100)+'%',width:(fit.width*100)+'%',height:(fit.height*100)+'%',transform:'translate(-50%,-50%)',objectFit:'contain',pointerEvents:'none'});
  frame.append(el);
 }
 container.replaceChildren(frame);
 return layers.length;
}
