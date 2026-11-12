/**
 * Isolated P67 pixel color estimator. No image/text model labels are consumed.
 * Requires a separately obtained foreground mask and a caller-supplied mask
 * reliability estimate. That estimate is NOT an independently verified truth.
 * This module has no measured real-photo accuracy or calibrated confidence.
 */
const COLORS=['Black','White','Gray','Beige','Brown','Blue','Green','Red','Pink','Purple','Yellow','Orange'];
const linear=c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;};
const validRange=(values,max)=>{
 for(let i=0;i<values.length;i++)if(!Number.isFinite(values[i])||values[i]<0||values[i]>max)return false;
 return true;
};

export function pixelColor67(r,g,b){
 if([r,g,b].some(c=>!Number.isFinite(c)||c<0||c>255))throw Error('Invalid color pixel');
 const rgb=[r,g,b].map(c=>c/255),max=Math.max(...rgb),min=Math.min(...rgb),delta=max-min;
 const saturation=max===0?0:delta/max;
 // CIE L* separates dark neutrals using luminance rather than channel mean.
 const y=.2126*linear(r)+.7152*linear(g)+.0722*linear(b);
 const lightness=y>216/24389?116*Math.cbrt(y)-16:24389/27*y;
 if(lightness<16)return 'Black';
 if(saturation<.12)return lightness>=88?'White':'Gray';
 let hue=delta===0?0:max===rgb[0]?60*((rgb[1]-rgb[2])/delta%6):max===rgb[1]?60*((rgb[2]-rgb[0])/delta+2):60*((rgb[0]-rgb[1])/delta+4);
 if(hue<0)hue+=360;
 if(hue>=15&&hue<65&&saturation<.38&&lightness>=65)return 'Beige';
 if(hue>=12&&hue<65&&lightness<60)return 'Brown';
 if(hue<15||hue>=345)return lightness>60&&saturation<.65?'Pink':'Red';
 if(hue<45)return 'Orange';
 if(hue<70)return 'Yellow';
 if(hue<175)return 'Green';
 if(hue<260)return 'Blue';
 if(hue<315)return 'Purple';
 return 'Pink';
}

/**
 * mask: one probability [0,1] per source pixel, aligned with the ORIGINAL RGB
 * or RGBA pixel array. Pixels below .9 are excluded, not blended with white.
 * maskReliability must be >=.9; unknown mask quality always requires review.
 * Scores describe foreground color dominance, never probability of correctness.
 */
export function measurePrimaryColor67({data,width,height,channels=3,mask,maskReliability}={}){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<=0||height<=0||
    ![3,4].includes(channels)||!data||data.length!==width*height*channels||
    !validRange(data,255))throw Error('Invalid color image');
 const count=width*height;
 const review=(reason,extra={})=>({status:'review',color:null,verified:false,reason,...extra});
 if(!mask)return review('foreground_mask_missing');
 if(mask.length!==count||!validRange(mask,1))throw Error('Invalid foreground mask');
 if(!Number.isFinite(maskReliability)||maskReliability<.9||maskReliability>1)return review('foreground_mask_unreliable');
 const histogram=Object.fromEntries(COLORS.map(x=>[x,0]));
 let selected=0,opaque=0,clipped=0;
 for(let i=0;i<count;i++){
  if(mask[i]<.9)continue;
  selected++;
  const offset=i*channels,alpha=channels===4?data[offset+3]/255:1;
  // Transparent/partly transparent pixels do not supply a garment color.
  if(alpha<.95)continue;
  const [r,g,b]=[data[offset],data[offset+1],data[offset+2]];
  opaque++;
  if((r>=253&&g>=253&&b>=253)||(r<=2&&g<=2&&b<=2))clipped++;
  histogram[pixelColor67(r,g,b)]++;
 }
 const coverage=opaque/count,selectedCoverage=selected/count,clippedFraction=opaque?clipped/opaque:0;
 const diagnostics={coverage,selectedCoverage,foregroundPixels:opaque,clippedFraction,maskReliability};
 if(opaque<64||coverage<.02)return review('insufficient_foreground',diagnostics);
 if(opaque<selected*.7)return review('foreground_transparency',diagnostics);
 const ranked=Object.entries(histogram).filter(([,n])=>n).map(([color,pixels])=>({color,pixels,fraction:pixels/opaque})).sort((a,b)=>b.pixels-a.pixels||COLORS.indexOf(a.color)-COLORS.indexOf(b.color));
 const dominance=ranked[0].fraction,secondFraction=ranked[1]?.fraction||0;
 const measured={...diagnostics,dominance,secondFraction,candidates:ranked};
 // Pure white/black cannot distinguish fabric from camera clipping. Do not
 // manufacture confidence from saturated image data or guess exposure.
 if(clippedFraction>=.5)return review('lighting_clipping',measured);
 if(dominance<.72||secondFraction>=.22)return review('mixed_foreground',{...measured,color:'Multicolor'});
 return {status:'measured',color:ranked[0].color,verified:false,reason:'pixel_dominance_requires_review',...measured};
}
