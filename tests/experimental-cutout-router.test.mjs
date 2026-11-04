import test from 'node:test';
import assert from 'node:assert/strict';
import {proposeCutoutRoute,summarizeCutoutRoutes} from '../benchmark/experimental-cutout-router.mjs';
const base={category:'Dresses',personDetected:true,semanticPixels:3442,
  objectPixels:1897716,retainedPixels:1193310,retentionRatio:1193310/1897716,sourceVerified:true};
test('worn dress and mannequin get garment-guided proposal, not auto approval',()=>{
  const d=proposeCutoutRoute(base);
  assert.equal(d.candidate,'clothing-guided-hybrid');
  assert.equal(d.originalSourcePreserved,true);
  assert.equal(d.productionAuthorized,false);
  assert.equal(d.cutoutQualityVerified,false);
});
test('failed blue dress semantic mask preserves original, never microscopic fragments',()=>{
  const d=proposeCutoutRoute({...base,semanticPixels:8,objectPixels:86883,
    retainedPixels:2034,retentionRatio:2034/86883});
  assert.equal(d.candidate,'original-source');
  assert.equal(d.reason,'dress-segmentation-weak-preserve-original');
});
test('studio sneaker chooses object contour, not lossy semantic hybrid',()=>{
  const d=proposeCutoutRoute({...base,category:'Shoes',personDetected:false,
    semanticPixels:676,objectPixels:906944,retainedPixels:137886,
    retentionRatio:137886/906944});
  assert.equal(d.candidate,'object-alpha-only');
  assert.equal(d.productionAuthorized,false);
});
test('person-detected jeans use safe fallback, isolated jeans may suggest object mask',()=>{
  const jeans={...base,category:'Bottoms',semanticPixels:4674,
    objectPixels:1742119,retainedPixels:1675484,retentionRatio:1675484/1742119};
  assert.equal(proposeCutoutRoute(jeans).candidate,'original-source');
  assert.equal(proposeCutoutRoute({...jeans,personDetected:false}).candidate,'object-alpha-only');
});
test('bad source, empty object mask and poor photo fail closed',()=>{
 assert.equal(proposeCutoutRoute({...base,captureQuality:'poor'}).candidate,'original-source');
 assert.equal(proposeCutoutRoute({...base,objectPixels:0,retainedPixels:0,retentionRatio:0}).candidate,'original-source');
 assert.throws(()=>proposeCutoutRoute({...base,sourceVerified:false}));
 assert.throws(()=>proposeCutoutRoute({...base,retentionRatio:1.3}));
 assert.throws(()=>proposeCutoutRoute({...base,captureQuality:'excellent'}));
});
test('five measured scenarios get safe distinct experimental route proposals',()=>{
 const rows=[
  {id:'validation-0001',...base},
  {id:'validation-0003',...base,semanticPixels:4304,objectPixels:968508,
    retainedPixels:876402,retentionRatio:876402/968508},
  {id:'validation-0010',...base,semanticPixels:8,objectPixels:86883,
    retainedPixels:2034,retentionRatio:2034/86883},
  {id:'validation-0017',...base,category:'Bottoms',semanticPixels:4674,objectPixels:1742119,
    retainedPixels:1675484,retentionRatio:1675484/1742119},
  {id:'validation-0019',...base,category:'Shoes',personDetected:false,
    semanticPixels:676,objectPixels:906944,retainedPixels:137886,
    retentionRatio:137886/906944}
 ];
 const s=summarizeCutoutRoutes(rows);
 assert.deepEqual(s.counts,{original:2,object:1,hybrid:2});
 assert.equal(s.accuracyPercentage,null);
 assert.equal(s.productionAuthorized,false);
 assert.equal(s.noAutomaticReplacementOfOriginal,true);
 assert.deepEqual(s.cases.map(x=>x.candidate),[
  'clothing-guided-hybrid','clothing-guided-hybrid','original-source','original-source','object-alpha-only'
 ]);
});
