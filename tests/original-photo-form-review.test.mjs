import test from 'node:test';
import assert from 'node:assert/strict';
import {originalFormReviewQueue} from '../benchmark/original-photo-form-review.mjs';
const h='a'.repeat(64);
const make=(id,category,type,title,modelType,positive=true)=>({
 manifest:{id,image:id+'.jpg',mode:'single',verified:true,expectedCategory:category,expectedType:type,source:'https://commons.wikimedia.org/wiki/File:'+id},
 locked:{id,image:id+'.jpg',verified:true,sha256:h,attribution:{title,source:'https://commons.wikimedia.org/wiki/File:'+id,license:'CC0'}},
 result:{id,prediction:positive?{category,type:modelType}:{category:null,type:null},strong:positive}
});
test('real-photo mismatch and possible multi-item source are review questions, not known ground truth',()=>{
 const a=make('commons-0003','Tops','T-shirt','Black long-sleeve shirt','Sweatshirt'),
 b=make('commons-0059','Dresses','Dress','Dress and jacket','Dress',false),
 c=make('commons-0077','Shoes','Sneakers','Sneakers','Sneakers');
 const q=originalFormReviewQueue([a.manifest,b.manifest,c.manifest],
  [a.locked,b.locked,c.locked],[a.result,b.result,c.result]);
 assert.equal(q.originalSourcePhotos,3);
 assert.deepEqual(q.strongWrongTypeVsManifestIds,['commons-0003']);
 assert.deepEqual(q.multipleItemTitleCueIds,['commons-0059']);
 assert.ok(q.rows.find(x=>x.sourceId==='commons-0059').flags.includes('garment-category-abstained'));
 assert.deepEqual(q.rows.find(x=>x.sourceId==='commons-0077').flags,[]);
 assert.equal(q.categoryAccuracyAfterIndependentReview,null);
 assert.equal(q.formAccuracyAfterIndependentReview,null);
 assert.equal(q.physicalItemRecall,null);
 assert.equal(q.independentHumanRecords,0);
 assert.equal(q.customerAutoSaves,0);
 assert.equal(q.modelPolicyChanged,false);
 assert.ok(q.rows.every(x=>x.independentlyApproved===false&&x.physicalGarmentsInSource===null));
});
test('missing or duplicated model records, sources or mismatched SHA provenance fail closed',()=>{
 const a=make('commons-0003','Tops','T-shirt','Shirt','Sweatshirt');
 assert.throws(()=>originalFormReviewQueue([a.manifest],[],[a.result]),/Missing SHA-locked/);
 assert.throws(()=>originalFormReviewQueue([a.manifest],[a.locked],[]),/Missing SHA-locked/);
 assert.throws(()=>originalFormReviewQueue([a.manifest,a.manifest],[a.locked],[a.result]),/duplicate source/i);
 assert.throws(()=>originalFormReviewQueue([a.manifest],[a.locked],[a.result,a.result]),/duplicate/i);
 assert.throws(()=>originalFormReviewQueue([a.manifest],[{...a.locked,sha256:'bad'}],[a.result]),/SHA-locked/);
 assert.throws(()=>originalFormReviewQueue([a.manifest],[{...a.locked,attribution:{...a.locked.attribution,source:'https://example.com'}}],[a.result]),/SHA-locked/);
 assert.throws(()=>originalFormReviewQueue([a.manifest],[a.locked],[a.result,{id:'extra'}]),/Extra\/missing/);
});
test('reference names can be uncertain; source titles alone never prove multiple physical garments',()=>{
 const a=make('commons-0059','Dresses','Dress','Dress and jacket','Dress');
 const q=originalFormReviewQueue([a.manifest],[a.locked],[a.result]);
 assert.equal(q.multipleItemTitleCueIds.length,1);
 assert.equal(q.rows[0].modelResult.formMatchToUnadjudicatedManifest,true);
 assert.equal(q.rows[0].physicalGarmentsInSource,null);
 assert.equal(q.rows[0].reviewedPhysicalGarmentForms,null);
 assert.equal(q.rows[0].fullSourceItemRecall,null);
 assert.equal(q.productionReady,false);
});
