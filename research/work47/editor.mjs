import {paintGarmentFit} from './fit.mjs';
/** Mount ONLY after upstream saved-photo ownership, source hashes and explicit
 * mask review. No caller can use this helper to authenticate/approve a cutout.
 * All geometry is ephemeral; guarded source changes discard the preview. */
export function mountLandmarkEditor(container,{isActive=()=>false,sessionTarget=window}={}){
 const frame=container.querySelector('.family-alpha-avatar');
 const images=frame?[...frame.querySelectorAll('img[data-slot]')].filter(x=>/^(top|bottom|dress|layer[23]?)$/.test(x.dataset.slot)&&x.complete&&x.naturalWidth>15&&x.src.startsWith('data:image/png;base64,')):[];
 if(!images.length||!isActive())return {mounted:false,dispose(){}};
 const doc=container.ownerDocument,make=(tag,text)=>{const n=doc.createElement(tag);if(text)n.textContent=text;return n;};
 const panel=make('section');panel.className='w47-controls';panel.style.cssText='padding:12px;margin:12px 0;background:#fff;color:#213b37;border:1px solid #9eaaa4;border-radius:10px';
 const title=make('h3','Fit the reviewed garment'),hint=make('p','Mark the left and right shoulder seams, or waistband corners for bottoms. The photographed garment moves as a whole; hidden fabric cannot be recovered. Fit is temporary.'),select=make('select'),canvas=make('canvas'),status=make('p','Mark two source landmarks.'),apply=make('button','Apply landmark fit'),reset=make('button','Reset landmark fit');
 select.setAttribute('aria-label','Reviewed garment to fit');select.style.cssText='width:100%;min-height:48px';for(const im of images){const o=make('option',im.dataset.slot);o.value=im.dataset.slot;select.append(o);}
 canvas.style.cssText='display:block;width:100%;height:auto;touch-action:none;background:#e9e9e9';canvas.setAttribute('aria-label','Mark left and right garment landmarks');status.setAttribute('role','status');
 const buttons=make('div');buttons.style.cssText='display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px';
 panel.append(title,hint,select,canvas,apply,reset,buttons,status);container.append(panel);
 let points=[],disposed=false;const records=new Map(),oldPanels=[...container.querySelectorAll('.alpha36-fit-controls')];
 const active=()=>{try{return !disposed&&container.contains(frame)&&container.contains(panel)&&isActive()===true;}catch{return false;}};
 const current=()=>images.find(x=>x.dataset.slot===select.value);
 function check(){if(active())return true;dispose(false);return false;}
 function drawSource(){if(!check())return;points=[];const im=current(),ctx=canvas.getContext('2d');canvas.width=480;canvas.height=Math.round(480*im.naturalHeight/im.naturalWidth);ctx.drawImage(im,0,0,canvas.width,canvas.height);apply.disabled=true;status.textContent='Mark left, then right garment landmark.';}
 function redraw(record){if(!check())return;paintGarmentFit(record.canvas,record.source,record.profile,record.adjust);current().hidden=true;for(const p of oldPanels)p.hidden=true;}
 canvas.onpointerup=e=>{if(!e.isTrusted||!check()||points.length>=2)return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;if(x<0||x>1||y<0||y>1)return;points.push([x,y]);const ctx=canvas.getContext('2d');ctx.fillStyle='#ce2248';ctx.beginPath();ctx.arc(x*canvas.width,y*canvas.height,6,0,Math.PI*2);ctx.fill();apply.disabled=points.length!==2;status.textContent=points.length===1?'Mark the right landmark.':'Two points marked; apply to inspect fit.';};
 apply.onclick=()=>{if(!check()||points.length!==2)return;const source=current(),slot=source.dataset.slot.startsWith('layer')?'layer':source.dataset.slot;const output=make('canvas');output.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';output.dataset.work47=source.dataset.slot;const record={source,canvas:output,profile:{slot,anchors:points.map(x=>[...x])},adjust:{dx:0,dy:0,scale:1}};try{paintGarmentFit(output,source,record.profile);if(!check())return;records.get(select.value)?.canvas.remove();source.after(output);records.set(select.value,record);source.hidden=true;for(const p of oldPanels)p.hidden=true;status.textContent='Landmark preview; compare shoulders, hem and print. Review required.';}catch{status.textContent='Those landmarks cannot fit safely. Mark the garment again.';}};
 reset.onclick=()=>{if(!check())return;const r=records.get(select.value);r?.canvas.remove();records.delete(select.value);current().hidden=false;if(!records.size)for(const p of oldPanels)p.hidden=false;drawSource();};
 for(const [label,change]of [['← Left',a=>a.dx-=3],['↑ Up',a=>a.dy-=4],['→ Right',a=>a.dx+=3],['− Smaller',a=>a.scale-=.025],['↓ Down',a=>a.dy+=4],['+ Larger',a=>a.scale+=.025]]){const b=make('button',label);b.onclick=()=>{if(!check())return;const r=records.get(select.value);if(!r)return;const prev={...r.adjust};change(r.adjust);try{redraw(r);}catch{r.adjust=prev;status.textContent='Adjustment limit reached.';}};buttons.append(b);}
 for(const b of panel.querySelectorAll('button')){b.type='button';b.style.cssText='min-height:48px;font:inherit;border:1px solid #9eaaa4;background:#eff5f1;border-radius:8px;color:#213b37';}
 select.onchange=drawSource;
 function dispose(restore=active()){if(disposed)return;disposed=true;canvas.onpointerup=null;apply.onclick=null;reset.onclick=null;select.onchange=null;for(const r of records.values()){r.canvas.remove();if(restore)r.source.hidden=false;}records.clear();if(restore)for(const p of oldPanels)p.hidden=false;sessionTarget.removeEventListener('pagehide',clear);sessionTarget.removeEventListener('closet:alpha-session-changed',clear);panel.remove();}
 const clear=()=>dispose(false);sessionTarget.addEventListener('pagehide',clear);sessionTarget.addEventListener('closet:alpha-session-changed',clear);drawSource();return {mounted:true,dispose};
}
