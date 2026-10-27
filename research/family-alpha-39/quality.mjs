// Exploratory local image measurements. Never reject or modify photographs.
// Low-detail fabric and deliberate dark/bright styles can produce false warnings.
export function assessPhoto({width,height,sampleWidth,sampleHeight,rgba}) {
 const dimensions=[width,height,sampleWidth,sampleHeight];
 if(!dimensions.every(n=>Number.isInteger(n)&&n>0)||sampleWidth>512||sampleHeight>512||
   !rgba||rgba.length!==sampleWidth*sampleHeight*4||sampleWidth<3||sampleHeight<3)
  throw new TypeError('Unreadable image');
 const count=sampleWidth*sampleHeight, y=new Float64Array(count);let dark=0,bright=0,sum=0;
 for(let i=0;i<count;i++){
  const v=.2126*rgba[i*4]+.7152*rgba[i*4+1]+.0722*rgba[i*4+2];
  y[i]=v;sum+=v;if(v<30)dark++;if(v>245)bright++;
 }
 let variance=0,lapSum=0,lapSq=0,n=0;
 for(const v of y)variance+=(v-sum/count)**2;
 for(let j=1;j<sampleHeight-1;j++)for(let i=1;i<sampleWidth-1;i++){
  const p=j*sampleWidth+i,lap=4*y[p]-y[p-1]-y[p+1]-y[p-sampleWidth]-y[p+sampleWidth];
  lapSum+=lap;lapSq+=lap*lap;n++;
 }
 const contrast=Math.sqrt(variance/count),sharpness=Math.max(0,lapSq/n-(lapSum/n)**2);
 const metrics={width,height,darkFraction:dark/count,brightFraction:bright/count,contrast,sharpness};
 const hints=[];
 if(Math.min(width,height)<600)hints.push({code:'resolution',text:'This photo is small; try a higher-resolution photo.'});
 if(dark/count>.65)hints.push({code:'dark',text:'This picture may be dark. Try more even lighting.'});
 else if(bright/count>.65)hints.push({code:'bright',text:'This picture may be too bright. Try more even lighting.'});
 else if(contrast<12)hints.push({code:'contrast',text:'Details may be hard to see. Try more even lighting.'});
 // Texture-based warning only; cannot establish camera motion or focus.
 if(sharpness<20 && contrast>=12)hints.push({code:'soft',text:'This picture may be blurry. Hold steady and check the details.'});
 return {metrics,hint:hints[0]||null,alwaysReview:'Check that the whole garment is visible and nothing covers it.',decision:'user-choice'};
}
