/** Mission 1 P878: strict public-development photo/model custody, NOT an accuracy measurement.
 * This audit never opens a wardrobe or upgrades known, exposed labels to blind truth.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {MODELS81} from '../public/model-arbitration-81.mjs';
import {MODEL_ASSETS82,VERSION82} from '../public/dual-core-82.mjs';
import {localCandidates} from '../public/local-catalog.mjs';
import {analyzeFrame877} from './p877-siglip-full-frame-audit.mjs';

const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const bindingKeys=['sourceSha256','inputSha256','ownerSession','photoRevision','cropRevision','maskRevision','unitRevision','instanceId'];
const fail=(reason)=>{throw Error('P878_'+reason)};
const require878=(ok,reason)=>{if(!ok)fail(reason)};
const known=new Map(localCandidates.map(c=>[c.label,c]));
const permitted=new Set(['CC0','Public domain','CC BY 2.0','CC BY 4.0','CC BY-SA 2.0','CC BY-SA 3.0','CC BY-SA 4.0']);
function sameBinding(a,b){
 return !!a&&!!b&&bindingKeys.every(k=>typeof a[k]==='string'&&a[k].length>0&&a[k]===b[k]);
}
function completeRank(rank){
 require878(Array.isArray(rank)&&rank.length===known.size,'RANK_LENGTH');
 const used=new Set();
 for(let i=0;i<rank.length;i++){
  const x=rank[i],ref=known.get(x?.label);
  require878(!!ref&&!used.has(x.label)&&x.category===ref.category&&x.itemType===ref.itemType&&Number.isFinite(x.score),'RANK_SOURCE');
  require878(i===0||rank[i-1].score>=x.score,'RANK_ORDER');
  used.add(x.label);
 }
}
export function verifyPublicPhotoCustody878(data,receipts,{expectedRows=48}={}){
 const sum=data?.summary;
 require878(sum?.status==='PUBLIC_DEVELOPMENT_ONLY'&&sum.blindAccuracy===null&&sum.physicalDevices===0&&sum.independentlyHumanReviewedPhotos===0,'RESEARCH_ONLY');
 require878(sum.automaticAdmissions===0&&sum.nonGetOrExternalRequests===0&&sum.isolation==='one-browser-continuous-'+expectedRows+'-one-shot-workers','SESSION_POLICY');
 require878(Array.isArray(data.rows)&&data.rows.length===expectedRows&&sum.photos===expectedRows,'ROW_COUNT');
 require878(Array.isArray(receipts),'RECEIPTS_REQUIRED');
 const ledger=new Map();
 for(const s of receipts){
  require878(typeof s?.id==='string'&&typeof s.image==='string'&&sha(s.sha256)&&s.verified===true&&!ledger.has(s.id),'SOURCE_LEDGER');
  require878(permitted.has(s.attribution?.license)&&s.attribution.source?.startsWith('https://commons.wikimedia.org/wiki/File:'),'SOURCE_LICENSE');
  ledger.set(s.id,s);
 }
 const ids=new Set(),digestSet=new Set(),requests=new Set(),rows=[];
 for(const row of data.rows){
  const source=ledger.get(row?.id),out=row?.output,d=row?.decision;
  require878(!!source&&row?.sourceSha256===source.sha256&&sha(row.sourceSha256)&&!ids.has(row.id),'PHOTO_RECEIPT');
  require878(!digestSet.has(row.sourceSha256),'DUPLICATE_PHOTO_DIGEST');
  ids.add(row.id);digestSet.add(row.sourceSha256);
  require878(out?.schema===VERSION82&&sha(out.sourceCodeSha256)&&out.automaticAdmissions===0&&Number.isFinite(out.createdAt)&&typeof out.requestId==='string'&&!requests.has(out.requestId),'MODEL_REQUEST');
  requests.add(out.requestId);
  require878(JSON.stringify(out.assets)===JSON.stringify(MODEL_ASSETS82),'ASSET_LOCK');
  require878(Array.isArray(out.observations)&&out.observations.length===2,'TWO_FAMILIES');
  const obs=new Map();
  for(const o of out.observations){
   const pin=MODELS81[o?.modelKey],asset=MODEL_ASSETS82[o?.modelKey];
   require878(!!pin&&!!asset&&!obs.has(o.modelKey)&&Object.keys(pin).every(k=>o.model?.[k]===pin[k]),'MODEL_REVISION');
   require878(o.workerSourceSha256===out.sourceCodeSha256&&o.vectorSha256===asset.vectorsSha256,'MODEL_HASH');
   require878(o.binding?.sourceSha256===source.sha256&&o.binding?.inputSha256===source.sha256,'ORIGINAL_INPUT_BINDING');
   require878(Number.isFinite(o.latencyMs)&&o.latencyMs>=0,'MODEL_TIMING');
   completeRank(o.ranking);obs.set(o.modelKey,o);
  }
  const clip=obs.get('fashionclip'),sig=obs.get('fashionSiglip');
  require878(!!clip&&!!sig&&sameBinding(clip.binding,sig.binding),'CROSS_MODEL_BINDING');
  require878(d?.requiresOwnerConfirmation===true&&d.automaticallyCertified===false&&d.admissionAllowed===false&&d.itemType==='Unknown'&&sameBinding(d.binding,sig.binding),'NO_OWNER_APPROVAL');
  const alt=out.experiment877;
  require878(alt?.schema==='p877-optional-full-frame-v1'&&alt.modelKey==='fashionSiglip'&&alt.mode==='fitWholePhoto224-white'&&alt.sameModelNotIndependent===true,'ALT_IDENTITY');
  require878(alt.sourceCodeSha256===out.sourceCodeSha256&&alt.vectorSha256===sig.vectorSha256&&alt.inputSha256===source.sha256,'ALT_INPUT_BINDING');
  require878(Number.isFinite(alt.extraMs)&&alt.extraMs>=0,'ALT_TIMING');
  completeRank(alt.ranking);
  rows.push({id:row.id,sourceSha256:source.sha256,requestId:out.requestId,originalInputVerified:true,bothPinnedModelsVerified:true,sameModelAlternativeOnly:true,automaticAdmissions:0});
 }
 require878(ids.size===expectedRows&&digestSet.size===expectedRows&&requests.size===expectedRows,'ONE_TO_ONE_CUSTODY');
 const report={schema:'mission1-public-photo-custody-878-v1',status:'VERIFIED_PUBLIC_DEVELOPMENT_ONLY',
  photos:rows.length,distinctPhotoDigests:digestSet.size,distinctModelRequests:requests.size,
  independentlyHumanBlindSources:0,physicalDevices:0,blindAccuracy:null,releaseReady:false,modelPromoted:false,
  automaticallySavedGarments:0,holdIssue:255};
 return {summary:report,rows};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const input=process.argv[2]||'benchmark/p878-real-chromium/results.json';
 const locked=process.argv[3]||'benchmark/locked-photo-sources.json';
 const out=process.argv[4]||'benchmark/p878-real-chromium/custody-audit.json';
 const [data,receipts]=await Promise.all([input,locked].map(async p=>JSON.parse(await readFile(p,'utf8'))));
 const report=verifyPublicPhotoCustody878(data,receipts);
 // The legacy P877 metric is retained, not turned into independent blind accuracy.
 const prior=analyzeFrame877(data);
 require878(prior.summary.modelPromoted===false&&prior.summary.blindAccuracy===null,'NO_PROMOTION');
 await mkdir(dirname(out),{recursive:true});
 await writeFile(out,JSON.stringify(report,null,2)+'\n');
 console.log('P878_PUBLIC_CUSTODY',JSON.stringify(report.summary));
}
