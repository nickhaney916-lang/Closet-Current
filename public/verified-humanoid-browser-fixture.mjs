import {createDetailedHumanoid3D} from './humanoid-3d-detailed-renderer.mjs';
import {applyVerifiedHumanoidOutfit,clearVerifiedHumanoidOutfit} from './apply-verified-humanoid-outfit.mjs';
const canvas=document.querySelector('#avatar'),status=document.querySelector('#status');
let renderer;
try{renderer=createDetailedHumanoid3D(canvas);}catch(error){status.textContent='WebGL initialization failed; 2D fallback required: '+error.message;}
const selected=(slot,itemId)=>({slot,itemId,sourceIdentity:'synthetic-capture',sourceVersion:'synthetic-v1'});
const shirt={placeholderOnly:true,originalPixelsRenderedAs3D:false,selected:[selected('top','synthetic-shirt'),selected('bottom','synthetic-pants')],colors:{top:[.8,.15,.2,1],bottom:[.1,.2,.65,1]}};
const dress={placeholderOnly:true,originalPixelsRenderedAs3D:false,selected:[selected('top','synthetic-dress')],colors:{dress:[.2,.65,.35,1]}};
function show(label,ok){status.textContent=JSON.stringify({case:label,success:ok,state:renderer?.getState?.()??null,warning:'Synthetic metadata only; NOT authenticated original-photo verification or real garment textures'},null,2);}
if(renderer)show('initialize',renderer.supported);
document.querySelector('#outfit').onclick=()=>show('shirt-pants',applyVerifiedHumanoidOutfit(renderer,shirt));
document.querySelector('#dress').onclick=()=>show('dress',applyVerifiedHumanoidOutfit(renderer,dress));
document.querySelector('#rotate').onclick=()=>show('rotate',renderer?.rotate?.(Math.PI/2)===true);
document.querySelector('#clear').onclick=()=>show('clear',clearVerifiedHumanoidOutfit(renderer));
