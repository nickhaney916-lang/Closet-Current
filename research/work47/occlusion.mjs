import {createAlphaHumanoidFigure} from '../../public/family-alpha-2d-photo-renderer.mjs';

/**
 * Only existing humanoid anatomy in the *foreground* of reviewed garment pixels.
 * Reuse the exact existing SVG paths; no invented body parts, clothing, user
 * images, credentials, canvas pixels or new silhouette generation.
 *
 * The existing complete humanoid remains BEHIND the garment. This overlay
 * contains only face, ears, neck and hands so the garment stays visually
 * connected to uncovered skin and does not incorrectly erase covered limbs.
 * Temporary visualization only; never a sign-off on garment shape or fit.
 */
export const FOREGROUND_PARTS=Object.freeze([
 'neck','left-ear','right-ear','head','face-shading','left-hand','right-hand'
]);

export function createHumanoidForegroundOverlay(doc=document){
 const svg=createAlphaHumanoidFigure(doc);
 const allowed=new Set(FOREGROUND_PARTS);
 const nodes=[...svg.children];
 for(const node of nodes){
  if(!allowed.has(node.getAttribute('data-part')))node.remove();
 }
 const remaining=[...svg.children].map(el=>el.getAttribute('data-part'));
 // Prevent a future figure redesign from silently adding unsupported anatomy.
 if(remaining.length!==FOREGROUND_PARTS.length||
    remaining.some(p=>!allowed.has(p))||new Set(remaining).size!==allowed.size)
  throw Error('Humanoid anatomical foreground source changed — retain photo fallback');
 svg.setAttribute('data-humanoid','foreground-anatomy-v1');
 svg.setAttribute('data-humanoid-overlay','reviewed-anatomy-v1');
 svg.setAttribute('aria-hidden','true');
 Object.assign(svg.style,{
  position:'absolute',inset:'0',width:'100%',height:'100%',
  pointerEvents:'none'
 });
 return svg;
}
