import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyDualHumanoidFace131} from '../research/dual-humanoid-face-definition-131/face-definition.mjs';

test('P150 is opt-in only in the existing saved Outfit Builder preview',()=>{
 const installer=readFileSync('scripts/install-dual-humanoid-photorealistic-integration-150.mjs','utf8');
 const native=readFileSync('research/native-3d-05/native-preview-bridge.mjs','utf8');
 assert.ok(installer.includes("get('humanoid150')==='research'"));
 assert.ok(installer.includes('dress-mobile-showroom.mjs'));
 assert.ok(installer.includes('applyDualHumanoid150(selected,current)'));
 assert.ok(installer.includes('faceDefinition150:new URLSearchParams(window.location.search).get'));
 assert.ok(native.includes('attestOriginalBytes92()'));
 assert.ok(native.includes('requireCurrentNative3D05Selection88'));
 assert.ok(native.includes('captureNative3D05Sources91'));
 assert.ok(native.includes('requireNative3D05WardrobeRevision93'));
 assert.ok(native.includes('revokeChangedSource89'));
});

test('P150 module applies pinned skin/hair then P131 facial definition without changing the rig contract',()=>{
 const source=readFileSync('research/dual-humanoid-photorealistic-integration-150/apply-humanoid.mjs','utf8');
 assert.match(source,/applyDualHumanoidRealism118/);
 assert.match(source,/applyDualHumanoidFace131/);
 assert.match(source,/sourceRigBones!==163/);
 assert.match(source,/sourceGeometryChanged/);
 assert.match(source,/releaseAuthorized:false,familyAlpha:'HOLD'/);
 assert.match(source,/disposeGroup/);
 assert.equal(typeof applyDualHumanoidFace131,'function');
});

test('browser test covers female and male source-backed figure switching at all mobile widths',()=>{
 const browser=readFileSync('scripts/test-native-3d-05-browser.mjs','utf8');
 assert.match(browser,/humanoid150=research/);
 assert.match(browser,/marker\('female'\)/);
 assert.match(browser,/selectOption\('male'\)/);
 assert.match(browser,/marker\('male'\)/);
 assert.match(browser,/\[320,390,430\]/);
 assert.match(browser,/P150==='1'/);
});

test('no-deploy artifact and state remain HOLD',()=>{
 const workflow=readFileSync('.github/workflows/dual-humanoid-photorealistic-integration-150-no-deploy.yml','utf8');
 const report=readFileSync('research/dual-humanoid-photorealistic-integration-150/REPORT.md','utf8');
 assert.match(workflow,/NO DEPLOY/i);
 assert.match(workflow,/research\/dual-humanoid-photorealistic-integration-150/);
 assert.match(report,/Family Alpha.*HOLD/);
 assert.match(report,/not.*photorealism/i);
});
