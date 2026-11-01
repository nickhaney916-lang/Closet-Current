/** 3D66 release protection: true physical devices NEVER auto-certified.
 * Tests the on-handset report script's provenance, privacy, and manual gate.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const fromRoot=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('physical Android USB research runs via localhost only; no network upload',()=>{
 const s=fromRoot('scripts/serve-three-d-66-device.mjs');
 assert.match(s,/host='127\.0\.0\.1'/);
 assert.match(s,/port=8765/);
 assert.match(s,/adb reverse tcp:8765 tcp:8765/);
 assert.match(s,/connect-src 'self' blob:/);
 assert.match(s,/noindex,nofollow/);
 assert.ok(s.includes("pathname.split('/').includes('..')"),'The local research server must reject path traversal');
 assert.doesNotMatch(s,/\.listen\(port,'0\.0\.0\.0'/);
});
test('real original garment iframe is opted into 3D66, not fake image playback',()=>{
 const s=fromRoot('research/three-d-66/phone-acceptance.mjs');
 const html=fromRoot('research/three-d-66/phone-acceptance.html');
 assert.match(s,/cc31Diagnostics/);
 assert.match(s,/originalPhotoUVSkinUnchanged/);
 assert.match(s,/cloth\.poseTriangleContact\?\.after\?\.count/);
 assert.match(s,/sourceArticulatedUpperSleeveDrape===true/);
 assert.match(s,/skeletonBones===163/);
 assert.match(s,/actualLicensedJeansId/);
 assert.match(s,/drape66=after/);
 assert.match(html,/<iframe id="preview"/);
 assert.match(html,/usb|USB/);
 assert.match(html,/Family Alpha|familyAlpha|physical-phone/);
 assert.doesNotMatch(s,/fetch\s*\(/);
 assert.doesNotMatch(s,/localStorage|sessionStorage|indexedDB|sendBeacon/);
 assert.doesNotMatch(s,/innerHTML\s*=/);
});
test('physical hardware and human garment aesthetic never auto-approved',()=>{
 const s=fromRoot('research/three-d-66/phone-acceptance.mjs');
 assert.match(s,/values\.physical===true/);
 assert.match(s,/allowed\.every\(k=>values\[k\]\)/);
 assert.match(s,/userAttestedPhysicalHardware:claimedPhysical/);
 assert.match(s,/verifiedByAutomatedHardwareProbe:false/);
 assert.match(s,/independentlyWitnessedPhysicalTest:false/);
 assert.match(s,/familyAlphaApproval:false/);
 assert.match(s,/productionDeploymentAuthorized:false/);
 assert.match(s,/tester reported pass|TESTER REPORTED PASS/i);
 const html=fromRoot('research/three-d-66/phone-acceptance.html');
 for(const id of ['physical','front','side','pose','touch','privacy'])
  assert.match(html,new RegExp('id="'+id+'" type="checkbox"'));
});
