// Assignment #88: synthetic accepted-mask conservation, NOT independently
// human-labeled image accuracy or evidence of actual SegFormer quality.
import test from 'node:test';
import {generateKeyPairSync,sign as edSign,createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {mkdtemp,writeFile,symlink,rm,chmod,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {P88_FROZEN_CANDIDATE,frozenCandidateDigest88,canonicalP88,sha256,
 verifyBlindEvaluatorHandoff88,externalPrivateFile88,
 externalPrivateLedgerDirectory88,reserveBlindEvaluatorHandoff88} from '../research/mission1-parallel88/blind-evaluator-handoff-88.mjs';
import assert from 'node:assert/strict';
import {clothingLabelMap,clothingMaskGroups} from '../public/outfit-segmentation.mjs';
import {exposedPixelGateMap88,P88_EXPOSED_PIXEL_PROBES,accessoryBoxIoU88,evaluateCocoAccessoryBoxes88,cocoAccessoryLabel88} from '../research/mission1-parallel88/exposed-threshold-probes-88.mjs';
import {FASHION_MAIN_LABELS88,FASHION_ACCESSORY_IDS88,FASHION_FINE_SUBTYPE_GAPS88,
 fashionFineSubtypeClaimGate88,decodeFashionYolo88,scoreFashionAccessory88,fashionBoxNms88} from '../research/mission1-parallel88/fashion-onnx-probes-88.mjs';
import {clothingReviewInstances840} from '../public/outfit-instance-review-840.mjs';

function fixture(width=48,height=48){
 const area=width*height,data=new Float32Array(18*area);
 data.fill(-10);
 for(let i=0;i<area;i++)data[i]=10;
 return {
  paint(cls,x,y,w,h){
   for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++){
    const i=row*width+col;
    for(let c=0;c<18;c++)data[c*area+i]=c===cls?10:-10;
   }
  },
  map:()=>clothingLabelMap(data,[1,18,height,width])
 };
}
function proveConservation(original,proposed){
 const total=original.selected.reduce((n,x)=>n+x,0);
 assert.equal(proposed.reduce((n,g)=>n+g.count,0),total);
 for(let i=0;i<original.selected.length;i++){
  assert.equal(proposed.reduce((n,g)=>n+g.selected[i],0),original.selected[i],
   'accepted source pixel '+i+' must occur exactly once');
 }
}
test('P88 two disconnected shirts become separate UNSAVED review masks, never duplicate pixels',()=>{
 const f=fixture();f.paint(4,5,9,6,6);f.paint(4,27,9,6,6);f.paint(6,15,25,10,7);
 const map=f.map(),original=clothingMaskGroups(map).find(x=>x.id===4);
 assert.equal(original.count,72,'legacy merged the two same-class garments');
 const proposals=clothingReviewInstances840(map,{splitNonFootwear:true}).filter(x=>x.id===4);
 assert.equal(proposals.length,2);
 assert.deepEqual(proposals.map(p=>p.count),[36,36]);
 assert.ok(proposals.every(p=>p.requiresReview===true&&
  p.instanceMethod==='connected_semantic_component_unverified'&&
  p.componentReviewStatus==='owner_must_confirm_garment_units'));
 proveConservation(original,proposals);
});
test('P88 two disconnected dresses remain proposals, not verified dress identities',()=>{
 const f=fixture();f.paint(7,4,7,6,7);f.paint(7,30,8,6,7);
 const map=f.map(),original=clothingMaskGroups(map).find(x=>x.id===7);
 const proposed=clothingReviewInstances840(map,{splitNonFootwear:true}).filter(x=>x.id===7);
 assert.equal(proposed.length,2);
 assert.ok(proposed.every(x=>x.requiresReview&&x.types===undefined&&x.id===7));
 proveConservation(original,proposed);
});
test('P88 tiny detached shirt fragment does not disappear or fabricate a second garment',()=>{
 const f=fixture();f.paint(4,6,9,7,7);f.paint(4,34,10,1,5);
 const map=f.map(),original=clothingMaskGroups(map).find(x=>x.id===4);
 const proposed=clothingReviewInstances840(map).filter(x=>x.id===4);
 assert.equal(original.count,54);assert.equal(proposed.length,1);
 assert.equal(proposed[0].componentReviewStatus,'unresolved_fragments_keep_source_mask');
 assert.equal(proposed[0].requiresReview,true);
 proveConservation(original,proposed);
});
test('P88 existing two-shoe owner-review split remains unchanged and source-conserving',()=>{
 const f=fixture();f.paint(9,5,33,5,5);f.paint(9,32,33,5,5);
 const map=f.map(),original=clothingMaskGroups(map).find(x=>x.id===9);
 const shoes=clothingReviewInstances840(map).filter(x=>x.id===9);
 assert.equal(shoes.length,2);
 assert.ok(shoes.every(x=>x.instanceMethod==='connected_footwear_component'&&x.requiresReview));
 proveConservation(original,shoes);
});
test('P88 no clothing pixels produce no phantom garment proposals',()=>{
 const f=fixture(),map=f.map();
 assert.deepEqual(clothingReviewInstances840(map),[]);
});

test('P88 source-verified conservative trial does not create six unproved nonshoe physical items',()=>{
 const f=fixture();f.paint(4,5,9,6,6);f.paint(4,27,9,6,6);
 f.paint(7,4,25,6,7);f.paint(7,30,25,6,7);
 const map=f.map(),source=clothingMaskGroups(map);
 const safe=clothingReviewInstances840(map);
 const research=clothingReviewInstances840(map,{splitNonFootwear:true});
 for(const id of [4,7]){
  const original=source.find(x=>x.id===id);
  assert.equal(safe.filter(x=>x.id===id).length,1,'no unsupported automatic nonshoe instance inflation');
  assert.equal(research.filter(x=>x.id===id).length,2,'all-class research remains reproducible');
  assert.equal(safe.find(x=>x.id===id).instanceMethod,'native_semantic_group_unresolved_fragments');
  assert.equal(safe.find(x=>x.id===id).componentReviewStatus,'unresolved_fragments_keep_source_mask',
   'two disconnected garments must never silently save as one item');
  proveConservation(original,safe.filter(x=>x.id===id));
  proveConservation(original,research.filter(x=>x.id===id));
 }
 assert.equal(safe.every(x=>x.requiresReview===true),true);
});


function researchLogits88(){
 const width=48,height=48,area=width*height,data=new Float32Array(area*18);
 data.fill(-100);
 // Native/logit source background for all pixels.
 for(let i=0;i<area;i++)data[i]=0;
 const rect=(left,top,right,bottom,value)=>{
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)
   data[4*area+y*width+x]=value;
 };
 rect(16,16,32,32,.4); // soft accepted-class perimeter
 rect(17,17,31,31,.8); // medium confidence margin
 rect(18,18,30,30,4); // exact original high-confidence shirt core
 return {data,dims:[1,18,height,width]};
}
test('P88 research-only alternative pixel gates never alter production group selection',()=>{
 const {data,dims}=researchLogits88(),original=data.slice();
 const actual=clothingLabelMap(data,dims);
 const duplicate=exposedPixelGateMap88(data,dims,{pixelConfidence:.7,pixelMargin:.15});
 assert.deepEqual(duplicate.labels,actual.labels,'research gate must exactly reproduce native source at default');
 assert.deepEqual(duplicate.confidence,actual.confidence,'no changed original/native probability calculation');
 assert.equal(duplicate.personDetected,actual.personDetected);
 const broad=exposedPixelGateMap88(data,dims,P88_EXPOSED_PIXEL_PROBES.researchLoose65);
 const wider=exposedPixelGateMap88(data,dims,P88_EXPOSED_PIXEL_PROBES.researchLoose55);
 assert.deepEqual([clothingMaskGroups(actual)[0].count,
  clothingMaskGroups(broad)[0].count,clothingMaskGroups(wider)[0].count],[144,196,256],
  'research-only pixel gate adds uncertain boundary pixels but never saves');
 assert.equal(clothingReviewInstances840(wider).every(x=>x.requiresReview===true),true);
 assert.deepEqual(data,original,'research-only gate does not mutate model logits');
 assert.deepEqual(clothingMaskGroups(clothingLabelMap(data,dims)).map(x=>x.count),[144],
  'the production SegFormer mask must remain unchanged');
});
test('P88 experimental thresholds reject corrupt or adversarial SegFormer inputs',()=>{
 const {data,dims}=researchLogits88();
 for(const invalid of [
  {pixelConfidence:0.49,pixelMargin:.1},
  {pixelConfidence:NaN,pixelMargin:.1},
  {pixelConfidence:.65,pixelMargin:1},
  {pixelConfidence:.65,pixelMargin:-.001},
  null
 ])assert.throws(()=>exposedPixelGateMap88(data,dims,invalid),/P88_RESEARCH_INVALID_PIXEL_GATE/);
 assert.throws(()=>exposedPixelGateMap88(data,[1,17,48,48],P88_EXPOSED_PIXEL_PROBES.researchLoose65),
  /P88_RESEARCH_INVALID_MODEL_LOGITS/);
 const poisoned=data.slice();poisoned[400]=NaN;
 assert.throws(()=>exposedPixelGateMap88(poisoned,dims,P88_EXPOSED_PIXEL_PROBES.researchLoose55),
  /P88_RESEARCH_NONFINITE_LOGITS/);
});
test('P88 research pixel-gate never invents an unsourced clothing label or owner permission',()=>{
 const dims=[1,18,24,24],area=24*24,data=new Float32Array(area*18);
 data.fill(-100);for(let i=0;i<area;i++)data[i]=0;
 for(let y=5;y<19;y++)for(let x=5;x<19;x++){
  // Source logits class 2 represents hair and is explicitly non-clothing.
  data[2*area+y*24+x]=6;
 }
 const broad=exposedPixelGateMap88(data,dims,P88_EXPOSED_PIXEL_PROBES.researchLoose55);
 assert.deepEqual(clothingMaskGroups(broad),[]);
 assert.equal(Array.from(broad.labels).some(x=>x!==0),false);
});


