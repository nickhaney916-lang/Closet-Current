/** Mission 1 P880: real q8 48-photo DEVELOPMENT shortcut coverage, NOT accuracy. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyPublicPhotoCustody878} from './p878-public-photo-custody.mjs';
import {sharedRankChoices82} from '../public/dual-panel-82.mjs';
import {subtypeNeedsManualReview} from '../public/recognition-confusion-guard.mjs';
const require880=(x,reason)=>{if(!x)throw Error('P880_'+reason)};
/** Locked P879 implementation; this is a historical control, not a second UI. */
export function frozenPreviousChoices879(decision,observations){
 if(!Array.isArray(decision?.hypotheses)||!Array.isArray(decision?.reasons)||
   !Array.isArray(observations)||observations.length!==2||
   decision.status!=='cross_family_hypothesis'||decision.reasons.length!==0)return [];
 const [a,b]=observations;
 if(!a?.model?.family||!b?.model?.family||a.model.family===b.model.family||
   !Array.isArray(a.ranking)||!Array.isArray(b.ranking))return [];
 const top=a.ranking[0],other=b.ranking[0];
 if(!top?.label||top.label!==other?.label||top.category!==other.category||
    !top.category||top.category==='Uncategorized')return [];
 const left=new Set(a.ranking.slice(0,5).map(x=>x.label));
 const right=new Set(b.ranking.slice(0,5).map(x=>x.label));
 return decision.hypotheses.filter(h=>h.category===top.category&&
    left.has(h.label)&&right.has(h.label)&&!subtypeNeedsManualReview(h.category,h.itemType));
}
export function auditExactTop880(data,receipts,manifest,{expectedRows=48}={}){
 const custody=verifyPublicPhotoCustody878(data,receipts,manifest,{expectedRows});
 require880(custody.summary.status==='VERIFIED_PUBLIC_DEVELOPMENT_ONLY'&&
   custody.summary.photos===expectedRows,'ORIGINAL_JPEG_AND_MODEL_CUSTODY');
 const rows=data.rows.map(r=>{
  const observations=r.output.observations,decision=r.decision;
  const previous=frozenPreviousChoices879(decision,observations);
  const current=sharedRankChoices82(decision,observations);
  const prevLabels=new Set(previous.map(x=>x.label)),top=observations[0].ranking[0];
  require880(current.length<=1,'AT_MOST_ONE_SHORTCUT');
  require880(current.every(x=>x.label===top.label&&
    x.label===observations[1].ranking[0].label&&prevLabels.has(x.label)),'ONLY_PREVIOUS_JOINT_TOP');
  require880(decision.status!=='abstain'||current.length===0,'NO_ABSTAIN_SHORTCUT');
  require880(!subtypeNeedsManualReview(top.category,top.itemType)||current.length===0,'RISKY_TOP');
  require880(r.output.automaticAdmissions===0&&decision.admissionAllowed===false,'ZERO_AUTOSAVE');
  return {id:r.id,previousP879Choices:previous.length,newP880Choices:current.length,
   lowerRankOrRiskShortcutsWithheld:previous.length-current.length,
   hadJointAgreedTop:top.label===observations[1].ranking[0].label,
   blockedKnownRisk:subtypeNeedsManualReview(top.category,top.itemType)};
 });
 const total=key=>rows.reduce((sum,row)=>sum+row[key],0);
 const summary={schema:'mission1-single-top-choice-880-public-development-v1',
  status:'VERIFIED_PUBLIC_DEVELOPMENT_ONLY',photos:rows.length,
  verifiedPublicOriginals:custody.summary.photos,
  previousP879Choices:total('previousP879Choices'),
  newP880Choices:total('newP880Choices'),
  lowerRankOrRiskShortcutsWithheld:total('lowerRankOrRiskShortcutsWithheld'),
  photosWithAnyPreviousChoice:rows.filter(x=>x.previousP879Choices>0).length,
  photosWithOneCurrentChoice:rows.filter(x=>x.newP880Choices===1).length,
  noNewOrUnilateralOptions:true,automaticAdmissions:0,modelPromoted:false,
  independentHumanBlindSources:0,physicalDevicePlatforms:0,
  recognitionAccuracy:null,releaseReady:false,shouldLiftFamilyAlphaHold:false};
 require880(summary.previousP879Choices-summary.newP880Choices===
   summary.lowerRankOrRiskShortcutsWithheld,'EXACT_ARITHMETIC');
 require880(summary.previousP879Choices===80,'KNOWN_P879_BASELINE_48');
 require880(rows.some(x=>x.id==='commons-0078'),'KNOWN_SNEAKER_SOURCE_PRESERVED');
 return {summary,rows};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const input=process.argv[2]||'benchmark/p880-real-chromium/results.json',
  output=process.argv[3]||'benchmark/p880-real-chromium/top-one-risk-audit.json';
 const [data,receipts,reviewed,holdout]=await Promise.all([
  input,'benchmark/locked-photo-sources.json','benchmark/manifest-reviewed-32.json','benchmark/manifest-holdout-16.json'
 ].map(async p=>JSON.parse(await readFile(p,'utf8'))));
 const audit=auditExactTop880(data,receipts,[...reviewed,...holdout]);
 await mkdir(dirname(output),{recursive:true});
 await writeFile(output,JSON.stringify(audit,null,2)+'\n');
 console.log('P880_PUBLIC_EXACT_TOP_RISK',JSON.stringify(audit.summary));
}
