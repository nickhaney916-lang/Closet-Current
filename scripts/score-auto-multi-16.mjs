/**
 * AUTO-MULTI-DIVERSITY-16: strict independent class-compatible BOX evidence.
 * The frozen 15 region annotations are assistant-reviewed, NOT confirmed by an
 * independent human annotator. They do not constitute mask ground truth.
 * Do not equate browser repeat observations to additional unique photographs.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const SHA=/^[a-f0-9]{64}$/;
const ALLOWED=new Set(['upper','bottom','dress','shoes','hat','sunglasses','belt','bag','scarf','unsupported']);
const FAMILY={1:'hat',3:'sunglasses',4:'upper',5:'bottom',6:'bottom',7:'dress',8:'belt',9:'shoes',16:'bag',17:'scarf'};
const percent=(n,d)=>d?+(100*n/d).toFixed(2):null;
const round=n=>+n.toFixed(4);
function demand(ok,why){if(!ok)throw Error('AUTO-MULTI-16 '+why);}
export function validBox16(b){return !!b&&['x','y','width','height'].every(k=>Number.isFinite(b[k]))&&
 b.x>=0&&b.y>=0&&b.width>0&&b.height>0&&b.x+b.width<=1.00001&&b.y+b.height<=1.00001;}
export function boxIoU16(a,b){
 demand(validBox16(a)&&validBox16(b),'invalid box geometry');
 const w=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)),
  h=Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
 const intersection=w*h,union=a.width*a.height+b.width*b.height-intersection;
 return union?Math.min(1,Math.max(0,intersection/union)):0;
}
function distinct(rows,label){
 demand(Array.isArray(rows)&&rows.length>0,label+' empty');
 const out=new Map();for(const row of rows){
  demand(row&&typeof row.id==='string'&&!out.has(row.id),label+' invalid or duplicate ID');out.set(row.id,row);
 }return out;
}
export function detectionUnits16(proposals,{splitShoePairs=false}={}){
 demand(Array.isArray(proposals)&&proposals.length<=40,'invalid proposal population');
 const units=[];
 for(const [index,p] of proposals.entries()){
  demand(Number.isInteger(p.regionId)&&FAMILY[p.regionId]&&validBox16(p.box)&&
   Number.isFinite(p.confidence)&&p.confidence>=0&&p.confidence<=1&&p.needsReview===true,
   'invalid unverified model proposal');
  const sub=p.shoePartBoxes||[];
  demand(Array.isArray(sub)&&sub.length<=4&&sub.every(validBox16),'invalid shoe part geometry');
  // Evaluate two visually distinct shoes as two localized detections, but
  // treat them as ONE wardrobe review item; never fabricate shoe ownership.
  const boxes=splitShoePairs&&p.regionId===9&&sub.length===2?sub:[p.box];
  for(const [part,b] of boxes.entries())units.push({
   family:FAMILY[p.regionId],box:b,root:index,part,
   category:p.label,confidence:p.confidence});
 }
 return units;
}
export function matchBoxes16(expected,proposals,threshold=.3){
 demand(Array.isArray(expected)&&expected.every(e=>ALLOWED.has(e.family)&&validBox16(e.box)),
  'invalid unreviewed expected boxes');
 demand(Array.isArray(proposals)&&proposals.every(p=>validBox16(p.box)&&p.family),
  'invalid model boxes');
 demand(Number.isFinite(threshold)&&threshold>0&&threshold<=1,'invalid threshold');
 const rows=expected.filter(x=>x.family!=='unsupported');
 // Maximum CARDINALITY class-compatible bipartite matching. Never match a
 // garment with a background/skin label or a different clothing class.
 const edges=rows.map(x=>proposals.map((p,j)=>({j,iou:boxIoU16(x.box,p.box)}))
  .filter(v=>proposals[v.j].family===x.family&&v.iou>=threshold)
  .sort((a,b)=>b.iou-a.iou||a.j-b.j));
 const assigned=new Array(proposals.length).fill(-1);
 function augment(i,seen){
  for(const e of edges[i]){if(seen.has(e.j))continue;seen.add(e.j);
   if(assigned[e.j]===-1||augment(assigned[e.j],seen)){assigned[e.j]=i;return true;}
  }
  return false;
 }
 for(let i=0;i<rows.length;i++)augment(i,new Set());
 const matches=assigned.flatMap((e,j)=>e<0?[]:[{truth:e,proposal:j,iou:round(boxIoU16(rows[e].box,proposals[j].box)),family:rows[e].family}]);
 const truthMatched=new Set(matches.map(x=>x.truth)),proposedMatched=new Set(matches.map(x=>x.proposal));
 const missing=rows.map((x,i)=>({x,i})).filter(r=>!truthMatched.has(r.i)).map(r=>({index:r.i,family:r.x.family}));
 const spurious=[];
 for(let j=0;j<proposals.length;j++){
  if(proposedMatched.has(j))continue;
  const p=proposals[j];let best=null;
  for(const [i,x] of rows.entries()){
   const iou=boxIoU16(p.box,x.box);
   if(!best||iou>best.iou)best={iou,truth:i,family:x.family};
  }
  const category=best&&best.iou>=threshold?
   best.family===p.family?'duplicate_proposal':'wrong_region_class':'background_or_extra';
  spurious.push({proposal:j,category:category||'background_or_extra',family:p.family});
 }
 return {supportedExpected:rows.length,unsupportedExpected:expected.length-rows.length,
  proposed:proposals.length,matched:matches.length,missed:missing.length,
  duplicates:spurious.filter(x=>x.category==='duplicate_proposal').length,
  incorrectRegionCategories:spurious.filter(x=>x.category==='wrong_region_class').length,
  backgroundOrExtra:spurious.filter(x=>x.category==='background_or_extra').length,
  meanMatchedBoxIoU:matches.length?round(matches.reduce((s,x)=>s+x.iou,0)/matches.length):null,
  precisionPercent:percent(matches.length,proposals.length),
  recallPercent:percent(matches.length,rows.length),
  matches,missing,spurious};
}
export function scoreAutoMulti16(manifest,results,{actualModelEvidence=false}={}){
 const sources=distinct(manifest,'frozen source'),observed=distinct(results,'browser model outcome');
 demand(sources.size===15,'exact 15 unchanged photograph population required');
 demand(observed.size===30,'exact 15 originals in 2 distinct model engines required');
 const byPhoto=new Map();
 for(const [id,r] of sources){
  demand(SHA.test(r.sourceSha256)&&Number.isInteger(r.originalBytes)&&r.originalBytes>0&&
   r.originalJpeg===true&&r.sourceIdentityLocked===true&&r.license&&
   typeof r.sourcePage==='string'&&r.sourcePage.startsWith('https://commons.wikimedia.org/wiki/File:')&&
   Array.isArray(r.regions)&&r.regions.length>0&&r.regions.every(x=>ALLOWED.has(x.family)&&validBox16(x.box))&&
   r.humanReviewerVerified===false,'missing source proof or misleading human review claim '+id);
  for(const browser of ['chromium','webkit']){
   const key=id+'-'+browser,v=observed.get(key);
   demand(v&&v.originalId===id&&v.browser===browser&&v.sourceSha256===r.sourceSha256&&
    v.originalBytesVerified===true&&v.originalJpegUnchanged===true,'missing exact browser/source identity '+key);
  }
  byPhoto.set(id,r);
 }
 for(const key of observed.keys()){
  const b=key.endsWith('-chromium')?'chromium':key.endsWith('-webkit')?'webkit':null;
  demand(b&&sources.has(key.slice(0,-b.length-1)),'unexpected browser/photo case '+key);
 }
 const records=[],totals={};
 for(const browser of ['chromium','webkit'])for(const mode of ['baseline','updated']){
  totals[browser+'-'+mode]={expected:0,supportedExpected:0,unsupportedExpected:0,
   modelProposed:0,matched:0,missed:0,falsePositive:0,duplicates:0,
   wrongClass:0,backgroundExtra:0,errors:0,photos:0};
 }
 for(const [id,source] of byPhoto)for(const browser of ['chromium','webkit']){
  const row=observed.get(id+'-'+browser);
  demand(typeof row.modelExecuted==='boolean'&&Array.isArray(row.baseline)&&Array.isArray(row.updated),
   'missing neural model outcome '+id+'/'+browser);
  demand(row.error===null||typeof row.error==='string','invalid model error');
  demand(!row.error||!row.modelExecuted,'false model success '+id);
  for(const mode of ['baseline','updated']){
   // FAIR PRIMARY COMPARISON: both old and new contribute exactly one
   // detector proposal per clothing-region group (a shoe pair is one item).
   // Left/right shoe geometry is measured separately below, not inflated into
   // updated-only detector proposal counts.
   const units=detectionUnits16(row[mode],{splitShoePairs:false});
   const analysis=matchBoxes16(source.regions,units,.3);
   const t=totals[browser+'-'+mode];t.photos++;
   t.expected+=source.regions.length;t.supportedExpected+=analysis.supportedExpected;
   t.unsupportedExpected+=analysis.unsupportedExpected;
   t.modelProposed+=analysis.proposed;t.matched+=analysis.matched;t.missed+=analysis.missed;
   t.duplicates+=analysis.duplicates;t.wrongClass+=analysis.incorrectRegionCategories;
   t.backgroundExtra+=analysis.backgroundOrExtra;
   t.falsePositive+=analysis.proposed-analysis.matched;t.errors+=!row.modelExecuted||row.error?1:0;
   const shoeParts=mode==='updated'?matchBoxes16(
    source.regions.filter(x=>x.family==='shoes'),
    detectionUnits16(row.updated,{splitShoePairs:true}).filter(x=>x.family==='shoes'),.3):null;
   records.push({id,browser,mode,scene:source.scene,
    expectedGarments:source.regions.length,modelExecuted:row.modelExecuted,error:!!row.error,
    ...analysis,updatedShoePartDiagnostic:shoeParts?{
     expectedShoeBoxes:shoeParts.supportedExpected,
     proposedVisibleShoeParts:shoeParts.proposed,
     matchedShoeBoxes:shoeParts.matched,missedShoeBoxes:shoeParts.missed,
     note:'Additional updated shoe-pair localization only; NOT a baseline-comparable garment precision measurement.'
    }:null});
  }
 }
 const scored=Object.fromEntries(Object.entries(totals).map(([key,v])=>[key,{
  ...v,precisionPercent:percent(v.matched,v.modelProposed),
  recallPercent:percent(v.matched,v.supportedExpected),
  falseDiscoveryPercent:percent(v.falsePositive,v.modelProposed)}]));
 return {priority:'AUTO-MULTI-DIVERSITY-16',method:'actual SegFormer or synthetic benchmark as stated',
  actualUnmockedInference:actualModelEvidence,uniqueOriginalPhotographs:15,
  uniqueSourceSHA256s:new Set(manifest.map(x=>x.sourceSha256)).size,
  totalProvisionalVisualRegions:manifest.reduce((s,x)=>s+x.regions.length,0),
  humanGroundTruthVerified:false,annotationStatus:'AI-ASSISTED VISUAL BOXES, independent human reviewer still required',
  frozenBeforeInference:true,sourceHashesRetained:true,maskGroundTruthPresent:false,
  truePixelMaskIoU:null,boxIoUThreshold:.3,
  primaryCountingUnit:'One connected garment proposal per inferred garment group; paired shoes are one proposal for BOTH baseline and updated',
  shoePartSecondary:'Visible left/right shoe localization evaluated separately only for updated proposal diagnostics, never mixed into before/after proposal precision',
  browserModels:['chromium','webkit'],cohorts:{development:10,heldout:5},
  results:scored,records,
  qualityGatePassed:false,qualityGateReason:'Human-reviewed region boxes and full mobile/real-world acceptance not independently established',
  modelProbabilityCalibrationNotClaimed:true,
  familyAlpha:'HOLD',productionDeployed:false,physicalPhonesVerified:false,
  signedOwnerRLSVerified:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [a,b,c]=process.argv.slice(2);demand(a&&b&&c,'usage frozen-15 cases output');
 const result=scoreAutoMulti16(JSON.parse(await readFile(a,'utf8')),
  JSON.parse(await readFile(b,'utf8')),{actualModelEvidence:true});
 await mkdir(dirname(c),{recursive:true});await writeFile(c,JSON.stringify(result,null,2));
 console.log('AUTO_MULTI_16_MEASUREMENT '+JSON.stringify({
  uniqueOriginals:result.uniqueOriginalPhotographs,visibleRegions:result.totalProvisionalVisualRegions,
  chromiumBaseline:result.results['chromium-baseline'],chromiumUpdated:result.results['chromium-updated'],
  webkitBaseline:result.results['webkit-baseline'],webkitUpdated:result.results['webkit-updated'],
  humanGroundTruthVerified:false,trueMaskIoU:null,qualityGatePassed:false}));
}