test('P88 research source loose shoe mask conserves both physical-region proposals',()=>{
 const width=48,height=48,area=width*height,data=new Float32Array(area*18);
 data.fill(-100);
 for(let i=0;i<area;i++)data[i]=0;
 const shoe=(left,top)=>{
  for(let y=top;y<top+10;y++)for(let x=left;x<left+9;x++)
   data[9*area+y*width+x]=4;
 };
 shoe(4,29);shoe(32,29);
 const native=clothingLabelMap(data,[1,18,height,width]),
  relaxed=exposedPixelGateMap88(data,[1,18,height,width],
   P88_EXPOSED_PIXEL_PROBES.researchLoose65);
 const base=clothingMaskGroups(native),group=clothingMaskGroups(relaxed);
 assert.equal(base.length,1);
 assert.equal(group.length,1,'semantic union still represents two shoes as one source class');
 const review=clothingReviewInstances840(relaxed);
 assert.equal(review.length,2,'existing conservative physical shoe review restores source components');
 assert.equal(review.every(x=>x.requiresReview===true &&
  x.instanceMethod==='connected_footwear_component' &&
  x.componentReviewStatus==='owner_must_confirm_garment_units'),true);
 proveConservation(group[0],review);
 assert.equal(review.reduce((sum,r)=>sum+r.count,0),180);
});


