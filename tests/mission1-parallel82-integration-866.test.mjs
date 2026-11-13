/** Mission 1 P866: exact compatible P82 camera integration + P865 owner-original retention.
 * Engineering source/safety tests only: no accuracy or physical-phone claims.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SOURCE82,browserRequest82,VERSION82} from '../public/dual-core-82.mjs';
import {dualBrowserAvailable82} from '../public/dual-panel-82.mjs';
import {evaluateMission1Evidence} from '../scripts/m1-release-evidence-851.mjs';

test('P866 original-photo non-destructive review and P82 explicit opt-in coexist in actual scanner',async()=>{
 const app=await readFile('public/app.js','utf8');
 assert.match(app,/^const reviewFirst836=true;$/m);
 assert.match(app,/if\(quality\.blank\)\{/);
 assert.match(app,/This photo may be blank or featureless\. Original photo kept\./);
 assert.match(app,/Possible exact duplicate photograph\. Original photo kept\./);
 assert.match(app,/exact_duplicate_review_required/);
 assert.match(app,/pendingDraft&&new URLSearchParams\(location\.search\)\.get\('dual82'\)==='1'&&dual82OwnerId/);
 assert.match(app,/P82_STALE_SAVE_SCOPE/);
 assert.match(app,/const source73=original854\|\|source854/);
 assert.match(app,/const live854=\(\)=>sameOwner854\(\)/);
 assert.match(app,/if\(lease859&&lease859\.item!==item\)return false/);
});
test('P866 dual-model research is gated off for WebKit/iPhone user agents',()=>{
 assert.equal(dualBrowserAvailable82('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Version/17 Safari/604.1'),false);
 assert.equal(dualBrowserAvailable82('Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 CriOS/120.0 Safari/604.1'),false);
 assert.equal(dualBrowserAvailable82('Mozilla/5.0 AppleWebKit/537.36 Chrome/121.0 Safari/537.36'),true);
 assert.equal(dualBrowserAvailable82('Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15'),false);
});
test('P866 aborted optional worker never starts network inference',async()=>{
 await assert.rejects(browserRequest82({requestId:'P866_ABORT_NOT_SENT'},{signal:AbortSignal.abort()}),/P82_CANCELLED/);
 assert.equal(VERSION82,'dual-browser-review-82-v1');
 assert.ok(SOURCE82.includes('app.js')&&SOURCE82.includes('model-arbitration-81.mjs'));
});
test('P866 source retains P865 native real-browser reload/photo byte acceptance suite',async()=>{
 const original=await readFile('scripts/test-m1-original-photo-browser-865.mjs','utf8');
 assert.match(original,/sha256Preserved:true,durableReload:true,explicitRemove:true/);
 assert.match(original,/page\.reload\(/);
 assert.match(original,/getByRole\('button',\{name:'Remove photo'\}\)/);
 assert.match(original,/sameOriginForeignOwnerSeparated:true/);
});
test('P866 no new blind ground truth or physical phone evidence; no Family Alpha release',()=>{
 const gate=evaluateMission1Evidence(null);
 assert.equal(gate.status,'BLOCKED');assert.equal(gate.shouldLiftFamilyAlphaHold,false);
});
