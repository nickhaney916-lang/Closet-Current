#!/usr/bin/env node
/**
 * Real P86 model output lineage → P94 individual instance truth gate.
 * This reads 59 actual source JPEG bytes and never runs a synthetic model.
 * Any whole-photo or semantic masks are non-instance, regardless of score.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {auditGenuinePhotoModelEvidence95,gateIndependentInstanceAccuracy95}
 from '../research/real-model-instance-scientific-bridge-95/model-instance-gate.mjs';
import {makeInstancePacket94,verifyPacket94}
 from '../research/independent-instance-ground-truth-94/instance-evidence.mjs';
const parse=async file=>JSON.parse(await readFile(file,'utf8'));
const sources=await parse('benchmark/locked-photo-sources.json');
const partitions={
 development:await parse('benchmark/manifest-reviewed-32.json'),
 validation:await parse('benchmark/manifest-fresh-11.json'),
 'locked-evaluation':await parse('benchmark/manifest-holdout-16.json')
};
const extraSegformerSources=await parse('research/multi-review-triage-28/frozen-photo-annotations-16.json');
const sourceSet=new Set(),shaSet=new Set();let bytesTotal=0;
for(const s of sources){
 assert.ok(!sourceSet.has(s.id)&&!shaSet.has(s.sha256));
 sourceSet.add(s.id);shaSet.add(s.sha256);
 const bytes=await readFile('benchmark/fixtures/'+s.image);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),s.sha256,
  'Original model source JPEG altered: '+s.id);
 const meta=await sharp(bytes).metadata();
 assert.equal(meta.format,'jpeg');
 assert.ok(meta.width>0&&meta.height>0);
 bytesTotal+=bytes.length;
}
assert.equal(sources.length,59);
const origin=auditGenuinePhotoModelEvidence95({
 sources,partitions,extraSegformerSources
});
const packets=['A','B','C'].map(role=>makeInstancePacket94({sources,role}));
for(const packet of packets)assert.equal(verifyPacket94(packet),true);
assert.equal(origin.fashionCLIPRealPhotoRuns,59);
assert.equal(origin.segFormerRealSemanticRuns,6);
assert.equal(origin.unsupported.some(x=>x.id==='validation-0008'&&x.category==='Accessories'),true);
assert.ok(origin.uncertainPhotoIds.length>0);
assert.ok(origin.semanticEvidence.every(x=>x.individualGarmentPolygons===null));
assert.ok(origin.photoOnlyPredictions.every(x=>x.individualGarmentPolygon===null));
const science=gateIndependentInstanceAccuracy95({
 modelAudit:origin,sourceRows:sources,partitions
});
assert.equal(science.realModelInstanceMaskAccuracy,null);
assert.equal(science.scientificVerdict,'NEEDS_REWORK');
assert.equal(science.releaseAuthorized,false);
assert.equal(science.evidence.actualIndependentlyAuditedHumanInstancePhotos,0);
const result={
 schema:'closet-current-p95-real-model-instance-scientific-audit-v1',
 source86ExactCommit:origin.reference.source86Commit,
 originalActualModelArchiveRun:origin.reference.artifactRun,
 originalActualModelArtifact:origin.reference.artifactId,
 sourcesVerifiedWithRealJPEGBytes:59,sourcePhotoBytesReadLocally:bytesTotal,
 sourceDuplicates:0,sourceLicensesMissing:0,
 independentP94PacketCount:3,independentP94PacketPhotoCount:59,
 actualFashionCLIPWholePhotoModelRuns:59,
 actualSegFormerSemanticModelRuns:6,
 semanticSourcePhotos:3,
 unsupportedOutOfTaxonomyPhotoPredictions:origin.unsupported,
 uncertainPhotoPredictionIDs:origin.uncertainPhotoIds,
 segFormerPixelLabelSHAReceipts:origin.semanticEvidence.map(x=>({
  engine:x.engine,id:x.id,sourceSHA256:x.sourceSHA256,
  originalModelLabelMapSHA256:x.labelMapSHA256,
  individualGarmentMasksAvailable:false
 })),
 independentHumanInstanceTruth:0,
 actualInstanceIdentityModelPredictions:0,
 instanceIoUFromActualHumanTruth:null,instanceDetectionPrecision:null,
 instanceDetectionRecall:null,categoryInstanceAccuracy:null,
 subtypeInstanceAccuracy:null,primaryColorInstanceAccuracy:null,
 secondaryColorInstanceAccuracy:null,
 scoreFromLegacyPhotoLabels:false,scoreFromBoxes:false,
 trueSegFormerModelLicenseUnconfirmed:true,
 modelOriginSnapshotFromPriorActionNotRerun:true,
 scientificVerdict:science.scientificVerdict,
 scientificGateBlockers:science.blockers,
 releaseAuthorized:false,familyAlpha:'HOLD',
 productionModified:false,existingStagingModified:false,merged:false,deployed:false
};
const out='benchmark/model-instance-science-95';
await mkdir(out,{recursive:true});
await writeFile(out+'/acceptance.json',JSON.stringify(result,null,2)+'\n');
console.log('MODEL95 actual pinned P86 evidence and P94 source-bound individual-mask scientific gate: '+
 JSON.stringify({sources:59,photoModelRuns:59,semanticModelRuns:6,
  independentlyLabeledMasks:0,sourceTrueInstanceScores:null,
  verdict:'NEEDS_REWORK',researchEngineering:'PASS',familyAlpha:'HOLD'}));