test('P88 COCO model bag scope cannot explain unsupported watch, belt, glasses or hats',()=>{
 assert.equal(cocoAccessoryLabel88('handbag'),'bag');
 assert.equal(cocoAccessoryLabel88('backpack'),'bag');
 assert.equal(cocoAccessoryLabel88('tie'),'tie');
 assert.equal(cocoAccessoryLabel88('umbrella'),'umbrella');
 for(const label of ['watch','belt','glasses','hat','person','shoe','shirt',null])
  assert.equal(cocoAccessoryLabel88(label),null);
 const gt=[
  {category_id:24,box:{xmin:5,ymin:5,xmax:15,ymax:15}},
  {category_id:18,box:{xmin:20,ymin:5,xmax:24,ymax:9}},
  {category_id:19,box:{xmin:5,ymin:20,xmax:18,ymax:25}},
  {category_id:13,box:{xmin:30,ymin:8,xmax:42,ymax:14}},
  {category_id:14,box:{xmin:25,ymin:25,xmax:45,ymax:36}},
  {category_id:15,box:{xmin:2,ymin:30,xmax:10,ymax:40}}
 ];
 const p=[{label:'handbag',score:.98,box:{xmin:5,ymin:5,xmax:15,ymax:15}},
  {label:'person',score:.99,box:{xmin:0,ymin:0,xmax:48,ymax:48}}];
 const result=evaluateCocoAccessoryBoxes88(gt,p);
 assert.equal(result.supportedHuman,1);
 assert.equal(result.unsupportedHuman,5);
 assert.equal(result.matched,1);
 assert.equal(result.proposals,1);
 assert.equal(result.falsePositives,0);
 assert.deepEqual(result.unsupportedFashionpediaIds,[18,19,13,14,15]);
 assert.equal(result.noSaveOrModelPromotion,true);
});
test('P88 accessory COCO boxes use source-bound per-class 1:1 IoU not duplicated detections',()=>{
 const gt=[{category_id:24,box:{xmin:0,ymin:0,xmax:10,ymax:10}},
           {category_id:24,box:{xmin:25,ymin:25,xmax:35,ymax:35}}];
 const seen=[{label:'handbag',score:.9,box:{xmin:0,ymin:0,xmax:10,ymax:10}},
             {label:'backpack',score:.8,box:{xmin:0,ymin:0,xmax:10,ymax:10}},
             {label:'umbrella',score:.8,box:{xmin:25,ymin:25,xmax:35,ymax:35}}];
 const r=evaluateCocoAccessoryBoxes88(gt,seen);
 assert.equal(r.matched,1,'identical overlapping bags cannot match two human physical instances');
 assert.equal(r.falsePositives,2);
 assert.equal(r.falseNegatives,1);
 assert.ok(Math.abs(accessoryBoxIoU88(
  {xmin:0,ymin:0,xmax:10,ymax:10},
  {xmin:5,ymin:5,xmax:15,ymax:15})-1/7)<.0000001);
 assert.throws(()=>evaluateCocoAccessoryBoxes88(
  [{category_id:23,box:gt[0].box}],[]),/P88_EXPECTED_ACCESSORY_TRUTH_ONLY/);
 assert.throws(()=>evaluateCocoAccessoryBoxes88(gt,[
  {label:'handbag',score:NaN,box:gt[0].box}]),/P88_INVALID_COCO_CONFIDENCE/);
 assert.throws(()=>evaluateCocoAccessoryBoxes88(gt,[
  {label:'handbag',score:.6,box:{xmin:0,ymin:0,xmax:0,ymax:10}}]),
 /P88_INVALID_BOX/);
});


