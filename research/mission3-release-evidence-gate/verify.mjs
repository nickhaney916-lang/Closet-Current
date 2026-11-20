/**
 * Mission 3 release evidence preflight, NOT a deployment or release authorizer.
 *
 * Reads local redacted receipts and explicitly supplied ORIGINAL JPEG bytes,
 * never uploads/logs originals. No network, Supabase access, production changes,
 * raw JWTs, personal identifiers or auto-GO.
 * A passing manifest is READY_FOR_INDEPENDENT_REVIEW, never a verified phone,
 * hosted-cloud acceptance or permission to remove Family Alpha HOLD #255.
 */
import {createHash} from 'node:crypto';
import {readFile,lstat,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const DEVICE_CASES=Object.freeze([
 'camera-allow-deny','original-photo-preserved','owner-reviewed-save',
 'saved-private-closet','account-switch-private','same-owner-relogin',
 'outfit-swap','dress-bottom-suppression','source-photo-2d-fallback',
 'offline-retry','interrupted-camera-recovery','restart-source-persistence',
 'cloud-restore-photo-custody'
]);
export const CLOUD_CASES=Object.freeze([
 'signed-owner-jwt','owner-read-write','foreign-read-denied',
 'foreign-write-denied','anonymous-access-denied','private-jpeg-access-denied',
 'original-jpeg-sha256','reviewed-cutout-sha256','backup-revision-cas',
 'cancel-no-replacement','remote-conflict-no-silent-merge',
 'atomic-restore-and-reopen','four-account-isolation'
]);
export const INTEGRATION_CASES=Object.freeze([
 'original-capture-to-owner-review','owner-correction-no-silent-save',
 'signed-private-save','source-verified-outfit-selection',
 'source-3d-quality-gate-or-original-2d-fallback',
 'lossless-backup-and-restore','four-account-session-leakage-denied'
]);
const APP_STEPS=Object.freeze([
 'login','capture','cameraModes','recognition','adjust',
 'outfitCapture','closet','outfit','return','backup'
]);
const APP_EVENTS=new Set([
 'photo_queued','setup_start','setup_ready','scanner_progress','scanner_error',
 'worker_start_failed','timeout','not_recognized','duplicate_review',
 'blank_skipped','exact_duplicate_skipped','recognized_saved',
 'photo_check_failed','outfit_split_start','outfit_split_ready','outfit_split_failed'
]);
// An earlier genuine runtime/photograph/split failure must not be hidden by
// manually selected PASS steps or a later saved-recognition event. The owner
// can restart device QA for a fresh, clean private report after fixing it.
const FATAL_DEVICE_EVENTS=new Set([
 'scanner_error','worker_start_failed','timeout',
 'photo_check_failed','outfit_split_failed'
]);
const APP_STAGES=new Set([
 'idle','runtime','weights','runtime_import','model_download','ready',
 'catalog_import','identify','details','photo_check'
]);
const APP_CODES=new Set(['network','memory','runtime','image','asset','unknown']);
const SHA256=/^[a-f0-9]{64}$/,GIT_SHA=/^[a-f0-9]{40}$/,SHORT_SHA=/^[a-f0-9]{12}$/;
const ALLOWED_STATUS=new Set(['PASS','FAIL','NOT_RUN','BLOCKED']);
const FAMILIES=Object.freeze({
 'android-chrome':'Android','ios-safari':'iPhone/iPad'
});
const FILE=/^[A-Za-z0-9][A-Za-z0-9_.-]{0,100}\.json$/;
const ORIGINAL_JPEG_MAX_BYTES=50*1024*1024;
const PHYSICAL_PHOTO_PROOF=Symbol('only-local-file-read-photo-proof');
const PHOTO_PHASES=Object.freeze(['capture','saved','restored']);
function originalFileName(family,index,phase){
 return family+'-'+String(index+1).padStart(2,'0')+'-'+phase+'.jpg';
}

function object(x){return !!x&&typeof x==='object'&&!Array.isArray(x);}
function keys(x,allowed,path,errors){
 if(!object(x)){errors.push(path+': expected object');return false;}
 for(const k of Object.keys(x))if(!allowed.includes(k))errors.push(path+': contains unexpected field');
 return true;
}
function field(x,k,path,errors,valid){
 if(!valid(x?.[k]))errors.push(path+'.'+k+': missing or invalid');
}
function testedDate(s){return typeof s==='string'&&
  /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(s)&&
  Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,19)===s.slice(0,19);}
