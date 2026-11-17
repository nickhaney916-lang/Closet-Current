#!/usr/bin/env node
// P97 physical-device witness ledger; simulated browsers never certify physical phones.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export const CASES=['camera-capture','gallery-jpeg','heic-conversion-or-refusal','exif-orientation','permission-denied','worker-start-inference','worker-unavailable-manual-review','no-silent-save','multi-garment-separate-review','source-original-2d','background-foreground','cold-restart','offline-online','storage-pressure','owner-logout-switch-revoke','tampered-original-rejected','thumbnail-source-mismatch-rejected','duplicate-import-rejected','v3-atomic-restore','v4-lossless-restore','unverified-3d-veto'];
const SHA=/^[a-f0-9]{40}$/;const DIGEST=/^[a-f0-9]{64}$/;const STATUSES=new Set(['PASS','FAIL','BLOCKED','NOT_TESTED']);
const DEVICES=['android-chrome','iphone-safari'];
const TRIAL_KEYS=new Set(['platform','deviceKind','model','osVersion','browserVersion','witness','cases','timingsMs','memoryMiB','notes']);
const CASE_KEYS=new Set(['id','status','observation',
  'sourceSha256','savedSha256','displayedSha256','restoredSha256','tamperedSha256','thumbnailSha256',
  'originalByteCount','savedByteCount','displayedByteCount','restoredByteCount',
  'decodedWidth','decodedHeight','displayedWidth','displayedHeight','restoredWidth','restoredHeight']);
