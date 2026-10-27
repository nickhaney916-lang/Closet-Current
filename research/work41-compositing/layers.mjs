// Offline visual-research only. Does not verify provenance or approve masks.
// Callers must provide independently sourced/verified images. No app use.
import {renderPhotoLayers,createAlphaHumanoidFigure} from '../../public/family-alpha-2d-photo-renderer.mjs';
const order=['bottom','top','dress','layer','layer2','layer3'];
export function compositingPlan(refs){
 if(!Array.isArray(refs)||!refs.length)throw Error('Garments required');
 const slots=new Set(),ids=new Set();
 for(const r of refs){if(!r||!order.includes(r.slot)||typeof r.itemId!=='string'||!r.itemId||typeof r.sourceIdentity!=='string'||!r.sourceIdentity||typeof r.sourceVersion!=='string'||!r.sourceVersion||slots.has(r.slot)||ids.has(r.itemId))throw Error('Invalid or duplicate garment reference');slots.add(r.slot);ids.add(r.itemId);}
 if(slots.has('dress')&&(slots.has('top')||slots.has('bottom')))throw Error('Dress conflicts with top or bottom');
 return [...refs].sort((a,b)=>order.indexOf(a.slot)-order.indexOf(b.slot));
}
export function renderCompositingResearch(container,refs,images,{handsInFront=false}={}){
 const plan=compositingPlan(refs);if(typeof handsInFront!=='boolean')throw Error('Explicit hand setting required');
 const pieces=[];let frame;
 // Invoke the unmodified renderer on each item to preserve its exact geometry.
 // This is local diagnostic composition, not a verified authorization path.
 for(const ref of plan){const holder=document.createElement('div');renderPhotoLayers(holder,[ref],images);const scene=holder.firstElementChild;if(!frame)frame=scene;else pieces.push(scene.querySelector('img[data-slot]'));}
 for(const image of pieces){if(!image)throw Error('Missing rendered garment');frame.append(image);}
 if(handsInFront){const overlay=createAlphaHumanoidFigure(document);for(const child of [...overlay.children])if(!['left-hand','right-hand'].includes(child.getAttribute('data-part')))child.remove();overlay.dataset.researchOcclusion='hands-in-front-review';frame.append(overlay);}
 frame.setAttribute('aria-label','Experimental 2D composition, review required');container.replaceChildren(frame);return {status:'REVIEW',garmentCount:plan.length,handsInFront};
}
