/**
 * Conservative, explicitly opt-in DISPLAY-only fringe attenuation.
 *
 * Source RGB, image classification, original JPEG and reviewed cutout remain
 * untouched. A bounded source-pixel distance band (~one output/display pixel)
 * is needed: single native-source pixels vanish when 1920px cutouts are fitted
 * into a 360x600 avatar and then displayed on a narrow phone.
 *
 * No new opaque pixels, no cloth synthesis, and no owner approval.
 */
export function attenuateReviewedFringeAlpha(rgba,width,height){
 if(!(rgba instanceof Uint8ClampedArray)||
    !Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
    width<16||height<16||width*height>8_000_000||
    rgba.length!==width*height*4)
  throw Error('Valid bounded reviewed RGBA display buffer required');
 const size=width*height,alpha=new Uint8Array(size);
 for(let i=0;i<size;i++)alpha[i]=rgba[i*4+3];
 // At most ~1 displayed pixel for a phone-scale fitted source.
 // Pixel distances are Manhattan distances, not synthetic alpha/texture.
 const radius=Math.max(2,Math.min(28,Math.ceil(Math.max(width,height)/120)));
 const far=radius+1,dist=new Uint8Array(size);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x;
  dist[i]=alpha[i]<=16?0:Math.min(far,x+1,y+1,width-x,height-y);
 }
 // Both scans use the immutable original-alpha transparent boundary.
 // Saturation at radius+1 forbids erosion propagating beyond this band.
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x;
  if(x&&dist[i-1]+1<dist[i])dist[i]=dist[i-1]+1;
  if(y&&dist[i-width]+1<dist[i])dist[i]=dist[i-width]+1;
 }
 for(let y=height-1;y>=0;y--)for(let x=width-1;x>=0;x--){
  const i=y*width+x;
  if(x<width-1&&dist[i+1]+1<dist[i])dist[i]=dist[i+1]+1;
  if(y<height-1&&dist[i+width]+1<dist[i])dist[i]=dist[i+width]+1;
 }
 let changed=0,eligible=0;
 for(let i=0;i<size;i++){
  const a=alpha[i],d=dist[i];
  if(a<=16||a>=240||d>radius||d===0)continue;
  eligible++;
  // Only the partially transparent silhouette fringe is reduced.
  // Solid/opaque clothing, pixel RGB and cutout interior are identical.
  const next=Math.round(a*Math.max(0.12,d/radius));
  if(next<a){rgba[i*4+3]=next;changed++;}
 }
 return Object.freeze({changed,eligible,pixels:size,radiusNativePx:radius,
   mode:'optional-review-only',ownerApproved:false});
}
