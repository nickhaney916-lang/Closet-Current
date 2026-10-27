import {mountManualGarmentAlignment} from './manual-fit.mjs';
import {renderPhotoLayers as beforeRender} from './geometry/before/family-alpha-2d-photo-renderer.mjs';
import {renderPhotoLayers as currentRender} from './geometry/current/family-alpha-2d-photo-renderer.mjs';
import {isLocalGallery,validateGalleryManifest} from './policy.mjs';
const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
if(!isLocalGallery(location)){
 document.body.replaceChildren(el('p','This unapproved diagnostic gallery is localhost-only. Family Alpha HOLD.'));
}else{
 const manifest=await (await fetch('manifest.json')).json();validateGalleryManifest(manifest);
 const select=document.getElementById('sample'),root=document.getElementById('gallery');let generation=0;
 for(const row of manifest.rows){const o=el('option',row.id+' · '+row.role);o.value=row.id;select.append(o);}
 const slot=category=>({Tops:'top',Outerwear:'layer2',Dresses:'dress',Bottoms:'bottom',Shoes:'shoes'}[category]);
 async function dataPNG(path){const buffer=await(await fetch(path)).arrayBuffer(),bytes=new Uint8Array(buffer);let value='';for(let i=0;i<bytes.length;i+=8192)value+=String.fromCharCode(...bytes.subarray(i,i+8192));return 'data:image/png;base64,'+btoa(value);}
 async function show(id){const ticket=++generation;root.replaceChildren();root.dataset.ready='false';delete root.dataset.cutoutSHA;const row=manifest.rows.find(x=>x.id===id);if(!row)throw Error('Unknown licensed example');
  const h=el('h2',row.id+' — '+row.role),grid=el('section');grid.className='comparison';root.append(h,grid);
  const figure=(title,kind)=>{const f=el('figure'),box=el('div');f.append(el('figcaption',title));box.className=kind;f.append(box);grid.append(f);return {f,box};};
  const original=figure('1 · Original photograph','photobox'),cutout=figure('2 · Proposed cutout','photobox checker'),before=figure('3 · Previous humanoid (#320)','avatarbox'),current=figure('4 · Current humanoid (#326)','avatarbox'),candidate=figure('5 · Human-adjusted experiment','avatarbox');
  const source=new Image();source.alt='Licensed original '+row.role;source.src=row.original;original.box.append(source);
  for(const f of [cutout.f,before.f,current.f,candidate.f])f.insertBefore(el('p','PROVISIONAL · NOT APPROVED'),f.children[1]).className='provisional';
  const decision=el('section');decision.className='decision';decision.append(el('h3',row.decision+(row.hasProposal?' · Offline visual assessment':' · NOT RENDERED')),el('p',row.reason),el('p','Clipping decision from Work #30: '+row.priorClippingDecision+'. Owner approval: NOT GIVEN. Physical phone: NOT TESTED.'));root.append(decision);
  const foot=el('footer'),a=el('a',row.attribution.title+' · '+row.attribution.license);a.href=row.attribution.source;a.target='_blank';a.rel='noreferrer';foot.append(a,el('p','Photo credit: '+row.attribution.author+'. PROVISIONAL diagnostic only. Use the bounded manual controls; no deformation or source replacement. No owner approval.'));root.append(foot);
  if(!row.proposal){for(const box of [cutout.box,before.box,current.box,candidate.box]){box.classList.add('unavailable');box.append(el('p','No safe cutout available. No garment preview rendered; the original is never used as a fake cutout.'));}await source.decode();if(ticket===generation){root.dataset.ready='true';root.dataset.id=id;root.dataset.hasProposal='false';}return;}
  const image=new Image();image.src=await dataPNG(row.proposal);image.alt='UNAPPROVED transparent proposal '+row.role;await Promise.all([image.decode(),source.decode()]);if(ticket!==generation)return;cutout.box.append(image);
  // Diagnostic ONLY: licensed, source/hash-bound unapproved proposal. No fake
  // approved:true, real account or live app authorization is manufactured.
  const refs=[{slot:slot(row.category),itemId:row.id,sourceIdentity:row.id,sourceVersion:'sha256:'+row.sourceSHA256}];
  beforeRender(before.box,refs,{[row.id]:image});currentRender(current.box,refs,{[row.id]:image});if(row.category==='Shoes'){candidate.box.classList.add('unavailable');candidate.box.append(el('p','PHOTO REFERENCE ONLY — a single side-view shoe cannot be presented as a worn pair.'),image.cloneNode(false));}else{currentRender(candidate.box,refs,{[row.id]:image});mountManualGarmentAlignment(candidate.box,{isActive:()=>ticket===generation});}
  root.dataset.ready='true';root.dataset.id=id;root.dataset.hasProposal='true';root.dataset.cutoutSHA=row.nativeCutout.sha256;
 }
 select.onchange=()=>show(select.value);await show(select.value);
}