function caseStatuses(value,required,path,errors){
 if(!keys(value,required,path,errors))return;
 for(const k of required){
  const status=value[k];
  if(!ALLOWED_STATUS.has(status))errors.push(path+'.'+k+': missing or invalid status');
  else if(status!=='PASS')errors.push(path+'.'+k+': not PASS');
 }
}
function photoReceipt(x,index,path,errors){
 const p=path+'['+index+']';
 if(!keys(x,['capture','saved','restored'],p,errors))return;
 for(const k of ['capture','saved','restored'])
  field(x,k,p,errors,v=>typeof v==='string'&&SHA256.test(v));
 if(x.capture&&x.saved&&x.restored&&
    !(x.capture===x.saved&&x.saved===x.restored))
  errors.push(p+': original JPEG SHA changed during save/restore');
}
function photoByteProof(receipt,family,index,photoFiles,errors,path){
 for(const phase of PHOTO_PHASES){
  const p=path+'['+index+'].'+phase;
  const value=photoFiles instanceof Map?
   photoFiles.get(originalFileName(family,index,phase)):undefined;
  const raw=value instanceof Uint8Array?value:null;
  const local=raw?null:(value?.[PHYSICAL_PHOTO_PROOF]===true?value:null);
  if((!raw&&!local)||(raw&&(raw.byteLength<4||raw.byteLength>ORIGINAL_JPEG_MAX_BYTES))){
   errors.push(p+': original JPEG bytes missing or outside safe size limit');
   continue;
  }
  const jpeg=raw?
   raw[0]===0xff&&raw[1]===0xd8&&
   raw[raw.byteLength-2]===0xff&&raw[raw.byteLength-1]===0xd9:
   local.isJpegEnvelope===true;
  if(!jpeg)errors.push(p+': invalid JPEG envelope');
  const digest=raw?createHash('sha256').update(raw).digest('hex'):local.digest;
  if(typeof receipt?.[phase]==='string'&&SHA256.test(receipt[phase])&&
     digest!==receipt[phase])
   errors.push(p+': original JPEG byte digest mismatch');
 }
}
function reportShape(value,family,appAssetRelease,errors,path){
 if(!keys(value,['format','version','appRelease','platform','steps','events'],path,errors))return;
 if(value.format!=='closet-current-device-check'||value.version!==1)
  errors.push(path+': not a Closet Current device-check export');
 if(value.platform!==FAMILIES[family])errors.push(path+': wrong device family');
 if(!SHORT_SHA.test(value.appRelease||'')||
    value.appRelease!==appAssetRelease)
  errors.push(path+': app release mismatch with tested source head');
 if(keys(value.steps,APP_STEPS,path+'.steps',errors)){
  for(const k of APP_STEPS)if(value.steps[k]!=='pass')
   errors.push(path+'.steps.'+k+': missing app-confirmed PASS');
 }
 if(!Array.isArray(value.events)||value.events.length>40){
  errors.push(path+'.events: invalid or unbounded');
 }else{
  // The shipped device exporter retains only the last 40 events. A full
  // export may have dropped an earlier genuine failure; without a separate
  // lossless failure receipt, even 40 benign entries are not exculpatory.
  if(value.events.length===40)
   errors.push(path+': 40-event device diagnostic cap reached; omitted earlier faults cannot be ruled out');
  if(!value.events.some(e=>e?.type==='recognized_saved'))
   errors.push(path+': missing recorded saved-recognition event');
  for(const [i,event] of value.events.entries()){
   const p=path+'.events['+i+']';
   if(!keys(event,['type','stage','code','durationMs','percent'],p,errors))continue;
   if(!APP_EVENTS.has(event.type))errors.push(p+'.type: unrecognized');
   if(FATAL_DEVICE_EVENTS.has(event.type))
    errors.push(p+': recorded device failure requires a new clean QA session');
   if(event.stage!==undefined&&!APP_STAGES.has(event.stage))errors.push(p+'.stage: unexpected');
   if(event.code!==undefined&&!APP_CODES.has(event.code))errors.push(p+'.code: unexpected');
   if(event.durationMs!==undefined&&(!Number.isInteger(event.durationMs)||event.durationMs<0||event.durationMs>600000))
    errors.push(p+'.durationMs: out of range');
   if(event.percent!==undefined&&(!Number.isInteger(event.percent)||event.percent<0||event.percent>100))
    errors.push(p+'.percent: out of range');
  }
 }
}
function artifact(files,name,expected,errors,path){
 if(typeof name!=='string'||!FILE.test(name)){errors.push(path+': invalid safe JSON filename');return null;}
 if(typeof expected!=='string'||!SHA256.test(expected)){errors.push(path+': missing SHA256 receipt');return null;}
 const bytes=files instanceof Map?files.get(name):files?.[name];
 if(!(bytes instanceof Uint8Array)||bytes.byteLength>1048576){
  errors.push(path+': artifact missing or over 1 MiB');return null;
 }
 const actual=createHash('sha256').update(bytes).digest('hex');
 if(actual!==expected){errors.push(path+': artifact digest mismatch');return null;}
 try{
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 }catch{errors.push(path+': invalid UTF-8 JSON');return null;}
}

