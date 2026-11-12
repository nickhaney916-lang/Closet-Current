import test from 'node:test';
import assert from 'node:assert/strict';
import {guardedSubtypeVerdict835,corroborateOriginalSubtype835} from '../public/phone-photo-subtype-guard-835.mjs';
import {localCandidates} from '../public/local-catalog.mjs';
import {phonePhotoResult,lockPhotoLabels,scorePhonePhotos} from '../public/phone-photo-benchmark.mjs';
import {compareSubtypeSafety835} from '../scripts/compare-m1-subtype-835.mjs';
import {readFile} from 'node:fs/promises';

const prompt=(category,type)=>localCandidates.find(x=>x.category===category&&x.itemType===type).label;
const vector=(category,type,runnerCategory='Tops',runnerType='Blouse')=>[
 {label:prompt(category,type),score:.8},
 {label:prompt(runnerCategory,runnerType),score:.1}
];
const automatic=(category='Tops',type='T-shirt')=>({
 strong:true,categoryConfirmed:false,choices:[{category,itemType:type,label:prompt(category,type),score:.9}],
 details:{color:'Blue',pattern:'Striped'}
});
test('P835 corroborating full-source and center-source top subtype retains original accepted garment and verified details',()=>{
 const raw=automatic(),r=guardedSubtypeVerdict835(raw,vector('Tops','T-shirt'),vector('Tops','T-shirt'));
 assert.equal(r.strong,true);
 assert.deepEqual(r.details,{color:'Blue',pattern:'Striped'});
 assert.deepEqual(r.subtypeSafety835,{outcome:'retained',categoryAgreed:true,subtypeAgreed:true});
});
test('P835 same category but alternate subtype mismatch forces category-only REVIEW, not automatic success or color',()=>{
 const raw=automatic();
 const r=guardedSubtypeVerdict835(raw,vector('Tops','Sweatshirt'),vector('Tops','T-shirt'));
 assert.equal(r.strong,false);assert.equal(r.categoryConfirmed,true);
 assert.equal(r.categoryOnly,true);assert.equal(r.choices[0].category,'Tops');
 assert.equal(r.choices[0].itemType,'Unknown');
 assert.deepEqual(r.details,{});
 assert.equal(r.reason,'subtype_cross_view_review');
 const [label]=lockPhotoLabels([{category:'Tops',type:'T-shirt',color:'Blue'}]);
 const report=scorePhonePhotos([label],[phonePhotoResult(label.id,r,7)]);
 assert.equal(report.summary.automatic,0);
 assert.equal(report.summary.incorrectAutomaticTypes,0);
 assert.equal(report.summary.categoryMatches,1);
 assert.equal(report.summary.typeMatches,0);
 assert.equal(report.summary.colorUnreported,1);
 assert.equal(report.photos[0].reason,'subtype_cross_view_review');
});
test('P835 contradiction on broad category means uncertain; do not manufacture a correct category',()=>{
 const r=guardedSubtypeVerdict835(automatic(),vector('Outerwear','Jacket'),vector('Tops','T-shirt'));
 assert.equal(r.strong,false);assert.equal(r.categoryConfirmed,false);
 assert.deepEqual(r.choices,[]);
 assert.equal(r.reason,'subtype_cross_view_review');
});
test('P835 two low-confidence alternate views do not retain auto category or subtype',()=>{
 const weak=[
 {label:prompt('Tops','T-shirt'),score:.12},
 {label:prompt('Tops','Blouse'),score:.09},
 ];
 const r=guardedSubtypeVerdict835(automatic(),weak,weak);
 assert.equal(r.strong,false);assert.equal(r.categoryConfirmed,true);
 assert.equal(r.choices[0].itemType,'Unknown');
});
test('P835 unchanged already-uncertain source does NOT incur new image embedding or fabricated classification',async()=>{
 const raw={strong:false,choices:[],reason:'category_uncertain',details:{}};
 let calls=0;
 const r=await corroborateOriginalSubtype835(raw,{},{
  wholeView:()=>{calls++;throw Error('PRIVATE_DATA')},
  centerView:()=>{calls++;throw Error('PRIVATE_DATA')}
 });
 assert.equal(r,raw);assert.equal(calls,0);
});
test('P835 missing or crashed alternate view fails closed without original JPEG or personal error leakage',async()=>{
 for(const deps of [
  {},{wholeView:async()=>{throw Error('PRIVATE_FULL_PATH')} ,centerView:async()=>vector('Tops','T-shirt')},
  {wholeView:async()=>vector('Tops','T-shirt'),centerView:async()=>null}
 ]){
  const r=await corroborateOriginalSubtype835(automatic(),{},deps);
  assert.equal(r.strong,false);
  assert.equal(r.categoryConfirmed,false);
  assert.deepEqual(r.choices,[]);
  assert.deepEqual(r.details,{});
  assert.ok(!JSON.stringify(r).includes('PRIVATE'));
 }
});
test('P835 fails closed on fake labels, impossible source scores, wrong MIME-derived classifier result',()=>{
 const garbage=guardedSubtypeVerdict835(automatic(),[
  {label:prompt('Tops','T-shirt'),score:Number.NaN}
 ],vector('Tops','T-shirt'));
 assert.equal(garbage.strong,false);
 const unknown=guardedSubtypeVerdict835({strong:true,choices:[{category:'PRIVATE_OWNER',itemType:'T-shirt'}],details:{color:'Blue'}},[],[]);
 assert.equal(unknown.strong,false);
 assert.deepEqual(unknown.choices,[]);
});
test('P835 entirely unchanged original classifier and catalog subtype are required before a strict audit',async()=>{
 const types=['Sneakers','Ankle boots'];
 for(const type of types){
  const raw=automatic('Shoes',type);
  const r=await corroborateOriginalSubtype835(raw,{},{
   wholeView:async()=>vector('Shoes',type,'Shoes',type==='Sneakers'?'Ankle boots':'Sneakers'),
   centerView:async()=>vector('Shoes',type,'Shoes',type==='Sneakers'?'Ankle boots':'Sneakers')
  });
  assert.equal(r.strong,true);
 }
});

