import {buildAlpha2DSelections} from './family-alpha-2d-outfit-bridge.mjs';
import {renderPhotoLayers} from './family-alpha-2d-photo-renderer.mjs';
/** Synthetic / caller-verified adapter. Never fetches data or authenticates a user.
 * Caller MUST enforce account ownership and provenance before providing garments/images.
 */
export function renderVerifiedOutfit2D(container,outfit,verifiedGarments,verifiedMaskedImages){
 if(!container||typeof container.replaceChildren!=='function')throw new TypeError('Container required');
 try{
  const selections=buildAlpha2DSelections(outfit,verifiedGarments);
  return renderPhotoLayers(container,selections,verifiedMaskedImages);
 }catch(error){
  // Prevent stale prior-account or prior-outfit clothing remaining visible.
  container.replaceChildren();
  throw error;
 }
}
