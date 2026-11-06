/**
 * PRIORITY95 — GENUINE model evidence → independent per-GARMENT scientific gate.
 *
 * Priority #86 genuinely executed a 59-original-photo FashionCLIP classifier
 * and six SegFormer semantic label-map passes. Neither output is a learned
 * instance-identity polygon. Never fabricate masks from bounding-box crops.
 * Priority #94 has zero actual independent human mask review decisions.
 * Software cannot certify human identity, independence, or model execution
 * simply from a claimed JSON flag. No release permission is ever generated.
 */
import {COMMIT43_TYPES} from '../multi-garment-capture-01/atomic-group.mjs';
import {COLORS60} from '../recognition-ground-truth-gate-60/ground-truth-gate.mjs';
import {validatePolygon94,reconcileIndependentInstanceReviews94,
 scoreIndependentInstanceMasks94} from '../independent-instance-ground-truth-94/instance-evidence.mjs';
import {P86_MODEL_ORIGIN_95,FASHION86_PHOTO_ROWS_95,
 SEGFORMER86_SEMANTIC_MAPS_95} from './p86-model-snapshot.mjs';

export const P95_EVIDENCE_SCHEMA='closet-current-model-to-instance-95/scientific-gate-v1';
export const P95_INSTANCE_CANDIDATE_SCHEMA='closet-current-native-model-instances-95/v1';
const SHA=/^[0-9a-f]{64}$/;
const ID=/^[A-Za-z0-9._-]{1,90}$/;
const fail=message=>{throw Error('MODEL95 '+message);};
const partitionIds=['development','validation','locked-evaluation'];
const expectedCounts={development:32,validation:11,'locked-evaluation':16};
const validRow=x=>x&&typeof x==='object'&&!Array.isArray(x);
const isCategory=x=>Object.hasOwn(COMMIT43_TYPES,x);
const isColor=x=>COLORS60.includes(x);

function manifest95({sources,partitions,extraSegformerSources}){
 if(!Array.isArray(sources)||!partitions||!Array.isArray(extraSegformerSources))
  fail('missing authentic original JPEG manifest and frozen partitions');
 const byId=new Map(),seenSHA=new Set();
 for(const s of sources){
  if(!ID.test(s?.id||'')||!SHA.test(s?.sha256||'')||
     s.verified!==true||!s.attribution?.source||!s.attribution?.license||
     !/^[A-Za-z0-9._-]+\.jpg$/i.test(s.image||'')||
     byId.has(s.id)||seenSHA.has(s.sha256))
   fail('unlicensed, invalid or duplicated original JPEG identity');
  byId.set(s.id,s);seenSHA.add(s.sha256);
 }
 if(sources.length!==59)fail('verified original source cohort changed from pinned 59');
 const partitionById=new Map();
 for(const p of partitionIds){
  if(!Array.isArray(partitions[p])||partitions[p].length!==expectedCounts[p])
   fail('frozen P86 photo-partition size changed '+p);
  for(const x of partitions[p]){
   if(!ID.test(x?.id||'')||partitionById.has(x.id)||!byId.has(x.id))
    fail('duplicated, unlicensed or cross-split photo '+x?.id);
   partitionById.set(x.id,p);
  }
 }
 if(partitionById.size!==59)fail('not every true original photo frozen exactly once');
 const segmentSources=new Map();
 for(const s of extraSegformerSources){
  if(!ID.test(s?.id||'')||!SHA.test(s?.sha256||'')||
   !s.attribution?.source||!s.attribution?.license||segmentSources.has(s.id))
   fail('semantic source without original SHA/license or duplicate');
  segmentSources.set(s.id,s);
 }
 for(const [id,row] of byId){
  const additional=segmentSources.get(id);
  if(additional&&additional.sha256!==row.sha256)
   fail('SegFormer/classifier original SHA mismatch '+id);
 }
 return {byId,partitionById,segmentSources};
}

