/** Work60: verified stock shirt + neutral research pants; local ephemeral preview. */
import {mountAnatomicalShowroom} from './showroom.mjs';
import {DRESS_ID} from './dress-shell.mjs';
import {loadLicensedCutout,readVerifiedAsset} from '../three-d-02/reviewed-texture.mjs';
import {LICENSED_SHIRT} from '../three-d-07/rig-shirt-transfer.mjs';
import {loadPantsReference} from '../three-d-13/pants-source.mjs';
const $=id=>document.getElementById(id);
let app,epoch=0,closed=false,spinning=false,manifest,verified=false;const previews=[];
const status=s=>{$('status').textContent=s;};
const sync=()=>{const s=app.getState();$('diagnostics').textContent=JSON.stringify(s);$('avatar').dataset.dress=s.dress?.sourceId||'none';$('dressMode').textContent=s.dress?'Remove real photographed dress':'Review real photographed dress';$('pants').textContent=s.pants?'Pants: on':'Pants: off';$('pants').setAttribute('aria-pressed',String(!!s.pants));$('pants').setAttribute('aria-label',s.pants?'Remove neutral research pants':'Add neutral research pants');$('garment').textContent=s.shirt?'Remove real shirt':'Review black AJ shirt';};
const resetSpin=()=>{spinning=false;app.setSpin(false);$('spin').textContent='Turntable: off';$('spin').setAttribute('aria-pressed','false');};
const clear=()=>{epoch++;app.clearShirt();$('review').checked=false;$('dress').disabled=true;sync();};
const clearDress=()=>{epoch++;app.clearDress();$('dressReview').checked=false;$('dressApply').disabled=true;sync();};
async function applyRealDress(event){
 if(!event.isTrusted||!verified||!$('dressReview').checked||$('dressApply').disabled||closed)return;
 const ticket=++epoch;$('dressApply').disabled=true;
 $('dressStatus').textContent='Rechecking licensed original JPEG/PNG and exact cutout provenance…';
 try{
  const item=await loadLicensedCutout(DRESS_ID,{manifest,reviewConfirmed:true});
  if(closed||ticket!==epoch||!$('dressReview').checked)return;
  resetSpin();
  const result=app.applyDress(item,{reviewed:true});
  $('dressDialog').close();$('review').checked=false;$('dress').disabled=true;
  $('dressStatus').textContent='Original '+result.sourceId+' on a separate skinned dress mesh. Unverified rear; visual acceptance HOLD.';
  status('Original licensed 3D dress preview · '+$('pose').selectedOptions[0].textContent+' · Family Alpha HOLD');
  sync();
 }catch(e){
  if(!closed&&ticket===epoch){app.clearDress();$('dressStatus').textContent='Dress REFUSED: '+e.message;sync();}
 }finally{if(!closed&&ticket===epoch)$('dressApply').disabled=!$('dressReview').checked;}
}
async function load(){
 resetSpin();const t=++epoch;$('avatar').dataset.ready='false';$('pants').disabled=true;$('model').disabled=true;$('garment').disabled=true;$('dressMode').disabled=true;$('review').checked=false;$('dress').disabled=true;$('dressReview').checked=false;$('dressApply').disabled=true;app.clearDress();app.clearShirt();
 status('Opening locally verified figure…');
 try{await app.load($('model').value);if(t!==epoch||closed)return;$('avatar').dataset.ready='true';$('pants').disabled=false;status('Review the AJ shirt to dress this figure · Family Alpha HOLD');sync();}catch(e){if(t===epoch)status('Local preview unavailable: '+e.message);}finally{if(t===epoch){$('model').disabled=false;$('garment').disabled=!verified;$('dressMode').disabled=!verified;}}
}
async function sources(){
 const [r,l]=await Promise.all([fetch('/benchmark/work47/manifest.json'),fetch('/benchmark/locked-photo-sources.json')]);if(!r.ok||!l.ok)throw Error('Pinned benchmark missing');manifest=await r.json();const locked=await l.json(),row=manifest.rows?.find(x=>x.id===LICENSED_SHIRT),license=locked.find(x=>x.id===LICENSED_SHIRT);
 if(manifest.release!=='HOLD'||row?.ownerApproved!==false||!row.hasCutout||!license?.verified||row.sourceSHA256!==license.sha256)throw Error('Licensed source identity not verified');
 const dressRow=manifest.rows?.find(x=>x.id===DRESS_ID),dressLicense=locked.find(x=>x.id===DRESS_ID);
 if(manifest.release!=='HOLD'||dressRow?.ownerApproved!==false||!dressRow.hasCutout||
  !dressLicense?.verified||dressRow.sourceSHA256!==dressLicense.sha256||
  !/^[a-f0-9]{64}$/.test(dressRow.cutoutSHA256||''))
   throw Error('Real photographed dress source not verified');
 const dressBlobs=await Promise.all([
  readVerifiedAsset('/benchmark/work47/assets/'+DRESS_ID+'.jpg',dressRow.sourceSHA256),
  readVerifiedAsset('/benchmark/work47/assets/'+DRESS_ID+'.png',dressRow.cutoutSHA256)
 ]);
 for(const [i,id]of ['dressOriginal','dressCutout'].entries()){
  const url=URL.createObjectURL(dressBlobs[i]);previews.push(url);$(id).src=url;await $(id).decode();
 }
 const dressCredit=document.createElement('a');dressCredit.href=dressLicense.attribution.source;
 dressCredit.textContent=dressLicense.attribution.title+' · '+dressLicense.attribution.license;
 dressCredit.rel='noopener noreferrer';dressCredit.target='_blank';$('dressCredit').append(dressCredit);
 const pantsRef=await loadPantsReference(manifest,locked);const pantsUrl=URL.createObjectURL(pantsRef.blob);previews.push(pantsUrl);$('pantsOriginal').src=pantsUrl;await $('pantsOriginal').decode();$('pantsReferenceStatus').textContent='Original SHA-256 verified · '+pantsRef.policy.reason+' Neutral mesh only; no photograph applied. ';const pantsCredit=document.createElement('a');pantsCredit.href=pantsRef.policy.attribution.source;pantsCredit.textContent=pantsRef.policy.attribution.author+' · '+pantsRef.policy.attribution.license;pantsCredit.target='_blank';pantsCredit.rel='noopener noreferrer';$('pantsReferenceStatus').append(pantsCredit);
 const blobs=await Promise.all([readVerifiedAsset('/benchmark/work47/assets/'+LICENSED_SHIRT+'.jpg',row.sourceSHA256),readVerifiedAsset('/benchmark/work47/assets/'+LICENSED_SHIRT+'.png',row.cutoutSHA256)]);
 for(const [i,id] of ['original','cutout'].entries()){const u=URL.createObjectURL(blobs[i]);previews.push(u);$(id).src=u;await $(id).decode();}
 const link=document.createElement('a');link.href=license.attribution.source;link.textContent='Licensed source · '+license.attribution.license;link.target='_blank';link.rel='noopener noreferrer';$('credit').append(link);verified=true;
}
async function apply(event){
 if(!event.isTrusted||!verified||!$('review').checked||$('dress').disabled||closed)return;
 const t=++epoch;$('dress').disabled=true;$('photoStatus').textContent='Verifying original RGB and cutout hashes…';
 try{const source=await loadLicensedCutout(LICENSED_SHIRT,{manifest,reviewConfirmed:true});if(t!==epoch||closed||!$('review').checked)return;resetSpin();app.applyShirt(source,{acknowledged:true});$('reviewDialog').close();status('Real AJ shirt · '+$('pose').selectedOptions[0].textContent+' · Family Alpha HOLD');sync();}catch(e){if(t===epoch){app.clearShirt();$('photoStatus').textContent='Shirt blocked: '+e.message;}}finally{if(t===epoch)$('dress').disabled=!$('review').checked;}
}
async function start(){
 if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname))throw Error('Local research access only');
 app=mountAnatomicalShowroom($('avatar'),{pantsEnabled:true});$('garment').disabled=true;$('dressMode').disabled=true;
 $('garment').addEventListener('click',()=>{if(app.getState().shirt){clear();status('Shirt removed · Family Alpha HOLD');}else{$('review').checked=false;$('dress').disabled=true;$('photoStatus').textContent='Source photo and mask verified. Research review only.';$('reviewDialog').showModal();}});
 $('dressMode').addEventListener('click',()=>{
  if(app.getState().dress){clearDress();status('3D dress removed. Family Alpha HOLD');}
  else{$('dressReview').checked=false;$('dressApply').disabled=true;
    $('dressStatus').textContent='Source verified. Still a provisional visual-research garment.';
    $('dressDialog').showModal();}
 });
 $('dressReview').addEventListener('change',()=>{
  if(!$('dressReview').checked){epoch++;if(app.getState().dress)app.clearDress();sync();}
  $('dressApply').disabled=!$('dressReview').checked;
 });
 $('dressApply').addEventListener('click',applyRealDress);
 $('closeDress').addEventListener('click',()=>{
  $('dressDialog').close();epoch++;$('dressReview').checked=false;$('dressApply').disabled=true;
 });
 $('dressDialog').addEventListener('cancel',()=>{
  epoch++;$('dressReview').checked=false;$('dressApply').disabled=true;
 });
 $('review').addEventListener('change',()=>{if(!$('review').checked)epoch++;$('dress').disabled=!$('review').checked;});$('dress').addEventListener('click',apply);$('closeReview').addEventListener('click',()=>{$('reviewDialog').close();epoch++;});$('reviewDialog').addEventListener('cancel',()=>{epoch++;$('review').checked=false;$('dress').disabled=true;});
 $('pants').addEventListener('click',()=>{if(app.getState().pants)app.clearPants();else app.applyPants();sync();});
 $('model').addEventListener('change',load);$('finish').addEventListener('change',()=>{app.shade($('finish').value);sync();});
 $('pose').addEventListener('change',()=>{resetSpin();app.setPose($('pose').value);$('caption').textContent=$('pose').value==='relaxed'?'RELAXED POSE · HOLD':'SOURCE FITTING POSE · HOLD';status('Same shirt / same skeleton · Family Alpha HOLD');sync();});
 for(const name of ['front','side','back','threequarter'])$(name).addEventListener('click',()=>{resetSpin();for(const id of ['front','side','back','threequarter'])$(id).setAttribute('aria-pressed',String(id===name));name==='threequarter'?app.rotate(30):app[name]();sync();});
 $('zoomIn').addEventListener('click',()=>{app.zoom(.86);sync();});$('zoomOut').addEventListener('click',()=>{app.zoom(1.16);sync();});$('reset').addEventListener('click',()=>{$('front').click();});
 $('spin').addEventListener('click',()=>{spinning=!spinning;app.setSpin(spinning);$('spin').textContent='Turntable: '+(spinning?'on':'off');$('spin').setAttribute('aria-pressed',String(spinning));});
 window.addEventListener('pagehide',()=>{closed=true;epoch++;app.stop();previews.forEach(u=>URL.revokeObjectURL(u));});window.work60Diagnostics=()=>app.getState();window.unified3DDiagnostics=()=>app.getState();
 app.start();await sources();await load();
}
start().catch(e=>{status('Preview blocked: '+e.message);$('garment').disabled=true;});
