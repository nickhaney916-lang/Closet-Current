/** Only this standalone research page enables the verified mobile GLB cache. */
import {installVerifiedModelCache} from './verified-model-cache.mjs';
const cache=installVerifiedModelCache();
Object.defineProperty(window,'mobile3dMetrics',{value:()=>cache.metrics(),configurable:true});
window.addEventListener('pagehide',()=>cache.dispose(),{once:true});
try{
 // Work58 showroom, original photo identity, fitting and account boundaries
 // are reused byte-for-byte. Only the model file-loading method changes.
 await import('../three-d-09/demo.mjs');
}catch(error){
 cache.dispose();
 const status=document.getElementById('status');
 if(status)status.textContent='3D research preview unavailable: '+String(error.message||error);
 const garment=document.getElementById('garment');
 if(garment)garment.disabled=true;
}
