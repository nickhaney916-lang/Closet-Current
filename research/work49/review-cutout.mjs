import {applyReviewedEraser,hasTwoClearlySeparatedFootwearComponents} from './mask-controls.mjs';
/**
 * Deliberate human mask touch-up, not AI segmentation. Nothing is stored or
 * uploaded. The user sees original JPEG side-by-side with the *actual edited*
 * transparent PNG before giving explicit consent. Existing session/abort guards
 * remain active and the provider independently reapplies the same strokes.
 */
export function confirmReviewedCutoutWithEraser(container,detail,{isActive=()=>true,signal}={}){
 const base=detail?.maskFrame;
 if(!container||typeof container.replaceChildren!=='function'||
    typeof detail?.originalImage!=='string'||!detail.originalImage.startsWith('data:image/jpeg;base64,')||
    !base||!detail?.transparentImage||typeof isActive!=='function'||
    signal?.aborted||!isActive())return Promise.resolve(false);
 return new Promise(resolve=>{
  const doc=container.ownerDocument||document;
  const create=(tag,text)=>{const el=doc.createElement(tag);if(text)el.textContent=text;return el;};
  const panel=create('section');panel.className='family-alpha-mask-editor';
  panel.setAttribute('aria-label','Review and clean photographed garment cutout');
  const title=create('h2','Remove unwanted mannequin or background');
  title.style.cssText='font:600 1.2rem/1.3 system-ui;margin:6px 0';
  const hint=create('p','Compare the original photo. Tap small unwanted spots to erase, or use Outline unwanted area to trace a mannequin neck along the INSIDE of the clothing collar. Never remove fabric; use Undo or Retake if uncertain.');
  hint.style.cssText='font:1rem/1.4 system-ui';
  const two=create('div');two.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px';
  const a=create('figure'),b=create('figure');a.style.cssText=b.style.cssText='margin:0;min-width:0';
  const original=create('img');original.src=detail.originalImage;original.alt='Retained original photograph';
  original.style.cssText='display:block;width:100%;height:auto;max-height:360px;object-fit:contain;border:1px solid #888';
  const canvas=create('canvas');canvas.width=base.width;canvas.height=base.height;
  canvas.setAttribute('aria-label','Transparent cutout — tap unwanted areas to erase');
  canvas.style.cssText='width:100%;height:auto;max-height:360px;object-fit:contain;display:block;border:1px solid #555;touch-action:none;cursor:crosshair;background-color:#e5e7eb;background-image:linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%);background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0';
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx){resolve(false);return;}
  const ca=create('figcaption','Original photo'),cb=create('figcaption','Edited transparent cutout (tap to erase)');
  a.append(original,ca);const viewport=create('div');viewport.style.cssText='max-height:420px;overflow:auto';viewport.append(canvas);b.append(viewport,cb);two.append(a,b);
  const controls=create('div');controls.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin:12px 0';
  const button=(text,primary=false)=>{const btn=create('button',text);btn.type='button';btn.style.cssText='min-height:48px;padding:9px 14px;border-radius:10px;font:600 1rem system-ui;cursor:pointer;border:1px solid #555;'+(primary?'background:#4f3488;color:#fff':'background:#fff;color:#111');return btn;};
  const undo=button('Undo eraser'),redo=button('Redo edit'),reset=button('Reset cutout');
  const mode=create('select');mode.setAttribute('aria-label','Cutout refinement tool');for(const [value,label]of [['remove','Remove unwanted region'],['restore','Restore initial cutout'],['add','Add visible source fabric'],['soften','Soften selected edge'],['connected','Local background wand']]){const o=create('option',label);o.value=value;mode.append(o);}mode.style.cssText='min-height:48px;width:100%;font:inherit';
  const size=create('input');size.type='range';size.min='.002';size.max='.08';size.step='.002';size.value='.014';size.setAttribute('aria-label','Refinement brush size');size.style.cssText='width:100%;min-height:48px';
  const zoom=create('select');zoom.setAttribute('aria-label','Cutout edit zoom');for(const z of [1,2,4]){const o=create('option',z+'× zoom');o.value=z;zoom.append(o);}zoom.onchange=()=>{canvas.style.width=(100*Number(zoom.value))+'%';canvas.style.maxHeight=Number(zoom.value)>1?'none':'360px';};const panLabel=create('label','Pan zoomed view'),pan=create('input');pan.type='checkbox';panLabel.prepend(pan);pan.onchange=()=>canvas.style.touchAction=pan.checked?'pan-x pan-y':'none';controls.append(zoom,panLabel);
  const notice=create('p','Add reveals source pixels only inside this crop. Check the original: never paint over a person or restore hidden fabric. The wand affects only a small area around your tap.');controls.append(mode,size,notice);
  const outline=button('Outline unwanted area'),applyOutline=button('Apply outline');
  applyOutline.disabled=true;controls.append(outline,applyOutline);
  const count=create('span','Original cutout — no edits');count.setAttribute('role','status');controls.append(undo,redo,reset,count);
  const ackLabel=create('label');
  ackLabel.style.cssText='display:flex;align-items:start;gap:9px;font:1rem/1.45 system-ui;padding:10px 0';
  const ack=create('input');ack.type='checkbox';ack.setAttribute('aria-label','I checked the actual cutout for mannequin, person, hanger and missing fabric');
  ackLabel.append(ack,doc.createTextNode('I checked the actual cutout: no mannequin, person parts, hanger, background residue, or missing clothing. If uncertain, retake.'));
  const shoeWrap=create('label');shoeWrap.style.cssText='display:none;align-items:start;gap:9px;padding:8px 0';
  const shoes=create('input');shoes.type='checkbox';
  shoes.setAttribute('aria-label','This cutout contains two separate real shoes');
  const shoeHint=create('span','Two distinct shoes in original photo? Check only when the source actually includes BOTH shoes. Otherwise the photo is shown as a footwear reference, not worn on two feet.');
  shoeWrap.append(shoes,shoeHint);
  if(detail.category==='Shoes'){
   shoeWrap.style.display='flex';
   const evidence=hasTwoClearlySeparatedFootwearComponents(base);
   shoes.disabled=!evidence;
   if(!evidence)shoeHint.textContent='Only one distinct shoe or an ambiguous pair detected. This image will be shown as a labeled reference, never across both feet.';
  }
  const actions=create('div');actions.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px';
  const reject=button('Retake photo'),accept=button('Use cutout',true);
  actions.append(reject,accept);
  panel.append(title,hint,two,controls,ackLabel,shoeWrap,actions);
  container.replaceChildren(panel);
  const edits=[],outlinePoints=[],redoStack=[];
  let outlineMode=false,finished=false,rendered=null;
  outline.onclick=()=>{
   outlineMode=!outlineMode;
   if(!outlineMode)outlinePoints.length=0;
   outline.textContent=outlineMode?'Cancel outline':'Outline unwanted area';
   paint();
  };
  applyOutline.onclick=()=>{
   if(!outlineMode||outlinePoints.length<3||edits.length>=40)return;
   ack.checked=false;redoStack.length=0;edits.push({action:mode.value,kind:'polygon',points:outlinePoints.map(p=>({...p}))});
   outlinePoints.length=0;outlineMode=false;
   outline.textContent='Outline unwanted area';
   paint();
  };
  function paint(){
   if(signal?.aborted||!isActive()){onAbort();return;}
   try{
    rendered=applyReviewedEraser(base,edits);
    const pixels=ctx.createImageData(base.width,base.height);
    pixels.data.set(rendered.rgba);ctx.putImageData(pixels,0,0);
    if(outlineMode&&outlinePoints.length){
     ctx.save();ctx.strokeStyle='#f04438';ctx.lineWidth=Math.max(2,base.width/240);
     ctx.beginPath();
     outlinePoints.forEach((point,i)=>{
      const x=point.x*base.width,y=point.y*base.height;
      if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
     });
     if(outlinePoints.length>=3)ctx.closePath();
     ctx.stroke();ctx.restore();
    }
    count.textContent=outlineMode
     ?'Outline mode: tap 3-24 points around unwanted mannequin, then Apply outline ('+outlinePoints.length+' points)'
     :edits.length?edits.length+' mask edits; retained '+Math.round(rendered.visiblePixels/rendered.originalVisiblePixels*100)+'%':'Original cutout — no edits';
    applyOutline.disabled=!outlineMode||outlinePoints.length<3;
    if(detail.category==='Shoes'){
     shoes.disabled=!hasTwoClearlySeparatedFootwearComponents(rendered);
     if(shoes.disabled)shoes.checked=false;
    }
    undo.disabled=!edits.length&&!outlinePoints.length;redo.disabled=!redoStack.length;accept.disabled=outlineMode&&outlinePoints.length>0;
   }catch(err){
    rendered=null;accept.disabled=true;count.textContent='Too much removed or invalid mask. Undo or reset; otherwise retake.';
   }
  }
  function onTap(event){
   if(!event.isTrusted||pan.checked||signal?.aborted||!isActive()||finished)return;
   const rect=canvas.getBoundingClientRect();
   if(rect.width<=0||rect.height<=0)return;
   const scale=Math.min(rect.width/base.width,rect.height/base.height),displayW=base.width*scale,displayH=base.height*scale;const x=(event.clientX-rect.left-(rect.width-displayW)/2)/displayW,y=(event.clientY-rect.top-(rect.height-displayH)/2)/displayH;
   if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>1||y<0||y>1)return;
   if(outlineMode){
    if(outlinePoints.length>=24)return;
    outlinePoints.push({x,y});paint();return;
   }
   if(edits.length>=40)return;
   ack.checked=false;redoStack.length=0;edits.push({action:mode.value,x,y,radius:Number(size.value),...(mode.value==='connected'?{tolerance:12}:{})});paint();
  }
  function done(value){
   if(finished)return;finished=true;
   canvas.removeEventListener('pointerup',onTap);
   reject.removeEventListener('click',onReject);accept.removeEventListener('click',onConfirm);
   undo.removeEventListener('click',onUndo);reset.removeEventListener('click',onReset);
   outline.onclick=null;applyOutline.onclick=null;redo.onclick=null;zoom.onchange=null;pan.onchange=null;
   signal?.removeEventListener('abort',onAbort);
   (doc.defaultView||globalThis.window)?.removeEventListener?.('pagehide',onAbort);
   container.replaceChildren();resolve(value);
  }
  function onConfirm(e){
   if(!e.isTrusted||!isActive()||!ack.checked||!rendered||outlineMode&&outlinePoints.length)return;
   done(Object.freeze({approved:true,eraseStrokes:edits.map(p=>Object.freeze({...p})),
    requestedFootwearPair:detail.category==='Shoes'&&shoes.checked&&!shoes.disabled,
    explicitlyReviewed:true}));
  }
  function onReject(){done(false);}
  function onUndo(){
   if(outlineMode&&outlinePoints.length)outlinePoints.pop();
   else if(edits.length)redoStack.push(edits.pop());ack.checked=false;
   paint();
  }
  function onReset(){
   edits.length=0;redoStack.length=0;outlinePoints.length=0;outlineMode=false;ack.checked=false;
   outline.textContent='Outline unwanted area';paint();
  }
  function onAbort(){done(false);}
  canvas.addEventListener('pointerup',onTap);
  redo.onclick=()=>{if(!isActive()||signal?.aborted||!redoStack.length)return;edits.push(redoStack.pop());ack.checked=false;paint();};undo.addEventListener('click',onUndo);
  reset.addEventListener('click',onReset);
  reject.addEventListener('click',onReject);
  accept.addEventListener('click',onConfirm);
  signal?.addEventListener('abort',onAbort,{once:true});
  (doc.defaultView||globalThis.window)?.addEventListener?.('pagehide',onAbort,{once:true});
  paint();
  if(signal?.aborted||!isActive())done(false);
 });
}
