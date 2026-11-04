import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
export const percent=(n,d)=>d?Math.round(10000*n/d)/100:null;
export const wilson=(n,d)=>{
 if(!d)return null;
 const z=1.96,p=n/d,den=1+z*z/d,m=(p+z*z/(2*d))/den,
 e=z*Math.sqrt(p*(1-p)/d+z*z/(4*d*d))/den;
 return [percent(m-e,1),percent(m+e,1)];
};
const unique=(arr,label)=>{assert.ok(Array.isArray(arr)&&arr.length,'Empty '+label);const m=new Map();for(const x of arr){assert.ok(x&&x.id,'Missing '+label+' id');assert.ok(!m.has(x.id),'Duplicate '+label+' '+x.id);m.set(x.id,x);}return m;};
const add=(o,t,p)=>{const r=o[t]??={};r[p]=(r[p]||0)+1;};
export function scoreCategory(labels,results,sources,mode){
 assert.ok(['recorded-historical','actual-unmocked-browser'].includes(mode),'Unidentified inference provenance');
 const truth=unique(labels,'category truth'),observed=unique(results,'classification output'),lock=unique(sources,'SHA lock');
 assert.equal(truth.size,16);assert.equal(observed.size,16);
 const totals={garments:0,negatives:0,correctCategory:0,correctSubtype:0,automatic:0,autoCorrectCategory:0,autoCorrectSubtype:0,wrongAutomaticSubtype:0,categoryReview:0,abstentions:0,negativeRejected:0,negativeFalsePositive:0,errors:0};
 const confusion={},subtypeConfusion={},byCategory={},perPhoto=[],errors=[];
 for(const [id,x] of truth){
  const r=observed.get(id),source=lock.get(id);assert.ok(r&&source?.verified&&source.image===x.image&&/^[0-9a-f]{64}$/.test(source.sha256),'Missing immutable photo '+id);
  assert.equal(x.verified,true);assert.ok(typeof r.strong==='boolean'&&typeof r.categoryConfirmed==='boolean'&&!(r.strong&&r.categoryConfirmed),'Invalid acceptance state '+id);
  const category=r.prediction?.category||'Abstain',subtype=r.prediction?.type||'Unknown',bad=Boolean(r.error),negative=x.expectedCategory==='Uncategorized';
  if(bad)totals.errors++;
  if(negative){totals.negatives++;const good=!bad&&!r.strong&&!r.categoryConfirmed&&['Uncategorized','Abstain'].includes(category);if(good)totals.negativeRejected++;else if(!bad){totals.negativeFalsePositive++;errors.push({id,problem:'negative-false-positive',actual:category});}perPhoto.push({id,negative:true,rejected:good,sourceSha256:source.sha256});continue;}
  totals.garments++;const match=category===x.expectedCategory,subMatch=match&&(x.acceptedTypes||[x.expectedType]).includes(subtype);
  totals.correctCategory+=Number(match);totals.correctSubtype+=Number(subMatch);
  add(confusion,x.expectedCategory,category);add(subtypeConfusion,x.expectedType,subtype);
  const by=byCategory[x.expectedCategory]??={total:0,correct:0,correctSubtype:0};by.total++;by.correct+=Number(match);by.correctSubtype+=Number(subMatch);
  if(bad)errors.push({id,problem:'worker-error'});
  else if(r.strong){totals.automatic++;totals.autoCorrectCategory+=Number(match);totals.autoCorrectSubtype+=Number(subMatch);if(!subMatch){totals.wrongAutomaticSubtype++;errors.push({id,problem:'unsafe-automatic-subtype',expected:x.expectedType,actual:subtype});}}
  else if(r.categoryConfirmed)totals.categoryReview++;else totals.abstentions++;
  if(!match&&!bad)errors.push({id,problem:'wrong-category',expected:x.expectedCategory,actual:category});
  perPhoto.push({id,negative:false,groundTruth:x.expectedCategory+'/'+x.expectedType,predicted:category+'/'+subtype,categoryCorrect:match,subtypeCorrect:subMatch,accepted:r.strong,categoryReview:r.categoryConfirmed,modelConfidence:null,sourceSha256:source.sha256});
 }
 assert.deepEqual([totals.garments,totals.negatives],[13,3]);
 return {mode,totals,confusion,subtypeConfusion,byCategory,perPhoto,errors,
  categoryAccuracyPercent:percent(totals.correctCategory,13),categoryWilson95:wilson(totals.correctCategory,13),
  subtypeAccuracyPercent:percent(totals.correctSubtype,13),
  autoSubtypePrecisionPercent:percent(totals.autoCorrectSubtype,totals.automatic),
  autoCoveragePercent:percent(totals.automatic,13),autoSubtypeWilson95:wilson(totals.autoCorrectSubtype,totals.automatic),
  scientificPass:false,groundTruth:"inherited visual labels without two independent blind adjudicators"};
}
export function scoreColor(truthRows,modelRows,arm){
 assert.ok(['baseline','candidate'].includes(arm));const truth=unique(truthRows,'color truth'),pred=unique(modelRows,'color predictions');
 assert.equal(truth.size,pred.size);const confusion={},byColor={},bySplit={},errors=[],perPhoto=[];
 let correct=0,auto=0,autoCorrect=0;
 for(const [id,t] of truth){
  const r=pred.get(id);assert.ok(r,'Missing color '+id);assert.equal(r.expected,t.color,'Retargeted color '+id);assert.equal(r.split,t.split,'Changed split '+id);
  const guess=r[arm]||'Unknown',accepted=r[arm+'Auto'];assert.equal(typeof accepted,'boolean');if(arm==='candidate')assert.equal(accepted,false,'Candidate is review only');
  const good=guess===t.color;correct+=Number(good);auto+=Number(accepted);autoCorrect+=Number(accepted&&good);
  add(confusion,t.color,guess);const c=byColor[t.color]??={total:0,correct:0};c.total++;c.correct+=Number(good);
  const s=bySplit[t.split]??={total:0,correct:0,accepted:0,correctAccepted:0};s.total++;s.correct+=Number(good);s.accepted+=Number(accepted);s.correctAccepted+=Number(accepted&&good);
  if(!good)errors.push({id,problem:accepted?'wrong-automatic-color':'wrong-review-color',expected:t.color,actual:guess});
  perPhoto.push({id,truth:t.color,predicted:guess,accepted,correct:good,sourceSha256:t.sha256,groundTruthStatus:t.annotationStatus});
 }
 return {arm,n:truth.size,correct,accuracyPercent:percent(correct,truth.size),wilson95:wilson(correct,truth.size),automaticAccepted:auto,automaticCorrect:autoCorrect,automaticPrecisionPercent:percent(autoCorrect,auto),automaticCoveragePercent:percent(auto,truth.size),confusion,byColor,bySplit,errors,perPhoto,groundTruth:"provisional, zero independent reviewer certification",scientificPass:false};
}
export function auditDataset(rows){
 const ids=unique(rows,'distinct photograph manifest'),shas=new Set(),gaps=[];
 let categoryLabels=0,colorLabels=0,adjudicated=0;
 for(const p of ids.values()){
  assert.ok(/^[0-9a-f]{64}$/.test(p.sha256),'Bad source SHA '+p.id);
  assert.ok(!shas.has(p.sha256),'Identical image double-counted '+p.id);shas.add(p.sha256);
  if(p.category)categoryLabels++;if(p.primaryColor)colorLabels++;if(p.adjudicated)adjudicated++;
  if(!p.sourcePage||!p.author||!p.license||!p.licenseUrl)gaps.push(p.id);
 }
 return {uniquePhotographIDs:ids.size,categoryLabels,colorLabels,independentlyAdjudicated:adjudicated,licensingMetadataGaps:gaps,certification:false};
}
const load=async p=>JSON.parse(await readFile(p,'utf8'));
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [colorPath,categoryPath,mode,output]=process.argv.slice(2);
 assert.ok(colorPath&&categoryPath&&mode&&output,'Usage: score.mjs WORK31_COLOR_JSON CLASSIFIER_JSON recorded-historical|actual-unmocked-browser OUT');
 const dataset=await load(new URL('./dataset-manifest.json',import.meta.url)), colorTruth=await load(new URL('../recognition-category-color-39/color-manifest.json',import.meta.url));
 const classificationTruth=await load('benchmark/manifest-holdout-16.json'),locks=await load('benchmark/locked-photo-sources.json'),paired=await load(colorPath),raw=await load(categoryPath);
 const category=scoreCategory(classificationTruth,Array.isArray(raw)?raw:raw.results,locks,mode),baseline=scoreColor(colorTruth,paired.rows,'baseline'),candidate=scoreColor(colorTruth,paired.rows,'candidate');
 const summary={research:'INDEPENDENT-RECOGNITION-ACCEPTANCE-40',dataset:auditDataset(dataset),category,colors:{baseline,candidate,pointDelta:candidate.accuracyPercent-baseline.accuracyPercent},Work31CandidateAutoCoverage:0,classificationRegionMatch:'NOT_MEASURED',fullRealClassificationToIndexedDb:'NOT_MEASURED',physicalPhones:'UNVERIFIED',familyAlpha:'HOLD',scientificVerdict:'NEEDS REWORK'};
 await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(summary,null,2));
 console.log(JSON.stringify({mode,photos:summary.dataset.uniquePhotographIDs,categoryAccuracy:category.categoryAccuracyPercent,autoSubtypePrecision:category.autoSubtypePrecisionPercent,autoCoverage:category.autoCoveragePercent,colorBaseline:baseline.accuracyPercent,colorCandidate:candidate.accuracyPercent,scientificVerdict:summary.scientificVerdict}));
}
