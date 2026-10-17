import {decodeReferenceMask} from './garment-mask-metrics.mjs';
// Diagnostic proposal only: candidates must be visually reviewed before mask changes.
export function footwearShadowCandidates(prediction,{bottomFraction=.3}={}){
 if(!Number.isFinite(bottomFraction)||bottomFraction<=0||bottomFraction>1)throw Error('Invalid bottomFraction');
 const {width:w,height:h}=prediction,mask=decodeReferenceMask(prediction);
 let first=0,last=h-1;const rowCount=new Uint32Array(h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)rowCount[y]+=mask[y*w+x];
 while(first<h&&!rowCount[first])first++;while(last>=0&&!rowCount[last])last--;
 if(first>=h)return {candidatePixels:0,rows:[],reviewOnly:true};
 const start=Math.floor(first+(last-first)*(1-bottomFraction));let candidatePixels=0,rows=[];
 for(let y=start;y<=last;y++){const occupancy=rowCount[y]/w; if(occupancy>0&&occupancy<.12){candidatePixels+=rowCount[y];rows.push({y,pixels:rowCount[y]});}}
 return {candidatePixels,rows,reviewOnly:true,note:'Sparse lower rows may contain real heels or soles; not automatically removable'};
}

/**
 * Read-only lower-edge silhouette profile for connected shadow investigation.
 * A row's width and center shift can flag suspicious extensions, but cannot
 * establish whether the pixels are shoe material or a cast shadow.
 */
export function footwearLowerSilhouetteProfile(prediction,{bottomFraction=.35}={}){
 if(!Number.isFinite(bottomFraction)||bottomFraction<=0||bottomFraction>1)throw Error('Invalid bottomFraction');
 const {width,height}=prediction,mask=decodeReferenceMask(prediction);
 const start=Math.floor(height*(1-bottomFraction)),rows=[];
 for(let y=start;y<height;y++){
  let left=width,right=-1,count=0,sum=0;
  for(let x=0;x<width;x++)if(mask[y*width+x]){left=Math.min(left,x);right=Math.max(right,x);sum+=x;count++;}
  if(count)rows.push({y,count,left,right,span:right-left+1,center:sum/count,occupancy:count/width});
 }
 const shifts=[],abruptRows=[];
 for(let i=1;i<rows.length;i++){
  const previous=rows[i-1],current=rows[i];
  // Never compare disconnected image rows as if they were consecutive.
  if(current.y!==previous.y+1)continue;
  const centerShift=current.center-previous.center,spanChange=current.span-previous.span;
  const step={y:current.y,centerShift,spanChange,centerShiftFraction:centerShift/width,spanChangeFraction:spanChange/width};
  shifts.push(step);
  // Large silhouette transitions deserve inspection, NOT automatic removal.
  if(Math.abs(step.centerShiftFraction)>=.03||Math.abs(step.spanChangeFraction)>=.1)abruptRows.push(step);
 }
 return {rows,shifts,abruptRows,reviewOnly:true,removedPixels:0,requiresApprovedReference:true,thresholds:{centerShiftFraction:.03,spanChangeFraction:.1}};
}
