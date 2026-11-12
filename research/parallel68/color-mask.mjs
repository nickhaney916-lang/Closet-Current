/** Single-object studio/museum-photo mask polarity check, P68 research only.
 * It uses decoded RGB border evidence, never labels, IDs or expected colors.
 * Uniform-background validation is mandatory. This is not human mask truth,
 * general scene segmentation, or an automatic wardrobe/color admission gate. */
const median=values=>{const sorted=values.toSorted((a,b)=>a-b);return sorted[Math.floor(sorted.length/2)];};
const distance=(data,index,channels,bg)=>Math.hypot(data[index*channels]-bg[0],data[index*channels+1]-bg[1],data[index*channels+2]-bg[2]);
export function selectColorForeground68({data,width,height,channels=3,mask}={}){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<8||height<8||width*height>16*1024*1024||![3,4].includes(channels)||!data||data.length!==width*height*channels||!mask||mask.length!==width*height)throw Error('Invalid original image or proposed color mask');
 const count=width*height,band=Math.max(2,Math.min(12,Math.floor(Math.min(width,height)*.025))),threshold=40;
 const sampleStride=Math.max(1,Math.ceil((2*band*(width+height)-4*band*band)/8192));
 const border=[],red=[],green=[],blue=[];let borderIndex=0,rawCount=0,rawBackground=0,complementContrast=0,rawContrast=0,borderCount=0,rawBorder=0;
 for(let i=0;i<count;i++){
  if(!Number.isFinite(mask[i])||mask[i]<0||mask[i]>1)throw Error('Invalid model mask probabilities');
  for(let c=0;c<channels;c++)if(!Number.isFinite(data[i*channels+c])||data[i*channels+c]<0||data[i*channels+c]>255)throw Error('Invalid original color pixels');
  const x=i%width,y=Math.floor(i/width);
  if(mask[i]>=.5)rawCount++;
  if(x<band||x>=width-band||y<band||y>=height-band){
   borderCount++;if(mask[i]>=.5)rawBorder++;
   if(borderIndex++%sampleStride===0&&(channels!==4||data[i*4+3]>=243)){border.push(i);red.push(data[i*channels]);green.push(data[i*channels+1]);blue.push(data[i*channels+2]);}
  }
 }
 const base={version:68,verified:false,requiresReview:true,automaticColorSaveAllowed:false,method:'uniform-border-polarity-and-exterior-background-check',inverted:false};
 const reject=(reason,diagnostics)=>({...base,status:'review',mask:null,reason,diagnostics});
 if(border.length<32)return reject('insufficient_opaque_border',{borderSamples:border.length});
 const bg=[median(red),median(green),median(blue)],sideTotal=[0,0,0,0],sideMatching=[0,0,0,0];let matching=0;
 for(const i of border){const x=i%width,y=Math.floor(i/width),match=distance(data,i,channels,bg)<=threshold;if(match)matching++;
  for(const [side,inside]of [y<band,y>=height-band,x<band,x>=width-band].entries())if(inside){sideTotal[side]++;if(match)sideMatching[side]++;}
 }
 const sideFractions=sideTotal.map((n,i)=>n?sideMatching[i]/n:0),uniformFraction=matching/border.length;
 for(let i=0;i<count;i++){
  const d=distance(data,i,channels,bg);
  if(mask[i]>=.5){if(d<=threshold)rawBackground++;else rawContrast++;}
  else if(d>threshold)complementContrast++;
 }
 const complementCount=count-rawCount;
 const diagnostics={borderBandPixels:band,borderSamples:border.length,backgroundMedianRGB:bg,backgroundDistanceThreshold:threshold,borderUniformFraction:uniformFraction,borderSideUniformFractions:{top:sideFractions[0],bottom:sideFractions[1],left:sideFractions[2],right:sideFractions[3]},rawCoverage:rawCount/count,invertedCoverage:complementCount/count,rawBorderCoverage:rawBorder/borderCount,invertedBorderCoverage:1-rawBorder/borderCount,rawBackgroundAgreement:rawCount?rawBackground/rawCount:0,rawContrastFraction:rawCount?rawContrast/rawCount:0,invertedContrastFraction:complementCount?complementContrast/complementCount:0};
 // A single bad edge can be a clipped garment/shadow. Three consistent sides,
 // high global agreement and no wholly different fourth side are required.
 if(uniformFraction<.85||sideFractions.filter(x=>x>=.85).length<3||Math.min(...sideFractions)<.6)return reject('uniform_background_not_established',diagnostics);
 let inverted=false;
 if(diagnostics.rawBorderCoverage>=.65&&diagnostics.rawBackgroundAgreement>=.8&&diagnostics.invertedContrastFraction>=.5)inverted=true;
 else if(diagnostics.rawBorderCoverage<=.25&&diagnostics.rawContrastFraction>=.5)inverted=false;
 else return reject('mask_polarity_not_established',diagnostics);
 // Remove only background-colored pixels connected to the image exterior.
 // This prevents inversion from retaining the unselected outer frame of a
 // full-frame box. No arbitrary interior region is created by this cleanup.
 const exterior=new Uint8Array(count),queue=new Uint32Array(count);let head=0,tail=0;
 const add=i=>{if(!exterior[i]&&distance(data,i,channels,bg)<=threshold&&(channels!==4||data[i*4+3]>=243)){exterior[i]=1;queue[tail++]=i;}};
 for(let x=0;x<width;x++){add(x);add((height-1)*width+x);}for(let y=0;y<height;y++){add(y*width);add(y*width+width-1);}
 while(head<tail){const i=queue[head++],x=i%width,y=Math.floor(i/width);if(x>0)add(i-1);if(x+1<width)add(i+1);if(y>0)add(i-width);if(y+1<height)add(i+width);}
 const candidate=new Uint8Array(count);let candidateCount=0,discarded=0;
 for(let i=0;i<count;i++){const selected=inverted?mask[i]<.5:mask[i]>=.5;if(selected&&exterior[i])discarded++;if(selected&&!exterior[i]&&(channels!==4||data[i*4+3]>=243)){candidate[i]=1;candidateCount++;}}
 diagnostics.exteriorBackgroundPixels=tail;diagnostics.removedExteriorPixels=discarded;diagnostics.cleanedCoverage=candidateCount/count;
 if(candidateCount<64||candidateCount/count<.01||candidateCount/count>.9)return reject('foreground_area_not_plausible',diagnostics);
 // A single object should have a dominant connected component. Do not merge
 // several fragments or objects into one inferred garment color region.
 const seen=new Uint8Array(count);let largest=[],componentCount=0;
 for(let start=0;start<count;start++){
  if(!candidate[start]||seen[start])continue;componentCount++;head=0;tail=0;queue[tail++]=start;seen[start]=1;
  while(head<tail){const i=queue[head++],x=i%width,y=Math.floor(i/width);for(const n of [x>0?i-1:-1,x+1<width?i+1:-1,y>0?i-width:-1,y+1<height?i+width:-1])if(n>=0&&candidate[n]&&!seen[n]){seen[n]=1;queue[tail++]=n;}}
  if(tail>largest.length)largest=Array.from(queue.subarray(0,tail));
 }
 diagnostics.componentCount=componentCount;diagnostics.largestComponentShare=largest.length/candidateCount;
 if(largest.length/candidateCount<.8)return reject('multiple_or_fragmented_foreground',diagnostics);
 const selectedMask=new Uint8Array(count);let left=width,top=height,right=-1,bottom=-1;
 for(const i of largest){selectedMask[i]=1;left=Math.min(left,i%width);right=Math.max(right,i%width);top=Math.min(top,Math.floor(i/width));bottom=Math.max(bottom,Math.floor(i/width));}
 diagnostics.selectedCoverage=largest.length/count;diagnostics.selectedBounds={left,top,right:right+1,bottom:bottom+1};diagnostics.boundingBoxFill=largest.length/((right-left+1)*(bottom-top+1));diagnostics.touchesImageEdge=left===0||top===0||right===width-1||bottom===height-1;
 if(diagnostics.boundingBoxFill<.08)return reject('foreground_geometry_not_plausible',diagnostics);
 return {...base,status:'selected',mask:selectedMask,inverted,reason:inverted?'model_background_mask_inverted_with_uniform_border_evidence':'model_foreground_mask_retained_with_uniform_border_evidence',diagnostics};
}
