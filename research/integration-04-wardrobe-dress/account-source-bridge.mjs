/**
 * PAR10 — read-only, account-scoped, original-photo wardrobe bridge.
 * Reuses the existing 3D68 saved wardrobe schema, session fence and
 * 3D69 genuine licensed mesh capability; NEVER substitutes a private JPEG
 * for a benchmark-approved 3D mesh or treats an auto label as confirmed.
 */
import {createAccountBoundCloset3DBridge} from '../three-d-68/account-bound-closet-3d-bridge.mjs';
import {prepareIndexedGarmentsFor3D,applyIndexed3DSelection} from '../three-d-69/index-to-real-garment-viewer.mjs';

export const SYNTHETIC_SOURCES10=Object.freeze({
 shirt:Object.freeze({url:'/benchmark/work47/assets/commons-0003.jpg',
  sha:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
  category:'Tops',itemType:'T-shirt',color:'Black'}),
 public:Object.freeze({url:'/benchmark/three-d-31/original-jeans.jpg',
  sha:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
  category:'Bottoms',itemType:'Jeans',color:'Blue'}),
 second:Object.freeze({url:'/benchmark/three-d-37/original-denimjeans2.jpg',
  sha:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a',
  category:'Bottoms',itemType:'Jeans',color:'Blue'}),
 dress:Object.freeze({url:'/benchmark/work47/assets/commons-0053.jpg',
  sha:'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019',
  category:'Dresses',itemType:'Dress',color:'Blue'})
});
const ACCOUNTS=Object.freeze(['fixture-account-a','fixture-account-b']);
const hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const authorized=(session)=>!!session?.authenticated&&ACCOUNTS.includes(session.ownerId)&&
 Number.isSafeInteger(session.generation)&&session.generation>=1;
