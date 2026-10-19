// Offline adapter to existing production pixel functions; no application changes.
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const [inputPath,outputPath,repoArg]=process.argv.slice(2),repo=path.resolve(repoArg||'.');
const white=require(path.join(repo,'public/closet-white-matte.js'));
const warp=require(path.join(repo,'public/local-garment-warp.js'));
const figures=require(path.join(repo,'public/reusable-figure-engine.js'));
if(typeof warp.rasterize!=='function'||typeof warp.hasAmbiguousNeck!=='function')
 throw Error('This benchmark requires PR #33 pixel APIs; do not silently substitute another pipeline');
const entries=JSON.parse(fs.readFileSync(inputPath,'utf8')),results=[];
for(const entry of entries){
 const {width,height}=entry,data=new Uint8ClampedArray(fs.readFileSync(entry.rgbaPath));
 if(data.length!==width*height*4||width*height>150000)throw Error('Invalid decoded pixel input');
 const hash=d=>crypto.createHash('sha256').update(d).digest('hex'),inputHash=hash(data);
 let reason,eligible=false;
 if(white.hasTransparentBackground(data,width,height)){eligible=true;reason='native-alpha-candidate';}
 else{
  const matte=white.analyze(data,width,height,{category:entry.category,primaryColor:entry.primaryColor});
  reason=matte.reason;
  if(matte.eligible){
   for(let i=0;i<matte.alpha.length;i++)data[i*4+3]=matte.alpha[i];
   const bounds=warp.alphaBounds(data,width,height);
   if(['Tops','Outerwear','Dresses'].includes(entry.category)&&warp.hasAmbiguousNeck(data,width,height,bounds))
    reason='ambiguous-neck-or-pale-collar';
   else{eligible=true;reason='white-exterior-candidate';}
  }
 }
 const bounds=warp.alphaBounds(data,width,height);
 // Keep rejected intermediate masks as clearly labelled research diagnostics.
 const maskPath=entry.rgbaPath+'.mask',warpedPath=entry.rgbaPath+'.warp';
 fs.writeFileSync(maskPath,data);
 let fitted=data,mesh=null;
 if(bounds&&bounds.width>=24&&bounds.height>=24){
  const trimmed=new Uint8ClampedArray(bounds.width*bounds.height*4);
  for(let y=0;y<bounds.height;y++)trimmed.set(data.subarray(((bounds.top+y)*width+bounds.left)*4,
   ((bounds.top+y)*width+bounds.left+bounds.width)*4),y*bounds.width*4);
  mesh=warp.makeMesh(bounds.width,bounds.height,entry.category);
  fitted=mesh?warp.rasterize(trimmed,mesh):trimmed;
 }
 fs.writeFileSync(warpedPath,fitted);
 const originalUnchanged=hash(fs.readFileSync(entry.rgbaPath))===inputHash;
 if(!originalUnchanged)throw Error('Decoded original changed');
 results.push({id:entry.id,eligible,reason,bounds,maskPath,warpedPath,
  fittedWidth:bounds?.width>=24&&bounds?.height>=24?bounds.width:width,
  fittedHeight:bounds?.width>=24&&bounds?.height>=24?bounds.height:height,
  candidateRgbaSha256:hash(fitted),decodedSourceSha256:inputHash,originalUnchanged,
  compositingDecision:'hold-until-independent-mask-and-composite-review',
  placements:Object.fromEntries(['female','male'].map(figure=>[figure,figures.placementRect(
   entry.category==='Bottoms'?'bottom':entry.category==='Shoes'?'shoes':entry.category==='Outerwear'?'layer':'top',entry,figure)])),
  fidelityPercent:null,realPhoneTested:false});
}
fs.writeFileSync(outputPath,JSON.stringify(results,null,2)+'\n');
