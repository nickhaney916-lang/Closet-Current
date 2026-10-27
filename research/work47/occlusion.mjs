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
export const REQUIRED_FOREGROUND_PARTS=Object.freeze([
 'left-hand','right-hand','neck','left-ear','right-ear','head'
]);
export const OPTIONAL_FOREGROUND_DETAILS=Object.freeze([
 'left-fingers','right-fingers','face-shading','face-hairline',
 'left-brow','right-brow','left-eyelid','right-eyelid',
 'left-eye','right-eye','nose','mouth','chin',
 'left-inner-ear','right-inner-ear'
]);
export const FOREGROUND_PARTS=Object.freeze([
 ...REQUIRED_FOREGROUND_PARTS,...OPTIONAL_FOREGROUND_DETAILS
]);

export function createHumanoidForegroundOverlay(doc=document){
 const svg=createAlphaHumanoidFigure(doc);
 const allowed=new Set(FOREGROUND_PARTS);
 const nodes=[...svg.children];
 for(const node of nodes){
  if(!allowed.has(node.getAttribute('data-part')))node.remove();
 }
 const remaining=[...svg.children].map(el=>el.getAttribute('data-part'));
 // Both the simple source benchmark and the protected app's more detailed,
 // source-pinned face and finger artwork are supported. Fail closed on
 // missing identity landmarks or unexpected duplication.
 if(remaining.length!==new Set(remaining).size||
    remaining.some(p=>!allowed.has(p))||
    REQUIRED_FOREGROUND_PARTS.some(part=>!remaining.includes(part)))
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
