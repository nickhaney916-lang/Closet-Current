/** 3D-02: strictly local, source-bound, voluntarily reviewed licensed mask comparison. */
import {mount3D} from '../three-d-01/webgl-renderer.mjs';
import {SAMPLES,FALLBACK,loadLicensedCutout} from './reviewed-texture.mjs';
const $=id=>document.getElementById(id);
let viewer=null,manifest=null,locked=null,epoch=0,accepted=false,closed=false;
const setStatus=s=>{$('status').textContent=s;};
const opts={
 'commons-0003':{type:'shirt',category:'Tops'},
 'commons-0053':{type:'dress',category:'Dresses'},
 'commons-0021':{type:'pants',category:'Bottoms'}
};
const resetProjection=()=>{
 accepted=false;$('viewer').dataset.cutoutReady='false';$('viewer').dataset.fabricRgb='';
 if(viewer)viewer.setPhoto(null);
};
async function show(){
 const current=++epoch,id=$('sample').value,choice=opts[id];
 if(!choice)throw Error('Unsupported research sample');
 $('review').checked=false;$('apply').disabled=true;
 $('review').disabled=!Object.hasOwn(SAMPLES,id);
 resetProjection();viewer.setScene(choice.type,$('figure').value,choice.type==='shirt'?'long':'short');
 $('fabric-note').textContent='Fabric color not yet source-verified.';
 const row=locked.find(x=>x.id===id);
 if(!row?.verified||!row.attribution?.license)throw Error('Unlicensed source');
 const link=document.createElement('a');link.textContent='Original author, license and source';
 link.href=row.attribution.source;link.rel='noopener noreferrer';link.target='_blank';
 $('credit').replaceChildren(document.createTextNode(row.attribution.title+' · '+row.attribution.license+' · '),link);
 $('original').src='../../benchmark/fixtures/'+row.image;
 $('original').alt='Unchanged licensed '+choice.type+' source photograph';
 const m=manifest.rows.find(x=>x.id===id);
 const hasCandidate=Object.hasOwn(SAMPLES,id)&&m?.hasCutout===true&&m.ownerApproved===false;
 $('cutout').hidden=!hasCandidate;
 $('cutout').src=hasCandidate?'../../benchmark/work47/assets/'+id+'.png':'';
 $('cutout').alt=hasCandidate?'Source-RGB provisional Work47 transparent cutout (not approved)':'No cutout';
 $('fallback').textContent=hasCandidate?
  'Existing source-bound PNG is an unapproved human-review candidate. Compare garment fabric and edge detail before projecting.' :
  'NO RELIABLE REVIEWED CUTOUT. Jeans remain on the original-photo board; 3D only displays the neutral pants template.';
 if(current!==epoch)return;
 setStatus('3D '+choice.type+' template ready; source-mask texture OFF. Visual approval HOLD.');
}
function bindControls(){
 $('review').addEventListener('change',()=>{
  if(!Object.hasOwn(SAMPLES,$('sample').value)){$('review').checked=false;return;}
  $('apply').disabled=!$('review').checked;
  if(!$('review').checked){
   ++epoch;resetProjection();
   setStatus('Mask review unchecked; 3D projection removed. Family Alpha HOLD.');
  }
 });
 $('apply').addEventListener('click',async event=>{
  if(!event.isTrusted||!$('review').checked||$('apply').disabled||closed)return;
  const id=$('sample').value,turn=++epoch;
  if(!Object.hasOwn(SAMPLES,id))return;
  $('apply').disabled=true;setStatus('Checking both original JPEG and reviewed PNG file hashes...');
  try{
   const loaded=await loadLicensedCutout(id,{manifest,reviewConfirmed:true});
   if(closed||turn!==epoch||$('sample').value!==id||!$('review').checked)return;
   viewer.setPhoto(loaded.cutout,{cropRect:loaded.cropRect,baseColor:loaded.baseColor});
   accepted=true;$('viewer').dataset.cutoutReady='true';
   $('viewer').dataset.fabricRgb=loaded.representativeSourceRGB.join(',');
   $('fabric-note').textContent='Source garment median RGB: '+loaded.representativeSourceRGB.join(', ')+'. Same source pixels tint inferred sleeves, edges and rear (not reconstructed fabric).';
   setStatus('3D '+loaded.type+' using validated provisional SOURCE-RGB CUTOUT. Alpha border gated. Shape and rear inferred. NOT visually approved. Family Alpha HOLD.');
  }catch(error){
   if(!closed&&turn===epoch){
    resetProjection();setStatus('Cutout projection blocked: '+error.message+'. Original-photo fallback available.');
   }
  }finally{
   if(!closed&&turn===epoch)$('apply').disabled=!$('review').checked;
  }
 });
 $('sample').addEventListener('change',()=>{show().catch(e=>setStatus('Preview blocked: '+e.message));});
 $('figure').addEventListener('change',()=>{
  if(!viewer||closed)return;
  viewer.setScene(opts[$('sample').value].type,$('figure').value,opts[$('sample').value].type==='shirt'?'long':'short');
  setStatus('3D figure proportions updated. Garment texture '+(accepted?'source-validated provisional':'OFF')+'. Family Alpha HOLD.');
 });
 $('front').onclick=()=>viewer?.setRotation(0);
 $('side').onclick=()=>viewer?.setRotation(Math.PI/2);
 $('back').onclick=()=>viewer?.setRotation(Math.PI);
 $('turn').onclick=()=>viewer?.rotate(Math.PI/6);
}
async function run(){
 if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname))
  throw Error('Offline loopback research-only demo');
 viewer=mount3D($('viewer'),{onRender:r=>{
  $('viewer').dataset.type=r.type;
  $('viewer').dataset.body=r.body;
  $('viewer').dataset.photoProjection=String(r.frontPhotoProjection);
  $('viewer').dataset.sleeveLength=r.sleeveLength;
  $('viewer').dataset.photoMeshes=String(r.photoMeshes);
  $('viewer').dataset.solidGarmentMeshes=String(r.solidGarmentMeshes);
  $('viewer').dataset.sweptSleeves=String(r.sweptSleeves);
  $('viewer').dataset.mannequinHands=String(r.mannequinHands);
 }});
 const [rawManifest,rawLicense]=await Promise.all([
  fetch('../../benchmark/work47/manifest.json',{cache:'no-store'}),
  fetch('../../benchmark/locked-photo-sources.json',{cache:'no-store'})
 ]);
 if(!rawManifest.ok||!rawLicense.ok)throw Error('Reproduce pinned Work47 licensed benchmark assets first');
 manifest=await rawManifest.json();locked=await rawLicense.json();
 if(manifest.release!=='HOLD'||!Array.isArray(manifest.rows)||!Array.isArray(locked))
  throw Error('Non-HOLD benchmark manifest blocked');
 bindControls();const ro=new ResizeObserver(()=>viewer?.draw());ro.observe($('viewer'));
 window.addEventListener('pagehide',()=>{closed=true;epoch++;ro.disconnect();viewer?.dispose();});
 await show();
}
run().catch(e=>setStatus('3D prototype unavailable: '+e.message+'. Keep original photo board.'));
