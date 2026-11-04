/**
 * FOOTWEAR-PAIR-30 — retrospective box-union proxy on frozen actual SegFormer
 * model proposals. NOT a new inference pass or untouched prospective holdout.
 *
 * Reproduces original prior published 19-photo score before applying the
 * conservative pair criterion to adjacent shoe proposal bounding boxes.
 * Source JPEGs and original annotations are SHA-locked in PR #575; this
 * script does not download, access, or change any image or user account.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {shoePairEligible30,boundsForShoePair30}
 from '../research/multi-garment-capture-01/shoe-pair-geometry-30.mjs';
import {scorePhoto,summarizePhotos}
 from '../research/multi-review-triage-28/frozen-scorer-16.mjs';

const input=process.argv[2]||'benchmark/footwear-pair-30/app-equivalent.json';
const out=process.argv[3]||'benchmark/footwear-pair-30';
const bytes=await readFile(input);
const sha=createHash('sha256').update(bytes).digest('hex');
assert.equal(sha,'c907ee1cbfb944d7ba055921606a13c67014e6656400b5f831b6535d66307100',
 'actual historical original-source model output changed');
const baseline=JSON.parse(bytes);
const sources=JSON.parse(await readFile('research/multi-review-triage-28/frozen-photo-annotations-16.json','utf8'));
assert.equal(sources.length,19);
assert.equal(new Set(sources.map(x=>x.sha256)).size,19);
const sourceById=new Map(sources.map(s=>[s.id,s]));
function boxToBounds(b){return {left:b.x,top:b.y,right:b.x+b.width,bottom:b.y+b.height};}
function combined(a,b){
 const bounds=boundsForShoePair30(boxToBounds(a.box),boxToBounds(b.box));
 return {...a,
  label:'Shoes',
  family:'shoes',
  box:{x:bounds.left,y:bounds.top,width:bounds.right-bounds.left,height:bounds.bottom-bounds.top},
  pairedSuggestionOnly:true,needsReview:true,
  confidence:Math.min(a.confidence,b.confidence)};
}
export function pairShoeProposals30(proposals){
 if(!Array.isArray(proposals))throw Error('FOOTWEAR-PAIR-30 proposals array required');
 const sorted=proposals.map((proposal,index)=>({proposal,index}))
  .filter(x=>x.proposal?.family==='shoes')
  .sort((a,b)=>a.proposal.box.x-b.proposal.box.x||a.index-b.index);
 const used=new Set(),replacements=new Map();
 for(let i=0;i<sorted.length;i++){
  const first=sorted[i];if(used.has(first.index))continue;
  for(let j=i+1;j<sorted.length;j++){
   const second=sorted[j];if(used.has(second.index))continue;
   if(!shoePairEligible30(boxToBounds(first.proposal.box),boxToBounds(second.proposal.box),1,1))continue;
   const at=Math.min(first.index,second.index);
   replacements.set(at,combined(first.proposal,second.proposal));
   used.add(first.index);used.add(second.index);
   break;
  }
 }
 const output=[];
 for(let i=0;i<proposals.length;i++){
  if(replacements.has(i))output.push(replacements.get(i));
  else if(!used.has(i))output.push(proposals[i]);
 }
 return {proposals:output,pairs:replacements.size};
}
const results={};
for(const engine of ['chromium','webkit']){
 const cohort=baseline[engine];
 assert.equal(cohort.inputMode,'app-equivalent');
 assert.equal(cohort.results.length,19);
 assert.deepEqual(cohort.externalWrites,[]);
 assert.deepEqual(cohort.networkFailures,[]);
 const reports=[];
 for(const photo of cohort.results){
  const reference=sourceById.get(photo.id);
  assert.ok(reference&&reference.sha256===photo.sourceSha256);
  assert.equal(photo.error,null);
  assert.equal(photo.proposals.every(x=>x.needsReview===true),true);
  const original=scorePhoto(reference.regions,{status:'completed',proposals:photo.proposals});
  assert.equal(original.matches.length,photo.score.matches.length);
  assert.equal(original.unmatched.length,photo.score.unmatched.length);
  const modified=pairShoeProposals30(photo.proposals);
  const scored=scorePhoto(reference.regions,{status:'completed',proposals:modified.proposals});
  reports.push({id:photo.id,sourceSHA256:photo.sourceSha256,
   originalProposals:photo.proposals.length,
   newProposals:modified.proposals.length,pairs:modified.pairs,
   original,updated:scored});
 }
 const original=summarizePhotos(reports.map(x=>x.original));
 const updated=summarizePhotos(reports.map(x=>x.updated));
 assert.deepEqual(original,cohort.all,'actual historical source benchmark totals drifted');
 assert.deepEqual({proposed:original.proposed,truePositives:original.truePositives,
   falsePositives:original.falsePositives,falseNegatives:original.falseNegatives},
  {proposed:61,truePositives:10,falsePositives:51,falseNegatives:25});
 assert.deepEqual({proposed:updated.proposed,truePositives:updated.truePositives,
   falsePositives:updated.falsePositives,falseNegatives:updated.falseNegatives},
  {proposed:60,truePositives:11,falsePositives:49,falseNegatives:24});
 const affected=reports.filter(r=>r.pairs>0);
 assert.deepEqual(affected.map(x=>x.id),['commons-0021']);
 assert.equal(affected[0].original.matches.length,2);
 assert.equal(affected[0].updated.matches.length,3);
 const shoeExpected=sourceById.get('commons-0021').regions.find(x=>x.family==='shoes');
 const paired=pairShoeProposals30(cohort.results.find(x=>x.id==='commons-0021').proposals);
 const shoe=paired.proposals.find(x=>x.family==='shoes');
 assert.ok(shoe&&shoe.pairedSuggestionOnly&&shoe.needsReview);
 const shoeIntersection=(()=>{const a=shoe.box,b=shoeExpected.box;
  const x=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x));
  const y=Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
  return x*y/(a.width*a.height+b.width*b.height-x*y);
 })();
 assert.ok(shoeIntersection>.90&&shoeIntersection<.95);
 results[engine]={original,updated,
  affected:affected.map(x=>({id:x.id,oldMatches:x.original.matches.length,
   newMatches:x.updated.matches.length,shoePairCropBoxIoU:shoeIntersection})),
  sourceHashesMatched:true};
}
const report={priority:'FOOTWEAR-PAIR-GEOMETRY-30',
 evidenceSourcePR:575,evidenceSourceHead:'241bd1ed75fb334f94877a8cddc471b41839af23',
 evidenceArtifactId:13340286217,originalModelResultSHA256:sha,
 imageCount:19,annotatedGarmentBoxes:35,engines:['chromium','webkit'],
 resultType:'RETROSPECTIVE_BOUNDING_BOX_UNION_PROXY_ONLY',
 originalModelRerun:false,rawSegFormerMasksAvailable:false,
 independentlyHumanCertifiedNewHoldout:false,
 exactlyOneHistoricalImageAffected:true,
 proposalPairMustBeHumanReviewed:true,
 pairIdentityVerified:false,
 garmentTypeOrColorAccuracyProven:false,
 personAndOwnerPrivacyUnchanged:true,
 familyAlpha:'HOLD',deploy:false,results};
await mkdir(out,{recursive:true});
await writeFile(resolve(out,'frozen-pair-score.json'),JSON.stringify(report,null,2)+'\n');
console.log('FOOTWEAR-PAIR-30 FROZEN ACTUAL SEGFORMER PROPOSAL REPLAY '+JSON.stringify({
 photos:19,targets:35,sha:sha.slice(0,12),
 old:'10/35 matched among 61 proposals',
 boxUnionProxy:'11/35 matched among 60 proposals',
 affected:'commons-0021 only',
 genuineModelRerun:false,newHoldout:false,FamilyAlpha:'HOLD'}));
