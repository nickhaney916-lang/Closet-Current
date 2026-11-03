/** BOARD-LOSSLESS-02 original-page opt-in research editor.
 * Not imported by public/app.js, public/outfit-board.js or production HTML.
 * Native original board stays untouched. Research UI gives honest 2D originals;
 * PR541 donor 3D may be attached by a separate authorized research loader.
 */
import {createExistingBoard02IO} from './existing-idb-cas.mjs';
import {createLosslessBoard02,BOARD02} from './lossless-board.mjs';
const element=(doc,tag,text)=>{const e=doc.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
export async function mountLosslessBoard02Research({doc=document,auth=window.closetAuth,
 native3DDecision=null}={}){
 if(new URLSearchParams(doc.defaultView.location.search).get('boardLossless02')!=='research')
  throw Error('BOARD02 explicit research opt-in missing (production OFF)');
 if(!doc.getElementById('appShell')||!auth?.ready||typeof auth.getSessionGeneration!=='function')
  throw Error('BOARD02 original application page and attested owner generation required');
 const io=createExistingBoard02IO(auth),editor=createLosslessBoard02({auth,io});
 const win=doc.defaultView,section=element(doc,'section');
 section.id='boardLossless02Research';section.setAttribute('aria-label','Research-only lossless outfit editor');
 section.style.cssText='color:#25382f;position:relative;margin:12px;padding:12px;border:2px dashed #64776c;border-radius:10px;background:#f6faf7;max-width:100%;font:14px system-ui';
 section.innerHTML='<h2 style="font-size:18px;margin:0 0 8px">Saved outfits · lossless research (HOLD)</h2>';
 const p=element(doc,'p','Research disabled in production. No automatic changes. Original garments and missing IDs are retained.');section.append(p);
 const status=element(doc,'p','Loading existing private wardrobe…');status.id='boardLossless02Status';status.setAttribute('role','status');section.append(status);
 const buttons=element(doc,'div');buttons.style.cssText='display:flex;flex-wrap:wrap;gap:6px';
 const button=(text,fn,id)=>{const b=element(doc,'button',text);b.type='button';b.id='board02'+id;
  b.style.cssText='padding:8px;min-height:40px;border-radius:6px';
  b.addEventListener('click',()=>run(fn));buttons.append(b);return b;};
 const list=element(doc,'select');list.id='board02Saved';list.style.cssText='min-width:120px;max-width:100%;padding:10px';section.append(list);
 const name=element(doc,'input');name.id='board02Name';name.placeholder='Outfit name';name.maxLength=80;name.style.cssText='padding:9px;max-width:100%';section.append(name);
 section.append(buttons);
 const photo=element(doc,'div');photo.id='board02Preview';photo.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-top:8px';
 section.append(photo);
 const lines=element(doc,'div');lines.id='board02Rows';section.append(lines);
 doc.getElementById('appShell').prepend(section);
 let available=[],disposed=false,mounted=false,editingId=null,saveSerial=0;
 const tell=t=>{status.textContent=t;};
 function clearSensitive(){photo.replaceChildren();lines.replaceChildren();name.value='';available=[];editingId=null;}
 async function readOwnerItems(){
  const lease={authenticated:true,ownerId:auth.user?.id,generation:auth.getSessionGeneration()};
  return (await io.read(lease)).items;
 }
 async function refresh(){
  const receipt=await editor.refresh();available=await readOwnerItems();
  editingId=null;list.replaceChildren();
  const opt=element(doc,'option','Choose a saved outfit…');opt.value='';list.append(opt);
  for(const record of editor.list()){const option=element(doc,'option',record.name+' · '+record.id);option.value=record.id;list.append(option);}
  name.value='';photo.replaceChildren();lines.replaceChildren();tell('Read-only: '+receipt.savedCount+' saved outfits, original source records unchanged.');
  mounted=true;return receipt;
 }
 function show(){
  const view=editor.inspect();editingId=view.id;name.value=view.name;
  photo.replaceChildren();lines.replaceChildren();
  for(const entry of view.entries){
   const box=element(doc,'article');box.style.cssText='border:1px solid #bcc8c0;padding:6px;border-radius:5px';
   box.append(element(doc,'b',entry.slot+' · '+entry.status));
   box.append(element(doc,'p',entry.itemId));
   const item=available.find(x=>x.id===entry.itemId);
   const src=item?.originalPhoto?.image||item?.image;
   if(typeof src==='string'&&/^data:image\/jpeg;base64,/.test(src)){
    const image=element(doc,'img');image.src=src;image.alt='Actual saved original clothing photo · '+entry.itemId;
    image.style.cssText='max-width:100%;height:90px;object-fit:contain';box.append(image);
   }
   if(entry.status!=='PRESENT')box.append(element(doc,'p',entry.reason));
   photo.append(box);
  }
  for(const row of view.entries){
   const wrap=element(doc,'label',row.slot+'  ');
   const select=element(doc,'select');
   select.setAttribute('aria-label','Replace '+row.slot);
   let choices=[{id:row.itemId,name:'Keep original ID ('+row.itemId+')'},{id:'',name:'Remove this slot only'}];
   choices.push(...available.filter(x=>x.id!==row.itemId&&x.category).map(x=>({id:x.id,name:x.name||x.itemType||x.id})));
   for(const value of choices){const opt=element(doc,'option',value.name);opt.value=value.id;select.append(opt);}
   select.value=row.itemId;
   select.addEventListener('change',()=>run(async()=>{editor.setSlot(row.slot,select.value||null);show();tell('Edited draft only. Original save unchanged until Save changes.');}));
   wrap.append(select);lines.append(wrap);
  }
  tell('Saved IDs retained · '+view.missing.length+' missing · '+view.review.length+' review · '+(view.dirty?'unsaved edits':'read-only open')+'.');
  return view;
 }
 const run=async fn=>{try{if(disposed)return;await fn();}catch(e){tell('No overwrite: '+String(e.message||e));}};
 list.addEventListener('change',()=>run(async()=>{if(!list.value)return;editor.open(list.value);show();}));
 name.addEventListener('change',()=>run(async()=>{editor.editName(name.value);show();tell('Name changed in draft, not saved.');}));
 button('Save changes',async()=>{const receipt=await editor.save();await refresh();list.value=receipt.id;editor.open(receipt.id);show();tell('Saved original outfit '+receipt.id+'; other outfits preserved.');},'Save');
 button('Save as new',async()=>{const receipt=await editor.save({asNew:true});await refresh();list.value=receipt.id;editor.open(receipt.id);show();tell('Saved separate new outfit '+receipt.id+'; original retained.');},'SaveNew');
 button('Cancel edit',async()=>{editor.cancel();show();tell('Canceled: no IndexedDB writes were performed.');},'Cancel');
 button('Reload unchanged storage',refresh,'Reload');
 button('Delete with confirmation',async()=>{
  const id=editingId;
  if(!id||!win.confirm('Permanently delete only saved outfit '+id+'? Original clothing photos remain in closet.'))return;
  await editor.remove({confirmedId:id});await refresh();tell('Confirmed outfit deletion · original wardrobe unchanged.');
 },'Delete');
 button('Pin shoe choice',async()=>{editor.pin('shoes');show();tell('Shoe choice pinned in draft.');},'PinShoes');
 button('Unpin shoe choice',async()=>{editor.pin('shoes',false);show();tell('Shoe choice unpinned.');},'UnpinShoes');
 button('Check verified 3D plan',async()=>{
  // Actual original JPEG bytes and current owner epoch are verified by the
  // editor immediately before any donor-3D source capability decision.
  const plan=await editor.toVerified3DPlan();
  const result=typeof native3DDecision==='function'?native3DDecision(plan):
   {mode:'none',fallbackIds:plan.selected.map(x=>x.itemId)};
  tell('3D source decision '+result.mode+' · '+(result.fallbackIds?.length||0)+' photo-only; no fabricated clothing mesh.');
 },'3D');
 const onRevoke=()=>{clearSensitive();editor.invalidate();tell('Account or session changed; private research preview cleared.');};
 win.addEventListener('closet:alpha-session-changed',onRevoke);
 win.addEventListener('pagehide',onRevoke);
 await refresh();
 return Object.freeze({editor,refresh,show,section,dispose(){
  if(disposed)return;disposed=true;onRevoke();editor.dispose();section.remove();
  win.removeEventListener('closet:alpha-session-changed',onRevoke);
  win.removeEventListener('pagehide',onRevoke);
 },researchOnly:true,releaseAuthorized:false});
}