test('P88 Fashionpedia ONNX decoder retains watch belt headwear rather than COCO erasure',()=>{
 assert.equal(FASHION_MAIN_LABELS88.length,27);
 assert.deepEqual([13,14,15,18,19,24].map(i=>FASHION_MAIN_LABELS88[i]),
  ['glasses','hat','headband, head covering, hair accessory','watch','belt','bag, wallet']);
 assert.equal(FASHION_ACCESSORY_IDS88.includes(18),true);
 const channels=50,anchors=3,arr=new Float32Array(channels*anchors);
 const set=(ch,j,value)=>{arr[ch*anchors+j]=value;};
 // Each bounding box is native 640 letterbox space, original source 1000 x 500.
 for(const [j,cls,cx,cy] of [[0,18,320,320],[1,19,160,240],[2,23,480,320]]){
  set(0,j,cx);set(1,j,cy);set(2,j,64);set(3,j,64);
  set(4+cls,j,.95);
 }
 const geom={inputSize:640,width:640,height:320,padX:0,padY:160};
 const out=decodeFashionYolo88(arr,[1,50,3],1000,500,geom);
 assert.deepEqual(out.map(x=>x.category_id),[18,19]);
 assert.equal(out[0].box.xmin,450);
 assert.equal(out[0].box.ymin,200);
 assert.equal(out[0].box.xmax,550);
 assert.equal(out[0].box.ymax,300);
 const scored=scoreFashionAccessory88([
  {category_id:18,box:{xmin:450,ymin:200,xmax:550,ymax:300}},
  {category_id:19,box:{xmin:200,ymin:75,xmax:300,ymax:175}}
 ],out);
 assert.equal(scored.human,2);
 assert.equal(scored.matched,2);
 assert.equal(scored.proposals,2);
 assert.equal(scored.noOwnerSave,true);
});
test('P88 Fashionpedia ONNX rejects forged outputs and duplicate overlapping watches',()=>{
 const boxes=[
  {category_id:18,score:.9,box:{xmin:2,ymin:2,xmax:20,ymax:20}},
  {category_id:18,score:.8,box:{xmin:2,ymin:2,xmax:20,ymax:20}},
  {category_id:19,score:.8,box:{xmin:2,ymin:2,xmax:20,ymax:20}}
 ];
 assert.deepEqual(fashionBoxNms88(boxes).map(x=>x.category_id),[18,19]);
 assert.throws(()=>scoreFashionAccessory88([{category_id:23,box:boxes[0].box}],[]),
  /P88_FASHION_UNSUPPORTED_HUMAN_ACCESSORY/);
 assert.throws(()=>scoreFashionAccessory88([{category_id:18,box:boxes[0].box}],
  [{...boxes[0],score:NaN}]),/P88_FASHION_INVALID_ACCESSORY_PROPOSAL/);
 assert.throws(()=>decodeFashionYolo88(new Float32Array(100),
  [1,51,2],640,640,{inputSize:640,width:640,height:640,padX:0,padY:0}),
 /P88_FASHION_INVALID_TENSOR/);
 const invalid=new Float32Array(50*2);invalid[49*2]=NaN;
 assert.throws(()=>decodeFashionYolo88(invalid,[1,50,2],640,640,
  {inputSize:640,width:640,height:640,padX:0,padY:0}),/P88_FASHION_NONFINITE_LOGITS/);
});
test('P88 Fashionpedia ONNX does not invent labels from clothing part or shoe boxes',()=>{
 const channels=50,anchors=2,arr=new Float32Array(channels*anchors);
 for(let i=0;i<anchors;i++){
  arr[i]=320;arr[anchors+i]=320;
  arr[2*anchors+i]=64;arr[3*anchors+i]=64;
 }
 arr[(4+23)*anchors]=.9; // source shoe, not a watch accessory
 arr[(4+42)*anchors+1]=.9; // source rivet/clothing part, not independent outfit item
 const out=decodeFashionYolo88(arr,[1,50,2],640,640,
  {inputSize:640,width:640,height:640,padX:0,padY:0});
 assert.deepEqual(out,[]);
});


