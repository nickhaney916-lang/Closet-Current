#!/usr/bin/env node
// Promote ONLY explicitly reviewed candidate photographs; never infer labels.
import {readFileSync,writeFileSync} from 'node:fs';
const [candidatesFile,manifestFile,reportFile]=process.argv.slice(2);
if(!candidatesFile||!manifestFile||!reportFile)throw Error('Usage: node scripts/prepare-independent-photos.mjs CANDIDATES MANIFEST REPORT');
const candidates=JSON.parse(readFileSync(candidatesFile,'utf8'));
if(!Array.isArray(candidates))throw Error('Candidates must be an array.');
const types=['Jacket','Coat','Blazer','Raincoat','Sweater','T-shirt','Blouse','Shirt'];
const reviewed=candidates.filter(c=>c.verified===true&&c.reviewStatus==='approved'&&c.source&&c.image&&c.expectedCategory&&c.expectedType&&c.license&&c.credit);
const blocked=candidates.filter(c=>!reviewed.includes(c)).map(c=>({id:c.id,status:c.reviewStatus||'not-reviewed',type:c.expectedType||null,source:c.source||null}));
const reviewQueue=blocked.filter(c=>!c.status.startsWith('excluded-'));
const pendingCounts=Object.fromEntries(types.map(type=>[type,reviewQueue.filter(c=>c.type===type).length]));
const excludedCount=blocked.length-reviewQueue.length;
const manifest=reviewed.map(({id,image,expectedCategory,expectedType,source,sourceImage,sourceObjectId,sha256,downloadUrl,license,credit})=>({
 id,image,mode:'single',expectedCategory,expectedType,source,sourceImage,sourceObjectId,sha256,downloadUrl,license,credit,verified:true
}));
const counts=Object.fromEntries(types.map(type=>[type,reviewed.filter(c=>c.expectedType===type).length]));
const report={candidateCount:candidates.length,approvedCount:reviewed.length,blocked,coverageByType:counts,
 reviewQueue,reviewQueueCount:reviewQueue.length,excludedCount,pendingByType:pendingCounts,
 targetPerType:5,missingByType:Object.fromEntries(types.map(t=>[t,Math.max(0,5-counts[t])])),
 ready:reviewed.length>0&&types.every(t=>counts[t]>=5)};
writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({approved:reviewed.length,blocked:blocked.length,ready:report.ready}));
