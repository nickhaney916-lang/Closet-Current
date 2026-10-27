/**
 * Research-only LICENSED actual garment reconstruction + human alpha edit.
 * Work #33's frozen PNG is an **ALPHA MASK**, never a color clothing PNG.
 * Reapply Work #30's immutable mask to source JPEG RGB before erasing.
 */
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {applyReviewedEraser} from '../research/family-alpha-35/reviewed-mask-controls.mjs';
const sourceRef='53f2ad344dc56a1477e343531c423aed0e66c17d';
const clipPin='dd6bac3fa9ff640d4f562cf925337440bdb5cf8f';
const key='commons-0053';
const maskFile='research/family-alpha-33/frozen-alpha/'+key+'.png';
const srcFile='benchmark/fixtures/'+key+'.jpg';
const pinnedPath='research/family-alpha-30/clipping.mjs';
const pinnedBytes=execFileSync('git',['show',clipPin+':'+pinnedPath],{maxBuffer:3e6});
const digest=x=>createHash('sha256').update(x).digest('hex');
const maskPNG=execFileSync('git',['show',sourceRef+':'+maskFile],{maxBuffer:12e6});
const jpeg=execFileSync('git',['show',sourceRef+':'+srcFile],{maxBuffer:12e6});
const findings=JSON.parse(execFileSync('git',['show',sourceRef+':research/family-alpha-33/findings.json']));
const label=findings.rows.find(x=>x.id===key);
if(!label||label.sourceSHA256!==digest(jpeg)||label.alphaSHA256!==digest(maskPNG)||
 label.hasProposal!==true||label.ownerApproved!==false)
 throw Error('Frozen licensed garment or mask labels/source identity changed');
const {data:sourceData,info:sourceInfo}=await sharp(jpeg).rotate().ensureAlpha().raw().toBuffer({resolveWithObject:true});
const {data:maskData,info:maskInfo}=await sharp(maskPNG).greyscale().raw().toBuffer({resolveWithObject:true});
if(sourceInfo.width!==maskInfo.width||sourceInfo.height!==maskInfo.height||maskInfo.channels!==1)
 throw Error('Mismatch between licensed JPEG and Work30 source alpha');
const output='benchmark/family-alpha-35-real-dress-HOLD';
await mkdir(output,{recursive:true});
const temp=resolve('research/family-alpha-30/clipping.mjs');
await mkdir('research/family-alpha-30',{recursive:true});
let prepared;
try{
 await writeFile(temp,pinnedBytes);
 const {prepareAlphaProposal}=await import(pathToFileURL(temp).href+'?source-pin='+clipPin);
 const frame={width:sourceInfo.width,height:sourceInfo.height,data:new Uint8ClampedArray(sourceData)};
 const result=prepareAlphaProposal(frame,{
  alpha:new Uint8Array(maskData),category:label.category,
  sourceIdentity:key,sourceVersion:'sha256:'+label.sourceSHA256
 });
 if(result.status!=='review'||result.image!==null||!result.proposedCutout)
  throw Error('Expected unapproved original-RGB mannequin-cutout proposal');
 prepared=result.proposedCutout;
}finally{await rm(temp,{force:true});}
const encode=async frame=>sharp(Buffer.from(frame.rgba),{raw:{
 width:frame.width,height:frame.height,channels:4
}}).png().toBuffer();
const actualColoredPNG=await encode(prepared);
if(digest(actualColoredPNG)!==label.work30NativeCutoutSHA256)
 throw Error('Reconstructed licensed original RGB proposal not EXACT Work30 frozen source');
const planned=[{
 // Human-traced inner edge of the genuine white V-collar. The area INSIDE
 // the trim contains the mannequin's upper neck/chest, not dress fabric.
 // No semantic skin detection, recoloring or invented garment texture.
 kind:'polygon',points:[
  [.454,.036],[.696,.036],[.706,.110],[.700,.138],
  [.673,.180],[.632,.205],[.571,.244],[.505,.208],
  [.470,.170],[.452,.135]
 ].map(([x,y])=>({x,y}))
}];
const base={width:prepared.width,height:prepared.height,rgba:new Uint8ClampedArray(prepared.rgba)};
const changed=applyReviewedEraser(base,planned);
const editedPNG=await encode(changed);
let alteredRgb=0,addedAlpha=0,erasedAlpha=0;
for(let p=0;p<base.rgba.length;p+=4){
 if(changed.rgba[p+3]>base.rgba[p+3])addedAlpha++;
 if(changed.rgba[p+3]<base.rgba[p+3])erasedAlpha++;
 if(changed.rgba[p+3]>=128)
  for(let c=0;c<3;c++)if(changed.rgba[p+c]!==base.rgba[p+c])alteredRgb++;
}
if(alteredRgb||addedAlpha||erasedAlpha<100||
 changed.visiblePixels/changed.originalVisiblePixels<.55)
 throw Error('Manually proposed alpha-only source faithful operation invalid');
await writeFile(output+'/'+key+'-original-provisional.png',actualColoredPNG);
await writeFile(output+'/'+key+'-manually-proposed-neck-cleanup.png',editedPNG);
await writeFile(output+'/evidence.json',JSON.stringify({
 releaseGate:'HOLD',role:'hand outlined mannequin neck INSIDE genuine V-collar, no owner garment approval',
 sourceJPEGPin:sourceRef,originalJPEGSha256:digest(jpeg),
 maskFile,maskSha256:digest(maskPNG),
 replayedWork30CutoutSha256:digest(actualColoredPNG),
 finalCandidateSha256:digest(editedPNG),
 rgbaCutoutSize:{width:base.width,height:base.height},
 rawRGBChanged:false,retainedOriginalJPEGChanged:false,
 originalColoredCutoutVerified:true,alphaOnly:true,erasedAlpha,addedAlpha,alteredRgb,
 planned,modelInferred:false,ownerApproved:false,
 clippingAccuracyCertified:false,retainedGarmentFraction:changed.visiblePixels/changed.originalVisiblePixels
},null,2)+'\n');
console.log('REAL_LICENSED_COLORED_DRESS_SOURCE_RGB_ALPHA_ONLY_REVIEW_PROPOSAL',JSON.stringify({
 originalColoredCutoutVerified:true,width:base.width,height:base.height,
 erasedAlpha,addedAlpha,alteredRgb,releaseGate:'HOLD'
}));