const INVALID=/data:image|base64,|bearer\s|eyJ[a-zA-Z0-9_-]{18}|sk-proj-|password|secret|access.token|refresh.token|@|\\(?:DCIM|Users)\\|\/DCIM\//i;
function textField(value,label,maximum=160){assert.equal(typeof value,'string',label+' must be a string');assert(value.length<=maximum,label+' too long');assert(!INVALID.test(value),label+' contains prohibited raw/private data');}
function keys(obj,allowed){assert(obj&&typeof obj==='object'&&!Array.isArray(obj),'object expected');assert(Object.keys(obj).every(k=>allowed.has(k)),'unrecognized field (potential leak)');}
// Positive source/restore proof must be tied to real source receipts, not prose alone.
// Human-supplied field values are NOT cryptographic proof of physical hardware.
const PROOF_REQUIRED={
  'camera-capture':['sourceSha256','originalByteCount','decodedWidth','decodedHeight'],
  'gallery-jpeg':['sourceSha256','originalByteCount','decodedWidth','decodedHeight'],
  'source-original-2d':['sourceSha256','savedSha256','displayedSha256',
    'originalByteCount','savedByteCount','displayedByteCount',
    'decodedWidth','decodedHeight','displayedWidth','displayedHeight'],
  'v3-atomic-restore':['sourceSha256','savedSha256','restoredSha256',
    'originalByteCount','savedByteCount','restoredByteCount',
    'decodedWidth','decodedHeight','restoredWidth','restoredHeight'],
  'v4-lossless-restore':['sourceSha256','savedSha256','restoredSha256',
    'originalByteCount','savedByteCount','restoredByteCount',
    'decodedWidth','decodedHeight','restoredWidth','restoredHeight'],
  'thumbnail-source-mismatch-rejected':['sourceSha256','thumbnailSha256'],
  'tampered-original-rejected':['sourceSha256','tamperedSha256'],
  'duplicate-import-rejected':['sourceSha256','originalByteCount']
};
function checkPositiveSourceProof(c){
  for(const field of PROOF_REQUIRED[c.id]||[])
    assert(c[field]!==undefined&&c[field]!==null,c.id+': '+field+' receipt required before PASS');
  if(c.id==='source-original-2d'){
    assert.equal(c.savedSha256,c.sourceSha256,c.id+': saved JPEG SHA mismatch');
    assert.equal(c.displayedSha256,c.sourceSha256,c.id+': displayed original SHA mismatch');
    assert.equal(c.savedByteCount,c.originalByteCount,c.id+': saved byte count mismatch');
    assert.equal(c.displayedByteCount,c.originalByteCount,c.id+': displayed original byte count mismatch');
    assert.equal(c.displayedWidth,c.decodedWidth,c.id+': width mismatch');
    assert.equal(c.displayedHeight,c.decodedHeight,c.id+': height mismatch');
  }
  if(c.id==='v3-atomic-restore'||c.id==='v4-lossless-restore'){
    assert.equal(c.savedSha256,c.sourceSha256,c.id+': exported original SHA mismatch');
    assert.equal(c.restoredSha256,c.sourceSha256,c.id+': restored original SHA mismatch');
    assert.equal(c.savedByteCount,c.originalByteCount,c.id+': exported byte count mismatch');
    assert.equal(c.restoredByteCount,c.originalByteCount,c.id+': restored byte count mismatch');
    assert.equal(c.restoredWidth,c.decodedWidth,c.id+': restored width mismatch');
    assert.equal(c.restoredHeight,c.decodedHeight,c.id+': restored height mismatch');
  }
  if(c.id==='thumbnail-source-mismatch-rejected')
    assert.notEqual(c.thumbnailSha256,c.sourceSha256,c.id+': thumbnails must differ from original');
  if(c.id==='tampered-original-rejected')
    assert.notEqual(c.tamperedSha256,c.sourceSha256,c.id+': tamper did not change bytes');
}
export function blankLedger(headSha){assert(SHA.test(headSha),'exact 40-hex source HEAD required');return {schema:'closet-current-device97/v1',headSha,release:'HOLD-255',trials:DEVICES.map(platform=>({platform,deviceKind:'NOT_TESTED',model:'',osVersion:'',browserVersion:'',witness:'',cases:CASES.map(id=>({id,status:'NOT_TESTED',observation:''})),timingsMs:{},memoryMiB:null,notes:''}))};}
export function verifyLedger(ledger,{allowPhysical=false}={}){
keys(ledger,new Set(['schema','headSha','release','trials']));assert.equal(ledger.schema,'closet-current-device97/v1');assert(SHA.test(ledger.headSha),'exact HEAD source pin required');assert.equal(ledger.release,'HOLD-255','Family Alpha HOLD cannot be lifted by ledger');assert(Array.isArray(ledger.trials)&&ledger.trials.length===2,'Android and iPhone required');
const result={schema:ledger.schema,headSha:ledger.headSha,release:ledger.release,verifiedPhysicalPhones:0,physicalWitnesses:0,pass:0,fail:0,blocked:0,notTested:0,platforms:[],metrics:{}};
for(let i=0;i<2;i++){const t=ledger.trials[i];keys(t,TRIAL_KEYS);assert.equal(t.platform,DEVICES[i],'platform order and exact browser required');assert(['NOT_TESTED','EMULATOR','PHYSICAL'].includes(t.deviceKind),'invalid device kind');if(!allowPhysical)assert.notEqual(t.deviceKind,'PHYSICAL','CI may not certify an unobserved phone');for(const f of ['model','osVersion','browserVersion','witness','notes'])textField(t[f],f);if(t.deviceKind==='PHYSICAL'){for(const f of ['model','osVersion','browserVersion','witness'])assert(t[f].trim(),f+' required for physical evidence');result.physicalWitnesses++;}else assert.equal(t.witness,'','nonphysical trial cannot carry a physical witness');assert(Array.isArray(t.cases)&&t.cases.length===CASES.length,'all scenario rows required');let passed=0;
for(let j=0;j<CASES.length;j++){const c=t.cases[j];keys(c,CASE_KEYS);assert.equal(c.id,CASES[j]);assert(STATUSES.has(c.status),'invalid status for '+c.id);textField(c.observation,'case observation',240);if(c.status==='PASS'){assert.equal(t.deviceKind,'PHYSICAL',c.id+': browser simulation cannot PASS physical case');assert(c.observation.trim(),c.id+': physical PASS needs witnessed observation');checkPositiveSourceProof(c);passed++;}if(c.status==='FAIL')assert(c.observation.trim(),c.id+': FAIL needs observation');for(const n of ['sourceSha256','savedSha256','displayedSha256','restoredSha256','tamperedSha256','thumbnailSha256'])
if(c[n]!==undefined)assert(DIGEST.test(c[n]),n+' must be exact SHA256');
for(const n of ['originalByteCount','savedByteCount','displayedByteCount','restoredByteCount'])
if(c[n]!==undefined)assert(Number.isSafeInteger(c[n])&&c[n]>0,n+' invalid');
for(const n of ['decodedWidth','decodedHeight','displayedWidth','displayedHeight','restoredWidth','restoredHeight'])
if(c[n]!==undefined)assert(Number.isSafeInteger(c[n])&&c[n]>0&&c[n]<=65535,n+' invalid');result[c.status==='NOT_TESTED'?'notTested':c.status.toLowerCase()]++;}
keys(t.timingsMs,new Set(['capture','decode','workerStartup','inference','preview','restore']));for(const [name,samples] of Object.entries(t.timingsMs)){assert(Array.isArray(samples)&&samples.length<=1000,'invalid '+name+' samples');for(const ms of samples)assert(Number.isFinite(ms)&&ms>=0&&ms<=3600000,'unreliable timing');if(samples.length){const sorted=[...samples].sort((a,b)=>a-b);const quantile=p=>sorted[Math.ceil(sorted.length*p)-1];result.metrics[t.platform+'.'+name]={n:sorted.length,p50Ms:quantile(.5),p95Ms:quantile(.95),provenance:t.deviceKind==='PHYSICAL'?'physical-witness':'nonphysical'};}}
assert(t.memoryMiB===null||(Number.isFinite(t.memoryMiB)&&t.memoryMiB>0&&t.memoryMiB<65536));if(passed===CASES.length)result.verifiedPhysicalPhones++;result.platforms.push({platform:t.platform,deviceKind:t.deviceKind,passed,total:CASES.length,fullPhysicalAcceptance:passed===CASES.length});}
result.physicalAcceptance=result.verifiedPhysicalPhones===2?'WITNESSED-CHECKLIST-COMPLETE':'BLOCKED';result.hostedRls='NOT_VERIFIED';result.familyAlpha='HOLD';return result;}
async function main(args){if(args[0]==='--init'){assert(args.length===3,'usage: --init <40-hex-head-sha> <output.json>');await writeFile(args[2],JSON.stringify(blankLedger(args[1]),null,2)+'\n',{flag:'wx',mode:0o600});console.log('Created NOT_TESTED ledger; no physical acceptance implied');}else if(args[0]==='--verify'){assert(args.length===2||args.length===3,'usage: --verify <ledger.json> [--allow-physical]');const allowPhysical=args[2]==='--allow-physical';assert(args.length===2||allowPhysical);const raw=await readFile(args[1],'utf8');assert(raw.length<100000,'oversized data: do not submit photos');assert(!INVALID.test(raw),'credential/photo/identity-like content is prohibited');console.log(JSON.stringify(verifyLedger(JSON.parse(raw),{allowPhysical}),null,2));}else throw Error('usage: --init <head-sha> <file.json> | --verify <file.json> [--allow-physical]');}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main(process.argv.slice(2)).catch(e=>{console.error('P97_LEDGER_REJECTED:',e.message);process.exitCode=1;});
