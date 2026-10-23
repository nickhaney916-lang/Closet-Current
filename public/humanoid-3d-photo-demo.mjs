import {createDetailedHumanoid3D} from './humanoid-3d-detailed-renderer.mjs';
import {createPhotoHumanoid3D} from './humanoid-3d-photo-renderer.mjs';
import {createPhotoTextureSession,getVerifiedPhotoFrame} from './humanoid-3d-photo-session.mjs';
const $=id=>document.getElementById(id),before=createDetailedHumanoid3D($('before')),after=createPhotoHumanoid3D($('after'));
let generation=0,account=0,lastToken=null,urls=[],selected=[],currentScenario='long';const sources=new Map();
const palette={shirt:[.17,.28,.7,1],sweater:[.3,.4,.3,1],pants:[.17,.2,.28,1],shoes:[.6,.39,.22,1],jacket:[.55,.2,.18,1],coat:[.3,.35,.27,1],skirt:[.38,.2,.55,1],dress:[.16,.4,.4,1]};
const sha=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
async function photo(color,variant=0){
 const c=document.createElement('canvas');c.width=256;c.height=384;const x=c.getContext('2d');x.fillStyle=color;x.fillRect(0,0,256,384);
 x.fillStyle=variant?'#e8bb3f':'#f4e7cf';for(let j=0;j<8;j++)x.fillRect(j*32,0,12,384);
 x.fillStyle='#b12839';x.fillRect(35,80,186,60);x.fillStyle='#fff';x.font='bold 36px sans-serif';x.fillText('CC',100,123);
 return new Uint8Array(await (await new Promise(r=>c.toBlob(r,'image/png'))).arrayBuffer());
}
const specs={shirt:['Tops','T-shirt','#2847b2'],sweater:['Outerwear','Cardigan','#557755'],pants:['Bottoms','Jeans','#293747'],shoes:['Shoes','Sneakers','#a25c34'],jacket:['Outerwear','Jacket','#8b3434'],coat:['Outerwear','Coat','#515d41'],skirt:['Bottoms','Skirt','#60348c'],dress:['Dresses','Casual dress','#287b78']};
function scenario(name){
 const ref=(slot,id,extra={})=>({slot,id,...extra});
 if(name==='dress')return [ref('top','dress'),ref('shoes','shoes',{itemType:'Ankle boots'})];
 const list=[ref('top','shirt',{sleeveLength:name==='short'?'Short sleeve':'Long sleeve'}),ref('bottom',name==='skirt'?'skirt':'pants',{...(name==='short'?{itemType:'Shorts'}:{})}),ref('shoes','shoes')];
 if(name==='jacket'||name==='layers')list.push(ref('layer2','jacket'));
 if(name==='layers')list.push(ref('layer','sweater'),ref('layer3','coat'));
 return list;
}
// Deliberately synthetic authority. Real integration must replace both callbacks
// with current authenticated ownership + SHA checks from the main contract.
const session=createPhotoTextureSession({
 async verifySelection(){
  const ticket=generation,owner=account,selected=[],colors={};
  for(const r of scenario(currentScenario)){
   const s=sources.get(owner+':'+r.id),sourceVersion=await sha(s.bytes);
   selected.push({slot:r.slot,itemId:owner+':'+r.id+(r.slot==='layer'?':sweater':''),sourceIdentity:'source:'+owner+':'+r.id,sourceVersion,category:s.category,itemType:r.itemType||s.type,sleeveLength:r.sleeveLength||'Long sleeve'});colors[r.slot]=palette[r.id];
  }
  return {placeholderOnly:true,hasDress:currentScenario==='dress',selected,colors,ticket,owner};
 },
 readOriginal(ref){const id=ref.itemId.replace(/:sweater$/,'');if(!id.startsWith(account+':'))throw Error('Foreign synthetic source');return sources.get(id).bytes;},
 isCurrent:v=>v.ticket===generation&&v.owner===account
});
function clearReferences(){for(const u of urls)URL.revokeObjectURL(u);urls=[];$('references').replaceChildren();}
function revoke(){generation++;session.invalidate();after.clear();before.setOutfit(Object.fromEntries(['top','bottom','shoes','layer','layer2','layer3','dress'].map(k=>[k,null])));clearReferences();lastToken=null;$('fallback').hidden=false;$('status').textContent='Previous account/source revoked. Verify and reload to continue.';}
async function show(name=currentScenario){
 currentScenario=name;revoke();const token=await session.prepare({scenario:name});lastToken=token;
 const data=getVerifiedPhotoFrame(token),colors={top:null,bottom:null,shoes:null,layer:null,layer2:null,layer3:null,dress:null,...data.colors};if(name==='dress'){colors.dress=colors.top;colors.top=null;}
 before.setOutfit(colors);after.setFrame(token);selected=data.selected;
 for(const r of selected){const source=sources.get(r.itemId.replace(/:sweater$/,'')),url=URL.createObjectURL(new Blob([source.bytes],{type:'image/png'}));urls.push(url);const figure=document.createElement('figure'),im=document.createElement('img'),caption=document.createElement('figcaption');im.src=url;im.alt='Unmodified synthetic '+r.itemType;caption.textContent=r.slot+' · '+r.itemType+' · original';figure.append(im,caption);$('references').append(figure);}
 $('fallback').hidden=after.supported;$('status').textContent=after.supported?'Verified synthetic source pixels loaded locally. Front projection only.':'2D original-reference fallback; GPU unavailable.';return after.getState();
}
function rotate(degrees){const desired=Number(degrees)*Math.PI/180,current=after.getState().yaw||0;after.rotate(desired-current);before.rotate(desired-(before.angle()||0));$('yaw').value=String(degrees);$('surface').textContent=Math.cos(desired)>.55?'FRONT: original-derived planar projection; stretching and fit unverified.':'ESTIMATED SIDE / BACK: no corresponding photo supplied; hatching is a proxy.';}
const guarded=fn=>async()=>{try{await fn();}catch{after.clear();clearReferences();$('fallback').hidden=false;$('status').textContent='Could not verify this source. Original-reference fallback required.';}};
$('scenario').onchange=guarded(()=>show($('scenario').value));$('retry').onclick=guarded(()=>show());
$('yaw').oninput=()=>rotate($('yaw').value);
$('account').onclick=()=>{revoke();account=1-account;};
$('replace').onclick=guarded(async()=>{revoke();const first=scenario(currentScenario)[0];sources.get(account+':'+first.id).bytes=await photo(specs[first.id][2],1);});
let drag=null;$('after').onpointerdown=e=>{drag={x:e.clientX,yaw:after.getState().yaw||0};$('after').setPointerCapture(e.pointerId);};$('after').onpointermove=e=>{if(drag)rotate(((drag.yaw+(e.clientX-drag.x)*.015)*180/Math.PI+360)%360);};$('after').onpointerup=()=>drag=null;
const ready=(async()=>{for(let owner=0;owner<2;owner++)for(const [id,[category,type,color]] of Object.entries(specs))sources.set(owner+':'+id,{category,type,bytes:await photo(color,owner)});await show();rotate(0);})();
window.__photoLab={ready,after,before,session,show,rotate,revoke,get token(){return lastToken;},get selected(){return selected;},get sourceBytes(){return [...sources.values()].map(x=>x.bytes);}};