function privateP75P71Fixture88(){
 const p75=generateKeyPairSync('ed25519'),p71=generateKeyPairSync('ed25519');
 const pub=x=>x.publicKey.export({type:'spki',format:'pem'});
 const pinned=x=>sha256(x.publicKey.export({type:'spki',format:'der'}));
 const candidateDigest=frozenCandidateDigest88;
 const now=new Date('2026-11-14T20:00:00.000Z');
 const source={
  schema:'p88-p75-signed-audit/v1',candidateDigest,
  auditDigest:'a'.repeat(64),historicalExposureLedgerDigest:'b'.repeat(64),
  sealedBlindCommitment:'c'.repeat(64),rightsEvidenceDigest:'d'.repeat(64),
  sourceGroupCount:60,sealedBlindPhotoCount:60,approvedOriginalsCount:60,
  dualHumanReviewedCount:60,verifiedIndependentHumanReviewers:2,
  unresolvedDisagreements:0,historicalExposureComplete:true,
  prospectiveSourceAndPhotographerDisjoint:true,
  pretrainedModelTrainingDisjointnessVerified:true,
  fullSourceBytesAndLicenseVerified:true,humanRightsAndConsentApproved:true,
  sourceGroupsIndependentlyVerified:true,noPriorModelOrAnswerExposure:true,
  answerKeysOutsideRepository:true,
  auditedAt:'2026-11-14T19:55:00.000Z',expiresAt:'2026-11-14T20:55:00.000Z'
 };
 const sign=(x,key)=>edSign(null,Buffer.from(canonicalP88(x)),
  key.privateKey).toString('base64');
 const sourceAudit={...source,signature:sign(source,p75)};
 const evaluator={
  schema:'p88-p71-evaluator-authorization/v1',candidateDigest,
  sourceAuditPayloadDigest:sha256(canonicalP88(source)),
  sealedBlindCommitment:source.sealedBlindCommitment,
  independentEvaluatorAuthorized:true,
  independentFromModelDevelopment:true,willEvaluateBlindOnlyOnce:true,
  answersNotPreviouslyExposed:true,
  acceptedAt:'2026-11-14T19:56:00.000Z'
 };
 const packet={
  schema:'p88-blind-evaluator-handoff/v1',sourceAudit,
  sourceAuditPublicKey:pub(p75),
  evaluatorApproval:{...evaluator,signature:sign(evaluator,p71)},
  evaluatorPublicKey:pub(p71)
 };
 const trust={p75RegistrarFingerprint:pinned(p75),
  p71EvaluatorFingerprint:pinned(p71),now};
 return {packet,trust,sign,keys:{p75,p71},source,evaluator};
}
test('P88 blind evaluator handoff refuses untrusted human evidence and preserves release hold',()=>{
 const f=privateP75P71Fixture88();
 const out=verifyBlindEvaluatorHandoff88(f.packet,f.trust);
 assert.equal(out.status,'SIGNED_CUSTODY_PREFLIGHT_ONLY',
  'signed synthetic assertions only prove crypto/contract');
 assert.equal(out.canSendRestrictedHandoffToP71,true);
 assert.equal(out.independentBlindScorePerformed,false);
 assert.equal(out.accuracyMeasured,false);
 assert.equal(out.releaseApproval,false);
 assert.equal(out.modelPromotionAllowed,false);
 assert.equal(out.automaticSaveAllowed,false);
 assert.equal(out.familyAlphaHold,true);
 assert.equal(frozenCandidateDigest88,sha256(canonicalP88(P88_FROZEN_CANDIDATE)));
 assert.equal(P88_FROZEN_CANDIDATE.modelOnnxSha256,
  '6b581af3abe2b4ae97a84cbe9aef5ae37207a68ee966d22b0b8d7969d79e6920');
 assert.equal(P88_FROZEN_CANDIDATE.originalExposedPhotoManifestSha256,
  'b76e9890bda49c58c6adbbafb6f7dd738f4dcf604357fc56aa0b6e770ebe35bd');
});
test('P88 blind handoff denies tampering, single-authority impersonation and replay',()=>{
 const f=privateP75P71Fixture88(),packet=f.packet,trust=f.trust;
 const checks=[
  [structuredClone(packet),{...trust,p71EvaluatorFingerprint:trust.p75RegistrarFingerprint}],
  [structuredClone(packet),{...trust,p75RegistrarFingerprint:'f'.repeat(64)}],
  [structuredClone(packet),{...trust,now:new Date('2026-11-15T01:00:00Z')}]
 ];
 checks[0][0].sourceAudit.sealedBlindCommitment='e'.repeat(64);
 checks.push([{...structuredClone(packet),labels:[{private:'not-in-public-bundle'}]},trust]);
 for(const [p,t] of checks){
  const r=verifyBlindEvaluatorHandoff88(p,t);
  assert.equal(r.status,'BLOCKED');
  assert.equal(r.canSendRestrictedHandoffToP71??false,false);
  assert.equal(r.modelPromotionAllowed,false);
  assert.equal(r.accuracyMeasured,false);
  assert.equal(JSON.stringify(r).includes('private'),false,'never echo private labels or IDs');
 }
 const modified=structuredClone(packet);
 modified.evaluatorApproval.candidateDigest='e'.repeat(64);
 assert.equal(verifyBlindEvaluatorHandoff88(modified,trust).status,'BLOCKED');
});
test('P88 blind handoff denies synthetic unlabeled development sources even if signed',()=>{
 const f=privateP75P71Fixture88();
 function resigned(changes){
  const source={...f.source,...changes};
  const sourceAudit={...source,signature:f.sign(source,f.keys.p75)};
  const evaluator={...f.evaluator,
   sealedBlindCommitment:source.sealedBlindCommitment,
   sourceAuditPayloadDigest:sha256(canonicalP88(source))};
  return {...f.packet,sourceAudit,
   evaluatorApproval:{...evaluator,signature:f.sign(evaluator,f.keys.p71)}};
 }
 for(const change of [
  {dualHumanReviewedCount:0},{sealedBlindPhotoCount:0},
  {verifiedIndependentHumanReviewers:1},{sourceGroupCount:59},
  {unresolvedDisagreements:1},{noPriorModelOrAnswerExposure:false},
  {prospectiveSourceAndPhotographerDisjoint:false},
  {pretrainedModelTrainingDisjointnessVerified:false},
  {humanRightsAndConsentApproved:false},
  {historicalExposureComplete:false},
  {sealedBlindCommitment:P88_FROZEN_CANDIDATE.originalExposedPhotoManifestSha256}
 ]){
  const x=verifyBlindEvaluatorHandoff88(resigned(change),f.trust);
  assert.equal(x.status,'BLOCKED',JSON.stringify(change));
  assert.equal(x.canSendRestrictedHandoffToP71,false);
  assert.equal(x.automaticSaveAllowed,false);
 }
});


