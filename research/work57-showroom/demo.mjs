/** Work57: standalone, localhost-only; no wardrobe or garment projection imports. */
const $=id=>document.getElementById(id);
const baseline=new URLSearchParams(location.search).get('variant')==='baseline';
let app,epoch=0,closed=false,spinning=false;
const status=s=>{$('status').textContent=s;};
const sync=()=>{const s=app.getState();$('diagnostics').textContent=JSON.stringify(s);$('avatar').dataset.metrics=JSON.stringify(s);};
async function load(){
 spinning=false;$('spin').textContent='Turntable: off';$('spin').setAttribute('aria-pressed','false');
 const t=++epoch;$('avatar').dataset.ready='false';$('model').disabled=true;
 status('Opening locally verified figure…');
 try{await app.load($('model').value);if(t!==epoch||closed)return;$('avatar').dataset.ready='true';status('Ready · Adult mannequin preview · Family Alpha HOLD');sync();}catch(e){if(t===epoch)status('Local preview unavailable: '+e.message);}finally{if(t===epoch)$('model').disabled=false;}
}
async function start(){
 if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname))throw Error('Local research access only');
 const {mountAnatomicalShowroom}=await import(baseline?'../three-d-06/anatomical-showroom.mjs':'./showroom.mjs');
 app=mountAnatomicalShowroom($('avatar'));
 $('avatar').dataset.variant=baseline?'baseline':'improved';
 $('caption').textContent=baseline?'PR396 · VERIFIED BASELINE':'RELAXED · LOCAL RESEARCH';
 $('pose').disabled=baseline;$('zoomIn').disabled=baseline;$('zoomOut').disabled=baseline;
 $('model').addEventListener('change',load);
 $('finish').addEventListener('change',()=>{app.shade($('finish').value);sync();});
 $('pose').addEventListener('change',()=>{spinning=false;$('spin').textContent='Turntable: off';$('spin').setAttribute('aria-pressed','false');app.setPose($('pose').value);$('caption').textContent=$('pose').value==='relaxed'?'RELAXED · LOCAL RESEARCH':'SOURCE FITTING POSE';sync();});
 for(const name of ['front','side','back','threequarter'])$(name).addEventListener('click',()=>{spinning=false;app.setSpin(false);$('spin').textContent='Turntable: off';$('spin').setAttribute('aria-pressed','false');for(const id of ['front','side','back','threequarter'])$(id).setAttribute('aria-pressed',String(id===name));name==='threequarter'?app.rotate(30):app[name]();sync();});
 $('zoomIn').addEventListener('click',()=>{app.zoom(.86);sync();});$('zoomOut').addEventListener('click',()=>{app.zoom(1.16);sync();});
 $('reset').addEventListener('click',()=>{$('front').click();});
 $('spin').addEventListener('click',()=>{spinning=!spinning;app.setSpin(spinning);$('spin').textContent='Turntable: '+(spinning?'on':'off');$('spin').setAttribute('aria-pressed',String(spinning));});
 $('avatar').addEventListener('webglcontextlost',()=>status('Graphics paused. Waiting for the browser to restore this preview.'));
 $('avatar').addEventListener('webglcontextrestored',()=>status('Graphics restored · Family Alpha HOLD'));
 window.addEventListener('pagehide',()=>{closed=true;epoch++;app.stop();});
 // Test boundary exposes only read-only rendering diagnostics, no app/user data.
 window.work57Diagnostics=()=>app.getState();
 app.start();await load();
}
start().catch(e=>status('Preview blocked: '+e.message));
