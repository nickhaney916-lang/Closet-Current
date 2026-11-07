/**
 * PHOTO128 — isolated research-only owner-bound cloud-photo packaging.
 *
 * No HTTP requests, no production cloud writer and no claim of signed JWT.
 * The native production cloud engine converts fields called "image", but
 * genuine P119 reviewed cutouts live at segmentHint.cutoutImage. This
 * adapter protects BOTH original and cutout JPEG bytes as owner-folder,
 * SHA256-addressed objects, avoiding inline base64 in private JSON metadata.
 *
 * Its caller supplies a real session lease guard and object IO callbacks.
 * Untrusted remote bytes are checked against the pinned path hash and then
 * P126 full SHA/review provenance is checked again before local restore.
 */
import {validateRestore01} from '../restore-atomic-01/atomic-restore.mjs';

const validOwner=x=>typeof x==='string'&&
 /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(x);
const validSHA=x=>/^[a-f0-9]{64}$/.test(x||'');
const imageKey=k=>k==='image'||k==='cutoutImage';
const clone=x=>structuredClone(x);
const encoded=/^data:image\/jpeg;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const toHex=x=>[...x].map(y=>y.toString(16).padStart(2,'0')).join('');
const pathOf=(ownerId,sha)=>'closet-photo:'+ownerId+'/'+sha+'.jpg';
function rawJPEG(image){
 if(typeof image!=='string'||!encoded.test(image))
  throw Error('PHOTO128 invalid owner JPEG');
 const binary=atob(image.slice('data:image/jpeg;base64,'.length));
 const bytes=Uint8Array.from(binary,x=>x.charCodeAt(0));
 if(bytes.length<4||bytes.length>8_388_608||
    bytes[0]!==255||bytes[1]!==216||
    bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217)
  throw Error('PHOTO128 invalid or oversized JPEG source');
 return bytes;
}
const dataJPEG=bytes=>{
 let out='';
 for(let i=0;i<bytes.length;i+=16384)
  out+=String.fromCharCode(...bytes.subarray(i,i+16384));
 return 'data:image/jpeg;base64,'+btoa(out);
};
async function hash(bytes,subtle){
 if(!subtle||typeof subtle.digest!=='function')
  throw Error('PHOTO128 SHA256 digest unavailable');
 return toHex(new Uint8Array(await subtle.digest('SHA-256',bytes)));
}
function assertSetup({ownerId,assertLease,subtle}){
 if(!validOwner(ownerId)||typeof assertLease!=='function'||
    !subtle||typeof subtle.digest!=='function')
  throw Error('PHOTO128 signed-in owner lease and SHA256 required');
 assertLease();
}
async function mapSource(root,callback,depth=0){
 if(depth>36)throw Error('PHOTO128 excessive cloud source nesting');
 if(Array.isArray(root))return Promise.all(root.map(x=>mapSource(x,callback,depth+1)));
 if(root!==null&&typeof root==='object'){
  const out={};
  for(const [key,value] of Object.entries(root)){
   if(['__proto__','constructor','prototype'].includes(key))
    throw Error('PHOTO128 unsafe cloud metadata');
   out[key]=imageKey(key)&&typeof value==='string'&&value?
    await callback(value,key):await mapSource(value,callback,depth+1);
  }
  return out;
 }
 return root;
}
/**
 * PHOTO128 foreign-path preflight: validate the ENTIRE decoded object graph
 * synchronously before launching even one parallel private storage fetch.
 * Without this, Promise.all on an item list could fetch a valid owner path
 * before discovering a malicious foreign cutout path in a sibling field.
 */