test('P88 signed private blind envelope inspection refuses execution inside CI',()=>{
 const result=spawnSync(process.execPath,[
  'research/mission1-parallel88/blind-evaluator-handoff-88.mjs',
  'inspect','/tmp/p88-private-should-never-be-read.json'
 ],{cwd:process.cwd(),env:{...process.env,CI:'true'},encoding:'utf8'});
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/PRIVATE_BLIND_HANDOFF_FORBIDDEN_IN_CI/);
 assert.equal(result.stdout,'','never print private labels, photos or trust material');
});

test('P88 private blind custody path refuses symlinks into checkout, special files and oversized input',async()=>{
 // Only disposable synthetic files. No human labels, photos, real blind truth or keys.
 const checkoutFixture=resolve('research/mission1-parallel88/blind-evaluator-handoff-88.mjs');
 const dir=await mkdtemp(join(tmpdir(),'p88-private-path-'));
 try{
  const safe=join(dir,'synthetic-envelope.json');
  await writeFile(safe,'{}',{mode:0o600});
  assert.equal(await externalPrivateFile88(safe),safe);
  await assert.rejects(externalPrivateFile88('synthetic-envelope.json'),
   /PRIVATE_ABSOLUTE_PATH_REQUIRED/);
  await assert.rejects(externalPrivateFile88(checkoutFixture),
   /PRIVATE_CUSTODY_MUST_STAY_OUTSIDE_GIT/);
  await assert.rejects(externalPrivateFile88(dir),
   /PRIVATE_HANDOFF_REGULAR_FILE_REQUIRED/);
  const oversized=join(dir,'oversized.json');
  await writeFile(oversized,'x'.repeat(50001),{mode:0o600});
  await assert.rejects(externalPrivateFile88(oversized),
   /PRIVATE_HANDOFF_TOO_LARGE/);
  const alias=join(dir,'outside-file-link');
  await symlink(safe,alias);
  await assert.rejects(externalPrivateFile88(alias),
   /PRIVATE_HANDOFF_SYMLINK_PATH_FORBIDDEN/);
  const checkoutAlias=join(dir,'checkout-dir-alias');
  await symlink(process.cwd(),checkoutAlias,'dir');
  await assert.rejects(externalPrivateFile88(join(checkoutAlias,'research/mission1-parallel88/blind-evaluator-handoff-88.mjs')),
   /PRIVATE_CUSTODY_MUST_STAY_OUTSIDE_GIT/);
  const repoFileAlias=join(dir,'checkout-file-alias');
  await symlink(checkoutFixture,repoFileAlias);
  await assert.rejects(externalPrivateFile88(repoFileAlias),
   /PRIVATE_CUSTODY_MUST_STAY_OUTSIDE_GIT/);
 }finally{
  await rm(dir,{recursive:true,force:true});
 }
});