const historical=JSON.parse(await readFile('benchmark/manifest-holdout-16.json','utf8'));
function syntheticComparison835(){
 const row=source=>({
  id:source.id,expectedCategory:source.expectedCategory,expectedType:source.expectedType,
  strong:source.expectedCategory!=='Uncategorized',
  categoryMatch:true,
  predictedCategory:source.expectedCategory==='Uncategorized'?null:source.expectedCategory,
  predictedType:source.expectedCategory==='Uncategorized'?null:source.expectedType,
  acceptedTypeMatch:source.expectedCategory==='Uncategorized'?null:true,
  negativeRejected:source.expectedCategory==='Uncategorized'?true:null,
  error:null
 });
 const original=historical.map(row),guarded=historical.map(row);
 for(const item of original.filter(x=>x.id==='commons-0003')){
  item.predictedType='Sweatshirt';item.acceptedTypeMatch=false;
 }
 for(const item of guarded.filter(x=>x.id==='commons-0003')){
  item.strong=false;item.predictedType='Unknown';item.acceptedTypeMatch=false;
 }
 const pack=(source,wrong)=>{
  const browser={
   rows:structuredClone(source),automaticWrongSubtype:wrong,
   categoryMatches:source.filter(x=>x.categoryMatch&&x.expectedCategory!=='Uncategorized').length,
   negatives:3,negativeRejected:3,garments:13
  };
  return {format:'closet-current-m1-real16-unchanged-model-diagnostic/v1',
   sourceIds:historical.map(x=>x.id),sourceCount:16,noHumanBlindAccuracyClaim:true,
   browsers:{chromium:structuredClone(browser),webkit:structuredClone(browser)}};
 };
 return [pack(original,1),pack(guarded,0)];
}
test('P835 exact original-ID comparator counts a prevented wrong automatic subtype and no invented category improvement',()=>{
 const [base,guard]=syntheticComparison835();
 const r=compareSubtypeSafety835(base,guard);
 assert.equal(r.browser.chromium.wrongAutomaticSubtypePrevented,1);
 assert.equal(r.browser.webkit.wrongAutomaticSubtypePrevented,1);
 assert.equal(r.browser.chromium.correctAutomaticSubtypeLost,0);
 assert.equal(r.browser.chromium.negativeRejectedAfter,3);
 assert.equal(r.browser.webkit.rowChanges.length,16);
 assert.equal(r.notBlind,true);
});
test('P835 comparator rejects fabricated strong label, reordered originals or bogus reduction in incorrect auto types',()=>{
 for(const mutation of [
  ([,g])=>{g.browsers.chromium.rows.reverse();},
  ([,g])=>{g.browsers.webkit.rows[0].strong=true;g.browsers.webkit.rows[0].predictedType='Sneakers';},
  ([,g])=>{g.browsers.webkit.automaticWrongSubtype=7;},
  ([,g])=>{g.browsers.webkit.negativeRejected=2;},
  ([b])=>{b.sourceIds.pop();},
  ([,g])=>{g.noHumanBlindAccuracyClaim=false;}
 ]){
  const reports=syntheticComparison835();
  mutation(reports);
  assert.throws(()=>compareSubtypeSafety835(...reports),/BASELINE_COMPARISON_FAIL/);
 }
});
