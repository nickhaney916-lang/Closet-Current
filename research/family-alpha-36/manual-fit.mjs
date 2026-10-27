/**
 * Family Alpha preview-only garment alignment.
 *
 * A human can move / proportionally scale an independently reviewed PNG over
 * the 2D human. No fabric reconstruction, resampling, skin masking, source
 * edits, storage or network. Single-shoe photo references are NOT movable.
 */
export const FIT_LIMITS=Object.freeze({maxDx:.09,maxDy:.10,minScale:.78,maxScale:1.22});
const safe=n=>typeof n==='number'&&Number.isFinite(n);
const slots=new Set(['top','bottom','dress','layer','layer2','layer3']);
export function adjustReviewedGarmentGeometry(base,{dx=0,dy=0,scale=1}={}){
 if(!base||!['x','y','width','height'].every(k=>safe(base[k]))||
  base.width<=0||base.height<=0||base.x<=0||base.x>=1||base.y<=0||base.y>=1||
  !safe(dx)||!safe(dy)||!safe(scale)||Math.abs(dx)>FIT_LIMITS.maxDx+1e-8||
  Math.abs(dy)>FIT_LIMITS.maxDy+1e-8||
  scale<FIT_LIMITS.minScale-1e-8||scale>FIT_LIMITS.maxScale+1e-8)
  throw Error('Invalid anatomical review adjustment');
 const x=base.x+dx,y=base.y+dy,width=base.width*scale,height=base.height*scale;
 if(x-width/2<0||x+width/2>1||y-height/2<0||y+height/2>1)
  throw Error('Photo pixels would be clipped by the avatar frame');
 return Object.freeze({x,y,width,height,scale,sourcePixelsResampled:false});
}
function placement(img){
 const number=name=>{
  const v=Number.parseFloat(img.style[name]);
  if(!Number.isFinite(v)||!String(img.style[name]).endsWith('%'))
   throw Error('Unsupported reviewed garment geometry');
  return v/100;
 };
 return {x:number('left'),y:number('top'),width:number('width'),height:number('height')};
}
export function mountManualGarmentAlignment(container,{isActive=()=>true,sessionTarget=globalThis.window}={}){
 if(!container||typeof container.querySelector!=='function'||typeof isActive!=='function')
  throw Error('Live reviewed avatar container required');
 const frame=container.querySelector('.family-alpha-avatar');
 const garments=frame?[...frame.querySelectorAll('img[data-slot]')]
  .filter(img=>slots.has(img.dataset.slot)&&img.dataset.displayMode!=='footwear-photo-reference'&&
    img.complete&&img.naturalWidth>0&&/^data:image\/png;base64,/.test(img.currentSrc||img.src)):[];
 if(!frame||!garments.length||!isActive())return {mounted:false,dispose(){}};
 const doc=container.ownerDocument||document;
 const make=(tag,value)=>{
  const el=doc.createElement(tag);
  if(value)el.textContent=value;
  return el;
 };
 const panel=make('section');panel.className='alpha36-fit-controls';
 panel.setAttribute('aria-label','Adjust photographed clothing position on 2D figure');
 panel.style.cssText='padding:12px;margin:10px 0;border:1px solid #bbb;border-radius:12px;background:#fff;color:#171717;font:14px/1.5 system-ui';
 const title=make('h3','Adjust clothing position');
 title.style.cssText='margin:0 0 4px;font-size:16px';
 const explanation=make('p','Preview only. Move or size the real garment photo without stretching or changing its colors. These adjustments are not saved with the outfit.');
 explanation.style.cssText='margin:2px 0 12px';
 const picker=make('select');
 picker.setAttribute('aria-label','Garment to align');
 picker.style.cssText='width:100%;min-height:48px;font-size:16px';
 const baselines=new Map(),edits=new Map();
 for(const img of garments){
  const id=img.dataset.slot;
  baselines.set(id,placement(img));
  edits.set(id,{dx:0,dy:0,scale:1});
  const option=make('option',id==='top'?'Shirt / top':id==='bottom'?'Pants / skirt':id==='dress'?'Dress':id.startsWith('layer')?'Jacket / layer':'Garment');
  option.value=id;picker.append(option);
 }
 const buttons=make('div');buttons.style.cssText='display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0';
 const status=make('p','Choose clothing, then use arrow buttons to align its shoulders or waist.');
 status.setAttribute('role','status');status.style.cssText='margin:8px 0;color:#343434';
 const btn=(label,change)=>{
  const b=make('button',label);b.type='button';b.style.cssText='min-height:48px;min-width:0;border:1px solid #5c4e86;border-radius:9px;background:#f4efff;color:#171717;font:600 15px system-ui';
  b.onclick=()=>change();
  buttons.append(b);return b;
 };
 let disposed=false;
 function active(){
  if(disposed||!container.contains(frame)||!container.contains(panel))return false;
  try{return isActive()===true;}catch{return false;}
 }
 function redraw(){
  if(!active()){dispose();return;}
  const id=picker.value,img=garments.find(x=>x.dataset.slot===id);
  const state=edits.get(id);
  if(!img||!state)return;
  const geo=adjustReviewedGarmentGeometry(baselines.get(id),state);
  Object.assign(img.style,{left:(geo.x*100)+'%',top:(geo.y*100)+'%',
   width:(geo.width*100)+'%',height:(geo.height*100)+'%'});
  img.style.objectFit='contain';
  img.style.transform='translate(-50%,-50%)';
  status.textContent='Position adjusted for preview only. Original photo and other outfits remain unchanged.';
 }
 function update(field,delta){
  if(!active()){dispose();return;}
  const id=picker.value,current=edits.get(id);
  if(!current)return;
  const next={...current,[field]:Math.round((current[field]+delta)*1000)/1000};
  try{adjustReviewedGarmentGeometry(baselines.get(id),next);}
  catch{status.textContent='Adjustment limit reached. Keep this image inside the figure.';return;}
  edits.set(id,next);redraw();
 }
 btn('↑ Up',()=>update('dy',-.015));
 btn('↓ Down',()=>update('dy',.015));
 btn('← Left',()=>update('dx',-.012));
 btn('→ Right',()=>update('dx',.012));
 btn('− Smaller',()=>update('scale',-.04));
 btn('+ Larger',()=>update('scale',.04));
 btn('Reset',()=>{
  if(!active()){dispose();return;}
  edits.set(picker.value,{dx:0,dy:0,scale:1});redraw();
  status.textContent='Returned to original placement.';
 });
 panel.append(title,explanation,picker,buttons,status);
 container.append(panel);
 function dispose(){
  if(disposed)return;disposed=true;
  // Never attempt to keep this preview across account changes.
  panel.remove();sessionTarget?.removeEventListener?.('closet:alpha-session-changed',dispose);
  sessionTarget?.removeEventListener?.('pagehide',dispose);
 }
 sessionTarget?.addEventListener?.('closet:alpha-session-changed',dispose,{once:true});
 sessionTarget?.addEventListener?.('pagehide',dispose,{once:true});
 return {mounted:true,dispose,redraw,hasSavedAdjustments:false};
}
