import {createPhotoBoard} from './board.mjs';
const status=document.querySelector('#result');
const cfg=await (await fetch('./matrix.json')).json();
const context={ownerId:'synthetic-licensed-gallery-owner',sessionId:'offline-gallery-20261027'};
const getContext=()=>context;
const photos=new Map();
const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');
function node(tag,content='',className=''){
 const e=document.createElement(tag);
 e.textContent=String(content);if(className)e.className=className;
 return e;
}
try{
 if(cfg.release!=='HOLD'||cfg.visualDecision!=='NOT_OWNER_REVIEWED'||cfg.rows.length!==15)throw Error('Invalid review gate');
 for(const p of cfg.rows){
  const res=await fetch('./photos/'+p.image,{cache:'no-store'});
  if(!res.ok)throw Error('Missing original: '+p.id);
  const original=await res.blob();
  if(original.type!=='image/jpeg'||await digest(await original.arrayBuffer())!==p.sha256)throw Error('Source mismatch: '+p.id);
  photos.set(p.id,{id:p.id,ownerId:context.ownerId,original,trustedSourceSha256:p.sha256,label:p.role});
  const tile=node('article','','tile');
  const im=document.createElement('img');im.src='./photos/'+p.image;im.alt=p.role+' original licensed photograph';im.loading='lazy';
  tile.append(node('div',p.id,'tag'),im,node('h3',p.role),node('small','Source risk: '+p.sceneRisk),node('small','Owner visual approval: NOT GIVEN'));
  const link=node('a','Source and license');link.href=p.attribution.source;link.target='_blank';link.rel='noopener noreferrer';
  tile.append(link,node('small',p.attribution.license+' • '+(p.attribution.author||'unknown author')));
  document.querySelector('#matrix').append(tile);
 }
 for(const scenario of cfg.scenarios){
  const panel=node('section','','panel');
  panel.append(node('h3',scenario.name),node('small','Human-selected fixture combination. Do not judge as an app recommendation.'));
  const root=node('div');panel.append(root);document.querySelector('#outfits').append(panel);
  const display=createPhotoBoard(root,{getContext});
  const decision=await display.show(scenario.ids.map(id=>photos.get(id)));
  if(decision.mode!=='PHOTO PREVIEW')throw Error('Refused photo board: '+scenario.name);
 }
 document.documentElement.dataset.gallery='ready';
 status.textContent='15 verified originals and three sample photo boards rendered. Human visual review remains required. Family Alpha HOLD.';
}catch(e){document.documentElement.dataset.gallery='error';status.textContent='REVIEW REQUIRED: '+e.message;throw e;}
