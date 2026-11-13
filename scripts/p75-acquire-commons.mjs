#!/usr/bin/env node
/** P75: LICENSE-METADATA PREFLIGHT + actual original SHA1/SHA256 and decoding audit.
 * ALL discoveries are publicly exposed and UNLABELED; never place in sealed blind.
 * Downloads are transient (memory only). NO photographs or human labels committed.
 * Requires node 22 + sharp; GitHub Actions uses read-only checkout/no secrets.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {sha256,verifiedSource,checkOverlap,priorExposures,sourceKey,originalURL,canonicalOriginalURL,rightsOK,publicAuditReport,SCHEMA} from './p75-dataset-core.mjs';
const plan=JSON.parse(await readFile('research/parallel75/queries.json','utf8'));
if(plan.schema!=='p75-query-plan-v1'||!Array.isArray(plan.searches)||plan.searches.length>12)throw Error('Invalid bounded search plan.');
const filenames=['benchmark/locked-photo-sources.json','benchmark/manifest-holdout-16.json',
 'benchmark/manifest-reviewed-32.json','benchmark/manifest-fresh-11.json'];
const manifests=Object.fromEntries(await Promise.all(filenames.map(async name=>[name,JSON.parse(await readFile(name,'utf8'))])));
const exposed=priorExposures(manifests),already=new Set(exposed.map(x=>sourceKey(x.sourcePage)).filter(Boolean));
const maxDownloads=Number(process.env.P75_MAX_ORIGINALS||36);
if(!Number.isInteger(maxDownloads)||maxDownloads<1||maxDownloads>48)throw Error('Unsafe maximum original count');
const maxPerQuery=Math.min(4,Number(plan.maxOriginalsPerQuery||3));
const seen=new Set(),discovered=[],failures={},requests={attempts:0,success:0};

const headers={'User-Agent':'ClosetCurrentP75DatasetAudit/1.0 (https://github.com/nickhaney916-lang/Closet-Current; research provenance, NO user data)','Accept':'application/json'};
const count=x=>failures[x]=(failures[x]||0)+1;
const clean=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim().slice(0,400);
const licenseURL=s=>{try{const u=new URL(s);if(u.hostname==='creativecommons.org'&&u.protocol==='http:')u.protocol='https:';return u.toString();}catch{return s;}};
const api='https://commons.wikimedia.org/w/api.php';
function dHash(bytes){
 return sharp(bytes,{limitInputPixels:40_000_000}).rotate().resize(9,8,{fit:'fill'}).flatten({background:'#ffffff'}).greyscale().raw().toBuffer({resolveWithObject:true})
 .then(({data,info})=>{
  if(info.channels!==1||info.width!==9||info.height!==8)throw Error('DHash decode invalid');
  let value=0n;for(let y=0;y<8;y++)for(let x=0;x<8;x++){value=(value<<1n)|(BigInt(data[y*9+x]>data[y*9+x+1]?1:0));}
  return value.toString(16).padStart(16,'0');
 });
}
for(const task of plan.searches){
 if(discovered.length>=maxDownloads)break;
 if(typeof task.query!=='string'||!task.query.startsWith('filetype:bitmap ')||task.query.length>120)throw Error('Unsafe query');
 const params=new URLSearchParams({action:'query',generator:'search',gsrsearch:task.query,gsrnamespace:'6',gsrlimit:'25',
  prop:'imageinfo',iiprop:'url|size|sha1|mime|extmetadata',format:'json',formatversion:'2'});
 let pages=[];
 try{
  const response=await fetch(api+'?'+params,{headers,signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('HTTP '+response.status);
  const json=await response.json();pages=json.query?.pages||[];
  if(!Array.isArray(pages))throw Error('Malformed Commons API');
  requests.success++;
 }catch(e){count('search-unavailable');requests.attempts++;continue;}
 requests.attempts++;
 let taken=0;
 for(const page of pages){
  if(taken>=maxPerQuery||discovered.length>=maxDownloads)break;
  const info=page.imageinfo?.[0],meta=info?.extmetadata||{};
  if(!info){count('no-image-info');continue;}
  const lic=clean(meta.LicenseShortName?.value),licURL=licenseURL(clean(meta.LicenseUrl?.value));
  const src=info.descriptionurl,srcKey=sourceKey(src);
  if(!srcKey){count('commons-page-url-not-recognized');continue;}
  const original=canonicalOriginalURL(info.url);
  if(!original){count('commons-original-url-not-recognized');continue;}
  if(already.has(srcKey)||seen.has(srcKey)){count('historically-exposed-or-repeated');continue;}
  if(!rightsOK(lic,licURL)){count('rights-metadata-unacceptable');continue;}
  const artist=clean(meta.Artist?.value),title=clean(page.title);
  if(!artist||!title){count('attribution-incomplete');continue;}
  if(!['image/jpeg','image/png','image/webp'].includes(info.mime)||!Number.isInteger(info.size)||info.size<10000||info.size>12*1024*1024||!/^[a-f0-9]{40}$/.test(info.sha1||'')){count('unsupported-original');continue;}
  seen.add(srcKey);
  let bytes;
  try{
   let res;
   for(let attempt=0;attempt<3;attempt++){
    res=await fetch(original,{headers,signal:AbortSignal.timeout(30000)});
    if((res.status===429||res.status===503)&&attempt<2){
     const suggested=Number(res.headers.get('retry-after'));
     const backoff=Number.isFinite(suggested)&&suggested>0?Math.min(6000,suggested*1000):1200*(attempt+1);
     await new Promise(resolve=>setTimeout(resolve,backoff));continue;
    }
    break;
   }
   if(!res.ok)throw Error('DOWNLOAD-HTTP-'+res.status);
   if(!originalURL(res.url))throw Error('DOWNLOAD-REDIRECT');
   if(res.headers.get('content-length')&&Number(res.headers.get('content-length'))>12*1024*1024)throw Error('DOWNLOAD-OVERSIZE');
   bytes=Buffer.from(await res.arrayBuffer());
   if(bytes.length!==info.size||bytes.length>12*1024*1024||createHash('sha1').update(bytes).digest('hex')!==info.sha1)throw Error('DOWNLOAD-HASH-OR-LENGTH-MISMATCH');
   const decoded=await sharp(bytes,{limitInputPixels:40_000_000}).metadata();
   if(!decoded.width||!decoded.height||decoded.width<100||decoded.height<100||!['jpeg','png','webp'].includes(decoded.format))throw Error('Unsupported decoded photo');
   const row={schema:SCHEMA,id:'p75-candidate-'+String(discovered.length+1).padStart(4,'0'),
    discoveryFamily:task.family,sourcePage:src,originalURL:original,
    license:lic,licenseURL:licURL,artist,title,
    sha256:sha256(bytes),commonsSha1:info.sha1,byteLength:bytes.length,
    width:decoded.width,height:decoded.height,orientation:decoded.orientation||1,
    mime:info.mime,acquiredAt:new Date().toISOString(),verification:'bytes-verified',
    photoContent:'unreviewed',rightsReview:'manual-review-required',sourceGroupApproved:false,garmentHumanVerified:false,
    split:'quarantine',sourceGroupId:null,modelScored:false,labelsPublic:false};
   // No garment name, category, subtype or color is assigned from metadata.
   row.dhash64=await dHash(bytes);
   const issues=verifiedSource(row);if(issues.length)throw Error('Source verification invalid: '+issues.join(','));
   row.overlapFlags=checkOverlap(row,exposed,discovered);
   discovered.push(row);taken++;
  }catch(e){
   const message=String(e?.message||'');
   count(/^DOWNLOAD-HTTP-(429|403|404|503)$/.test(message)?message.toLowerCase():
    message.startsWith('DOWNLOAD-HASH-OR-LENGTH')?'original-hash-or-size-mismatch':
    message.startsWith('DOWNLOAD-REDIRECT')?'untrusted-redirect':
    message.startsWith('DOWNLOAD-OVERSIZE')?'oversize-original':
    'download-or-decoder-verification-failed');
  }
  await new Promise(resolve=>setTimeout(resolve,300));
  // Deliberately do not retain or upload the original JPEG bytes.
  bytes=null;
 }
}
const numeric=publicAuditReport(discovered,exposed);
const summary={schema:'p75-audit-summary-v1',queryCount:plan.searches.length,historicalExposedUniqueSources:exposed.length,
 historicalSourcePages:new Set(exposed.map(x=>sourceKey(x.sourcePage)).filter(Boolean)).size,
 ...numeric,rateLimitSafeSearchCalls:requests.attempts,searchSuccesses:requests.success,
 rejectedByReason:failures,
 humanGarmentTruth:0,humanColorTruth:0,humanSubtypeTruth:0,instanceMasksHumanTruth:0,shoePairHumanTruth:0,
 plannedTarget:240,planningGap:Math.max(0,240-discovered.length),uniquePhysicalGarmentGroupsHumanVerified:0,
 train:0,development:0,sealedBlind:0,
 originalBytesCommitted:0,originalBytesPublished:0,blindLabelsPublished:0,
 disclosure:'ALL source URLs are development-exposed candidates and may NEVER become independent sealed blind without a new hidden acquisition protocol.'};
await mkdir('research/parallel75',{recursive:true});
await writeFile('research/parallel75/runtime-candidates-UNLABELED-EXPOSED.json',JSON.stringify(discovered,null,2)+'\n');
await writeFile('research/parallel75/runtime-summary-PUBLIC.json',JSON.stringify(summary,null,2)+'\n');
console.log('P75_ORIGINAL_BYTES_PROVENANCE_AUDIT '+JSON.stringify(summary));
// Public train/dev-research-only source receipts, no photo bytes/annotations/sealed data.
// This permits immutable pinning to a new manifest after exact source hashes pass.
console.log('P75_PUBLIC_UNLABELED_PROVENANCE_RECORDS '+JSON.stringify(discovered));
// Missing Commons access is a truthful acquisition blocker, not a passing acquisition.
if(!requests.success)process.exitCode=2;
