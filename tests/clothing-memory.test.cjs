const test=require('node:test'),assert=require('node:assert/strict'),M=require('../public/clothing-memory.js');
const memory=(key='model-v1',axis=0)=>({version:1,modelKey:key,features:Array.from({length:512},(_,i)=>i===axis?1:0)});
const example=(id,extra={})=>M.confirm({id,image:'photo-'+id,recognitionMemory:memory(),category:'Tops',itemType:'Polo',pattern:'Striped',sleeveLength:'Short sleeve',color:'Red',brand:'Brand',size:'M',material:'Cotton',...extra});
const target=extra=>({id:'new',image:'new-photo',category:'Tops',itemType:'Unknown',color:'Blue',pattern:'Unknown',recognitionMemory:memory(),...extra});
test('confirmed similar clothing supplies review suggestions but never copies color or label information',()=>{const q=target(),s=M.suggest(q,[example('one'),example('two')]);assert.equal(s.requiresConfirmation,true);assert.equal(s.fields.itemType,'Polo');assert.equal(s.fields.pattern,'Striped');assert.ok(!['color','brand','size','material'].some(k=>k in s.fields));assert.equal(q.itemType,'Unknown');assert.equal(M.apply(q,s).color,'Blue');assert.equal(M.apply(q,s).itemType,'Polo');});
test('own predictions and a single example cannot reinforce an incorrect label',()=>{const auto=example('one');delete auto.confirmedDetails;assert.equal(M.suggest(target(),[auto,example('two')]),null);assert.equal(M.suggest(target(),[example('one')]),null);});
test('contradictory similar categories or garment types require direct review',()=>{assert.equal(M.suggest(target(),[example('one'),example('two',{itemType:'T-shirt'})]),null);assert.equal(M.suggest(target(),[example('one'),example('two',{category:'Bottoms',itemType:'Jeans'})]),null);});
test('duplicate photos cannot count as two independent confirmed examples',()=>{assert.equal(M.suggest(target(),[example('one'),example('copy',{image:'photo-one'})]),null);});
test('incompatible models, dissimilar features and nonfinite data never suggest labels',()=>{assert.equal(M.suggest(target(),[example('one'),example('two',{recognitionMemory:memory('different')})]),null);assert.equal(M.suggest(target(),[example('one'),example('two',{recognitionMemory:memory('model-v1',1)})]),null);const bad=memory();bad.features[3]=NaN;assert.equal(M.valid(bad),false);assert.equal(M.valid({...memory(),features:[1]}),false);});
test('confirmed current fields and outfit category or clipping restrictions are preserved',()=>{const refs=[example('one'),example('two')];assert.equal(M.suggest(target({category:'Dresses'}),refs),null);assert.equal(M.suggest(target({segmentHint:{categories:['Tops'],clipped:true}}),refs),null);const q=target({itemType:'T-shirt',pattern:'Solid'}),result=M.apply(q,{fields:{itemType:'Polo',pattern:'Striped'},requiresConfirmation:true});assert.equal(result.itemType,'T-shirt');assert.equal(result.pattern,'Solid');});
test('unknown clothing can obtain a category proposal while partial agreement excludes disputed fields',()=>{const s=M.suggest(target({category:'Uncategorized'}),[example('one'),example('two',{pattern:'Solid'})]);assert.equal(s.fields.category,'Tops');assert.equal(s.fields.itemType,'Polo');assert.ok(!('pattern' in s.fields));});
test('Monday catch-up uses the owner timezone across Sunday UTC and daylight saving transitions',()=>{assert.equal(M.week(new Date('2026-10-19T06:59:00Z')),'2026-10-12');assert.equal(M.week(new Date('2026-10-19T07:00:00Z')),'2026-10-19');assert.equal(M.week(new Date('2026-11-02T08:00:00Z')),'2026-11-02');});
test('weekly model suggestions stay tentative and only fill missing fields after acceptance',()=>{const q=target({weeklySuggestion:{fields:{itemType:'Polo',pattern:'Striped',color:'Red',brand:'Brand'},requiresConfirmation:true}}),s=M.weekly(q);assert.equal(s.requiresConfirmation,true);assert.ok(!('color' in s.fields));assert.equal(M.apply(q,s).color,'Blue');});
test('background feature refresh merges into the latest saved row without overwriting corrections',async()=>{
 const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync('public/app.js','utf8');let record={id:'one',image:'photo',category:'Tops',itemType:'Polo',color:'Green',notes:'Latest correction'};
 const c={queued:work=>work(),db:{transaction(){const tx={objectStore:()=>({get(){const r={};setImmediate(()=>{r.result=record;r.onsuccess();setImmediate(()=>tx.oncomplete());});return r;},put:value=>record=value})};return tx;}}};vm.createContext(c);vm.runInContext(source.slice(source.indexOf('function saveMemoryReview('),source.indexOf('setInterval(scheduleMemoryReview')),c);
 const updated=await c.saveMemoryReview({id:'one',image:'photo',category:'Tops',itemType:'T-shirt',color:'Blue',recognitionMemory:memory(),learningReviewedWeek:'2026-10-19'});assert.equal(updated.itemType,'Polo');assert.equal(updated.color,'Green');assert.equal(updated.notes,'Latest correction');assert.equal(M.valid(record.recognitionMemory),true);
 assert.equal(await c.saveMemoryReview({id:'one',image:'old-crop',recognitionMemory:memory()}),null);assert.equal(record.image,'photo');
});

test('known garment subtype blocks attributes from a different confirmed subtype',()=>{
 const q=target({itemType:'T-shirt',pattern:'Unknown',sleeveLength:'Unknown'});
 assert.equal(M.suggest(q,[example('one'),example('two')]),null);
 assert.equal(q.itemType,'T-shirt');assert.equal(q.pattern,'Unknown');
 const same=M.suggest(target({itemType:'Polo'}),[example('one'),example('two')]);
 assert.equal(same.fields.pattern,'Striped');assert.ok(!('itemType' in same.fields));
});
test('a duplicate of the query photograph is not independent confirmed support',()=>{
 const q=target({image:'photo-one'});
 assert.equal(M.suggest(q,[example('one'),example('two')]),null);
 assert.equal(M.suggest(q,[example('one'),example('two'),example('three')]).sourceIds.length,2);
});
test('query exclusion follows the unmasked recognition source rather than the display cutout',()=>{
 const q=target({image:'white-background-cutout',recognitionPhoto:{image:'raw-source'}});
 assert.equal(M.suggest(q,[example('one',{image:'different-display',recognitionPhoto:{image:'raw-source'}}),example('two')]),null);
});
test('two revisions of the same confirmed item cannot count as two supporting examples',()=>{
 assert.equal(M.suggest(target(),[example('one'),example('one',{image:'new-photo-of-same-item'})]),null);
 assert.ok(M.suggest(target(),[example('one'),example('two')]));
});
