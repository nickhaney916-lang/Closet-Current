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
import {attestOriginalJPEGBytes92} from '../native-original-photo-integrity-92/original-jpeg-byte-attestation.mjs';
import {attestOwnerReviewedCutoutBytes186} from '../owner-cutout-photo-fit-186/review-contract.mjs';
import {captureReviewedCutoutLease187} from '../pre-webgl-owner-cutout-187/cutout-lease.mjs';
import {attestOwnerMaskPNGBytes189} from '../owner-mask-fabric-189/mask-contract.mjs';

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
  opened=null,draft=null,dirty=false,loaded=false,admitted=null,io=null,editSerial=0,wardrobeRevision93=0;
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
  wardrobeRevision93++; // NATIVE93: loading a new owner-local source snapshot revokes prior 3D admission.
  emit('Private saved outfits loaded without rewriting storage · research only');
  return {loaded:true,ownerPrivate:true,readOnly:true,
   savedCount:stored.saved.length,missingIds:missingCount(),
   releaseAuthorized:false};
 };
 // NATIVE-INDEX-07: refresh ONLY the saved owner wardrobe after a new photo
 // is confirmed, corrected or removed. The active outfit draft (including
 // unsaved edits), selected outfit, cloud revision and expected board CAS are
 // deliberately not rewritten. This is not a board reload or cloud write.
 const refreshWardrobe=async()=>{
  const lease=alive();
  const snapshot=await io.read(lease);
  alive();
  if(epoch.auth.getSessionGeneration()!==lease.generation||
     admitted.ownerId!==lease.ownerId||!Array.isArray(snapshot.items))
   fail('WARDROBE_REFRESH_OWNER_CHANGED');
  validateBoard02(snapshot.board,{ownerId:lease.ownerId});
  if(boardFingerprint02(snapshot.board)!==expected)
   fail('WARDROBE_REFRESH_BOARD_CONFLICT_RELOAD_REQUIRED');
  const next=clone(snapshot.items);
  const ids=new Set();
  for(const row of next){
   if(!validId(row.id)||ids.has(row.id)||
      ['ownerId','userId','accountId'].some(key=>row[key]!==undefined&&row[key]!==lease.ownerId))
    fail('WARDROBE_REFRESH_INVALID_PRIVATE_ITEM');
   ids.add(row.id);
  }
  wardrobe=next;
  wardrobeRevision93++; // NATIVE93: even unchanged SHA metadata cannot authorize old visible JPEG bytes.
  emit('Saved closet updated · current outfit and unsaved edits preserved');
  return {refreshed:true,itemCount:next.length,ownerPrivate:true,
   originalSavedBoardUnchanged:true,releaseAuthorized:false};
 };
 // NATIVE91: bounded read-only exact ORIGINAL SOURCE receipt for a known
 // selected outfit. Original JPEG bytes never leave the existing wardrobe.
 // A same-id photo replacement or correction changes this source identity.
 const readOnlyGarmentSources91=(ids)=>{
  if(new URLSearchParams(win.location.search).get('native3D05')!=='research')
   fail('NATIVE91_3D_RESEARCH_NOT_ENABLED');
  const lease=alive();
  if(!Array.isArray(ids)||ids.length<1||ids.length>9||
     ids.some(x=>!validId(x))||new Set(ids).size!==ids.length)
   fail('NATIVE91_INVALID_SOURCE_SELECTION');
  const sources=ids.map(garmentId=>{
   const row=wardrobe.find(x=>x.id===garmentId);
   const hash=row?.sourceSHA256;
   if(!row||row.ownerId!==lease.ownerId||
      typeof hash!=='string'||!/^[a-f0-9]{64}$/.test(hash)||
      row.originalPhoto?.sha256!==hash||
      row.sourceHash!==undefined&&row.sourceHash!==hash||
      typeof row.originalPhoto?.image!=='string'||
      !row.originalPhoto.image.startsWith('data:image/jpeg;base64,'))
    fail('NATIVE91_MISSING_OR_CHANGED_ORIGINAL_SOURCE');
   return Object.freeze({id:row.id,sha256:hash,
    category:String(row.category||''),itemType:String(row.itemType||''),
    color:String(row.color||''),secondaryColor:String(row.secondaryColor||'')});
  });
  return Object.freeze({ownerId:lease.ownerId,sources:Object.freeze(sources)});
 };
 // NATIVE92: cryptographically attest ORIGINAL JPEG BYTES for every selected
 // source. All photo data stays inside the owner-private board closure; only
 // the SHA-verified metadata receipt leaves. Compare the current wardrobe
 // objects after asynchronous WebCrypto to fail closed on concurrent refresh.
 const attestOriginalPhotoBytes92=async(ids)=>{
  const before=readOnlyGarmentSources91(ids),lease=alive();
  const sources=ids.map(id=>wardrobe.find(row=>row.id===id));
  const verified=[];
  for(const row of sources)
   verified.push(await attestOriginalJPEGBytes92({
    row,ownerId:lease.ownerId,cryptoImpl:win.crypto,
    decodeBase64:win.atob.bind(win)
   }));
  if(epoch.auth.getSessionGeneration()!==lease.generation||
     lease.ownerId!==alive().ownerId||
     sources.some((row,i)=>row!==wardrobe.find(x=>x.id===ids[i])))
   fail('NATIVE92_SOURCE_CHANGED_DURING_CRYPTO');
  const after=readOnlyGarmentSources91(ids);
  if(JSON.stringify(after)!==JSON.stringify(before)||
     verified.some((row,i)=>JSON.stringify(row)!==JSON.stringify(before.sources[i])))
   fail('NATIVE92_SOURCE_CHANGED_DURING_CRYPTO');
  return Object.freeze({ownerId:lease.ownerId,sources:Object.freeze(verified)});
 };
 /**
  * P186: real private wardrobe owner+revision-bound, DOUBLE WebCrypto byte
  * proof of the P119 original and explicitly owner-reviewed distinct cutout.
  * Never synthesize a review receipt from a provisional public fixture.
  */
 const cutoutLeases187=new WeakMap();
 const attestReviewedCutout186=async(garmentId)=>{
  const p=new URLSearchParams(win.location.search);
  if(p.get('native3D05')!=='research'||p.get('photoOwnerCutout186')!=='research')
   fail('P186_EXPLICIT_PRIVATE_REVIEW_GATE_REQUIRED');
  const lease=alive(),revision=wardrobeRevision93;
  if(!validId(garmentId))fail('P186_INVALID_SAVED_GARMENT_ID');
  const row=wardrobe.find(x=>x.id===garmentId);
  if(!row||row.ownerId!==lease.ownerId)
   fail('P186_MISSING_CURRENT_OWNER_GARMENT');
  const originalBefore=readOnlyGarmentSources91([garmentId]);
  const hint=row.segmentHint,cutoutBefore=hint?.cutoutImage;
  const proof=await attestOwnerReviewedCutoutBytes186({
   row,ownerId:lease.ownerId,cryptoImpl:win.crypto,
   decodeBase64:win.atob.bind(win)
  });
  const current=alive();
  if(current.ownerId!==lease.ownerId||current.generation!==lease.generation||
    revision!==wardrobeRevision93||wardrobe.find(x=>x.id===garmentId)!==row||
    row.segmentHint!==hint||hint?.cutoutImage!==cutoutBefore||
    row.cutoutSHA256!==proof.cutoutSHA256||
    row.ownerReviewed!==true||row.humanReviewedSource!==true||
    JSON.stringify(originalBefore)!==JSON.stringify(readOnlyGarmentSources91([garmentId])))
   fail('P186_OWNER_REVIEW_OR_CUTOUT_CHANGED_DURING_CRYPTO');
  return proof;
 };
 /**
  * P187 front-load P186 actual byte proof before the donor is imported.
  * The preview gets a frozen metadata-only receipt; image bytes remain
  * entirely inside the owner-private closure. A WeakMap protects its
  * nonserializable lease and is never exposed or exported.
  */
 const attestReviewedCutoutLease187=async garmentId=>{
  const params=new URLSearchParams(win.location.search);
  if(params.get('photoOwnerCutout187')!=='research'||
     params.get('photoOwnerCutout186')!=='research')
   fail('P187_EXPLICIT_PRE_WEBGL_RESEARCH_GATE_REQUIRED');
  const initial=alive(),revision=wardrobeRevision93;
  const row=wardrobe.find(item=>item?.id===garmentId);
  if(!row||row.ownerId!==initial.ownerId)
   fail('P187_SELECTED_OWNER_GARMENT_MISSING');
  const proof=await attestReviewedCutout186(garmentId);
  const lease=alive();
  if(lease.ownerId!==initial.ownerId||
     lease.generation!==initial.generation||
     revision!==wardrobeRevision93||
     wardrobe.find(item=>item?.id===garmentId)!==row)
   fail('P187_OWNER_WARDROBE_CHANGED_DURING_REVIEW');
  const guard=captureReviewedCutoutLease187({
   row,receipt:proof,ownerId:lease.ownerId,
   generation:lease.generation,revision
  });
  guard.assertCurrent({row,ownerId:lease.ownerId,
   generation:lease.generation,revision:wardrobeRevision93});
  cutoutLeases187.set(guard.receipt,guard);
  return guard.receipt;
 };
 const requireReviewedCutoutLease187=receipt=>{
  const guard=receipt&&cutoutLeases187.get(receipt);
  if(!guard)fail('P187_MISSING_CURRENT_DOUBLE_JPEG_REVIEW_LEASE');
  const lease=alive();
  const row=wardrobe.find(item=>item?.id===receipt.garmentId);
  guard.assertCurrent({row,ownerId:lease.ownerId,
   generation:lease.generation,revision:wardrobeRevision93});
  return true;
 };
 /**
  * P188: one-shot owner-private texture handoff to the actual detached
  * 163-bone donor. The reviewed JPEG string is never returned in status or
  * from this method. Caller supplies a same-page, research-only renderer
  * callback. Both private bytes are rehashed before and after this callback.
  * Explicit review metadata is an owner assertion, not independent quality.
  */
 const withReviewedCutoutForRenderer188=async(receipt,renderer)=>{
  const params=new URLSearchParams(win.location.search);
  if(params.get('photoOwnerPositive188')!=='research'||
     params.get('photoOwnerCutout187')!=='research'||
     typeof renderer!=='function')
   fail('P188_EXPLICIT_PRIVATE_RENDERER_AND_REVIEW_REQUIRED');
  requireReviewedCutoutLease187(receipt);
  const row=wardrobe.find(x=>x.id===receipt.garmentId);
  if(!row||row.ownerId!==receipt.ownerId)
   fail('P188_WRONG_OWNER_OR_SELECTED_GARMENT');
  const before=await attestReviewedCutout186(row.id);
  requireReviewedCutoutLease187(receipt);
  if(JSON.stringify(before)!==JSON.stringify(receipt))
   fail('P188_CUTOUT_RECEIPT_CHANGED_BEFORE_RENDERER');
  const maskEnabled189=params.get('photoOwnerAlpha189')==='research';
  let alphaProof189=null;
  if(maskEnabled189){
   alphaProof189=await attestOwnerMaskPNGBytes189({
    row,ownerId:receipt.ownerId,review:before,cryptoImpl:win.crypto,
    decodeBase64:win.atob.bind(win)
   });
   requireReviewedCutoutLease187(receipt);
  }
  const asset=Object.freeze({
   sourceId:'commons-0016',originalSourceSHA256:receipt.originalSourceSHA256,
   privateCutoutJPEGBytesSHA256:receipt.cutoutSHA256,
   cutoutImage:row.segmentHint.cutoutImage,
   ...(maskEnabled189?{
    ownerAlphaPNG189:row.segmentHint.ownerAlphaPNG189,
    ownerAlphaSHA256189:alphaProof189.privatePNG_SHA256,
    ownerAlphaProof189:alphaProof189
   }:{}),
   ownerReviewed:true,originalJPEGVerified:true,cutoutJPEGVerified:true,
   privateOriginalAndCutoutBytesVerified:true,releaseAuthorized:false,familyAlpha:'HOLD'
  });
  // Only the actual approved renderer callback gets these in-memory pixels.
  // Do not expose image strings via bridge.state(), return values or CI logs.
  const result=await renderer(asset);
  requireReviewedCutoutLease187(receipt);
  const after=await attestReviewedCutout186(row.id);
  requireReviewedCutoutLease187(receipt);
  if(JSON.stringify(after)!==JSON.stringify(before))
   fail('P188_OWNER_REVIEW_CHANGED_DURING_PRIVATE_TEXTURE_RENDER');
  if(maskEnabled189){
   const again=await attestOwnerMaskPNGBytes189({
    row,ownerId:receipt.ownerId,review:after,cryptoImpl:win.crypto,
    decodeBase64:win.atob.bind(win)
   });
   requireReviewedCutoutLease187(receipt);
   if(JSON.stringify(again)!==JSON.stringify(alphaProof189))
    fail('P189_OWNER_ALPHA_BYTES_CHANGED_DURING_3D_RENDER');
  }
  return result;
 };
 // NATIVE93: strictly read-only monotonic private wardrobe refresh epoch.
 // The epoch changes whenever a new wardrobe snapshot is adopted. It never
 // returns an original image and does not change saved outfit CAS records.
 // A 3D viewer must revoke its prior photo admission after any refresh
 // and require a new genuine NATIVE92 byte-level digest before displaying.
 const readOnlyWardrobeRevision93=()=>{
  if(new URLSearchParams(win.location.search).get('native3D05')!=='research')
   fail('NATIVE93_3D_RESEARCH_NOT_ENABLED');
  const lease=alive();
  return Object.freeze({ownerId:lease.ownerId,generation:lease.generation,
   revision:wardrobeRevision93});
 };
 // STYLE-OWNED-LIVE-03: strictly research-only native owner wardrobe read.
 // The generator never reads a separate database or writes private photos.
 // A fresh lease/fingerprint proves the very same BOARD04 owner epoch and
 // underlying CAS state used to save an explicit finished suggestion.
 const readOnlyWardrobe=()=>{
  if(new URLSearchParams(win.location.search).get('styleOwned03')!=='research')
   fail('STYLE03_RESEARCH_NOT_ENABLED');
  const lease=alive();
  return Object.freeze({ownerId:lease.ownerId,generation:lease.generation,
   items:clone(wardrobe),boardFingerprint:expected,originalRecordsUntouched:true,
   releaseAuthorized:false});
 };
 const sessionLease=()=>{
  if(new URLSearchParams(win.location.search).get('styleOwned03')!=='research')
   fail('STYLE03_RESEARCH_NOT_ENABLED');
  return alive();
 };
 // Apply the complete suggestion/swap with ONE guarded native change().
 // This is an unsaved draft transaction and never calls storage/clearSelection.
 // The verified original source bound to every selected item is rechecked
 // against the fresh private wardrobe; stale generation/reclassified/deleted
 // or duplicate garment IDs fail before ANY change to the visible draft.
 const applyOwnedSlots=({selected,sourceHashes,ownerId,generation,fingerprint}={})=>{
  if(new URLSearchParams(win.location.search).get('styleOwned03')!=='research')
   fail('STYLE03_RESEARCH_NOT_ENABLED');
  const lease=alive();
  if(lease.ownerId!==ownerId||lease.generation!==generation||
     fingerprint!==expected)fail('STYLE03_STALE_OWNER_OR_BOARD');
  if(!selected||typeof selected!=='object'||Array.isArray(selected)||
     !sourceHashes||typeof sourceHashes!=='object'||Array.isArray(sourceHashes))
   fail('STYLE03_BAD_SUGGESTION');
  const selectedEntries=Object.entries(selected),ids=new Set();
  if(selectedEntries.length<2||selectedEntries.length>5||!selected.top||!selected.shoes)
   fail('STYLE03_INCOMPLETE_LOOK');
  for(const [slot,itemId]of selectedEntries){
   if(!['top','bottom','shoes','layer2','layer3'].includes(slot)||
      !validId(itemId)||ids.has(itemId))fail('STYLE03_DUPLICATE_OR_UNKNOWN_SLOT');
   const row=wardrobe.find(x=>x.id===itemId);
   if(!itemFits(slot,row)||row?.ownerId!==lease.ownerId||
      !/^[a-f0-9]{64}$/.test(sourceHashes[itemId]||'')||
      row.originalPhoto?.sha256!==sourceHashes[itemId]||
      row.sourceSHA256!==sourceHashes[itemId])
    fail('STYLE03_SOURCE_OR_CATEGORY_CHANGED');
   ids.add(itemId);
  }
  const top=wardrobe.find(row=>row.id===selected.top);
  if(top.category==='Dresses'&&(selected.bottom||selected.layer)||
     top.category!=='Dresses'&&(!selected.bottom||top.category!=='Tops'))
   fail('STYLE03_DRESS_OR_MISSING_BOTTOM_CONFLICT');
  const result=change(d=>{
   d.slots=clone(selected);
   d.slotSources={};
   for(const [slot,itemId]of selectedEntries){
    const row=wardrobe.find(x=>x.id===itemId);
    d.slotSources[slot]={sha256:sourceHashes[itemId],ownerId:lease.ownerId,
     categoryAtSave:row.category,itemTypeAtSave:row.itemType};
   }
   // These are exclusively OWNED clothing slots; inherited shopping ideas
   // must not appear as a substitute for actual photo-backed pieces.
   d.ideas={};
   d.layerCount=selected.layer3?3:selected.layer2?2:0;
  });
  return Object.freeze({draft:result,ownerId:lease.ownerId,generation:lease.generation,
   sourcePhotosUnmodified:true,savePending:true,releaseAuthorized:false});
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
 return Object.freeze({load,refreshWardrobe,readOnlyGarmentSources91,readOnlyWardrobe,attestOriginalPhotoBytes92,sessionLease,readOnlyWardrobeRevision93,applyOwnedSlots,attestReviewedCutout186,attestReviewedCutoutLease187,requireReviewedCutoutLease187,withReviewedCutoutForRenderer188,selectSaved,setSlot,setField,setIdea,startNew,cancel,persist,
  remove,list,readOnlySnapshot,status,view:()=>{alive();return published();},
  get selected(){alive();return opened;},get dirty(){alive();return dirty;},
  dispose(){if(closed)return;closed=true;
   win.removeEventListener('closet:alpha-session-changed',invalidation);
   win.removeEventListener('pagehide',invalidation);invalidate();epoch.dispose();},
  importBackup(){fail('NATIVE_IMPORT_REQUIRES_VERIFIED_ATOMIC_MIGRATION');},
  researchOnly:true,releaseAuthorized:false});
}
