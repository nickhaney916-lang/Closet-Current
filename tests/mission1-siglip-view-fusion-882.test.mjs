/** P882 synthetic score-fusion and source-fencing tests. No human ground truth. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {fuseSiglipViews882,auditSiglipViewFusion882} from '../scripts/p882-siglip-view-fusion-audit.mjs';
import {localCandidates} from '../public/local-catalog.mjs';
import {observation81,arbitrate81} from '../public/model-arbitration-81.mjs';
import {MODEL_ASSETS82,VERSION82} from '../public/dual-core-82.mjs';

const sha=x=>x.repeat(64),worker=sha('c');
const binding=(digest,id)=>({sourceSha256:digest,inputSha256:digest,ownerSession:'synthetic-source',
 photoRevision:'photo-'+id,cropRevision:'crop-'+id,maskRevision:'mask-'+id,
 unitRevision:'one-unit',instanceId:id});
const scores=(primary,secondary,high,low)=>localCandidates.map((c,i)=>({
 label:c.label,score:c.itemType===primary?high:c.itemType===secondary?low:(.15-i/1000)
}));
function record(id,digit,original,second,full,fullSecond,truth,normalA,normalB,fullA,fullB){
 const digest=sha(digit),b=binding(digest,id);
 const observations=['fashionclip','fashionSiglip'].map(modelKey=>observation81({
  modelKey,binding:b,scores:scores(original,second,normalA,normalB),
  workerSourceSha256:worker,vectorSha256:MODEL_ASSETS82[modelKey].vectorsSha256,latencyMs:1}));
 const fullRanking=observation81({modelKey:'fashionSiglip',binding:b,
  scores:scores(full,fullSecond,fullA,fullB),workerSourceSha256:worker,
  vectorSha256:MODEL_ASSETS82.fashionSiglip.vectorsSha256,latencyMs:4}).ranking;
 const meta=localCandidates.find(c=>c.itemType===truth);
 const out={schema:VERSION82,assets:MODEL_ASSETS82,sourceCodeSha256:worker,
  requestId:'p882-synthetic-'+id,createdAt:1760000000000,automaticAdmissions:0,
  observations,experiment877:{schema:'p877-optional-full-frame-v1',
   modelKey:'fashionSiglip',mode:'fitWholePhoto224-white',sameModelNotIndependent:true,
   sourceCodeSha256:worker,vectorSha256:MODEL_ASSETS82.fashionSiglip.vectorsSha256,
   inputSha256:digest,extraMs:5,ranking:fullRanking}};
 return {row:{id,sourceSha256:digest,output:out,
  historicalExpectation:{category:meta.category,itemType:truth},
  decision:arbitrate81({binding:b,observations})},
  receipt:{id,image:id+'.jpg',sha256:digest,verified:true,
   attribution:{license:'CC BY 4.0',source:'https://commons.wikimedia.org/wiki/File:'+id+'.jpg'}},
  manifest:{id,image:id+'.jpg',expectedCategory:meta.category,expectedType:truth,verified:true}};
}
function fixture(){
 const a=record('commons-0078','a','Ankle boots','Sneakers','Sneakers','Ankle boots','Sneakers',.78,.66,.94,.56);
 const b=record('commons-0001','b','T-shirt','Sweatshirt','Sweatshirt','T-shirt','T-shirt',.80,.70,.96,.58);
 return {data:{summary:{status:'PUBLIC_DEVELOPMENT_ONLY',blindAccuracy:null,
  physicalDevices:0,independentlyHumanReviewedPhotos:0,automaticAdmissions:0,
  nonGetOrExternalRequests:0,isolation:'one-browser-continuous-2-one-shot-workers',
  photos:2,rawTop1:{fashionSiglip:{exactSubtypeMatches:1}}},rows:[a.row,b.row]},
  receipts:[a.receipt,b.receipt],manifest:[a.manifest,b.manifest]};
}
const audit=x=>auditSiglipViewFusion882(x.data,x.receipts,x.manifest,{expectedRows:2});
test('P882 equal score mean uses complete aligned labels; input ranks not modified',()=>{
 const x=fixture(),row=x.data.rows[0],original=row.output.observations[1].ranking,
  alt=row.output.experiment877.ranking;
 const before=JSON.stringify(original),other=JSON.stringify(alt);
 const result=fuseSiglipViews882(original,alt);
 assert.equal(result.length,localCandidates.length);
 assert.equal(result[0].itemType,'Sneakers');
 assert.equal(JSON.stringify(original),before);
 assert.equal(JSON.stringify(alt),other);
 const a=new Map(original.map(z=>[z.label,z.score])),b=new Map(alt.map(z=>[z.label,z.score]));
 assert.ok(result.every(z=>Math.abs(z.score-(a.get(z.label)+b.get(z.label))/2)<1e-10));
});
test('P882 audit counts one historical gain and one loss without claiming accuracy',()=>{
 const report=audit(fixture()),s=report.summary;
 assert.equal(s.photos,2);
 assert.equal(s.originalHistoricalSubtypeStrings,1);
 assert.equal(s.wholeFrameHistoricalSubtypeStrings,1);
 assert.equal(s.equalMeanHistoricalSubtypeStrings,1);
 assert.equal(s.meanGainsVsOriginal,1);
 assert.equal(s.meanLossesVsOriginal,1);
 assert.equal(s.knownSneaker.equalMeanType,'Sneakers');
 assert.equal(s.blindAccuracy,null);
 assert.equal(s.modelPromoted,false);
 assert.equal(s.releaseReady,false);
 assert.equal(s.ownerPathModified,false);
 assert.equal(s.automaticallySavedGarments,0);
});
test('P882 refuses missing/duplicated vocabulary, incorrect class or unsorted scores',()=>{
 const x=fixture(),o=x.data.rows[0].output;
 const a=o.observations[1].ranking.slice(1);
 assert.throws(()=>fuseSiglipViews882(a,o.experiment877.ranking),/P882_FULL_VOCABULARY/);
 const b=fixture();b.data.rows[0].output.experiment877.ranking[0].category='Tops';
 assert.throws(()=>audit(b),/P878_RANK_SOURCE/);
 const c=fixture();c.data.rows[0].output.experiment877.ranking[1]=c.data.rows[0].output.experiment877.ranking[0];
 assert.throws(()=>audit(c),/P878_RANK_SOURCE/);
});
test('P882 rejects out-of-cosine-range values, NaN and ranking-order swaps',()=>{
 const a=fixture();a.data.rows[0].output.experiment877.ranking[0].score=3.5;
 assert.throws(()=>audit(a),/P882_COSINE_RANGE/);
 const b=fixture();b.data.rows[0].output.experiment877.ranking[0].score=NaN;
 assert.throws(()=>audit(b),/P878_RANK_SOURCE/);
 const c=fixture();c.data.rows[0].output.experiment877.ranking[1].score=1.0;
 assert.throws(()=>audit(c),/P878_RANK_ORDER/);
});
test('P882 detects swapped photo hash, changed manifest label and foreign model revision',()=>{
 const a=fixture();a.data.rows[0].sourceSha256=sha('e');
 assert.throws(()=>audit(a),/P878_PHOTO_RECEIPT/);
 const b=fixture();b.data.rows[0].historicalExpectation.itemType='T-shirt';
 assert.throws(()=>audit(b),/P878_MANIFEST_PROVENANCE/);
 const c=fixture();c.data.rows[0].output.observations[1].model.revision='invented';
 assert.throws(()=>audit(c),/P878_MODEL_REVISION/);
});
test('P882 same-model extra view cannot become a third independent observer',()=>{
 const a=fixture(),o=a.data.rows[0].output;
 o.observations.push(o.observations[1]);
 assert.throws(()=>audit(a),/P878_TWO_FAMILIES/);
 const b=fixture();b.data.rows[1].output.experiment877.sameModelNotIndependent=false;
 assert.throws(()=>audit(b),/P878_ALT_IDENTITY/);
});
test('P882 no owner save, external network, human-blind or model-promotion forgery',()=>{
 const a=fixture();a.data.rows[1].output.automaticAdmissions=1;
 assert.throws(()=>audit(a),/P878_MODEL_REQUEST/);
 const b=fixture();b.data.summary.blindAccuracy=1;
 assert.throws(()=>audit(b),/P878_RESEARCH_ONLY/);
 const c=fixture();c.data.summary.nonGetOrExternalRequests=1;
 assert.throws(()=>audit(c),/P878_SESSION_POLICY/);
});
test('P882 score fusion cannot turn a single-model view into independent owner approval',()=>{
 const a=fixture(),report=audit(a);
 assert.equal(report.summary.sameModelNotIndependent,true);
 assert.equal(report.summary.noNewModelInferenceBeyondP877,true);
 assert.equal(report.summary.independentHumanBlindSources,0);
 assert.equal(report.summary.shouldLiftFamilyAlphaHold,false);
 assert.equal(a.data.rows[0].decision.admissionAllowed,false);
});
