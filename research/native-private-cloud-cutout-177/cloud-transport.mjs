/**
 * Closet Current P177 — opt-in source-preserving native cloud image transport.
 * Research only. This module wraps the ACTUAL public/cloud-backup-engine.js
 * mapImages without editing production. It supports both fields named image
 * and the separately P119 owner-reviewed segmentHint.cutoutImage.
 *
 * Fail-close:
 *  - all owner/SHA paths preflight synchronously before ANY cloud GET;
 *  - real P126 original JPEG+cutout byte/review verification before export
 *    or before returning decoded data for an atomic owner restore;
 *  - exact owner identity and caller's current auth/DB/session epoch checked
 *    before and after every awaited hash or storage I/O.
 *
 * The caller must still use genuine Supabase Auth/RLS for remote authorization.
 * This is not a replacement for native server RLS or hosted acceptance.
 */
import {validateRestore01} from '../restore-atomic-01/atomic-restore.mjs';
import {assertOwnerCloudPaths128}
 from '../two-owner-cloud-rls-recovery-128/owner-cloud-cutout-proof.mjs';

export const CLOUD_SOURCE_177=Object.freeze({
 originalJPEGField:'image',
 reviewedCutoutField:'cutoutImage',
 actualNativeCloudEngine:true,independentOriginalAndCutoutSHA:true,
 productionAuthorized:false,hostedSignedAuthVerified:false,
 arbitraryPrivatePhoto3DApproved:false,familyAlpha:'HOLD'
});
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[0-9a-f]{12}$/i;
const MARK=/^closet-photo:([a-f0-9-]{36})\/([0-9a-f]{64})\.jpg$/;
const JPEG=/^data:image\/jpeg;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const sourceKey=k=>k==='image'||k==='cutoutImage';
const dangerous=k=>['__proto__','constructor','prototype'].includes(k);
const clone=x=>structuredClone(x);

function collect(value,ownerId,depth=0,seen=new WeakSet(),flags={raw:0,remote:0,cutout:0}){
 if(depth>36)throw Error('P177 owner source nesting limit exceeded');
 if(value===null||typeof value!=='object')return flags;
 if(seen.has(value))throw Error('P177 cyclic cloud metadata');
 seen.add(value);
 if(Array.isArray(value)){
  if(value.length>2500)throw Error('P177 excessive source count');
  for(const child of value)collect(child,ownerId,depth+1,seen,flags);
 }else{
  if(Object.keys(value).length>1600)throw Error('P177 excessive metadata keys');
  for(const [key,v] of Object.entries(value)){
   if(dangerous(key))throw Error('P177 unsafe metadata key');
   if(sourceKey(key)&&v!==null&&v!==undefined&&v!==''){
    if(typeof v!=='string')throw Error('P177 invalid original JPEG source');
    if(JPEG.test(v)){
     if(v.length>11_200_000)throw Error('P177 oversized original JPEG base64');
     flags.raw++;
    }else{
     const m=MARK.exec(v);
     if(!m||m[1]!==ownerId||!UUID.test(m[1]))
      throw Error('P177 invalid or foreign private JPEG path');
     flags.remote++;
    }
    if(key==='cutoutImage')flags.cutout++;
   }else collect(v,ownerId,depth+1,seen,flags);
  }
 }
 seen.delete(value);
 return flags;
}
async function convert(value,mapper,guard,depth=0){
 guard();
 if(depth>36)throw Error('P177 owner source traversal limit');
 if(Array.isArray(value)){
  const out=[];
  for(const child of value)out.push(await convert(child,mapper,guard,depth+1));
  return out;
 }
 if(value&&typeof value==='object'){
  const out={};
  for(const [k,v] of Object.entries(value)){
   if(dangerous(k))throw Error('P177 unsafe metadata key');
   if(sourceKey(k)&&typeof v==='string'&&v){
    guard();
    out[k]=await mapper(v);
    guard();
   }else out[k]=await convert(v,mapper,guard,depth+1);
  }
  return out;
 }
 return value;
}
export function installNativeCloudCutout177({
 engine,ownerId,currentOwner,assertLease,cryptoProvider=globalThis.crypto
}={}){
 if(!engine||typeof engine.mapImages!=='function'||
    typeof engine.validateDocument!=='function'||
    !UUID.test(ownerId||'')||
    typeof currentOwner!=='function'||typeof assertLease!=='function'||
    !cryptoProvider?.subtle?.digest)
  throw Error('P177 original native cloud engine, SHA, and owner lease required');
 const original=engine.mapImages;
 if(engine.__p177Installed)throw Error('P177 duplicate native cloud guard refused');
 const guard=()=>{
  assertLease();
  if(currentOwner()!==ownerId)throw Error('P177 private owner session changed');
 };
 let active=true,transactions=0,imagesMapped=0,cutoutsMapped=0;
 const invoke=async(root,map)=>{
  if(!active||typeof map!=='function')throw Error('P177 revoked native mapper');
  guard();
  // Clone synchronously: other browser tabs can mutate the original while
  // source SHA cryptography or remote storage I/O is awaited.
  const input=clone(root);
  engine.validateDocument(input);
  const flags=collect(input,ownerId);
  if(flags.raw&&flags.remote)
   throw Error('P177 mixed encoded and private JPEG paths require migration review');
  if(flags.remote)assertOwnerCloudPaths128(input,ownerId);
  guard();
  if(flags.raw){
   // Both original and separately reviewed cutout JPEGs are rehashed and
   // provenance verified before permitting even ONE private upload callback.
   await validateRestore01({...input,ownerId},{ownerId,mode:'cloud'});
   guard();
  }
  const mapped=await convert(input,map,guard);
  guard();
  engine.validateDocument(mapped);
  if(flags.raw){
   const out=collect(mapped,ownerId);
   if(out.raw!==0||out.remote!==flags.raw||
      out.cutout!==flags.cutout)
    throw Error('P177 source or cutout not individually moved to owner SHA storage');
   assertOwnerCloudPaths128(mapped,ownerId);
  }else if(flags.remote){
   const out=collect(mapped,ownerId);
   if(out.remote!==0||out.raw!==flags.remote)
    throw Error('P177 stored original and cutout JPEGs not fully hydrated');
   // No cloud restore can return changed crop/source/photo bytes or
   // owner-review metadata, even if remote storage returned HTTP 200.
   await validateRestore01({...mapped,ownerId},{ownerId,mode:'cloud'});
   guard();
  }
  transactions++;
  imagesMapped+=flags.raw+flags.remote;
  cutoutsMapped+=flags.cutout;
  return mapped;
 };
 engine.mapImages=invoke;
 Object.defineProperty(engine,'__p177Installed',{value:true,configurable:true});
 return Object.freeze({
  state(){guard();return Object.freeze({
   active,transactions,imagesMapped,cutoutsMapped,
   ownerId,productionAuthorized:false,
   hostedSignedAuthVerified:false,familyAlpha:'HOLD'
  });},
  revoke(){
   active=false;
   if(engine.mapImages===invoke)engine.mapImages=original;
   delete engine.__p177Installed;
  }
 });
}
