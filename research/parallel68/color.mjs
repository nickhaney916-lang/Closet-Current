/** P68 masked-pixel color proposals. No captions, labels or source IDs enter
 * the estimator. All outputs require review; measured dominance is never a
 * probability of correctness. Mask provenance is not color ground truth. */
const FAMILIES=['Black','White','Gray','Beige','Brown','Blue','Green','Red','Pink','Purple','Yellow','Orange'];
const NEUTRAL=new Set(['Black','White','Gray','Beige','Brown']);
const linear=v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;};
const labPart=v=>v>216/24389?Math.cbrt(v):(24389/27*v+16)/116;
export function colorCoordinates68(r,g,b){
 if([r,g,b].some(v=>!Number.isFinite(v)||v<0||v>255))throw Error('Invalid RGB color');
 const [R,G,B]=[r,g,b].map(linear);
 const x=labPart((.4124564*R+.3575761*G+.1804375*B)/.95047),y=labPart(.2126729*R+.7151522*G+.072175*B),z=labPart((.0193339*R+.119192*G+.9503041*B)/1.08883);
 const L=116*y-16,a=500*(x-y),bb=200*(y-z),C=Math.hypot(a,bb);
 const max=Math.max(r,g,b)/255,min=Math.min(r,g,b)/255,delta=max-min,saturation=max?delta/max:0;
 let hue=delta===0?0:max===r/255?60*((g-b)/255/delta%6):max===g/255?60*((b-r)/255/delta+2):60*((r-g)/255/delta+4);if(hue<0)hue+=360;
 return {L,a,b:bb,chroma:C,hue,saturation};
}
export function pixelColor68(r,g,b){
 const v=colorCoordinates68(r,g,b),{L,chroma,hue,saturation}=v;
 let family,shade=null;
 // Low brightness alone must not erase visible navy/colored fabric chroma.
 if(L<8||(L<22&&chroma<12))family='Black';
 else if(L>=82&&chroma>=4&&chroma<=18&&v.b>2){family='White';shade='Off-white';}
 else if(chroma<8){family=L>=88?'White':'Gray';}
 else if(hue>=12&&hue<65&&saturation<.4&&L>=62)family='Beige';
 else if(hue>=12&&hue<65&&L<60)family='Brown';
 else if(hue<15||hue>=345)family=L>60&&saturation<.65?'Pink':'Red';
 else if(hue<45)family='Orange';else if(hue<70)family='Yellow';else if(hue<175)family='Green';else if(hue<260)family='Blue';else if(hue<315)family='Purple';else family='Pink';
 return {...v,family,shade,neutralBoundary:chroma<10&&(Math.abs(L-88)<4||Math.abs(L-22)<4)};
}
const rank=(counts,total)=>Object.entries(counts).filter(([,n])=>n).map(([color,pixels])=>({color,pixels,fraction:pixels/total})).sort((a,b)=>b.pixels-a.pixels||FAMILIES.indexOf(a.color)-FAMILIES.indexOf(b.color));
export function measureMaskedColors68({data,width,height,channels=3,mask,maskStatus='model-proposed',sourceSha256,maxSamples=32768}={}){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>16*1024*1024||![3,4].includes(channels)||!data||data.length!==width*height*channels)throw Error('Invalid color image');
 if(!['model-proposed','human-annotated','owner-reviewed'].includes(maskStatus)||!Number.isInteger(maxSamples)||maxSamples<64||maxSamples>65536)throw Error('Invalid color measurement options');
 if(sourceSha256!==undefined&&!/^[a-f0-9]{64}$/.test(sourceSha256))throw Error('Invalid source receipt');
 const base={version:68,verified:false,requiresReview:true,automaticColorSaveAllowed:false,maskStatus,sourceSha256:sourceSha256||null};
 const review=(reason,extra={})=>({...base,status:'review',color:null,reason,...extra});
 if(!mask)return review('foreground_mask_missing');
 const count=width*height;if(mask.length!==count)throw Error('Mask/source dimensions differ');
 let selected=0,opaque=0,core=0;
 const inside=i=>mask[i]>=.9;
 const isCore=i=>{const x=i%width,y=Math.floor(i/width);return x>0&&y>0&&x<width-1&&y<height-1&&inside(i-1)&&inside(i+1)&&inside(i-width)&&inside(i+width);};
 for(let i=0;i<count;i++){
  if(!Number.isFinite(mask[i])||mask[i]<0||mask[i]>1)throw Error('Invalid mask probability');
  for(let c=0;c<channels;c++)if(!Number.isFinite(data[i*channels+c])||data[i*channels+c]<0||data[i*channels+c]>255)throw Error('Invalid color pixels');
  if(!inside(i))continue;selected++;
  if(channels===4&&data[i*4+3]<243)continue;
  opaque++;if(isCore(i))core++;
 }
 const diagnostics={foregroundPixels:opaque,coverage:opaque/count,corePixels:core};
 if(opaque<64||opaque/count<.002)return review('insufficient_foreground',diagnostics);
 if(opaque<selected*.7)return review('foreground_transparency',diagnostics);
 const useCore=core>=64&&core/opaque>=.6,fullStride=Math.max(1,Math.ceil(opaque/maxSamples)),coreStride=Math.max(1,Math.ceil(core/maxSamples));
 const fullCounts=Object.fromEntries(FAMILIES.map(x=>[x,0])),coreCounts={...fullCounts},zoneCounts=Array.from({length:9},()=>({...fullCounts}));
 let fi=0,ci=0,fullSamples=0,coreSamples=0,clipped=0,offWhite=0,neutralBoundary=0;
 for(let i=0;i<count;i++){
  if(!inside(i)||(channels===4&&data[i*4+3]<243))continue;
  const selectedCore=useCore&&isCore(i),takeFull=fi++%fullStride===0,takeCore=selectedCore&&ci++%coreStride===0;
  if(!takeFull&&!takeCore)continue;
  const p=i*channels,r=data[p],g=data[p+1],b=data[p+2],v=pixelColor68(r,g,b);
  if(takeFull){fullCounts[v.family]++;fullSamples++;}
  if(useCore?takeCore:takeFull){
   if(useCore){coreCounts[v.family]++;coreSamples++;}
   const zone=Math.min(2,Math.floor((i%width)*3/width))+3*Math.min(2,Math.floor(Math.floor(i/width)*3/height));zoneCounts[zone][v.family]++;
   if((r>=253&&g>=253&&b>=253)||(r<=2&&g<=2&&b<=2))clipped++;
   if(v.shade==='Off-white')offWhite++;if(v.neutralBoundary)neutralBoundary++;
  }
 }
 const total=useCore?coreSamples:fullSamples,counts=useCore?coreCounts:fullCounts,palette=rank(counts,total),fullPalette=rank(fullCounts,fullSamples);
 let distance=0;for(const name of FAMILIES)distance+=Math.abs(counts[name]/total-fullCounts[name]/fullSamples);distance/=2;
 const measured={...diagnostics,samplePixels:total,usedInteriorCore:useCore,palette,fullMaskPalette:fullPalette,boundaryPaletteDistance:distance,dominance:palette[0]?.fraction||0,clippedFraction:clipped/total,neutralBoundaryFraction:neutralBoundary/total,offWhiteShadeFraction:offWhite/total};
 if(clipped/total>=.5)return review('lighting_clipping',measured);
 if(useCore&&distance>.15)return review('mask_boundary_palette_disagreement',measured);
 if(neutralBoundary/total>.35)return review('neutral_family_boundary_requires_review',measured);
 const dominant=palette[0],chromatic=palette.filter(x=>!NEUTRAL.has(x.color)&&x.fraction>=.18);
 const repeated=chromatic.filter(x=>zoneCounts.filter(z=>z[x.color]>=Math.max(3,total/500)).length>=2);
 if(dominant.fraction>=.72)return {...base,...measured,status:'proposal',color:dominant.color,shade:offWhite/total>.5?'Off-white':null,reason:'masked_pixel_dominance_unverified'};
 // Multiple neutral bins may be one shaded garment, not a patterned garment.
 if(repeated.length>=2)return {...base,...measured,status:'proposal',color:'Multicolor',shade:null,reason:'multiple_spatially_supported_chromatic_families_unverified'};
 return review('mixed_or_shaded_foreground_requires_review',measured);
}
