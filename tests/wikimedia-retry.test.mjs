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
