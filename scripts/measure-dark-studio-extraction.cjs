'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
const dark=require('../public/dark-studio-garment-mask.js'),white=require('../public/closet-white-matte.js'),warp=require('../public/local-garment-warp.js');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const [inputPath,outputPath]=process.argv.slice(2),rows=JSON.parse(fs.readFileSync(inputPath));
const witnesses=JSON.parse(fs.readFileSync('benchmark/dark-studio-source-witnesses.json'));
const results=[];
for(const row of rows){
 const source=new Uint8ClampedArray(fs.readFileSync(row.rgbaPath)),before=digest(source);
 const r=dark.analyze(source,row.width,row.height,row);
 const whiteResult=white.analyze(source,row.width,row.height,row);
 let baselineReason=whiteResult.reason;
 if(whiteResult.eligible){
  const rgba=dark.applyAlpha(source,whiteResult.alpha),bounds=warp.alphaBounds(rgba,row.width,row.height);
  baselineReason=warp.hasAmbiguousNeck(rgba,row.width,row.height,bounds)?'ambiguous-neck-or-pale-collar':'white-exterior-candidate';
 }
 const result={id:row.id,sourceSha256:row.sourceSha256,decodedRgbaSha256:before,width:row.width,height:row.height,
  previousDisposition:'hold',previousReason:baselineReason,proposalAvailable:r.proposalAvailable,
  displayEligible:r.displayEligible,reason:r.reason,garmentIdentityVerified:false,
  fullMaskPrecision:null,fullMaskRecall:null,independentlyReviewed:false,sourceUnchanged:digest(source)===before};
 if(r.proposalAvailable){
  const candidate=dark.applyAlpha(source,r.alpha),bounds=warp.alphaBounds(candidate,row.width,row.height);
  let rgbChanged=0;
  for(let i=0;i<source.length;i++)if(i%4!==3&&source[i]!==candidate[i])rgbChanged++;
  const partial=[];
  if(row.id===witnesses.id){
   if(row.sourceSha256!==witnesses.sourceSha256)throw Error('Witness source mismatch');
   for(const patch of witnesses.witnesses){
    const [l,t,r,b]=patch.box;let pixels=0,retained=0,removed=0;
    for(let y=Math.ceil(t*row.height);y<Math.floor(b*row.height);y++)
     for(let x=Math.ceil(l*row.width);x<Math.floor(r*row.width);x++){
      pixels++;const alpha=candidate[(y*row.width+x)*4+3];
      if(alpha===255)retained++;if(alpha===0)removed++;
     }
    partial.push({name:patch.name,role:patch.role,pixels,retained,removed});
   }
  }
  const trimmed=new Uint8ClampedArray(bounds.width*bounds.height*4);
  for(let y=0;y<bounds.height;y++)trimmed.set(candidate.subarray(((bounds.top+y)*row.width+bounds.left)*4,
   ((bounds.top+y)*row.width+bounds.left+bounds.width)*4),y*bounds.width*4);
  const fitted=warp.rasterize(trimmed,warp.makeMesh(bounds.width,bounds.height,row.category));
  fs.writeFileSync(row.rgbaPath+'.candidate',candidate);fs.writeFileSync(row.rgbaPath+'.warp',fitted);
  Object.assign(result,{backgroundPixelsRemoved:r.backgroundPixels,backgroundFraction:r.backgroundPixels/(row.width*row.height),
   unchangedRgbBytes:source.length/4*3-rgbChanged,rgbBytesChanged:rgbChanged,
   candidateRgbaSha256:digest(candidate),warpRgbaSha256:digest(fitted),bounds,
   partialSourceWitnesses:partial,partialWitnessProvenance:witnesses.status});
 }
 results.push(result);
}
fs.writeFileSync(outputPath,JSON.stringify(results,null,2)+'\n');
