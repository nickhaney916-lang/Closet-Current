/** Source-bound 3D-07: only real licensed shirt; never customer photos. */
import {mountAnatomicalShowroom} from './shell-showroom.mjs';
import {loadLicensedCutout,readVerifiedAsset} from '../three-d-02/reviewed-texture.mjs';
import {LICENSED_SHIRT} from '../three-d-07/rig-shirt-transfer.mjs';
const $=id=>document.getElementById(id);
let app=null,epoch=0,closed=false,manifest=null,original=null,spin=false;
const status=s=>{$('status').textContent=s;};
const photoStatus=s=>{$('photoStatus').textContent=s;};
const clear=()=>{
 epoch++;
 $('review').checked=false;$('dress').disabled=true;
 $('avatar').dataset.photoApproved='false';$('avatar').dataset.photoSource='';
 app?.clearShirt();
 photoStatus('Photo projection OFF. Unapproved source; original-photo board remains available.');
};
async function changeBody(){
 const ticket=++epoch;
 $('avatar').dataset.ready='false';
 $('dress').disabled=true;$('review').checked=false;
 app.clearShirt();
 try{
  await app.load($('model').value);
  if(closed||ticket!==epoch)return;
  const st=app.getState();
  $('avatar').dataset.ready='true';
  $('avatar').dataset.skinnedMeshes=String(st.stats.skinned);
  $('avatar').dataset.triangles=String(st.stats.triangles);
  $('avatar').dataset.bones=String(st.stats.bones);
  status('Verified '+st.kind+' CC0 anatomical humanoid. Shirt review required. Family Alpha HOLD.');
  photoStatus('No photographed clothing on body; explicit review required.');
 }catch(e){if(ticket===epoch)status('Local body blocked: '+e.message);}
}
async function applyPhoto(event){
 if(!event?.isTrusted||closed||!$('review').checked||$('dress').disabled)return;
 const ticket=++epoch;
 $('dress').disabled=true;
 photoStatus('Verifying original JPEG, provisional PNG and source alpha hashes…');
 try{
  const source=await loadLicensedCutout(LICENSED_SHIRT,{
   manifest,reviewConfirmed:true
  });
  if(closed||ticket!==epoch||!$('review').checked)return;
  const decision=app.applyShirt(source,{acknowledged:true,mode:$("mode").value});
  $('avatar').dataset.photoApproved='false';
  $('avatar').dataset.photoSource=source.id;
  $('avatar').dataset.shirt='source-reviewed';
  $('avatar').dataset.sourceRGB=source.representativeSourceRGB.join(',');
  photoStatus('Source-verified shirt: '+$('mode').selectedOptions[0].textContent+'. '+
   'Rear/side inferred; NO cloth fit or human visual approval. Family Alpha HOLD.');
  $('metadata').textContent+=' · Reviewed image '+source.id+
   ' · source hash '+decision.sourceSHA256.slice(0,12)+'…';
 }catch(e){
  if(!closed&&ticket===epoch){app.clearShirt();photoStatus('Garment projection blocked: '+e.message);}
 }finally{if(!closed&&ticket===epoch)$('dress').disabled=!$('review').checked;}
}
async function run(){
 if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname))
  throw Error('Only localhost research access is permitted');
 app=mountAnatomicalShowroom($('avatar'),{onChange:({kind,stats})=>{
  $('avatar').dataset.model=kind;
  $('avatar').dataset.bones=String(stats.bones);
  $('avatar').dataset.license='CC0-1.0';
  $('metadata').textContent='Rigged human '+kind+' · '+stats.bones+
   ' source bones · '+stats.triangles+' triangles · real skinned WebGL mesh';
 }});
 const [r,licenses]=await Promise.all([
  fetch('../../benchmark/work47/manifest.json',{cache:'no-store'}),
  fetch('../../benchmark/locked-photo-sources.json',{cache:'no-store'})
 ]);
 if(!r.ok||!licenses.ok)throw Error('Original pinned Work47 benchmark must be built first');
 manifest=await r.json();
 const locked=await licenses.json();
 const row=manifest.rows?.find(x=>x.id===LICENSED_SHIRT);
 const license=locked.find(x=>x.id===LICENSED_SHIRT);
 if(manifest.release!=='HOLD'||row?.ownerApproved!==false||!row.hasCutout||
  !row.cutoutSHA256||!license?.verified||row.sourceSHA256!==license.sha256)
  throw Error('Benchmark/CC license/source identity not verified');
 // Source previews are never silently promoted to human approval.
 await Promise.all([
  readVerifiedAsset('/benchmark/work47/assets/'+LICENSED_SHIRT+'.jpg',row.sourceSHA256),
  readVerifiedAsset('/benchmark/work47/assets/'+LICENSED_SHIRT+'.png',row.cutoutSHA256)
 ]);
 $('original').src='../../benchmark/work47/assets/'+LICENSED_SHIRT+'.jpg';
 $('cutout').src='../../benchmark/work47/assets/'+LICENSED_SHIRT+'.png';
 const link=document.createElement('a');
 link.href=license.attribution.source;link.textContent='Verified shirt image and license';
 link.rel='noopener noreferrer';link.target='_blank';
 const credit=document.createElement('p');credit.className='small';
 credit.append('Licensed photo: ',link,' · '+license.attribution.license+' · Original RGB unchanged.');
 $('metadata').after(credit);
 $('review').addEventListener('change',()=>{
  if(!$('review').checked)clear();
  else {$('dress').disabled=false;photoStatus('Research preview available; still not visually approved.');}
 });
 $('dress').addEventListener('click',applyPhoto);
 $('clear').addEventListener('click',clear);
 $('mode').addEventListener('change',clear);
 $('model').addEventListener('change',changeBody);
 $('finish').addEventListener('change',()=>app.shade($('finish').value));
 for(const name of ['front','side','back'])$(name).addEventListener('click',()=>app[name]());
 $('turn').addEventListener('click',()=>app.rotate(35));
 $('reset').addEventListener('click',()=>app.front());
 $('spin').addEventListener('click',()=>{
  spin=!spin;app.setSpin(spin);$('spin').textContent='Auto-rotate: '+(spin?'On':'Off');
 });
 window.addEventListener('pagehide',()=>{closed=true;epoch++;app.stop();});
 window.work56Diagnostics=()=>app.getState();
 app.start();await changeBody();
}
run().catch(e=>status('Anatomical clothing preview blocked: '+e.message));
