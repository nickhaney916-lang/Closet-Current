/**
 * SOURCE-PHOTO-COVERAGE-10 — original-photo provenance, research only.
 * A single licensed front photograph cannot verify an unseen side or back.
 * This helper NEVER grants an all-angles photo provenance assertion.
 */
export const ORIGINAL_PHOTO_COVERAGE10=Object.freeze({
 frontPhotoProvided:true,sidePhotoProvided:false,rearPhotoProvided:false,
 fullyPhotographed360:false,releaseAuthorized:false
});
export function classifySourcePhotoView10(degrees){
 if(!Number.isFinite(degrees))throw Error('Finite authenticated 3D camera angle required');
 const angle=((degrees%360)+360)%360;
 const awayFromFront=Math.min(angle,360-angle);
 const viewClass=awayFromFront<=10?'front-photo':
  awayFromFront>=170?'unphotographed-rear':'mixed-photo-and-model';
 const explanation=viewClass==='front-photo'
  ?'Front photograph verified. Side and rear garment surfaces are modeled, not photographed.'
  :viewClass==='unphotographed-rear'
    ?'Back NOT photographed: this is modeled garment geometry, not a verified original rear photo.'
    :'Angled/side view contains modeled, unphotographed garment surfaces; only the front source photo is verified.';
 return Object.freeze({...ORIGINAL_PHOTO_COVERAGE10,
  angleDegrees:angle,viewClass,explanation,
  originalPhotographedFrontOnly:true,
  photorealistic360Certified:false});
}
