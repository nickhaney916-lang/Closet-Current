/**
 * NATIVE-CONSUMER-BOARD-04 — explicit research-only safe adapter for ACTUAL
 * native consumer Outfit Builder controls. No automatic writes on open/view.
 * Actual native login attested by exactly pinned AUTH01 (#550) adapter.
 * Existing original BOARD02 (#552) compare-and-swap remains the sole writer.
 *
 * Not a production release: enabled ONLY by ?nativeLossless04=research;
 * browser/staging data are never mutated from the default URL path.
 */
import {createNativeAuthEpoch01} from './native-session-epoch-550-pinned.mjs';
import {createExistingBoard02IO} from '../board-lossless-02/existing-idb-cas.mjs';
import {boardFingerprint02,validateBoard02} from '../board-lossless-02/lossless-board.mjs';

export const NATIVE_CONSUMER_BOARD_04=Object.freeze({
 featureGate:'nativeLossless04=research',nativeConsumerControls:true,
 fullBoardCAS:true,staleSessionFailClosed:true,
 missingIDsPreserved:true,unsupported3DMustFallback:true,
 cloudSyncVersionChecked:true,cloudWritesTriggered:false,
 defaultConsumerUnmodified:true,productionAuthorized:false,
 realSupabaseSignedAccountsVerified:false,familyAlpha:'HOLD'
});
const clone=x=>structuredClone(x);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const validId=x=>typeof x==='string'&&x.length>0&&x.length<=160&&!/[\u0000-\u001f]/.test(x);
const slots=new Set(['top','bottom','layer','layer2','layer3','shoes','bag','accessory','finish']);
const types={top:['Tops','Dresses'],bottom:['Bottoms'],layer:['Tops','Outerwear'],
 layer2:['Outerwear'],layer3:['Outerwear'],shoes:['Shoes'],
 bag:['Accessories'],accessory:['Accessories'],finish:['Accessories']};
