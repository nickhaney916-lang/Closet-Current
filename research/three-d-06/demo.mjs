import {mountAnatomicalShowroom} from './anatomical-showroom.mjs';
const $=id=>document.getElementById(id);
let app=null,token=0,spinning=false;
const status=text=>{$('status').textContent=text;};
const load=async()=>{
 const current=++token,kind=$('model').value;
 status('Opening local CC0 '+(kind==='female'?'mannequin B':'mannequin A')+' model…');
 try{
  await app.load(kind);
  if(current!==token)return;
  const x=app.getState(),s=x.stats;
  $('avatar').dataset.ready='true';
  $('metadata').textContent='Verified local glTF figure · '+s.bones+' skeleton bones · '+
   s.skinned+' skinned meshes · '+s.triangles.toLocaleString()+' triangles · No outside image or API';
  status('Anatomical 3D mannequin loaded. Swipe to rotate; Family Alpha HOLD.');
 }catch(e){
  if(current!==token)return;
  $('avatar').dataset.ready='false';
  status('Local anatomical asset unavailable: '+e.message+'. No external runtime model fallback.');
 }
};
async function run(){
 if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname))
  throw Error('For privacy, serve this research prototype only on localhost');
 app=mountAnatomicalShowroom($('avatar'),{onChange:x=>{
  $('avatar').dataset.model=x.kind;
  $('avatar').dataset.bones=String(x.stats.bones);
  $('avatar').dataset.skinnedMeshes=String(x.stats.skinned);
  $('avatar').dataset.triangles=String(x.stats.triangles);
  $('avatar').dataset.license='CC0-1.0';
 }});
 app.start();
 $('model').addEventListener('change',()=>load());
 $('finish').addEventListener('change',()=>{app.shade($('finish').value);});
 $('front').addEventListener('click',()=>app.front());
 $('side').addEventListener('click',()=>app.side());
 $('back').addEventListener('click',()=>app.back());
 $('turn').addEventListener('click',()=>app.rotate(35));
 $('reset').addEventListener('click',()=>app.front());
 $('spin').addEventListener('click',()=>{
  spinning=!spinning;app.setSpin(spinning);
  $('spin').textContent='Auto-rotate: '+(spinning?'On':'Off');
 });
 window.addEventListener('pagehide',()=>{token++;app.stop();});
 await load();
}
run().catch(e=>status('3D preview blocked: '+e.message));
