/**
 * Closet Current 3D-22 — immutable SAME-REPOSITORY CC0 archive recovery.
 *
 * In parallel PR #423 (Work #63), the two original SHA-pinned GLBs were
 * preserved losslessly as .glb.gz fixture Git blobs. These are NOT model
 * replacements or silently repinned upstream downloads. Fetch the pinned
 * commit in CI; read the exact two named Git blobs, verify blob identity,
 * gunzip with bounded output, verify original upstream SHA and GLB rig shape.
 *
 * Writes only a new immutable, research-only custody directory, using the
 * existing 3D-21 atomic importer. Never changes source photos, model pins,
 * garment geometry, production/staging, or another app.
 */
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {mkdtemp,writeFile,readFile,stat,mkdir,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {SOURCES,MODEL_OUTPUT} from '../three-d-06/fetch-licensed-avatars.mjs';
import {verifyLockedGLB,importOriginalPinnedPair} from '../three-d-21/verified-model-import.mjs';

export const ARCHIVE=Object.freeze({
 commit:'926c85ebf9d2d29c919771f3dcd6c1527208b63c',
 male:Object.freeze({path:'research/three-d-20/fixtures/male-cc0-rigged.glb.gz',
  gitBlob:'d0f424cdeb0cbd441bba90d16a9030d5e7db0ce8'}),
 female:Object.freeze({path:'research/three-d-20/fixtures/female-cc0-rigged.glb.gz',
  gitBlob:'eff0a2bde56b2e8da62c32684fb5cc11b3db0423'})
});
const hex=x=>typeof x==='string'&&/^[a-f0-9]{40}$/.test(x);
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(args,options={})=>execFileSync('git',args,{
 encoding:options.text?'utf8':null,timeout:30000,maxBuffer:5_000_000,
 stdio:['ignore','pipe','pipe']
});
export function readApprovedGitArchivedGLB(kind,{
 gitRead=git,inflate=gunzipSync
}={}){
 if(!['male','female'].includes(kind))throw Error('Only named original CC0 model archive');
 const a=ARCHIVE[kind],src=SOURCES[kind];
 if(!hex(a.gitBlob)||!hex(ARCHIVE.commit))throw Error('Unpinned original source archive');
 const committedBlob=String(gitRead(['rev-parse',ARCHIVE.commit+':'+a.path],{text:true})).trim();
 if(committedBlob!==a.gitBlob)throw Error('Archive Git object identity changed: '+kind);
 const gz=gitRead(['cat-file','blob',a.gitBlob],{});
 if(!Buffer.isBuffer(gz)||gz.length<1000||gz.length>4_000_000)
  throw Error('Invalid source archive bytes: '+kind);
 const bytes=inflate(gz,{maxOutputLength:12_000_000});
 if(!Buffer.isBuffer(bytes)||bytes.length<10000||bytes.length>12_000_000)
  throw Error('Invalid decompressed source GLB: '+kind);
 const verified=verifyLockedGLB(new Uint8Array(bytes),{
  expectedSHA:src.sha256,kind,license:src.license
 });
 return Object.freeze({kind,bytes,archiveBlob:a.gitBlob,
  archiveCommit:ARCHIVE.commit,sourceSHA256:sha(bytes),verified});
}
/**
 * Creates research-only custody atomically; can optionally populate a new
 * *ignored local CI* model runtime after both originals have passed.
 * Never overwrite existing runtime GLBs or a model custody directory.
 */
export async function recoverOriginalModels({
 output=resolve(MODEL_OUTPUT,'verified-archive-from-pr423'),
 populateResearchRuntime=false,readArchive=readApprovedGitArchivedGLB
}={}){
 const sourceDir=await mkdtemp(join(tmpdir(),'closet-current-cc0-approved-'));
 try{
  const items={};
  // Verify both before any persistent custody file is created.
  for(const kind of ['male','female']){
   const item=readArchive(kind);
   if(!item?.bytes||item.sourceSHA256!==SOURCES[kind].sha256||
    item.archiveCommit!==ARCHIVE.commit||item.archiveBlob!==ARCHIVE[kind].gitBlob)
    throw Error('Immutable original model identity required: '+kind);
   verifyLockedGLB(new Uint8Array(item.bytes),{
    expectedSHA:SOURCES[kind].sha256,kind,license:SOURCES[kind].license
   });
   items[kind]=item;
  }
  const malePath=join(sourceDir,SOURCES.male.filename),
   femalePath=join(sourceDir,SOURCES.female.filename);
  await Promise.all([
   writeFile(malePath,items.male.bytes,{flag:'wx',mode:0o600}),
   writeFile(femalePath,items.female.bytes,{flag:'wx',mode:0o600})
  ]);
  const receipt=await importOriginalPinnedPair({malePath,femalePath,output});
  if(populateResearchRuntime){
   for(const kind of ['male','female']){
    try{await stat(resolve(MODEL_OUTPUT,SOURCES[kind].filename));
     throw Error('Refuse overwrite of existing research runtime GLB: '+kind);
    }catch(err){if(err.code!=='ENOENT')throw err;}
   }
   // The active research runtime is ignored by Git. The immutable custody
   // import completed before either real model is used by QA.
   await mkdir(MODEL_OUTPUT,{recursive:true});
   for(const kind of ['male','female']){
    const path=resolve(MODEL_OUTPUT,SOURCES[kind].filename);
    await copyFile(join(receipt.destination,SOURCES[kind].filename),path);
    const bytes=await readFile(path);
    verifyLockedGLB(new Uint8Array(bytes),{
     expectedSHA:SOURCES[kind].sha256,kind,license:SOURCES[kind].license
    });
   }
   const manifest=await readFile(join(receipt.destination,'verified-assets.json'));
   await writeFile(resolve(MODEL_OUTPUT,'verified-assets.json'),manifest,{flag:'wx'});
  }
  return Object.freeze({status:'VERIFIED_ORIGINAL_CC0_RECOVERED_FROM_IMMUTABLE_REPO_ARCHIVE',
   archiveCommit:ARCHIVE.commit,
   archiveBlobs:{male:ARCHIVE.male.gitBlob,female:ARCHIVE.female.gitBlob},
   originalHashes:{male:SOURCES.male.sha256,female:SOURCES.female.sha256},
   models:receipt.sourceFiles,productionTouched:false,releaseAuthorized:false,
   genuineTriangleContactNotYetCertified:true,
   custodyDirectory:receipt.destination,researchRuntimePopulated:populateResearchRuntime});
 }finally{await rm(sourceDir,{recursive:true,force:true});}
}
if(process.argv[1]?.endsWith('recover-original-cc0.mjs')){
 recoverOriginalModels({populateResearchRuntime:true})
  .then(r=>console.log('THREE_D_22_ORIGINAL_CC0_RECOVERY',JSON.stringify(r)))
  .catch(e=>{console.error('THREE_D_22_RECOVERY_BLOCKED',e.message);
   process.exitCode=1;});
}