/** Pure, offline, fail-closed evidence preflight. Strings from artifacts never appear in output. */
export function verifyEvidence(manifest,files=new Map(),photoFiles=new Map()){
 const errors=[],path='mission3';
 if(!keys(manifest,['schema','sourceHead','appAssetRelease','devices','cloud','integration','ownerApproval'],path,errors))
  return {status:'BLOCKED',releaseAuthorized:false,issues:errors};
 if(manifest.schema!==1)errors.push('mission3.schema: unsupported');
 if(!GIT_SHA.test(manifest.sourceHead||''))errors.push('mission3.sourceHead: exact Git SHA required');
 if(!SHORT_SHA.test(manifest.appAssetRelease||''))errors.push('mission3.appAssetRelease: exact published asset version required');
 const observed=new Set();
 // A copied JPEG may be tested on another phone as a restore scenario, but
 // must not be counted twice as an independently captured photo sample.
 const originalCaptureFamily=new Map();
 if(!Array.isArray(manifest.devices)||manifest.devices.length!==2){
  errors.push('mission3.devices: exactly one physical Android and one physical iPhone required');
 }else{
  for(const [i,d] of manifest.devices.entries()){
   const p='mission3.devices['+i+']';
   if(!keys(d,['family','execution','osVersion','browserVersion','testedAt','reportFile','reportSha256','cases','photoReceipts'],p,errors))continue;
   if(!Object.hasOwn(FAMILIES,d.family))errors.push(p+'.family: unsupported');
   if(observed.has(d.family))errors.push(p+'.family: duplicate');observed.add(d.family);
   if(d.execution!=='physical')errors.push(p+': CSS viewport or emulator is not a physical phone');
   field(d,'osVersion',p,errors,v=>typeof v==='string'&&/^\d{1,3}(?:\.\d{1,3}){0,3}$/.test(v));
   field(d,'browserVersion',p,errors,v=>typeof v==='string'&&/^\d{1,3}(?:\.\d{1,4}){0,5}$/.test(v));
   if(!testedDate(d.testedAt))errors.push(p+'.testedAt: actual UTC execution time required');
   caseStatuses(d.cases,DEVICE_CASES,p+'.cases',errors);
   if(!Array.isArray(d.photoReceipts)||d.photoReceipts.length<15||d.photoReceipts.length>40)
    errors.push(p+'.photoReceipts: at least 15 and at most 40 real original-JPEG receipts required');
   else{
    const seen=new Set();
    for(const [j,v] of d.photoReceipts.entries()){
     photoReceipt(v,j,p+'.photoReceipts',errors);
     if(Object.hasOwn(FAMILIES,d.family))
      photoByteProof(v,d.family,j,photoFiles,errors,p+'.photoReceipts');
     if(seen.has(v?.capture))errors.push(p+'.photoReceipts['+j+']: duplicate original SHA');
     seen.add(v?.capture);
     // Only hash identity is compared; do not expose source JPEG bytes or
     // either digest in output. Account/device claims remain self-reported.
     if(typeof v?.capture==='string'&&SHA256.test(v.capture)){
      const prior=originalCaptureFamily.get(v.capture);
      if(prior!==undefined&&prior!==d.family)
       errors.push(p+'.photoReceipts['+j+']: cross-device original JPEG SHA reused');
      else if(prior===undefined)originalCaptureFamily.set(v.capture,d.family);
     }
    }
   }
   const app=artifact(files,d.reportFile,d.reportSha256,errors,p+'.report');
   if(app)reportShape(app,d.family,manifest.appAssetRelease||'',errors,p+'.report');
  }
 }
 for(const family of Object.keys(FAMILIES))if(!observed.has(family))
  errors.push('mission3.devices: missing '+family);
 const c=manifest.cloud;
 if(keys(c,['environment','testedAt','testAccounts','cases','reportFile','reportSha256'],path+'.cloud',errors)){
  if(c.environment!=='authorized-hosted')errors.push('mission3.cloud: disposable database is not hosted acceptance');
  if(!testedDate(c.testedAt))errors.push('mission3.cloud.testedAt: missing UTC execution time');
  if(!Array.isArray(c.testAccounts)||c.testAccounts.length!==4||
     new Set(c.testAccounts).size!==4||
     c.testAccounts.some(v=>!/^tester-[1-4]$/.test(v)))
   errors.push('mission3.cloud: four distinct pseudonymous tester slots required');
  caseStatuses(c.cases,CLOUD_CASES,path+'.cloud.cases',errors);
  const proof=artifact(files,c.reportFile,c.reportSha256,errors,path+'.cloud.report');
  if(proof){
   if(keys(proof,['format','version','environment','testAccounts','passedCases','sourceHead','testedAt'],path+'.cloud.report',errors)){
    if(proof.format!=='closet-current-mission3-cloud-check'||proof.version!==1||
       proof.environment!=='authorized-hosted')
     errors.push('mission3.cloud.report: wrong evidence type/environment');
    // Digest matching is not enough: a prior hosted receipt must not be
    // relabeled as evidence for a different integrated source or test time.
    if(proof.sourceHead!==manifest.sourceHead||!GIT_SHA.test(proof.sourceHead||''))
     errors.push('mission3.cloud.report: different source head');
    if(proof.testedAt!==c.testedAt||!testedDate(proof.testedAt))
     errors.push('mission3.cloud.report: test time mismatch');
    if(JSON.stringify(proof.testAccounts)!==JSON.stringify(c.testAccounts))
     errors.push('mission3.cloud.report: test account aliases differ');
    if(!Array.isArray(proof.passedCases)||proof.passedCases.length!==CLOUD_CASES.length||
       new Set(proof.passedCases).size!==CLOUD_CASES.length||
       CLOUD_CASES.some(k=>!proof.passedCases.includes(k)))
     errors.push('mission3.cloud.report: case receipts incomplete');
   }
  }
 }
 const g=manifest.integration;
 if(keys(g,['sourceHead','mission1Head','mission2Head','mission3Head','testedAt','cases','reportFile','reportSha256'],path+'.integration',errors)){
  for(const k of ['sourceHead','mission1Head','mission2Head','mission3Head'])
   field(g,k,path+'.integration',errors,v=>typeof v==='string'&&GIT_SHA.test(v));
  if(g.sourceHead!==manifest.sourceHead)
   errors.push('mission3.integration: different head from tested device release');
  if(!testedDate(g.testedAt))errors.push('mission3.integration.testedAt: missing UTC execution time');
  caseStatuses(g.cases,INTEGRATION_CASES,path+'.integration.cases',errors);
  const proof=artifact(files,g.reportFile,g.reportSha256,errors,path+'.integration.report');
  if(proof){
   if(keys(proof,['format','version','sourceHead','passedCases','testedAt'],path+'.integration.report',errors)){
    if(proof.format!=='closet-current-mission3-integration'||proof.version!==1||
       proof.sourceHead!==g.sourceHead)
     errors.push('mission3.integration.report: mismatched source/build');
    if(proof.testedAt!==g.testedAt||!testedDate(proof.testedAt))
     errors.push('mission3.integration.report: test time mismatch');
    if(!Array.isArray(proof.passedCases)||proof.passedCases.length!==INTEGRATION_CASES.length||
       new Set(proof.passedCases).size!==INTEGRATION_CASES.length||
       INTEGRATION_CASES.some(k=>!proof.passedCases.includes(k)))
     errors.push('mission3.integration.report: case receipts incomplete');
   }
  }
 }
 if(manifest.ownerApproval!=='HOLD'&&manifest.ownerApproval!=='REVIEW_REQUESTED')
  errors.push('mission3.ownerApproval: owner-controlled HOLD #255 cannot be removed by this tool');
 return {
  status:errors.length?'BLOCKED':'EVIDENCE_READY_FOR_INDEPENDENT_REVIEW',
  releaseAuthorized:false,familyAlpha:'HOLD',
  inputsChecked:{physicalDeviceSlots:observed.size,
   hostedCloudEvidence:!!c?.reportFile,integratedBuildEvidence:!!g?.reportFile},
  issues:errors
 };
}
export function blankManifest(){
 const statuses=keys=>Object.fromEntries(keys.map(k=>[k,'NOT_RUN']));
 return {
  schema:1,sourceHead:'UNKNOWN',appAssetRelease:'UNKNOWN',
  devices:Object.keys(FAMILIES).map(family=>({
   family,execution:'NOT_RUN',osVersion:'',browserVersion:'',testedAt:'',
   reportFile:family+'-device-check.json',reportSha256:'UNKNOWN',
   cases:statuses(DEVICE_CASES),photoReceipts:[]
  })),
  cloud:{environment:'NOT_RUN',testedAt:'',testAccounts:[],
   cases:statuses(CLOUD_CASES),reportFile:'hosted-cloud-check.json',reportSha256:'UNKNOWN'},
  integration:{sourceHead:'UNKNOWN',mission1Head:'UNKNOWN',
   mission2Head:'UNKNOWN',mission3Head:'UNKNOWN',testedAt:'',
   cases:statuses(INTEGRATION_CASES),
   reportFile:'integrated-check.json',reportSha256:'UNKNOWN'},
  ownerApproval:'HOLD'
 };
}
async function readLocalArtifacts(manifest,manifestPath){
 const files=new Map(),folder=dirname(manifestPath);
 const names=[...(Array.isArray(manifest?.devices)?manifest.devices.map(x=>x?.reportFile):[]),
  manifest?.cloud?.reportFile,manifest?.integration?.reportFile];
 for(const name of names){
  if(typeof name!=='string'||!FILE.test(name)||files.has(name))continue;
  const path=join(folder,name);
  try{
   const stat=await lstat(path);
   if(!stat.isFile()||stat.isSymbolicLink()||stat.size>1048576)continue;
   files.set(name,await readFile(path));
  }catch{}
 }
 return files;
}
// Private-only operator receipt path: fixed filenames derived from the two
// allowed families, indices and phases. No JSON-supplied filesystem paths.
// Hash with bounded fixed-size reads, not 90 potentially 24MP JPEGs in RAM.
// Never reveal file paths, original names, bytes or computed SHA values.
async function readLocalOriginalPhotoBytes(manifest,folder){
 const photoFiles=new Map();
 if(typeof folder!=='string'||!folder.trim())return photoFiles;
 try{
  const root=await lstat(folder);
  if(!root.isDirectory()||root.isSymbolicLink())return photoFiles;
 }catch{return photoFiles;}
 for(const d of Array.isArray(manifest?.devices)?manifest.devices:[]){
  if(!object(d)||!Object.hasOwn(FAMILIES,d.family)||
     !Array.isArray(d.photoReceipts)||d.photoReceipts.length>40)continue;
  for(let i=0;i<d.photoReceipts.length;i++)for(const phase of PHOTO_PHASES){
   const name=originalFileName(d.family,i,phase),file=join(folder,name);
   let fh;
   try{
    const pre=await lstat(file);
    if(!pre.isFile()||pre.isSymbolicLink()||pre.size<4||
       pre.size>ORIGINAL_JPEG_MAX_BYTES)continue;
    fh=await open(file,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
    const stat=await fh.stat();
    if(!stat.isFile()||stat.size<4||stat.size>ORIGINAL_JPEG_MAX_BYTES)continue;
    const hash=createHash('sha256'),buffer=Buffer.allocUnsafe(128*1024);
    let read=0,first=Buffer.alloc(0),tail=Buffer.alloc(0);
    while(read<=ORIGINAL_JPEG_MAX_BYTES){
     const chunk=await fh.read(buffer,0,buffer.length,read);
     if(!chunk.bytesRead)break;
     if(read+chunk.bytesRead>ORIGINAL_JPEG_MAX_BYTES)break;
     const bytes=buffer.subarray(0,chunk.bytesRead);
     hash.update(bytes);
     if(first.length<2)
      first=Buffer.concat([first,bytes.subarray(0,2-first.length)]);
     tail=Buffer.concat([tail,bytes]).subarray(-2);
     read+=chunk.bytesRead;
    }
    if(read!==stat.size)continue;
    photoFiles.set(name,{
     [PHYSICAL_PHOTO_PROOF]:true,digest:hash.digest('hex'),
     isJpegEnvelope:first[0]===0xff&&first[1]===0xd8&&
      tail[0]===0xff&&tail[1]===0xd9
    });
   }catch{}finally{try{await fh?.close();}catch{}}
  }
 }
 return photoFiles;
}
const invoked=process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]);
if(invoked){
 const mode=process.argv[2];
 if(mode==='--template'&&process.argv.length===3){
  process.stdout.write(JSON.stringify(blankManifest(),null,2)+'\n');
 }else if(mode==='--verify'&&(process.argv.length===4||process.argv.length===5)){
  let result;
  try{
   const filename=process.argv[3],info=await lstat(filename);
   if(!info.isFile()||info.isSymbolicLink()||info.size>1048576)
    throw Error('unsupported or oversized manifest');
   const data=await readFile(filename);
   const manifest=JSON.parse(data.toString('utf8'));
   const photos=process.argv.length===5?
    await readLocalOriginalPhotoBytes(manifest,process.argv[4]):new Map();
   result=verifyEvidence(manifest,await readLocalArtifacts(manifest,filename),photos);
  }catch{result={status:'BLOCKED',releaseAuthorized:false,familyAlpha:'HOLD',issues:['manifest: missing, invalid or too large']};}
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  if(result.status==='BLOCKED')process.exitCode=2;
 }else{
  process.stderr.write('Usage: node verify.mjs --template OR node verify.mjs --verify /private/mission3.json /private/original-jpeg-folder\n');
  process.exitCode=64;
 }
}
