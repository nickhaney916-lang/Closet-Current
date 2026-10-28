import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('Work54 mobile review document uses shrinkable non-clipping controls',async()=>{
 const index=await readFile('research/work54/index.html','utf8');
 assert.match(index,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(index,/\*,\*::before,\*::after\{box-sizing:border-box\}/);
 assert.match(index,/#editor input\[type=file\]\{display:block;width:100%\}/);
 assert.match(index,/#editor \.w47-controls,\#editor \.w47-controls>\*\{max-width:100%\}/);
 assert.doesNotMatch(index,/overflow-x:\s*(hidden|clip)/i,'Do not hide oversize actual garment panels');
 const fit=await readFile('research/work54/starting-fit.mjs','utf8');
 assert.match(fit,/requiresHumanReview:true/);
});
test('browser check still fails on overflow and reports offender elements',async()=>{
 const code=await readFile('scripts/test-work54-browser.mjs','utf8');
 assert.match(code,/layout\.documentWidth<=layout\.viewport/);
 assert.match(code,/offenders:/);
 assert.match(code,/assert\.deepEqual\(errors,\[\]\)/);
});
