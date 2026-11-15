import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Scope: static source-level regression for the interim fail-closed write
// fence. NOT a substitute for signed-owner Chromium/WebKit IDB acceptance.
const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const saveStart=source.indexOf('function savePiece(');
const saveEnd=source.indexOf('\nfunction node(',saveStart);
assert.ok(saveStart>=0&&saveEnd>saveStart,'normal savePiece implementation exists');
const save=source.slice(saveStart,saveEnd);

test('new garment checks persisted draft identity and immutable original first',()=>{
 const draft=save.indexOf("draftStore.get('draft')");
 const cas=save.indexOf('CLOSET_STALE_DRAFT_REOPEN_EDITOR');
 const photo=save.indexOf('value.sourceSHA256!==draftExpected.sourceSHA256');
 const scan=save.indexOf('const savedRequest=store.getAll()');
 assert.ok(draft>=0&&cas>draft&&photo>cas&&scan>photo);
});

test('saved JPEG comparison occurs inside same owner items/state write transaction',()=>{
 const transaction=save.indexOf("ownerDB.transaction(['items','state'],'readwrite')");
 const scan=save.indexOf('const savedRequest=store.getAll()');
 const callback=save.indexOf('savedRequest.onsuccess=()=>');
 const rejection=save.indexOf('CLOSET_IDENTICAL_SAVED_PHOTO_REQUIRES_OWNER_REVIEW');
 const add=save.indexOf('store.add(value)',callback);
 const remove=save.indexOf("draftStore.put({id:'draft',batch:rows.filter(row=>row.id!==value.id)})",callback);
 assert.ok(transaction>=0&&scan>transaction&&callback>scan);
 assert.ok(rejection>callback&&add>rejection&&remove>add);
 assert.match(save.slice(callback,add),/row\.id!==value\.id&&row\.image===value\.image/);
});

test('failure aborts transaction and never consumes draft before successful saved comparison',()=>{
 const callback=save.indexOf('savedRequest.onsuccess=()=>');
 const rejection=save.indexOf('CLOSET_IDENTICAL_SAVED_PHOTO_REQUIRES_OWNER_REVIEW');
 const add=save.indexOf('store.add(value)',callback);
 const abort=save.indexOf('tx.abort()',add);
 assert.ok(callback>=0&&rejection>callback&&add>rejection&&abort>add);
 assert.match(save,/savedRequest\.onerror=\(\)=>\{failure=/);
 assert.match(save,/tx\.onerror=tx\.onabort=\(\)=>reject\(/);
});

test('saved-row edit retains independent compare-and-swap',()=>{
 assert.match(save,/if\(expected\)\{[\s\S]*?CLOSET_STALE_SAVED_GARMENT_REOPEN_EDITOR/);
 assert.match(save,/if\(expected\)\{\s*\/\/ Editing a saved row[\s\S]*?store\.put\(value\)/);
});
