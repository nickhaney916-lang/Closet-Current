/** One ephemeral reviewed outfit at a time; original assets and accounts never written. */
import {mountAnatomicalShowroom} from './showroom.mjs';
import {sourceForOutfit} from './outfit-controller.mjs';
import {loadLicensedCutout,readVerifiedAsset} from '../three-d-02/reviewed-texture.mjs';
import {loadPantsReference} from '../three-d-13/pants-source.mjs';
const $=id=>document.getElementById(id),urls=[],records=new Map();
let app,manifest,epoch=0,closed=false,ready=false,pending=null,spinning=false;
const status=t=>{$('status').textContent=t;};
function sync(){const s=app.getState();$('outfit').value=s.outfit?.mode||'none';$('diagnostics').textContent=JSON.stringify(s);$('caption').textContent='RESEARCH OUTFIT · HOLD';}
function resetSpin(){spinning=false;app.setSpin(false);$('spin').textContent='Turntable: off';$('spin').setAttribute('aria-pressed','false');}
function cancel(){epoch++;pending=null;$('review').checked=false;$('dress').disabled=true;$('reviewDialog').close();if(app)sync();}
async function load(){
 cancel();resetSpin();const token=++epoch;ready=false;$('avatar').dataset.ready='false';$('model').disabled=true;$('outfit').disabled=true;$('remove').disabled=true;status('Opening verified local figure…');
 try{await app.load($('model').value);if(closed||token!==epoch)return;ready=true;$('avatar').dataset.ready='true';status('Choose an outfit · Pants are neutral research cloth · HOLD');sync();}
 catch(e){if(token===epoch)status('Local preview blocked: '+e.message);}
 finally{if(token===epoch){$('model').disabled=false;$('outfit').disabled=!ready;$('remove').disabled=!ready;}}
}
async function prepareSources(){
 const [m,l]=await Promise.all([fetch('/benchmark/work47/manifest.json'),fetch('/benchmark/locked-photo-sources.json')]);if(!m.ok||!l.ok)throw Error('Pinned benchmark unavailable');manifest=await m.json();const locked=await l.json();
 for(const id of ['commons-0003','commons-0053']){
  const row=manifest.rows?.find(r=>r.id===id),license=locked.find(r=>r.id===id);
  if(manifest.release!=='HOLD'||!row?.hasCutout||row.ownerApproved!==false||!license?.verified||row.sourceSHA256!==license.sha256)throw Error('Source identity/review mismatch');
  const blobs=await Promise.all([readVerifiedAsset('/benchmark/work47/assets/'+id+'.jpg',row.sourceSHA256),readVerifiedAsset('/benchmark/work47/assets/'+id+'.png',row.cutoutSHA256)]);
  const images=blobs.map(b=>{const url=URL.createObjectURL(b);urls.push(url);return url;});records.set(id,{images,license});
 }
 const pants=await loadPantsReference(manifest,locked),url=URL.createObjectURL(pants.blob);urls.push(url);$('pantsOriginal').src=url;await $('pantsOriginal').decode();$('pantsReferenceStatus').textContent='Verified original reference only. '+pants.policy.reason+' No pants photograph is applied.';
}
async function choose(event){
 if(!ready||closed)return;const next=$('outfit').value,id=sourceForOutfit(next);resetSpin();
 if(!id){app.applyOutfit(next);status(next==='none'?'Garments removed · HOLD':'Neutral pants · No pants photograph applied · HOLD');sync();return;}
 cancel();pending={mode:next,id};const token=++epoch,record=records.get(id);$('reviewTitle').textContent=next==='dress'?'Review the photographed dress':'Review the photographed AJ shirt';$('original').src=record.images[0];$('cutout').src=record.images[1];$('review').checked=false;$('dress').disabled=true;$('photoStatus').textContent='Provisional cutout · Not visually accepted';
 const link=document.createElement('a');link.href=record.license.attribution.source;link.textContent=record.license.attribution.license+' · '+record.license.attribution.author;link.target='_blank';link.rel='noopener noreferrer';$('credit').replaceChildren(link);
 await Promise.all([$('original').decode(),$('cutout').decode()]);if(token!==epoch||closed)return;$('reviewDialog').showModal();
}
async function apply(event){
 if(!event.isTrusted||!ready||!pending||!$('review').checked||$('dress').disabled||closed)return;
 const request={...pending},token=++epoch;$('dress').disabled=true;$('photoStatus').textContent='Verifying original and transparent cutout SHA-256…';
 try{const source=await loadLicensedCutout(request.id,{manifest,reviewConfirmed:true});if(token!==epoch||closed||!ready||!$('review').checked)return;app.applyOutfit(request.mode,source,{reviewed:true});pending=null;$('reviewDialog').close();status(request.mode==='dress'?'Photographed dress · Shirt and pants removed · HOLD':'Photographed AJ shirt · Neutral pants where selected · HOLD');sync();}
 catch(e){if(token===epoch){$('photoStatus').textContent='Change blocked; current outfit retained: '+e.message;sync();}}
 finally{if(token===epoch)$('dress').disabled=!$('review').checked;}
}
async function start(){
 if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname))throw Error('Local research access only');
 app=mountAnatomicalShowroom($('avatar'),{refineFit:new URLSearchParams(location.search).get('version')!=='before'});app.start();
 $('model').addEventListener('change',load);$('outfit').addEventListener('change',choose);$('remove').addEventListener('click',()=>{cancel();resetSpin();app.applyOutfit('none');status('All garments removed · HOLD');sync();});
 $('review').addEventListener('change',()=>{if(!$('review').checked)epoch++;$('dress').disabled=!$('review').checked||!ready;});$('dress').addEventListener('click',apply);$('closeReview').addEventListener('click',cancel);$('reviewDialog').addEventListener('cancel',event=>{event.preventDefault();cancel();});
 $('pose').addEventListener('change',()=>{resetSpin();app.setPose($('pose').value);sync();});
 for(const name of ['front','side','back','threequarter'])$(name).addEventListener('click',()=>{resetSpin();for(const id of ['front','side','back','threequarter'])$(id).setAttribute('aria-pressed',String(id===name));name==='threequarter'?app.rotate(30):app[name]();sync();});
 $('zoomIn').addEventListener('click',()=>{app.zoom(.86);sync();});$('zoomOut').addEventListener('click',()=>{app.zoom(1.16);sync();});$('reset').addEventListener('click',()=>{$('front').click();});$('finish').addEventListener('change',()=>{app.shade($('finish').value);sync();});
 $('spin').addEventListener('click',()=>{spinning=!spinning;app.setSpin(spinning);$('spin').textContent='Turntable: '+(spinning?'on':'off');$('spin').setAttribute('aria-pressed',String(spinning));});
 window.work61Diagnostics=()=>app.getState();window.addEventListener('pagehide',()=>{closed=true;epoch++;app.stop();urls.forEach(u=>URL.revokeObjectURL(u));});
 await prepareSources();await load();
}
start().catch(e=>{status('Preview blocked: '+e.message);$('outfit').disabled=true;$('remove').disabled=true;});
