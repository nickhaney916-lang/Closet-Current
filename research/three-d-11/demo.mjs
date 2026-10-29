/** Work58: local, verified stock shirt; no accounts, wardrobe storage or AI. */
import {mountAnatomicalShowroom} from './showroom.mjs';
import {loadLicensedCutout,readVerifiedAsset} from '../three-d-02/reviewed-texture.mjs';
import {LICENSED_SHIRT} from '../three-d-07/rig-shirt-transfer.mjs';
const $=id=>document.getElementById(id);
let app,epoch=0,closed=false,spinning=false,manifest,verified=false;const previews=[];
const status=s=>{$('status').textContent=s;};
const sync=()=>{const s=app.getState();$('diagnostics').textContent=JSON.stringify(s);$('garment').textContent=s.shirt?'Remove real shirt':'Review black AJ shirt';};
const resetSpin=()=>{spinning=false;app.setSpin(false);$('spin').textContent='Turntable: off';$('spin').setAttribute('aria-pressed','false');};
const clear=()=>{epoch++;app.clearShirt();$('review').checked=false;$('dress').disabled=true;sync();};
async function load(){
 resetSpin();const t=++epoch;$('avatar').dataset.ready='false';$('model').disabled=true;$('garment').disabled=true;$('review').checked=false;$('dress').disabled=true;app.clearShirt();
 status('Opening locally verified figure…');
 try{await app.load($('model').value);if(t!==epoch||closed)return;$('avatar').dataset.ready='true';status('Review the AJ shirt to dress this figure · Family Alpha HOLD');sync();}catch(e){if(t===epoch)status('Local preview unavailable: '+e.message);}finally{if(t===epoch){$('model').disabled=false;$('garment').disabled=!verified;}}
}
async function sources(){
 const [r,l]=await Promise.all([fetch('/benchmark/work47/manifest.json'),fetch('/benchmark/locked-photo-sources.json')]);if(!r.ok||!l.ok)throw Error('Pinned benchmark missing');manifest=await r.json();const locked=await l.json(),row=manifest.rows?.find(x=>x.id===LICENSED_SHIRT),license=locked.find(x=>x.id===LICENSED_SHIRT);
 if(manifest.release!=='HOLD'||row?.ownerApproved!==false||!row.hasCutout||!license?.verified||row.sourceSHA256!==license.sha256)throw Error('Licensed source identity not verified');
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
 app=mountAnatomicalShowroom($('avatar'),{improved:new URLSearchParams(location.search).get('version')!=='before'});$('garment').disabled=true;
 $('garment').addEventListener('click',()=>{if(app.getState().shirt){clear();status('Shirt removed · Family Alpha HOLD');}else{$('review').checked=false;$('dress').disabled=true;$('photoStatus').textContent='Source photo and mask verified. Research review only.';$('reviewDialog').showModal();}});
 $('review').addEventListener('change',()=>{if(!$('review').checked)epoch++;$('dress').disabled=!$('review').checked;});$('dress').addEventListener('click',apply);$('closeReview').addEventListener('click',()=>{$('reviewDialog').close();epoch++;});$('reviewDialog').addEventListener('cancel',()=>{epoch++;$('review').checked=false;$('dress').disabled=true;});
 $('model').addEventListener('change',load);$('finish').addEventListener('change',()=>{app.shade($('finish').value);sync();});
 $('pose').addEventListener('change',()=>{resetSpin();app.setPose($('pose').value);$('caption').textContent=$('pose').value==='relaxed'?'RELAXED · REAL PHOTOGRAPH':'SOURCE FITTING POSE';status('Same shirt / same skeleton · Family Alpha HOLD');sync();});
 for(const name of ['front','side','back','threequarter'])$(name).addEventListener('click',()=>{resetSpin();for(const id of ['front','side','back','threequarter'])$(id).setAttribute('aria-pressed',String(id===name));name==='threequarter'?app.rotate(30):app[name]();sync();});
 $('zoomIn').addEventListener('click',()=>{app.zoom(.86);sync();});$('zoomOut').addEventListener('click',()=>{app.zoom(1.16);sync();});$('reset').addEventListener('click',()=>{$('front').click();});
 $('spin').addEventListener('click',()=>{spinning=!spinning;app.setSpin(spinning);$('spin').textContent='Turntable: '+(spinning?'on':'off');$('spin').setAttribute('aria-pressed',String(spinning));});
 window.addEventListener('pagehide',()=>{closed=true;epoch++;app.stop();previews.forEach(u=>URL.revokeObjectURL(u));});window.work59Diagnostics=()=>app.getState();
 app.start();await sources();await load();
}
start().catch(e=>{status('Preview blocked: '+e.message);$('garment').disabled=true;});
