import {mountRigidFitControls} from '../work48/controls.mjs';
import {panelsFromSleeves,validateSleeveOutline} from '../work48/panel-geometry.mjs';
import {protectCollarPixels} from '../work48/collar-occlusion.mjs';
import {paintGarmentFit} from './fit.mjs';
import {createPortableFitRecipe,restorePortableFitRecipe} from './portable-fit.mjs';
import {repaintReviewedPreviewAtomic} from './atomic-preview.mjs';
import {createHumanoidForegroundOverlay} from './occlusion.mjs';
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
 const edgeLabel=make('label',' Soften translucent cutout halo (preview only; review fine fabric edges)'),edgeToggle=make('input');edgeToggle.type='checkbox';edgeToggle.disabled=true;edgeLabel.prepend(edgeToggle);edgeLabel.style.cssText='display:flex;align-items:center;gap:8px;min-height:48px';
 const binaryLabel=make('label',' Smooth hard cutout outline (preview only; may thin fine fabric edges)'),binaryToggle=make('input');binaryToggle.type='checkbox';binaryToggle.disabled=true;binaryLabel.prepend(binaryToggle);binaryLabel.style.cssText=edgeLabel.style.cssText;
 select.setAttribute('aria-label','Reviewed garment to fit');select.style.cssText='width:100%;min-height:48px';for(const im of images){const o=make('option',im.dataset.slot);o.value=im.dataset.slot;select.append(o);}
 canvas.style.cssText='display:block;width:100%;height:auto;touch-action:none;background:#e9e9e9';canvas.setAttribute('aria-label','Mark left and right garment landmarks');status.setAttribute('role','status');
 const fitDownload=make('button','Download fit adjustments'),fitUploadLabel=make('label','Restore fit adjustments JSON'),fitUpload=make('input');fitUpload.type='file';fitUpload.accept='.json,application/json';fitUpload.setAttribute('aria-label','Restore fit adjustments JSON');fitUploadLabel.append(fitUpload);
 const fitTransfer=make('div');fitTransfer.style.cssText='display:grid;gap:8px;margin:10px 0';fitTransfer.append(fitDownload,fitUploadLabel);
 const buttons=make('div');buttons.style.cssText='display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px';
 panel.append(title,hint,select,canvas,edgeLabel,binaryLabel,apply,reset,fitTransfer,buttons,status);container.append(panel);
 let points=[],disposed=false,foreground=null,traceSide=null,tracePoints=[];const observer=new MutationObserver(()=>{if(!container.isConnected||!container.contains(frame)||!container.contains(panel))dispose(false);});observer.observe(doc.documentElement,{childList:true,subtree:true});const records=new Map(),oldPanels=[...container.querySelectorAll('.alpha36-fit-controls')];
 const active=()=>{try{return !disposed&&container.isConnected&&container.contains(frame)&&container.contains(panel)&&isActive()===true;}catch{return false;}};
 const current=()=>images.find(x=>x.dataset.slot===select.value);
 function check(){if(active())return true;dispose(false);return false;}
 const slides=mountRigidFitControls(panel,{getRecord:()=>records.get(select.value),redraw,isActive:active,onError:e=>{status.textContent=e.message;}});
 const tracing=make('div'),traceLeft=make('button','Trace left sleeve'),traceRight=make('button','Trace right sleeve'),useTrace=make('button','Use sleeve outline'),cancelTrace=make('button','Cancel sleeve outline');tracing.append(traceLeft,traceRight,useTrace,cancelTrace);panel.insertBefore(tracing,buttons);useTrace.disabled=true;
 function startTrace(side){if(!check()||!records.has(select.value))return;traceSide=side;tracePoints=[];useTrace.disabled=true;const im=current();canvas.getContext('2d').drawImage(im,0,0,canvas.width,canvas.height);status.textContent='Trace '+side+' sleeve: begin at shoulder attachment, follow the outside and cuff, and finish at the underarm. Use 3–16 points; do not include torso fabric.';}
 traceLeft.onclick=()=>startTrace('left');traceRight.onclick=()=>startTrace('right');cancelTrace.onclick=()=>{traceSide=null;tracePoints=[];drawSource();};
 useTrace.onclick=()=>{if(!check()||!traceSide)return;const r=records.get(select.value);if(!r)return;const oldProfile=r.profile,oldTraces=r.traces;try{const traces={...(r.traces||{}),[traceSide]:validateSleeveOutline(tracePoints)};r.profile={...r.profile,panels:panelsFromSleeves(traces),exclusivePanels:true};redraw(r);r.traces=traces;traceSide=null;tracePoints=[];slides.sync();status.textContent='Rigid sleeve outline applied. Adjust its angle; reduce the angle if the attachment separates.';}catch(e){r.profile=oldProfile;r.traces=oldTraces;status.textContent=e.message;}};
 function drawSource(){if(!check())return;points=[];traceSide=null;tracePoints=[];slides.sync();const im=current(),ctx=canvas.getContext('2d');canvas.width=480;canvas.height=Math.round(480*im.naturalHeight/im.naturalWidth);ctx.drawImage(im,0,0,canvas.width,canvas.height);apply.disabled=true;edgeToggle.checked=records.get(select.value)?.adjust.edgeCleanup===true;edgeToggle.disabled=!records.has(select.value);binaryToggle.checked=records.get(select.value)?.adjust.binaryEdgeReview===true;binaryToggle.disabled=!records.has(select.value);status.textContent='Mark left, then right garment landmark.';}
 const sourceBinding=r=>({png:r.source.currentSrc||r.source.src,slot:r.source.dataset.slot,
  width:r.source.naturalWidth,height:r.source.naturalHeight});
 const isSame=(r,key)=>active()&&records.get(select.value)===r&&
   current()===r.source&&sourceBinding(r).png===key;
 fitDownload.onclick=async event=>{
  if(!event.isTrusted||!check())return;
  const r=records.get(select.value);if(!r){status.textContent='Fit the reviewed garment before exporting adjustments.';return;}
  const binding=sourceBinding(r);
  try{
   const recipe=await createPortableFitRecipe(binding,r);
   if(!isSame(r,binding.png))return;
   const url=URL.createObjectURL(new Blob([JSON.stringify(recipe,null,2)],{type:'application/json'}));
   const anchor=make('a');anchor.href=url;anchor.download='closet-current-fit-adjustments.json';
   anchor.click();queueMicrotask(()=>URL.revokeObjectURL(url));
   status.textContent='Local fit-only recipe downloaded. It is not an approved cutout or saved outfit.';
  }catch{if(active())status.textContent='Fit recipe unavailable; your current preview is unchanged.';}
 };
 fitUpload.onchange=async()=>{
  if(!check())return;
  const file=fitUpload.files?.[0];fitUpload.value='';
  const r=records.get(select.value);
  if(!r||!file||file.size>9800||file.size<100){
   status.textContent='Apply a reviewed garment fit and choose a small local fit recipe JSON file.';return;
  }
  const binding=sourceBinding(r);
  try{
   const content=await file.text();if(!isSame(r,binding.png))return;
   const restored=await restorePortableFitRecipe(binding,content);
   if(!isSame(r,binding.png))return;
   const before={profile:r.profile,adjust:r.adjust,traces:r.traces};
   r.profile=restored.profile;r.adjust=restored.adjust;r.traces=restored.traces;
   try{
    redraw(r);slides.sync();edgeToggle.checked=r.adjust.edgeCleanup===true;
    binaryToggle.checked=r.adjust.binaryEdgeReview===true;
    status.textContent='Fit geometry restored for this exact reviewed cutout. Inspect sleeves and waist; no approval granted.';
   }catch{
    r.profile=before.profile;r.adjust=before.adjust;r.traces=before.traces;
    slides.sync();status.textContent='Fit import rejected by geometry safety check; previous preview preserved.';
   }
  }catch{if(active())status.textContent='Fit recipe does not match this reviewed cutout; previous preview preserved.';}
 };
 function redraw(record){if(!check())return;const result=repaintReviewedPreviewAtomic(record,{doc,render:paintGarmentFit,isCurrent:()=>active()&&records.get(select.value)===record&&current()===record.source});if(foreground)protectCollarPixels(foreground,[...records.values()].map(r=>r.canvas));current().hidden=true;for(const p of oldPanels)p.hidden=true;status.textContent=record.adjust.binaryEdgeReview
 ?(result.binaryEdge.changed?'Hard cutout edges softened on '+result.binaryEdge.changed+' pixels; review fine hems and cuffs.':'No reviewed hard-edged silhouette found; original pixels unchanged.')
 :record.adjust.edgeCleanup
 ?(result.fringe.changed?'Fringe attenuated on '+result.fringe.changed+' edge pixels; review cuffs and contours.':'No translucent border detected; original pixels remain unchanged.')
 :'Original reviewed cutout displayed; temporary fit still requires visual review.';}
 canvas.onpointerup=e=>{if(!e.isTrusted||!check()||(!traceSide&&points.length>=2))return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;if(x<0||x>1||y<0||y>1)return;if(traceSide){if(tracePoints.length>=16)return;tracePoints.push([x,y]);const ctx=canvas.getContext('2d');ctx.fillStyle='#d22553';ctx.beginPath();ctx.arc(x*canvas.width,y*canvas.height,5,0,Math.PI*2);ctx.fill();useTrace.disabled=tracePoints.length<3;status.textContent=tracePoints.length+' sleeve boundary points; finish at the underarm.';return;}points.push([x,y]);const ctx=canvas.getContext('2d');ctx.fillStyle='#ce2248';ctx.beginPath();ctx.arc(x*canvas.width,y*canvas.height,6,0,Math.PI*2);ctx.fill();apply.disabled=points.length!==2;status.textContent=points.length===1?'Mark the right landmark.':'Two points marked; apply to inspect fit.';};
 apply.onclick=()=>{if(!check()||points.length!==2)return;const source=current(),slot=source.dataset.slot.startsWith('layer')?'layer':source.dataset.slot;const output=make('canvas');output.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';output.dataset.work47=source.dataset.slot;const record={source,canvas:output,profile:{slot,anchors:points.map(x=>[...x])},adjust:{dx:0,dy:0,scale:1,edgeCleanup:false,binaryEdgeReview:false}};try{const fitting=paintGarmentFit(output,source,record.profile);if(!check())return;const anatomy=foreground?null:createHumanoidForegroundOverlay(doc);records.get(select.value)?.canvas.remove();source.after(output);records.set(select.value,record);source.hidden=true;
 if(anatomy){foreground=anatomy;frame.append(foreground);}protectCollarPixels(foreground,[...records.values()].map(r=>r.canvas));slides.sync();
 for(const p of oldPanels)p.hidden=true;edgeToggle.disabled=false;edgeToggle.checked=false;binaryToggle.disabled=false;binaryToggle.checked=false;status.textContent=fitting.cutoutIntegrity.status==='REVIEW_POSSIBLE_BACKGROUND'
 ?'Possible background remains around cutout edges. Compare source and mask before accepting any fit.'
 :'Landmark preview; compare shoulders, hem and print. Review required.';}catch(error){status.textContent=/Cutout is opaque or rectangular/.test(String(error?.message))
 ?'Cutout still looks like a solid photograph. Keep the original and remove its background before fitting.'
 :'Those landmarks cannot fit safely. Mark the garment again.';}};
 reset.onclick=()=>{if(!check())return;const r=records.get(select.value);r?.canvas.remove();records.delete(select.value);current().hidden=false;
 if(!records.size){foreground?.remove();foreground=null;for(const p of oldPanels)p.hidden=false;}edgeToggle.checked=false;edgeToggle.disabled=true;binaryToggle.checked=false;binaryToggle.disabled=true;
 slides.sync();drawSource();};
 edgeToggle.onchange=()=>{if(!check())return;const record=records.get(select.value);if(!record){edgeToggle.checked=false;return;}const prior={...record.adjust};record.adjust.edgeCleanup=edgeToggle.checked;if(edgeToggle.checked)record.adjust.binaryEdgeReview=false;try{redraw(record);binaryToggle.checked=record.adjust.binaryEdgeReview;}catch{record.adjust=prior;edgeToggle.checked=prior.edgeCleanup===true;status.textContent='Edge preview cannot be rendered; original fit remains available.';}};
 binaryToggle.onchange=()=>{if(!check())return;const record=records.get(select.value);if(!record){binaryToggle.checked=false;return;}const prior={...record.adjust};record.adjust.binaryEdgeReview=binaryToggle.checked;if(binaryToggle.checked)record.adjust.edgeCleanup=false;try{redraw(record);edgeToggle.checked=record.adjust.edgeCleanup;}catch{record.adjust=prior;binaryToggle.checked=prior.binaryEdgeReview===true;status.textContent='Hard-edge preview unavailable; original fit remains unchanged.';}};
 for(const [label,change]of [['← Left',a=>a.dx-=3],['↑ Up',a=>a.dy-=4],['→ Right',a=>a.dx+=3],['− Smaller',a=>a.scale-=.025],['↓ Down',a=>a.dy+=4],['+ Larger',a=>a.scale+=.025]]){const b=make('button',label);b.onclick=()=>{if(!check())return;const r=records.get(select.value);if(!r)return;const prev={...r.adjust};change(r.adjust);try{redraw(r);}catch{r.adjust=prev;status.textContent='Preview unchanged; adjustment could not be rendered safely.';}};buttons.append(b);}
 for(const b of panel.querySelectorAll('button')){b.type='button';b.style.cssText='min-height:48px;font:inherit;border:1px solid #9eaaa4;background:#eff5f1;border-radius:8px;color:#213b37';}
 select.onchange=drawSource;
 function dispose(restore=active()){if(disposed)return;disposed=true;observer.disconnect();slides.dispose();traceLeft.onclick=null;traceRight.onclick=null;useTrace.onclick=null;cancelTrace.onclick=null;canvas.onpointerup=null;apply.onclick=null;reset.onclick=null;select.onchange=null;edgeToggle.onchange=null;binaryToggle.onchange=null;fitDownload.onclick=null;fitUpload.onchange=null;fitUpload.value='';for(const r of records.values()){r.canvas.remove();if(restore)r.source.hidden=false;}records.clear();foreground?.remove();foreground=null;
 if(restore)for(const p of oldPanels)p.hidden=false;sessionTarget.removeEventListener('pagehide',clear);sessionTarget.removeEventListener('closet:alpha-session-changed',clear);panel.remove();}
 const clear=()=>dispose(false);sessionTarget.addEventListener('pagehide',clear);sessionTarget.addEventListener('closet:alpha-session-changed',clear);drawSource();return {mounted:true,dispose};
}
