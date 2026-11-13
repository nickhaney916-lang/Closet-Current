/**
 * MAIN1054 / Mission 4 Milestone 4: opt-in genuine Mission 1 P875 two-model
 * review panel inside the real signed-owner Mission 3 Photo Results Adjust.
 * Suggestions are unsaved draft changes only; native owner-reviewed photo
 * original/atomic IDB save and private wardrobe protections remain sole writers.
 * M1 source/model runner is preserved in separate pinned research-only files.
 */
import {mountDual82,dualBrowserAvailable82} from './dual-panel-82.mjs';
import {jpegBytes,digestBytes} from './native-canonical-photo-source-167.mjs';

const SHA=/^[0-9a-f]{64}$/;
const original=item=>item.originalPhoto?.image||item.recognitionPhoto?.image||item.image;
const sourceStamp=item=>JSON.stringify([
 item?.id,item?.ownerId,item?.image,item?.recognitionPhoto,item?.originalPhoto,
 item?.sourceSHA256,item?.sourceHashVerified,item?.segmentHint,item?.cropBounds,
 item?.outfitSourceId,item?.reconciliation70,item?.shoePair,item?.combinedFragments70
]);
const refuse=message=>{throw Error('MAIN1054_DUAL '+message);};

/**
 * Caller must supply actual native owner private-state accessors. A injected
 * request is only useful for independent NO-DEPLOY browser tests and does not
 * change the default on-device two-model worker request at production callsites.
 */
export async function mountMission4DualReview1054({
 form,dialog,item,draft,editorSession,
 getItems,getBatch,getDb,getEpoch,getAuth,getSchema,
 saving=()=>false,request,supported
}={}){
 if(!form?.querySelector||!dialog?.open||!item?.id||!draft||
  typeof editorSession?.current!=='function'||
  [getItems,getBatch,getDb,getEpoch,getAuth,getSchema,saving].some(f=>typeof f!=='function'))
  refuse('signed-owner native review interface unavailable');
 const auth=getAuth(),owner=auth?.user,ownerId=owner?.id,ownerDB=getDb(),epoch=getEpoch();
 if(typeof ownerId!=='string'||!ownerId||
    ownerDB?.name!=='closet-current-user-'+ownerId||
    item.ownerId!==ownerId||!getBatch().includes(item)||
    getItems().some(row=>row?.id===item.id))refuse('private unsaved photo/owner mismatch');
 // No separated garments, fragmented pairs or unverified crop/physical-unit
 // associations are allowed into this cross-mission model runner.
 const isolated=()=>!item.segmentHint&&!item.cropBounds&&!item.outfitSourceId&&
  !item.reconciliation70&&!item.shoePair&&!item.combinedFragments70;
 if(!isolated())refuse('multi-garment and shoe-pair owners must use manual Adjust');
 const sourceData=original(item),inputData=item.recognitionPhoto?.image||item.image;
 if(typeof sourceData!=='string'||!sourceData.startsWith('data:image/jpeg;base64,')||
    typeof inputData!=='string'||!inputData.startsWith('data:image/jpeg;base64,')||
    !SHA.test(item.sourceSHA256||''))refuse('original source JPEG receipt unavailable');
 const stampBeforeDigest=sourceStamp(item),receiptBeforeDigest=item.sourceSHA256;
 const originalDigest=await digestBytes(jpegBytes(sourceData));
 if(sourceStamp(item)!==stampBeforeDigest||item.sourceSHA256!==receiptBeforeDigest||
    originalDigest!==item.sourceSHA256||
    item.originalPhoto?.sha256&&item.originalPhoto.sha256!==originalDigest)
  refuse('original JPEG SHA-256 receipt mismatch');
 const atStart=sourceStamp(item);
 const current=()=>{
  try{
   return dialog.open&&dialog.isConnected&&form.isConnected&&
    editorSession.current()&&!saving()&&getAuth()===auth&&
    getAuth()?.user===owner&&getAuth()?.user?.id===ownerId&&
    getDb()===ownerDB&&getDb()?.name==='closet-current-user-'+ownerId&&
    getEpoch()===epoch&&item.ownerId===ownerId&&
    getBatch().includes(item)&&!getItems().some(row=>row?.id===item.id)&&
    sourceStamp(item)===atStart&&isolated();
  }catch{return false;}
 };
 if(!current())refuse('owner login/editor or exact source changed while checking JPEG');
 const snapshotDraft=()=>JSON.stringify([
  draft.category,draft.itemType,draft.color,draft.colorSource,draft.pattern,
  draft.sleeveLength,draft.fit,draft.name,draft.notes,draft.seasons,
  draft.brand,draft.size,draft.material,draft.occasion,
 ]);
 const onChoose=choice=>{
  if(!current()||!choice||!getSchema()?.types||
     !Object.hasOwn(getSchema().types,choice.category)||
     !getSchema().types[choice.category].includes(choice.itemType))
   return false;
  const category=form.querySelector('select[aria-label="Main category"]');
  const type=form.querySelector('select[aria-label="Item type"]');
  if(!category||!type||![...category.options].some(o=>o.value===choice.category))
   return false;
  // The native clothingFields handler resets subtype on category changes.
  // Input events invoke the true draft editor, not any direct private save.
  if(category.value!==choice.category){
   category.value=choice.category;
   category.dispatchEvent(new Event('input',{bubbles:true}));
  }
  if(!current()||![...type.options].some(o=>o.value===choice.itemType))return false;
  if(type.value!==choice.itemType){
   type.value=choice.itemType;
   type.dispatchEvent(new Event('input',{bubbles:true}));
  }
  return current()&&category.value===choice.category&&
   type.value===choice.itemType&&draft.category===choice.category&&
   draft.itemType===choice.itemType;
 };
 const args={
  form,item,
  getOwner:()=>current()?owner:null,
  isLive:current,
  unitAllowed:current,
  getDraftRevision:snapshotDraft,
  onChoose
 };
 if(typeof request==='function')args.request=request;
 if(typeof supported==='boolean')args.supported=supported;
 else args.supported=dualBrowserAvailable82();
 const panel=mountDual82(args);
 let disposed=false;
 const cleanup=()=>{
  if(disposed)return;disposed=true;panel.close();
  globalThis.window?.removeEventListener?.('closet:session-locked',cleanup);
  globalThis.window?.removeEventListener?.('pagehide',cleanup);
  globalThis.window?.removeEventListener?.('focus',checkLive);
  globalThis.document?.removeEventListener?.('visibilitychange',checkLive);
 };
 const checkLive=()=>{if(globalThis.document?.hidden||!current())cleanup();};
 dialog.addEventListener('close',cleanup,{once:true});
 globalThis.window?.addEventListener?.('closet:session-locked',cleanup);
 globalThis.window?.addEventListener?.('pagehide',cleanup);
 globalThis.window?.addEventListener?.('focus',checkLive);
 globalThis.document?.addEventListener?.('visibilitychange',checkLive);
 if(!current()){cleanup();refuse('owner review was revoked while mounting');}
 return Object.freeze({
  active:current,
  close:cleanup,
  get status(){return Object.freeze({
   ownerVerified:current(),originalShaVerified:true,
   autoSaved:false,sourcePhotoModified:false,renderAuthorized3D:false,
   releaseAuthorized:false,familyAlpha:'HOLD',mode:'opt-in-two-model-unsaved-review'
  });}
 });
}
