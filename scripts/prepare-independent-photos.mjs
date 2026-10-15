#!/usr/bin/env node
// Promote ONLY explicitly reviewed candidate photographs; never infer labels.
import {readFileSync,writeFileSync} from 'node:fs';
const [candidatesFile,manifestFile,reportFile]=process.argv.slice(2);
if(!candidatesFile||!manifestFile||!reportFile)throw Error('Usage: node scripts/prepare-independent-photos.mjs CANDIDATES MANIFEST REPORT');
const candidates=JSON.parse(readFileSync(candidatesFile,'utf8'));
if(!Array.isArray(candidates))throw Error('Candidates must be an array.');
const types=['Jacket','Coat','Blazer','Raincoat','Sweater','T-shirt','Blouse','Shirt'];
const categoryFor={Jacket:'Outerwear',Coat:'Outerwear',Blazer:'Outerwear',Raincoat:'Outerwear',Sweater:'Tops','T-shirt':'Tops',Blouse:'Tops',Shirt:'Tops'};
const valid=c=>c.verified===true&&c.reviewStatus==='approved'&&
 typeof c.id==='string'&&c.id.trim()&&typeof c.image==='string'&&c.image.trim()&&
 typeof c.source==='string'&&/^https:\/\//.test(c.source)&&
 typeof c.license==='string'&&c.license.trim()&&typeof c.credit==='string'&&c.credit.trim()&&
 categoryFor[c.expectedType]===c.expectedCategory;
const reviewed=candidates.filter(valid);
const duplicates=[];
const identities=new Map();
for(const c of reviewed){
 for(const [field,value] of [['id',c.id],['image',c.image],['source',c.source],['sourceObjectId',c.sourceObjectId],['sha256',c.sha256]]){
  if(typeof value!=='string'||!value.trim())continue;
  const key=field+':'+value.trim().toLowerCase();
  if(identities.has(key))duplicates.push({field,id:c.id,conflictsWith:identities.get(key)});
  else identities.set(key,c.id);
 }
}
if(duplicates.length)throw Error('Duplicate approved independent photos: '+JSON.stringify(duplicates));
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
