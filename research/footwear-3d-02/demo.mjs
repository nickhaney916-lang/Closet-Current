/** Standalone opt-in browser proof; NEVER imported by the product app. */
import {mountAnatomicalShowroom} from './shoe-showroom.mjs';
import {loadApprovedFootwear02,createFootwear02Session} from './source-shoes.mjs';
import {loadSourceVetted3D69ResearchBundle} from '../three-d-69/sha-verified-original-garment-sources.mjs';
import {auditActualFootwear02StaticContact} from './contact-audit.mjs';
const q=new URLSearchParams(location.search),local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
if(!local||q.get('footwear02')!=='research'){document.getElementById('status').textContent='Research OFF; original-photo fallback only';}
else {
 const canvas=document.getElementById('view'),status=document.getElementById('status');
 const show=s=>{status.textContent=s;};
 let ownerId='fixture-a',generation=1,shoe=null,kind='female';
 let model=null,sources=null,src1=null,src2=null,session=null,loaded=false;
 const checkOwner=()=>({ownerId,generation});
 const viewer=mountAnatomicalShowroom(canvas,{
   premiumTurntable67:true,crispSourcePhotoClarity:true,jeansPanelFall:true,
   sourceShirtWaistFit:true,clothWaistContact:true,independentGarments:false
 });
 viewer.start();
 async function load(next='female'){
  if(session){session.dispose();session=null;}
  kind=next;await viewer.load(next);
  if(viewer.getState().stats.bones!==163)throw Error('163 original rig bones required');
  // EXISTING source-vetted photographed shirt+denim; do not alter original denim geometry.
  viewer.applyOutfit('shirt-pants',sources.shirt,{reviewed:true,pantsCandidate:sources.pants,pantsReviewed:true});
  if(viewer.getState().outfit.pants?.photoApplied!==true)throw Error('Original photographed denim outfit absent');
  session=createFootwear02Session({viewer,checkOwner,ownerId,generation,enabled:true});
  loaded=true;viewer.front();show('Verified CC0 source body and photographed denim · no shoe; Family Alpha HOLD');
  return viewer.getState();
 }
 async function select(id){
  if(!loaded)throw Error('Rig not loaded');
  let photoOnly=typeof id==='string'&&id.startsWith('photo:');
  const key=photoOnly?id.slice(6):id;
  let cap=key==='commons-0080'?src1:key==='commons-0081'?src2:null;
  // Keep the existing camera view exactly as selected by the user on every shoe swap.
  const result=session.swap(photoOnly?null:cap);
  const img=document.getElementById('original'),record=document.getElementById('record');
  img.src=cap?.photoUrl||'';img.hidden=!cap;
  record.textContent=cap?(cap.id+' · '+cap.attribution.author+' · '+cap.attribution.license+
   ' · verified original JPEG SHA256 '+cap.sourceSHA256+' · '+cap.observedView+
   '. 3D is source-informed neutral material, not full photo texture.'):
   'No approved mesh: original-photograph/2D fallback (bare feet in 3D).';
  show(result.status+' · '+kind+' · bare feet if photo-only; Family Alpha HOLD');
  return result;
 }
 function rotate(angle){viewer.rotate(angle);return viewer.getState();}
 function invalidate(){session?.dispose();session=null;generation++;loaded=false;show('Owner/session changed: 3D footwear invalidated');}
 function state(){return {...viewer.getState(),shoe:session?.state()||null,ownerId,generation};}
 async function init(){
  [src1,src2,sources]=await Promise.all([
   loadApprovedFootwear02('commons-0080'),loadApprovedFootwear02('commons-0081'),
   loadSourceVetted3D69ResearchBundle({denim:'public'})
  ]);
  await load('female');window.__footwear02Ready=true;show('Ready · source-verified research ONLY');
 }
 window.__footwear02={load,select,rotate,invalidate,state,checkOwner,audit:()=>{if(!session)throw Error('Research session cleared');return auditActualFootwear02StaticContact({viewer});},getSource:id=>id==='commons-0080'?src1:id==='commons-0081'?src2:null,
  dispose(){invalidate();viewer.stop();sources?.dispose();}};
 for(const [id,act]of [['bare',()=>select(null)],['photo',()=>select('photo:commons-0080')],['a',()=>select('commons-0080')],['b',()=>select('commons-0081')]])
  document.getElementById(id).addEventListener('click',()=>act().catch(e=>show('Photo-only fallback: '+e.message)));
 init().catch(e=>{show('Original-photo fallback: '+e.message);window.__footwear02Error=e.message;});
}