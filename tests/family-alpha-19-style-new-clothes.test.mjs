import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {createStyleMyNewClothes,diversityScore} from '../research/family-alpha-19/style-my-new-clothes.mjs';
const A='a1111111-1111-4111-8111-111111111111',
 B='b2222222-2222-4222-8222-222222222222',
 C='c3333333-3333-4333-8333-333333333333',
 D='d4444444-4444-4444-8444-444444444444';
const owners=[A,B,C,D],sampleUsers=['Teenager','Adult','Small wardrobe','Large seasonal wardrobe'];
const vmStylist=()=>{const env={URL,encodeURIComponent,Date};vm.createContext(env);
 for(const file of ['outfit-matcher.js','trend-library.js','outfit-board-engine.js','closet-stylist-engine.js'])
  vm.runInContext(readFileSync('public/'+file,'utf8'),env);
 return env;
};
const jpeg=n=>{const b=Buffer.alloc(180,n%253+1);b[0]=255;b[1]=216;b[178]=255;b[179]=217;
 return 'data:image/jpeg;base64,'+b.toString('base64');};
let seed=1;
const piece=(id,category,itemType,owner=A,extra={})=>{
 const k=seed++;return {id,ownerId:owner,name:'Synthetic '+id,category,itemType,color:['Blue','White','Black','Green'][k%4],
  pattern:k%4===1?'Striped':'Solid',seasons:[],image:jpeg(k+90),originalPhoto:{image:jpeg(k)},...extra};
};
function wardrobe(owner=A,small=false){
 const wardrobe=[
 piece('new-shirt','Tops','T-shirt',owner),piece('new-pants','Bottoms','Jeans',owner),
 piece('new-dress','Dresses','Casual dress',owner),piece('new-shoes','Shoes','Sneakers',owner),
 piece('new-jacket','Outerwear','Jacket',owner),
 piece('polo','Tops','Polo',owner),piece('tee2','Tops','T-shirt',owner),
 piece('sweater','Tops','Sweater',owner),piece('blouse','Tops','Blouse',owner),
 piece('work-top','Tops','Button-down shirt',owner),piece('hoodie','Tops','Hoodie',owner),
 piece('jeans2','Bottoms','Jeans',owner),piece('shorts','Bottoms','Shorts',owner),
 piece('skirt','Bottoms','Skirt',owner),piece('trousers','Bottoms','Trousers',owner),
 piece('joggers','Bottoms','Joggers',owner),piece('leggings','Bottoms','Leggings',owner),
 piece('sneakers2','Shoes','Sneakers',owner),piece('loafers','Shoes','Loafers',owner),
 piece('flats','Shoes','Flats',owner),piece('boots','Shoes','Ankle boots',owner),
 piece('blazer','Outerwear','Blazer',owner),piece('coat','Outerwear','Coat',owner),
 piece('dress2','Dresses','Shirt dress',owner)
 ];
 return small?wardrobe.filter(x=>['new-shirt','jeans2','sneakers2'].includes(x.id)):wardrobe;
}
function harness(owner=A,small=false){
 const style=vmStylist();let ctx={authenticatedUserId:owner,currentUserId:owner,
  cloudOwnerId:owner,indexedDbName:'closet-current-user-'+owner,sessionGeneration:1};
 let clothes=wardrobe(owner,small);
 const client=createStyleMyNewClothes({readContext:()=>ctx,readWardrobe:()=>clothes,
  stylistItemScore:(...args)=>style.stylistItemScore(...args),
  stylistHarmony:(...args)=>style.stylistHarmony(...args),
  cleanOutfitBoard:(...args)=>style.cleanOutfitBoard(...args),cryptoProvider:webcrypto});
 const generate=(pinId,request='Casual',season='Fall')=>client.recommend({pinId,request,season});
 return {style,client,generate,get clothes(){return clothes;},setClothes:v=>clothes=v,get ctx(){return ctx;},
  setCtx:v=>ctx=v};
}
const used=result=>result.options.map(o=>Object.values(o.board.slots));
for(const [owner,label]of owners.map((v,i)=>[v,sampleUsers[i]])){
 for(const pin of ['new-shirt','new-pants','new-dress','new-shoes','new-jacket']){
  test(label+' / '+pin+': 3 pinned, diverse, source-bound complete outfits',async()=>{
   const h=harness(owner),saved=JSON.stringify(h.clothes);
   const r=await h.generate(pin);
   assert.equal(r.options.length,3,r.reason);
   assert.equal(r.pinId,pin);
   assert.equal(r.ownerId,owner);
   for(const option of r.options){
    assert.equal(option.board.slots[r.pinSlot],pin);
    assert.equal(option.missing.length,0);
    assert.equal(option.ownerId,owner);
    assert.equal(Object.keys(option.board.ideas).length,0);
    assert.equal(new Set(Object.values(option.board.slots)).size,Object.keys(option.board.slots).length);
    for(const id of Object.values(option.board.slots)){
     assert.ok(h.clothes.some(x=>x.id===id));
     assert.equal(option.sources[id].ownerId,owner);
     assert.match(option.sources[id].sourceVersion,/^[a-f0-9]{64}$/);
     assert.match(option.sources[id].cropVersion,/^[a-f0-9]{64}$/);
    }
    if(pin==='new-dress')assert.equal(option.board.slots.bottom,undefined);
    if(pin==='new-dress')assert.equal(option.board.slots.layer2,undefined);
    if(pin==='new-jacket')assert.equal(option.board.slots.layer2,pin);
   }
   for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)
    assert.ok(diversityScore(r.options[a],r.options[b],r.pinSlot)>=(pin==='new-dress'?1:2));
   assert.equal(await h.client.verify(r),true);
   assert.equal(JSON.stringify(h.clothes),saved,'recommendations must be read-only');
  });
 }
}
test('smaller wardrobe provides just one valid pinned combination without fabricated outfits',async()=>{
 const h=harness(A,true),r=await h.generate('new-shirt');
 assert.equal(r.options.length,1);assert.match(r.reason,/Only 1 meaningfully/);
 assert.equal(r.options[0].board.slots.top,'new-shirt');
 const missing=h.clothes.filter(x=>x.id!=='sneakers2');
 h.setClothes(missing);const empty=await h.generate('new-shirt');
 assert.equal(empty.options.length,0);assert.match(empty.reason,/Only 0/);
});
test('empty wardrobe and missing pinned item never create a phantom garment',async()=>{
 const h=harness();h.setClothes([]);
 await assert.rejects(h.generate('new-shirt'),/must exist/);
 await assert.rejects(h.generate('missing-id'),/must exist/);
});
test('new piece must be suitable for season and occasion; no stealth substitution',async()=>{
 const h=harness();
 assert.equal((await h.generate('new-shirt','Work')).options.length,0,'Work cannot silently replace new T-shirt');
 const dress=await h.generate('new-dress','Activewear');
 assert.equal(dress.options.length,0);
 const cold=h.clothes.map(x=>x.id==='new-pants'?{...x,seasons:['Summer']}:x);
 h.setClothes(cold);
 assert.equal((await h.generate('new-pants','Casual','Winter')).options.length,0);
 assert.equal((await h.generate('new-pants','Casual','Summer')).options.length>0,true);
});
test('School, Work, Dinner, Activewear use actual compatible saved pieces',async()=>{
 const h=harness(),cases=[
  ['new-shirt','School',true],
  ['work-top','Work',true],
  ['blouse','Dressy dinner',true],
  ['new-shoes','Activewear',true],
  ['new-dress','Dressy dinner',true]
 ];
 for(const [id,request,expected]of cases){
  const out=await h.generate(id,request);
  assert.equal(out.options.length>0,expected,id+' '+request);
  for(const o of out.options)assert.equal(o.board.slots[out.pinSlot],id);
 }
});
test('actual indexed garment subtypes preserve shorts, skirts and long/short sleeve tops',async()=>{
 const h=harness(),v=await h.generate('new-shirt');
 assert.ok(h.clothes.some(x=>x.itemType==='Skirt'));
 assert.ok(h.clothes.some(x=>x.itemType==='Shorts'));
 assert.ok(v.options.every(x=>h.clothes.some(y=>y.id===x.board.slots.bottom&&y.category==='Bottoms')));
 const long=h.clothes.map(x=>x.id==='tee2'?{...x,sleeveLength:'Long sleeve'}:x);
 h.setClothes(long);assert.equal((await h.generate('new-pants')).options.length,3);
});
test('new item pin remains selected across occasion changes and repeated generations',async()=>{
 const h=harness();
 for(const req of ['School','Casual','Casual date night','Activewear']){
  const o=await h.generate('new-shoes',req);
  assert.ok(o.options.every(x=>x.board.slots.shoes==='new-shoes'));
 }
});
test('one-piece pants, shoe, top and jacket swap preserves pinned new piece and unchanged slots',async()=>{
 const cases=[
 ['new-shirt','bottom','shorts'],['new-shirt','shoes','loafers'],
 ['new-pants','top','hoodie'],['new-shoes','top','sweater'],
 ['new-shirt','layer2','blazer']];
 for(const [pin,slot,target]of cases){
  const h=harness(),r=await h.generate(pin);
  const old=r.options[0],oldSlots={...old.board.slots},saved=JSON.stringify(h.clothes);
  if(oldSlots[slot]===target)continue;
  const modified=await h.client.swap(r,0,slot,target);
  assert.equal(modified.options[0].board.slots[slot],target);
  assert.equal(modified.options[0].board.slots[modified.pinSlot],pin);
  for(const [k,id]of Object.entries(oldSlots))if(k!==slot)assert.equal(modified.options[0].board.slots[k],id);
  assert.equal(JSON.stringify(r.options[0].board.slots),JSON.stringify(oldSlots));
  assert.equal(JSON.stringify(h.clothes),saved);
  assert.equal(await h.client.verify(modified),true);
 }
});
test('swap cannot replace the new item, insert incompatible clothing or mutate the recommendation',async()=>{
 const h=harness(),r=await h.generate('new-shirt'),save=JSON.stringify(r);
 await assert.rejects(h.client.swap(r,0,'top','polo'),/Pinned/);
 await assert.rejects(h.client.swap(r,0,'shoes','jeans2'),/incompatible|Missing/);
 await assert.rejects(h.client.swap(r,0,'bottom','new-shirt'),/Pinned/);
 await assert.rejects(h.client.swap(r,1,'shoes','foreign'),/Missing/);
 assert.equal(JSON.stringify(r),save);
});
test('changed original under unchanged crop invalidates old looks and swap',async()=>{
 const h=harness(),r=await h.generate('new-shirt');
 h.setClothes(h.clothes.map(x=>x.id==='new-shirt'?{...x,originalPhoto:{image:jpeg(245)}}:x));
 await assert.rejects(h.client.verify(r),/Photo source changed/);
 await assert.rejects(h.client.swap(r,0,'shoes','loafers'),/Photo source changed/);
});
test('crop change alone invalidates presentation without silently substituting original identity',async()=>{
 const h=harness(),r=await h.generate('new-shirt'),originalHash=r.options[0].sources['new-shirt'].sourceVersion;
 h.setClothes(h.clothes.map(x=>x.id==='new-shirt'?{...x,image:jpeg(246)}:x));
 await assert.rejects(h.client.verify(r),/Photo source changed/);
 const next=await h.generate('new-shirt');
 assert.equal(next.options[0].sources['new-shirt'].sourceVersion,originalHash);
 assert.notEqual(next.options[0].sources['new-shirt'].cropVersion,r.options[0].sources['new-shirt'].cropVersion);
});
test('deleting a garment or changing source-group ID invalidates prior recommendation',async()=>{
 const h=harness(),r=await h.generate('new-shirt'),id=r.options[0].board.slots.shoes;
 h.setClothes(h.clothes.filter(x=>x.id!==id));
 await assert.rejects(h.client.verify(r),/Missing|changed|source/i);
 const refreshed=await h.generate('new-shirt');assert.equal(refreshed.options.some(x=>x.board.slots.shoes===id),false);
 const group=refreshed.options[0].board.slots.top;
 h.setClothes(h.clothes.map(x=>x.id===group?{...x,outfitSourceId:'changed'}:x));
 await assert.rejects(h.client.verify(refreshed),/Photo source changed/);
});
test('foreign account garment and duplicate saved IDs are rejected without mixing owners',async()=>{
 const h=harness(A);h.setClothes([...h.clothes,piece('foreign','Shoes','Sneakers',B)]);
 await assert.rejects(h.generate('new-shirt'),/Foreign/);
 const other=harness(A);other.setClothes([...other.clothes,{...other.clothes[0]}]);
 await assert.rejects(other.generate('new-shirt'),/Duplicate/);
});
test('duplicate original JPEGs never turn identical garments into diversity',async()=>{
 const h=harness(A);
 const shirt=h.clothes.find(x=>x.id==='new-shirt');
 const another=h.clothes.find(x=>x.id==='polo');
 h.setClothes(h.clothes.map(x=>x.id===another.id?{...x,originalPhoto:{image:shirt.originalPhoto.image}}:x));
 const result=await h.generate('new-pants');
 for(const outfit of result.options){
  const sources=Object.values(outfit.sources).map(x=>x.sourceVersion);
  assert.equal(sources.length,new Set(sources).size);
 }
});
test('switching four accounts refuses reuse of older owner recommendations',async()=>{
 const h=harness(A),a=await h.generate('new-shirt');
 for(const owner of [B,C,D]){
  h.setCtx({authenticatedUserId:owner,currentUserId:owner,cloudOwnerId:owner,
   indexedDbName:'closet-current-user-'+owner,sessionGeneration:h.ctx.sessionGeneration+1});
  h.setClothes(wardrobe(owner));
  await assert.rejects(h.client.verify(a),/Foreign recommendations/);
  const r=await h.generate('new-shirt');
  assert.equal(r.ownerId,owner);
  assert.ok(r.options.every(x=>Object.values(x.sources).every(s=>s.ownerId===owner)));
 }
});
test('expired Auth or wrong private DB always fails closed',async()=>{
 const h=harness(A);h.setCtx({...h.ctx,currentUserId:B});
 await assert.rejects(h.generate('new-shirt'),/Signed-in private/);
});
test('older pending source hash cannot be accepted after logout, account change, or newer request',async()=>{
 let unblock,started;
 const begun=new Promise(resolve=>started=resolve);
 const h=harness(A),style=h.style;
 const delayed={subtle:{digest:async(...args)=>{started();await new Promise(ok=>unblock=ok);return webcrypto.subtle.digest(...args)}}};
 const client=createStyleMyNewClothes({readContext:()=>h.ctx,readWardrobe:()=>h.clothes,
  stylistItemScore:(...a)=>style.stylistItemScore(...a),
  stylistHarmony:(...a)=>style.stylistHarmony(...a),
  cleanOutfitBoard:(...a)=>style.cleanOutfitBoard(...a),cryptoProvider:delayed});
 const pending=client.recommend({pinId:'new-shirt'});await begun;
 h.setCtx({...h.ctx,authenticatedUserId:B,currentUserId:B,cloudOwnerId:B,
  indexedDbName:'closet-current-user-'+B,sessionGeneration:2});
 h.setClothes(wardrobe(B));unblock();
 await assert.rejects(pending,/Account changed/);
});
test('explicit invalidation supersedes older outfit operations',async()=>{
 let unblock,started;const begun=new Promise(resolve=>started=resolve);
 const h=harness(A),style=h.style,cryptoProvider={subtle:{digest:async(...args)=>{
  started();await new Promise(ok=>unblock=ok);return webcrypto.subtle.digest(...args);
 }}};
 const client=createStyleMyNewClothes({readContext:()=>h.ctx,readWardrobe:()=>h.clothes,
  stylistItemScore:(...a)=>style.stylistItemScore(...a),stylistHarmony:(...a)=>style.stylistHarmony(...a),
  cleanOutfitBoard:(...a)=>style.cleanOutfitBoard(...a),cryptoProvider});
 const pending=client.recommend({pinId:'new-shirt'});await begun;client.invalidate();unblock();
 await assert.rejects(pending,/Superseded/);
});
