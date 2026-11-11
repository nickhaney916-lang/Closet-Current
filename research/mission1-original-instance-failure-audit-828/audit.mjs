/**
 * Mission 1 P828 — research-only actual original source error attribution.
 * Accepts the SHA-pinned numerical P827 artifact, NOT original JPEG bytes.
 * Never trains, modifies model thresholds, invents new human truth, or auto-saves.
 */
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export const P828_PROFILES=Object.freeze([
 'native-70-15','exploratory-65-12','exploratory-60-10',
 'exploratory-55-08','strict-80-20'
]);
export const P828_PINNED_P827=Object.freeze({
 runId:43078347613,head:'37f15715fc32fef6922c3beb42089b8bebe2c6c5',
 model:'Xenova/segformer_b0_clothes',
 revision:'a2489ea8e7ec1ee912190546bad31a4906ccca76',
 sha256:Object.freeze({
  manifest:'3d42126f8a2af5518c4141199078c375ccec4825ff56802a34956f59ac77db48',
  chromium:'8ccf93cf6175a00e4e12eaf2d9ee127799221360a7070d0ec66d68bfc979716d',
  webkit:'20bbf6e5e50c4f7b0fa8536b2d3f92015d7e94471c2214b8e19ec99550b39e3d'
 })
});
const PUBLISHER_TO_FAMILY=Object.freeze({
 0:4,1:4,2:4,3:4,4:4,5:4,6:6,7:6,8:5,9:4,10:7,23:9
});
const FAMILY_NAME=Object.freeze({4:'Upper garments',5:'Skirts',6:'Bottoms',7:'Dresses',9:'Footwear'});
const fail=reason=>{throw Error('M1_P828_FAIL_CLOSED: '+reason);};
const sha256=data=>createHash('sha256').update(data).digest('hex');
const exact=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const ids=a=>new Set(a);
const distinct=a=>ids(a).size===a.length;
const integer=x=>Number.isSafeInteger(x)&&x>=0;

