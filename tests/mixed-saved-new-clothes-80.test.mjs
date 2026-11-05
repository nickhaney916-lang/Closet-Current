import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {verifiedRecord24} from '../research/multi-garment-capture-01/atomic-group.mjs';
import {overlapSourceRegions67} from '../research/multi-garment-capture-01/source-near-duplicate-67.mjs';
import {partitionPreviouslySaved80,MIXED_REVIEW_PROMPT80} from '../research/multi-garment-capture-01/previously-saved-review-80.mjs';
const bytes=readFileSync('benchmark/fixtures/commons-0003.jpg');
const sourceSHA256=createHash('sha256').update(bytes).digest('hex');
const image='data:image/jpeg;base64,'+bytes.toString('base64');
const proof={image,sourceSHA256,sourceHashVerified:true,originalPhoto:{image,sha256:sourceSHA256}};
const ownerId='mixed80-owner-A';
const mk=(id,key,box,category='Tops',itemType='T-shirt',color='White')=>({
 id,instanceKey:key,manual:true,cropReviewed:true,confirmed:true,image:'data:image/jpeg;base64,/9j/2Q==',
 category,itemType,color,cropBounds:box
});
const a={x:.1,y:.1,width:.35,height:.3},shift={x:.101,y:.101,width:.35,height:.3},
 b={x:.2,y:.48,width:.32,height:.38};
const shirt=mk('shirt','manual-100-100-350-300',a);
const jeans=mk('jeans','manual-200-480-320-380',b,'Bottoms','Jeans','Blue');
const old=verifiedRecord24({proof,ownerId,piece:shirt});

test('MIXED80 exact same source/id and newly reviewed garment are independently partitioned',()=>{
 const result=partitionPreviouslySaved80({saved:[old],pieces:[
  {...shirt,id:'reimported-shirt'},jeans],proof,ownerId});
 assert.deepEqual(result.duplicates.map(x=>x.id),['reimported-shirt']);
 assert.deepEqual(result.exact.map(x=>x.id),['reimported-shirt']);
 assert.deepEqual(result.fresh.map(x=>x.id),['jeans']);
 assert.equal(result.near.length,0);
 assert.match(MIXED_REVIEW_PROMPT80,/Existing closet items will not be overwritten/);
 assert.match(MIXED_REVIEW_PROMPT80,/Choose Cancel to keep every review card unchanged/);
});
test('MIXED80 near-identical same owner source/category/subtype/color manual re-crop cannot slip past duplicate skip',()=>{
 const shifted=mk('re-cropped','manual-101-101-350-300',shift);
 assert.ok(overlapSourceRegions67(a,shift)>=.98);
 const r=partitionPreviouslySaved80({saved:[old],pieces:[shifted,jeans],proof,ownerId});
 assert.equal(r.near.length,1);
 assert.equal(r.duplicates[0],shifted);
 assert.equal(r.fresh[0],jeans);
});
test('MIXED80 distinct garment cropped elsewhere is not silently suppressed',()=>{
 const r=partitionPreviouslySaved80({saved:[old],pieces:[jeans],proof,ownerId});
 assert.deepEqual(r.fresh,[jeans]);
 assert.deepEqual(r.duplicates,[]);
});
test('MIXED80 same source different confirmed subtype or color never conflates distinct human reviews based on near overlap',()=>{
 for(const different of [
  {...shirt,id:'navy',instanceKey:'manual-101-101-350-300',cropBounds:shift,color:'Navy'},
  {...shirt,id:'shirt2',instanceKey:'manual-101-101-350-300',cropBounds:shift,itemType:'Sweatshirt'}
 ]){
  const r=partitionPreviouslySaved80({saved:[old],pieces:[different],proof,ownerId});
  assert.equal(r.duplicates.length,0);
 }
});
test('MIXED80 never reaches across owner, original JPEG or foreign account rows',()=>{
 const otherOwner=partitionPreviouslySaved80({saved:[{...old,ownerId:'other'}],pieces:[shirt],proof,ownerId});
 assert.equal(otherOwner.duplicates.length,0);
 const otherProof={...proof,sourceSHA256:'a'.repeat(64),
  originalPhoto:{...proof.originalPhoto,sha256:'a'.repeat(64)}};
 const otherSource=partitionPreviouslySaved80({saved:[old],pieces:[shirt],proof:otherProof,ownerId});
 assert.equal(otherSource.duplicates.length,0);
});
test('MIXED80 never mutates saved rows, live review or source proof',()=>{
 const originals=[old],confirmed=[{...shirt},jeans];
 const cloned=structuredClone({originals,confirmed,proof});
 partitionPreviouslySaved80({saved:originals,pieces:confirmed,proof,ownerId});
 assert.deepEqual({originals,confirmed,proof},cloned);
});
test('MIXED80 malformed proof or missing owner fails closed',()=>{
 for(const change of [
  {proof:{...proof,sourceHashVerified:false}},
  {proof:{...proof,originalPhoto:{sha256:'b'.repeat(64)}}},
  {ownerId:''},{pieces:null},{saved:null}
 ])assert.throws(()=>partitionPreviouslySaved80({
  saved:[old],pieces:[jeans],proof,ownerId,...change
 }),/invalid signed-owner/);
});
test('MIXED80 native UI requires explicit consent, preserves reviewed cards on refusal, and retains owner-private atomic guard',()=>{
 const ui=readFileSync('research/multi-garment-capture-01/review-ui.mjs','utf8');
 const pre=ui.indexOf('partitionPreviouslySaved80({saved:existing,pieces:snapshots,proof,ownerId:owner})');
 const prompt=ui.indexOf('window.confirm(' ,pre);
 const declined=ui.indexOf('if(!approved)',prompt);
 const atom=ui.indexOf('const rows=await queued(()=>atomicSaveGarments24({',declined);
 assert.ok(pre>0&&prompt>pre&&declined>prompt&&atom>declined);
 assert.match(ui.slice(declined,atom),/Mixed save canceled.*Every reviewed garment/);
 assert.match(ui.slice(prompt,atom),/snapshots=partition.fresh/);
 assert.match(ui,/view\.pieces=view\.pieces\.filter\(x=>!savedIds\.has\(x\.id\)\)/);
 assert.match(ui,/currentOwner:\(\)=>currentReview\(view,epoch\)\?getOwner\(\):null/);
 assert.match(ui,/if\(!currentReview\(view,epoch\)\)return/);
});
test('MIXED80 real native licensed original JPEG browser mixed batch and screenshot evidence are mandatory',()=>{
 const script=readFileSync('scripts/test-multi-garment-capture-01-browser.mjs','utf8');
 for(const mark of ["const mixed80=process.env.MIXED80==='1'",
  '02a-mixed-duplicate-dismiss-keeps-new-confirmed-all',
  '02b-approve-skip-saved-shirt-save-jeans-shoes-all',
  'mixedPreviouslySavedAndNew80:mixed80'
 ])assert.ok(script.includes(mark),mark);
});
