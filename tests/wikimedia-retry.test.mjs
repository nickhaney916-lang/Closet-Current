import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Wikimedia metadata and original images both use the bounded rate-limit retry helper',()=>{
 const source=readFileSync('scripts/collect-independent-photo-bytes.mjs','utf8');
 const helper=source.slice(source.indexOf('async function wikimediaFetch('),source.indexOf('\nfor(const row of rows)'));
 assert.match(helper,/await fetch\(url,/,'retry helper must perform a native HTTP fetch');
 assert.match(helper,/\[429,503\]/,'retry transient Wikimedia throttling');
 assert.match(helper,/attempt<3/,'retry attempts must remain bounded');
 const collection=source.slice(source.indexOf('\nfor(const row of rows)'));
 assert.match(collection,/response=await wikimediaFetch\(api\)/,'metadata fetch needs retry');
 assert.match(collection,/res=await wikimediaFetch\(url\)/,'original image fetch needs retry');
 assert.doesNotMatch(collection,/await fetch\(/,'no direct unthrottled requests in collection loop');
});

test('unreviewed rain shells are prioritized ahead of already approved image re-downloads',()=>{
 const source=readFileSync('scripts/collect-independent-photo-bytes.mjs','utf8');
 assert.match(source,/const orderedRows=\[\.\.\.rows\]\.sort/);
 assert.match(source,/x\.verified===false&&x\.reviewStatus==='needs-visual-review'/);
 assert.match(source,/for\(const row of orderedRows\)/);
});

test('approved images do not consume collection requests before rainwear review',()=>{
 const source=readFileSync('scripts/collect-independent-photo-bytes.mjs','utf8');
 assert.match(source,/row\.verified===true&&row\.reviewStatus==='approved'/);
 assert.match(source,/status:'already-approved'/);
});
