import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {compareMaskScales89,reviewOriginalSilhouette89} from '../research/parallel89/multiscale-silhouette-review89.mjs';
import {proposeOriginalPhotoMask89} from '../research/parallel89/multicategory-border-mask89.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
function proposal(w,h,labels){
 const alpha=Uint8Array.from(labels,x=>x===1?255:0),background=Uint8Array.from(labels,x=>x===2?255:0),uncertain=Uint8Array.from(labels,x=>x===0?255:0);
 return {status:'UNREVIEWED_BORDER_MASK_PROPOSAL',width:w,height:h,alpha,background,uncertain,maskSHA256:sha(alpha),backgroundSHA256:sha(background),uncertaintySHA256:sha(uncertain)};
}
test('only unanimously supported foreground retained; no uncertainty or background promotion',()=>{
 const labels=new Array(64).fill(2);labels[20]=1;labels[21]=1;labels[22]=0;
 const p=proposal(8,8,labels),l=labels.slice();l[21]=0;l[22]=1;l[23]=1;
 const a=proposal(8,8,l),b=proposal(8,8,labels);
 const r=compareMaskScales89(p,[a,b]);
 assert.equal(r.status,'MULTISCALE_SILHOUETTE_REVIEW_ONLY');
 assert.equal(r.foregroundPixels,1);assert.equal(r.withdrawnForegroundPixels,1);assert.equal(r.disagreementPixels,3);
 assert.equal(r.alpha[20],255);for(const i of [21,22,23])assert.equal(r.uncertain[i],255);
 assert.equal(r.reviewPriority,'HIGH_UNCERTAINTY_REVIEW_REQUIRED');assert.equal(r.consumer3DAdmitted,false);
});
test('different sample sizes mapped by normalized pixel centers; malformed votes refuse',()=>{
 const p=proposal(8,8,new Array(64).fill(1)),a=proposal(16,16,new Array(256).fill(1));
 const labels=new Array(576).fill(1);labels[1*24+1]=2;
 const b=proposal(24,24,labels);
 const r=compareMaskScales89(p,[a,b]);assert.equal(r.foregroundPixels,63);assert.equal(r.uncertain[0],255);
 assert.equal(compareMaskScales89(p,[a]).status,'ORIGINAL_PHOTO_2D_REQUIRED');
 a.alpha[0]=0;
 assert.equal(compareMaskScales89(p,[a,b]).status,'ORIGINAL_PHOTO_2D_REQUIRED');
});
test('six genuine original JPEGs: source-bound conservative review and no fabricated approvals',async()=>{
 const reg=JSON.parse(readFileSync(new URL('../benchmark/locked-photo-sources.json',import.meta.url)));
 let reviewed=0;
 for(const id of ['commons-0001','commons-0003','commons-0016','commons-0023','commons-0041','commons-0053']){
  const originalBytes=readFileSync(new URL('../benchmark/fixtures/'+id+'.jpg',import.meta.url)),before=sha(originalBytes),args={sourceId:id,originalBytes,lockedRecord:reg.find(r=>r.id===id)};
  const p=await proposeOriginalPhotoMask89(args),r=await reviewOriginalSilhouette89(args);
  assert.equal(r.originalSHA256,before);assert.equal(sha(originalBytes),before);assert.equal(r.consumer3DAdmitted,false);assert.equal(r.familyAlpha,'HOLD');
  if(r.status==='ORIGINAL_PHOTO_2D_REQUIRED'){console.log('SILHOUETTE_REVIEW',id,'ABSTAINED',r.reason);continue}
  reviewed++;assert.equal(r.status,'MULTISCALE_SILHOUETTE_REVIEW_ONLY');
  assert.equal(r.baselineMaskSHA256,p.maskSHA256);assert.equal(r.decodedRGBSHA256,p.decodedRGBSHA256);
  assert.equal(r.maskSHA256,sha(r.alpha));assert.equal(r.disagreementSHA256,sha(r.disagreement));
  assert.equal(r.foregroundPixels+r.uncertainPixels+r.backgroundPixels,p.width*p.height);
  assert.equal(r.foregroundPixels+r.withdrawnForegroundPixels,p.foregroundPixels);
  for(let i=0;i<r.alpha.length;i++){assert.equal(r.alpha[i]+r.uncertain[i]+r.background[i],255);if(r.alpha[i])assert.equal(p.alpha[i],255);if(p.uncertain[i])assert.equal(r.uncertain[i],255);}
  if(['commons-0016','commons-0041'].includes(id))assert.equal(r.reviewPriority,'HIGH_UNCERTAINTY_REVIEW_REQUIRED');
  console.log('SILHOUETTE_REVIEW',id,JSON.stringify({baselineFG:p.foregroundPixels,stableFG:r.foregroundPixels,uncertain:r.uncertainPixels,disagree:r.disagreementPixels,withdrawn:r.withdrawnForegroundPixels,reviewPriority:r.reviewPriority}));
 }
 assert.ok(reviewed>=3);
 const bytes=readFileSync(new URL('../benchmark/fixtures/commons-0001.jpg',import.meta.url));bytes[70]^=1;
 assert.equal((await reviewOriginalSilhouette89({sourceId:'commons-0001',originalBytes:bytes,lockedRecord:reg.find(r=>r.id==='commons-0001')})).status,'ORIGINAL_PHOTO_2D_REQUIRED');
});
