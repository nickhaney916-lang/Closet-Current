/** P878 unit evidence is generated SYNTHETIC data only. No real humans. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createPublicKey,generateKeyPairSync,sign} from 'node:crypto';
import {canonical,sha256} from '../scripts/p75-dataset-core.mjs';
import {localCandidates} from '../public/local-catalog.mjs';
import {MODELS81} from '../public/model-arbitration-81.mjs';
import {MODEL_ASSETS82} from '../public/dual-core-82.mjs';
import {PAIR_SCHEMA878,SEAL_SCHEMA878,policy878,rank878,validPair878,
 verifySignedPair878,summarizePairs878,evaluatePrivatePairs878} from '../scripts/p878-private-siglip-framing.mjs';

const commit='a'.repeat(40),worker='d'.repeat(64);
const rank=(winner='Sneakers')=>localCandidates.map((x,i)=>({label:x.label,score:x.itemType===winner?0.95:0.8-i/1000})).sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label));
const pair=(i=1,before='Sneakers',after='Sneakers')=>{
 const sourceSha256=Number(i+100).toString(16).padStart(64,'0');
 return {schema:PAIR_SCHEMA878,sourceSha256,inputSha256:sourceSha256,targetCommit:commit,
  modelKey:'fashionSiglip',modelRevision:MODELS81.fashionSiglip.revision,
  vectorSha256:MODEL_ASSETS82.fashionSiglip.vectorsSha256,
  workerSourceCodeSha256:worker,baseline:rank(before),alternate:rank(after),
  sameModelNotIndependent:true,automaticAdmissions:0};
};
const pairs=()=>Array.from({length:60},(_,i)=>pair(i));
const quality={lighting:'ok',focus:'ok',framing:'ok',backdrop:'ok'};
const lab=()=>({presence:'single-garment',instanceCount:1,wardrobeUnit:'single-unit',
 category:'Shoes',subtype:'Sneakers',quality});
function sealed(rows,{now=Date.parse('2026-11-13T01:00:00Z')}={}){
 const keys=generateKeyPairSync('ed25519'),publicKey=keys.publicKey.export({type:'spki',format:'pem'});
 const trusted={targetCommit:commit,scorerFingerprint:sha256(keys.publicKey.export({type:'spki',format:'der'})),
  approvedAt:new Date(now-600000).toISOString(),
  p878PolicySha256:sha256(canonical(policy878(commit)))};
 const baseSeal={schema:'p80-private-scorer-seal-v1',scoredAt:new Date(now-300000).toISOString(),
  sourceCount:60,signature:'generated-synthetic-only',publicKey};
 const payload={schema:SEAL_SCHEMA878,targetCommit:commit,
  policySha256:trusted.p878PolicySha256,pairSha256:sha256(canonical(rows)),
  precedingSealSha256:sha256(canonical(baseSeal)),sourceCount:rows.length,
  scoredAt:new Date(now-120000).toISOString()};
 const seal={...payload,publicKey,signature:sign(null,Buffer.from(canonical(payload)),keys.privateKey).toString('base64')};
 return {trusted,baseSeal,seal,now};
}
test('P878 explicit immutable policy keeps same weights and no automatic certification',()=>{
 const p=policy878(commit);
 assert.equal(p.pairedFamilyIndependent,false);
 assert.equal(p.automaticCertification,false);
 assert.equal(p.modelRevision,MODELS81.fashionSiglip.revision);
 assert.throws(()=>policy878('future'),/P878_TARGET_COMMIT/);
});
test('P878 complete source-tied ranking must contain every label exactly once',()=>{
 const a=pair();
 assert.equal(validPair878(a,commit),true);
 assert.equal(rank878(a.baseline),true);
 assert.equal(rank878(a.baseline.slice(1)),false);
 assert.equal(validPair878({...a,inputSha256:'f'.repeat(64)},commit),false);
 assert.equal(validPair878({...a,targetCommit:'b'.repeat(40)},commit),false);
 assert.equal(validPair878({...a,sameModelNotIndependent:false},commit),false);
 assert.equal(validPair878({...a,automaticAdmissions:1},commit),false);
 assert.equal(validPair878({...a,workerSourceCodeSha256:'bad'},commit),false);
 assert.equal(validPair878({...a,alternate:[...a.alternate.slice(1),a.alternate[0]]},commit),false);
 assert.equal(validPair878({...a,alternate:[...a.alternate.slice(1),a.alternate[1]]},commit),false);
 assert.equal(validPair878({...a,alternate:a.alternate.map((x,i)=>i===0?{...x,score:2}:x)},commit),false);
});
test('P878 independently preapproved Ed25519 paired transcript binds policy, source IDs and prior scorer',()=>{
 const rows=pairs(),{trusted,baseSeal,seal,now}=sealed(rows);
 assert.equal(verifySignedPair878(rows,seal,trusted,baseSeal,{now}),true);
 assert.equal(verifySignedPair878(rows.slice(1),seal,trusted,baseSeal,{now}),false);
 assert.equal(verifySignedPair878([...rows.slice(0,59),rows[0]],seal,trusted,baseSeal,{now}),false);
 assert.equal(verifySignedPair878(rows,{...seal,signature:'AAAA'},trusted,baseSeal,{now}),false);
 assert.equal(verifySignedPair878(rows,seal,{...trusted,scorerFingerprint:'0'.repeat(64)},baseSeal,{now}),false);
 assert.equal(verifySignedPair878(rows,seal,{...trusted,p878PolicySha256:'0'.repeat(64)},baseSeal,{now}),false);
 assert.equal(verifySignedPair878(rows,seal,trusted,{...baseSeal,sourceCount:59},{now}),false);
 assert.equal(verifySignedPair878(rows,seal,trusted,baseSeal,{now:now-600000}),false);
 assert.equal(verifySignedPair878(rows,seal,{...trusted,approvedAt:new Date(now-100000).toISOString()},baseSeal,{now}),false);
 assert.equal(verifySignedPair878(rows,seal,trusted,{...baseSeal,scoredAt:new Date(now-60000).toISOString()},{now}),false);
});
test('P878 synthetic paired arithmetic keeps gains and losses separate without publishing any label rows',()=>{
 const entries=pairs().map((p,i)=>({pair:p,labels:lab()}));
 entries[0].pair=pair(0,'Ankle boots','Sneakers');
 entries[1].pair=pair(1,'Sneakers','Ankle boots');
 entries[2].pair=pair(2,'Ankle boots','Ankle boots');
 const result=summarizePairs878(entries);
 assert.equal(result.status,'PRIVATE_RESEARCH_ONLY_NOT_RELEASE');
 assert.equal(result.scoredSources,60);
 assert.equal(result.baselineTop1Consensuses,58);
 assert.equal(result.alternativeTop1Consensuses,58);
 assert.equal(result.pairedImprovements,1);
 assert.equal(result.pairedRegressions,1);
 assert.equal(result.changedFirstRanks,2);
 assert.equal(result.independentlyVerifiedSubtypeAccuracy,null);
 assert.equal(result.shouldLiftFamilyAlphaHold,false);
 assert.equal(Object.hasOwn(result,'rows'),false);
 assert.equal(JSON.stringify(result).includes('Shoes'),false);
});
test('P878 disallows shrinking denominator, duplicated photos, uncertain sources and invalid quality',()=>{
 const entries=pairs().map(p=>({pair:p,labels:lab()}));
 assert.throws(()=>summarizePairs878(entries.slice(1)),/P878_NOT_ENOUGH_VERIFIED_SOURCES/);
 entries[1].pair=entries[0].pair;
 assert.throws(()=>summarizePairs878(entries),/P878_SOURCE_OR_LABEL_NOT_ELIGIBLE/);
 entries[1].pair=pair(1);
 entries[0].labels={...lab(),quality:{...quality,focus:'soft'}};
 assert.throws(()=>summarizePairs878(entries),/P878_SOURCE_OR_LABEL_NOT_ELIGIBLE/);
 entries[0].labels={...lab(),presence:'multiple-garments'};
 assert.throws(()=>summarizePairs878(entries),/P878_SOURCE_OR_LABEL_NOT_ELIGIBLE/);
 entries[0].labels={...lab(),category:'Shoes',subtype:'Unknown'};
 assert.throws(()=>summarizePairs878(entries),/P878_SOURCE_OR_LABEL_NOT_ELIGIBLE/);
});
test('P878 without real independent external evidence reports BLOCKED, never accuracy or pilot readiness',async()=>{
 const result=await evaluatePrivatePairs878();
 assert.equal(result.status,'BLOCKED');
 assert.equal(result.scoredSources,0);
 assert.equal(result.independentlyVerifiedSubtypeAccuracy,null);
 assert.equal(result.shouldLiftFamilyAlphaHold,false);
 assert.equal(result.releaseAuthorized,false);
});
