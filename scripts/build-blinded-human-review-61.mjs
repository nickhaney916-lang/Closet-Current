#!/usr/bin/env node
/**
 * BLIND61 generate TWO completely unlabeled, distinct-order local human
 * annotation review packets from the 59 true source JPEGs. No network,
 * no automatically invented labels, no reviewer identity or model output.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {makeBlindPacket61} from '../research/independent-annotation-61/blinded-review.mjs';
const parse=async p=>JSON.parse(await readFile(p,'utf8'));
const sets={
 development:await parse('benchmark/manifest-reviewed-32.json'),
 validation:await parse('benchmark/manifest-fresh-11.json'),
 'locked-evaluation':await parse('benchmark/manifest-holdout-16.json')
};
const sources=await parse('benchmark/locked-photo-sources.json');
const out='benchmark/independent-annotation-61';
await mkdir(out,{recursive:true});
const a=makeBlindPacket61({sets,sources,role:'A'}),b=makeBlindPacket61({sets,sources,role:'B'});
if(a.total!==59||b.total!==59||a.packetId===b.packetId)throw Error('BLIND61 expected two separate 59-source review packets');
let photoBytes=0;
for(const item of a.items){
 const bytes=await readFile('benchmark/fixtures/'+item.image);
 if(createHash('sha256').update(bytes).digest('hex')!==item.sourceSHA256)
  throw Error('BLIND61 source JPEG byte hash mismatch '+item.id);
 const meta=await sharp(bytes).metadata();
 if(meta.format!=='jpeg'||!meta.width||!meta.height)
  throw Error('BLIND61 invalid human-preview source JPEG '+item.id);
 photoBytes+=bytes.length;
}
for(const packet of [a,b]){
 await writeFile(out+'/packet-'+packet.role+'.json',JSON.stringify(packet,null,2)+'\n');
 const text=JSON.stringify(packet);
 for(const sensitive of ['expectedCategory','expectedType','acceptedTypes','predictions','labelStatus','modelConfidence','locked-evaluation','development']){
  if(text.includes('\"'+sensitive+'\"'))throw Error('BLIND61 leaked source label or holdout knowledge '+sensitive);
 }
}
const report={schema:'blinded-review-packet-61/audit-v1',count:59,
 trueOriginalSourceSHA256Checks:59,validDecodableJPEGSources:59,
 humanReviewsPerformed:0,independentReviewLabels:0,adjudicationsPerformed:0,
 modelAccuracyMeasured:false,modelPredictionsExposedToReviewer:false,
 reportStatus:'UNLABELED_READY_FOR_TWO_ACTUAL_INDEPENDENT_HUMANS',
 roleApacketSHA256:createHash('sha256').update(JSON.stringify(a)).digest('hex'),
 roleBpacketSHA256:createHash('sha256').update(JSON.stringify(b)).digest('hex'),
 orderDifferent:a.items.some((item,i)=>item.id!==b.items[i].id),
 originalBytesReadLocally:photoBytes,releaseAuthorized:false};
if(!report.orderDifferent)throw Error('BLIND61 reviewer ordering not independent');
await writeFile(out+'/packet-audit.json',JSON.stringify(report,null,2)+'\n');
console.log('BLIND61 VERIFIED UNLABELED SOURCE-HASH-BOUND HUMAN REVIEW PACKETS: '+JSON.stringify(report));
