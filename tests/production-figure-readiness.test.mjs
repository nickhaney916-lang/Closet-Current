import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {sha,sampling,compareAnchors,evaluateProductionFigures} from '../benchmark/figure-readiness/production-figure-metrics.mjs';
const json=p=>JSON.parse(fs.readFileSync(p));
const policy=json('benchmark/figure-readiness/production-policy.json'),evidence=json('benchmark/figure-readiness/production-evidence.json');
const measurements=()=>evidence.figures.map(f=>({id:f.id,preview:{sha256:f.previewSha256,width:160,height:297},master:null}));
test('exact two preview identities required; no third/customer-specific figure',()=>{
 const m=measurements();assert.equal(evaluateProductionFigures(policy,evidence,m).assetCount,2);
 assert.throws(()=>evaluateProductionFigures(policy,{...evidence,figures:[...evidence.figures,evidence.figures[0]]},m));
 m[0].preview.sha256='0'.repeat(64);assert.throws(()=>evaluateProductionFigures(policy,evidence,m));
});
test('current pair stays blocked for masters, native detail, rights, anatomy and alignment',()=>{
 const r=evaluateProductionFigures(policy,evidence,measurements());assert.equal(r.productionAuthorized,false);assert.equal(r.visualQualityScored,false);assert.equal(r.pairAlignment,null);
 for(const f of r.figures){assert.equal(f.ready,false);assert.ok(f.blockers.includes('full-resolution-master-missing'));assert.ok(f.blockers.includes('exact-asset-rights-evidence-missing'));assert.equal(f.masterSampling,null);}
});
test('native pixel requirements account for CSS size, DPR and CSS zoom explicitly',()=>{
 const small=sampling(160,297,{cssWidth:270,dpr:3,cssZoom:1},policy.canonicalStage);assert.equal(small.neededWidth,810);assert.equal(small.nativeSamplingSufficient,false);
 assert.equal(sampling(1294,2398,{cssWidth:647,dpr:2,cssZoom:1},policy.canonicalStage).nativeSamplingSufficient,true);
 assert.equal(sampling(1294,2398,{cssWidth:290,dpr:3,cssZoom:2},policy.canonicalStage).nativeSamplingSufficient,false);
 assert.equal(sampling(1941,3597,{cssWidth:290,dpr:3,cssZoom:2},policy.canonicalStage).nativeSamplingSufficient,true);
 assert.throws(()=>sampling(0,297,{cssWidth:270,dpr:3,cssZoom:1},policy.canonicalStage));
});
test('pair anchors use reviewed normalized coordinates and reject unknown or invalid values',()=>{
 const a=Object.fromEntries(policy.requiredPairAnchors.map(k=>[k,{x:.5,y:.5}])),b=structuredClone(a);b.waistCenter.y=.6;
 assert.equal(compareAnchors(a,a,policy.requiredPairAnchors,.02).withinProposedTolerance,true);
 assert.equal(compareAnchors(a,b,policy.requiredPairAnchors,.02).withinProposedTolerance,false);
 assert.throws(()=>compareAnchors(a,{},policy.requiredPairAnchors,.02));
 b.waistCenter.x=2;assert.throws(()=>compareAnchors(a,b,policy.requiredPairAnchors,.02));
});
test('large dimensions and booleans alone cannot approve native detail, licensing or anatomy',()=>{
 const e=structuredClone(evidence),m=measurements();
 for(let i=0;i<2;i++){
  e.figures[i].masterSha256='1'.repeat(64);e.figures[i].rights=Object.fromEntries(policy.requiredRights.map(k=>[k,true]));e.figures[i].technical=Object.fromEntries(policy.requiredVisualChecks.map(k=>[k,true]));
  m[i].master={sha256:'1'.repeat(64),width:1941,height:3597,frames:1,orientation:1,srgbNormalized:true,lossless:true};
 }
 const r=evaluateProductionFigures(policy,e,m);assert.equal(r.figures[0].ready,false);assert.ok(r.figures[0].blockers.includes('native-detail-provenance-unverified'));assert.ok(r.figures[0].blockers.includes('exact-asset-rights-evidence-missing'));
 m[0].master.width=undefined;assert.throws(()=>evaluateProductionFigures(policy,e,m));
});
test('review evidence binds exact master and exact proof bytes; never grants deployment authority',()=>{
 const e=structuredClone(evidence),m=measurements(),proof=Buffer.from('synthetic unit test only'),files={proof};
 for(let i=0;i<2;i++){
  const a=e.figures[i];a.masterSha256='1'.repeat(64);a.rights=Object.fromEntries(policy.requiredRights.map(k=>[k,true]));a.technical=Object.fromEntries(policy.requiredVisualChecks.map(k=>[k,true]));
  a.anchors=Object.fromEntries(policy.requiredPairAnchors.map(k=>[k,{x:.5,y:.5}]));
  for(const k of ['nativeResolutionEvidence','rightsReview','visualReview','alignmentReview'])a[k]={assetSha256:a.masterSha256,reviewedBy:'unit reviewer',reviewedAt:'2026-10-19',evidencePath:'proof',evidenceSha256:sha(proof)};
  m[i].master={sha256:a.masterSha256,width:1941,height:3597,frames:1,orientation:1,srgbNormalized:true,lossless:true};
 }
 const approved={...policy,status:'approved'},r=evaluateProductionFigures(approved,e,m,files);
 assert.equal(r.figures.every(f=>f.ready),true);assert.equal(r.productionAuthorized,false);assert.equal(r.licensingApprovedByAutomation,false);assert.equal(r.reviewerIdentityAuthenticated,false);
 assert.equal(evaluateProductionFigures(approved,e,m,{proof:Buffer.from('changed')}).figures[0].ready,false);
 e.figures[0].rightsReview.assetSha256='2'.repeat(64);assert.equal(evaluateProductionFigures(approved,e,m,files).figures[0].ready,false);
});
