// Verified licensed originals, never customer data, no paid service.
// Output compares the genuine photo with a free, entirely original-pixel
// derived alpha preview. Rejected cases show the untouched photo on the right.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import sharp from 'sharp';
const require=createRequire(import.meta.url);
const neutral=require('../public/closet-neutral-matte.js');
const samples=[
 {id:'commons-0035',category:'Bottoms',manifest:'locked'},
 {id:'commons-0065',category:'Outerwear',manifest:'locked'},
 {id:'validation-0017',category:'Bottoms',manifest:'fresh'},
 {id:'validation-0019',category:'Shoes',manifest:'fresh'},
 {id:'commons-0079',category:'Shoes',manifest:'locked'},
 {id:'commons-0094',category:'Shoes',manifest:'locked'},
 {id:'validation-0021',category:'Shoes',manifest:'fresh'},
 {id:'validation-0023',category:'Shoes',manifest:'fresh'},
 {id:'validation-0024',category:'Shoes',manifest:'fresh'}
];
const dir=process.argv[2]||'benchmark/real-neutral-matte-review';
await mkdir(dir,{recursive:true});
const [locked,fresh]=await Promise.all([
 readFile('benchmark/locked-photo-sources.json','utf8').then(JSON.parse),
 readFile('benchmark/manifest-fresh-11.json','utf8').then(JSON.parse)]);
const indexes={locked:new Map(locked.map(x=>[x.id,x])),
 fresh:new Map(fresh.map(x=>[x.id,x]))};
const report={status:'running',sourcePhotosHashVerified:false,
 benchmarkUsesActualOriginalImageBytes:true,licensedSources:samples.length,
 sourcePixelIdentityPreserved:true,oneChannelAlphaVerified:true,
 appRecordsModified:0,paidProviderCalls:0,
 garmentSegmentationGroundTruth:false,garmentIdentityVerifiedByHuman:false,
 reconstructionAccuracy:null,autoApproveForLiveCustomers:false,cases:[]};
const save=()=>writeFile(join(dir,'summary.json'),JSON.stringify(report,null,2)+'\n');
await save();
for(const row of samples){
 const meta=indexes[row.manifest].get(row.id);
 if(!meta?.verified||!meta?.attribution?.license)throw Error('Missing licensed source');
 const jpeg=await readFile(join('benchmark/photos',meta.image));
 const sha=createHash('sha256').update(jpeg).digest('hex');
 if(sha!==meta.sha256)throw Error('Original licensed photo checksum mismatch '+row.id);
 const obj=sharp(jpeg).rotate(),dimensions=await obj.metadata();
 const limit=320/Math.max(dimensions.width,dimensions.height);
 const w=Math.max(40,Math.round(dimensions.width*Math.min(1,limit)));
 const h=Math.max(40,Math.round(dimensions.height*Math.min(1,limit)));
 const {data,info}=await sharp(jpeg).rotate().resize(w,h)
  .ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const proposal=neutral.analyze(data,info.width,info.height,row.category);
 // Real-image regression: this high-top's white soles were erased despite
 // passing the original dark/colorful foreground checks.
 if(row.id==='validation-0023'&&(proposal.eligible||
    proposal.reason!=='possible-pale-sole-or-separated-shadow'))
  throw Error('Pale high-top sole regression: must retain original photo');
 if(row.id==='validation-0019'&&!proposal.eligible)
  throw Error('Previously reviewed coral sneaker preview unexpectedly rejected');
 let derived=Buffer.from(jpeg);
 if(proposal.eligible){
  // Only change alpha. RGB bytes are those of the source's decoded image.
  const mask=Buffer.alloc(info.width*info.height);
  for(let i=0;i<proposal.alpha.length;i++)mask[i]=proposal.alpha[i];
  const full=await sharp(jpeg).rotate().ensureAlpha().png().toBuffer();
  const whole=await sharp(full).metadata();
  const {data:alpha,info:matteInfo}=await sharp(mask,{
   raw:{width:info.width,height:info.height,channels:1}
  }).resize(whole.width,whole.height,{kernel:'nearest'})
    .greyscale().raw().toBuffer({resolveWithObject:true});
  const {data:rgba,info:original}=await sharp(full).raw().toBuffer({resolveWithObject:true});
  if(matteInfo.channels!==1||matteInfo.width!==original.width||
     matteInfo.height!==original.height||
     alpha.length!==original.width*original.height||original.channels!==4)
   throw Error('Invalid one-channel shoe alpha map, would corrupt image');
  // Sharp expands a 1-channel raw image to three channels on resize unless
  // output is explicitly grayscale, shifting alpha and erasing shoe material.
  const foreground=alpha.reduce((n,value)=>n+(value>127?1:0),0)/alpha.length;
  if(Math.abs(foreground-(1-proposal.backgroundFraction))>.08)
   throw Error('Resampled alpha removed real shoe foreground');
  for(let i=0;i<alpha.length;i++)rgba[i*4+3]=alpha[i];
  derived=await sharp(rgba,{raw:original}).png().toBuffer();
 }
 const size={width:360,height:360},background={r:236,g:226,b:246,alpha:1};
 const before=await sharp(jpeg).rotate().resize(size.width,size.height,
   {fit:'contain',background}).png().toBuffer();
 const after=await sharp(derived).resize(size.width,size.height,
   {fit:'contain',background}).flatten({background}).png().toBuffer();
 const textSvg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="720" height="66"><rect width="720" height="66" fill="#ffffff"/><text x="12" y="28" font-size="20" fill="#111" font-family="sans-serif">Actual original photo</text><text x="371" y="28" font-size="20" fill="#111" font-family="sans-serif">Free preview</text><text x="12" y="51" font-size="13" fill="#555" font-family="sans-serif">No synthesized clothing. Compare edges / fabric against original.</text></svg>');
 const filename=row.id+'-original-vs-free-preview.png';
 await sharp({create:{width:720,height:426,channels:3,background:'#fff'}})
  .composite([{input:textSvg,left:0,top:0},{input:before,left:0,top:66},
    {input:after,left:360,top:66}]).png().toFile(join(dir,filename));
 report.cases.push({id:row.id,category:row.category,sha256:sha,
  action:proposal.eligible?'original-pixel-exterior-background-removal':'original-photo-fallback',
  reason:proposal.reason,
  backgroundFraction:proposal.backgroundFraction??null,
  originalBytesVerified:true,savedSourceUnchanged:true,
  automaticIdentityApproval:false,groundTruthPixelMaskAvailable:false,
  comparisonFile:filename});
 await save();
 console.log('NEUTRAL_MATTE_CASE '+JSON.stringify(report.cases.at(-1)));
}
report.sourcePhotosHashVerified=true;report.status='complete';await save();
