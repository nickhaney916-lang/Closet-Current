/** Compare controlled synthetic preview-only guess against source-aware policy.
 * This measures decision invariants, NOT machine-learning accuracy.
 * No licensed/real/customer photos or paid network model accessed.
 */
import fs from 'node:fs';
import {webcrypto} from 'node:crypto';
import {examineOriginalFirst} from '../research/original-context/original-first-index-gate.mjs';
const jpeg=tag=>'data:image/jpeg;base64,'+Buffer.from([255,216,...new Array(96).fill(0).map((_,i)=>tag.charCodeAt(i%tag.length)),255,217]).toString('base64');
const rgba=()=>({width:64,height:96,channels:3,data:Uint8ClampedArray.from({length:64*96*3},(_,i)=>[30,85,205][i%3])});
const cases=[
 // These are SPECIFIED MOCK CLASSIFIER ANSWERS, not observations of the real model.
 ['shirt','Tops','T-shirt','Outerwear','Jacket','Tops','T-shirt','Tops','T-shirt',false],
 ['shorts','Bottoms','Shorts','Bottoms','Skirt','Bottoms','Shorts','Bottoms','Shorts',false],
 ['skirt','Bottoms','Skirt','Bottoms','Shorts','Bottoms','Skirt','Bottoms','Skirt',false],
 ['dress','Dresses','Dress','Tops','T-shirt','Dresses','Dress','Dresses','Dress',false],
 ['shoe','Shoes','Sneakers','Outerwear','Jacket','Shoes','Sneakers','Shoes','Sneakers',false],
 ['jacket','Outerwear','Jacket','Outerwear','Jacket','Outerwear','Jacket','Outerwear','Jacket',false],
 ['coat','Outerwear','Coat','Outerwear','Coat','Outerwear','Coat','Outerwear','Coat',false],
 ['jeans','Bottoms','Jeans','Bottoms','Jeans','Bottoms','Jeans','Bottoms','Jeans',false],
 ['multi-shirt','Tops','T-shirt','Outerwear','Jacket','Tops','T-shirt','Tops','T-shirt',true],
 ['multi-short','Bottoms','Shorts','Bottoms','Skirt','Bottoms','Shorts','Bottoms','Shorts',true],
 ['multi-skirt','Bottoms','Skirt','Bottoms','Shorts','Bottoms','Skirt','Bottoms','Skirt',true],
 ['multi-shoe','Shoes','Sneakers','Shoes','Sneakers','Shoes','Sneakers','Shoes','Sneakers',true],
 ['uncertain-short','Bottoms','Shorts','Bottoms','Skirt','Bottoms','Shorts','Bottoms','Skirt',false],
 ['uncertain-shoe','Shoes','Sneakers','Tops','T-shirt','Shoes','Sneakers','Tops','T-shirt',false],
 ['unknown-top','Tops','Polo','Tops','T-shirt','Tops','Polo','Tops','T-shirt',false],
 ['unknown-skirt','Bottoms','Skirt','Bottoms','Shorts','Bottoms','Skirt','Bottoms','Shorts',false]
];
const count={scenarios:cases.length,old:{categoryCorrect:0,typeCorrect:0,wrongAutoIndexed:0,autoSubtype:0},sourceAware:{categoryCorrect:0,typeCorrect:0,wrongAutoIndexed:0,autoSubtype:0,categoryColor:0,manualReview:0},fidelity:{originalReferenced:0,sourcePixelBytesPreserved:0,instanceViews:0},differences:[]};
for(const [id,cat,type,oldCat,oldType,firstCat,firstType,secondCat,secondType,multi]of cases){
 const record={id,image:jpeg('preview-'+id),originalPhoto:{image:jpeg('full-'+id)},
  ...(multi?{outfitSourceId:'outfit-'+id,recognitionPhoto:{image:jpeg('textured-'+id)},
   cropBounds:{x:0,y:0,width:.5,height:1},segmentHint:{categories:[cat],clipped:false}}:{})};
 const original=rgba(),bytes=original.data.slice();
 const v=await examineOriginalFirst(record,{
  ownerToken:{owner:'synthetic',generation:1},currentOwner:()=>({owner:'synthetic',generation:1}),cryptoProvider:webcrypto,
  decode:async()=>original,
  recognize:async()=>({strong:true,choices:[{category:firstCat,itemType:firstType}],details:{pattern:'Striped'}}),
  confirm:async()=>({strong:true,choices:[{category:secondCat,itemType:secondType}],details:{pattern:'Striped'}}),
  colorSample:async()=>({primary:'Blue'})
 });
 const oldCategory=oldCat===cat,oldTypeCorrect=oldCategory&&oldType===type;
 count.old.categoryCorrect+=Number(oldCategory);
 count.old.typeCorrect+=Number(oldTypeCorrect);
 count.old.wrongAutoIndexed+=Number(!oldTypeCorrect);
 count.old.autoSubtype++;
 const newCategory=v.status==='indexed'&&v.category===cat;
 const newType=newCategory&&v.itemType===type;
 count.sourceAware.categoryCorrect+=Number(newCategory);
 count.sourceAware.typeCorrect+=Number(newType);
 count.sourceAware.autoSubtype+=Number(v.status==='indexed'&&v.itemType!=='Unknown');
 count.sourceAware.wrongAutoIndexed+=Number(v.status==='indexed'&&v.itemType!=='Unknown'&&!newType);
 count.sourceAware.categoryColor+=Number(v.status==='indexed'&&v.indexingLevel==='category-color');
 count.sourceAware.manualReview+=Number(v.status==='review');
 count.fidelity.originalReferenced+=Number(Boolean(v.sourceVersion)||v.reason==='category_disagreement');
 count.fidelity.sourcePixelBytesPreserved+=Number(original.data.every((n,i)=>n===bytes[i]));
 count.fidelity.instanceViews+=Number(v.sourceRole==='original-instance');
 count.differences.push({id,groundTruth:{category:cat,type},cropOnly:{category:oldCat,type:oldType},gate:{status:v.status,category:v.category,itemType:v.itemType,indexingLevel:v.indexingLevel||'none'},multi});
}
const percentage=(n,d)=>+(n*100/d).toFixed(2);
const report={
 cohort:'synthetic mocked classification decision test, NOT real recognition benchmark',source:'deterministic fixture assumptions',
 comparisons:{
  previousCropOnly:{...count.old,categoryAccuracyPercent:percentage(count.old.categoryCorrect,count.scenarios),exactSubtypeAccuracyPercent:percentage(count.old.typeCorrect,count.scenarios)},
  originalFirstGuard:{...count.sourceAware,categoryAccuracyPercent:percentage(count.sourceAware.categoryCorrect,count.scenarios),exactSubtypeAccuracyPercent:percentage(count.sourceAware.typeCorrect,count.scenarios)}
 },
 total:count.scenarios,
 fidelity:count.fidelity,
 eligibilityNotes:'No neural inference. The baseline and guarded mock probabilities/labels were assigned in advance; percentages are not real photo/model accuracy. Unchanged real-photo 59-image evidence remains its previous verified value.',
 changes:count.differences
};
fs.mkdirSync('artifacts/original-context',{recursive:true});
fs.writeFileSync('artifacts/original-context/controlled-synthetic-comparison.json',JSON.stringify(report,null,2)+'\n');
console.log('ORIGINAL_CONTEXT_SYNTHETIC_COMPARISON '+JSON.stringify({old:report.comparisons.previousCropOnly,new:report.comparisons.originalFirstGuard,total:report.total,fidelity:count.fidelity}));
if(count.sourceAware.wrongAutoIndexed!==0||count.fidelity.sourcePixelBytesPreserved!==count.scenarios||count.sourceAware.categoryColor<2)throw Error('Synthetic source safety gate regressions');
