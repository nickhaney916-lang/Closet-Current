/**
 * OUTFIT-3D-01 opt-in UI, mounted on the actual signed-in Closet Current page.
 * Private records stay in the user's existing IndexedDB; originals remain JPEG.
 * Never automatically reconstruct unsupported photographed garments as 3D.
 */
import {createOwnerOutfit3DController} from './owner-outfit-controller.mjs';
import {createExistingClosetOutfitIO} from './saved-outfit-idb.mjs';
import {decideOutfit3D01,loadVettedOutfit3D01Sources,createSourceTrueOutfit3D01Viewer} from './source-true-viewer.mjs';
const fields=[
 ['top','Top or dress'],['bottom','Pants, shorts or skirt'],
 ['layer','Shirt or cardigan'],['layer2','Jacket'],['layer3','Coat'],
 ['shoes','Shoes'],['bag','Bag'],['accessory','Accessory'],['finish','Finishing piece']
];
export async function mountOutfit3D01Research({doc=document,auth=window.closetAuth}={}){
 if(!doc.getElementById('closet')||!auth?.ready||!auth?.getSessionGeneration||
   doc.getElementById('outfit3D01Launch'))throw Error('Existing private My Closet and session required');
 await auth.ready;
 const control=createOwnerOutfit3DController({auth,...createExistingClosetOutfitIO(auth)});
 const el=(tag,id,text)=>{const node=doc.createElement(tag);if(id)node.id=id;
  if(text!==undefined)node.textContent=text;return node;};
 const launch=el('button','outfit3D01Launch','Dress saved clothes on 3D figure · research');
 launch.type='button';launch.className='secondary';
 doc.getElementById('closet').prepend(launch);
 const style=el('style','outfit3D01CSS');
 style.textContent=[
 '.cc3d-dialog{color:#1d342b;border:0;border-radius:13px;padding:0;width:min(980px,100vw);max-width:100vw;max-height:96dvh;background:#f6f7f4;overflow:hidden}',
 '.cc3d-dialog::backdrop{background:#0009}',
 '.cc3d-dialog *{box-sizing:border-box}',
 '.cc3d-header{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#fff;padding:9px 12px}',
 '.cc3d-header h2{font-size:17px;margin:0}',
 '.cc3d-body{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:10px;padding:8px;overflow:auto;max-height:calc(96dvh - 62px)}',
 '.cc3d-viewer{min-width:0;background:#e8ece7;border-radius:9px}',
 '.cc3d-viewer canvas{display:block;width:100%;height:min(62dvh,610px);min-height:310px;touch-action:none}',
 '.cc3d-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;padding:5px}',
 '.cc3d-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}',
 '.cc3d-field{font-size:12px;display:flex;flex-direction:column;gap:3px;min-width:0}',
 '.cc3d-field select,.cc3d-field input{width:100%;font-size:16px;min-width:0;background:white}',
 '.cc3d-dialog button,.cc3d-dialog select,.cc3d-dialog input{font:inherit;min-height:44px;border:1px solid #a9b6b1;border-radius:7px;padding:6px;min-width:0}',
 '.cc3d-dialog button{cursor:pointer;background:white}',
 '.cc3d-controls button{font-size:12px}',
 '.cc3d-operations{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;margin:8px 0}',
 '.cc3d-note{font-size:12px;overflow-wrap:anywhere;line-height:1.4}',
 '.cc3d-status{font-size:13px;background:white;padding:8px;margin:5px 0;border-radius:7px;min-height:42px}',
 '.cc3d-evidence{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}',
 '.cc3d-photo{padding:5px;background:white;border:1px solid #d1d9d3;border-radius:7px;min-width:0}',
 '.cc3d-photo img{width:100%;height:98px;object-fit:contain;display:block}',
 '.cc3d-photo p{font-size:11px;margin:3px 0;overflow-wrap:anywhere}',
 '@media(max-width:640px){.cc3d-dialog{width:100vw;max-height:97dvh;border-radius:8px}.cc3d-body{display:flex;flex-direction:column;max-height:calc(97dvh - 60px);padding:5px;gap:4px}.cc3d-viewer canvas{height:38dvh;min-height:220px;max-height:390px}.cc3d-fields{gap:5px}.cc3d-photo img{height:78px}}'
 ].join('\n');
 doc.head.append(style);
 const dialog=el('dialog','outfit3D01Dialog');dialog.className='cc3d-dialog';
 const header=el('div');header.className='cc3d-header';
 header.append(el('h2',null,'My Closet → Dress 3D humanoid'));
 const close=el('button','outfit3D01Close','Close');header.append(close);dialog.append(header);
 const body=el('div');body.className='cc3d-body';
 const left=el('div');left.className='cc3d-viewer';
 const canvas=el('canvas','outfit3D01Canvas');canvas.setAttribute('aria-label','Rotatable 163 bone anatomical figure');left.append(canvas);
 const views=el('div');views.className='cc3d-controls';
 for(const [id,label]of [['Front','Front'],['Side','Side'],['Back','Back'],['Rotate','Rotate']]){
  views.append(el('button','outfit3D01'+id,label));
 }
 left.append(views);body.append(left);
 const right=el('section');
 const status=el('p','outfit3D01Status','Checking private saved wardrobe…');status.className='cc3d-status';
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');right.append(status);
 const label=(title,input)=>{
  const container=el('label');container.className='cc3d-field';container.append(el('span',null,title),input);return container;
 };
 const model=el('select','outfit3D01Model');
 for(const kind of ['female','male']){const option=el('option',null,kind==='female'?'Female':'Male');option.value=kind;model.append(option);}
 right.append(label('Anatomical figure',model));
 const name=el('input','outfit3D01Name');name.maxLength=80;name.value='My outfit';
 right.append(label('Outfit name',name));
 const picks=el('div');picks.className='cc3d-fields';
 const selects=new Map();
 for(const [slot,title]of fields){const select=el('select','outfit3D01Slot-'+slot);
  select.setAttribute('aria-label',title);selects.set(slot,select);picks.append(label(title,select));}
 right.append(picks);
 const ops=el('div');ops.className='cc3d-operations';
 for(const [id,title]of [['Save','Save outfit'],['SaveNew','Save as new outfit'],['Clear','Clear outfit'],['Refresh','Reload wardrobe'],['Delete','Delete saved outfit']]){
  ops.append(el('button','outfit3D01'+id,title));
 }
 right.append(ops);
 const saved=el('select','outfit3D01Saved');
 right.append(label('Reopen saved outfit',saved));
 const note=el('p','outfit3D01Note');note.className='cc3d-note';right.append(note);
 const cards=el('div','outfit3D01Photos');cards.className='cc3d-evidence';right.append(cards);
 const hold=el('p',null,'RESEARCH · Family Alpha HOLD. Any piece without an independently source-verified 3D mesh is shown only as its saved original photograph. Rear views do not have verified rear photography. Browser simulation is not real phone approval.');
 hold.className='cc3d-note';right.append(hold);
 body.append(right);dialog.append(body);doc.body.append(dialog);
 const putStatus=s=>{status.textContent=s;};
 let scene=null,sources=null,presenter=null,ready=false,shown=false,dead=false,lock=Promise.resolve(),loadSerial=0,rendered=null,modelLoads=0;
 function current(){return control.checkCurrentSession();}
 function clearPrivate(){
  loadSerial++;ready=false;shown=false;rendered=null;
  try{presenter?.dispose();}catch{}
  try{scene?.stop();}catch{}
  try{sources?.dispose();}catch{}
  presenter=null;scene=null;sources=null;
  control.invalidate();cards.replaceChildren();
  for(const x of selects.values())x.replaceChildren();
  saved.replaceChildren();putStatus('Signed out. No private wardrobe or outfit can be displayed.');
  if(dialog.open)dialog.close();
 }
 const run=fn=>{const work=lock.catch(()=>{}).then(fn);
  lock=work.catch(e=>{putStatus('Action not saved: '+String(e.message||e));});return work;};
 function syncSelections(){
  const plan=control.plan();
  for(const [slot,picker]of selects){
   const value=plan.slots[slot]||'',options=control.available(slot);
   picker.replaceChildren();
   const blank=el('option',null,'— None —');blank.value='';picker.append(blank);
   for(const item of options){const opt=el('option',null,control.labelFor(item.id)+' · '+item.itemType);
    opt.value=item.id;picker.append(opt);}
   if(value&&!options.some(x=>x.id===value)){
    const missing=el('option',null,'⚠ Missing or needs review');missing.value=value;picker.append(missing);
   }
   picker.value=value;
   picker.disabled=plan.dress&&['bottom','layer'].includes(slot);
  }
  name.value=plan.name;
  const previous=saved.value,boardList=control.listSaved();saved.replaceChildren();
  const blank=el('option',null,'Choose a saved outfit…');blank.value='';saved.append(blank);
  for(const board of boardList){const opt=el('option',null,board.name+' ('+board.selectedCount+' pieces)');opt.value=board.id;saved.append(opt);}
  saved.value=boardList.some(x=>x.id===previous)?previous:'';
  doc.getElementById('outfit3D01Delete').disabled=!saved.value;
 }
 function showOriginals(plan){
  cards.replaceChildren();const decision=decideOutfit3D01(plan);
  for(const entry of plan.selected){
   const item=el('article');item.className='cc3d-photo';
   const photo=control.photoFor(entry.itemId);
   if(photo){const img=el('img');img.src=photo.display;img.alt='Actual saved item: '+control.labelFor(entry.itemId);item.append(img);}
   item.append(el('p',null,control.labelFor(entry.itemId)+' · '+entry.slot),
    el('p',null,decision.renderedIds.includes(entry.itemId)?'Source-verified 3D plus original photo':'Original-photo/2D reference'));
   cards.append(item);
  }
  for(const x of [...plan.missing,...plan.needsReview]){
   const item=el('article');item.className='cc3d-photo';
   item.append(el('p',null,'⚠ '+x.slot+': '+x.reason));cards.append(item);
  }
  note.textContent=decision.renderedIds.length+' verified mesh-capable piece(s), '+
   decision.fallbackIds.length+' photo-only piece(s), '+
   (plan.missing.length+plan.needsReview.length)+' missing/review piece(s).';
  return decision;
 }
 function update(){
  const plan=control.plan(),decision=showOriginals(plan);
  syncSelections();rendered=decision;
  if(!ready||!presenter){putStatus('Private wardrobe ready; verifying 3D. Original photographs remain available.');return;}
  try{
   const actual=presenter.present(plan);rendered=actual;
   putStatus(actual.actualMode==='none'?'No verified 3D fit for these items; original photographs retained.':
    actual.partial3D?'Partial anatomical 3D, with unsupported garments in the photo cards.':
    'Original photographed fabrics on 163-bone 3D · visual quality REVIEW.');
  }catch(e){
   presenter.clear();rendered={...decision,error:String(e.message||e)};
   putStatus('Original photo/2D fallback: '+String(e.message||e));
  }
 }
 async function ensure3D(){
  if(dead||!shown)return;
  const token=++loadSerial,lease=current(),still=()=>{
   const now=current();if(token!==loadSerial||now.ownerId!==lease.ownerId||now.generation!==lease.generation)
    throw Error('Stale account source load');
  };
  putStatus('Loading actual photographed source candidates and anatomical rig…');
  try{
   // Import maps must precede the first Three.js dynamic module resolution.
   if(!doc.querySelector('script[data-outfit3d-importmap]')){
    const map=el('script');map.type='importmap';map.dataset.outfit3dImportmap='true';
    map.textContent=JSON.stringify({imports:{three:'/node_modules/three/build/three.module.js',
     'three/addons/':'/node_modules/three/examples/jsm/'}});doc.head.append(map);
   }
   const probe=doc.createElement('canvas').getContext('webgl2');
   if(!probe)throw Error('WebGL2 unavailable');probe.getExtension('WEBGL_lose_context')?.loseContext();
   sources=await loadVettedOutfit3D01Sources();still();
   const [{mountAnatomicalShowroom},{createPoseContact}]=await Promise.all([
    import('../dress-mobile-01/dress-mobile-showroom.mjs'),import('../three-d-42/posed-contact.mjs')
   ]);still();
   scene=mountAnatomicalShowroom(canvas,{
    premiumTurntable67:true,independentGarments:true,poseContactFactory:createPoseContact,
    crispSourcePhotoClarity:true,jeansPanelFall:true,tailoredShoulderSleeves:true,
    independentShoulderCaps:true,realisticShoulderContour:true,upperArmFabricVolume:true,
    sourceNeutralCollarRoll:true,rearShirtFabricRelief:true,naturalShoulderSleeveTransition:true,
    sourceMeasuredSleeveHang:true,anatomicalShirtSideFlow:true,naturalShoulderFall61:true,
    trueShoulderTop64:true,poseConditionedSleeveDrape:true,
    photoDenimRearDrape73:true,photoDenimCalfHang74:true,photoDenimFolds75:true,
    photoDenimContinuity76:true,photoDenimContactAudit77:true,photoDenimKneePose78:true,
    dressMobile74:true
   });
   scene.start();
   const loaded=await scene.load(model.value);still();
   if(!loaded||scene.getState().stats?.bones!==163)throw Error('Original CC0 163-bone rig unavailable');
   scene.applyOutfit('none');modelLoads++;
   presenter=createSourceTrueOutfit3D01Viewer({viewer:scene,controller:control,sources});
   await presenter.ready();still();ready=true;update();
  }catch(e){
   if(token!==loadSerial)return;
   presenter?.dispose();presenter=null;scene?.stop();scene=null;
   sources?.dispose();sources=null;ready=false;
   putStatus('Original-photo/2D fallback: '+String(e.message||e));
  }
 }
 async function open(){
  if(dead||dialog.open)return;
  shown=true;dialog.showModal();
  try{await control.refresh();update();await ensure3D();}
  catch(e){clearPrivate();putStatus('Could not load signed-in saved wardrobe: '+String(e.message||e));}
 }
 launch.onclick=()=>open();
 close.onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{
  if(dead)return;shown=false;loadSerial++;
  presenter?.dispose();presenter=null;scene?.stop();scene=null;sources?.dispose();sources=null;
  control.invalidate();cards.replaceChildren();ready=false;rendered=null;
 });
 for(const [slot,picker]of selects)picker.onchange=()=>run(()=>{control.setSlot(slot,picker.value||null);update();});
 name.onchange=()=>run(()=>{control.setName(name.value);update();});
 doc.getElementById('outfit3D01Save').onclick=()=>run(async()=>{
  control.setName(name.value);const result=await control.save();update();
  saved.value=result.id;doc.getElementById('outfit3D01Delete').disabled=false;
  putStatus('Outfit saved with actual wardrobe IDs. Select it again to reopen.');
 });
 doc.getElementById('outfit3D01SaveNew').onclick=()=>run(async()=>{
  control.setName(name.value);const result=await control.save({asNew:true});update();
  saved.value=result.id;doc.getElementById('outfit3D01Delete').disabled=false;
  putStatus('New outfit saved separately. Earlier saved outfits are preserved.');
 });
 doc.getElementById('outfit3D01Clear').onclick=()=>run(()=>{control.clearSelection();update();});
 doc.getElementById('outfit3D01Refresh').onclick=()=>run(async()=>{await control.refresh();update();});
 saved.onchange=()=>run(()=>{
  if(!saved.value)return;const id=saved.value;
  control.openSaved(id);update();saved.value=id;
  doc.getElementById('outfit3D01Delete').disabled=false;
 });
 doc.getElementById('outfit3D01Delete').onclick=()=>run(async()=>{
  if(!saved.value)throw Error('Choose an existing saved outfit to remove');
  await control.deleteSaved(saved.value);update();putStatus('Saved outfit deleted. Original garments unchanged.');
 });
 model.onchange=()=>run(async()=>{
  if(!scene||!ready)return;
  const token=++loadSerial;ready=false;
  const result=await scene.load(model.value);
  if(token!==loadSerial)return;current();
  if(!result||scene.getState().stats?.bones!==163)throw Error('Anatomical figure reload failed');
  modelLoads++;scene.applyOutfit('none');presenter.clear();ready=true;update();
 });
 for(const kind of ['Front','Side','Back']){
  doc.getElementById('outfit3D01'+kind).onclick=()=>{
   try{current();if(ready)scene[kind.toLowerCase()]();}catch{clearPrivate();}
  };
 }
 doc.getElementById('outfit3D01Rotate').onclick=()=>{
  try{current();if(ready)scene.setSpin(true);}catch{clearPrivate();}
 };
 const change=()=>clearPrivate();
 window.addEventListener('closet:alpha-session-changed',change);
 window.addEventListener('pagehide',change);
 return Object.freeze({open,controller:control,state(){
  if(!shown||!auth.user?.id)return {ready:false,privateVisible:false};
  try{
   current();
   const view=scene?.getState()||{},p=control.plan();
   return {ready:true,privateVisible:dialog.open,viewerReady:ready,
    selected:p.slots,missing:p.missing.length,needsReview:p.needsReview.length,
    sourceDecision:rendered?.mode||'none',fallbackCount:rendered?.fallbackIds?.length||0,
    viewerMode:view.outfit?.mode||'none',meshCount:view.outfit?.garmentMeshes||0,
    bones:view.stats?.bones||0,figure:view.kind||null,
    geometries:view.geometries||0,textures:view.textures||0,frames:view.frames||0,
    modelLoads,savedCount:control.listSaved().length,
    renderCalls:presenter?.stats().renderCalls||0,reusedCalls:presenter?.stats().reuseCalls||0,
    sourceFrontOnly:true,productionDeployed:false,familyAlpha:'HOLD',physicalPhonesApproved:false};
  }catch{return {ready:false,privateVisible:false};}
 },destroy(){
  if(dead)return;dead=true;clearPrivate();launch.remove();dialog.remove();style.remove();
  window.removeEventListener('closet:alpha-session-changed',change);
  window.removeEventListener('pagehide',change);
 }});
}
