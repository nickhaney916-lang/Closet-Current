// Pre-review validation for static staging artifacts, no hosted requests.
// A successful result is not permission to upload or deploy.
import {lstat,readdir,readFile} from 'node:fs/promises';
import {basename,dirname,join} from 'node:path';

const forbidden=[
 'hlkgymugtfbirlpunsra', // Live Closet Current database
 'qlwotqbqxpgkheitsboe', // Drive Duel database
 'sb_publishable_5bw6Gkrw3Qx73dZYGNzmIw_x_OoauDO', // Live public key
 'https://nickhaney916-lang.github.io/Closet-Current/',
 'closet-current.pages.dev'
];
const inspectText=/\.(?:html|js|mjs|json|css|txt|webmanifest)$/i;

async function maybeStat(path){
 try{return await lstat(path);}catch(error){
  if(error?.code==='ENOENT')return null;
  throw error;
 }
}

export async function checkStagingArtifactIntegrity(dir='staging-dist'){
 if(typeof dir!=='string'||!dir.trim())
  throw new TypeError('Expected staging bundle directory.');
 // Lock inspection MUST happen before walking or opening any candidate files.
 if(await maybeStat(dir+'.build.lock'))
  throw Error('STAGING_ARTIFACT_REFUSED: staging build lock exists; verify the builder has exited before manual cleanup.');
 const neighbors=await readdir(dirname(dir));
 const prefix=basename(dir)+'.incomplete-';
 if(neighbors.some(name=>name.startsWith(prefix)))
  throw Error('STAGING_ARTIFACT_REFUSED: unfinished staging candidate detected; operator review required.');
 const root=await lstat(dir);
 if(!root.isDirectory()||root.isSymbolicLink())
  throw Error('STAGING_ARTIFACT_REFUSED: staging root must be a real directory, not a link.');
 let filesChecked=0,pathsChecked=0;
 async function walk(directory){
  const entries=await readdir(directory,{withFileTypes:true});
  for(const entry of entries){
   const path=join(directory,entry.name);
   pathsChecked++;
   // No file is allowed to escape the reviewed tree via symlink, FIFO,
   // special device, or unix socket, even if its content looks harmless.
   if(entry.isSymbolicLink()||(!entry.isFile()&&!entry.isDirectory()))
    throw Error('STAGING_ARTIFACT_REFUSED: linked or special staging entry: '+path);
   if(entry.isDirectory()){await walk(path);continue;}
   filesChecked++;
   if(!inspectText.test(entry.name))continue;
   const content=await readFile(path,'utf8');
   for(const pattern of forbidden)if(content.includes(pattern))
    throw Error('STAGING_ARTIFACT_REFUSED: live-service reference in '+path);
  }
 }
 await walk(dir);
 if(filesChecked===0)throw Error('STAGING_ARTIFACT_REFUSED: empty staging bundle.');
 // Re-check lock and incompletes in case another builder began mid-scan.
 if(await maybeStat(dir+'.build.lock')||
   (await readdir(dirname(dir))).some(name=>name.startsWith(prefix)))
  throw Error('STAGING_ARTIFACT_REFUSED: bundle changed during verification; build lock or incomplete candidate found.');
 return {format:'closet-current-static-artifact-review',fileCount:filesChecked,
  entriesChecked:pathsChecked,buildLockAbsent:true,abandonedCandidateAbsent:true,
  linkedFilesAbsent:true,knownLiveServiceRefsAbsent:true,
  permittedToDeploy:false,productionPromotion:'BLOCKED'};
}
