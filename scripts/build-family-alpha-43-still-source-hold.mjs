/**
 * Source-pinned full Family Alpha camera still fidelity overlay (HOLD).
 * The existing pinned recognition app ALREADY uses ImageCapture.takePhoto()
 * with 4s timeout, camera-session cancellation, EXIF/orientation handled via
 * createImageBitmap, no untrusted original blob persistence, and 2048px
 * automated video-frame cadence. Do not replace it with Work40's research UI.
 *
 * Only increases the manual still-photo output ceiling to agree with the
 * safe 4096px/5.6M URI imported-photo policy. The decoded original is always
 * re-encoded on canvas, clearing EXIF/GPS; no direct raw phone file passthrough.
 */
import {assert42HOLD,OUTPUT as PARENT} from './build-family-alpha-42-photo-advice-hold.mjs';
import {cp,rm,readdir,readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
export const OUTPUT='dist-family-alpha-43-high-detail-still-HOLD';
const APP='app.js',MANIFEST='alpha43-high-detail-still-HOLD-manifest.json';
const PARENT_SHA='fd507ca185e14b4d1ef86a362edf7a136e686947';
const hash=t=>createHash('sha256').update(t).digest('hex');
function once(s,a,b){
 if(s.split(a).length!==2)throw Error('Camera source drift: '+a.slice(0,95));
 return s.replace(a,b);
}
export function patchCameraApp(full){
 const start=full.indexOf('async function captureCameraStill(track,StillCapture,isCurrent=()=>true){');
 const end=full.indexOf('\nfunction beep(){',start);
 if(start<0||end<start||full.indexOf('async function captureCameraStill(',start+1)!==-1)
  throw Error('Pinned genuine sensor-still source changed');
 let still=full.slice(start,end);
 if(!still.includes('createImageBitmap(blob,{imageOrientation:')||
  !still.includes('bitmap.close?.()')||
  !still.includes("if(!isCurrent())throw Error('Camera session ended")||
  !still.includes("for(const quality of [.94,.88,.82])"))
  throw Error('Still guard, EXIF conversion, session cancellation or quality ladder missing');
 still=once(still,'for(const target of [3072,2560,2048,1536,1024]){',
  'for(const target of [4096,3072,2560,2048,1536,1024]){');
 still=once(still,'if(jpeg.length<=2850000)return jpeg;',
  'if(jpeg.length<=5_600_000)return jpeg;');
 const result=full.slice(0,start)+still+full.slice(end);
 if(!result.includes('function captureTick(now=Date.now())')||
   !result.includes("candidate(snap());cadence.captured(now)")||
   !result.includes("Promise.race([")||
   !result.includes('4000);})')||
   !result.includes("if(!active())return;")||
   !result.includes("const quality=cameraFrameQuality();")||
   !result.includes('function snap(){'))
  throw Error('Existing timing, fallback, camera health or auto mode guards changed');
 return result;
}
async function tree(folder,prefix=''){
 const files=[];
 for(const entry of await readdir(folder,{withFileTypes:true})){
  if(entry.isSymbolicLink())throw Error('Symlink forbidden in disabled camera candidate');
  const path=prefix+entry.name;
  if(entry.isDirectory())files.push(...await tree(join(folder,entry.name),path+'/'));
  else if(entry.isFile())files.push(path);
  else throw Error('Unexpected offline camera artifact');
 }
 return files.sort();
}
export async function assert43HOLD(){
 await assert42HOLD();
 const expected=patchCameraApp(await readFile(join(PARENT,APP),'utf8'));
 assert.equal(await readFile(join(OUTPUT,APP),'utf8'),expected);
 const m=JSON.parse(await readFile(join(OUTPUT,MANIFEST),'utf8'));
 assert.equal(m.releaseGate,'HOLD');
 assert.equal(m.parentPin,PARENT_SHA);
 assert.equal(m.sourceSha256,hash(expected));
 assert.equal(m.changedFile,APP);
 assert.equal(m.manualStillMaxAxis,4096);
 assert.equal(m.manualStillMaxDataUriLength,5_600_000);
 assert.equal(m.autoFrameMaxAxis,2048);
 for(const [key,value] of Object.entries({
  deployAuthorized:false,productionModified:false,stagingModified:false,
  sessionGuardChanged:false,ownerVisualApproved:false,
  physicalCameraValidated:false,rawExifPassedThrough:false,
  savedRealFamilyPhotographs:false
 }))assert.equal(m[key],value);
 const [originals,compiled]=await Promise.all([tree(PARENT),tree(OUTPUT)]);
 assert.deepEqual(compiled,[...originals,MANIFEST].sort());
 for(const p of originals){
  if(p===APP)continue;
  assert.equal(hash(await readFile(join(OUTPUT,p))),hash(await readFile(join(PARENT,p))),
   'Out-of-scope photo, garment, authentication, atomic-save or wearable renderer change: '+p);
 }
 return m;
}
export async function build43HOLD(){
 await assert42HOLD();
 const updated=patchCameraApp(await readFile(join(PARENT,APP),'utf8'));
 await rm(OUTPUT,{recursive:true,force:true});
 await cp(PARENT,OUTPUT,{recursive:true});
 await writeFile(join(OUTPUT,APP),updated);
 const m={
  releaseGate:'HOLD',parentPin:PARENT_SHA,
  sourceSha256:hash(updated),changedFile:APP,
  purpose:'Retain more genuine manual still detail without any external photo or user data',
  manualStillMaxAxis:4096,manualStillMaxDataUriLength:5_600_000,
  autoFrameMaxAxis:2048,
  deployAuthorized:false,productionModified:false,stagingModified:false,
  sessionGuardChanged:false,ownerVisualApproved:false,
  physicalCameraValidated:false,rawExifPassedThrough:false,
  savedRealFamilyPhotographs:false
 };
 await writeFile(join(OUTPUT,MANIFEST),JSON.stringify(m,null,2)+'\n');
 return assert43HOLD();
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 console.log('FAMILY_ALPHA_43_STILL_FIDELITY_HOLD',JSON.stringify(await build43HOLD()));
