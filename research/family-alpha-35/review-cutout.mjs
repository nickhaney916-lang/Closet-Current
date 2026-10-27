import {applyReviewedEraser,hasTwoClearlySeparatedFootwearComponents} from './reviewed-mask-controls.mjs';
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
  const hint=create('p','Compare the original photo. Tap only leftover mannequin, hanger, skin, or background on the cutout to erase it. Never erase fabric; tap Undo if uncertain.');
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
  a.append(original,ca);b.append(canvas,cb);two.append(a,b);
  const controls=create('div');controls.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin:12px 0';
  const button=(text,primary=false)=>{const btn=create('button',text);btn.type='button';btn.style.cssText='min-height:48px;padding:9px 14px;border-radius:10px;font:600 1rem system-ui;cursor:pointer;border:1px solid #555;'+(primary?'background:#4f3488;color:#fff':'background:#fff;color:#111');return btn;};
  const undo=button('Undo eraser'),reset=button('Reset cutout');
  const count=create('span','No eraser changes');count.setAttribute('role','status');controls.append(undo,reset,count);
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
  const edits=[];
  let finished=false,rendered=null;
  function paint(){
   try{
    rendered=applyReviewedEraser(base,edits);
    const pixels=ctx.createImageData(base.width,base.height);
    pixels.data.set(rendered.rgba);ctx.putImageData(pixels,0,0);
    count.textContent=edits.length?edits.length+' erase marks; remaining garment '+Math.round(rendered.visiblePixels/rendered.originalVisiblePixels*100)+'%':'No eraser changes';
    accept.disabled=false;
   }catch(err){
    rendered=null;accept.disabled=true;count.textContent='Too much removed or invalid mask. Undo or reset; otherwise retake.';
   }
  }
  function onTap(event){
   if(!event.isTrusted||signal?.aborted||!isActive()||finished)return;
   const rect=canvas.getBoundingClientRect();
   if(rect.width<=0||rect.height<=0)return;
   const x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height;
   if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>1||y<0||y>1)return;
   if(edits.length>=40)return;
   edits.push({x,y,radius:.043});
   paint();
  }
  function done(value){
   if(finished)return;finished=true;
   canvas.removeEventListener('pointerup',onTap);
   reject.removeEventListener('click',onReject);accept.removeEventListener('click',onConfirm);
   undo.removeEventListener('click',onUndo);reset.removeEventListener('click',onReset);
   signal?.removeEventListener('abort',onAbort);
   (doc.defaultView||globalThis.window)?.removeEventListener?.('pagehide',onAbort);
   container.replaceChildren();resolve(value);
  }
  function onConfirm(e){
   if(!e.isTrusted||!isActive()||!ack.checked||!rendered)return;
   done(Object.freeze({approved:true,eraseStrokes:edits.map(p=>Object.freeze({...p})),
    requestedFootwearPair:detail.category==='Shoes'&&shoes.checked&&!shoes.disabled,
    explicitlyReviewed:true}));
  }
  function onReject(){done(false);}
  function onUndo(){edits.pop();paint();}
  function onReset(){edits.length=0;paint();}
  function onAbort(){done(false);}
  canvas.addEventListener('pointerup',onTap);
  undo.addEventListener('click',onUndo);
  reset.addEventListener('click',onReset);
  reject.addEventListener('click',onReject);
  accept.addEventListener('click',onConfirm);
  signal?.addEventListener('abort',onAbort,{once:true});
  (doc.defaultView||globalThis.window)?.addEventListener?.('pagehide',onAbort,{once:true});
  paint();
  if(signal?.aborted||!isActive())done(false);
 });
}
