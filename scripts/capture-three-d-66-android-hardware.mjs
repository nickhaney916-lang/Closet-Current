/** Closet Current 3D66 — Android USB real-hardware evidence collection.
 * NO remote services, customer photos, identity, serial, IMEI or advertising ID.
 * This never constitutes garment visual approval. The actual tester separately
 * exports real WebGL in-browser evidence from phone-acceptance.html.
 * Run with one connected, unlocked, USB-authorized Android phone.
 */
import {spawnSync} from 'node:child_process';
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';

const HOST='127.0.0.1:8765';
const PREVIEW='http://localhost:8765/research/three-d-66/phone-acceptance.html';
export const getValue=(s)=>String(s??'').trim().slice(0,180);
export function classifyDevice({kernelQemu='',hardware='',model='',fingerprint='',usbState='',adbTransport=''}={}){
 const lower=[kernelQemu,hardware,model,fingerprint].map(s=>getValue(s).toLowerCase());
 const virtual=lower[0]==='1'||/(?:^|[-_ ])(?:goldfish|ranchu|vbox|qemu|emulator|sdk_gphone|generic_x86|bluestacks)(?:$|[-_ ])/i.test(lower.join(' '));
 const usb=adbTransport==='usb'||usbState==='configured';
 return {emulatorIndicated:virtual,usbTransportIndicated:usb,
  physicalHardwareCandidate:!virtual&&usb,
  independentlyVerifiedPhysicalHardware:false};
}
function adb(args,{maxBuffer=1024*1024,encoding='utf8'}={}){
 const result=spawnSync('adb',args,{encoding,timeout:12000,maxBuffer,windowsHide:true});
 if(result.error)throw Error('ADB unavailable or timed out: '+result.error.message);
 if(result.status!==0)throw Error('ADB command failed: '+args.slice(0,3).join(' ')+' (exit '+result.status+')');
 return result.stdout;
}
function status(){
 const lines=String(adb(['devices','-l'])).trim().split(/\r?\n/).slice(1).filter(Boolean);
 const good=lines.filter(x=>/\tdevice\b/.test(x));
 if(lines.length!==1||good.length!==1)throw Error('Connect EXACTLY one USB-authorized Android handset (not multiple/offline/unauthorized). ADB serial is intentionally not logged.');
 return good[0].includes('usb:')?'usb':'unknown';
}
export async function recordEvidence({captureScreen=false,reportDir='benchmark/three-d-66/physical-android'}={}){
 const transport=status();
 const prop=name=>getValue(adb(['shell','getprop',name]));
 const device={
  kernelQemu:prop('ro.kernel.qemu'),
  hardware:prop('ro.hardware'),
  model:prop('ro.product.model'),
  fingerprint:prop('ro.build.fingerprint'),
  usbState:prop('sys.usb.state'),
  adbTransport:transport,
  osVersion:prop('ro.build.version.release'),
  sdkVersion:prop('ro.build.version.sdk'),
  abi:prop('ro.product.cpu.abi')
 };
 const classification=classifyDevice(device);
 if(classification.emulatorIndicated||!classification.physicalHardwareCandidate)
  throw Error('Device cannot qualify as a verified USB physical candidate (emulator, non-USB or unknown). Do not certify.');
 // Probe local server before opening Chrome; no internet required.
 const opened=await import('node:http');
 const ok=await new Promise(resolveResponse=>{
  const r=opened.get('http://'+HOST+'/research/three-d-66/phone-acceptance.html',res=>{
   res.resume();res.on('end',()=>resolveResponse(res.statusCode===200));
  });
  r.setTimeout(3000,()=>r.destroy());r.on('error',()=>resolveResponse(false));
 });
 if(!ok)throw Error('Local read-only original-photo server not running; run node scripts/serve-three-d-66-device.mjs first');
 adb(['reverse','tcp:8765','tcp:8765']);
 adb(['shell','am','start','-a','android.intent.action.VIEW','-d',PREVIEW,'com.android.chrome']);
 await mkdir(reportDir,{recursive:true});
 const report={
  schema:'ClosetCurrent-3D66-USB-Android-Preflight',
  timestamp:new Date().toISOString(),
  sourceRepository:'nickhaney916-lang/Closet-Current',
  scope:'only approved original photographs and source-skinned research renderer',
  device:{model:device.model,osVersion:device.osVersion,sdkVersion:device.sdkVersion,hardware:device.hardware,abi:device.abi},
  evidence:classification,
  adbReverseLoopback:true,
  realChromiumSourceSceneOpened:true,
  browserOriginalSourceGarmentMeasured:false,
  hardwareIdentityConfirmedByHuman:false,
  humanAppearanceAccepted:false,
  manuallyConfirmedTouchAndCamera:false,
  originalPhotoAndSkinnedContactValidatedOnPhone:false,
  originalPhotoSHA256:null,
  originalDenimSHA256:null,
  screenshotCollected:false,
  independentlyWitnessedPhysicalAcceptance:false,
  iphoneSafariAcceptance:false,
  familyAlpha:'HOLD',
  productionAuthorized:false,
  notice:'Properties are preliminary evidence, NOT physical phone or garment acceptance. Tester must inspect genuine WebGL, capture browser JSON and complete real visual gate.'
 };
 if(captureScreen){
  const png=adb(['exec-out','screencap','-p'],{maxBuffer:20*1024*1024,encoding:null});
  if(!Buffer.isBuffer(png)||png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')
   throw Error('Real device screenshot missing PNG signature; no screenshot evidence can be claimed');
  await writeFile(join(reportDir,'real-android-screen.png'),png);
  report.screenshotCollected=true;
 }
 await writeFile(join(reportDir,'usb-preflight.json'),JSON.stringify(report,null,2)+'\n','utf8');
 return report;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname)){
 const captureScreen=process.argv.includes('--capture-screen');
 recordEvidence({captureScreen}).then(r=>{
  console.log('ANDROID_USB_PREFLIGHT_RECORDED',JSON.stringify({
   model:r.device.model,os:r.device.osVersion,
   emulatorIndicated:r.evidence.emulatorIndicated,
   usbTransportIndicated:r.evidence.usbTransportIndicated,
   screenshotCollected:r.screenshotCollected,
   humanAccepted:r.humanAppearanceAccepted,release:r.productionAuthorized
  }));
 }).catch(e=>{console.error('REAL_ANDROID_USB_PREFLIGHT_HOLD:',e.message);process.exitCode=1;});
}
