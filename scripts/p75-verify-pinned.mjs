#!/usr/bin/env node
/** P75 deterministic replay of frozen UNLABELED PUBLIC candidate receipts.
 * Offline validates 100%; optional P75_RECHECK_LIMIT=N performs live Commons
 * imageinfo license+SHA1 and real original SHA256/decoder checks for first N.
 * No photos, per-image labels or blind answers are printed or redistributed. */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {verifiedSource,verifyOriginalBytes,priorExposures,checkOverlap,
 sourceKey,originalURL,canonicalOriginalURL,sourceSeriesHint} from './p75-dataset-core.mjs';
const pinned=JSON.parse(await readFile('research/parallel75/pinned-public-training-development-candidates.json','utf8'));
if(pinned.schema!=='p75-public-candidates-pin-v1'||pinned.blinded!==false||pinned.eligibleForBlind!==false||
 !Array.isArray(pinned.rows)||!pinned.rows.length||pinned.rows.length>100||!pinned.sourceAuditHead)
 throw Error('Invalid public pinned receipt');
const paths=['benchmark/locked-photo-sources.json','benchmark/manifest-holdout-16.json',
 'benchmark/manifest-reviewed-32.json','benchmark/manifest-fresh-11.json'];
const old=priorExposures(Object.fromEntries(await Promise.all(paths.map(async path=>[path,JSON.parse(await readFile(path,'utf8'))]))));
const rows=pinned.rows,shaSet=new Set(),pageSet=new Set(),suspected=new Set();
let oldOverlap=0;
for(let i=0;i<rows.length;i++){
 const r=rows[i],problems=verifiedSource(r);
 if(problems.length)throw Error('Pinned source has invalid provenance: '+problems.join(','));
 if(r.split!=='quarantine'||r.photoContent!=='unreviewed'||r.rightsReview!=='manual-review-required'||
 r.garmentHumanVerified!==false||r.sourceGroupApproved!==false||r.sourceGroupId!==null||r.labelsPublic!==false||
 r.seriesKey!==sourceSeriesHint(r.sourcePage))throw Error('Fabricated source group or labeling in public candidate');
 if(Object.keys(r).some(key=>['expectedCategory','expectedType','humanLabels','annotations','consensus','blindAnswers','privateWardrobe'].includes(key)))
  throw Error('Public pinned dataset contains forbidden answer/key-like fields');
 if(shaSet.has(r.sha256)||pageSet.has(sourceKey(r.sourcePage)))throw Error('Pinned file hashes/pages not unique');
 shaSet.add(r.sha256);pageSet.add(sourceKey(r.sourcePage));
 if(checkOverlap(r,old).length)oldOverlap++;
 if(checkOverlap(r,rows.filter((_,j)=>j!==i)).length)suspected.add(r.sha256);
}
function clean(s){return String(s||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim().slice(0,400);}
function canonLicense(url){try{const u=new URL(url);if(u.hostname==='creativecommons.org'&&u.protocol==='http:')u.protocol='https:';return u.toString();}catch{return url;}}
const headers={'User-Agent':'ClosetCurrentP75PinnedAudit/1.0 (https://github.com/nickhaney916-lang/Closet-Current; no uploads)','Accept':'application/json'};
const networkLimit=Number(process.env.P75_RECHECK_LIMIT||0);
if(!Number.isInteger(networkLimit)||networkLimit<0||networkLimit>rows.length)throw Error('Unsafe pinned recheck count');
async function imageDhash(bytes){
 const {data,info}=await sharp(bytes,{limitInputPixels:40_000_000}).rotate().resize(9,8,{fit:'fill'}).flatten({background:'#ffffff'}).greyscale().raw().toBuffer({resolveWithObject:true});
 if(info.channels!==1||info.width!==9||info.height!==8)throw Error('Invalid recheck perceptual bytes');
 let value=0n;for(let y=0;y<8;y++)for(let x=0;x<8;x++)value=(value<<1n)|BigInt(data[y*9+x]>data[y*9+x+1]?1:0);
 return value.toString(16).padStart(16,'0');
}
for(let i=0;i<networkLimit;i++){
 const row=rows[i],title=decodeURIComponent(new URL(row.sourcePage).pathname.replace(/^\/wiki\//,'')).replace(/_/g,' ');
 const params=new URLSearchParams({action:'query',titles:title,prop:'imageinfo',iiprop:'url|size|sha1|mime|extmetadata',format:'json',formatversion:'2'});
 const res=await fetch('https://commons.wikimedia.org/w/api.php?'+params,{headers,signal:AbortSignal.timeout(30000)});
 if(!res.ok)throw Error('Cannot recheck Commons current provenance');
 const data=await res.json(),api=data.query?.pages?.[0]?.imageinfo?.[0];
 if(!api||!originalURL(api.url)||canonicalOriginalURL(api.url)!==row.originalURL||
 api.sha1!==row.commonsSha1||api.size!==row.byteLength||api.mime!==row.mime||
 api.width!==row.width||api.height!==row.height||
 clean(api.extmetadata?.LicenseShortName?.value)!==row.license||
 canonLicense(clean(api.extmetadata?.LicenseUrl?.value))!==row.licenseURL||
 clean(api.extmetadata?.Artist?.value)!==row.artist)
  throw Error('Current Commons original/licensing/attribution changed: curator must re-evaluate');
 const photo=await fetch(row.originalURL,{headers,signal:AbortSignal.timeout(30000)});
 if(!photo.ok||!originalURL(photo.url)||photo.headers.get('content-length')&&Number(photo.headers.get('content-length'))>12*1024*1024)
  throw Error('Pinned original unavailable/untrusted');
 const bytes=Buffer.from(await photo.arrayBuffer());
 if(!verifyOriginalBytes(row,bytes)||await imageDhash(bytes)!==row.dhash64)throw Error('Original bytes/perceptual identity changed');
 const metadata=await sharp(bytes,{limitInputPixels:40_000_000}).metadata();
 if(metadata.width!==row.width||metadata.height!==row.height||(metadata.orientation||1)!==row.orientation||
 metadata.format!==({'image/jpeg':'jpeg','image/png':'png','image/webp':'webp'}[row.mime]))
  throw Error('Decoder metadata changed');
}
console.log('P75_PINNED_UNLABELED_ORIGINALS '+JSON.stringify({
 frozenSourceRun:pinned.sourceAuditRun,
 totalOriginalSHA256:shaSet.size,metadataSourceValidated:rows.length,liveCurrentSourceAndByteRechecks:networkLimit,
 priorDevelopmentExposureOverlap:oldOverlap,suspectedWithinCandidateSharedSource: suspected.size,
 humanCuratedGarmentGroups:0,verifiedHumanLabels:0,sealedBlindEligible:0,
 byteChangesDetected:0,photosInRepository:0,modelAccuracy:'UNKNOWN',
 status:'PUBLIC TRAIN/DEV RESEARCH CANDIDATES ONLY — HUMAN REVIEW REQUIRED'}));
