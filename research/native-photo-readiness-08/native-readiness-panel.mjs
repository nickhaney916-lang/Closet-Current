/**
 * NATIVE-PHOTO-READINESS-08: read-only saved Outfit Builder photo-admission.
 * This displays original-photo integrity and conservative fitting readiness.
 * It NEVER mints a render acceptance receipt or manufactures user 3D geometry.
 * Opt-in research only. Family Alpha HOLD. Does not write IndexedDB/cloud.
 */
import {assessWardrobePhoto01} from '../user-photo-3d-01/photo-readiness.mjs';

const goodId=x=>typeof x==='string'&&x.length>0&&x.length<=180&&!/[\u0000-\u001f]/.test(x);
const slotNames=new Set(['top','bottom','layer','layer2','layer3','shoes','bag','accessory','finish']);
const safeText=(x,limit=100)=>typeof x==='string'?x.slice(0,limit):'';
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
export const NATIVE_READINESS_08=Object.freeze({
 gate:'nativeLossless04=research&native3D05=research&sourceReadiness08=research',
 originalJPEGVerifiedBeforePhotoDisplay:true,
 humanFittedReviewRequired:true,unknownSourceGeometryPhotoOnly:true,
 productionAuthorized:false,familyAlpha:'HOLD',signedRLSVerified:false
});
function readItems(db){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('items','readonly');
  const request=tx.objectStore('items').getAll();
  let values;
  request.onsuccess=()=>{values=request.result;};
  tx.oncomplete=()=>resolve(values);
  tx.onabort=()=>reject(tx.error||Error('Owner wardrobe read aborted'));
  tx.onerror=()=>reject(tx.error||Error('Owner wardrobe read failed'));
 });
}
export async function assessSavedNative08({ownerId,saved,items,assertOwner=()=>{}}={}){
 if(!goodId(ownerId)||!saved||!Array.isArray(items)||
    (saved.ownerId!==undefined&&saved.ownerId!==ownerId)||
    !saved.slots||typeof saved.slots!=='object'||Array.isArray(saved.slots))
  throw Error('READINESS08 authenticated owner saved outfit required');
 const byId=new Map();
 for(const row of items){
  if(!row||!goodId(row.id)||byId.has(row.id)||
     (row.ownerId!==undefined&&row.ownerId!==ownerId))
   throw Error('READINESS08 invalid/foreign private wardrobe; no results shown');
  byId.set(row.id,row);
 }
 const entries=[];
 for(const [slot,itemId] of Object.entries(saved.slots)){
  assertOwner();
  if(!slotNames.has(slot)||!goodId(itemId))
   throw Error('READINESS08 invalid saved outfit reference');
  const item=byId.get(itemId);
  if(!item){
   entries.push(Object.freeze({slot,itemId,status:'Missing',reason:'Original saved garment ID retained; photograph is currently missing',
    originalPhotoVerified:false,photo:null,sourceSHA256:null}));
   continue;
  }
  // Missing owner proof or source SHA fails CLOSED. Its bytes must not appear
  // in the status cards until the exact original JPEG verifies successfully.
  const result=await assessWardrobePhoto01(item,{ownerId});
  assertOwner();
  const verified=result.originalPhotoVerified===true;
  entries.push(Object.freeze({
   slot,itemId,status:result.readiness,reason:result.reason,
   originalPhotoVerified:verified,
   photo:verified?item.originalPhoto.image:null,
   sourceSHA256:verified?result.sourceSHA256:null,
   label:safeText(item.name||[item.color,item.itemType].filter(Boolean).join(' ')||'Saved piece')
  }));
 }
 assertOwner();
 return Object.freeze({entries:Object.freeze(entries),
  ready:entries.filter(x=>x.status==='3D Ready').length,
  review:entries.filter(x=>x.status==='Needs Review').length,
  photoOnly:entries.filter(x=>x.status==='Photo-Only').length,
  missing:entries.filter(x=>x.status==='Missing').length,
  noWrites:true,humanApproved:false,releaseAuthorized:false});
}
export async function mountNativeReadiness08({
 win=globalThis.window,doc=win?.document,
 board=win?.nativeLossless04Bridge,db,
 onStatus=()=>{}
}={}){
 const params=new URLSearchParams(win?.location?.search||'');
 if(params.get('sourceReadiness08')!=='research'||
    params.get('nativeLossless04')!=='research'||params.get('native3D05')!=='research'||
    !win||!doc||!board||!db||!doc.getElementById('nativeLossless04Controls')||
    !doc.getElementById('appShell')||!doc.getElementById('authGate')||
    !doc.getElementById('logout')||doc.getElementById('nativeReadiness08'))
  throw Error('READINESS08 original signed-in research controls required');
 const originalAuth=win.closetAuth;
 if(typeof originalAuth?.getAccessToken!=='function'||!goodId(originalAuth?.user?.id))
  throw Error('READINESS08 original owner session required');
 const ownerId=originalAuth.user.id;
 if(db.name!=='closet-current-user-'+ownerId)
  throw Error('READINESS08 owner-scoped IndexedDB required');
 const root=doc.createElement('section');root.id='nativeReadiness08';
 root.setAttribute('aria-label','Source-verified garment 3D readiness');
 root.className='native-readiness08';
 const button=doc.createElement('button');button.id='nativeReadiness08Check';
 button.type='button';button.className='secondary';
 button.textContent='Check photographed garments for 3D';
 const status=doc.createElement('p');status.id='nativeReadiness08Status';
 status.className='fine';status.setAttribute('role','status');
 status.textContent='Original photographs remain unchanged. Unreviewed clothing stays photo-only or needs review.';
 const grid=doc.createElement('div');grid.id='nativeReadiness08Results';
 grid.setAttribute('role','list');grid.className='native-readiness08-results';
 const style=doc.createElement('style');style.id='nativeReadiness08Styles';
 style.textContent='.native-readiness08{margin:12px 0;padding:10px;border:1px solid #bcbcc8;border-radius:10px;min-width:0}.native-readiness08 #nativeReadiness08Check{width:100%;max-width:100%;white-space:normal;min-height:44px;text-align:center}.native-readiness08-results{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:8px}.native-readiness08-item{display:flex;align-items:center;gap:9px;min-width:0;padding:9px;border:1px solid #d6d6df;border-radius:8px}.native-readiness08-item img{width:60px;height:78px;object-fit:contain;flex-shrink:0;background:#f4f4f4}.native-readiness08-item>div{min-width:0;overflow-wrap:anywhere}.native-readiness08-item p{margin:3px 0;font-size:12px}.native-readiness08-item strong{font-size:14px}';
 root.append(button,status,grid);
 doc.getElementById('nativeLossless04Controls').after(root);
 doc.head.append(style);
 let closed=false,request=0,last=null;
 const notify=s=>{status.textContent=s;onStatus(s);};
 const alive=()=>!closed&&win.closetAuth===originalAuth&&
  originalAuth.user?.id===ownerId&&db.name==='closet-current-user-'+ownerId&&
  doc.getElementById('authGate')?.hidden===true&&
  doc.getElementById('appShell')?.hidden===false&&board.status().active===true;
 const clear=(reason='Select a saved outfit to check source readiness.')=>{
  request++;last=null;grid.replaceChildren();
  if(!closed)notify(reason);
 };
 const revoke=()=>{clear('Owner session changed · private photo status cleared');button.disabled=true;};
 win.addEventListener('closet:alpha-session-changed',revoke);
 win.addEventListener('pagehide',revoke);
 doc.getElementById('logout').addEventListener('click',revoke,true);
 async function run(){
  if(!alive())throw Error('READINESS08 private session not active');
  if(board.status().dirty)throw Error('READINESS08 save or cancel unsaved outfit edits first');
  const selected=board.status().selected,stored=board.readOnlySnapshot();
  if(!Number.isInteger(selected)||selected<0||selected>=stored.saved.length)
   throw Error('READINESS08 select an existing saved outfit first');
  const saved=structuredClone(stored.saved[selected]);
  const call=++request;button.disabled=true;grid.replaceChildren();
  notify('Checking SHA-256 of your original clothing photographs locally…');
  const assertOwner=()=>{
   if(call!==request||!alive()||board.status().dirty||
      board.status().selected!==selected)
    throw Error('READINESS08 owner/outfit changed during source verification');
  };
  try{
   assertOwner();
   const items=await readItems(db);
   assertOwner();
   const result=await assessSavedNative08({ownerId,saved,items,assertOwner});
   assertOwner();
   // DOM nodes are built without HTML injection. Only byte-verified owner
   // original JPEG data can appear as image sources; no photo leaves device.
   const fragment=doc.createDocumentFragment();
   for(const entry of result.entries){
    const article=doc.createElement('article');article.className='native-readiness08-item';
    article.setAttribute('role','listitem');article.dataset.status=entry.status;
    if(entry.photo){const img=doc.createElement('img');img.src=entry.photo;img.alt='Original photographed garment';article.append(img);}
    const copy=doc.createElement('div');
    const title=doc.createElement('strong');title.textContent=entry.slot+' · '+(entry.label||'Saved clothing');
    const grade=doc.createElement('p');grade.textContent=entry.status;
    const why=doc.createElement('p');why.textContent=entry.reason;
    copy.append(title,grade,why);article.append(copy);fragment.append(article);
   }
   assertOwner();grid.replaceChildren(fragment);last=result;
   notify(result.entries.length+' saved outfit slots checked · '+result.review+' need review · '+
    result.photoOnly+' photo-only · '+result.missing+' missing · '+
    result.ready+' human-approved 3D ready. Original JPEGs unchanged.');
   return result;
  }catch(error){
   if(call===request){grid.replaceChildren();last=null;
    notify('Could not verify this saved outfit. No clothing data changed. '+String(error.message||error));}
   throw error;
  }finally{if(!closed&&alive())button.disabled=false;}
 }
 button.addEventListener('click',()=>run().catch(()=>{}));
 function dispose(){
  if(closed)return;
  clear();closed=true;
  win.removeEventListener('closet:alpha-session-changed',revoke);
  win.removeEventListener('pagehide',revoke);
  doc.getElementById('logout').removeEventListener('click',revoke,true);
  root.remove();style.remove();
 }
 return Object.freeze({run,clear,dispose,
  state:()=>Object.freeze({active:alive(),count:alive()?last?.entries.length||0:0,
   ready:alive()?last?.ready||0:0,review:alive()?last?.review||0:0,
   photoOnly:alive()?last?.photoOnly||0:0,missing:alive()?last?.missing||0:0,
   originalJPEGPixelsPreserved:true,productionAuthorized:false,familyAlpha:'HOLD'}),
  researchOnly:true,releaseAuthorized:false});
}
