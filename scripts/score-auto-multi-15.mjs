/**
 * AUTO-MULTI-MODEL-EVIDENCE-15 — independent visible-region detection report.
 * This is NOT segmentation mask IoU, identity precision/recall, or subtype
 * recognition. Expected boxes are coarse, manually reviewed visible regions.
 * Every model proposal needs owner confirmation before any closet save.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const sha=/^[a-f0-9]{64}$/;
const round=(n)=>+n.toFixed(4);
function ensure(ok,why){if(!ok)throw Error('AUTO-MULTI-15 '+why);}
export const regionFamilies15={4:'upper',5:'bottom',6:'bottom',7:'dress',9:'shoes'};
export function validRegionBox15(rect){
 return !!rect&&['x','y','width','height'].every(k=>Number.isFinite(rect[k]))&&
 rect.x>=0&&rect.y>=0&&rect.width>0&&rect.height>0&&
 rect.x+rect.width<=1.0001&&rect.y+rect.height<=1.0001;
}
export function boxOverlap15(a,b){
 if(!validRegionBox15(a)||!validRegionBox15(b))throw Error('AUTO-MULTI-15 invalid geometry');
 const ix=Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x));
 const iy=Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
 const area=ix*iy,union=a.width*a.height+b.width*b.height-area;
 return union?round(area/union):0;
}
function index(rows,name){
 ensure(Array.isArray(rows)&&rows.length,name+' missing');
 const out=new Map();
 for(const x of rows){
  ensure(x&&typeof x.id==='string'&&/^[a-z0-9-]{4,60}$/.test(x.id)&&!out.has(x.id),name+' duplicate/invalid id');
  out.set(x.id,x);
 }return out;
}
export function scoreAutoMultiEvidence15(manifest,cases,{verifiedLiveInference=false}={}){
 const sources=index(manifest,'locked sources');
 const seen=index(cases,'worker cases');
 ensure(sources.size===seen.size,'missing or extra worker case');
 for(const x of seen.keys())ensure(sources.has(x),'unexpected case');
 const out=[],summary={cases:0,fullOutfitScenes:0,expectedCoarseRegions:0,
  matchedCoarseRegions:0,unmatchedCoarseRegions:0,modelProposals:0,
  unassignedProposals:0,modelErrors:0,multiOutfitProposals:0,
  scenesWithThreeExpectedClasses:0,scenesWithThreeProposedClasses:0};
 for(const [id,expected] of sources){
  ensure(sha.test(expected.sourceSha256)&&expected.originalJpeg===true&&expected.licensed===true,
   'not source-locked original JPEG '+id);
  ensure(Array.isArray(expected.regions)&&expected.regions.length>0,'missing independently reviewed visible regions '+id);
  for(const e of expected.regions)ensure(typeof e.family==='string'&&
   ['upper','bottom','dress','shoes'].includes(e.family)&&validRegionBox15(e.box),
   'invalid human reviewed visible box '+id);
  const actual=seen.get(id);
  ensure(actual.sourceSha256===expected.sourceSha256,'source image hash changed for '+id);
  ensure(['chromium','webkit'].includes(actual.browser),'not genuine supported browser '+id);
  ensure(typeof actual.modelExecuted==='boolean','model execution status required '+id);
  ensure(Array.isArray(actual.proposals),'proposals missing '+id);
  const proposals=actual.proposals.map((p,i)=>{
   ensure(Number.isInteger(p.regionId)&&typeof regionFamilies15[p.regionId]==='string'&&
    typeof p.label==='string'&&validRegionBox15(p.box)&&
    Number.isFinite(p.confidence)&&p.confidence>=0&&p.confidence<=1&&
    p.needsReview===true,'unverified or invalid model proposal '+id+' '+i);
   return {...p,family:regionFamilies15[p.regionId]};
  });
  ensure(actual.error===null||typeof actual.error==='string','model failure not disclosed');
  ensure(actual.error===null||!proposals.length,'model failure falsely reported as detections');
  ensure(!actual.modelExecuted||actual.error===null||proposals.length===0,
   'error with proposals');
  let candidatePairs=[];
  for(let e=0;e<expected.regions.length;e++)
   for(let p=0;p<proposals.length;p++)
    if(expected.regions[e].family===proposals[p].family){
     const iou=boxOverlap15(expected.regions[e].box,proposals[p].box);
     if(iou>=.10)candidatePairs.push({e,p,iou});
    }
  candidatePairs.sort((a,b)=>b.iou-a.iou||a.e-b.e||a.p-b.p);
  const usedExpected=new Set(),usedPredicted=new Set(),matches=[];
  for(const c of candidatePairs){
   if(usedExpected.has(c.e)||usedPredicted.has(c.p))continue;
   usedExpected.add(c.e);usedPredicted.add(c.p);
   matches.push({family:expected.regions[c.e].family,coarseBoxIoU:c.iou,
    reviewedIndex:c.e,proposalIndex:c.p});
  }
  const truthClasses=new Set(expected.regions.map(x=>x.family));
  const foundClasses=new Set(proposals.map(x=>x.family));
  summary.cases++;summary.expectedCoarseRegions+=expected.regions.length;
  summary.matchedCoarseRegions+=matches.length;summary.unmatchedCoarseRegions+=expected.regions.length-matches.length;
  summary.modelProposals+=proposals.length;summary.unassignedProposals+=proposals.length-matches.length;
  if(actual.error!==null||!actual.modelExecuted)summary.modelErrors++;
  if(expected.scene==='worn-outfit'){
   summary.fullOutfitScenes++;
   summary.multiOutfitProposals+=proposals.length;
   if(['upper','bottom','shoes'].every(x=>truthClasses.has(x)))summary.scenesWithThreeExpectedClasses++;
   if(['upper','bottom','shoes'].every(x=>foundClasses.has(x)))summary.scenesWithThreeProposedClasses++;
  }
  out.push({id,browser:actual.browser,sourceSha256:expected.sourceSha256,
   sourcePixelsVerified:actual.sourcePixelsVerified===true,originalJpegUnmodified:true,
   scene:expected.scene,modelExecuted:actual.modelExecuted,
   modelError:actual.error!==null,expectedVisibleRegions:expected.regions.length,
   proposals:proposals.map(p=>({regionId:p.regionId,label:p.label,confidence:round(p.confidence),
    bounds:p.box,clipped:!!p.clipped,needsReview:true})),
   matchedCoarseRegions:matches.length,matches,
   unmatchedTruth:expected.regions.filter((_,i)=>!usedExpected.has(i)).map(x=>x.family),
   unmatchedProposals:proposals.filter((_,i)=>!usedPredicted.has(i)).map(x=>x.family),
   qualityReviewRequired:true,noAutomaticClosetSave:true});
 }
 const percent=(n,d)=>d?round(n*100/d):null;
 return {priority:'AUTO-MULTI-MODEL-EVIDENCE-15',inferenceMode:verifiedLiveInference?
 'live-unmocked-browser-SegFormer':'synthetic-label-map-unit-test-not-real-accuracy',
 sourceTruth:'coarse manual boxes: class-compatible IoU >=0.10 (not mask precision, identity or pixel IoU)',
 ...summary,coarseBoxRecallProxyPercent:percent(summary.matchedCoarseRegions,summary.expectedCoarseRegions),
 allSourcesVerified:out.every(x=>x.sourcePixelsVerified),
 sourceRetained:true,automaticGarmentTypeAccuracyPercent:null,automaticMaskIoU:null,
 fullyAutomaticMultiGarmentRecallPercent:null,realMultiPhotoPopulation:summary.fullOutfitScenes,
 modelQualityAccepted:verifiedLiveInference&&summary.modelErrors===0&&
 summary.unmatchedCoarseRegions===0&&summary.unassignedProposals===0&&
 summary.scenesWithThreeProposedClasses===summary.scenesWithThreeExpectedClasses,
 allProposalsRequireHumanReview:true,
 familyAlpha:'HOLD',productionDeployed:false,realOwnerRLSVerified:false,
 physicalPhonesVerified:false,cases:out};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [manifestPath,casePath,outPath]=process.argv.slice(2);
 ensure(manifestPath&&casePath&&outPath,'use: score-auto-multi-15.mjs manifest cases output');
 const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
 const cases=JSON.parse(await readFile(casePath,'utf8'));
 const r=scoreAutoMultiEvidence15(manifest,cases,{verifiedLiveInference:true});
 await mkdir(dirname(outPath),{recursive:true});await writeFile(outPath,JSON.stringify(r,null,2));
 console.log('AUTO MULTI 15 ACTUAL SEGMENTATION '+JSON.stringify({
  cases:r.cases.length,modelErrors:r.modelErrors,coarseBoxRecallProxyPercent:r.coarseBoxRecallProxyPercent,
  sourceVerified:r.allSourcesVerified,automaticMaskIoU:r.automaticMaskIoU,
  modelQualityAccepted:r.modelQualityAccepted,familyAlpha:r.familyAlpha
 }));
}