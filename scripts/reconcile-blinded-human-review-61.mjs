#!/usr/bin/env node
/**
 * BLIND61 evidence comparison after two ACTUAL independent people return
 * separate exports. Input exports are not provided or invented by CI.
 *
 * Usage:
 *   node scripts/reconcile-blinded-human-review-61.mjs --a /secure/a.json --b /secure/b.json
 *   node ... --a /secure/a.json --b /secure/b.json --c /secure/c.json
 *
 * Do not commit identifiable reviewer exports to source control.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {makeBlindPacket61,reconcileHumanExports61} from '../research/independent-annotation-61/blinded-review.mjs';
const args=process.argv.slice(2),parsed={};
if(args.length%2!==0)throw Error('BLIND61 arguments must be paired flags and local paths');
for(let i=0;i<args.length;i+=2){
 if(!['--a','--b','--c'].includes(args[i])||parsed[args[i]])throw Error('BLIND61 invalid/repeated input flag');
 parsed[args[i]]=args[i+1];
}
if(!parsed['--a']||!parsed['--b'])throw Error('BLIND61 TWO actual independent human exports required; none are generated automatically');
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const sources=await read('benchmark/locked-photo-sources.json');
const sets={
 development:await read('benchmark/manifest-reviewed-32.json'),
 validation:await read('benchmark/manifest-fresh-11.json'),
 'locked-evaluation':await read('benchmark/manifest-holdout-16.json')
};
const packetA=await read('benchmark/independent-annotation-61/packet-A.json'),
 packetB=await read('benchmark/independent-annotation-61/packet-B.json');
const [a,b]=await Promise.all([read(parsed['--a']),read(parsed['--b'])]);
let packetC=null,c=null;
if(parsed['--c']){
 packetC=await read('benchmark/independent-annotation-61/packet-C.json');
 c=await read(parsed['--c']);
}
const result=reconcileHumanExports61(packetA,a,packetB,b,packetC,c);
const out='benchmark/independent-annotation-61';
await mkdir(out,{recursive:true});
if(result.count.disagreements){
 const packet=makeBlindPacket61({sets,sources,role:'C',onlyIds:result.thirdHumanPacketIDs});
 await writeFile(out+'/packet-C.json',JSON.stringify(packet,null,2)+'\n');
}
const summary={
 schema:result.schema,releaseAuthorized:false,scientificVerdict:'HUMAN_EVIDENCE_REQUIRES_EXTERNAL_IDENTITY_AND_INDEPENDENCE_AUDIT',
 counts:result.count,disagreements:result.disagreements,pending:result.pending,
 reviewerIds:result.reviewerIds,independenceSelfAttestedNotExternallyVerified:true,
 scientificGateMayRemainHOLD:true,modelPredictionsMeasured:false,
 thirdPacketPrepared:result.count.disagreements>0};
await writeFile(out+'/reconciliation-report.json',JSON.stringify(summary,null,2)+'\n');
// This file MAY contain evidence supplied by real independent people;
// never generate a positive outcome just from source manifests or model guesses.
await writeFile(out+'/reconciled-human-claims-EXTERNAL-IDENTITY-CHECK-REQUIRED.json',
 JSON.stringify(result.adjudications,null,2)+'\n');
console.log('BLIND61 EXTERNALLY SUPPLIED HUMAN REVIEW EVIDENCE RECONCILED; NOT RELEASE APPROVAL: '+JSON.stringify(summary));
