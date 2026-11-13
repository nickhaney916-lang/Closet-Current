// Frozen numeric-only synthetic fixture comparison. No real photographic accuracy claims.
import {createRequire} from 'node:module';
import {performance} from 'node:perf_hooks';
import {sampleMask76,analyzeColor76} from '../public/garment-color-76.mjs';
const require=createRequire(import.meta.url),legacy=require('../public/photo-color.js');
const sha='a'.repeat(64),binding={sourceSha256:sha,maskSha256:'b'.repeat(64),ownerId:'synthetic-owner',requestId:'synthetic-request'};
const fixtures=[
 {name:'dark-navy-denim',paint:()=>[10,24,53],expected:'Blue'},
 {name:'warm-off-white',paint:()=>[239,232,218],expected:'Beige'},
 {name:'legitimate-black',paint:()=>[8,8,9],expected:'Black'},
 {name:'legitimate-white',paint:()=>[248,248,248],expected:'White'},
 {name:'primary-blue-secondary-red',paint:(x)=>x<23?[25,75,195]:[220,30,35],expected:'Blue'},
 {name:'balanced-blue-red',paint:(x)=>x<16?[25,75,195]:[220,30,35],expected:'Multicolor'},
 {name:'background-white-outside-blue-mask',paint:(x,y)=>x>=6&&x<26&&y>=6&&y<26?[25,75,195]:[245,245,245],mask:(x,y)=>x>=6&&x<26&&y>=6&&y<26,expected:'Blue'},
 {name:'tiny-foreground',paint:()=>[10,120,25],mask:(x,y)=>x<5&&y<5,expected:null},
 {name:'shadow-over-blue',paint:x=>x<4?[4,4,4]:[25,75,195],expected:'Blue'},
 {name:'glare-over-red',paint:x=>x<4?[255,255,255]:[210,40,40],expected:'Red'},
 {name:'olive-green',paint:()=>[83,105,37],expected:'Green'},
 {name:'brown-leather',paint:()=>[100,63,32],expected:'Brown'}
];
const results=[];let legacyReview=0,researchReview=0,researchAbstain=0;
for(const fixture of fixtures){
 const w=32,h=32,raw=new Uint8ClampedArray(w*h*3),rgba=new Uint8ClampedArray(w*h*4),selected=new Uint8Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x,mask=fixture.mask?fixture.mask(x,y):true,c=fixture.paint(x,y);
  raw.set(c,i*3);rgba.set([...c,mask?255:0],i*4);selected[i]=mask?1:0;
 }
 let t=performance.now(),before=legacy.maskedPalette(rgba,w,h),legacyMs=performance.now()-t;
 t=performance.now();
 const sample=sampleMask76({data:raw,width:w,height:h,channels:3},{width:w,height:h},{selected});
 const after=analyzeColor76(sample,binding),researchMs=performance.now()-t;
 if(before?.needsConfirmation)legacyReview++;
 if(after.status==='review')researchReview++;else researchAbstain++;
 results.push({fixture:fixture.name,fixtureExpected:fixture.expected,
  originalLegacyPrimary:before?.primary||null,originalLegacySecondary:before?.secondary||null,
  originalLegacyNeedsConfirmation:before?.needsConfirmation??true,
  candidatePrimary:after.proposedPrimary,candidateSecondary:after.proposedSecondary,
  candidateMulticolor:after.multicolor,candidateStatus:after.status,reasons:after.reasons,
  sourcePixels:w*h,validSamplePixels:after.validPixels,
  legacyRuntimeMs:Math.round(legacyMs*1000)/1000,candidateRuntimeMs:Math.round(researchMs*1000)/1000});
}
const summary={cohort:'12 constructed numeric RGB/mask fixtures (NOT human-labeled photos)',
 sourceJpegs:0,independentHumanLabels:0,garmentColorAccuracyBefore:null,garmentColorAccuracyAfter:null,
 baselineReviewOrNull:results.filter(r=>r.originalLegacyNeedsConfirmation).length,
 researchReview,researchAbstain,defaultResearchFlagEnabled:false,
 cases:results};
console.log('P76_SYNTHETIC_ONLY '+JSON.stringify(summary));
