import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
const html=readFileSync(new URL('../public/humanoid-3d-preview.html',import.meta.url),'utf8');
test('preview uses local renderer with no remote AI services',()=>{
  assert.match(html,/from '\.\/humanoid-3d-prototype\.mjs'/);
  assert.doesNotMatch(html,/https?:\/\/|fetch\(|XMLHttpRequest|location\.reload\(/);
});
test('preview has accessible controls and reset preserving selected outfit',()=>{
  for(const id of ['avatar','top','bottom','shoes','left','right','reset','status'])assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(html,/rotate\(-rotation\)/);
  assert.match(html,/role="status"/);
});
