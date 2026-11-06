import {readFileSync} from 'node:fs';

const SHA=/^[0-9a-f]{64}$/;
const CATEGORIES=['Tops','Bottoms','Dresses','Outerwear','Shoes'];
const TYPES=['T-shirt','Blouse','Sweater','Tunic','Sweatshirt','Jeans','Trousers','Shorts','Skirt','Dress','Jacket','Coat','Blazer','Sneakers','Ankle boots','Boots','Unknown'];

export function evaluateLockedSnapshot(snapshot){
 if(snapshot?.schema!=='closet-current-real-photo-locked-snapshot-115/v1')throw Error('unsupported snapshot schema');
 if(snapshot.sourceCommit!=='51aeeacdff675175f89a17dd64c1281e0aa7cee8'||snapshot.workflowRunId!==42143014654||snapshot.artifactId!==13469256263||snapshot.artifactSHA256!=='65f72decb1ed6f62d4c45079520c7337c5fce643a4679a3eeb34ff9bd36c6c3b')throw Error('unrecognized inference provenance');
 if(snapshot.model?.name!=='FashionCLIP'||snapshot.model?.revision!=='0f99955d944c39bfd9d035a02ac273c7a44a406b'||snapshot.partition!=='locked-evaluation')throw Error('model or partition mismatch');
 if(snapshot.model?.quantization!=='q8'||snapshot.inferenceParameters?.hypothesisTemplate!=='A photo of {}.'||snapshot.inferenceParameters?.categoryMinimumScore!==0.45||snapshot.inferenceParameters?.categoryMinimumTopTwoMargin!==0.15||snapshot.inferenceParameters?.fullCatalogMinimumScore!==0.6||snapshot.inferenceParameters?.fullCatalogMinimumTopTwoMargin!==0.2)throw Error('inference parameters mismatch');
 if(snapshot.independentHumanAdjudications!==0||snapshot.labelStatus!=='provisional legacy labels; not independent ground truth')throw Error('ground-truth status mismatch');
 if(!Array.isArray(snapshot.samples)||snapshot.samples.length!==16)throw Error('expected all 16 locked output rows');
 const ids=new Set(),hashes=new Set();
 for(const x of snapshot.samples){
  if(!x.sampleId||ids.has(x.sampleId))throw Error('missing or duplicate source id');ids.add(x.sampleId);
  if(!SHA.test(x.sourceSHA256||'')||hashes.has(x.sourceSHA256))throw Error('missing or duplicate original-photo SHA');hashes.add(x.sourceSHA256);
  if(typeof x.abstained!=='boolean'||x.abstained!==!x.predictionCategory)throw Error('abstention disagrees with recorded model output');
  if(x.provisionalCategory==='Uncategorized'){
   if(x.provisionalSubtype!=='Unknown'||!x.abstained)throw Error('negative control was not rejected');
  }else if(!CATEGORIES.includes(x.provisionalCategory)||!TYPES.includes(x.provisionalSubtype))throw Error('unsupported provisional label');
  if(!x.abstained&&(!CATEGORIES.includes(x.predictionCategory)||!TYPES.includes(x.predictionSubtype)))throw Error('invalid model prediction');
 }
 const garments=snapshot.samples.filter(x=>x.provisionalCategory!=='Uncategorized');
 const negatives=snapshot.samples.filter(x=>x.provisionalCategory==='Uncategorized');
 const categories={};const confusion={};let categoryMatches=0,subtypeMatches=0,abstentions=0;
 for(const c of CATEGORIES)categories[c]={n:0,categoryMatches:0,subtypeMatches:0,abstentions:0};
 for(const x of garments){
  const pred=x.predictionCategory||'ABSTAIN';confusion[x.provisionalCategory]??={};confusion[x.provisionalCategory][pred]=(confusion[x.provisionalCategory][pred]||0)+1;
  const row=categories[x.provisionalCategory];row.n++;
  if(x.abstained){abstentions++;row.abstentions++;continue;}
  if(x.predictionCategory===x.provisionalCategory){categoryMatches++;row.categoryMatches++;}
  if(x.predictionCategory===x.provisionalCategory&&x.predictionSubtype===x.provisionalSubtype){subtypeMatches++;row.subtypeMatches++;}
 }
 const pct=(n,d)=>d?Number((100*n/d).toFixed(2)):null;
 return Object.freeze({
  evaluatedLockedPhotos:snapshot.samples.length,provisionalGarmentPhotos:garments.length,provisionalNegativeControls:negatives.length,
  abstentions,categoryMatches,subtypeMatches,
  provisionalAgreement:{
   category:{numerator:categoryMatches,denominator:garments.length,percent:pct(categoryMatches,garments.length)},
   subtype:{numerator:subtypeMatches,denominator:garments.length,percent:pct(subtypeMatches,garments.length)},
   negativeControlsRejected:{numerator:negatives.filter(x=>x.abstained).length,denominator:negatives.length,percent:pct(negatives.filter(x=>x.abstained).length,negatives.length)}
  },
  confusion,categories,
  perGarmentDetectionPrecision:null,perGarmentDetectionRecall:null,instanceMaskIoU:null,
  primaryColorAccuracy:null,secondaryColorAccuracy:null,
  correctAutomaticAcceptanceRate:null,incorrectAutomaticAcceptanceRate:null,humanReviewRate:null,postCorrectionAccuracy:null,
  independentScientificAccuracy:'UNVERIFIED: no independently adjudicated human ground truth',
  multiGarmentInstanceSeparation:'UNVERIFIED: no legitimate per-garment instance masks in this classifier snapshot'
 });
}

if(process.argv[1]&&process.argv[1].endsWith('/evaluate.mjs')){
 const file=process.argv[2]||new URL('./evidence.json',import.meta.url);
 const snapshot=JSON.parse(readFileSync(file,'utf8'));
 process.stdout.write(JSON.stringify(evaluateLockedSnapshot(snapshot),null,2)+'\n');
}