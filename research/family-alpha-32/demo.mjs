import {garments,fixtureImage} from './fixtures.mjs';
import {planFit,paintFit} from './fit.mjs';
import {renderApprovedFit} from './approved-fit.mjs';
import {createAlphaHumanoidFigure,renderPhotoLayers} from '../../public/family-alpha-2d-photo-renderer.mjs';
import {fingerprintAlphaRetainedOriginal,identityForSavedGarment} from '../../public/family-alpha-2d-saved-board.mjs';
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),x=>x.toString(16).padStart(2,'0')).join('');
const owner='a1111111-1111-4111-8111-111111111111';
const cleanups=[];
export async function compare(name){
 for(const dispose of cleanups.splice(0))dispose();
 const g=garments[name],image=await fixtureImage(name),source=image.src,root=document.getElementById('comparisons');root.replaceChildren();
 const plans=[],summary=[];
 for(const [mode,label] of [['baseline','Existing #322 alpha containment'],['rigid','Anatomy-anchor proposal · REVIEW'],['warp','Bounded warp proposal · REVIEW']]){
  const card=document.createElement('section');card.className='card';const title=document.createElement('h2');title.textContent=label;card.append(title);
  const frame=document.createElement('div');frame.className='frame';card.append(frame);root.append(card);
  if(mode==='baseline'){
   const selections=[{slot:g.slot,itemId:name,sourceIdentity:'synthetic:'+name,sourceVersion:'synthetic-v1'}],images={[name]:image};
   if(name==='jacket'){selections.push({slot:'top',itemId:'shirt',sourceIdentity:'synthetic:shirt',sourceVersion:'synthetic-v1'});images.shirt=await fixtureImage('shirt');}
   renderPhotoLayers(frame,selections,images);frame.querySelector('.family-alpha-avatar').style.width='100%';
  }else{
   frame.append(createAlphaHumanoidFigure(document));
   if(name==='jacket'){const under=document.createElement('canvas');under.width=360;under.height=600;const s=garments.shirt;paintFit(under,await fixtureImage('shirt'),planFit({width:240,height:280,anchors:{pair:s.pair,reviewed:true},target:s.target}));frame.append(under);}
   // Bind real PNG and retained synthetic JPEG to the same source/owner contract.
   const original=document.createElement('canvas');original.width=240;original.height=image.naturalHeight;original.getContext('2d').fillStyle='#eee';original.getContext('2d').fillRect(0,0,240,original.height);original.getContext('2d').drawImage(image,0,0);
   const item={id:name,ownerId:owner,category:name==='shoes'?'Shoes':'Tops',image:original.toDataURL('image/jpeg'),originalPhoto:{image:original.toDataURL('image/jpeg')}};
   const sourceIdentity=identityForSavedGarment(item),sourceVersion=await fingerprintAlphaRetainedOriginal(item.image),pngHash=await hash(image.src);
   const presentation={itemId:name,ownerId:owner,approved:true,humanPreviewConfirmed:true,sourcePixelAuditPassed:true,sourceIdentity,sourceVersion,image};
   const fit={anchors:{pair:g.pair},target:g.target,waistFactor:mode==='warp'?g.factor:1,protectedUntil:110,transitionEnd:250};
   if(name==='shoes'){fit.protectedUntil=0;fit.transitionEnd=100;}
   const annotation={itemId:name,ownerId:owner,sourceIdentity,sourceVersion,pngHash,reviewed:true,fit};
   let epoch=1;const context=()=>({authenticatedUserId:owner,currentUserId:owner,cloudOwnerId:owner,indexedDbName:'closet-current-user-'+owner,sessionGeneration:epoch});
   const holder=document.createElement('div');holder.className='overlay';frame.append(holder);
   const before=JSON.stringify(item),result=await renderApprovedFit(holder,{item,presentation,annotation,getContext:context});
   if(!result.displayed)throw Error('Unexpected fixture fallback '+name+': '+result.plan.reason);
   if(JSON.stringify(item)!==before||source!==image.src)throw Error('Source changed');
   plans.push(result.plan);summary.push({mode,...result.plan});
   // Same source, changed owner/epoch and rejected stale annotations must never render.
   const scratch=document.createElement('div');
   let rejects=0;for(const change of [p=>p.ownerId='foreign',p=>p.sourceVersion='stale',p=>p.approved=false,p=>p.sourceIdentity='wrong']){
    const p={...presentation};change(p);try{await renderApprovedFit(scratch,{item,presentation:p,annotation,getContext:context});}catch{rejects++;}if(scratch.children.length)throw Error('Foreign/stale pixels displayed');
   }
   const badAnnotation={...annotation,pngHash:'wrong'};try{await renderApprovedFit(scratch,{item,presentation,annotation:badAnnotation,getContext:context});}catch{rejects++;}
   epoch++;if(result.clearIfStale()||holder.children.length)throw Error('Session switch retained fit');epoch--;result.dispose();
   // Redraw same approved fixture after exercising clear-on-session-change.
   const final=await renderApprovedFit(holder,{item,presentation,annotation,getContext:context});cleanups.push(final.dispose);
   if(rejects!==5)throw Error('Invalid provenance accepted');
  }
  const note=document.createElement('p');note.className='metric';note.textContent=mode==='baseline'?'Unmodified renderer / unchanged approved PNG':`Scale ${plans.at(-1).scale.toFixed(3)}× · width change ${(100*plans.at(-1).maxDistortion).toFixed(1)}% · no y deformation`;card.append(note);
 }
 document.querySelector('#garment').textContent=name.toUpperCase()+(name==='jacket'?' over shirt':'');
 return {name,plans:summary,sourceUnchanged:source===image.src};
}
window.compare=compare;
