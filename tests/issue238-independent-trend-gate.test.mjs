import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditTrendLibrary,canonicalTrendLink,assessSyntheticLinkObservation} from '../scripts/issue238-independent-trend-gate.mjs';
const now='2026-10-23T19:00:00Z',checked='2026-10-22T12:00:00Z';
function fixture(){return {schema_version:1,updated_at:checked,next_refresh_at:'2026-10-29T12:00:00Z',
 sources:[{id:'a',title:'Layering',publication:'Magazine A',url:'https://news.example.com/layers',checked_at:checked,published_at:'2026-10-20'},
 {id:'b',title:'Shoes',publication:'Magazine B',url:'https://news.example.org/shoes',checked_at:checked,published_at:'2026-10-20'}],
 products:[{type:'Jacket',name:'Example jacket',retailer:'Example shop',url:'https://shop.example.com/jacket?sku=123',audience:'All',checked_at:checked,price_at_check:null}],
 retailers:[{name:'Example shop',url:'https://shop.example.com/jackets',audience:'All',types:['Jacket'],checked_at:checked}],
 directions:[{id:'layer',slot:'layer',type:'Jacket',source_id:'a',audiences:['All']} ]};}
const codes=r=>r.issues.filter(x=>x.severity==='error').map(x=>x.code);
test('valid offline fixture passes structure without claiming live links, prices, stock or content verification',()=>{
 const value=fixture(),before=JSON.stringify(value),r=auditTrendLibrary(value,{now});
 assert.equal(r.structuralPassed,true);assert.equal(r.counts.usableDirections,1);
 for(const key of ['liveLinkVerification','currentPricesVerified','stockVerified','sourceContentSemanticallyVerified','productionPromotionApproved'])assert.equal(r[key],false);
 assert.equal(r.networkRequests,0);assert.equal(JSON.stringify(value),before);
});
for(const [name,edit,code] of [
 ['stale library',d=>d.updated_at='2026-10-01T00:00:00Z','stale'],
 ['missing library timestamp',d=>delete d.updated_at,'missing-or-invalid-timestamp'],
 ['future timestamp',d=>d.updated_at='2026-10-24T00:00:00Z','future-timestamp'],
 ['invalid calendar date',d=>d.updated_at='2026-02-30T00:00:00Z','missing-or-invalid-timestamp'],
 ['overdue deadline',d=>d.next_refresh_at='2026-10-23T12:00:00Z','refresh-overdue'],
 ['impossible deadline',d=>d.next_refresh_at='2027-01-01T00:00:00Z','invalid-weekly-refresh-deadline'],
 ['source stale despite fresh payload',d=>d.sources[0].checked_at='2026-09-01T00:00:00Z','unverified-or-stale-source'],
 ['source check missing',d=>delete d.sources[0].checked_at,'missing-or-invalid-timestamp'],
 ['duplicate source IDs',d=>d.sources[1].id='a','missing-or-duplicate-source-id'],
 ['tracking-only duplicate article',d=>d.sources[1].url=d.sources[0].url+'?utm_source=mail#look','duplicate-source-url'],
 ['one publisher masquerades as diverse sites',d=>d.sources[1].url='https://www.news.example.com/another','insufficient-publication-host-diversity'],
 ['wrong source association',d=>d.directions[0].source_id='missing','unverified-or-stale-source'],
 ['shoes in top slot',d=>d.directions[0].slot='top','slot-type-mismatch'],
 ['prototype name is not a clothing slot',d=>d.directions[0].slot='__proto__','slot-type-mismatch'],
 ['bag in jewelry slot',d=>{d.directions[0].slot='accessory';d.directions[0].type='Bag';},'slot-type-mismatch'],
 ['invalid audience',d=>d.directions[0].audiences=['unsupported'],'invalid-audience'],
 ['unknown product category',d=>d.products[0].type='Electronics','unknown-garment-type'],
 ['unavailable product',d=>d.products[0].available=false,'unavailable-product'],
 ['duplicate product identity',d=>d.products.push({...d.products[0],url:d.products[0].url+'&utm_source=mail#sale'}),'duplicate-product-url'],
 ['negative price',d=>d.products[0].price_at_check=-1,'invalid-price'],
 ['old product check not laundered by payload date',d=>d.products[0].checked_at='2026-09-01T00:00:00Z','stale'],
 ['retailer missing own check',d=>delete d.retailers[0].checked_at,'missing-or-invalid-timestamp'],
 ['duplicate retailer URLs',d=>d.retailers.push({...d.retailers[0]}),'duplicate-retailer-url'],
 ['invalid URL',d=>d.sources[0].url='not a URL','unsafe-url'],
 ['invalid scheme',d=>d.products[0].url='javascript:alert(1)','unsafe-url'],
 ['future publication',d=>d.sources[0].published_at='2026-12-01','invalid-publication-date'],
 ['oversized untrusted payload',d=>d.products=Array(101).fill(d.products[0]),'too-many-rows']
])test(name,()=>{const d=fixture();edit(d);const r=auditTrendLibrary(d,{now});assert.equal(r.structuralPassed,false);assert.ok(codes(r).includes(code),JSON.stringify(r.issues));});
test('canonical URLs remove tracking and fragments but preserve SKU, color and functional product identity',()=>{
 assert.equal(canonicalTrendLink('https://www.shop.example.com/jacket?utm_source=x&color=blue&sku=1#look'),'https://shop.example.com/jacket?color=blue&sku=1');
 assert.notEqual(canonicalTrendLink('https://shop.example.com/jacket?sku=1'),canonicalTrendLink('https://shop.example.com/jacket?sku=2'));
});
const link='https://shop.example.com/jacket',observation=chain=>({checked_at:'2026-10-23T12:00:00Z',chain});
for(const status of [404,410,403,429,500])test('synthetic HTTP '+status+' never counted as a verified link',()=>assert.equal(assessSyntheticLinkObservation(link,observation([{url:link,status}]),{now}),'http-'+status));
for(const error of ['offline','timeout','network-error'])test('unavailable network '+error+' preserves uncertainty',()=>assert.equal(assessSyntheticLinkObservation(link,{checked_at:'2026-10-23T12:00:00Z',error},{now}),error));
for(const destination of ['javascript:alert(1)','http://shop.example.com/down','https://127.0.0.1/private','https://evil.example.org/login','https://user:secret@shop.example.com/private']){
 test('unsafe synthetic redirect '+destination,()=>assert.equal(assessSyntheticLinkObservation(link,observation([{url:link,status:302,location:destination}]),{now}),'unsafe-or-mismatched-redirect'));
}
test('bounded same-host redirects can pass only the synthetic transport check',()=>{
 const chain=[{url:link,status:301,location:'/new-jacket'},{url:'https://shop.example.com/new-jacket',status:200,content_type:'text/html; charset=utf-8'}];
 assert.equal(assessSyntheticLinkObservation(link,observation(chain),{now}),'synthetic-pass');
 const d=fixture(),r=auditTrendLibrary(d,{now,observations:{[canonicalTrendLink(d.products[0].url)]:observation([{url:d.products[0].url,status:200,content_type:'text/html'}])}});
 assert.equal(r.liveLinkVerification,false);assert.equal(r.stockVerified,false);
});
test('redirect loops, missing locations, stale observations and non-HTML terminal pages fail closed',()=>{
 assert.equal(assessSyntheticLinkObservation(link,observation([{url:link,status:302,location:'/jacket'},{url:link,status:200,content_type:'text/html'}]),{now}),'unsafe-or-mismatched-redirect');
 assert.equal(assessSyntheticLinkObservation(link,observation([{url:link,status:302}]),{now}),'unsafe-or-mismatched-redirect');
 assert.equal(assessSyntheticLinkObservation(link,{checked_at:checked,chain:[{url:link,status:200,content_type:'text/html'}]},{now}),'invalid-or-stale-observation');
 assert.equal(assessSyntheticLinkObservation(link,observation([{url:link,status:200,content_type:'application/json'}]),{now}),'unexpected-content-type');
});
test('clock and observation inputs are explicit and validated',()=>{
 for(const invalid of [undefined,'tomorrow','2026-02-30T00:00:00Z'])assert.throws(()=>auditTrendLibrary(fixture(),{now:invalid}),/ISO/);
 assert.throws(()=>auditTrendLibrary(fixture(),{now,observations:null}),/Invalid/);
});
test('locked October 19 repository snapshot exposes missing retailer timestamps without editing data',()=>{
 // Pin historical findings in a fixture, not the weekly-updating live catalog.
 const seed=JSON.parse(fs.readFileSync('tests/fixtures/issue238-independent-seed-20261019.json')),before=JSON.stringify(seed),r=auditTrendLibrary(seed,{now});
 assert.equal(r.counts.sources,7);assert.equal(r.counts.publicationHosts,6);assert.equal(r.counts.products,11);assert.equal(r.counts.productHosts,8);
 assert.equal(r.issues.filter(x=>x.code==='missing-or-invalid-timestamp'&&x.path.startsWith('retailers[')).length,11);
 assert.equal(r.structuralPassed,false);assert.equal(r.liveLinkVerification,false);assert.equal(JSON.stringify(seed),before);
});