function itemFits(slot,item){
 if(!slots.has(slot)||!item||!types[slot].includes(item.category))return false;
 if(slot==='bag')return item.itemType==='Bag';
 if(slot==='accessory')return ['Jewelry','Sunglasses'].includes(item.itemType);
 if(slot==='finish')return ['Belt','Scarf','Hat'].includes(item.itemType);
 if(slot==='layer2')return ['Jacket','Blazer','Vest','Cardigan'].includes(item.itemType);
 if(slot==='layer3')return ['Coat','Raincoat'].includes(item.itemType);
 return true;
}
const fields={name:80,occasion:30,season:30,audience:30,size:30,budget:20};
function view(raw){
 const value=clone(raw),s=value.slots||{};
 const inferred=s.layer3?3:s.layer2?2:s.layer?1:0;
 const count=Math.max(Number.isInteger(value.layerCount)?value.layerCount:0,inferred);
 return {...value,name:typeof value.name==='string'?value.name:'My outfit',
  slots:s,ideas:value.ideas&&typeof value.ideas==='object'?value.ideas:{},
  layerCount:Math.min(3,Math.max(0,count)),
  occasion:value.occasion||'Casual',season:value.season||'Fall',
  audience:value.audience||'Women',size:value.size||'',budget:value.budget||0};
}
export async function createNativeConsumerBoard04({
 win=globalThis.window,doc=win?.document,nativeAuth=win?.closetAuth,
 onChange=()=>{},onStatus=()=>{}
}={}){
 if(!win||!doc||!nativeAuth||typeof nativeAuth.getAccessToken!=='function'||
    new URLSearchParams(win.location.search).get('nativeLossless04')!=='research'||
    !doc.getElementById('appShell')||!doc.getElementById('authGate')||
    !doc.getElementById('logout'))
  throw Error('BOARD04 requires real native page/auth and explicit research-only URL gate');
 const original=nativeAuth,epoch=createNativeAuthEpoch01({nativeAuth,win,doc});
 let closed=false,stored=null,cloud=null,wardrobe=[],expected=null,
  opened=null,draft=null,dirty=false,loaded=false,admitted=null,io=null,editSerial=0;
 const fail=(code)=>{throw Error('BOARD04 '+code);};
 const invalidate=()=>{loaded=false;stored=null;cloud=null;wardrobe=[];expected=null;
  opened=null;draft=null;dirty=false;admitted=null;editSerial++;
  onChange(null,{revoked:true});};
 const alive=()=>{
  if(closed||!loaded||!admitted)fail('NO_OWNER_SESSION');
  const generation=epoch.auth.getSessionGeneration();
  if(epoch.auth.user?.id!==admitted.ownerId||generation!==admitted.generation||
     win.closetAuth!==original){invalidate();fail('SESSION_REVOKED');}
  return {authenticated:true,ownerId:admitted.ownerId,generation:admitted.generation};
 };
 const published=()=>{if(!draft)fail('NO_DRAFT');return view(draft);};
 const emit=(text='Unsaved draft · Save changes explicitly')=>{
  onChange(published(),{selected:opened,dirty,
   savedCount:stored.saved.length,missingIds:missingCount(),noAutomaticWrite:true});
  onStatus(text);
 };
 function missingCount(){
  if(!draft)return 0;
  const itemIds=new Set(wardrobe.map(x=>x.id));
  return Object.values(draft.slots||{}).filter(id=>!itemIds.has(id)).length;
 }
 const load=async({discard=false}={})=>{
  if(closed)fail('DISPOSED');
  if(loaded&&dirty&&!discard)fail('RELOAD_WOULD_DISCARD_UNSAVED_DRAFT');
  const lease=await epoch.attest();
  if(!lease?.authenticated||win.closetAuth!==original||
    own(original,'getSessionGeneration'))fail('NATIVE_AUTH_REPLACEMENT_REFUSED');
  const adapter=createExistingBoard02IO(epoch.auth);
  const snap=await adapter.read(lease);
  if(epoch.auth.getSessionGeneration()!==lease.generation)fail('TOKEN_CHANGED_DURING_READ');
  validateBoard02(snap.board,{ownerId:lease.ownerId});
  io=adapter;admitted=lease;stored=clone(snap.board);cloud=clone(snap.cloud);
  wardrobe=clone(snap.items);expected=boardFingerprint02(stored);
  draft=clone(stored.current);opened=null;dirty=false;loaded=true;
  emit('Private saved outfits loaded without rewriting storage · research only');
  return {loaded:true,ownerPrivate:true,readOnly:true,
   savedCount:stored.saved.length,missingIds:missingCount(),
   releaseAuthorized:false};
 };
 const selectSaved=index=>{
  alive();
  if(!Number.isInteger(index)||index<0||index>=stored.saved.length)fail('UNKNOWN_SAVED_OUTFIT');
  if(dirty)fail('UNSAVED_EDITS_REQUIRE_CANCEL_OR_SAVE');
  opened=index;draft=clone(stored.saved[index]);dirty=false;
  emit('Opened saved outfit without writing original IDs or photos');
  return published();
 };
 const change=(fn)=>{
  alive();if(!draft)fail('NO_DRAFT');
  const candidate=clone(draft);fn(candidate);
  const full={...clone(stored),current:opened===null?candidate:stored.current,
    saved:opened===null?stored.saved:stored.saved.map((x,i)=>i===opened?candidate:x)};
  validateBoard02(full,{ownerId:admitted.ownerId});
  draft=candidate;dirty=true;editSerial++;
  emit('Unsaved change · original saved outfit remains unchanged until Save changes');
  return published();
 };
 const setSlot=(slot,itemId)=>change(d=>{
  if(!slots.has(slot))fail('UNKNOWN_SLOT');
  const existing=Object.entries(d.slots||{}).find(([s,id])=>s!==slot&&id===itemId);
  if(existing)fail('DUPLICATE_GARMENT_PLACEMENT');
  if(itemId&&(!validId(itemId)||!itemFits(slot,wardrobe.find(x=>x.id===itemId))))
   fail('REPLACEMENT_MUST_BE_OWNER_COMPATIBLE');
  d.slots=d.slots||{};
  if(itemId){d.slots[slot]=itemId;d.slotSources=d.slotSources||{};
   const item=wardrobe.find(x=>x.id===itemId);
   const proof=item.originalPhoto?.sha256||item.sourceSHA256;
   d.slotSources[slot]={...(d.slotSources[slot]||{}),
    ...(typeof proof==='string'?{sha256:proof}:{}),
    ownerId:admitted.ownerId,categoryAtSave:item.category,itemTypeAtSave:item.itemType};
  }else{delete d.slots[slot];if(d.slotSources)delete d.slotSources[slot];}
 });
 const setField=(field,value)=>change(d=>{
  if(!own(fields,field))fail('UNKNOWN_OUTFIT_FIELD');
  if(field==='budget'){
   const n=Number(value);if(!Number.isFinite(n)||n<0||n>10000)fail('INVALID_BUDGET');
   d.budget=n;return;
  }
  if(typeof value!=='string'||value.length>fields[field])fail('INVALID_OUTFIT_FIELD');
  if(field==='name'&&!value.trim())fail('OUTFIT_NAME_REQUIRED');
  d[field]=value;
 });
 const setIdea=(slot,idea)=>change(d=>{
  if(!slots.has(slot)||!idea||typeof idea.type!=='string'||
    typeof idea.color!=='string')fail('INVALID_SHOPPING_IDEA');
  d.ideas=d.ideas||{};d.slots=d.slots||{};
  d.ideas[slot]={type:idea.type.slice(0,50),color:idea.color.slice(0,40)};
  delete d.slots[slot];
 });
 const startNew=()=>{
  alive();if(dirty)fail('UNSAVED_EDITS_REQUIRE_CANCEL_OR_SAVE');
  opened=null;
  draft={name:'My outfit',slots:{},ideas:{},layerCount:0,
   occasion:'Casual',season:'Fall',audience:'Women',size:'',budget:0};
  dirty=false;emit('New unsaved outfit · saved records untouched');
  return published();
 };
 const cancel=()=>{
  alive();draft=clone(opened===null?stored.current:stored.saved[opened]);
  dirty=false;emit('Canceled · original saved clothing references unchanged');
  return published();
 };
 const persist=async({asNew=false}={})=>{
  const lease=alive(),serial=editSerial;
  if(!draft||!Object.keys(draft.slots||{}).length)fail('SELECT_AT_LEAST_ONE_OWNED_GARMENT');
  if(asNew&&stored.saved.length>=50)fail('OUTFIT_LIMIT_50');
  if(!asNew&&opened===null)fail('OPEN_SAVED_OUTFIT_TO_SAVE_CHANGES');
  const newBoard=clone(stored),next=clone(draft);
  let operation,selected;
  if(asNew){
   next.id=win.crypto.randomUUID();
   if(own(next,'outfit3dId'))next.outfit3dId=win.crypto.randomUUID();
   if(own(next,'outfitId'))next.outfitId=win.crypto.randomUUID();
   newBoard.saved.push(next);operation='save-new';selected=newBoard.saved.length-1;
  }else{
   newBoard.saved[opened]=next;operation='save-existing';selected=opened;
  }
  validateBoard02(newBoard,{ownerId:lease.ownerId});
  try{
   await io.compareAndWrite({lease,expectedFingerprint:expected,expectedCloud:cloud,
    nextBoard:newBoard,operation});
   if(editSerial!==serial)fail('DRAFT_CHANGED_WHILE_SAVING');
   const verified=await io.read(lease);
   if(epoch.auth.getSessionGeneration()!==lease.generation)fail('SESSION_ROTATED_AFTER_SAVE');
   if(boardFingerprint02(verified.board)!==boardFingerprint02(newBoard))
    fail('STORAGE_DIFFERENT_AFTER_SAVE');
   stored=clone(verified.board);cloud=clone(verified.cloud);
   expected=boardFingerprint02(stored);opened=selected;
   draft=clone(stored.saved[selected]);dirty=false;
   emit('Saved private outfit with all original references · cloud backup pending');
   return {saved:true,operation,selected,originalIDsPreserved:true,
    cloudDirty:true,releaseAuthorized:false};
  }catch(e){onStatus('No overwrite · '+String(e.message||e));throw e;}
 };
 const remove=async(index,{confirmed=false}={})=>{
  const lease=alive();
  if(!confirmed||!Number.isInteger(index)||index<0||index>=stored.saved.length)
   fail('CONFIRMED_EXISTING_SAVED_OUTFIT_REQUIRED');
  if(dirty)fail('CANCEL_OR_SAVE_UNSAVED_EDITS_FIRST');
  const next=clone(stored);
  next.saved.splice(index,1);validateBoard02(next,{ownerId:lease.ownerId});
  await io.compareAndWrite({lease,expectedFingerprint:expected,expectedCloud:cloud,
   nextBoard:next,operation:'delete'});
  const fresh=await io.read(lease);
  stored=clone(fresh.board);cloud=clone(fresh.cloud);
  expected=boardFingerprint02(stored);opened=null;
  draft=clone(stored.current);dirty=false;emit('Deleted confirmed outfit only; source clothing untouched');
  return {deleted:true,remaining:stored.saved.length};
 };
 const list=()=>{alive();return clone(stored.saved).map((row,index)=>({
  index,id:row.id||row.outfit3dId||row.outfitId||'legacy-'+index,
  name:row.name||'My outfit',missing:countMissing(row,wardrobe)}));};
 const countMissing=(board,items)=>{const ids=new Set(items.map(x=>x.id));
  return Object.values(board?.slots||{}).filter(id=>!ids.has(id)).length;};
 const readOnlySnapshot=()=>{alive();return clone(stored);};
 const status=()=>{
  const active=!closed&&loaded&&epoch.status().active;
  return {active,dirty:active?dirty:false,savedCount:active?stored.saved.length:0,
   selected:active?opened:null,releaseAuthorized:false,familyAlpha:'HOLD'};
 };
 const invalidation=()=>{invalidate();onStatus('Session changed · private outfit preview cleared');};
 win.addEventListener('closet:alpha-session-changed',invalidation);
 win.addEventListener('pagehide',invalidation);
 try{await load();}
 catch(e){win.removeEventListener('closet:alpha-session-changed',invalidation);
  win.removeEventListener('pagehide',invalidation);epoch.dispose();throw e;}
 return Object.freeze({load,selectSaved,setSlot,setField,setIdea,startNew,cancel,persist,
  remove,list,readOnlySnapshot,status,view:()=>{alive();return published();},
  get selected(){alive();return opened;},get dirty(){alive();return dirty;},
  dispose(){if(closed)return;closed=true;
   win.removeEventListener('closet:alpha-session-changed',invalidation);
   win.removeEventListener('pagehide',invalidation);invalidate();epoch.dispose();},
  importBackup(){fail('NATIVE_IMPORT_REQUIRES_VERIFIED_ATOMIC_MIGRATION');},
  researchOnly:true,releaseAuthorized:false});
}
