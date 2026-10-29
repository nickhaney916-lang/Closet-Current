import {mountDressStudio} from './showroom.mjs';
import {loadLicensedCutout,readVerifiedAsset} from '../three-d-02/reviewed-texture.mjs';
import {DRESS_ID} from './dress-shell.mjs';
const $=id=>document.getElementById(id);
let app=null,manifest=null,epoch=0,closed=false,ready=false;
const sources=[];
function status(message){$('status').textContent=message;}
function drop(){epoch++;app?.clearDress();$('review').checked=false;$('apply').disabled=true;
 $('info').textContent='Dress removed. No original source approved or saved. Family Alpha HOLD.';}
async function loadBody(){
 const t=++epoch;ready=false;$('apply').disabled=true;$('review').checked=false;
 status('Checking original CC0 rig…');
 try{
  await app.load($('model').value);
  if(t!==epoch||closed)return;
  ready=true;$('avatar').dataset.ready='true';
  app.setPose($('pose').value);
  status('Anatomical figure ready. Review original source and provisional cutout before preview.');
 }catch(e){if(t===epoch)status('Fail closed: '+e.message);}
}
async function apply(event){
 if(!event.isTrusted||!ready||!$('review').checked||$('apply').disabled||closed)return;
 const t=++epoch;$('apply').disabled=true;
 $('info').textContent='Verifying unchanged licensed dress cutout before 3D attachment…';
 try{
  const item=await loadLicensedCutout(DRESS_ID,{manifest,reviewConfirmed:true});
  if(t!==epoch||closed||!$('review').checked)return;
  const result=app.apply(item,{reviewed:true});
  $('avatar').dataset.sourceId=result.sourceId;
  $('avatar').dataset.release='HOLD';
  $('info').textContent='Source-verified '+result.sourceId+' on real skinned 3D shell ('+
   result.triangles+' triangles). Front photo only; inferred rear. NOT visually accepted.';
 }catch(e){if(t===epoch){app.clearDress();$('info').textContent='Preview blocked: '+e.message;}}
 finally{if(t===epoch&&!closed)$('apply').disabled=!$('review').checked||!ready;}
}
async function start(){
 if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname))
  throw Error('Local research only, no public deployment');
 app=mountDressStudio($('avatar'),{onChange:x=>{$('avatar').dataset.bones=String(x.bones);}});
 app.start();
 const [m,l]=await Promise.all([fetch('/benchmark/work47/manifest.json'),
  fetch('/benchmark/locked-photo-sources.json')]);
 if(!m.ok||!l.ok)throw Error('Source-locked Work47 benchmark missing');
 manifest=await m.json();
 const licenses=await l.json(),row=manifest.rows?.find(r=>r.id===DRESS_ID),
  license=licenses.find(r=>r.id===DRESS_ID);
 if(manifest.release!=='HOLD'||!row?.hasCutout||row.ownerApproved!==false||
  !license?.verified||row.sourceSHA256!==license.sha256||
  !/^[a-f0-9]{64}$/.test(row.cutoutSHA256||''))throw Error('Unreviewed/unlicensed dress forbidden');
 const blobs=await Promise.all([
  readVerifiedAsset('/benchmark/work47/assets/'+DRESS_ID+'.jpg',row.sourceSHA256),
  readVerifiedAsset('/benchmark/work47/assets/'+DRESS_ID+'.png',row.cutoutSHA256)
 ]);
 for(const [i,id] of ['original','cutout'].entries()){
  const uri=URL.createObjectURL(blobs[i]);sources.push(uri);$(id).src=uri;await $(id).decode();
 }
 const link=document.createElement('a');link.href=license.attribution.source;
 link.target='_blank';link.rel='noopener noreferrer';link.textContent=license.attribution.title+' · '+license.attribution.license;
 $('license').replaceChildren(link);
 $('model').addEventListener('change',loadBody);
 $('pose').addEventListener('change',()=>{app.setPose($('pose').value);status('Source-based outfit remains on same skeleton. Visual approval HOLD.');});
 $('review').addEventListener('change',()=>{if(!$('review').checked)drop();
  else $('apply').disabled=!ready;});
 $('apply').addEventListener('click',apply);
 $('remove').addEventListener('click',drop);
 for(const [id,angle] of [['front',0],['threequarter',30],['side',90],['back',180]])
  $(id).addEventListener('click',()=>app.view(angle));
 window.addEventListener('pagehide',()=>{closed=true;epoch++;app.stop();sources.forEach(x=>URL.revokeObjectURL(x));});
 await loadBody();
}
start().catch(e=>{status('Research preview blocked: '+e.message);$('apply').disabled=true;});
