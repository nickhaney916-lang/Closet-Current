import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {packetFromLock,LOCK,hash,reconcile,blankSubmission} from '../scripts/source-holdout-human-review.mjs';
import {coordinatorHTML,prepareCoordinator} from '../scripts/offline-review-coordinator.mjs';
const packet=()=>packetFromLock(fs.readFileSync(LOCK));
test('coordinator uses same source-locked original identities with no model answers',()=>{
 const p=packet(),html=coordinatorHTML(p);
 assert.equal(p.photos.length,13);
 for(const name of ['OPEN-COORDINATOR','first','second','SELF_ATTESTED_OBSERVATIONS_ONLY','DRAFT','sourceData','reviewerIdentityAuthenticated:false','approvedModelAccuracy:null','productionPromotion:\x27BLOCKED\x27'])
  assert.ok(html.includes(name),name);
 for(const label of ['acceptedTypes','expectedCategory','sourceNote','visualReview','sourceBase','modelPredictions','downloadUrl'])
  assert.ok(!html.includes(label),label+' leaked into coordinator HTML');
 assert.ok(!html.includes('fetch(')&&!html.includes('XMLHttpRequest'));
 assert.ok(html.includes(hash(JSON.stringify(p))));
 assert.ok(!html.includes('__LOCKED_REVIEW_PACKET__'));
});
test('coordinator builds a separated organizer packet but never rewrites an earlier packet',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cc-coordinator-'));
 try{
  const destination=path.join(root,'coordinator');
  const x=prepareCoordinator(destination);
  assert.equal(x.sourcePhotos,13);assert.equal(x.independentHumansReviewed,0);
  assert.equal(x.accuracy,null);assert.equal(x.productionPromotion,'BLOCKED');
  assert.ok(fs.readFileSync(path.join(destination,'OPEN-COORDINATOR.html'),'utf8').includes('original-photo'));
  assert.throws(()=>prepareCoordinator(destination),/Never overwrite/);
  const names=fs.readdirSync(destination).sort();
  assert.deepEqual(names,['OPEN-COORDINATOR.html','READ-ME.txt']);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('the unchanged authoritative Node human intake never promotes test fixtures',()=>{
 const p=packet(),s=blankSubmission(p);s.status='REVIEWED';s.reviewerAlias='Synthetic fixture alpha';
 s.reviewedAt='2026-10-21T00:00:00.000Z';
 for(const k of Object.keys(s.attestations))s.attestations[k]=true;
 for(const row of s.photos)Object.assign(row,{observedFamily:'shirt',uncertain:false,evidence:'Synthetic unit fixture only, not a human observation.'});
 const another=structuredClone(s);another.reviewerAlias='Synthetic fixture beta';
 another.photos[1].observedFamily='boots';another.photos[2].uncertain=true;
 const result=reconcile(p,[s,another]);
 assert.equal(result.selfAttestedAgreements,11);
 assert.deepEqual(result.unresolved,[p.photos[1].id,p.photos[2].id]);
 assert.equal(result.independentHumanGoldLabels,false);
 assert.equal(result.approvedModelAccuracy,null);
 assert.equal(result.productionPromotion,'BLOCKED');
});
