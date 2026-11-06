/** PHOTO110 — source-preserving mobile tab/freeze/review policy tests. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mobileSourceLifecycleRevocation110} from
 '../research/denim-mobile-pose-controls-109/mobile-pose-controls.mjs';
const revoke=mobileSourceLifecycleRevocation110;
test('PHOTO110 revokes actual mobile hidden and prerendered photo sessions',()=>{
 for(const visibilityState of ['hidden','prerender'])
  assert.equal(revoke({eventType:'visibilitychange',visibilityState}),true);
 assert.equal(revoke({eventType:'visibilitychange',hidden:true}),true);
 assert.equal(revoke({eventType:'visibilitychange',visibilityState:'visible',hidden:false}),false);
});
test('PHOTO110 freezes, page exits, and BFCache restores revoke even if document looks visible',()=>{
 for(const eventType of ['freeze','pagehide'])
  assert.equal(revoke({eventType,hidden:false,visibilityState:'visible'}),true);
 assert.equal(revoke({eventType:'pageshow',persisted:true}),true);
 assert.equal(revoke({eventType:'pageshow',persisted:false}),false);
 assert.equal(revoke({eventType:'focus'}),false);
 assert.equal(revoke({eventType:'orientationchange'}),false);
 assert.equal(revoke({}),false);
});
test('PHOTO110 cannot re-admit without new verified original photo review on document reload',()=>{
 const s=readFileSync('research/denim-mobile-pose-controls-109/mobile-pose-controls.mjs','utf8');
 for(const t of [
  'let busy=false,invalidated=false,last=null,disposed=false,lifecycleRevoked=false',
  '!lifecycleRevoked',
  "if(!lifecycleRevoked)invalidated=false",
  "if(lifecycleRevoked)",
  "doc.addEventListener('visibilitychange',onVisibilityChange)",
  "doc.addEventListener('freeze',onFreeze)",
  "host.addEventListener('freeze',onFreeze)",
  "host.addEventListener('pageshow',onPageShow)",
  "host.addEventListener('pagehide',onHide)",
  "revokeForLifecycle('visibilitychange')",
  "revokeForLifecycle('freeze')",
  "revokeForLifecycle('pageshow',e?.persisted===true)",
  "revokeForLifecycle('pagehide')",
  "avatar.style.visibility='hidden'",
  'requiresFreshSourceReviewAfterReload:lifecycleRevoked',
  "doc.removeEventListener('freeze',onFreeze)",
  "doc.removeEventListener('visibilitychange',onVisibilityChange)"
 ])assert.ok(s.includes(t),'missing source-bound mobile lifecycle safeguard '+t);
 assert.doesNotMatch(s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,''),/localStorage|sessionStorage|navigator\.sendBeacon|XMLHttpRequest/);
});
test('PHOTO110 Chromium hidden-document event rejects stale source and requires fresh original-source review',()=>{
 const s=readFileSync('scripts/test-denim-mobile-pose-controls-109-browser.mjs','utf8');
 for(const t of [
  "Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'})",
  "Object.defineProperty(document,'hidden',{configurable:true,value:true})",
  "document.dispatchEvent(new Event('visibilitychange'))",
  "secondTabBackgroundTransitionInHeadlessRunner:'NOT VERIFIED'",
  "window.cc109PoseUIState?.()?.lifecycleRevoked===true",
  "window.cc109PoseUIState().sourceRenderConcealed",
  'window.cc109PoseUIState().requiresFreshSourceReviewAfterReload',
  "await page.locator('#review').uncheck()",
  "await page.locator('#review').check()",
  "await page.reload()",
  "document.dispatchEvent(new Event('freeze'))",
  'assert.equal(scenarios.length,8)',
  'assert.equal(frames.length,24)'
 ])assert.ok(s.includes(t),'missing independent original-WebGL source lifecycle check '+t);
});
test('PHOTO110 is only a research branch; strict workflow cannot touch staging or production',()=>{
 const s=readFileSync('.github/workflows/denim-mobile-lifecycle-gate-110-no-deploy.yml','utf8');
 for(const t of [
  'BASE=c5930d200b8bbd1632b188fb5216bc233cffae8d',
  'node --test tests/*.test.cjs tests/*.test.mjs',
  'node scripts/test-denim-mobile-pose-controls-109-browser.mjs',
  'node scripts/audit-denim-mobile-pose-controls-109.mjs',
  'test "$(wc -l </tmp/photo110-allowed)" -eq 5'
 ])assert.ok(s.includes(t),'missing strict no-deploy source-lifecycle provenance '+t);
 assert.doesNotMatch(s,/deploy-pages|gh-pages|npm publish/);
});