export function auditGenuinePhotoModelEvidence95({sources,partitions,
 extraSegformerSources}={}){
 const {byId,partitionById,segmentSources}=manifest95({
  sources,partitions,extraSegformerSources});
 const rows=[],seen=new Set(),unsupported=[],uncertain=[];
 for(const split of partitionIds){
  const input=FASHION86_PHOTO_ROWS_95[split];
  if(!Array.isArray(input)||input.length!==expectedCounts[split])
   fail('actual FashionCLIP frozen source count differs '+split);
  for(const row of input){
   if(!Array.isArray(row)||row.length!==3||!ID.test(row[0])||seen.has(row[0])||
      partitionById.get(row[0])!==split)
    fail('FashionCLIP result orphaned, duplicated or moved across splits');
   seen.add(row[0]);
   const [id,category,itemType]=row;
   if(!((category===null&&itemType===null)||
      typeof category==='string'&&typeof itemType==='string'&&
      category.length<50&&itemType.length<70))
    fail('untrusted classifier category/subtype result');
   if(category!==null&&(!isCategory(category)||
      !COMMIT43_TYPES[category].includes(itemType))){
    unsupported.push({id,category,itemType,reason:'unsupported-or-unconfirmed-photo-level-category'});
   }
   if(category===null||itemType==='Unknown')uncertain.push(id);
   rows.push(Object.freeze({id,sourceSHA256:byId.get(id).sha256,split,
    modelCategory:category,modelSubtype:itemType,
    wholePhotoOnly:true,individualGarmentPolygon:null,
    humanConfirmed:false,independentlyAdjudicated:false}));
  }
 }
 if(seen.size!==59)fail('not all 59 actual pinned original-photo model outputs bound');
 const semantic=[],semanticKeys=new Set();
 for(const x of SEGFORMER86_SEMANTIC_MAPS_95){
  if(!Array.isArray(x)||x.length!==5||
     !['chromium','webkit'].includes(x[0])||!ID.test(x[1])||
     !SHA.test(x[2]||'')||!SHA.test(x[3]||'')||
     !Number.isInteger(x[4])||x[4]<0)
   fail('malformed pinned SegFormer semantic map receipt');
  const [engine,id,sourceSHA256,labelMapSHA256,regionCount]=x;
  if(segmentSources.get(id)?.sha256!==sourceSHA256||
     !segmentSources.get(id)?.attribution?.license||
     semanticKeys.has(engine+':'+id))
   fail('model semantic-map original SHA/license or engine identity mismatch');
  semanticKeys.add(engine+':'+id);
  semantic.push(Object.freeze({engine,id,sourceSHA256,labelMapSHA256,
   regionCount,actualPinnedSemanticMap:true,
   independentlyGroundTruthed:false,
   individualGarmentPolygons:null,instanceIdentityModel:false}));
 }
 if(semantic.length!==6||
   ['chromium','webkit'].some(engine=>semantic.filter(x=>x.engine===engine).length!==3))
  fail('genuine SegFormer six-engine execution proof incomplete');
 const origin=P86_MODEL_ORIGIN_95;
 if(origin.runId!==42143014654||origin.artifactId!==13469256263||
    origin.researchCommit!=='51aeeacdff675175f89a17dd64c1281e0aa7cee8'||
    origin.segFormer.releaseLicense!=='UNSPECIFIED_BLOCKED'||
    origin.segFormer.rawReportSHA256!=='0188f49f5650a244316c12861dc0f23c1344f93d19d2d9882b4b066989402581')
  fail('pinned real-model provenance or release license gate mutated');
 return {
  schema:P95_EVIDENCE_SCHEMA,sourceCohortCount:59,
  partitions:{...expectedCounts},fashionCLIPRealPhotoRuns:59,
  segFormerRealSemanticRuns:6,segFormerUniqueLicensedSources:3,
  originalSourceSHA256Bound:true,originalJPEGLicenseBound:true,
  historicalHumanLabelsUsed:false,modelColorAccuracyMeasured:false,
  modelInstanceMaskAccuracyMeasured:false,actualIndependentlyReviewedMasks:0,
  photoOnlyPredictions:rows,semanticEvidence:semantic,unsupported,
  uncertainPhotoIds:uncertain,scientificVerdict:'NEEDS_REWORK',
  researchOnly:true,releaseAuthorized:false,familyAlpha:'HOLD',
  reference:{source86Commit:origin.researchCommit,artifactRun:origin.runId,
   artifactId:origin.artifactId,
   classifierRevision:origin.fashionCLIP.revision,
   semanticRevision:origin.segFormer.revision,
   segFormerLicenseStatus:'UNSPECIFIED_BLOCKED'}
 };
}

export function validateTrueInstanceModelPredictions95({
 submission,sources,partitions,independentExecutionVerified=false
}={}){
 if(!validRow(submission)||submission.schema!==P95_INSTANCE_CANDIDATE_SCHEMA||
    !validRow(submission.model)||
    submission.model.mode!=='learned-independent-instance-identity'||
    !ID.test(submission.model.name||'')||
    !/^[a-f0-9]{40}$/.test(submission.model.revision||'')||
    ['segformer','fashionclip','fashion-clip'].some(t=>
      submission.model.name.toLowerCase().includes(t))||
    submission.model.semanticBoxProxy!==false||
    !Array.isArray(submission.predictions))
  fail('semantic SegFormer / whole-photo FashionCLIP is NOT a per-garment instance model');
 const byId=new Map(sources?.map(x=>[x.id,x])||[]);
 const locked=new Set(partitions?.['locked-evaluation']?.map(x=>x.id)||[]);
 const got=new Set(),out=[];
 for(const p of submission.predictions){
  if(!validRow(p)||!ID.test(p.id||'')||!SHA.test(p.sourceSHA256||'')||
     !locked.has(p.id)||byId.get(p.id)?.sha256!==p.sourceSHA256||
     got.has(p.id)||!Array.isArray(p.instances)||p.instances.length>20||
     p.independentModelExecutionClaim!==true||
     p.derivation!=='native-individual-pixel-mask')
   fail('untrusted/missing/duplicate/nonlocked or source-mismatched instance prediction');
  got.add(p.id);
  const instances=p.instances.map(inst=>{
   if(!validRow(inst)||!isCategory(inst.category)||
      !COMMIT43_TYPES[inst.category].includes(inst.itemType)||
      !isColor(inst.primaryColor)||
      !(inst.secondaryColor===null||(isColor(inst.secondaryColor)&&
       inst.secondaryColor!==inst.primaryColor))||
      Object.hasOwn(inst,'boundingBoxOnly')||
      Object.hasOwn(inst,'semanticLabelGroup'))
    fail('a semantic box, unsupported subtype/color or proxy is not an instance polygon');
   return {category:inst.category,itemType:inst.itemType,
    primaryColor:inst.primaryColor,secondaryColor:inst.secondaryColor,
    polygon:validatePolygon94(inst.polygon).points};
  });
  out.push({id:p.id,sourceSHA256:p.sourceSHA256,instances});
 }
 if(got.size!==locked.size)fail('complete locked native-instance model prediction coverage required');
 return {predictions:out,
  independentModelExecutionVerified:independentExecutionVerified===true,
  verificationNote:'JSON model-execution flag cannot prove learned model actually ran',
  scientificClaimsAuthorized:false};
}

