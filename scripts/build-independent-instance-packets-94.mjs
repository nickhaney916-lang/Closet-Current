#!/usr/bin/env node
/** Generate source-verified unlabeled independent per-GARMENT mask packets. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {makeInstancePacket94} from '../research/independent-instance-ground-truth-94/instance-evidence.mjs';
const sources=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const dest='benchmark/independent-instance-ground-truth-94';
await mkdir(dest,{recursive:true});
if(sources.length!==59)throw Error('INSTANCE94 source collection changed; review before accepting');
let totalBytes=0;
for(const src of sources){
 const bytes=await readFile('benchmark/fixtures/'+src.image);
 if(createHash('sha256').update(bytes).digest('hex')!==src.sha256)
  throw Error('INSTANCE94 original licensed JPEG SHA incorrect '+src.id);
 const image=await sharp(bytes).metadata();
 if(image.format!=='jpeg'||!image.width||!image.height)
  throw Error('INSTANCE94 original JPEG decode invalid '+src.id);
 totalBytes+=bytes.length;
}
const a=makeInstancePacket94({sources,role:'A'});
const b=makeInstancePacket94({sources,role:'B'});
const c=makeInstancePacket94({sources,role:'C'});
if(a.total!==59||b.total!==59||c.total!==59||
 !a.items.some((r,i)=>r.id!==b.items[i].id))
 throw Error('INSTANCE94 missing distinct blind packet ordering');
for(const packet of [a,b,c]){
 const source=JSON.stringify(packet);
 if(['expectedCategory','expectedType','expectedPrimaryColor','modelConfidence',
 'locked-evaluation','predictions','sourceDownloadUrl'].some(k=>source.includes('"'+k+'"')))
  throw Error('INSTANCE94 unblinded historical model/source identity');
 await writeFile(dest+'/packet-'+packet.role+'.json',JSON.stringify(packet,null,2)+'\n');
}
const report={
 schema:'independent-instance-evidence-94/source-verification-v1',
 verifiedLicensedRealJPEGs:59,uniqueByteSHAs:59,sourcePhotoBytesReadLocally:totalBytes,
 independentHumanMaskReviews:0,independentlyAcceptedInstanceMasks:0,
 humanReviewersConfirmed:0,actualModelInstanceIoUMeasured:false,
 generatedPackets:['A','B','C'],eachPacketContainsOriginalSourceSHA:true,
 originalPhotosUploaded:false,syntheticQAIsNotHumanTruth:true,
 scientificVerdict:'NEEDS_REAL_INDEPENDENT_MASK_ANNOTATION',
 releaseAuthorized:false,familyAlpha:'HOLD'
};
await writeFile(dest+'/build-audit.json',JSON.stringify(report,null,2)+'\n');
console.log('INSTANCE94 real JPEG locked unlabeled polygon packets: '+JSON.stringify(report));
