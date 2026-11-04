import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {flatlayContrastBoxes29} from '../research/multi-garment-capture-01/flatlay-contrast-29.mjs';

const sourceManifest=JSON.parse(await readFile('research/multi-review-triage-28/frozen-photo-annotations-16.json','utf8'));
const roots=['flatlay-outfit','flatlay-womens','two-shirts','worn-rkk'];
const outDir=resolve('benchmark/flatlay-contrast-29');
await mkdir(outDir,{recursive:true});
const clamp=x=>Math.max(0,Math.min(1,x));
const iou=(a,b)=>{
 const x0=Math.max(a.x,b.x),y0=Math.max(a.y,b.y);
 const x1=Math.min(a.x+a.width,b.x+b.width),y1=Math.min(a.y+a.height,b.y+b.height);
 const intersection=Math.max(0,x1-x0)*Math.max(0,y1-y0);
 const denom=a.width*a.height+b.width*b.height-intersection;
 return denom>0?intersection/denom:0;
};
const maxMatches=(expected,predicted,threshold)=>{
 let best=0;
 const rec=(i,used,matched)=>{
  if(i===expected.length){best=Math.max(best,matched);return;}
  rec(i+1,used,matched);
  for(let j=0;j<predicted.length;j++)if(!(used&(1<<j))&&
    iou(expected[i].box,predicted[j])>=threshold)
   rec(i+1,used|(1<<j),matched+1);
 };
 rec(0,0,0);return best;
};
const measured=[];
for(const id of roots){
 const record=sourceManifest.find(x=>x.id===id);
 assert.ok(record,'source missing historical licensed attribution '+id);
 const file=outDir+'/'+id+'.jpg',original=await readFile(file);
 const checksum=createHash('sha256').update(original).digest('hex');
 assert.equal(checksum,record.sha256,'original licensed JPEG bytes must match previously locked SHA '+id);
 assert.equal(original.length,record.bytes,'original photo size changed '+id);
 const info=await sharp(original).metadata();
 assert.equal(info.format,'jpeg');assert.equal(info.width,record.width);assert.equal(info.height,record.height);
 const processed=await sharp(original,{limitInputPixels:48_000_000})
  .resize({width:512,height:512,fit:'inside',withoutEnlargement:true})
  .ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const input={data:new Uint8ClampedArray(processed.data),
  width:processed.info.width,height:processed.info.height,channels:4};
 const suggestion=flatlayContrastBoxes29(input);
 assert.ok(Array.isArray(suggestion.boxes)&&suggestion.boxes.length<=12);
 assert.ok(suggestion.boxes.every(b=>Object.keys(b).sort().join(',')==='height,width,x,y'));
 const matches50=maxMatches(record.regions,suggestion.boxes,.5);
 const matches30=maxMatches(record.regions,suggestion.boxes,.3);
 measured.push({id,sha256:checksum,originalBytes:original.length,originalSize:[info.width,info.height],
  sourceLicense:record.attribution.license,sourceUrl:record.attribution.source,
  annotatedTargets:record.regions.length,proposedUnclassifiedRegions:suggestion.boxes.length,
  eligibility:suggestion.eligible,eligibilityReason:suggestion.reason,
  geometricMatchesIoU50:matches50,geometricMatchesIoU30:matches30,
  boxes:suggestion.boxes});
}
const report={priority:'FLATLAY-CONTRAST-FALLBACK-29',source: 'four unchanged licensed real original JPEGs from earlier PR #575, with single-reviewer boxes, not a new independent holdout',
 caseCount:measured.length,sourceSha256Verified:true,
 originalJPEGsChanged:false,realPhotoModelAccuracyClaimed:false,
 humanSecondAnnotator:false,newIndependentHoldout:false,
 noGarmentTypeOrColorGuessed:true,
 objectCategoryPrecisionMeasured:false,
 geometricMatchingThresholds:[.5,.3],
 aggregate:{
  sources:measured.length,
  targets:measured.reduce((s,r)=>s+r.annotatedTargets,0),
  rawProposals:measured.reduce((s,r)=>s+r.proposedUnclassifiedRegions,0),
  iou50Matches:measured.reduce((s,r)=>s+r.geometricMatchesIoU50,0),
  iou30Matches:measured.reduce((s,r)=>s+r.geometricMatchesIoU30,0)
 },
 sources:measured,FamilyAlpha:'HOLD',
 needsRealHumanPhotoReview:true,productionUntouched:true};
await writeFile(outDir+'/real-originals.json',JSON.stringify(report,null,2)+'\n');
console.log('FLATLAY-CONTRAST-29 REAL LICENSED ORIGINALS '+JSON.stringify({
 originalSources:report.caseCount,annotatedTargets:report.aggregate.targets,
 unclassifiedReviewSuggestions:report.aggregate.rawProposals,
 boxesOverlappingHistoricalAnnotationsAtIoU50:report.aggregate.iou50Matches,
 explicitlyNewIndependentTruth:false,
 results:measured.map(x=>({id:x.id,eligible:x.eligibility,regions:x.proposedUnclassifiedRegions,matches:x.geometricMatchesIoU50})),
 FamilyAlpha:'HOLD'}));
