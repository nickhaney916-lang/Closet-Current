import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const c=vm.createContext({});
for(const f of ['daily-weather-context.js','outfit-board-engine.js','closet-stylist-engine.js'])vm.runInContext(fs.readFileSync('public/'+f,'utf8'),c);
vm.runInContext("function colorFamily(v){return String(v).toLowerCase()} function safeTrendURL(){return false}",c);
const base={source:'manual',unit:'C',low:2,high:8,rain:'rain',wind:'windy'};
test('valid range, Fahrenheit, unknown and invalid context',()=>{
 assert.equal(c.dailyWeatherContext(base).low,2);
 assert.equal(c.dailyWeatherContext({...base,unit:'F',low:32,high:50}).high,10);
 for(const patch of [{low:15},{low:' '},{high:Infinity},{unit:'K'},{rain:'snow'},{source:'live'},{low:-99}])assert.equal(c.dailyWeatherContext({...base,...patch}),null);
 assert.equal(c.dailyWeatherContext({...base,low:'',high:'',rain:'unknown',wind:'unknown'}),null);
});
test('fixture freshness and lease invalidation',async()=>{
 const now=123456789;const f={...base,source:'fixture',issuedAt:now-1,validUntil:now+100};
 assert.equal((await c.readDailyWeatherFixture(()=>f,()=>true,()=>now)).source,'fixture');
 assert.equal(c.dailyWeatherContext({...f,issuedAt:now-7*3600000},now),null);
 assert.equal(c.dailyWeatherContext({...f,validUntil:now},now),null);
 let active=true;
 assert.equal(await c.readDailyWeatherFixture(async()=>{active=false;return f},()=>active,()=>now),null);
});
const rows=[['tee','Tops','T-shirt'],['sweater','Tops','Sweater'],['jeans','Bottoms','Jeans'],['shorts','Bottoms','Shorts'],['boots','Shoes','Ankle boots'],['sandals','Shoes','Sandals'],['coat','Outerwear','Coat']].map(([id,category,itemType])=>({id,category,itemType,color:'Black',seasons:['All seasons']}));
test('recommender changes ranking and retains eligibility and identity',()=>{
 const run=weather=>c.styleOwnedCollection(rows,{request:'Casual',season:'Fall',weather});
 const cold=run(base)[0],hot=run({...base,low:28,high:34,rain:'dry',wind:'calm'})[0];
 assert.equal(cold.board.slots.top,'sweater');assert.equal(cold.board.slots.shoes,'boots');assert.equal(cold.board.slots.layer,'coat');
 assert.equal(hot.board.slots.top,'tee');assert.equal(hot.board.slots.shoes,'sandals');assert.equal(hot.board.slots.layer,undefined);
 for(const x of [...run(base),...run(undefined)])for(const id of Object.values(x.board.slots))assert.ok(rows.some(r=>r.id===id));
 assert.equal(run(undefined)[0].notices.some(n=>n.includes('Manual conditions')),false);
 assert.equal(c.styleOwnedCollection([{...rows[1],seasons:['Summer']},{...rows[0]}],{request:'Casual',season:'Winter',weather:base})[0].board.slots.top,'tee');
});
