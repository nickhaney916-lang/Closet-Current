/**
 * MULTI-GARMENT-CAPTURE-01 — actual native Add Clothes panel, research gated.
 * No detected garment enters the wardrobe until a user confirms each category,
 * subtype and color and one owner-bound IDB transaction commits the selection.
 */
import {atomicSaveGarments24,validCrop24,pieceKey24,duplicatePieceKeys24} from './atomic-group.mjs';
const TYPES=['Tops','Bottoms','Dresses','Outerwear','Shoes'];
const palette=['Black','White','Gray','Beige','Brown','Blue','Green','Red','Pink','Purple','Yellow','Orange','Multicolor'];
const $=(root,id)=>root.getElementById(id);
const el=(tag,txt,cls)=>{const n=document.createElement(tag);if(txt)n.textContent=txt;if(cls)n.className=cls;return n;};
const button=(txt,run,cls='secondary')=>{const n=el('button',txt,cls);n.type='button';n.onclick=run;return n;};
function ensureImage(data){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=data;});}
function jpegCrop(image,rect){
 const width=image.naturalWidth,height=image.naturalHeight;
 const c=document.createElement('canvas'),sx=Math.max(0,Math.floor(rect.x*width)),sy=Math.max(0,Math.floor(rect.y*height));
 const sw=Math.max(1,Math.min(width-sx,Math.ceil(rect.width*width))),sh=Math.max(1,Math.min(height-sy,Math.ceil(rect.height*height)));
 c.width=sw;c.height=sh;c.getContext('2d').drawImage(image,sx,sy,sw,sh,0,0,sw,sh);
 return c.toDataURL('image/jpeg',.94);
}
function normalizeRect(rect){
 const x=Math.max(0,Math.min(.974,Number(rect?.x)||0)),y=Math.max(0,Math.min(.974,Number(rect?.y)||0));
 return {x,y,width:Math.min(1-x,Math.max(.026,Number(rect?.width)||1-x)),height:Math.min(1-y,Math.max(.026,Number(rect?.height)||1-y))};
}
function manualKey(b){return 'manual-'+[b.x,b.y,b.width,b.height].map(v=>Math.round(v*1000)).join('-');}
export function mountMultiGarmentCapture24({
 doc=document,getOwner,makeProof,getDb,queued,refreshNative,onSaved,
 recognitionAssetVersion='',schema,active
}){
 if(!active||!getOwner()||!schema?.types)return {active:false};
 const host=$ (doc,'wholeOutfitCapture');
 if(!host)return {active:false};
 const style=el('style');style.textContent=`
 .multi24{margin-top:1rem;display:grid;gap:.85rem;min-width:0}
 .multi24 .multi24-source{max-width:100%;max-height:260px;object-fit:contain;border-radius:9px}
 .multi24 .multi24-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:.75rem}
 .multi24 .multi24-card{border:1px solid #d4d8d1;padding:.8rem;border-radius:10px;min-width:0}
 .multi24 .multi24-card img{display:block;max-width:100%;width:100%;height:150px;object-fit:contain}
 .multi24 label{display:grid;gap:.25rem;margin:.4rem 0;min-width:0}
 .multi24 input:not([type=checkbox]),.multi24 select{width:100%;max-width:100%;min-height:44px}
 .multi24 button{min-height:48px;margin:.15rem;white-space:normal}
 .multi24 .multi24-actions{display:flex;flex-wrap:wrap;gap:.35rem}
 .multi24 .multi24-status{overflow-wrap:anywhere}
 @media(max-width:350px){.multi24 .multi24-actions button{flex:1 1 100%}}
 `;
 const root=el('section',null,'multi24');root.id='multi24Research';
 root.append(el('h3','Review pieces together'),el('p','Original unchanged. Confirm each visible piece before adding it. Unseen backs, overlapping fabric and 3D fit are not inferred.','fine'));
 const original=el('img',null,'multi24-source');original.alt='Exact original multi-garment JPEG';original.hidden=true;root.append(original);
 const status=el('p','Choose a photo to separate visible garments.','multi24-status');status.id='multi24Status';status.setAttribute('role','status');root.append(status);
 const grid=el('div',null,'multi24-grid');grid.id='multi24Grid';
 const actions=el('div',null,'multi24-actions');
 let state=null,canceled=false,job=null,renderVersion=0,submitting=false;
 const cancel=button('Cancel extraction',()=>reset('Unfinished extraction canceled; nothing was saved.'));
 const add=button('Add missed piece',()=>{if(!state)return;const crop={x:0,y:0,width:1,height:1};state.pieces.push({id:crypto.randomUUID(),instanceKey:manualKey(crop),cropBounds:crop,image:state.proof.image,manual:true,cropReviewed:false,category:'Uncategorized',itemType:'Unknown',color:'',confirmed:false,maskApplied:false,hint:null});redraw();});
 const save=button('Save confirmed pieces together',()=>commit(),'primary');
 actions.append(add,save,cancel);
 root.append(actions,grid);
 host.append(style,root);
 function sameOwner(){return !!state&&getOwner()===state.owner&&getDb()?.name==='closet-current-user-'+state.owner;}
 function revoke(){canceled=true;renderVersion++;job?.worker?.terminate();if(job)clearTimeout(job.timeout);job=null;state=null;original.removeAttribute('src');original.hidden=true;grid.replaceChildren();save.disabled=true;add.disabled=true;}
 function reset(text){revoke();status.textContent=text||'No unconfirmed photos were saved.';}
 async function crop(piece){
  if(!sameOwner()){reset('Account changed; extraction canceled.');return;}
  try{
   await window.openPhotoCrop({...piece,originalPhoto:state.proof.originalPhoto},{
    analyze:async()=>null,
    save:async photo=>{
     if(!sameOwner())throw Error('Session changed');
     if(!validCrop24(photo.cropBounds))throw Error('Invalid crop');
     piece.image=photo.image;piece.cropBounds={...photo.cropBounds};piece.maskApplied=!!photo.maskApplied;
     piece.cropReviewed=true;if(piece.manual)piece.instanceKey=manualKey(piece.cropBounds);
     piece.confirmed=false;redraw();
    }
   });
  }catch{status.textContent='Crop editor unavailable. The original photograph was not changed.';}
 }
 function input(label,value,change){const wrap=el('label',label),box=el('input');box.type='text';box.value=value||'';box.maxLength=120;box.oninput=()=>change(box.value);wrap.append(box);return wrap;}
 function selector(label,options,value,change){const wrap=el('label',label),sel=el('select');for(const v of options){const option=el('option',v);option.value=v;sel.append(option);}sel.value=options.includes(value)?value:options[0];sel.onchange=()=>change(sel.value);wrap.append(sel);return wrap;}
 function redraw(){
  if(!state)return;grid.replaceChildren();
  original.hidden=false;add.disabled=false;
  for(const [i,p]of state.pieces.entries()){
   const card=el('article',null,'multi24-card');card.dataset.pieceKey=p.instanceKey;
   const image=el('img');image.src=p.image;image.alt='Visible garment '+(i+1)+' derived from unchanged source';
   const caption=el('p',(p.manual?'Manually marked':'Detected')+' piece '+(i+1)+(p.hint?.clipped?' · edge cut off':'')+(p.hint?.confidence?' · mask confidence '+Math.round(100*p.hint.confidence)+'%':'')+' · requires review','fine');
   card.append(image,caption);
   card.append(selector('Main category',['Uncategorized',...TYPES],p.category,v=>{p.category=v;p.itemType='Unknown';p.confirmed=false;redraw();}));
   card.append(selector('Specific type',['Unknown',...(schema.types[p.category]||[])],p.itemType,v=>{p.itemType=v;p.confirmed=false;redraw();}));
   const colorLabel=input('Color (confirm visually)',p.color,v=>{p.color=v.trim();p.confirmed=false;save.disabled=true;});
   const colorInput=colorLabel.querySelector('input');colorInput.setAttribute('list','multi24Colors');
   const list=el('datalist');list.id='multi24Colors'+i;colorInput.setAttribute('list',list.id);
   for(const value of palette){const opt=el('option');opt.value=value;list.append(opt);}
   card.append(colorLabel,list);
   const confirmLabel=el('label'),confirmBox=el('input');confirmBox.type='checkbox';confirmBox.checked=!!p.confirmed;
   confirmBox.onchange=()=>{p.confirmed=confirmBox.checked;save.disabled=!state.pieces.some(x=>x.confirmed);};
   confirmLabel.append(confirmBox,doc.createTextNode('I confirm this visible garment, category and color'));card.append(confirmLabel);
   const controls=el('div',null,'multi24-actions'),edit=button('Adjust crop/mask',()=>crop(p));
   const remove=button('Remove detection',()=>{state.pieces.splice(state.pieces.indexOf(p),1);redraw();});
   controls.append(edit,remove);card.append(controls);
   grid.append(card);
  }
  save.disabled=!state.pieces.some(p=>p.confirmed)||submitting;
 }
 async function addDetected(raw,session){
  if(!state||session!==job||!sameOwner())return;
  if(!raw?.instanceKey||!/^seg-[0-9-]+$/.test(raw.instanceKey)||!validCrop24(raw.cropBounds)||
    !Array.isArray(raw.hint?.categories)||!raw.hint.categories.some(x=>TYPES.includes(x)))return;
  if(state.pieces.some(x=>x.instanceKey===raw.instanceKey))return;
  const sourceImage=state.decoded,box=normalizeRect(raw.cropBounds);
  const unique=raw.hint.categories.filter(x=>TYPES.includes(x));
  const category=unique.length===1?unique[0]:'Uncategorized';
  state.pieces.push({
   id:crypto.randomUUID(),instanceKey:raw.instanceKey,cropBounds:box,
   image:jpegCrop(sourceImage,box),manual:false,cropReviewed:true,
   category,itemType:'Unknown',color:raw.colorEstimate?.color||'',confirmed:false,
   hint:{...raw.hint},maskApplied:false
  });redraw();
 }
 async function startFile(file){
  if(submitting){status.textContent='Finish the current save first.';return;}
  revoke();canceled=false;
  const owner=getOwner();if(!owner){status.textContent='Sign in before extracting garments.';return;}
  if(!file||file.size>10*1024*1024){status.textContent='Choose a photo no larger than 10 MB.';return;}
  status.textContent='Verifying full-resolution original JPEG…';
  try{
   const proof=await makeProof(file,owner);
   if(canceled||getOwner()!==owner)return reset('Account changed; nothing saved.');
   const decoded=await ensureImage(proof.image);
   if(canceled||getOwner()!==owner)return reset('Account changed; nothing saved.');
   state={owner,proof,decoded,pieces:[]};original.src=proof.image;original.hidden=false;redraw();
   let inference=proof.image;
   if(Math.max(decoded.naturalWidth,decoded.naturalHeight)>3072){
    const scale=3072/Math.max(decoded.naturalWidth,decoded.naturalHeight);
    const c=el('canvas');c.width=Math.round(decoded.naturalWidth*scale);c.height=Math.round(decoded.naturalHeight*scale);
    c.getContext('2d').drawImage(decoded,0,0,c.width,c.height);inference=c.toDataURL('image/jpeg',.9);
   }
   const next={id:crypto.randomUUID(),worker:null,pending:[],timeout:null};job=next;
   next.timeout=setTimeout(()=>{if(job===next){next.worker?.terminate();job=null;status.textContent='Local segmentation timed out. You can mark pieces manually; nothing was auto-saved.';}},300000);
   next.worker=new Worker('outfit-worker.mjs'+(recognitionAssetVersion?'?v='+recognitionAssetVersion:''),{type:'module'});
   next.worker.onmessage=event=>{
    if(job!==next||!sameOwner())return;
    const data=event.data;if(data?.id!==next.id)return;
    if(data.type==='piece')next.pending.push(addDetected(data.piece,next));
    if(data.type==='progress')status.textContent=data.phase==='separating'?'Locating visible garment regions locally…':'Preparing local segmentation model…';
    if(data.type==='done'||data.type==='error'){
     Promise.all(next.pending).finally(()=>{
      if(job!==next)return;
      clearTimeout(next.timeout);next.worker.terminate();job=null;
      status.textContent=data.type==='error'?'Automatic extraction unavailable. Add and crop pieces manually; no items saved.':
       state.pieces.length+' possible visible garment'+(state.pieces.length===1?'':'s')+' found. Confirm each; use Add missed piece if necessary.';
     });
    }
   };
   next.worker.onerror=()=>{if(job!==next)return;clearTimeout(next.timeout);next.worker.terminate();job=null;status.textContent='Local detection unavailable. Manually add and crop pieces; nothing saved.';};
   next.worker.postMessage({id:next.id,image:inference,multi24:true});
  }catch(error){reset('Could not verify photo: '+String(error.message||error));}
 }
 async function commit(){
  if(submitting||!state||!sameOwner())return reset('Account changed. No garments saved.');
  const selected=state.pieces.filter(x=>x.confirmed);
  if(!selected.length)return status.textContent='Select at least one reviewed garment.';
  try{
   const invalid=selected.find(x=>!TYPES.includes(x.category)||!x.color?.trim()||x.color==='Unknown'||
    (x.manual&&!x.cropReviewed)||!validCrop24(x.cropBounds));
   if(invalid)throw Error('Confirm category and color, and adjust crops for manually added items.');
   const duplicates=duplicatePieceKeys24(
    await new Promise((resolve,reject)=>{const r=getDb().transaction('items').objectStore('items').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);}),
    selected.map(x=>({sourcePieceKey:pieceKey24(state.proof.sourceSHA256,x.instanceKey)}))
   );
   if(duplicates.length)throw Error('Previously saved garment detected in this exact source. Deselect duplicate pieces.');
   submitting=true;save.disabled=true;status.textContent='Verifying original SHA-256 and saving all confirmed pieces atomically…';
   const owner=state.owner,proof=state.proof,rows=await queued(()=>atomicSaveGarments24({
    db:getDb(),proof,pieces:selected,ownerId:owner,currentOwner:getOwner
   }));
   if(getOwner()!==owner){reset('Account switched. Prior owner records stay private; reload to check.');return;}
   await onSaved(rows);await refreshNative();
   status.textContent=rows.length+' separately confirmed garments saved together. Each retains the exact original SHA-256.';
   state.pieces=state.pieces.filter(x=>!selected.includes(x));redraw();
  }catch(error){status.textContent='Save rejected; no newly selected batch pieces added. '+String(error.message||error);}
  finally{submitting=false;if(state)redraw();}
 }
 const handle=event=>{const file=event.target.files?.[0];event.target.value='';if(file)startFile(file);};
 for(const id of ['outfitCamera','outfitUpload'])$(doc,id).onchange=handle;
 window.addEventListener('closet:alpha-session-changed',()=>reset('Session changed; unconfirmed clothes cleared.'));
 window.addEventListener('pagehide',()=>revoke());
 save.disabled=true;add.disabled=true;
 return {active:true,startFile,reset,debug:()=>({owner:state?.owner,sourceSHA256:state?.proof?.sourceSHA256,pieces:state?.pieces.map(x=>({id:x.id,instanceKey:x.instanceKey,category:x.category,color:x.color,confirmed:x.confirmed}))||[],working:!!job})};
}
