/**
 * Research-only licensed ORIGINAL cutout verification. Do not auto-promote
 * the result to an app wardrobe: it is deliberately hand-directed edit data.
 * Reference Work #33 already has attribution and permission for this fixture.
 */
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {applyReviewedEraser} from '../research/family-alpha-35/reviewed-mask-controls.mjs';
const sourceRef='53f2ad344dc56a1477e343531c423aed0e66c17d';
const key='commons-0053';
const reference='research/family-alpha-33/frozen-alpha/'+key+'.png';
const original=execFileSync('git',['show',sourceRef+':'+reference],{maxBuffer:8e6});
const {data,info}=await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true});
if(info.width<32||info.height<32||info.width*info.height>8e6)throw Error('Unexpected original native PNG');
const digest=x=>createHash('sha256').update(x).digest('hex');
const planned=[
 // USER-REVIEW-REQUIRED erase strokes for the mannequin NECK (NOT the shirt).
 // These positions reflect inspection of the licensed photo, not inference
 // from skin color. Refuse any result that touches a garment without approval.
 [.43,.065],[.50,.065],[.57,.065],
 [.42,.111],[.49,.111],[.56,.111],
 [.46,.155],[.53,.155]
].map(([x,y])=>({x,y,radius:.043}));
const base={width:info.width,height:info.height,rgba:new Uint8ClampedArray(data)};
const proposal=applyReviewedEraser(base,planned);
const cleaned=await sharp(Buffer.from(proposal.rgba),{raw:{
 width:info.width,height:info.height,channels:4
}}).png().toBuffer();
// Native decoded RGB is preserved by review, but PNG encoding may change
// transparent RGB pre-multiplication; exact checks apply to RAW pixels above.
const finalRaw=await sharp(cleaned).ensureAlpha().raw().toBuffer();
let alteredRgb=0,addedAlpha=0,erasedAlpha=0;
for(let p=0;p<data.length;p+=4){
 if(proposal.rgba[p+3]>data[p+3])addedAlpha++;
 if(proposal.rgba[p+3]<data[p+3])erasedAlpha++;
 if(proposal.rgba[p+3]>=128){
  for(let c=0;c<3;c++)if(proposal.rgba[p+c]!==data[p+c])alteredRgb++;
 }
}
if(alteredRgb||addedAlpha||erasedAlpha<100||
 proposal.visiblePixels/proposal.originalVisiblePixels<.55)
 throw Error('Unsafe real-photo mask modification');
const out='benchmark/family-alpha-35-real-dress-HOLD';
await mkdir(out,{recursive:true});
await writeFile(out+'/'+key+'-original-provisional.png',original);
await writeFile(out+'/'+key+'-manually-proposed-neck-cleanup.png',cleaned);
await writeFile(out+'/evidence.json',JSON.stringify({
 releaseGate:'HOLD',role:'manual original cutout clean-up proposal, NOT garment approval',
 benchmark:'licensed Work #33 original frozen native PNG, not family data',
 sourceCommit:sourceRef,sourceFile:reference,
 inputSha256:digest(original),outputSha256:digest(cleaned),
 width:info.width,height:info.height,
 originalSourcePixelRGBChanged:false,originalJPEGChanged:false,
 rawForegoundRgbAltered:alteredRgb,addedAlpha,erasedAlpha,
 strokes:planned,modelInferred:false,ownerApproved:false,
 clippingAccuracyCertified:false,retainedGarmentFraction:proposal.visiblePixels/proposal.originalVisiblePixels
},null,2)+'\n');
console.log('REAL_LICENSED_MANNEQUIN_NECK_ALPHA_ONLY_REVIEW_PROPOSAL',JSON.stringify({
 width:info.width,height:info.height,erasedAlpha,addedAlpha,alteredRgb,
 inputSha256:digest(original),outputSha256:digest(cleaned),releaseGate:'HOLD'
}));
