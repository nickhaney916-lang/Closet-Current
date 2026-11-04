import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {proposeUnclassifiedContrast33,scoreReviewLocalization33,boxIoU33}
 from '../research/auto-segmentation-accuracy-33/contrast-rescue-33.mjs';
const sha='a'.repeat(64);
const proof={sourceHashVerified:true,sourceSHA256:sha,originalPhoto:{sha256:sha}};
function photo(w=200,h=150,bg=[249,249,249]) {
 const data=new Uint8Array(w*h*4);
 for(let i=0;i<w*h;i++){data.set([...bg,255],i*4);}
 return {data,width:w,height:h,channels:4,
  fill(x0,y0,x1,y1,rgb){for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)
   data.set([...rgb,255],(y*w+x)*4);}
 };
}
test('strict source proof rejects missing, changed, and wrong-size original SHA',()=>{
 const img=photo();
 for(const bad of [{...proof,sourceHashVerified:false},{...proof,sourceSHA256:'b'.repeat(64)},
  {...proof,originalPhoto:{sha256:'b'.repeat(64)}},null]){
  assert.throws(()=>proposeUnclassifiedContrast33({photo:img,sourceProof:bad}),/proof/);
 }
});
test('real bounded RGB photo pixel proposals are always category/color agnostic, unsaved and unconfirmed',()=>{
 const img=photo();
 img.fill(22,20,76,98,[16,50,170]);
 img.fill(115,23,165,94,[175,25,60]);
 const original=Buffer.from(img.data),hash=createHash('sha256').update(original).digest('hex');
 const result=proposeUnclassifiedContrast33({photo:img,sourceProof:proof});
 assert.equal(result.eligible,true);
 assert.equal(result.proposals.length,2);
 for(const p of result.proposals){
  assert.equal(p.semanticClass,null);assert.equal(p.color,'');
  assert.equal(p.category,'Uncategorized');assert.equal(p.itemType,'Unknown');
  assert.equal(p.needsReview,true);assert.equal(p.confirmed,false);
  assert.equal(p.cropReviewed,false);assert.equal(p.automaticSaveAllowed,false);
  assert.equal(p.instanceSeparationClaimed,false);assert.equal(p.sourceSHA256,sha);
 }
 assert.equal(createHash('sha256').update(img.data).digest('hex'),hash);
 assert.deepEqual(img.data,original);
});
test('matching known model crop suppresses only near-duplicate region, not unrelated garments',()=>{
 const img=photo();img.fill(24,20,75,100,[25,50,145]);img.fill(115,22,168,100,[169,35,75]);
 const all=proposeUnclassifiedContrast33({photo:img,sourceProof:proof}).proposals;
 assert.equal(all.length,2);
 const one=proposeUnclassifiedContrast33({photo:img,sourceProof:proof,
  existing:[{crop:all[0].box}]}).proposals;
 assert.equal(one.length,1);
 assert.notDeepEqual(one[0].box,all[0].box);
});
test('low contrast, nonuniform background and empty photos fail safely without inventing garment identity',()=>{
 const empty=proposeUnclassifiedContrast33({photo:photo(),sourceProof:proof});
 assert.equal(empty.proposals.length,0);
 const pale=photo();pale.fill(30,30,120,110,[236,236,235]);
 assert.equal(proposeUnclassifiedContrast33({photo:pale,sourceProof:proof}).proposals.length,0);
 const clutter=photo();clutter.fill(0,0,18,18,[0,10,20]);
 clutter.fill(180,0,200,18,[10,180,30]);clutter.fill(0,132,18,150,[120,20,180]);
 assert.equal(proposeUnclassifiedContrast33({photo:clutter,sourceProof:proof}).eligible,false);
});
test('touching color components are NOT falsely split into two verified garments',()=>{
 const img=photo();img.fill(25,22,86,101,[25,50,140]);img.fill(86,22,148,101,[225,155,25]);
 const proposals=proposeUnclassifiedContrast33({photo:img,sourceProof:proof}).proposals;
 assert.equal(proposals.length,1);
 assert.equal(proposals[0].instanceSeparationClaimed,false);
 assert.equal(proposals[0].category,'Uncategorized');
});
test('independent class-free IoU scoring never credits semantic category labels or human pixel IoU',()=>{
 const expected=[{family:'upper',box:{x:.1,y:.2,width:.3,height:.4}},
  {family:'upper',box:{x:.55,y:.2,width:.3,height:.4}}];
 const predicted=[{family:'dress',box:{...expected[0].box}},
  {family:'skirt',box:{...expected[1].box}}];
 const s=scoreReviewLocalization33(expected,predicted);
 assert.equal(s.correctlyLocalized,2);
 assert.equal(s.semanticCategoryAccuracy,null);
 assert.equal(s.independentlyVerifiedPixelIoU,null);
 assert.equal(boxIoU33(expected[0].box,expected[1].box),0);
 assert.throws(()=>boxIoU33({x:-1,y:0,width:1,height:1},expected[0].box));
});
test('research helper has no gallery, cloud, credential, model-weight, source-byte writes',()=>{
 const code=readFileSync('research/auto-segmentation-accuracy-33/contrast-rescue-33.mjs','utf8');
 for(const t of ['fetch(','.postMessage(','.insert(','.upsert(','localStorage','indexedDB',
  'supabase','toDataURL','writeFile','sendBeacon','navigator.mediaDevices'])
  assert.ok(!code.includes(t),'unexpected data write channel '+t);
});