function checkMetrics(metrics,truth,sourceId,profile){
 if(!metrics||!Array.isArray(metrics.matches)||!Array.isArray(metrics.missedTruthIds)||
    !Array.isArray(metrics.unmatchedPredictionIds))fail('incomplete instance rows '+sourceId+'/'+profile);
 const n=truth.size,p=metrics.predictedInstances;
 const matches=metrics.matches;
 if(metrics.truthInstances!==n||!integer(p)||p>128||
    !integer(metrics.truePositives)||!integer(metrics.falsePositives)||
    !integer(metrics.falseNegatives)||metrics.truePositives!==matches.length||
    metrics.falsePositives!==p-matches.length||
    metrics.falseNegatives!==n-matches.length||
    metrics.missedTruthIds.length!==metrics.falseNegatives||
    metrics.unmatchedPredictionIds.length!==metrics.falsePositives)
  fail('TP FP FN conservation '+sourceId+'/'+profile);
 const mTruth=matches.map(x=>x.truthId),mPred=matches.map(x=>x.predictionId);
 if(!distinct(mTruth)||!distinct(mPred)||!distinct(metrics.missedTruthIds)||
    !distinct(metrics.unmatchedPredictionIds))fail('reused truth or prediction '+sourceId+'/'+profile);
 for(const match of matches){
  if(!truth.has(match.truthId)||truth.get(match.truthId)!==match.region||
     !Number.isFinite(match.iou)||match.iou<.5||match.iou>1)
   fail('false or wrong-family IoU match '+sourceId+'/'+profile);
 }
 if(!exact([...truth.keys()].filter(x=>!mTruth.includes(x)).sort(),
   [...metrics.missedTruthIds].sort()))
  fail('silent dropped original annotation '+sourceId+'/'+profile);
 if(mPred.some(x=>metrics.unmatchedPredictionIds.includes(x)))
  fail('prediction is TP and FP at once '+sourceId+'/'+profile);
 const tp=matches.length,fp=p-tp,fn=n-tp;
 const precision=p?tp/p:null,recall=n?tp/n:null;
 const f1=2*tp+fp+fn?2*tp/(2*tp+fp+fn):null;
 for(const [key,value] of Object.entries({precision,recall,f1})){
  if(value===null?metrics[key]!==null:
      !Number.isFinite(metrics[key])||Math.abs(metrics[key]-value)>1e-10)
   fail('unverified '+key+' '+sourceId+'/'+profile);
 }
 return {tp,fp,fn,matched:mTruth};
}
function validateManifest(manifest){
 if(manifest?.schema!=='m1-p792-additional-publisher-originals-research-not-holdout/v1'||
    manifest.releaseAuthorized!==false||manifest.familyAlpha!=='HOLD'||
    manifest.blindHumanReviewIndependentlyVerified!==false||
    manifest.publisherAnnotatedImageRightsIndependentlyCleared!==false||
    manifest.trainingCorpusOverlapIndependentlyExcluded!==false||
    !Array.isArray(manifest.rows)||manifest.rows.length!==10)
  fail('not immutable research-only exposed original source cohort');
 const byId=new Map(),truth=new Map(),all=new Set();
 for(const row of manifest.rows){
  if(!integer(row.id)||byId.has(row.id)||
     !/^[a-f0-9]{64}$/.test(row.sha256||'')||
     !Array.isArray(row.annotations)||!row.annotations.length||
     !['single','multi'].includes(row.sourceSelectionStratum)||
     (row.sourceSelectionStratum==='single')!==(row.annotations.length===1)||
     !integer(row.width)||!integer(row.height)||row.width<1||row.height<1)
   fail('source identity or selection census');
  const annotations=new Map();
  for(const a of row.annotations){
   if(!integer(a.id)||!Object.hasOwn(PUBLISHER_TO_FAMILY,a.category_id)||
      !Array.isArray(a.segmentation)||a.segmentation.length===0)
    fail('publisher source annotated category/polygon missing');
   const id='annotation-'+a.id;
   if(all.has(id))fail('annotation reused across original photos');
   all.add(id);annotations.set(id,PUBLISHER_TO_FAMILY[a.category_id]);
  }
  if(annotations.size!==row.annotations.length)fail('duplicate polygon annotation');
  byId.set(row.id,row);truth.set(row.id,annotations);
 }
 if(all.size!==23||new Set(manifest.rows.map(x=>x.sha256)).size!==10)
  fail('expected complete 10 source/23 original polygons');
 return {byId,truth,all};
}
function validateBrowser(run,engine,manifest){
 if(run?.engine!==engine||run.frozenRealB0ThresholdSweep821!==true||
    run.photos!==10||run.publisherHumanInstances!==23||
    run.newlyEnrolledBlindedHumanHoldout!==false||
    run.releaseAuthorized!==false||run.familyAlpha!=='HOLD'||
    run.exactAppSubtypeAccuracy!==null||run.primaryColorAccuracy!==null||
    run.summary?.thresholdAutoPromoteAllowed!==false||
    run.summary?.thresholdOriginalHumanMaskReviewers!==0||
    !Array.isArray(run.rows)||run.rows.length!==10||
    !exact(Object.keys(run.summary.thresholdSourceScores821),P828_PROFILES))
  fail('original model provenance and no promotion contract '+engine);
 const byId=new Map(),profileMatches=Object.fromEntries(P828_PROFILES.map(p=>[p,new Set()]));
 const rollup=Object.fromEntries(P828_PROFILES.map(p=>[p,{truePositives:0,falsePositives:0,falseNegatives:0}]));
 for(const row of run.rows){
  if(!manifest.byId.has(row.id)||byId.has(row.id)||
     row.sourceSHA256!==manifest.byId.get(row.id).sha256||
     row.model!==P828_PINNED_P827.model||
     row.revision!==P828_PINNED_P827.revision||
     row.publisherHumanInstances!==manifest.truth.get(row.id).size||
     !row.thresholdMetrics821||!exact(Object.keys(row.thresholdMetrics821),P828_PROFILES))
   fail('changed original, model, or omitted score '+engine+'/'+row.id);
  const scoring={};
  for(const profile of P828_PROFILES){
   const result=checkMetrics(row.thresholdMetrics821[profile],manifest.truth.get(row.id),row.id,profile);
   scoring[profile]=result;
   for(const key of ['truePositives','falsePositives','falseNegatives'])
    rollup[profile][key]+=result[{truePositives:'tp',falsePositives:'fp',falseNegatives:'fn'}[key]];
   for(const truthId of result.matched)profileMatches[profile].add(truthId);
  }
  byId.set(row.id,{row,scoring});
 }
 for(const profile of P828_PROFILES){
  const actual=run.summary.thresholdSourceScores821[profile];
  for(const key of ['truePositives','falsePositives','falseNegatives'])
   if(actual[key]!==rollup[profile][key])fail('aggregate miscounts '+engine+'/'+profile);
  if(rollup[profile].truePositives+rollup[profile].falseNegatives!==23)
   fail('omitted publisher original instance '+engine+'/'+profile);
 }
 return {byId,profileMatches,rollup};
}
export function auditOriginalSourceErrors828(manifest,chromium,webkit){
 const m=validateManifest(manifest);
 const c=validateBrowser(chromium,'chromium',m),w=validateBrowser(webkit,'webkit',m);
 const total=[...m.all].sort();
 const byRegion=Object.entries(FAMILY_NAME).map(([code,label])=>{
  const region=Number(code);
  const truths=total.filter(id=>[...m.truth.values()].some(t=>t.get(id)===region));
  return {region,label,truth:truths.length,
   chromiumMatched:truths.filter(id=>c.profileMatches['native-70-15'].has(id)).length,
   webkitMatched:truths.filter(id=>w.profileMatches['native-70-15'].has(id)).length};
 });
 const cm=c.profileMatches['native-70-15'],wm=w.profileMatches['native-70-15'];
 const persistent=total.filter(id=>!cm.has(id)&&!wm.has(id));
 const onlyChromium=total.filter(id=>cm.has(id)&&!wm.has(id));
 const onlyWebkit=total.filter(id=>!cm.has(id)&&wm.has(id));
 const byPhoto=manifest.rows.map(src=>{
  const cr=c.byId.get(src.id),wr=w.byId.get(src.id);
  return {id:src.id,sourceStratum:src.sourceSelectionStratum,
   truth:src.annotations.length,
   chromium:cr.scoring['native-70-15'].tp,webkit:wr.scoring['native-70-15'].tp,
   persistentMissed:cr.row.thresholdMetrics821['native-70-15'].missedTruthIds
    .filter(id=>wr.row.thresholdMetrics821['native-70-15'].missedTruthIds.includes(id)).length};
 });
 const profiles=P828_PROFILES.map(profile=>({
  name:profile,
  chromium:{...c.rollup[profile],gainAgainstNative:[...c.profileMatches[profile]].filter(id=>!cm.has(id)).length,
   lossAgainstNative:[...cm].filter(id=>!c.profileMatches[profile].has(id)).length},
  webkit:{...w.rollup[profile],gainAgainstNative:[...w.profileMatches[profile]].filter(id=>!wm.has(id)).length,
   lossAgainstNative:[...wm].filter(id=>!w.profileMatches[profile].has(id)).length}
 }));
 const summary={photos:10,publisherOriginalInstances:23,
  persistentMissedInBoth:persistent.length,
  matchedBoth:[...cm].filter(id=>wm.has(id)).length,
  chromiumOnlyMatched:onlyChromium.length,
  webkitOnlyMatched:onlyWebkit.length,
  singleSourceInstances:byPhoto.filter(x=>x.sourceStratum==='single').reduce((n,x)=>n+x.truth,0),
  singleSourceMatchedChromium:byPhoto.filter(x=>x.sourceStratum==='single').reduce((n,x)=>n+x.chromium,0),
  singleSourceMatchedWebkit:byPhoto.filter(x=>x.sourceStratum==='single').reduce((n,x)=>n+x.webkit,0)};
 return {schema:'m1-p828-exposed-original-family-error-audit/v1',
  model:P828_PINNED_P827.model,revision:P828_PINNED_P827.revision,
  sourceRunId:P828_PINNED_P827.runId,sourceHead:P828_PINNED_P827.head,
  releaseAuthorized:false,familyAlpha:'HOLD',independentBlindedHumanAcceptance:false,
  automaticThresholdPromotionAllowed:false,summary,byRegion,byPhoto,profiles,
  persistentMissedOriginalAnnotationIds:persistent,
  chromiumOnlyMatchedOriginalAnnotationIds:onlyChromium,
  webkitOnlyMatchedOriginalAnnotationIds:onlyWebkit};
}
export function auditPinnedP827Files828(files){
 if(!files||typeof files!=='object')fail('missing pinned numeric-only artifact');
 const data={};
 for(const type of ['manifest','chromium','webkit']){
  const bytes=files[type];
  if(!Buffer.isBuffer(bytes)||sha256(bytes)!==P828_PINNED_P827.sha256[type])
   fail('unverified exact real model artifact SHA: '+type);
  data[type]=JSON.parse(bytes.toString('utf8'));
 }
 return auditOriginalSourceErrors828(data.manifest,data.chromium,data.webkit);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv.length!==6)fail('Usage: node audit.mjs manifest.json chromium-results.json webkit-results.json out.json');
 const receipts=auditPinnedP827Files828({
  manifest:readFileSync(process.argv[2]),chromium:readFileSync(process.argv[3]),
  webkit:readFileSync(process.argv[4])
 });
 writeFileSync(process.argv[5],JSON.stringify(receipts,null,2)+'\n');
 console.log('M1_P828_SHA_VERIFIED_ALL_23_MODEL_PUBLISHER_INSTANCE_FAILURES',
  JSON.stringify({summary:receipts.summary,byRegion:receipts.byRegion,profiles:receipts.profiles}));
}
