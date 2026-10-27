/**
 * Conservative, opt-in display-only alpha fringe attenuation.
 *
 * The exact source RGB and RGB ordering are NEVER changed. This operation
 * reduces only the semitransparent alpha of pixels touching transparent
 * pixels. It cannot separate backgrounds, reconstruct missing cloth,
 * validate a reviewed mask, or approve a worn-on-avatar preview.
 *
 * Caller owns the volatile RGBA ImageData buffer. No image files,
 * storage, account data, network or source JPEGs are accessed here.
 */
export function attenuateReviewedFringeAlpha(rgba,width,height){
 if(!(rgba instanceof Uint8ClampedArray)||
    !Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
    width<16||height<16||width*height>8_000_000||
    rgba.length!==width*height*4)
  throw Error('Valid bounded reviewed RGBA display buffer required');
 // Read ONLY from the immutable snapshot. Two-pass processing would
 // otherwise grow cleanup outward, erasing cuffs and tiny garment details.
 const originalAlpha=new Uint8Array(width*height);
 for(let i=0;i<originalAlpha.length;i++)originalAlpha[i]=rgba[i*4+3];
 let changed=0,eligible=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const p=y*width+x,a=originalAlpha[p];
  if(a===0||a>=240)continue;
  const touchesTransparent=
   (x===0||originalAlpha[p-1]<=16)||
   (x===width-1||originalAlpha[p+1]<=16)||
   (y===0||originalAlpha[p-width]<=16)||
   (y===height-1||originalAlpha[p+width]<=16);
  if(!touchesTransparent)continue;
  eligible++;
  // Gamma-like attenuation of semi-transparent edge only.
  // No opaque interior alpha or source RGB changes.
  const next=Math.round(a*a/255);
  if(next<a){rgba[p*4+3]=next;changed++;}
 }
 return Object.freeze({changed,eligible,pixels:width*height,
   mode:'optional-review-only',ownerApproved:false});
}
