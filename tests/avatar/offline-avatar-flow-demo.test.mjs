import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../../research/avatar/offline-avatar-flow-demo.html',import.meta.url),'utf8');
test('prototype is standalone and offline',()=>{
 assert.doesNotMatch(html,/<script[^>]+src=|<link[^>]+href=|fetch\s*\(|XMLHttpRequest|https?:\/\//i);
});
test('large buttons and keyboard-accessible semantic controls',()=>{
 assert.match(html,/min-height:58px/);
 assert.equal((html.match(/<button\b/g)||[]).length,4);
 assert.match(html,/aria-pressed/);
 assert.match(html,/focus-visible/);
});
test('three synthetic garments and clear action exist',()=>{
 for(const name of ['denim','stripe','dress','none'])assert.match(html,new RegExp('data-item="'+name+'"'));
 assert.equal((html.match(/data-layer="/g)||[]).length,3);
});
test('animation respects reduced motion',()=>{
 assert.match(html,/prefers-reduced-motion:reduce/);
 assert.match(html,/transition:transform/);
});
test('selection updates layers and announces status',()=>{
 assert.match(html,/classList\.toggle\('active'/);
 assert.match(html,/aria-live="polite"/);
});
test('demo clearly disclaims real-photo fit',()=>{
 assert.match(html,/not extracted fabric from real photographs/i);
 assert.match(html,/not a photo-to-avatar fitting model/i);
});
