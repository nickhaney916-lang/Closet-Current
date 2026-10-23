import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {runBenchmark,engine,oracle,sourceGuard} from '../scripts/issue201-outfit-benchmark.mjs';
import {wardrobe,validateSynthetic} from '../benchmark/issue201-synthetic-wardrobes.mjs';
const report=runBenchmark();
for(const check of report.checks)
 test('issue201: '+check.name,()=>assert.equal(check.status,'PASS',check.reason));
test('issue201: both independently observed product gaps are fixed without an accuracy claim',()=>{
 assert.deepEqual(report.checks.filter(x=>x.status==='FAIL'),[]);
 assert.equal(report.productAcceptance,true);assert.equal(report.recognitionAccuracyMeasured,false);assert.equal(report.realisticRenderingEvaluated,false);
});
test('issue201: benchmark is repeatable without time, trend network or random fixture changes',()=>assert.deepEqual(runBenchmark(),report));
test('issue201: independent oracle detects invented, duplicate-slot and wrong-source outputs',()=>{
 const c=engine(),f=wardrobe(),r=JSON.parse(JSON.stringify(c.styleOwnedCollection(f.items,{anchorItemId:'new-top'})[0]));
 assert.throws(()=>oracle({...r,board:{...r.board,slots:{...r.board.slots,shoes:'not-owned'}}},f,'new-top'),/only fixture-owned/);
 assert.throws(()=>oracle({...r,board:{...r.board,slots:{...r.board.slots,shoes:'new-top'}}},f,'new-top'),/multiple slots/);
 const missing=structuredClone(r);delete missing.board.slots.shoes;
 assert.throws(()=>oracle(missing,f,'new-top'),/missing required slots/);
 const altered=structuredClone(f);altered.items[0].originalPhoto.image=wardrobe('synthetic-b').items[0].originalPhoto.image;
 assert.throws(()=>oracle(r,altered,'new-top'),/original unchanged/);
});
test('issue201: source guard rejects replaced display, color, type and owner/DB mismatch',()=>{
 const f=wardrobe(),r=engine().styleOwnedCollection(f.items,{anchorItemId:'new-top'})[0];
 for(const mutate of [g=>{g.items[0].image='changed';},g=>{g.items[0].color='Red';},g=>{g.items[0].itemType='Blouse';},g=>{g.window.closetAuth.user.id='synthetic-b';},g=>{g.db.name='closet-current-user-synthetic-b';}]){
  const g=sourceGuard(f.items),sources=g.stylistSelectedSources(r.board);mutate(g);assert.equal(g.stylistSourcesCurrent(sources),false);
 }
});
test('issue201: actual recognition source selector uses unmasked RGB and refuses missing outfit crop',()=>{
 const c={},source=readFileSync('public/app.js','utf8');vm.createContext(c);
 vm.runInContext(source.slice(source.indexOf('function recognitionSourcePhoto('),source.indexOf('function clothingFields(')),c);
 const item=wardrobe().items[0],before=JSON.stringify(item);
 assert.equal(c.recognitionSourcePhoto(item),item.recognitionPhoto.image);
 assert.equal(c.recognitionSourcePhoto({...item,recognitionPhoto:null}),null);
 assert.equal(c.recognitionSourcePhoto({image:item.image}),item.image);assert.equal(JSON.stringify(item),before);
});
test('issue201: preview labels disclose approximate collage and no fit/fabric simulation; paid path not used',()=>{
 const s=readFileSync('public/reusable-figure-preview.js','utf8');
 assert.match(s,/APPROXIMATE collage/);assert.match(s,/not a fit or fabric simulation/);assert.match(s,/does not predict fit/);
 const f=wardrobe();validateSynthetic(f);assert.equal(report.paidInferenceActivated,false);
});
test('issue201: fixture admission rejects personal fields even when synthetic photo hashes match',()=>{
 for(const mutate of [f=>{f.items[0].email='fictitious@example.invalid';},f=>{f.ledger['new-top'].email='fictitious@example.invalid';}]){
  const f=wardrobe();mutate(f);assert.throws(()=>validateSynthetic(f),/personal/);
 }
});
test('issue201: actual batch import rejects exact repeated selection and decoder errors without a second garment',async()=>{
 const c={setTimeout,clearTimeout,Error,WeakSet};vm.createContext(c);vm.runInContext(readFileSync('public/photo-import.js','utf8'),c);
 const file={name:'synthetic.jpg',type:'image/jpeg',size:100},bad={name:'bad.jpg',type:'image/jpeg',size:100};let queued=0;
 const r=await c.readPhotoBatch([file,file,bad],async x=>{if(x===bad)throw Error('synthetic blank/unreadable decoder rejection');return wardrobe().items[0].image;},()=>{queued++;return true;});
 assert.equal(r.added,1);assert.equal(queued,1);assert.deepEqual(Array.from(r.results,x=>x.status),['added','duplicate','error']);
});