test('P88 synthetic signed blind-cohort authorization reserves exactly once in one private ledger',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'p88-private-reserve-'));
 try{
  const f=privateP75P71Fixture88();
  assert.equal(await externalPrivateLedgerDirectory88(dir),dir);
  const noLedger=await reserveBlindEvaluatorHandoff88(f.packet,f.trust);
  assert.equal(noLedger.status,'BLOCKED');
  assert.deepEqual(noLedger.errors,['PRIVATE_LEDGER_REQUIRED']);
  const [a,b]=await Promise.all([
   reserveBlindEvaluatorHandoff88(f.packet,{...f.trust,ledgerDir:dir}),
   reserveBlindEvaluatorHandoff88(f.packet,{...f.trust,ledgerDir:dir})
  ]);
  const wins=[a,b].filter(x=>x.oneTimePrivateReservationCreated);
  const denied=[a,b].filter(x=>x.status==='BLOCKED');
  assert.equal(wins.length,1,'O_EXCL must allow exactly one reservation');
  assert.equal(denied.length,1,'same sealed cohort cannot be evaluated twice');
  assert.deepEqual(denied[0].errors,['PRIVATE_LEDGER_ALREADY_RESERVED']);
  assert.equal(denied[0].canSendRestrictedHandoffToP71,false);
  assert.equal(wins[0].releaseApproval,false);
  assert.equal(wins[0].accuracyMeasured,false);
  assert.equal(wins[0].automaticSaveAllowed,false);
  const files=await readdir(dir);
  assert.equal(files.length,1,'only one private digest marker; no photos/labels');
  assert.match(files[0],/^consumed-[a-f0-9]{64}\.lock$/);
  const replay=await reserveBlindEvaluatorHandoff88(f.packet,{...f.trust,ledgerDir:dir});
  assert.equal(replay.status,'BLOCKED');
  assert.deepEqual(replay.errors,['PRIVATE_LEDGER_ALREADY_RESERVED']);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('P88 private reservation denies forged signatures before any marker and rejects unsafe ledgers',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'p88-private-deny-'));
 try{
  const f=privateP75P71Fixture88();
  const forged=structuredClone(f.packet);
  forged.sourceAudit.dualHumanReviewedCount=0;
  const denied=await reserveBlindEvaluatorHandoff88(forged,{...f.trust,ledgerDir:dir});
  assert.equal(denied.status,'BLOCKED');
  assert.equal(denied.oneTimePrivateReservationCreated,false);
  assert.deepEqual(await readdir(dir),[],'failed signatures cannot consume a cohort');
  const alias=join(dir,'ledger-symlink');
  const external=await mkdtemp(join(tmpdir(),'p88-private-safe-'));
  try{
   await symlink(external,alias,'dir');
   const aliasDenied=await reserveBlindEvaluatorHandoff88(f.packet,{
    ...f.trust,ledgerDir:alias
   });
   assert.equal(aliasDenied.status,'BLOCKED');
   assert.deepEqual(aliasDenied.errors,['PRIVATE_LEDGER_WRITE_OR_TRUST_FAILURE']);
   await chmod(external,0o755);
   const permissive=await reserveBlindEvaluatorHandoff88(f.packet,{
    ...f.trust,ledgerDir:external
   });
   assert.equal(permissive.status,'BLOCKED');
   assert.deepEqual(permissive.errors,['PRIVATE_LEDGER_WRITE_OR_TRUST_FAILURE']);
   assert.deepEqual(await readdir(external),[]);
  }finally{await rm(external,{recursive:true,force:true});}
  const valid=await reserveBlindEvaluatorHandoff88(f.packet,{...f.trust,ledgerDir:dir});
  assert.equal(valid.status,'SIGNED_CUSTODY_PREFLIGHT_ONLY');
  assert.equal(valid.oneTimePrivateReservationCreated,true);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('P88 private reserve CLI remains forbidden inside GitHub Actions',()=>{
 const result=spawnSync(process.execPath,[
  'research/mission1-parallel88/blind-evaluator-handoff-88.mjs',
  'reserve','/tmp/p88-private-should-never-be-read.json'
 ],{cwd:process.cwd(),env:{...process.env,GITHUB_ACTIONS:'true',CI:'true'},
  encoding:'utf8'});
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/PRIVATE_BLIND_HANDOFF_FORBIDDEN_IN_CI/);
 assert.equal(result.stdout,'');
});

