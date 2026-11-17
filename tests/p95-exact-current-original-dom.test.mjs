/** P95 signed original-photo consumer DOM receipt: source exactness only.
 * Uses no photos/accounts/storage; browser M51 separately proves the real app.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/outfit-board.js',import.meta.url),'utf8');
const begin='function mission4Preview1054DisplayedExactSource(';
const end='function mission4Preview1054ReconcileRedraw(){';
assert.equal(source.split(begin).length,2,'P95 native source-match function removed/duplicated');
assert.equal(source.split(end).length,2,'P95 source check integration changed');
const start=source.indexOf(begin),stop=source.indexOf(end,start);
assert.ok(start>=0&&stop>start,'P95 signed source-match code moved');
const exact=vm.runInNewContext('('+source.slice(start,stop).trim()+')',{});
const a='data:image/jpeg;base64,/9j/AA==';
const b='data:image/jpeg;base64,/9j/AQ==';
function target(entries){
 return {querySelectorAll(selector){
  assert.equal(selector,'img');
  return entries.map(([slot,source])=>({
   getAttribute(key){return key==='alt'?'Original saved clothing photograph: '+slot:
    key==='src'?source:null;}
  }));
 }};
}
test('P95 exact current selected original is accepted for one verified 2D slot',()=>{
 assert.equal(exact({selected:[{slot:'top',original:a}]},target([['top',a]]),1),true);
});
test('P95 two verified original slots may render in either DOM order',()=>{
 assert.equal(exact({selected:[{slot:'top',original:a},{slot:'bottom',original:b}]},
  target([['bottom',b],['top',a]]),2),true);
});
test('P95 reject stale persisted original while selected memory has different JPEG',()=>{
 assert.equal(exact({selected:[{slot:'top',original:b}]},target([['top',a]]),1),false);
});
test('P95 reject same original under wrong garment slot',()=>{
 assert.equal(exact({selected:[{slot:'top',original:a}]},target([['bottom',a]]),1),false);
});
test('P95 reject duplicated images with a missing slot despite matching count',()=>{
 assert.equal(exact({selected:[{slot:'top',original:a},{slot:'bottom',original:b}]},
  target([['top',a],['top',a]]),2),false);
});
test('P95 reject null or missing selected source and no selected original',()=>{
 assert.equal(exact({selected:[{slot:'top',original:null}]},target([['top',a]]),1),false);
 assert.equal(exact({selected:[]},target([]),0),false);
});
test('P95 reject invalid viewer slot count and missing images',()=>{
 assert.equal(exact({selected:[{slot:'top',original:a}]},target([['top',a]]),-1),false);
 assert.equal(exact({selected:[{slot:'top',original:a}]},target([]),1),false);
});
