// Offline research tool. Reads pinned ONNX AI proposals and separately
// supplied two-human, full-photo physical garment review files.
// Default / absent review files: report NULL accuracy, never fake approval.
// Usage: node scripts/score-physical-garment-inventory.mjs [probe-output-folder]
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {evaluateCompletePhysicalInventory} from '../benchmark/physical-garment-inventory.mjs';
const root=resolve(process.argv[2]||'benchmark/deepfashion-instance-review');
const review=join(root,'independent-outline-review');
const index=JSON.parse(await readFile(join(review,'reference-review-index.json'),'utf8'));
const suite=JSON.parse(await readFile('benchmark/deepfashion-real-photo-suite.json','utf8'));
const sourceIds=suite?.cases?.map(x=>x.id);
if(suite?.realPhotoCount!==10||!Array.isArray(sourceIds)||sourceIds.length!==10||
   new Set(sourceIds).size!==10||
   !Array.isArray(index.cases)||index.cases.length!==10||
   index.imageCount!==10||
   index.predictionMasksAreGroundTruth!==false||
   index.automaticCustomerMaskPromotion!==false||
   index.sourcePhotosPreserved!==true||
   index.status!=='awaiting-independent-human-outlines'||
   new Set(index.cases.map(x=>x.id)).size!==10||
   index.cases.some(x=>!sourceIds.includes(x.id)))
 throw Error('Untrusted or incomplete exact ten-source review index');
const reports=[];
async function optionalJson(path){
 try{return JSON.parse(await readFile(path,'utf8'));}
 catch(error){if(error.code==='ENOENT')return null;throw error;}
}
for(const scene of index.cases){
 if(!/^(?:commons|validation)-[0-9]{4}$/.test(scene.id)||
   scene.image!==scene.id+'.jpg'||!Array.isArray(scene.candidateSeeds))
  throw Error('Unexpected real-photo review identity');
 const proposals=new Map();
 for(const p of scene.candidateSeeds){
  if(!p.id?.startsWith(scene.id+'-candidate-')||
     p.prediction!=='independent-outline-review/model-seeds/'+p.id+'.prediction.json')
   throw Error('Untrusted model prediction path');
  proposals.set(p.id,JSON.parse(await readFile(join(review,'model-seeds',p.id+'.prediction.json'),'utf8')));
 }
 const inventory=await optionalJson(join(review,'approved-physical-inventory',scene.id+'.inventory.json'));
 const annotations=new Map();
 if(inventory){
  // Never score without the exact unchanged licensed original photograph.
  const original=await readFile(join(review,'original-photos',scene.image));
  const sha=createHash('sha256').update(original).digest('hex');
  if(sha!==scene.sourceSha256)throw Error('Full-photo review source checksum mismatch: '+scene.id);
  if(!Array.isArray(inventory.targets))throw Error('Invalid independently reviewed inventory');
  for(const item of inventory.targets){
   if(typeof item.id!=='string'||!new RegExp('^'+scene.id+'-item-[0-9]{2}$').test(item.id)||
      annotations.has(item.id))throw Error('Invalid human garment reference path');
   const p=join(review,'approved-physical-inventory',item.id+'.mask.approved.json');
   annotations.set(item.id,JSON.parse(await readFile(p,'utf8')));
  }
 }
 reports.push(evaluateCompletePhysicalInventory({
  id:scene.id,image:scene.image,sourceSha256:scene.sourceSha256
 },inventory,annotations,proposals));
}
const reviewed=reports.filter(x=>x.status==='conditionally-scored-complete-human-inventory');
const report={
 status:reviewed.length===reports.length?'conditionally-scored-full-inventory':
  'awaiting-independent-complete-physical-inventory',
 sources:reports.length,fullyHumanReviewedSources:reviewed.length,
 sourcesStillAwaitingHumanInventory:reports.length-reviewed.length,
 completeTenPhotoAccuracy:reviewed.length===reports.length?{
  // Metrics can be combined only after every source has full-photo review.
  physicalGarmentDetectionRecall:reviewed.reduce((s,x)=>s+x.matchedGarments,0)/
   reviewed.reduce((s,x)=>s+x.approvedPhysicalGarments,0),
  correctlyCategorizedGarmentRecall:reviewed.reduce(
   (s,x)=>s+x.categoryConstrainedMatchedGarments,0)/
   reviewed.reduce((s,x)=>s+x.approvedPhysicalGarments,0),
  supportedCategoryCorrectRecall:(()=>{
   const supported=reviewed.reduce((s,x)=>
    s+x.approvedPhysicalGarments-x.unsupportedCategoryGarments.length,0);
   return supported?reviewed.reduce((s,x)=>s+x.categoryConstrainedMatchedGarments,0)/supported:null;
  })(),
  unsupportedPhysicalGarmentsByModel:reviewed.reduce(
   (s,x)=>s+x.unsupportedCategoryGarments.length,0),
  predictionPrecision:(()=>{
   const total=reviewed.reduce((s,x)=>s+x.modelProposals,0);
   return total?reviewed.reduce((s,x)=>s+x.matchedGarments,0)/total:null;
  })()
 }:null,
 partialDatasetAccuracy:null,sourceRgbChanged:false,
 customerModelModified:false,canPromoteModel:false,paidServicesUsed:false,
 perPhoto:reports
};
await writeFile(join(root,'physical-garment-inventory-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHYSICAL_GARMENT_INVENTORY_AUDIT '+JSON.stringify({
 status:report.status,sources:report.sources,
 independentlyReviewedSources:report.fullyHumanReviewedSources,
 accuracyReported:report.completeTenPhotoAccuracy!==null,canPromoteModel:false}));
