'use strict';
(function(root){
 const engine=root.ClosetDarkStudioMask||(typeof require==='function'?require('./dark-studio-garment-mask.js'):null);
 const MAX=600000,GUIDE_MAX=150000;
 function propose(data,width,height,options={}){
  const hold=reason=>({proposalAvailable:false,eligible:false,displayEligible:false,reason,
   sourceAltered:false,garmentReconstructed:false});
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<40||height<40||width*height>MAX||
   !(data instanceof Uint8ClampedArray||data instanceof Uint8Array)||data.length!==width*height*4)
   throw Error('Invalid source-guided preview pixels');
  if(!engine)return hold('dark-studio-engine-unavailable');
  for(let i=3;i<data.length;i+=4)if(data[i]!==255)return hold('native-alpha-use-existing-path');
  const scale=Math.min(1,Math.sqrt(GUIDE_MAX/(width*height)));
  const gw=Math.floor(width*scale),gh=Math.floor(height*scale);
  if(gw<40||gh<40)return hold('guide-too-narrow');
  // Derive the guide internally from this exact source buffer. No caller-
  // supplied mask from another photograph or obsolete outfit is accepted.
  const guidePixels=new Uint8ClampedArray(gw*gh*4);
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){
   const x0=Math.floor(x*width/gw),x1=Math.floor((x+1)*width/gw),
    y0=Math.floor(y*height/gh),y1=Math.floor((y+1)*height/gh);
   let red=0,green=0,blue=0,count=0;
   for(let yy=y0;yy<y1;yy++)for(let xx=x0;xx<x1;xx++){
    const at=(yy*width+xx)*4;red+=data[at];green+=data[at+1];blue+=data[at+2];count++;
   }
   guidePixels.set([Math.round(red/count),Math.round(green/count),Math.round(blue/count),255],(y*gw+x)*4);
  }
  const guide=engine.analyze(guidePixels,gw,gh,options);
  if(!guide.proposalAvailable)return hold(guide.reason);
  const band=new Uint8Array(gw*gh);
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){
   const value=guide.alpha[y*gw+x];
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const xx=x+dx,yy=y+dy;
    if(xx>=0&&xx<gw&&yy>=0&&yy<gh&&guide.alpha[yy*gw+xx]!==value)band[y*gw+x]=1;
   }
  }
  const n=width*height,baseline=new Uint8ClampedArray(n),uncertainty=new Uint8Array(n),
   canClear=new Uint8Array(n),seen=new Uint8Array(n),queue=new Int32Array(n);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const gx=Math.min(gw-1,Math.ceil((x+1)*gw/width)-1),gy=Math.min(gh-1,Math.ceil((y+1)*gh/height)-1),
    j=gy*gw+gx,i=y*width+x,at=i*4;
   baseline[i]=guide.alpha[j];uncertainty[i]=band[j];
   if(!band[j])canClear[i]=baseline[i]===0?1:0;
   else{
    const hi=Math.max(data[at],data[at+1],data[at+2]),lo=Math.min(data[at],data[at+1],data[at+2]);
    canClear[i]=hi<=85&&hi-lo<=16?1:0;
   }
  }
  let begin=0,end=0;
  const push=i=>{if(canClear[i]&&!seen[i]){seen[i]=1;queue[end++]=i;}};
  for(let x=0;x<width;x++){push(x);push((height-1)*width+x);}
  for(let y=1;y<height-1;y++){push(y*width);push(y*width+width-1);}
  while(begin<end){
   const i=queue[begin++],x=i%width,y=(i-x)/width;
   if(x>0)push(i-1);if(x+1<width)push(i+1);if(y>0)push(i-width);if(y+1<height)push(i+width);
  }
  const alpha=new Uint8ClampedArray(n);let clearedBoundary=0,restoredBoundary=0,uncertainPixels=0;
  for(let i=0;i<n;i++){
   alpha[i]=uncertainty[i]?(seen[i]?0:255):baseline[i];
   if(uncertainty[i]){
    uncertainPixels++;if(alpha[i]<baseline[i])clearedBoundary++;
    if(alpha[i]>baseline[i])restoredBoundary++;
   }
  }
  return {proposalAvailable:true,eligible:false,displayEligible:false,requiresIndependentMaskReview:true,
   reason:'source-guided-boundary-proposal',alpha,projectedAlpha:baseline,uncertainty,
   width,height,guideWidth:gw,guideHeight:gh,clearedBoundaryPixels:clearedBoundary,
   restoredBoundaryPixels:restoredBoundary,uncertainBoundaryPixels:uncertainPixels,
   outsideBandChanges:0,sourceAltered:false,garmentReconstructed:false,
   completeBoundaryQualityVerified:false};
 }
 root.ClosetSourceGuidedMask=Object.freeze({propose,MAX,GUIDE_MAX});
 if(typeof module!=='undefined')module.exports=root.ClosetSourceGuidedMask;
})(typeof window!=='undefined'?window:globalThis);
