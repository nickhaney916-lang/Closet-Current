/** Work #39 conservatively calibrated capture-quality hints, Classic JS.
 * Called after original-JPEG review, before recognition begins.
 * Advisory-only: no storage, uploads, image mutations or auto-rejection.
 * Estimates cannot detect fabric clipping, mannequin, identity, or true focus.
 */
function alphaCaptureAdvice({width,height,sampleWidth,sampleHeight,rgba}={}){
 const sizes=[width,height,sampleWidth,sampleHeight];
 if(!sizes.every(n=>Number.isInteger(n)&&n>0)||sampleWidth<3||
   sampleHeight<3||sampleWidth>512||sampleHeight>512||
   !rgba||rgba.length!==sampleWidth*sampleHeight*4)
  return {hint:null,decision:'user-choice',unassessed:true};
 const count=sampleWidth*sampleHeight,lum=new Float64Array(count);
 let sum=0,dark=0,bright=0;
 for(let i=0;i<count;i++){
  const p=i*4,y=.2126*rgba[p]+.7152*rgba[p+1]+.0722*rgba[p+2];
  lum[i]=y;sum+=y;if(y<30)dark++;if(y>245)bright++;
 }
 const mean=sum/count;
 let variance=0;
 for(let i=0;i<count;i++)variance+=(lum[i]-mean)**2;
 const contrast=Math.sqrt(variance/count);
 let lapSum=0,lapSq=0,n=0;
 for(let row=1;row<sampleHeight-1;row++)for(let col=1;col<sampleWidth-1;col++){
  const p=row*sampleWidth+col;
  const lap=4*lum[p]-lum[p-1]-lum[p+1]-lum[p-sampleWidth]-lum[p+sampleWidth];
  lapSum+=lap;lapSq+=lap*lap;n++;
 }
 const sharpness=n?Math.max(0,lapSq/n-(lapSum/n)**2):0;
 const metrics={width,height,darkFraction:dark/count,brightFraction:bright/count,contrast,sharpness};
 let hint=null;
 if(Math.min(width,height)<600)
  hint={code:'resolution',text:'This photo is small. A higher-resolution photo may show clothing details better.'};
 else if(dark/count>.65)
  hint={code:'dark',text:'This picture may be too dark. Try more even lighting.'};
 else if(bright/count>.65)
  hint={code:'bright',text:'This picture may be too bright. Try more even lighting.'};
 else if(contrast<12)
  hint={code:'contrast',text:'Details may be difficult to see. Try more even lighting.'};
 else if(sharpness<20)
  hint={code:'soft',text:'This photo may look soft. Hold the camera steady and check the fabric details.'};
 return {metrics,hint,decision:'user-choice',
  alwaysReview:'Check that the entire garment is visible and nothing covers it.'};
}
