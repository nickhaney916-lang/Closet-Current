import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readFileSync} from 'node:fs';
import {promisify} from 'node:util';
import {createHash,webcrypto} from 'node:crypto';
import {indexedDB} from 'fake-indexeddb';
import {atomicSaveGarments24,verifiedRecord24} from '../research/multi-garment-capture-01/atomic-group.mjs';
import {nearDuplicateSourceRegions67,overlapSourceRegions67,MIN_NEAR_DUPLICATE_IOU67} from '../research/multi-garment-capture-01/source-near-duplicate-67.mjs';
if(!globalThis.crypto?.subtle)globalThis.crypto=webcrypto;
const file=promisify(readFile);
const sha=b=>createHash('sha256').update(b).digest('hex');
const manualKey=r=>'manual-'+[r.x,r.y,r.width,r.height].map(x=>Math.round(x*1000)).join('-');
const origBox=()=>({x:.38,y:.055,width:.4,height:.345});
const movedBox=()=>({x:.382,y:.056,width:.4,height:.345});
const otherBox=()=>({x:.37,y:.38,width:.39,height:.5});
const crop=(id,box,changes={})=>({
 id,instanceKey:manualKey(box),manual:true,confirmed:true,cropReviewed:true,
 cropBounds:box,image:'data:image/jpeg;base64,/9j/2Q==',
 category:'Tops',itemType:'Button-down shirt',color:'White',...changes
});
async function fixture(){
 const bytes=readFileSync('benchmark/fixtures/commons-0003.jpg');
 const sourceSHA256=sha(bytes);
 const manifest=JSON.parse(readFileSync('benchmark/locked-photo-sources.json','utf8'));
 assert.ok(manifest.some(x=>x.id==='commons-0003'&&x.verified&&x.sha256===sourceSHA256));
 const image='data:image/jpeg;base64,'+bytes.toString('base64');
 return {image,sourceSHA256,sourceHashVerified:true,
  originalPhoto:{image,sha256:sourceSHA256,width:800,height:900,origin:'licensed-fixture'}};
}
const dbOpen=owner=>new Promise((resolve,reject)=>{
 const req=indexedDB.open('closet-current-user-'+owner,1);
 req.onupgradeneeded=()=>req.result.createObjectStore('items',{keyPath:'id'});
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});
const all=db=>new Promise((resolve,reject)=>{
 const r=db.transaction('items').objectStore('items').getAll();
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
const save=(db,owner,proof,pieces)=>atomicSaveGarments24({
 db,ownerId:owner,currentOwner:()=>owner,proof,pieces
});
const example=(p,owner='owner-a')=>verifiedRecord24({proof:p,ownerId:owner,piece:crop('top',origBox())});
test('NEARDUP67 detects changed rounded manual keys from real 1-2px re-crop of one photo',async()=>{
 const proof=await fixture(),one=example(proof);
 const two=verifiedRecord24({proof,ownerId:'owner-a',piece:crop('top-2',movedBox())});
 assert.notEqual(one.sourcePieceKey,two.sourcePieceKey);
 const iou=overlapSourceRegions67(one.extractionBounds,two.extractionBounds);
 assert.ok(iou>=MIN_NEAR_DUPLICATE_IOU67);
 assert.equal(nearDuplicateSourceRegions67([one],[two]).length,1);
});
test('NEARDUP67 same-source near duplicate cannot write a second item in a real owner-private transaction',async()=>{
 const proof=await fixture(),owner='neardup67-A',db=await dbOpen(owner);
 await save(db,owner,proof,[crop('first',origBox())]);
 await assert.rejects(save(db,owner,proof,[crop('second',movedBox())]),/near-duplicate/i);
 const rows=await all(db);
 assert.equal(rows.length,1);assert.equal(rows[0].sourceSHA256,proof.sourceSHA256);
 assert.equal(rows[0].originalPhoto.image,proof.image);
 db.close();
});
test('NEARDUP67 failed near-duplicate reimport aborts entire 2-item group, including unrelated jeans',async()=>{
 const proof=await fixture(),owner='neardup67-atomic',db=await dbOpen(owner);
 await save(db,owner,proof,[crop('first',origBox())]);
 const jeans=crop('jeans',otherBox(),{category:'Bottoms',itemType:'Jeans',color:'Blue'});
 await assert.rejects(save(db,owner,proof,[crop('second',movedBox()),jeans]),/near-duplicate/i);
 assert.deepEqual((await all(db)).map(x=>x.id),['first']);
 await save(db,owner,proof,[jeans]);
 assert.deepEqual((await all(db)).map(x=>x.id).sort(),['first','jeans']);
 db.close();
});
test('NEARDUP67 same group cannot contain 2 rounded-key-different near-identical manual proposals',async()=>{
 const proof=await fixture(),owner='neardup67-within',db=await dbOpen(owner);
 await assert.rejects(save(db,owner,proof,[crop('first',origBox()),crop('second',movedBox())]),/near-duplicate/i);
 assert.equal((await all(db)).length,0);
 db.close();
});
test('NEARDUP67 distinct overlapping genuine source regions with same category/type/color remain eligible',async()=>{
 const proof=await fixture(),owner='neardup67-separate',db=await dbOpen(owner);
 const first=origBox(),separate={x:.43,y:.08,width:.4,height:.345};
 assert.ok(overlapSourceRegions67(first,separate)<MIN_NEAR_DUPLICATE_IOU67);
 await save(db,owner,proof,[crop('first',first),crop('distinct',separate)]);
 assert.equal((await all(db)).length,2);
 db.close();
});
test('NEARDUP67 different confirmed subtype/color/category are NOT silently merged, even for identical bounds',async()=>{
 const proof=await fixture(),first=example(proof);
 for(const changes of [
  {itemType:'T-shirt'},
  {color:'Black'},{color:'BLUE'},
  {category:'Bottoms',itemType:'Jeans'}
 ]){
  const p=crop('different',movedBox(),changes);
  const second=verifiedRecord24({proof,ownerId:'owner-a',piece:p});
  assert.deepEqual(nearDuplicateSourceRegions67([first],[second]),[],
   'Different genuinely reviewed clothing identity cannot be silently merged');
 }
});
test('NEARDUP67 different owners and source photo IDs never cross-compare',async()=>{
 const proof=await fixture(),first=example(proof),next=verifiedRecord24({
  proof,ownerId:'owner-b',piece:crop('next',movedBox())
 });
 assert.deepEqual(nearDuplicateSourceRegions67([first],[next]),[]);
 const otherSource={...next,ownerId:'owner-a',sourceSHA256:'b'.repeat(64),
  sourcePieceKey:'b'.repeat(64)+'/manual-382-56-400-345',
  originalPhoto:{...next.originalPhoto,sha256:'b'.repeat(64)}};
 assert.deepEqual(nearDuplicateSourceRegions67([first],[otherSource]),[]);
});
test('NEARDUP67 two independent segmentation instances remain separate despite close boxes',async()=>{
 const proof=await fixture(),one=example(proof),other=verifiedRecord24({
  proof,ownerId:'owner-a',piece:crop('seg',movedBox(),{
   manual:false,instanceKey:'seg-0-382-56-400-345-2'
  })
 });
 const autoA={...one,sourcePieceKey:proof.sourceSHA256+'/seg-0-380-55-400-345-1'};
 assert.deepEqual(nearDuplicateSourceRegions67([autoA],[other]),[]);
 assert.equal(nearDuplicateSourceRegions67([one],[other]).length,1,
  'Manual repeat of an already automatically reviewed garment must be blocked');
});
test('NEARDUP67 unreviewed or unverified source claims do NOT become authoritative duplicate evidence',async()=>{
 const proof=await fixture(),one=example(proof),other=verifiedRecord24({
  proof,ownerId:'owner-a',piece:crop('other',movedBox())
 });
 for(const mutate of [
  {sourceHashVerified:false},{sourceCropReviewed:false},
  {extractionReview:'unverified'},{sourcePieceKey:'forged'},
  {originalPhoto:{sha256:'a'.repeat(64)}}
 ])assert.deepEqual(nearDuplicateSourceRegions67([{...one,...mutate}],[other]),[]);
});
test('NEARDUP67 malformed crop bounds and unsafe no-source objects cannot trigger spurious duplicate',()=>{
 const rect=origBox();
 assert.equal(overlapSourceRegions67(rect,{...rect,x:Infinity}),0);
 assert.equal(overlapSourceRegions67(rect,{...rect,width:-1}),0);
 assert.equal(overlapSourceRegions67(rect,{...rect,x:1.1}),0);
 assert.equal(overlapSourceRegions67(rect,null),0);
 assert.equal(overlapSourceRegions67(rect,{x:0,y:0,width:.05,height:.05}),0);
 assert.deepEqual(nearDuplicateSourceRegions67(null,[]),[]);
 assert.deepEqual(nearDuplicateSourceRegions67([{}],[{}]),[]);
});
test('NEARDUP67 does not regress exact-key duplicate check or category/type/color human review gate',async()=>{
 const proof=await fixture(),owner='neardup67-review',db=await dbOpen(owner);
 const prior=crop('original',origBox());
 await save(db,owner,proof,[prior]);
 await assert.rejects(save(db,owner,proof,[{...prior,id:'duplicate'}]),/duplicate/i);
 await assert.rejects(save(db,owner,proof,[{...crop('not-reviewed',movedBox()),cropReviewed:false}]),/crop review/i);
 assert.equal((await all(db)).length,1);
 db.close();
});
test('NEARDUP67 narrowed research implementation keeps image, owner, index and V4 structure unchanged',()=>{
 const src=readFileSync('research/multi-garment-capture-01/atomic-group.mjs','utf8');
 assert.match(src,/nearDuplicateSourceRegions67\(existing,records\)/);
 assert.match(src,/nearDuplicateSourceRegions67\(records\.slice\(0,i\),\[row\]\)/);
 assert.ok(src.indexOf('nearDuplicateSourceRegions67(existing,records)')>
  src.indexOf('const lookup=store.getAll()'),
  'Authoritative near-duplicate check must run inside readwrite transaction');
 assert.match(src,/duplicatePieceKeys24\(existing,records\)/);
 assert.match(src,/sourceHashVerified:true,singleGarmentVerified:false/);
 assert.match(src,/threeDReady:false,photoOnly:true/);
});