/**
 * Evaluation uses ONLY A/B source-bound individual polygons plus optional
 * C adjudication and separately supplied NATIVE instance-model polygons.
 * Independently verified humans are not created by an export JSON: the
 * software never promotes the statistics into release-ready scientific truth.
 */
export function gateIndependentInstanceAccuracy95({
 modelAudit,sourceRows,partitions,
 packetA=null,reviewA=null,packetB=null,reviewB=null,
 packetC=null,reviewC=null,candidateSubmission=null,
 auditedRealHumanProcess=false,auditedRealModelExecution=false
}={}){
 if(!modelAudit||modelAudit.schema!==P95_EVIDENCE_SCHEMA||
    modelAudit.sourceCohortCount!==59||modelAudit.fashionCLIPRealPhotoRuns!==59||
    modelAudit.segFormerRealSemanticRuns!==6||
    modelAudit.releaseAuthorized!==false)
  fail('missing actual source-locked P86 lineage');
 const blockers=[
  'zero-independently-human-annotated-instance-masks',
  'no-genuine-source-bound-learned-instance-identity-model-output',
  'insufficient-100-independent-source-photo-coverage',
  'insufficient-30-locked-garments-and-10-locked-negatives',
  'pinned-SegFormer-converted-weights-license-unconfirmed'
 ];
 let reconciliation=null,exploratoryMaskScores=null,truthCount=0;
 if(packetA!==null||reviewA!==null||packetB!==null||reviewB!==null||
    packetC!==null||reviewC!==null){
  if(!packetA||!reviewA||!packetB||!reviewB)
   fail('independent role A and role B source reviews required together');
  reconciliation=reconcileIndependentInstanceReviews94({
   packetA,reviewA,packetB,reviewB,packetC,reviewC
  });
  const locked=new Set(partitions?.['locked-evaluation']?.map(x=>x.id)||[]);
  const adjudicated=reconciliation.accepted.filter(x=>locked.has(x.id));
  truthCount=adjudicated.length;
  if(!reconciliation.pending.length&&truthCount>=30&&auditedRealHumanProcess===true)
   blockers.splice(blockers.indexOf('zero-independently-human-annotated-instance-masks'),1);
  if(candidateSubmission){
   const candidate=validateTrueInstanceModelPredictions95({
    submission:candidateSubmission,sources:sourceRows,partitions,
    independentExecutionVerified:auditedRealModelExecution
   });
   if(adjudicated.length===locked.size&&candidate.independentModelExecutionVerified)
    exploratoryMaskScores=scoreIndependentInstanceMasks94({
     accepted:adjudicated,predictions:candidate.predictions
    });
  }
 }else if(candidateSubmission!==null){
  // Never evaluate from model output alone or a prior single-label manifest.
  validateTrueInstanceModelPredictions95({
   submission:candidateSubmission,sources:sourceRows,partitions,
   independentExecutionVerified:auditedRealModelExecution
  });
 }
 return {
  schema:'closet-current-independent-instance-science-gate-95/v1',
  evidence:{genuineClassifierPhotoRuns:modelAudit.fashionCLIPRealPhotoRuns,
   genuineSegFormerSemanticRuns:modelAudit.segFormerRealSemanticRuns,
   genuineInstanceModelRunsIndependentlyVerified:auditedRealModelExecution===true?null:0,
   actualIndependentlyAuditedHumanInstancePhotos:auditedRealHumanProcess===true?truthCount:0,
   annotationJSONCannotVerifyHumanIdentity:true},
  blockers,realModelInstanceMaskAccuracy:exploratoryMaskScores,
  evaluationStatus:exploratoryMaskScores?'EXPLORATORY_NOT_RELEASE_VALIDATED':'BLOCKED_NO_INDEPENDENT_INSTANCE_TRUTH',
  scientificVerdict:'NEEDS_REWORK',releaseAuthorized:false,familyAlpha:'HOLD',
  noDeployment:true,notes:'Existing P86 outputs are whole-image or semantic regions; never fabricate per-garment masks from boxes, old labels or model scores.'
 };
}
