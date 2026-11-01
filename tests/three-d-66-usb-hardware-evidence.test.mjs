/** 3D-66 real USB capture: plain device metadata, no false phone approval.
 * Pure classifier fixtures; never access an actual user's ADB device in CI.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyDevice,getValue} from '../scripts/capture-three-d-66-android-hardware.mjs';
test('Genuine USB phone only receives candidate status, NEVER physical acceptance',()=>{
 const r=classifyDevice({hardware:'qcom',model:'Pixel 8',fingerprint:'google/shiba',kernelQemu:'0',adbTransport:'usb'});
 assert.equal(r.emulatorIndicated,false);
 assert.equal(r.usbTransportIndicated,true);
 assert.equal(r.physicalHardwareCandidate,true);
 assert.equal(r.independentlyVerifiedPhysicalHardware,false);
 const realMtp=classifyDevice({hardware:'qcom',model:'Galaxy phone',kernelQemu:'0',usbState:'mtp,adb',adbTransport:'unknown'});
 assert.equal(realMtp.usbTransportIndicated,true,'Genuine USB MTP/ADB properties should qualify as a candidate');
 assert.equal(realMtp.physicalHardwareCandidate,true);
 assert.equal(realMtp.independentlyVerifiedPhysicalHardware,false);
});
test('Emulators, USB-less, or virtual fingerprints stay blocked',()=>{
 for(const fake of [
  {kernelQemu:'1',adbTransport:'usb'},
  {model:'sdk_gphone64_x86_64',adbTransport:'usb'},
  {hardware:'ranchu',adbTransport:'usb'},
  {hardware:'goldfish',adbTransport:'usb'},
  {fingerprint:'generic_x86/sdk_gphone',adbTransport:'usb'},
  {model:'BlueStacks',adbTransport:'usb'}
 ]){
  const r=classifyDevice(fake);
  assert.equal(r.emulatorIndicated,true,'missed virtual device '+JSON.stringify(fake));
  assert.equal(r.physicalHardwareCandidate,false);
  assert.equal(r.independentlyVerifiedPhysicalHardware,false);
 }
 assert.equal(classifyDevice({hardware:'qcom',model:'Pixel',adbTransport:'unknown'}).physicalHardwareCandidate,false);
});
test('ADB capture is user-opted, local, no identifier export or automatic acceptance',()=>{
 const s=readFileSync(new URL('../scripts/capture-three-d-66-android-hardware.mjs',import.meta.url),'utf8');
 assert.match(s,/adb\(\['reverse','tcp:8765','tcp:8765'\]\)/);
 assert.match(s,/adb\(\['shell','am','start'/);
 assert.match(s,/host.*127\.0\.0\.1|const HOST='127\.0\.0\.1/);
 assert.match(s,/chromeLaunchRequested:!captureScreen/);
 assert.ok(s.includes('if(!captureScreen)adb('));
 assert.ok(s.includes('fileURLToPath(import.meta.url)'));
 assert.match(s,/realChromiumSourceSceneOpened:false/);
 assert.match(s,/humanAppearanceAccepted:false/);
 assert.match(s,/originalPhotoAndSkinnedContactValidatedOnPhone:false/);
 assert.match(s,/independentlyWitnessedPhysicalAcceptance:false/);
 assert.match(s,/productionAuthorized:false/);
 assert.match(s,/if\(captureScreen\)/);
 assert.match(s,/\['exec-out','screencap','-p'\]/);
 assert.doesNotMatch(s,/getprop.*(serialno|imei|advertis)/i);
 assert.doesNotMatch(s,/fetch\s*\(|https:\/\//);
 assert.equal(getValue('a'.repeat(1000)).length,180);
});