export function assertOwnerCloudPaths128(root,ownerId,depth=0){
 if(depth>36)throw Error('PHOTO128 excessive cloud source nesting');
 if(Array.isArray(root)){
  for(const child of root)assertOwnerCloudPaths128(child,ownerId,depth+1);
  return;
 }
 if(root&&typeof root==='object'){
  for(const [key,value] of Object.entries(root)){
   if(['__proto__','constructor','prototype'].includes(key))
    throw Error('PHOTO128 unsafe cloud metadata');
   if(imageKey(key)&&typeof value==='string'&&value){
    const match=/^closet-photo:([a-f0-9-]{36})\/([a-f0-9]{64})\.jpg$/.exec(value);
    if(!match||match[1]!==ownerId||!validSHA(match[2]))
     throw Error('PHOTO128 foreign or invalid owner JPEG object path');
   }else assertOwnerCloudPaths128(value,ownerId,depth+1);
  }
 }
}
export async function packageOwnerCloudCutouts128({
 backup,ownerId,assertLease,subtle=globalThis.crypto?.subtle
}={}){
 assertSetup({ownerId,assertLease,subtle});
 // Clone before awaiting validation; the caller may mutate a backup during
 // digest and must not be able to switch color, owner, or JPEG afterward.
 const snapshot=clone(backup);
 await validateRestore01(snapshot,{ownerId,mode:'file'});
 assertLease();
 const assets=new Map();
 const metadata=await mapSource({
  schemaVersion:1,ownerId,items:snapshot.items,state:snapshot.state
 },async value=>{
  const bytes=rawJPEG(value);
  const digest=await hash(bytes,subtle);
  assertLease();
  const path=pathOf(ownerId,digest);
  assets.set(path,bytes);
  return path;
 });
 assertLease();
 if(assets.size===0||metadata.ownerId!==ownerId)
  throw Error('PHOTO128 no authenticated owner JPEG assets');
 // The document is a detached object containing no original or crop JPEG
 // data URI. A private object server must enforce owner-folder RLS itself.
 return Object.freeze({document:metadata,assets,
  jpgObjectCount:assets.size,
  productionAuthorized:false,realSignedJWTVerified:false,familyAlpha:'HOLD'});
}
export async function reopenOwnerCloudCutouts128({
 document,ownerId,fetchPrivateJPEG,assertLease,
 subtle=globalThis.crypto?.subtle
}={}){
 assertSetup({ownerId,assertLease,subtle});
 if(typeof fetchPrivateJPEG!=='function')
  throw Error('PHOTO128 authenticated private storage fetch required');
 const snapshot=clone(document);
 if(snapshot?.ownerId!==ownerId||snapshot?.schemaVersion!==1||
    !Array.isArray(snapshot.items))
  throw Error('PHOTO128 owner-bound private cloud document required');
 // Validate every nested source/cutout path before ANY private object IO.
 assertOwnerCloudPaths128(snapshot,ownerId);
 assertLease();
 const cache=new Map();
 const restored=await mapSource(snapshot,async value=>{
  const match=/^closet-photo:([a-f0-9-]{36})\/([a-f0-9]{64})\.jpg$/.exec(value);
  if(!match||match[1]!==ownerId||!validSHA(match[2]))
   throw Error('PHOTO128 foreign or invalid owner JPEG object path');
  if(!cache.has(value)){
   assertLease();
   const incoming=await fetchPrivateJPEG(value);
   assertLease();
   const bytes=incoming instanceof Uint8Array?new Uint8Array(incoming):
    incoming instanceof ArrayBuffer?new Uint8Array(incoming):null;
   if(!bytes||bytes.length>8_388_608||bytes.length<4||
      bytes[0]!==255||bytes[1]!==216||
      bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217)
    throw Error('PHOTO128 remote object not a valid JPEG');
   if(await hash(bytes,subtle)!==match[2])
    throw Error('PHOTO128 remote private JPEG SHA mismatch');
   assertLease();
   cache.set(value,dataJPEG(bytes));
  }
  return cache.get(value);
 });
 await validateRestore01(restored,{ownerId,mode:'cloud'});
 assertLease();
 return Object.freeze({document:restored,
  verifiedObjectCount:cache.size,
  ownerPrivate:true,originalAndCutoutJPEGSHAValid:true,
  productionAuthorized:false,realSignedJWTVerified:false,familyAlpha:'HOLD'});
}
