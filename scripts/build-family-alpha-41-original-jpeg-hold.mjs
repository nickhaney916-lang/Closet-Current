/** Exact-source photo-import clarity overlay for the complete offline Family Alpha.
 *
 * Full Family Alpha source is inherited from PR #339. ONLY photo-import.js
 * from the current reviewed source tree is swapped. No deploy, auth, cloud,
 * original user photos, styling or atomically saved wardrobe modifications.
 */
import {assert40HOLD,OUTPUT as PARENT}
 from './build-family-alpha-40-session-fit-hold.mjs';
import {cp,rm,readFile,writeFile,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
export const OUTPUT='dist-family-alpha-41-original-jpeg-HOLD';
const FILE='photo-import.js',MARKER='alpha41-original-jpeg-HOLD-manifest.json';
const PARENT_SHA='3355f994c96250d22e099bcd2bdc7c8f161df17d';
const hash=x=>createHash('sha256').update(x).digest('hex');
async function tree(path,prefix=''){
 const found=[];
 for(const e of await readdir(path,{withFileTypes:true})){
  if(e.isSymbolicLink())throw Error('Symlinks forbidden');
  const name=prefix+e.name;
  if(e.isDirectory())found.push(...await tree(join(path,e.name),name+'/'));
  else if(e.isFile())found.push(name);
  else throw Error('Unsafe compiled output file');
 }
 return found.sort();
}
async function source(){
 const s=await readFile(join('public',FILE),'utf8');
 if(!s.includes('function plainOriginalJPEG(bytes)')||
    !s.includes('async function photoToJPEG(')||
    !s.includes('function readPhotoBatch(')||
    !s.includes('file.size<=4*1024*1024')||
    !s.includes("marker===0xfe")||
    !s.includes('data:image/jpeg;base64,'))
  throw Error('Source photo importer is missing strict marker or batch integrity rules');
 return s;
}
export async function assert41HOLD(){
 await assert40HOLD();
 const [before,actual,expected]=await Promise.all([
  tree(PARENT),tree(OUTPUT),source()]);
 assert.deepEqual(actual,[...before,MARKER].sort());
 assert.equal(await readFile(join(OUTPUT,FILE),'utf8'),expected);
 for(const file of before){
  if(file===FILE)continue;
  const [a,b]=await Promise.all([
   readFile(join(PARENT,file)),readFile(join(OUTPUT,file))]);
  assert.ok(a.equals(b),'Unrelated verified 2D garment, Auth, cloud or app asset modified '+file);
 }
 const m=JSON.parse(await readFile(join(OUTPUT,MARKER),'utf8'));
 assert.equal(m.releaseGate,'HOLD');assert.equal(m.parentPin,PARENT_SHA);
 assert.equal(m.changedAsset,FILE);
 assert.equal(m.reviewedSourceSha256,hash(expected));
 for(const key of ['deployed','liveCameraVerified','familyPrivacyVerified',
  'ownerVisualApproved','originalExifMayPassThrough','automaticRetakeDeletion'])
  assert.equal(m[key],false);
 assert.equal(m.originalJpegPreservedOnlyIfMetadataFree,true);
 assert.equal(m.metadataBearingOriginalIsReencoded,true);
 return m;
}
export async function build41HOLD(){
 await assert40HOLD();
 await rm(OUTPUT,{recursive:true,force:true});
 await cp(PARENT,OUTPUT,{recursive:true});
 const s=await source();
 await writeFile(join(OUTPUT,FILE),s);
 const m={
  releaseGate:'HOLD',parentPin:PARENT_SHA,
  changedAsset:FILE,reviewedSourceSha256:hash(s),
  originalJpegPreservedOnlyIfMetadataFree:true,
  metadataBearingOriginalIsReencoded:true,
  deployed:false,liveCameraVerified:false,familyPrivacyVerified:false,
  ownerVisualApproved:false,originalExifMayPassThrough:false,
  automaticRetakeDeletion:false,
  photoFileReadMaxMiB:10,unrecompressedOriginalMaxMiB:4,maxPixelAxis:4096
 };
 await writeFile(join(OUTPUT,MARKER),JSON.stringify(m,null,2)+'\n');
 return assert41HOLD();
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 console.log('FAMILY_ALPHA_41_ORIGINAL_JPEG_HOLD',JSON.stringify(await build41HOLD()));
