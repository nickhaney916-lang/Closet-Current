import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {requireNative3D05Visible102}
 from '../research/native-3d-05/native-preview-bridge.mjs';

test('NATIVE102 visible original-photo 3D viewport alone does not revoke a signed owner',()=>{
 assert.equal(requireNative3D05Visible102({doc:{hidden:false,visibilityState:'visible'}}),true);
 assert.equal(requireNative3D05Visible102({doc:{hidden:false}}),true);
});
test('NATIVE102 tab hidden via document.hidden fails closed before original photo admission',()=>{
 assert.throws(()=>requireNative3D05Visible102({doc:{
  hidden:true,visibilityState:'visible'}}),/NATIVE102 hidden browser/);
});
test('NATIVE102 mobile hidden visibilityState fails closed even when hidden flag is stale',()=>{
 assert.throws(()=>requireNative3D05Visible102({doc:{
  hidden:false,visibilityState:'hidden'}}),/NATIVE102 hidden browser/);
});
test('NATIVE102 mobile prerender cannot open previously admitted source photos',()=>{
 assert.throws(()=>requireNative3D05Visible102({doc:{
  hidden:false,visibilityState:'prerender'}}),/NATIVE102 hidden browser/);
});
test('NATIVE102 missing lifecycle document fails closed rather than approving source photo',()=>{
 assert.throws(()=>requireNative3D05Visible102({}),/NATIVE102 hidden browser/);
});
test('NATIVE102 bridge enforces hidden check before new open and every async 3D source handoff',()=>{
 const s=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.match(s,/async function open\(\)\{\s*if\(closed\)[^\n]+\n\s*requireNative3D05Visible102\(\{doc\}\)/);
 assert.match(s,/const requireFresh=\(\)=>\{\s*if\(closed\|\|request!==attempt\)[^\n]+\n\s*requireNative3D05Visible102\(\{doc\}\)/);
 assert.match(s,/const attestOriginalBytes92=async\(\)=>/);
 assert.match(s,/await attestOriginalBytes92\(\); \/\/ Cryptographic JPEG bytes/);
 assert.match(s,/await attestOriginalBytes92\(\); \/\/ Repeat after slow WebGL/);
});
test('NATIVE102 immediate visibility and freeze cleanup uses actual original donor destroy and invalidates pending import',()=>{
 const s=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.match(s,/function cleanup\([^]*?cleaning=true;attempt\+\+/);
 assert.match(s,/oldPanel\?\.destroy\(\)/);
 assert.match(s,/const onBackground102=\(\)=>\{/);
 assert.match(s,/doc\.addEventListener\('visibilitychange',onBackground102\)/);
 assert.match(s,/doc\.addEventListener\('freeze',onFreeze102\)/);
 assert.match(s,/cleanup\('Browser backgrounded · photographed 3D preview closed/);
 assert.match(s,/cleanup\('Browser frozen · photographed 3D preview closed/);
 assert.match(s,/doc\.removeEventListener\('visibilitychange',onBackground102\)/);
 assert.match(s,/doc\.removeEventListener\('freeze',onFreeze102\)/);
});
test('NATIVE102 background tab closure preserves user native saved board and owner auth lease',()=>{
 const s=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 const a=s.slice(s.indexOf('const onBackground102='),s.indexOf("win.addEventListener('closet:alpha-session-changed'"));
 assert.doesNotMatch(a,/revoke:true|epoch\.dispose|createExistingBoard02IO|put\(|delete\(|sync\(|save\(/);
 assert.match(a,/cleanup\('Browser backgrounded/);
 assert.match(a,/cleanup\('Browser frozen/);
 assert.match(s,/const oldEpoch=revoke\?epoch:null/);
});
test('NATIVE102 background source admission guard survives state read without DOM event',()=>{
 const s=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.match(s,/const state=\(\)=>\{[^]*?onBackground102\(\);\s*revokeChangedSource89\(\)/);
 assert.match(s,/requireNative3D05Visible102\(\{doc\}\);\s*requireCurrentNative3D05Selection88/);
});
test('NATIVE102 genuine 390-pixel Chromium 163-bone WebGL test verifies hidden, forbidden reopen, fresh bytes, freeze and saved board',()=>{
 const s=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 for(const token of [
  "const native102=process.env.NATIVE102==='1'",
  'if(native102&&width===390)',
  "Object.defineProperty(document,'hidden',{configurable:true,value:true})",
  "document.dispatchEvent(new Event('visibilitychange'))",
  "document.dispatchEvent(new Event('freeze'))",
  "await page.evaluate(()=>window.native3D05Bridge.open())",
  "assert.deepEqual(await readBoard(page),ownerOriginal)",
  "'benchmark/native-3d-102/acceptance.json'",
  'realOriginalWebGLBones:163',
  'actualPhysicalAndroidIPhone:false'
 ])assert.ok(s.includes(token),'missing real browser acceptance: '+token);
});
test('NATIVE102 independent evidence audit binds photo source revocation to exact screenshot PNG SHA',()=>{
 const a=readFileSync('scripts/audit-native-3d-lifecycle-102.mjs','utf8');
 assert.match(a,/realOriginalWebGLBones,163/);
 assert.match(a,/createHash\('sha256'\)/);
 assert.match(a,/stats\.channels\.some/);
 assert.match(a,/independentlyVerifiedSHA256Screenshots:2/);
 assert.match(a,/realHumanFabricRealismVerified:false/);
});
test('NATIVE102 strict no-deploy workflow requires P100 exact SHA, real donor, inherited Node and mobile WebGL',()=>{
 const s=readFileSync('.github/workflows/native-mobile-visibility-source-revoke-102-no-deploy.yml','utf8');
 assert.match(s,/BASE=2bc59ba8e16188319a72a95ebed2b6667e0eb62f/);
 assert.match(s,/NATIVE102=1 NATIVE88=1 NATIVE89=1 NATIVE91=1 NATIVE92=1 NATIVE93=1/);
 assert.match(s,/node --test tests\/\*\.test\.cjs tests\/\*\.test\.mjs/);
 assert.match(s,/node scripts\/audit-native-3d-lifecycle-102\.mjs/);
 assert.doesNotMatch(s,/deploy-pages|gh-pages|npm publish/);
});
