import test from 'node:test';
import assert from 'node:assert/strict';
import {recognizeWithRecovery,categoryCandidates} from '../public/recognition-engine.mjs';
import {localCandidates} from '../public/local-catalog.mjs';

/** These are adversarial synthetic score oracles, NOT publisher photo metrics. */
const photo={width:384,height:512};
const label=type=>localCandidates.find(x=>x.itemType===type)?.label;
const broad=category=>categoryCandidates.find(x=>x.category===category)?.label;
const negative=localCandidates.find(x=>x.category==='Uncategorized').label;
const response=(...entries)=>entries.map(([itemType,score])=>({label:label(itemType),score}));
function fullCatalog(topType){
 const main=label(topType);
 const competitor=topType==='T-shirt'?label('Jeans'):label('T-shirt');
 const others=localCandidates.filter(x=>![main,competitor].includes(x.label));
 const tail=.16/others.length;
 return localCandidates.map(x=>({label:x.label,score:x.label===main?.76:x.label===competitor?.08:tail}));
}
const categoryFor=name=>[
 {label:broad(name),score:.96},
 {label:broad(name==='Bottoms'?'Dresses':'Bottoms'),score:.03}
];
function bottomPrimary(_image,labels){
 if(labels.includes(broad('Tops')))return categoryFor('Bottoms');
 if(labels.includes(label('Jeans'))&&!labels.includes(label('T-shirt')))
  return [...response(['Jeans',.5],['Trousers',.42]),{label:negative,score:.08}];
 throw Error('Unexpected Bottoms primary vocabulary');
}
function skirtPrimary(_image,labels){
 if(labels.includes(broad('Tops')))return categoryFor('Dresses');
 if(labels.includes(label('Casual dress'))&&!labels.includes(label('Skirt')))
  return response(['Casual dress',.92],['Sweater dress',.05]);
 if(labels.includes(label('Skirt')))return response(['Skirt',.88],['Casual dress',.08]);
 throw Error('Unexpected dress-vs-skirt primary vocabulary');
}
function recovery(narrowType,wholeType,{truncateWhole=false}={}){
 return async(_image,labels)=>{
  if(labels.length===localCandidates.length){
   const values=fullCatalog(wholeType);
   return truncateWhole?values.slice(0,2):values;
  }
  assert.ok(labels.includes(negative),'narrow confirmation must include non-garment negative');
  return response([narrowType,.9],[narrowType==='Jeans'?'Trousers':'Casual dress',.05]);
 };
}
test('Bottoms restricted confirmation cannot identify jeans when both full catalogs favor a top',async()=>{
 let identified=0;
 const a=recovery('Jeans','T-shirt'),b=recovery('Jeans','T-shirt');
 const result=await recognizeWithRecovery(bottomPrimary,photo,
  {recoveryModel:a,recoveryConfirmationModel:b,onIdentified:()=>identified++});
 assert.equal(result.strong,false);
 assert.equal(result.reason,'type_uncertain');
 assert.equal(result.diagnostics.bottomsFullCatalogVeto.accepted,false);
 assert.equal(result.diagnostics.bottomsFullCatalogVeto.first.completeVocabulary,true);
 assert.equal(identified,0);
});
test('Bottoms independent full-catalog agreement can recover genuinely supported jeans',async()=>{
 let identified=0;
 const result=await recognizeWithRecovery(bottomPrimary,photo,{
  recoveryModel:recovery('Jeans','Jeans'),
  recoveryConfirmationModel:recovery('Jeans','Jeans'),
  onIdentified:c=>{assert.equal(c.itemType,'Jeans');identified++;}
 });
 assert.equal(result.strong,true);
 assert.equal(result.reason,'bottoms_full_catalog_independent_agreement');
 assert.equal(result.choices[0].itemType,'Jeans');
 assert.equal(identified,1);
});
test('Truncated responses cannot masquerade as an independent complete-catalog check',async()=>{
 let identified=0;
 const result=await recognizeWithRecovery(bottomPrimary,photo,{
  recoveryModel:recovery('Jeans','Jeans',{truncateWhole:true}),
  recoveryConfirmationModel:recovery('Jeans','Jeans'),
  onIdentified:()=>identified++
 });
 assert.equal(result.strong,false);
 assert.equal(result.diagnostics.bottomsFullCatalogVeto.first.completeVocabulary,false);
 assert.equal(identified,0);
});
test('Two agreeing narrow skirt/dress votes cannot override two whole-catalog top votes',async()=>{
 let identified=0;
 const result=await recognizeWithRecovery(skirtPrimary,photo,{
  recoveryModel:recovery('Skirt','T-shirt'),
  recoveryConfirmationModel:recovery('Skirt','T-shirt'),
  onIdentified:()=>identified++
 });
 assert.equal(result.strong,false);
 assert.equal(result.reason,'checks_disagree');
 assert.equal(result.diagnostics.skirtDressFullCatalogVeto.accepted,false);
 assert.equal(identified,0);
});
test('Cross-category skirt recovery succeeds only with two independently complete catalog votes',async()=>{
 let identified=0;
 const result=await recognizeWithRecovery(skirtPrimary,photo,{
  recoveryModel:recovery('Skirt','Skirt'),
  recoveryConfirmationModel:recovery('Skirt','Skirt'),
  onIdentified:c=>{assert.equal(c.itemType,'Skirt');identified++;}
 });
 assert.equal(result.strong,true);
 assert.equal(result.reason,'skirt_dress_full_catalog_independent_agreement');
 assert.equal(result.choices[0].itemType,'Skirt');
 assert.equal(identified,1);
});
test('One full catalog dissent keeps a narrow skirt vote in review',async()=>{
 let identified=0;
 const result=await recognizeWithRecovery(skirtPrimary,photo,{
  recoveryModel:recovery('Skirt','Skirt'),
  recoveryConfirmationModel:recovery('Skirt','T-shirt'),
  onIdentified:()=>identified++
 });
 assert.equal(result.strong,false);
 assert.equal(result.diagnostics.skirtDressFullCatalogVeto.accepted,false);
 assert.equal(identified,0);
});
