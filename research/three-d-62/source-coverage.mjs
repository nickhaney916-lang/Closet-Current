/** 3D-62 — truth-in-preview photographic garment coverage.
 * The source denim photographs show the laid-flat FRONT only. Original
 * photographic RGB and the neutral side/back material must never be
 * misrepresented as an independently photographed 360-degree garment.
 * Pure presentation metadata: no geometry, pixels, networks or AI.
 */
const views=new Set(['front','threequarter','side','back']);
export function sourceCoverage({view='front',photoPants=false,photoShirt=false}={}){
 if(!views.has(view))throw Error('Unsupported original-photo coverage view');
 if(typeof photoPants!=='boolean'||typeof photoShirt!=='boolean')
  throw Error('Original-photo provenance flags must come from actual garment state');
 if(!photoPants)return Object.freeze({
  view,coverage:'neutral-only',hasVerifiedRearPhoto:false,releaseAuthorized:false,
  text:photoShirt?
   'Neutral reference pants: no denim photograph applied. The shirt uses a photographed front; its unseen back is not a source photograph.':
   'Neutral reference pants. No photographed denim is applied to this figure.'
 });
 const descriptions={
  front:'Front: original photographed denim is visible. Unphotographed sides and back remain source-colored neutral material.',
  threequarter:'Three-quarter: real photographed denim at the front; the side and back are neutral preview material, not source photos.',
  side:'Side: this jeans source has no photographed side or back. The plain denim-colored surface is a neutral preview, not photographed fabric detail.',
  back:'Back: no rear photograph exists for these jeans. This is a source-colored neutral preview; pockets or stitching are not inferred.'
 };
 const shirt=photoShirt?
  ' The shirt has an original photographed front; unphotographed rear details are not claimed.':'';
 return Object.freeze({
  view,coverage:view==='front'?'photographed-front':view==='threequarter'?'mixed-front-neutral':'neutral-unphotographed',
  hasVerifiedRearPhoto:false,releaseAuthorized:false,text:descriptions[view]+shirt
 });
}
export function displaySourceCoverage(element,state){
 if(!element||typeof element.setAttribute!=='function'||!element.dataset)
  throw Error('Original-photo provenance notice element required');
 const result=sourceCoverage(state);
 element.textContent=result.text;
 element.dataset.coverage=result.coverage;
 element.dataset.view=result.view;
 element.dataset.verifiedRearPhoto='false';
 element.setAttribute('aria-label',result.text);
 return result;
}
