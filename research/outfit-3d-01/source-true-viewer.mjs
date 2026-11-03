/**
 * OUTFIT-3D-01: reuse existing 163-bone anatomical renderer; never fabricate
 * 3D garment source from an arbitrary camera photo. Independently verified
 * licensed original JPEG+cutout candidates are the ONLY approved 3D cases.
 * Other saved garment IDs remain real original-photo/2D slots, visibly labeled.
 */
import {planIndexedBoardToAnatomical3D} from '../three-d-68/saved-closet-3d-adapter.mjs';
const DRESS_SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
const SHIRT_SHA='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
const DENIM_SHAS=Object.freeze([
 'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
 'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
]);
export const OUTFIT3D_PINNED_SOURCE_SHA=Object.freeze({dress:DRESS_SHA,shirt:SHIRT_SHA,denim:DENIM_SHAS});
export function decideOutfit3D01(plan){
 if(!plan?.ownerId||!Number.isSafeInteger(plan.generation)||!Array.isArray(plan.selected)||
   !Array.isArray(plan.missing)||!Array.isArray(plan.needsReview))
  throw Error('Private verified wardrobe presentation required');
 const top=plan.selected.find(x=>x.slot==='top'),bottom=plan.selected.find(x=>x.slot==='bottom');
 const renderable=[];
 if(top?.category==='Dresses'&&top.originalSHA256===DRESS_SHA)
  renderable.push(top);
 else if(top?.category==='Tops'&&top.itemType==='T-shirt'&&top.originalSHA256===SHIRT_SHA)
  renderable.push(top);
 // Denims are renderable ONLY as a paired verified original shirt outfit:
 // a bare lower body with an unsupported top must never imply complete 3D.
 if(renderable[0]?.category==='Tops'&&bottom?.itemType==='Jeans'&&
    DENIM_SHAS.includes(bottom.originalSHA256))renderable.push(bottom);
 const renderedIds=renderable.map(x=>x.itemId);
 const fallback=plan.selected.filter(x=>!renderedIds.includes(x.itemId));
 const mode=renderable[0]?.category==='Dresses'?'dress':
  renderable.length===2?'shirt-pants':renderable.length===1?'shirt':'none';
 return Object.freeze({mode,renderedIds:Object.freeze(renderedIds),
  fallbackIds:Object.freeze(fallback.map(x=>x.itemId)),
  fallbackSlots:Object.freeze(fallback.map(x=>x.slot)),
  complete3D:renderedIds.length>0&&fallback.length===0&&!plan.missing.length&&!plan.needsReview.length,
  partial3D:renderedIds.length>0&&fallback.length>0,
  neutralRearRequired:true,sourceFrontOnly:true,releaseAuthorized:false});
}
export async function loadVettedOutfit3D01Sources(){
 // Only the existing source-verified loaders may mint source capabilities.
 const [{loadLicensedCutout},{loadSourceVetted3D69ResearchBundle}]=await Promise.all([
  import('../three-d-02/reviewed-texture.mjs'),
  import('../three-d-69/sha-verified-original-garment-sources.mjs')
 ]);
 const manifestResponse=await fetch('/benchmark/work47/manifest.json',{cache:'no-store'});
 if(!manifestResponse.ok)throw Error('Pinned licensed dress manifest not accessible');
 const manifest=await manifestResponse.json();
 const dress=await loadLicensedCutout('commons-0053',{manifest,reviewConfirmed:true});
 if(dress.sourceSHA256!==DRESS_SHA||!dress.realFabricTexture)throw Error('Pinned original dress source invalid');
 const bundles=[];
 try{
  for(const denim of ['public','second']){
   const loaded=await loadSourceVetted3D69ResearchBundle({denim});
   bundles.push(loaded);
  }
  if(bundles[0].shirt.sourceSHA256!==SHIRT_SHA||
   bundles.some((b,i)=>b.pants.sourceSHA256!==DENIM_SHAS[i]))
   throw Error('Pinned original photographed shirt or denim SHA changed');
  return Object.freeze({dress,bundles:Object.freeze(bundles),
   dispose(){for(const b of bundles)b.dispose();},
   releaseAuthorized:false,source:'locked-licensed-original-photographs'});
 }catch(e){for(const b of bundles)b.dispose();throw e;}
}
export function createSourceTrueOutfit3D01Viewer({viewer,controller,sources}={}){
 if(typeof viewer?.applyOutfit!=='function'||typeof viewer?.getState!=='function'||
   typeof controller?.sourceIndex!=='function'||!sources?.dress||!Array.isArray(sources?.bundles))
  throw Error('Loaded verified anatomical viewer and source materials required');
 let lastKey=null,renderCalls=0,reuseCalls=0,closed=false;
 function now(){if(closed)throw Error('3D source viewer closed');return controller.checkCurrentSession();}
 function present(plan){
  const owner=now();
  if(owner.ownerId!==plan?.ownerId||owner.generation!==plan.generation)
   throw Error('Private outfit selection belongs to different session');
  const decision=decideOutfit3D01(plan),state=viewer.getState();
  if(state.loaded!==true||state.stats?.bones!==163||state.releaseAuthorized!==false)
   throw Error('Source-vetted 163-bone anatomical figure required');
  const key=[owner.ownerId,owner.generation,state.kind,decision.mode,...decision.renderedIds.map(id=>id+':'+(plan.selected.find(x=>x.itemId===id)?.originalSHA256||''))].join('\u0000');
  if(lastKey===key){reuseCalls++;return Object.freeze({...decision,reusedRenderer:true,
   actualMode:state.outfit?.mode||'none',meshCount:state.outfit?.garmentMeshes||0});}
  // A source or outfit change must detach/dispose stale meshes. Existing
  // showroom applies its transactional outfit replacement; never reload rig.
  if(decision.mode==='none'){
   viewer.applyOutfit('none');renderCalls++;lastKey=key;
   return Object.freeze({...decision,actualMode:'none',meshCount:0,reusedRenderer:false});
  }
  if(decision.mode==='dress'){
   const dressPiece=plan.selected.find(x=>x.slot==='top');
   if(!dressPiece||dressPiece.originalSHA256!==sources.dress.sourceSHA256)
    throw Error('Dress source not verified, cannot attach a fake mesh');
   viewer.applyOutfit('dress',sources.dress,{reviewed:true});
   const actual=viewer.getState().outfit;
   if(actual?.mode!=='dress'||actual.slots?.includes('pants')||actual.shirt||
    !actual.dress||actual.dress.sourceSHA256!==DRESS_SHA)
    throw Error('Dress rendering must be one independent real photo garment');
   lastKey=key;renderCalls++;
   return Object.freeze({...decision,actualMode:'dress',meshCount:actual.garmentMeshes,reusedRenderer:false});
  }
  const indexed=controller.sourceIndex(),restricted={};
  for(const slot of ['top','bottom']){
   const field=plan.selected.find(x=>x.slot===slot&&decision.renderedIds.includes(x.itemId));
   if(field)restricted[slot]=field.itemId;
  }
  const indexedPlan=planIndexedBoardToAnatomical3D({slots:restricted},indexed);
  const bundle=decision.mode==='shirt-pants'?
   sources.bundles.find(b=>b.pants.sourceSHA256===plan.selected.find(x=>x.slot==='bottom')?.originalSHA256):
   sources.bundles[0];
  if(!bundle)throw Error('Original source-bound denim candidate unavailable');
  const {prepareIndexedGarmentsFor3D,applyIndexed3DSelection}=awaitlessModules();
  const prepared=prepareIndexedGarmentsFor3D(indexedPlan,{
   shirtCandidate:bundle.shirt,pantsCandidate:decision.mode==='shirt-pants'?bundle.pants:null
  });
  if(prepared.status!=='source-bound-3d-ready-for-provisional-preview')
   throw Error('No verified source 3D approved; original-photo fallback required');
  const receipt=applyIndexed3DSelection(viewer,prepared,{checkCurrentSession:now});
  if(!receipt.realPhotoApplied||receipt.real3DSkinnedGarmentMeshes<1)
   throw Error('Original garment meshes not actually displayed');
  lastKey=key;renderCalls++;
  return Object.freeze({...decision,actualMode:receipt.mode,meshCount:receipt.real3DSkinnedGarmentMeshes,
   genuinePhotoSHA256s:receipt.originalPhotoSHA256s,reusedRenderer:false});
 }
 let deps=null;
 function awaitlessModules(){
  if(!deps)throw Error('3D viewer source modules not initialized');
  return deps;
 }
 async function ready(){
  deps=await import('../three-d-69/index-to-real-garment-viewer.mjs');
  return true;
 }
 function stats(){now();return Object.freeze({renderCalls,reuseCalls,keyActive:lastKey!==null,
  geometries:viewer.getState().geometries,textures:viewer.getState().textures,
  figure:viewer.getState().kind,bones:viewer.getState().stats?.bones||0});}
 function clear(){
  lastKey=null;
  if(!closed){try{viewer.applyOutfit('none');renderCalls++;}catch{}}
 }
 function dispose(){if(closed)return;clear();closed=true;}
 return Object.freeze({ready,present,clear,stats,dispose});
}
