/** P879 exposed-public DEVELOPMENT-only candidate-risk audit. NEVER blind accuracy. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyPublicPhotoCustody878} from './p878-public-photo-custody.mjs';
import {sharedRankChoices82} from '../public/dual-panel-82.mjs';
import {subtypeNeedsManualReview} from '../public/recognition-confusion-guard.mjs';
const fail=reason=>{throw Error('P879_'+reason)};
const ok=(v,reason)=>{if(!v)fail(reason)};
function priorPolicy878(decision,observations){
 if(!Array.isArray(decision?.hypotheses)||!Array.isArray(decision?.reasons)||!Array.isArray(observations)||observations.length!==2)return [];
 if(decision.reasons.some(r=>['nonclothing_evidence','top_rank_tied','category_disagreement'].includes(r)))return [];
 const [a,b]=observations;
 if(a?.model?.family===b?.model?.family||!a?.model?.family||!b?.model?.family||
    !Array.isArray(a.ranking)||!Array.isArray(b.ranking))return [];
 const category=a.ranking[0]?.category;
 if(!category||category==='Uncategorized'||category!==b.ranking[0]?.category)return [];
 const inA=new Set(a.ranking.slice(0,5).map(x=>x.label)),inB=new Set(b.ranking.slice(0,5).map(x=>x.label));
 return decision.hypotheses.filter(h=>h.category===category&&inA.has(h.label)&&inB.has(h.label)&&!subtypeNeedsManualReview(h.category,h.itemType));
}
export function auditModelConflict879(data,receipts,manifest,{expectedRows=48}={}){
 const custody=verifyPublicPhotoCustody878(data,receipts,manifest,{expectedRows});
 ok(custody.summary.status==='VERIFIED_PUBLIC_DEVELOPMENT_ONLY'&&custody.summary.photos===expectedRows,'SOURCE_CUSTODY');
 const rows=data.rows.map(r=>{
  const old=priorPolicy878(r.decision,r.output.observations),current=sharedRankChoices82(r.decision,r.output.observations);
  const wasAbstain=r.decision.status==='abstain',disagree=r.decision.reasons.includes('subtype_disagreement');
  const oldLabels=new Set(old.map(x=>x.label)),nowLabels=new Set(current.map(x=>x.label));
  ok(current.every(x=>oldLabels.has(x.label)),'NO_NEW_AI_HINTS');
  const suppressed=old.filter(x=>!nowLabels.has(x.label));
  ok(!suppressed.length||wasAbstain,'ONLY_ABSTAIN_WITHHELD');
  ok(!disagree||current.length===0,'CONFLICT_SHORTCUT');
  ok(!wasAbstain||current.length===0,'ABSTAIN_SHORTCUT');
  ok(r.output.automaticAdmissions===0&&r.decision.admissionAllowed===false,'NO_AUTOSAVE');
  return {id:r.id,disagreement:disagree,previousShortcutCount:old.length,
   newShortcutCount:current.length,withheldShortcuts:suppressed.length,
   ownerSaveActions:0,independentlyCorrect:false};
 });
 const sum=(key)=>rows.reduce((n,x)=>n+x[key],0);
 const summary={schema:'mission1-disagreement-shortcut-879-development-only-v1',
  status:'PUBLIC_DEVELOPMENT_ONLY',photos:rows.length,sourceReceiptsVerified:custody.summary.photos,
  twoFamilySubtypeDisagreements:rows.filter(x=>x.disagreement).length,
  previousP878ActionableHints:sum('previousShortcutCount'),
  newP879ActionableHints:sum('newShortcutCount'),
  shortcutsWithheldForAbstention:sum('withheldShortcuts'),
  photosWithPreviousHints:rows.filter(x=>x.previousShortcutCount>0).length,
  photosWithCurrentHints:rows.filter(x=>x.newShortcutCount>0).length,
  noNewShortcuts:true,automaticAdmissions:0,
  independentHumanBlindSources:0,physicalDevices:0,recognitionAccuracy:null,
  modelPromoted:false,releaseReady:false,shouldLiftFamilyAlphaHold:false};
 ok(summary.previousP878ActionableHints-summary.newP879ActionableHints===summary.shortcutsWithheldForAbstention,'COVERAGE_ARITHMETIC');
 ok(rows.some(x=>x.id==='commons-0078'),'KNOWN_SNEAKER_PHOTO');
 return {summary,rows};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const input=process.argv[2]||'benchmark/p879-real-chromium/results.json';
 const output=process.argv[3]||'benchmark/p879-real-chromium/conflict-audit.json';
 const [data,receipts,reviewed,held]=await Promise.all([
 input,'benchmark/locked-photo-sources.json','benchmark/manifest-reviewed-32.json','benchmark/manifest-holdout-16.json'
 ].map(async p=>JSON.parse(await readFile(p,'utf8'))));
 const audit=auditModelConflict879(data,receipts,[...reviewed,...held]);
 await mkdir(dirname(output),{recursive:true});
 await writeFile(output,JSON.stringify(audit,null,2)+'\n');
 console.log('P879_REAL_PUBLIC_CONFLICT_RISK',JSON.stringify(audit.summary));
}
