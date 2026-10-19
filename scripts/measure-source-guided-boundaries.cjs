'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
const refine=require('../public/source-guided-mask-refinement.js'),engine=require('../public/dark-studio-garment-mask.js'),warp=require('../public/local-garment-warp.js');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const [input,output]=process.argv.slice(2),rows=JSON.parse(fs.readFileSync(input));
const witnesses=JSON.parse(fs.readFileSync('benchmark/dark-studio-source-witnesses.json'));
const regions=[['collar',[.34,.17,.66,.29]],['left-cuff',[.02,.41,.19,.53]],['right-cuff',[.81,.41,.95,.51]],['hem',[.23,.85,.81,.93]]];
const records=[];
for(const row of rows){
 const data=new Uint8ClampedArray(fs.readFileSync(row.rgbaPath)),before=hash(data),p=refine.propose(data,row.width,row.height,row);
 const record={id:row.id,sourceSha256:row.sourceSha256,width:row.width,height:row.height,
  decodedSourceSha256:before,proposalAvailable:p.proposalAvailable,displayEligible:p.displayEligible,
  reason:p.reason,sourceUnchanged:hash(data)===before,completeBoundaryQualityVerified:false};
 if(p.proposalAvailable){
  const originalProjection=engine.applyAlpha(data,p.projectedAlpha),candidate=engine.applyAlpha(data,p.alpha),uncertaintyRgba=new Uint8ClampedArray(data);
  let rgbChanges=0,outsideBandChanges=0;
  for(let i=0;i<data.length;i++)if(i%4!==3&&data[i]!==candidate[i])rgbChanges++;
  for(let i=0;i<p.alpha.length;i++){
   if(!p.uncertainty[i]&&p.alpha[i]!==p.projectedAlpha[i])outsideBandChanges++;
   if(p.uncertainty[i])uncertaintyRgba.set([255,175,0,255],i*4);
  }
  const patches=[];
  for(const patch of witnesses.witnesses){
   let count=0,opaque=0,clear=0;const [l,t,r,b]=patch.box;
   for(let y=Math.ceil(t*row.height);y<Math.floor(b*row.height);y++)for(let x=Math.ceil(l*row.width);x<Math.floor(r*row.width);x++){
    count++;const a=p.alpha[y*row.width+x];if(a===255)opaque++;if(a===0)clear++;
   }
   patches.push({name:patch.name,role:patch.role,pixels:count,opaque,clear});
  }
  const boundaryRegions=regions.map(([name,[l,t,r,b]])=>{
   let cleared=0,restored=0,uncertain=0;
   for(let y=Math.floor(t*row.height);y<Math.ceil(b*row.height);y++)for(let x=Math.floor(l*row.width);x<Math.ceil(r*row.width);x++){
    const i=y*row.width+x;if(p.uncertainty[i])uncertain++;
    if(p.alpha[i]<p.projectedAlpha[i])cleared++;if(p.alpha[i]>p.projectedAlpha[i])restored++;
   }
   return {name,box:[l,t,r,b],uncertain,clearedSourceNeutralPixels:cleared,restoredSourceNonNeutralPixels:restored,
    correctnessIndependentlyScored:false};
  });
  const bounds=warp.alphaBounds(candidate,row.width,row.height),trimmed=new Uint8ClampedArray(bounds.width*bounds.height*4);
  for(let y=0;y<bounds.height;y++)trimmed.set(candidate.subarray(((bounds.top+y)*row.width+bounds.left)*4,
   ((bounds.top+y)*row.width+bounds.left+bounds.width)*4),y*bounds.width*4);
  const fitted=warp.rasterize(trimmed,warp.makeMesh(bounds.width,bounds.height,row.category));
  for(const [label,pixels]of [['projection',originalProjection],['candidate',candidate],['uncertainty',uncertaintyRgba],['warp',fitted]])fs.writeFileSync(row.rgbaPath+'.'+label,pixels);
  Object.assign(record,{guideWidth:p.guideWidth,guideHeight:p.guideHeight,clearedBoundaryPixels:p.clearedBoundaryPixels,
   restoredBoundaryPixels:p.restoredBoundaryPixels,uncertainBoundaryPixels:p.uncertainBoundaryPixels,rgbBytesChanged:rgbChanges,
   outsideBandChanges,safetyMode:p.safetyMode,neutralForegroundPixelsRetained:p.experimentalNeutralForegroundPixels,partialWitnesses:patches,boundaryRegions,bounds,candidateRgbaSha256:hash(candidate),warpRgbaSha256:hash(fitted),
   maskRgbMeasurementsBeforeWarp:true,independentFullMaskReference:null});
 }
 records.push(record);
}
fs.writeFileSync(output,JSON.stringify(records,null,2)+'\n');
