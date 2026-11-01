/** Closet Current 3D67 — research-only actual CC0 skinned model viewer.
 * Pure metadata index demonstration is synthetic and never uploads photos.
 * No production, no generated fake textures, no human 10/10 claim.
 */
import {mountAnatomicalShowroom} from '../three-d-15/showroom.mjs';
import {arrangeIndexedOutfit,swapIndexedOutfitItem} from './indexed-closet-3d-contract.mjs';
const $=id=>document.getElementById(id);
const status=t=>$('status').textContent=t;
let app=null,loading=false,closed=false,spinning=false,exampleOutfit=null,frame=0;
const reviews=new Map();
const current=()=>app?.getState()||null;
const validOrigin=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
const ownerId='synthetic-owner-3d67-no-real-wardrobe';
const makeItem=(id,category,itemType,color,tag)=>({
 id,ownerId,sourceId:'synthetic-fixture-'+tag,sourceSHA256:tag.repeat(64).slice(0,64),
 category,itemType,color,recognitionStatus:'confirmed',
 ownerReviewed:true,sourcePhotoOriginal:true,
 threeDimensionalMeshApproved:false,garmentMeshVerified:false
});
const sourceFixtures=Object.freeze([
 makeItem('sample-top','Tops','T-shirt','Navy','a'),
 makeItem('sample-bottom','Bottoms','Jeans','Blue','b'),
 makeItem('sample-swap','Tops','Blouse','Cream','c')
]);
function diagnostics(){
 if(!app)return;
 const s=current();
 $('diagnostics').textContent=JSON.stringify({
  model:s.kind,sourceBones:s.stats?.bones,skinnedMeshes:s.stats?.skinned,
  triangles:s.stats?.triangles,viewportPixels:s.drawPixels,
  truePerspective360:s.premium360Enabled,angle:s.viewAngle,
  camera:s.cameraPosition,aim:s.cameraTarget,
  bodyYaw:s.mannequinBodyYaw,spin:s.spinEnabled,
  renderMs:s.lastRenderMs,frames:s.frames,releaseAuthorized:false
 },null,2);
 $('angleReadout').textContent=Math.round(s.viewAngle||0)+'°';
 $('angle').value=String(Math.round(s.viewAngle||0));
 if(!s.spinEnabled&&spinning){spinning=false;syncSpin();}
}
function syncSpin(){
 $('spin').textContent=spinning?'Stop turning':'Auto-rotate';
 $('spin').setAttribute('aria-pressed',String(spinning));
}
function setAngle(value){
 if(!app||loading)return;
 spinning=false;app.setSpin(false);syncSpin();
 app.viewAt(Number(value));
 for(const button of document.querySelectorAll('[data-angle]'))
  button.setAttribute('aria-pressed',String(Number(button.dataset.angle)===Number(value)));
 diagnostics();
}
async function load(){
 if(loading||closed)return;
 loading=true;status('Loading exact original CC0 163-joint 3D '+$('model').value+' body…');
 $('model').disabled=true;
 try{
  app.setSpin(false);spinning=false;syncSpin();
  await app.load($('model').value);
  app.shade($('finish').value);
  app.resetView();
  const s=current();
  if(s.stats.bones!==163||s.stats.skinned<1||s.stats.triangles<10000)
   throw Error('Original skinned anatomical figure source did not validate');
  $('caption').textContent=(s.kind==='female'?'Female':'Male')+' · original CC0 163-joint skinned 3D';
  status('Actual anatomical 3D figure loaded. Drag to rotate 360°; use pinch to zoom. Research HOLD.');
  diagnostics();
 }catch(e){status('Original anatomy verification blocked: '+String(e?.message||e));}
 finally{loading=false;$('model').disabled=false;}
}
function categoryExample(){
 exampleOutfit=arrangeIndexedOutfit(sourceFixtures.slice(0,2),{ownerId});
 $('categoryResult').textContent=JSON.stringify({
  researchOnly:true,metadataFixtures:'synthetic, no user wardrobe',
  verifiedCategories:exampleOutfit.items.map(i=>({category:i.category,itemType:i.itemType,color:i.color,slot:i.slot})),
  threeDReady:exampleOutfit.threeDReady,
  fallback:exampleOutfit.fallback,
  warning:'Indexing is category-compatible, but synthetic records have NO original photographed cloth meshes. No unapproved 3D fitting.'
 },null,2);
}
function swapExample(){
 if(!exampleOutfit)categoryExample();
 exampleOutfit=swapIndexedOutfitItem(exampleOutfit,'sample-top',sourceFixtures[2]);
 $('categoryResult').textContent=JSON.stringify({
  action:'single-item swap',researchOnly:true,
  items:exampleOutfit.items.map(i=>({id:i.id,category:i.category,itemType:i.itemType,color:i.color,slot:i.slot})),
  threeDReady:exampleOutfit.threeDReady,
  fallback:exampleOutfit.fallback,
  note:'Private indexed wardrobe slot logic only; photographed 3D mesh remains independently gated.'
 },null,2);
}
function exportReview(){
 const s=current();
 const report={
  title:'Closet Current 3D67 anatomical and index-first human quality review',
  capturedAt:new Date().toISOString(),
  figure:s?.kind||null,
  realPerspectiveCameraAngle:s?.viewAngle??null,
  sourceBones:s?.stats?.bones,
  actualSkinnedMeshes:s?.stats?.skinned,
  screenshotsAutomaticallyApproved:false,
  judgedByIndependentHuman:false,
  scoreOutOfTen:null,
  targetScoreOutOfTen:10,
  garmentPhotoIndexContractVerified:Boolean(exampleOutfit?.categoryVerified),
  originalPersonalPhotosLoaded:false,
  phoneHardwareVerified:false,
  familyAlpha:'HOLD',
  releaseAuthorized:false,
  reviews:[...reviews.entries()].map(([angle,comment])=>({angle,comment}))
 };
 const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='closet-current-3d67-visual-review.json';a.click();
 URL.revokeObjectURL(url);
}
function start(){
 if(!validOrigin)throw Error('Original-source anatomical demo restricted to research localhost, no production deployment');
 app=mountAnatomicalShowroom($('avatar'),{premiumTurntable67:true,premiumNeutralSilhouette70:new URLSearchParams(location.search).get('silhouette70')==='after',independentGarments:false});
 app.start();
 $('model').addEventListener('change',load);
 $('finish').addEventListener('change',()=>{app?.shade($('finish').value);diagnostics();});
 document.querySelectorAll('[data-angle]').forEach(button=>button.addEventListener('click',()=>setAngle(button.dataset.angle)));
 $('angle').addEventListener('input',()=>setAngle($('angle').value));
 $('reset').addEventListener('click',()=>setAngle(0));
 $('zoomIn').addEventListener('click',()=>{app.zoom(.85);diagnostics();});
 $('zoomOut').addEventListener('click',()=>{app.zoom(1.17);diagnostics();});
 $('spin').addEventListener('click',()=>{spinning=!spinning;app.setSpin(spinning);syncSpin();diagnostics();});
 $('avatar').addEventListener('pointerdown',()=>{spinning=false;app.setSpin(false);syncSpin();});
 $('avatar').addEventListener('wheel',()=>{spinning=false;app.setSpin(false);syncSpin();},{passive:true});
 $('categoryDemo').addEventListener('click',categoryExample);
 $('swapDemo').addEventListener('click',swapExample);
 $('export').addEventListener('click',exportReview);
 window.cc67Diagnostics=()=>current();
 window.cc67View=degrees=>{setAngle(degrees);return current();};
 window.cc67IndexFixture=()=>{categoryExample();return exampleOutfit;};
 window.addEventListener('pagehide',()=>{closed=true;app?.stop();});
 const loop=()=>{
  if(closed)return;
  if(++frame%12===0&&!loading&&app)diagnostics();
  requestAnimationFrame(loop);
 };requestAnimationFrame(loop);
 return load();
}
start().catch(e=>status('Research-only real 3D model unavailable: '+String(e.message||e)));