const validatePhoto=async(bytes,sha)=>{
 if(!(bytes instanceof Uint8Array)||bytes.length<200||
  bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217||
  !hex(sha)||!crypto?.subtle)throw Error('Original JPEG missing or malformed');
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))]
  .map(v=>v.toString(16).padStart(2,'0')).join('');
 if(hash!==sha)throw Error('Original saved JPEG SHA-256 mismatch; no 3D and no unverified 2D');
 return hash;
};
async function jpegDataUrl(source,fetcher=fetch){
 const res=await fetcher(source.url,{cache:'no-store'});
 if(!res?.ok)throw Error('Original licensed JPEG missing');
 const bytes=new Uint8Array(await res.arrayBuffer());
 await validatePhoto(bytes,source.sha);
 // No base64 string is logged, exported or persisted.
 const blob=new Blob([bytes],{type:'image/jpeg'});
 const url=await new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>resolve(reader.result);
  reader.onerror=()=>reject(Error('Cannot load original JPEG photo'));
  reader.readAsDataURL(blob);
 });
 if(typeof url!=='string'||!url.startsWith('data:image/jpeg;base64,'))
  throw Error('Original photo data URL unavailable');
 return url;
}
export async function loadSyntheticLicensedClosets10({fetcher=fetch}={}){
 const source=Object.fromEntries(await Promise.all(Object.entries(SYNTHETIC_SOURCES10)
  .map(async([id,s])=>[id,await jpegDataUrl(s,fetcher)])));
 const data={};
 for(const [idx,account] of ACCOUNTS.entries()){
  const item=(id,key)=>({
   id:account+'-'+id,ownerId:account,category:SYNTHETIC_SOURCES10[key].category,
   itemType:SYNTHETIC_SOURCES10[key].itemType,color:SYNTHETIC_SOURCES10[key].color,
   originalPhoto:{image:source[key]},image:source[key],
   confirmedDetails:{category:SYNTHETIC_SOURCES10[key].category,
    itemType:SYNTHETIC_SOURCES10[key].itemType},
   userAdjusted:true,requiresOwnershipConfirmation:false,possibleDuplicate:false,
   colorSource:'user-confirmed',outfitSourceId:account+'-'+id,
   researchSource:key,expectedSHA256:SYNTHETIC_SOURCES10[key].sha
  });
  data[account]=Object.freeze([
   item('shirt','shirt'),
   item('jeans-a',idx===0?'public':'second'),
   item('jeans-b',idx===0?'second':'public'),
   item('dress','dress')
  ]);
 }
 return Object.freeze(data);
}
export function createSyntheticWardrobeSession10({closets,initial='fixture-account-a'}={}){
 if(!closets||!ACCOUNTS.includes(initial)||ACCOUNTS.some(k=>!Array.isArray(closets[k])))
  throw Error('Only two local synthetic account fixtures allowed');
 let owner=initial,generation=1,delayRead=null,override=null;
 const auth={
  ready:Promise.resolve(true),
  get user(){return owner?{id:owner}:null;},
  getSessionGeneration:()=>generation
 };
 const current=()=>({authenticated:!!owner,ownerId:owner,generation});
 const reader=async()=>{
  if(!owner)throw Error('Signed out synthetic wardrobe');
  if(delayRead)await delayRead();
  return override??closets[owner];
 };
 const adapter=createAccountBoundCloset3DBridge({auth,readSavedItems:reader});
 const load=async()=>{
  const session=current();
  if(!authorized(session))throw Error('Synthetic account signed out');
  const bound=await adapter.loadIndex();
  const list=override??closets[session.ownerId];
  for(const item of list){
   const found=bound.indexed.byId.get(item.id);
   if(!found||found.sourceSHA256!==item.expectedSHA256)
    throw Error('Original fixture JPEG fingerprint does not match approved licensed source');
  }
  if(bound.ownerId!==session.ownerId||bound.generation!==session.generation)
   throw Error('Outdated authenticated wardrobe read');
  return bound;
 };
 const control=Object.freeze({
  current,load,
  accountIds:ACCOUNTS,
  switchAccount(id){if(!ACCOUNTS.includes(id))throw Error('Unknown synthetic account');
   generation++;owner=id;override=null;delayRead=null;return current();},
  logout(){generation++;owner=null;override=null;delayRead=null;return current();},
  mutateForTest(items){override=items;return current();},
  delayForTest(fn){delayRead=fn;},
  restore(){override=null;delayRead=null;},
  syntheticOnly:true,networkCredentialsUsed:false,productionConnected:false,releaseAuthorized:false
 });
 return control;
}
export function planOwnerBoundSelection10(bound,live,slots){
 const session=live();
 if(!authorized(session)||bound?.ownerId!==session.ownerId||
  bound.generation!==session.generation)
  throw Error('Wardrobe session invalidated before selecting an outfit');
 return bound.planExistingBoard({slots});
}
export function prepareSourceBoundOutfit10({bound,live,slots,bundles}){
 const plan=planOwnerBoundSelection10(bound,live,slots);
 const source=Object.values(plan.selected);
 const mapped=source.map(s=>s.sourceSHA256);
 const shirts=(bundles||[]).map(b=>b?.shirt).filter(Boolean);
 const denims=(bundles||[]).map(b=>b?.pants).filter(Boolean);
 const shirt=shirts.find(p=>p.sourceSHA256===plan.selected.top?.sourceSHA256)||null;
 const pants=denims.find(p=>p.sourceSHA256===plan.selected.bottom?.sourceSHA256)||null;
 const prepared=prepareIndexedGarmentsFor3D(plan,{shirtCandidate:shirt,pantsCandidate:pants});
 return Object.freeze({plan,prepared,
  status:prepared.status==='source-bound-3d-ready-for-provisional-preview'?'verified-3d':'original-photo-2d',
  selectedSourceHashes:mapped,releaseAuthorized:false});
}
export function displaySourceBoundOutfit10({viewer,prepared,live}){
 if(prepared?.status!=='source-bound-3d-ready-for-provisional-preview')
  throw Error('Missing independently verified source 3D mesh; use original photo fallback');
 return applyIndexed3DSelection(viewer,prepared,{checkCurrentSession:live});
}
