// Read-only, source-grid human outline topology advisories.
// These are NOT measurements of correctness and cannot approve a reference.
import {decodeReferenceMask} from '../benchmark/garment-mask-metrics.mjs';

const top3=(arr,row)=>{arr.push(row);arr.sort((a,b)=>b.pixels-a.pixels);if(arr.length>3)arr.pop();};

export function inspectHumanOutline(annotation){
 const w=annotation?.width,h=annotation?.height;
 const mask=decodeReferenceMask(annotation),n=w*h;
 const foregroundPixels=mask.reduce((a,b)=>a+b,0);
 if(!foregroundPixels||foregroundPixels===n)throw Error('Human outline requires garment and background');
 const seen=new Uint8Array(n),queue=new Int32Array(n);
 let connectedGarmentRegions=0,largestGarmentRegionPixels=0,fragmentPixels=0;
 let bounds={left:w,top:h,right:-1,bottom:-1};
 const biggestGarmentRegions=[];
 for(let seed=0;seed<n;seed++){
  if(!mask[seed]||seen[seed])continue;
  connectedGarmentRegions++;
  seen[seed]=1;queue[0]=seed;
  let front=0,back=1,left=w,right=-1,top=h,bottom=-1;
  while(front<back){
   const i=queue[front++],x=i%w,y=(i-x)/w;
   left=Math.min(left,x);right=Math.max(right,x);
   top=Math.min(top,y);bottom=Math.max(bottom,y);
   if(x>0&&mask[i-1]&&!seen[i-1]){seen[i-1]=1;queue[back++]=i-1;}
   if(x+1<w&&mask[i+1]&&!seen[i+1]){seen[i+1]=1;queue[back++]=i+1;}
   if(y>0&&mask[i-w]&&!seen[i-w]){seen[i-w]=1;queue[back++]=i-w;}
   if(y+1<h&&mask[i+w]&&!seen[i+w]){seen[i+w]=1;queue[back++]=i+w;}
  }
  largestGarmentRegionPixels=Math.max(largestGarmentRegionPixels,back);
  bounds.left=Math.min(bounds.left,left);bounds.right=Math.max(bounds.right,right);
  bounds.top=Math.min(bounds.top,top);bounds.bottom=Math.max(bounds.bottom,bottom);
  top3(biggestGarmentRegions,{pixels:back,bounds:{left,top,right,bottom}});
 }
 fragmentPixels=foregroundPixels-largestGarmentRegionPixels;
 // Reuse 'seen' without reinitializing: all garment pixels already visited;
 // mark each background component once. Components not touching the photo
 // border are true *topological gaps*, NOT independently verified missing fabric.
 let interiorBackgroundRegions=0,interiorBackgroundPixels=0,largestInteriorGapPixels=0;
 const biggestInteriorGaps=[];
 for(let seed=0;seed<n;seed++){
  if(mask[seed]||seen[seed])continue;
  seen[seed]=1;queue[0]=seed;
  let front=0,back=1,frameConnected=false,left=w,top=h,right=-1,bottom=-1;
  while(front<back){
   const i=queue[front++],x=i%w,y=(i-x)/w;
   if(x===0||y===0||x===w-1||y===h-1)frameConnected=true;
   left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
   if(x>0&&!mask[i-1]&&!seen[i-1]){seen[i-1]=1;queue[back++]=i-1;}
   if(x+1<w&&!mask[i+1]&&!seen[i+1]){seen[i+1]=1;queue[back++]=i+1;}
   if(y>0&&!mask[i-w]&&!seen[i-w]){seen[i-w]=1;queue[back++]=i-w;}
   if(y+1<h&&!mask[i+w]&&!seen[i+w]){seen[i+w]=1;queue[back++]=i+w;}
  }
  if(frameConnected)continue;
  interiorBackgroundRegions++;interiorBackgroundPixels+=back;
  largestInteriorGapPixels=Math.max(largestInteriorGapPixels,back);
  top3(biggestInteriorGaps,{pixels:back,bounds:{left,top,right,bottom}});
 }
 let photoFrameForegroundPixels=0;
 for(let x=0;x<w;x++){photoFrameForegroundPixels+=mask[x]+mask[(h-1)*w+x];}
 for(let y=1;y<h-1;y++){photoFrameForegroundPixels+=mask[y*w]+mask[y*w+w-1];}
 const flags=[];
 if(connectedGarmentRegions>1)flags.push({code:'multiple-foreground-regions',
  explanation:'Detached garment-mask islands may be real disconnected cloth or may include unrelated objects; inspect all regions.'});
 if(interiorBackgroundRegions>0)flags.push({code:'interior-background-gaps',
  explanation:'Enclosed background gaps can represent correct sleeve/collar openings or incorrectly removed cloth; visually verify each opening.'});
 if(photoFrameForegroundPixels>0)flags.push({code:'garment-touches-image-frame',
  explanation:'Marked garment pixels touch the original photograph border; check for cropping or background inclusion.'});
 if(foregroundPixels/n<0.01||foregroundPixels/n>0.90)
  flags.push({code:'unusual-mask-coverage',explanation:'Very small or large marked area; manually check physical target and background.'});
 return {schemaVersion:1,kind:'UNVERIFIED-HUMAN-REVIEW-ADVISORY',
  originalGrid:{width:w,height:h,pixels:n},foregroundPixels,foregroundFraction:foregroundPixels/n,
  connectedGarmentRegions,largestGarmentRegionPixels,fragmentPixels,
  garmentBounds:bounds,largestGarmentRegions:biggestGarmentRegions,
  interiorBackgroundRegions,interiorBackgroundPixels,largestInteriorGapPixels,largestInteriorGaps:biggestInteriorGaps,
  photoFrameForegroundPixels,flags,flagCount:flags.length,
  referenceCorrectnessMeasured:false,visibleClothingAccuracyProven:false,
  qualityGatePassed:false,productionAuthorized:false,
  interpretation:'Topology alone cannot tell garment from background, fabric holes from missing material, or validate RGB/transparency. Human visual review required.'};
}
