// REVIEW ONLY — locate object-only foreground withheld by clothing segmentation.
// A difference can be fabric, cast shadow, a face, or a mannequin. This module
// never repairs a mask or writes to an original photograph.
export function analyzeObjectHybridDisagreement(objectAlpha,hybridAlpha,width,height,{
 category,personDetected,threshold=128,maxRegions=8
}={}){
 const n=width*height;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<4||height<4||
  n>12_000_000||objectAlpha?.length!==n||hybridAlpha?.length!==n||
  !['Dresses','Bottoms','Shoes','Tops','Outerwear'].includes(category)||
  typeof personDetected!=='boolean'||
  !Number.isInteger(threshold)||threshold<1||threshold>255||
  !Number.isInteger(maxRegions)||maxRegions<1||maxRegions>20)
  throw Error('Invalid candidate disagreement evidence');
 let objectPixels=0,retainedPixels=0,objectOnlyPixels=0,minY=height,maxY=-1;
 const missing=new Uint8Array(n);
 for(let i=0;i<n;i++){
  const a=objectAlpha[i],b=hybridAlpha[i];
  if(!Number.isInteger(a)||a<0||a>255||b!==0&&b!==255)
   throw Error('Invalid model alpha values');
  const object=a>=threshold;
  if(b&&!object)throw Error('Hybrid mask cannot contain unsupported object pixels');
  if(object){objectPixels++;const y=Math.floor(i/width);
   minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  if(b)retainedPixels++;
  if(object&&!b){missing[i]=1;objectOnlyPixels++;}
 }
 const seen=new Uint8Array(n),queue=new Uint32Array(n),regions=[];
 const lowerStart=maxY<0?height:Math.floor(minY+(maxY-minY)*.67);
 let touchingPixelCount=0,lowerPixelCount=0,frameTouchingPixels=0;
 for(let start=0;start<n;start++){
  if(!missing[start]||seen[start])continue;
  seen[start]=1;queue[0]=start;
  let front=0,back=1,x0=width,x1=-1,y0=height,y1=-1,
   touchingRetainedPixels=0,lowerPixels=0,framePixels=0;
  while(front<back){
   const i=queue[front++],x=i%width,y=Math.floor(i/width);
   x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   if(y>=lowerStart)lowerPixels++;
   if(x===0||y===0||x===width-1||y===height-1)framePixels++;
   let nearRetained=false;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    if(!dx&&!dy)continue;
    const xx=x+dx,yy=y+dy;
    if(xx<0||yy<0||xx>=width||yy>=height)continue;
    const j=yy*width+xx;
    if(hybridAlpha[j])nearRetained=true;
    if(missing[j]&&!seen[j]){seen[j]=1;queue[back++]=j;}
   }
   if(nearRetained)touchingRetainedPixels++;
  }
  touchingPixelCount+=touchingRetainedPixels;
  lowerPixelCount+=lowerPixels;
  frameTouchingPixels+=framePixels;
  regions.push({pixels:back,bounds:{x:x0,y:y0,width:x1-x0+1,height:y1-y0+1},
   touchesRetainedGarment:touchingRetainedPixels>0,
   borderContact:framePixels>0,nearRetainedPixels:touchingRetainedPixels,
   lowerObjectBandPixels:lowerPixels,
   interpretation:'possible-fabric-or-shadow-or-body'});
 }
 regions.sort((a,b)=>b.pixels-a.pixels);
 return {category,personDetected,objectPixels,retainedPixels,
  objectOnlyPixels,connectedRegionCount:regions.length,largestRegions:regions.slice(0,maxRegions),
  objectLowerBandStart:lowerStart,objectOnlyLowerBandPixels:lowerPixelCount,
  objectOnlyAdjacentToRetainedPixels:touchingPixelCount,
  objectOnlyFrameContactPixels:frameTouchingPixels,
  requiresSkinOrMannequinReview:personDetected&&objectOnlyPixels>0,
  requiresShadowReview:objectOnlyPixels>0,
  garmentPixelsRecoveredVerified:false,backgroundPixelsIdentifiedVerified:false,
  independentApprovedOutlineAvailable:false,reviewOnly:true,
  originalPhotoModified:false,recognitionModified:false,
  productionAuthorized:false,notPixelAccuracy:true};
}
