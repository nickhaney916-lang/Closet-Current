import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {
 suggestThreeNativeOwned03,validateOwnedSwap03,eligibleSlot03,pinnedSlot03,
 signature03,STYLE_OWNED_03
} from '../research/style-owned-live-03/three-owned-looks-native.mjs';
import {verifiedPrivateStyleRoster03} from '../research/style-owned-live-03/native-style-panel.mjs';
const owner='test-owner-A',sha=i=>String(i).repeat(64);
const mk=(id,category,itemType,color='Black',o=owner)=>({
 id,ownerId:o,category,itemType,color,sourceSHA256:sha((id.charCodeAt(0)%9)+1),
 sourceVerified:true,categoryConfirmed:true,userAdjusted:true
});
const tops=()=>[
 mk('a-new-red','Tops','T-shirt','Red'),mk('b-blue','Tops','T-shirt','Blue'),
 mk('c-jeans','Bottoms','Jeans','Blue'),mk('d-pants','Bottoms','Pants','Black'),
 mk('e-sneakers','Shoes','Sneakers','White'),mk('f-boots','Shoes','Boots','Black'),
 mk('g-jacket','Outerwear','Jacket','Gray'),mk('h-coat','Outerwear','Coat','Navy'),
 mk('i-dress','Dresses','Casual dress','Black')
];
test('adapt actual PR547 source algorithm: three different real owned looks with pinned newly photographed top',()=>{
 const items=tops(),before=structuredClone(items);
 const result=suggestThreeNativeOwned03(items,{ownerId:owner,pinnedId:'a-new-red',occasion:'Casual'});
 assert.equal(result.status,'three-owned-outfits');
 assert.equal(result.combinations.length,3);
 assert.equal(new Set(result.combinations.map(x=>signature03(x.slots))).size,3);
 assert.equal(result.combinations.every(look=>!(look.slots.layer2&&look.slots.layer3)),true,
  'Casual owned looks must not suggest contradictory extra jacket+coat stacks');
 const byId=new Map(items.map(x=>[x.id,x]));
 for(const p of result.combinations){
  assert.equal(p.slots.top,'a-new-red');
  assert.ok(p.slots.bottom&&p.slots.shoes);
  assert.ok(Object.values(p.slots).every(id=>byId.has(id)));
  assert.equal(new Set(Object.values(p.slots)).size,Object.keys(p.slots).length);
  assert.equal(p.certified3D,false);
  for(const [id,hash]of Object.entries(p.sourceSHA256ById))
   assert.equal(byId.get(id).sourceSHA256,hash);
 }
 assert.deepEqual(items,before,'never mutate saved item rows');
 assert.equal(STYLE_OWNED_03.productionAuthorized,false);
});
test('corrected pants and independently owned shoes can be pinned without ID substitution',()=>{
 const rows=tops();
 for(const id of ['c-jeans','e-sneakers']){
  const result=suggestThreeNativeOwned03(rows,{ownerId:owner,pinnedId:id});
  assert.equal(result.combinations.length,3);
  for(const p of result.combinations)assert.ok(Object.values(p.slots).includes(id));
 }
});
test('one-piece dress never fabricates pants and supports separate coats, shoes and jackets',()=>{
 const rows=tops(),result=suggestThreeNativeOwned03(rows,{ownerId:owner,pinnedId:'i-dress'});
 assert.equal(result.combinations.length,3);
 assert.ok(result.combinations.every(x=>x.slots.top==='i-dress'&&!x.slots.bottom));
 for(const look of result.combinations)
  assert.equal(new Set(Object.values(look.slots)).size,Object.values(look.slots).length);
 const jacket=suggestThreeNativeOwned03(rows,{ownerId:owner,pinnedId:'g-jacket'});
 assert.equal(jacket.combinations.length,3);
 assert.ok(jacket.combinations.every(x=>x.slots.layer2==='g-jacket'));
});
test('honest inventory shortage, absent bottoms/shoes and nonexistent pinned original',()=>{
 const one=[mk('a-new-red','Tops','T-shirt'),mk('c-jeans','Bottoms','Jeans'),mk('e-sneakers','Shoes','Sneakers')];
 const r=suggestThreeNativeOwned03(one,{ownerId:owner,pinnedId:'a-new-red'});
 assert.equal(r.status,'insufficient-owned-combinations');
 assert.equal(r.candidateCount,1);
 assert.equal(r.combinations.length,1);
 assert.match(r.reason,/Only 1 compatible/);
 const none=suggestThreeNativeOwned03(one.slice(0,2),{ownerId:owner,pinnedId:'a-new-red'});
 assert.equal(none.combinations.length,0);
 assert.equal(none.status,'insufficient-owned-combinations');
 assert.equal(suggestThreeNativeOwned03(one,{ownerId:owner,pinnedId:'nonowned'}).status,'review-or-missing');
});
test('invalid owner, duplicate IDs, unapproved source and unsupported type never generate',()=>{
 const rows=tops();
 assert.throws(()=>suggestThreeNativeOwned03([...rows,rows[0]],{ownerId:owner,pinnedId:'a-new-red'}),/duplicate/);
 assert.throws(()=>suggestThreeNativeOwned03([...rows,{...rows[0],id:'x',ownerId:'foreign'}],{ownerId:owner,pinnedId:'a-new-red'}),/cross-owner/);
 assert.equal(suggestThreeNativeOwned03(rows.map(x=>x.id==='a-new-red'?{...x,sourceVerified:false}:x),
  {ownerId:owner,pinnedId:'a-new-red'}).status,'review-or-missing');
 assert.equal(pinnedSlot03(mk('x','Accessories','Hat')),null);
});
test('swap checks pinned ID, duplicates, categories and atomic new state',()=>{
 const rows=tops(),initial={top:'a-new-red',bottom:'c-jeans',shoes:'e-sneakers'};
 const untouched=structuredClone(initial);
 const next=validateOwnedSwap03(rows,{ownerId:owner,pinnedId:'a-new-red',
  slots:initial,slot:'bottom',itemId:'d-pants'});
 assert.equal(next.slots.bottom,'d-pants');assert.equal(next.slots.top,'a-new-red');
 assert.deepEqual(initial,untouched);
 assert.throws(()=>validateOwnedSwap03(rows,{ownerId:owner,pinnedId:'a-new-red',
  slots:initial,slot:'top',itemId:'b-blue'}),/pinned/);
 assert.throws(()=>validateOwnedSwap03(rows,{ownerId:owner,pinnedId:'a-new-red',
  slots:initial,slot:'bottom',itemId:'e-sneakers'}),/incompatible/);
 assert.throws(()=>validateOwnedSwap03(rows,{ownerId:owner,pinnedId:'a-new-red',
  slots:initial,slot:'shoes',itemId:'c-jeans'}),/incompatible/);
 assert.throws(()=>validateOwnedSwap03(rows,{ownerId:owner,pinnedId:'a-new-red',
  slots:initial,slot:'bottom',itemId:'not-owned'}),/incompatible/);
 assert.equal(eligibleSlot03('bottom',rows.find(x=>x.id==='c-jeans')),true);
 assert.equal(eligibleSlot03('bottom',rows.find(x=>x.id==='i-dress')),false);
});
test('verified private original JPEG checked in native owner roster, not admitted by color alone',async()=>{
 const bytes=readFileSync('benchmark/fixtures/commons-0002.jpg');
 const hash=createHash('sha256').update(bytes).digest('hex');
 assert.equal(hash,'fef606d6ed7354a2238f1bcc2584942747ca6fa4a2b16b2e9eec21f639d10667');
 const row={id:'genuine-red',ownerId:owner,category:'Tops',itemType:'T-shirt',color:'Red',
  userAdjusted:true,sourceSHA256:hash,originalPhoto:{image:'data:image/jpeg;base64,'+bytes.toString('base64'),sha256:hash}};
 const board={status:()=>({active:true}),sessionLease:()=>({ownerId:owner,generation:3}),
  readOnlyWardrobe:()=>({ownerId:owner,generation:3,boardFingerprint:'board-unchanged',
   items:[structuredClone(row)]})};
 const original=structuredClone(row);
 const proof=await verifiedPrivateStyleRoster03(board);
 assert.equal(proof.ownerId,owner);assert.equal(proof.items.length,1);
 assert.equal(proof.items[0].sourceSHA256,hash);
 assert.equal(proof.items[0].genuinePhoto,row.originalPhoto.image);
 assert.deepEqual(row,original,'no original source rewritten');
 const tampered={...row,sourceSHA256:'0'.repeat(64)};
 const bad={...board,readOnlyWardrobe:()=>({...board.readOnlyWardrobe(),items:[tampered]})};
 const rejection=await verifiedPrivateStyleRoster03(bad);
 assert.equal(rejection.items.length,0);
 assert.equal(rejection.rejected.length,1);
});
test('newly captured original never bypasses one-garment confirmation or falsely claims 3D readiness',async()=>{
 const bytes=readFileSync('benchmark/fixtures/commons-0002.jpg');
 const hash=createHash('sha256').update(bytes).digest('hex');
 const row={id:'new-red-uncertain',ownerId:owner,category:'Tops',itemType:'T-shirt',
  color:'Red',userAdjusted:true,singleGarmentVerified:false,
  multipleGarments:false,scanFailed:true,sourceSHA256:hash,
  originalPhoto:{image:'data:image/jpeg;base64,'+bytes.toString('base64'),sha256:hash}};
 const board={status:()=>({active:true}),
  sessionLease:()=>({ownerId:owner,generation:9}),
  readOnlyWardrobe:()=>({ownerId:owner,generation:9,
   boardFingerprint:'same',items:[structuredClone(row)]})};
 const pending=await verifiedPrivateStyleRoster03(board);
 assert.equal(pending.items.length,0,'manual category correction is not singleton proof');
 assert.equal(pending.pending.length,1);
 assert.equal(pending.pending[0].sourceSHA256,hash);
 assert.equal(pending.pending[0].genuinePhoto,row.originalPhoto.image);
 assert.equal(row.singleGarmentVerified,false);
 const reviews=new Map([[row.id,{
  ownerId:owner,generation:9,sha256:hash,category:'Tops',itemType:'T-shirt'
 }]]);
 const admitted=await verifiedPrivateStyleRoster03(board,{singleItemReviews:reviews});
 assert.equal(admitted.items.length,1);
 assert.equal(admitted.pending.length,0);
 assert.equal(admitted.items[0].sourceSHA256,hash);
 assert.equal(admitted.items[0].singleGarmentVerified,false,
  'one-session outfit permission never promotes source or 3D readiness flag');
 assert.equal(admitted.items[0].scanFailed,true,
  'manual source review never fabricates successful AI recognition');
 const stale=new Map([[row.id,{...reviews.get(row.id),generation:8}]]);
 const refused=await verifiedPrivateStyleRoster03(board,{singleItemReviews:stale});
 assert.equal(refused.items.length,0);
 assert.equal(refused.pending.length,1);
 const multi={...row,multipleGarments:true};
 const blocked={...board,readOnlyWardrobe:()=>({...board.readOnlyWardrobe(),items:[multi]})};
 const bad=await verifiedPrivateStyleRoster03(blocked,{singleItemReviews:reviews});
 assert.equal(bad.items.length,0);
 assert.equal(bad.pending.length,0);
 assert.equal(bad.rejected.length,1);
 assert.deepEqual(row,structuredClone(row));
});

test('async source verification refuses account rotation and reclassified item after digest',async()=>{
 const bytes=readFileSync('benchmark/fixtures/commons-0002.jpg');
 const hash=createHash('sha256').update(bytes).digest('hex');
 const row={id:'genuine-red',ownerId:owner,category:'Tops',itemType:'T-shirt',
  userAdjusted:true,sourceSHA256:hash,originalPhoto:{image:'data:image/jpeg;base64,'+bytes.toString('base64'),sha256:hash}};
 let generation=5;
 const board={status:()=>({active:true}),sessionLease:()=>({ownerId:owner,generation}),
  readOnlyWardrobe:()=>({ownerId:owner,generation:5,boardFingerprint:'same',items:[row]})};
 generation=6;
 await assert.rejects(verifiedPrivateStyleRoster03(board),/changed/);
 generation=5;
 let calls=0;
 const changed={...board,readOnlyWardrobe:()=>({ownerId:owner,generation:5,
  boardFingerprint:'same',items:[++calls>1?{...row,category:'Bottoms'}:row]})};
 await assert.rejects(verifiedPrivateStyleRoster03(changed),/changed/);
});
