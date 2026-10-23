import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {safeExternalLink,typeFitsSlot,normalizeQualityLibrary,chooseTrendResearch,shoppingForSlot,inspectExternalLink,ownedOnlyOutfitView} from '../research/trends/trend-quality-gate.mjs';
const require=createRequire(import.meta.url);
const {normalizeTrendLibrary}=require('../public/trend-library.js');
const seed=JSON.parse(readFileSync('public/trend-data.json','utf8'));
const now=Date.parse('2026-10-23T19:00:00.000Z');
const fresh=()=>structuredClone(seed);
const quality=(data=seed,opts={})=>normalizeQualityLibrary(data,{now,...opts});
test('published trend fixture remains current, correctly diverse, source-owned and unmixed',()=>{
 const q=quality();
 assert.equal(q.status,'current');
 assert.equal(q.library.sources.length,7);assert.equal(q.publicationSites,6);
 assert.equal(q.library.directions.length,15);
 assert.equal(q.library.products.length,11);
 assert.ok(q.diagnostics.warnings.filter(x=>x.startsWith('Publication date missing')).length===3);
 const live=normalizeTrendLibrary(seed);
 assert.equal(live.sources.length,7);
 assert.equal(q.library.directions.every(d=>q.library.sources.some(s=>s.id===d.sourceId)),true);
});
test('stale, future, missing and invalid updated timestamps cannot be promoted as current',()=>{
 const old=fresh();old.updated_at='2026-09-01T00:00:00.000Z';old.next_refresh_at='2026-09-08T00:00:00.000Z';
 assert.equal(quality(old).status,'stale');
 assert.equal(chooseTrendResearch({remote:old,cached:old},{now}).mode,'general-styling-only');
 const future=fresh();future.updated_at='2026-12-01T00:00:00.000Z';
 assert.throws(()=>quality(future),/timestamp/);
 for(const x of [null,'','2026-10-23','nonsense']){
  const data=fresh();data.updated_at=x;assert.throws(()=>quality(data),/timestamp/);
 }
 const missing=fresh();delete missing.next_refresh_at;
 assert.equal(quality(missing).status,'current');
 assert.ok(quality(missing).diagnostics.warnings.some(s=>s.includes('Next refresh')));
});
test('new stale remote never overwrites verified fresh cached research, even when network fails',()=>{
 const cached=fresh(),remote=fresh();
 remote.updated_at='2026-09-02T00:00:00.000Z';
 assert.equal(chooseTrendResearch({remote,cached},{now}).origin,'cached');
 const bad=chooseTrendResearch({remote:{...fresh(),schema_version:99},cached},{now});
 assert.equal(bad.mode,'verified-research');
 assert.ok(bad.warnings.some(x=>x.includes('schema')));
 const none=chooseTrendResearch({remote:null,cached:null,embedded:null},{now});
 assert.equal(none.mode,'general-styling-only');assert.equal(none.library,null);
});
test('duplicate IDs, duplicate canonical URLs and duplicate retailers are suppressed without throwing',()=>{
 const data=fresh();
 data.sources.push({...data.sources[0],id:'new-id',url:data.sources[0].url+'#fragment'});
 data.sources.push({...data.sources[0],title:'Repeated source identity',url:'https://new-publisher.org/story'});
 data.products.push({...data.products[0],name:'Duplicate merchandise',url:data.products[0].url+'#detail'});
 data.retailers.push({...data.retailers[0]});
 const q=quality(data);
 assert.equal(q.library.sources.length,7);assert.equal(q.library.products.length,11);assert.equal(q.library.retailers.length,11);
 assert.equal(q.diagnostics.excluded.sources.length,2);
 assert.equal(q.diagnostics.excluded.products.length,1);
 assert.equal(q.diagnostics.excluded.retailers.length,1);
});
test('insufficient genuinely independent publishing websites cannot be promoted',()=>{
 const data=fresh();
 for(let i=0;i<data.sources.length;i++){data.sources[i].url='https://single-source.org/article-'+i;}
 const q=quality(data);
 assert.equal(q.publicationSites,1);
 assert.equal(q.status,'invalid');
 assert.equal(chooseTrendResearch({remote:data},{now}).mode,'general-styling-only');
});
test('unsafe URL schemes, credentials, ports, literal IP hosts, redirect parameters and local zones are rejected',()=>{
 for(const bad of [
  'javascript:alert(1)','data:text/plain,abc','http://fashion.com/','https://name:secret@fashion.com/','https://127.0.0.1/',
  'https://172.16.1.23/item','https://[::1]/','https://local.internal/a','https://localhost/a','https://example.invalid/path',
  'https://shop.com:444/path','https://fashion.com/?next=javascript%3Aalert%281%29',
  'https://fashion.com/?url=https%3A%2F%2Fevil.com%2F','https://fashion.com/?goto=%2F%2Fevil.com',
  'https://user@fashion.com/','ftp://fashion.com/a','https://fashion.com/?redirect_uri=data%3Atext%2Fhtml%2Cbad',
  'not a URL'
 ])assert.equal(safeExternalLink(bad),null,bad);
 assert.equal(safeExternalLink('https://fashion.com/shoes?color=blue#fragment'),'https://fashion.com/shoes?color=blue');
});
test('wrong garment-category directions and wrong product types do not enter slot shopping',()=>{
 const data=fresh();data.directions.push({
  id:'wrong-shoe-bag',slot:'shoes',type:'Bag',source_id:data.sources[0].id,reason:'A bag cannot be a shoe.'
 });
 data.products.push({type:'Grenade',name:'Unknown',url:'https://legitimate-fashion.org/x',checked_at:data.updated_at});
 data.retailers.push({name:'Bad shoes',url:'https://fashion.test/illegal',audience:'All',types:['Sneakers']});
 const q=quality(data);
 assert.ok(q.diagnostics.excluded.directions.some(x=>x.id==='wrong-shoe-bag'));
 assert.ok(q.diagnostics.excluded.products.some(x=>x.url==='https://legitimate-fashion.org/x'));
 for(const [slot,expected] of [['bag','Bag'],['shoes','Sneakers'],['layer','Coat']]){
  const ideas=shoppingForSlot(q.library,slot,{audience:'All'});
  assert.ok(ideas.directions.every(d=>typeFitsSlot(d.type,slot)));
  assert.ok(ideas.products.every(p=>typeFitsSlot(p.type,slot)));
  assert.ok(ideas.retailers.every(p=>p.types.some(t=>typeFitsSlot(t,slot))));
  assert.ok(ideas.directions.some(d=>d.type===expected));
 }
 assert.equal(shoppingForSlot(q.library,'nonsense').directions.length,0);
});
test('unavailable and missing-date product references never claim verified purchase availability',()=>{
 const data=fresh();
 data.products.push({type:'Sweater',name:'Sold out',url:'https://fashion.org/sold-out',available:false,checked_at:data.updated_at});
 data.products.push({type:'Sweater',name:'No checked date',url:'https://fashion.org/unchecked'});
 const q=quality(data);
 assert.ok(!q.library.products.some(x=>['Sold out','No checked date'].includes(x.name)));
 assert.ok(q.diagnostics.excluded.products.some(x=>x.reason==='explicitly-unavailable'));
});
test('synthetic bad HTTP, blocked 403, redirects, and offline sources are not mislabeled live',async()=>{
 const url='https://style.org/story';
 for(const [reply,status] of [[{status:200,url},'reachable'],[{status:404,url},'broken'],[{status:410,url},'broken'],[{status:403,url},'unverified'],[{status:429,url},'unverified'],[{status:503,url},'unverified'],
  [{status:302,url:'https://redirect.org/new',redirected:true},'review-redirect'],[{status:200,url:'javascript:alert(1)',redirected:true},'unsafe']]){
  assert.equal((await inspectExternalLink(url,async()=>reply)).status,status);
 }
 assert.equal((await inspectExternalLink(url,async()=>{throw Error('network offline')})).status,'unverified');
 assert.equal((await inspectExternalLink(url)).status,'unverified');
 assert.equal((await inspectExternalLink('javascript:alert(1)',async()=>({status:200}))).status,'unsafe');
});
test('owned-closet-only selections cannot silently become shopping products',()=>{
 const owned=[{id:'owned-top',category:'Tops',image:'synthetic-original-A'},{id:'owned-shoe',category:'Shoes',image:'synthetic-original-B'}];
 const candidate={board:{slots:{top:'owned-top',shoes:'owned-shoe'}}};
 const shop=[{name:'A blue sweater',type:'Sweater',url:'https://shop.com/sweater'}];
 const before=JSON.stringify({owned,candidate,shop});
 const result=ownedOnlyOutfitView(candidate,owned,shop);
 assert.deepEqual({...result.ownedSlots},candidate.board.slots);
 assert.equal(result.shoppingInspiration.length,1);assert.equal(result.shoppingItemsCountAsOwned,false);
 assert.equal(result.ownedGarments.length,2);assert.equal(JSON.stringify({owned,candidate,shop}),before);
 assert.throws(()=>ownedOnlyOutfitView({board:{slots:{top:'shop-SKU'}}},owned,shop),/Shopping or missing/);
 assert.throws(()=>ownedOnlyOutfitView(candidate,[...owned,{...owned[0]}],shop),/Ambiguous/);
});
test('existing board engine remains explicitly split between closet piece IDs and shopping directions',()=>{
 const source=readFileSync('public/outfit-board.js','utf8');
 assert.match(source,/Shopping idea · not owned/);
 assert.match(source,/delete currentBoard\.slots\[target\];currentBoard\.ideas\[target\]/);
 const stylist=readFileSync('public/closet-stylist-engine.js','utf8');
 assert.match(stylist,/styleOwnedCollection\(closet/);
 assert.match(stylist,/slots\.top=top\.item\.id/);
 const cloud=readFileSync('public/trend-library.js','utf8');
 assert.match(cloud,/function normalizeTrendLibrary/);
});