test('P88 private-file and ledger trust anchors remain checkout-bound from an external working directory',async()=>{
 const outside=await mkdtemp(join(tmpdir(),'p88-other-working-dir-'));
 try{
  const moduleUrl=new URL('../research/mission1-parallel88/blind-evaluator-handoff-88.mjs',import.meta.url).href;
  const file=resolve('research/mission1-parallel88/blind-evaluator-handoff-88.mjs');
  const directory=resolve('research/mission1-parallel88');
  const program=`
   import {externalPrivateFile88,externalPrivateLedgerDirectory88} from ${JSON.stringify(moduleUrl)};
   for(const [name,fn,path,reason] of [
    ['file',externalPrivateFile88,${JSON.stringify(file)},'PRIVATE_CUSTODY_MUST_STAY_OUTSIDE_GIT'],
    ['ledger',externalPrivateLedgerDirectory88,${JSON.stringify(directory)},'PRIVATE_LEDGER_MUST_STAY_OUTSIDE_GIT']
   ]){
    try{await fn(path);throw new Error(name+'_ACCEPTED_REPOSITORY_PATH');}
    catch(e){if(e.message!==reason)throw e;}
   }
   console.log('P88_CROSS_CWD_TRUST_ANCHOR_PASS');
  `;
  const result=spawnSync(process.execPath,['--input-type=module','-e',program],{
   cwd:outside,encoding:'utf8',env:{...process.env}
  });
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/P88_CROSS_CWD_TRUST_ANCHOR_PASS/);
 }finally{await rm(outside,{recursive:true,force:true});}
});

test('P88 real Fashionpedia 46-class outputs cannot be claimed as fine subtype correctness',()=>{
 assert.equal(FASHION_MAIN_LABELS88.length,27);
 assert.equal(FASHION_MAIN_LABELS88[1],'top, t-shirt, sweatshirt');
 assert.equal(FASHION_MAIN_LABELS88[23],'shoe');
 assert.equal(FASHION_MAIN_LABELS88[0],'shirt, blouse');
 const cases=[
  ['t-shirt-vs-sweatshirt',1,'ONE_SHARED_TOP_TSHIRT_SWEATSHIRT_CATEGORY'],
  ['sneaker-vs-ankle-boot',23,'ONE_SHARED_SHOE_CATEGORY'],
  ['blouse-vs-tunic',0,'NO_EXPLICIT_TUNIC_LABEL_AND_SHIRT_BLOUSE_COMBINED']
 ];
 assert.equal(FASHION_FINE_SUBTYPE_GAPS88.length,cases.length);
 for(const [contrast,id,reason] of cases){
  const outcome=fashionFineSubtypeClaimGate88(contrast,1);
  assert.equal(outcome.status,'BLOCKED');
  assert.equal(outcome.reason,reason);
  assert.equal(outcome.broadCategoryId,id);
  assert.equal(outcome.broadCategoryLabel,FASHION_MAIN_LABELS88[id]);
  assert.equal(outcome.fineSubtypeAccuracyMeasured,false);
  assert.equal(outcome.productPromotionAllowed,false);
  assert.equal(outcome.automaticClosetSaveAllowed,false);
 }
 for(const [contrast,score] of [
  ['dress-vs-long-top',1],['sneaker-vs-ankle-boot',NaN],
  ['t-shirt-vs-sweatshirt',1.01],['blouse-vs-tunic',-0.2]
 ]){
  const denied=fashionFineSubtypeClaimGate88(contrast,score);
  assert.equal(denied.status,'BLOCKED');
  assert.equal(denied.fineSubtypeAccuracyMeasured,false);
  assert.equal(denied.productPromotionAllowed,false);
 }
});
