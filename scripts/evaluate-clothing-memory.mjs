import fs from 'node:fs';import {createRequire} from 'node:module';const require=createRequire(import.meta.url),M=require('../public/clothing-memory.js');
const load=p=>JSON.parse(fs.readFileSync(p)),manifest=load('benchmark/manifest-reviewed-32.json'),results=load('benchmark/output/results.json'),byId=new Map(results.map(x=>[x.id,x]));
for(const row of results)if(!M.valid(row.recognitionMemory))throw Error('Missing or invalid real image features: '+row.id);
const refs=manifest.filter(x=>x.mode==='single').map(x=>M.confirm({id:x.id,image:x.image,category:x.expectedCategory,itemType:x.expectedType,recognitionMemory:byId.get(x.id).recognitionMemory}));
const report={description:'Reference labels use reviewed annotations. Each 32-photo query excludes itself. Fresh and holdout queries use only the 32 reference photos. Suggestions require human review and are not automatic classifications.',referenceCount:refs.length,threshold:.9,sets:{}};
for(const [name,mp,rp]of [['reviewed32','benchmark/manifest-reviewed-32.json','benchmark/output/results.json'],['fresh11','benchmark/manifest-fresh-11.json','benchmark/output/fresh/results.json'],['holdout16','benchmark/manifest-holdout-16.json','benchmark/output/holdout/results.json']]){
 const rows=load(mp),predictions=new Map(load(rp).map(x=>[x.id,x])),summary={evaluated:rows.length,suggestions:0,correctTypeSuggestions:0,incorrectTypeSuggestions:0,negativeSuggestions:0,details:[]};
 for(const row of rows){const result=predictions.get(row.id);if(!M.valid(result?.recognitionMemory))throw Error('Missing image features: '+row.id);const suggestion=M.suggest({id:row.id,category:'Uncategorized',itemType:'Unknown',recognitionMemory:result.recognitionMemory},refs);if(!suggestion)continue;
  summary.suggestions++;const correct=suggestion.fields.category===row.expectedCategory&&suggestion.fields.itemType===row.expectedType;if(row.expectedCategory==='Uncategorized')summary.negativeSuggestions++;else if(correct)summary.correctTypeSuggestions++;else summary.incorrectTypeSuggestions++;summary.details.push({id:row.id,fields:suggestion.fields,sourceIds:suggestion.sourceIds,similarity:suggestion.similarity,correct});
 }
 report.sets[name]=summary;
}
console.log(JSON.stringify(report,null,2));
