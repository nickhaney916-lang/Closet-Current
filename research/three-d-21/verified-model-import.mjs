/**
 * 3D-21 — Fail-closed restore of the *original*, exact-pinned CC0 humanoids.
 *
 * Innerscene public delivery can change bytes. An upstream 200 response
 * is never approval to change the old GLB or its immutable SHA.
 * This is offline custody/reproducibility only, NOT a garment fit fix.
 */
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,rename,rm,stat} from 'node:fs/promises';
import {dirname,resolve,basename} from 'node:path';
import {randomUUID} from 'node:crypto';
import {SOURCES,validateGLB,MODEL_OUTPUT} from '../three-d-06/fetch-licensed-avatars.mjs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const isSHA=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const MAX_BYTES=12_000_000;
export const CUSTODY_STATUS=Object.freeze({
 recovered:'VERIFIED_PINNED_SOURCE_RECOVERED',
 blocked:'HOLD_SOURCE_BYTES_UNAVAILABLE_OR_MISMATCH',
 releaseAuthorized:false
});
/** Pure verification, independently testable with generated synthetic GLBs. */
export function verifyLockedGLB(bytes,{expectedSHA,kind,license='CC0-1.0'}={}){
 if(!['male','female'].includes(kind)||!isSHA(expectedSHA)||license!=='CC0-1.0')
  throw Error('A named, SHA-256-locked original CC0 model is required');
 if(!(bytes instanceof Uint8Array)||bytes.byteLength<10000||bytes.byteLength>MAX_BYTES)
  throw Error('Model bytes missing or outside verified bounds: '+kind);
 const actualSHA=sha(bytes);
 if(actualSHA!==expectedSHA)throw Error('LOCKED_SHA_MISMATCH: '+kind+
  ' expected='+expectedSHA+' observed='+actualSHA);
 const shape=validateGLB(bytes);
 return Object.freeze({kind,sha256:actualSHA,license,bytes:bytes.byteLength,
  ...shape,originalSourcePreserved:true,releaseAuthorized:false});
}
async function readBounded(path){
 if(typeof path!=='string'||!path.trim())throw Error('Explicit local source file required');
 const meta=await stat(path);
 if(!meta.isFile()||meta.size<10000||meta.size>MAX_BYTES)
  throw Error('Local file missing or exceeds GLB limits');
 return new Uint8Array(await readFile(path));
}
/** Examine ALL input files and both canonical source hashes before any write. */
export async function verifyTwoOriginals({malePath,femalePath}={}){
 if(!malePath||!femalePath||resolve(malePath)===resolve(femalePath))
  throw Error('Two independent original male/female local GLB paths required');
 const rows={};
 for(const [kind,path] of [['male',malePath],['female',femalePath]]){
  const source=SOURCES[kind];
  rows[kind]={...verifyLockedGLB(await readBounded(path),{
   expectedSHA:source.sha256,kind,license:source.license
  }),source:source.source,filename:source.filename};
 }
 return Object.freeze(rows);
}
/**
 * Import only into a NEW empty directory. Never overwrite existing model
 * files, silently replace files with a newer published GLB, or modify a
 * live/staging/production model. The whole two-model directory becomes
 * visible only once BOTH originals have passed all checks.
 *
 * Use explicit input paths supplied by the operator. No network calls.
 */
export async function importOriginalPinnedPair({
 malePath,femalePath,output=resolve(MODEL_OUTPUT,'locked-recovery')
}={}){
 const target=resolve(output),parent=dirname(target);
 // This is a new immutable recovery directory, not the normal model store.
 if(target===resolve(MODEL_OUTPUT)||target===resolve('.'))
  throw Error('Refusing to replace the active research model directory');
 try{await stat(target);throw Error('Refusing to overwrite existing model custody directory');}
 catch(e){if(e.code!=='ENOENT')throw e;}
 const verified=await verifyTwoOriginals({malePath,femalePath});
 await mkdir(parent,{recursive:true});
 const tmp=resolve(parent,'.'+basename(target)+'.'+randomUUID()+'.pending');
 await mkdir(tmp,{recursive:false});
 try{
  for(const kind of ['male','female']){
   const sourcePath=kind==='male'?malePath:femalePath;
   const data=await readBounded(sourcePath);
   verifyLockedGLB(data,{expectedSHA:SOURCES[kind].sha256,kind,license:SOURCES[kind].license});
   await writeFile(resolve(tmp,SOURCES[kind].filename),data,{flag:'wx',mode:0o600});
  }
  // Verify the staged bytes again, not just the input path that could change.
  for(const kind of ['male','female']){
   const data=await readBounded(resolve(tmp,SOURCES[kind].filename));
   verifyLockedGLB(data,{expectedSHA:SOURCES[kind].sha256,kind,license:SOURCES[kind].license});
  }
  await writeFile(resolve(tmp,'verified-assets.json'),JSON.stringify({
   status:CUSTODY_STATUS.recovered,
   purpose:'immutable-original-source-research-recovery',
   releaseAuthorized:false,productionTouched:false,
   sourceFiles:[verified.male,verified.female]
  },null,2),{flag:'wx',mode:0o600});
  await rename(tmp,target);
  return Object.freeze({status:CUSTODY_STATUS.recovered,destination:target,
   sourceFiles:[verified.male,verified.female],
   releaseAuthorized:false,productionTouched:false});
 }catch(e){
  await rm(tmp,{recursive:true,force:true});
  throw e;
 }
}
if(import.meta.url===new URL('file://'+process.argv[1]).href){
 const [malePath,femalePath,target]=process.argv.slice(2);
 importOriginalPinnedPair({malePath,femalePath,output:target||undefined})
  .then(x=>console.log('CC0_ORIGINAL_CUSTODY',JSON.stringify(x)))
  .catch(e=>{console.error('CC0_ORIGINAL_CUSTODY_BLOCKED',e.message);process.exitCode=1;});
}
