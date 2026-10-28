import {mount3D} from './webgl-renderer.mjs';
import {SLOTS} from './geometry.mjs';
const $=id=>document.getElementById(id);
const CHOICES=Object.freeze({
 shirt:{id:'commons-0002',slot:SLOTS.shirt,crop:[.12,.10,.76,.80]},
 pants:{id:'commons-0021',slot:SLOTS.pants,crop:[.12,.06,.76,.86]},
 dress:{id:'commons-0049',slot:SLOTS.dress,crop:[.10,.07,.80,.87]}
});
let viewer=null,pending=0;
const setStatus=s=>{$('status').textContent=s;};
async function run(){
 viewer=mount3D($('viewer'),{onRender:s=>{
  $('viewer').dataset.type=s.type;$('viewer').dataset.figure=s.body;
  $('viewer').dataset.frontProjection=String(s.frontPhotoProjection);
  // Expose only non-identifying, mechanical test metrics; no image data or identity.
 }});
 const response=await fetch('../../benchmark/locked-photo-sources.json',{cache:'no-store'});
 if(!response.ok)throw Error('Verified photo attribution manifest unavailable');
 const licensed=await response.json();
 if(!Array.isArray(licensed))throw Error('Invalid benchmark manifest');
 const load=async()=>{
  const turn=++pending,type=$('kind').value,selected=CHOICES[type];
  if(!selected)throw Error('Unsupported source');
  viewer.setScene(type,$('figure').value);
  const entry=licensed.find(x=>x.id===selected.id);
  if(!entry?.verified||!entry?.attribution?.license||
    !/^[a-f0-9]{64}$/.test(entry.sha256)||entry.image!==selected.id+'.jpg')
   throw Error('Unverified copyrighted source');
  const image=new Image();image.alt=entry.attribution.title;
  image.src='../../benchmark/fixtures/'+entry.image;
  await image.decode();
  if(turn!==pending)return;
  $('original').src=image.src;
  $('original').alt='Original licensed '+type+' image — '+entry.attribution.title;
  const sourceLink=document.createElement('a');
  sourceLink.textContent='Original author and licensing details';
  sourceLink.href=entry.attribution.source;
  sourceLink.target='_blank';sourceLink.rel='noopener noreferrer';
  $('credit').replaceChildren(
   document.createTextNode(entry.attribution.title+' · '+entry.attribution.license+' · '),
   sourceLink
  );
  viewer.setPhoto($('projection').checked?image:null,{cropRect:selected.crop});
  setStatus('3D '+type+' template rendered. Front photo projection: '+
   ($('projection').checked?'ON':'OFF')+'. Rotatable mesh, no true rear fit. Family Alpha HOLD.');
 };
 $('kind').addEventListener('change',()=>{load().catch(e=>setStatus('Preview blocked: '+e.message));});
 $('figure').addEventListener('change',()=>{load().catch(e=>setStatus('Preview blocked: '+e.message));});
 $('projection').addEventListener('change',()=>{load().catch(e=>setStatus('Preview blocked: '+e.message));});
 $('front').onclick=()=>viewer.setRotation(0);
 $('side').onclick=()=>viewer.setRotation(Math.PI/2);
 $('back').onclick=()=>viewer.setRotation(Math.PI);
 $('turn').onclick=()=>viewer.rotate(Math.PI/6);
 const resized=new ResizeObserver(()=>viewer?.draw());resized.observe($('viewer'));
 window.addEventListener('pagehide',()=>{pending++;resized.disconnect();viewer?.dispose();});
 await load();
}
run().catch(e=>setStatus('3D unavailable: '+e.message+'. Original-photo wardrobe board remains the fallback.'));
