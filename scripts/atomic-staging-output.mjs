// Protect restricted staging output from overlapping builders and abrupt kills.
// A .incomplete-* candidate is never valid to deploy.
import {rm,rename,open,readdir} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {basename,dirname} from 'node:path';
export async function writeAtomicStagingBundle(outputDir,generate){
 if(typeof outputDir!=='string'||!outputDir.trim()||typeof generate!=='function')
  throw new TypeError('Expected staging output directory and generator callback');
 const lockPath=outputDir+'.build.lock';
 const pendingDir=outputDir+'.incomplete-'+process.pid+'-'+randomBytes(8).toString('hex');
 let lock;
 // Acquire the exclusive lock BEFORE deleting any prior artifact.
 try{lock=await open(lockPath,'wx',0o600);}
 catch(error){
  if(error?.code==='EEXIST')
   throw Error('Staging build already locked. Verify the process has exited before manually removing the lock.');
  throw error;
 }
 try{
  await lock.writeFile('process='+process.pid+'\nstate=staging-build-in-progress\n');
  const prefix=basename(outputDir)+'.incomplete-';
  const orphan=(await readdir(dirname(outputDir))).filter(name=>name.startsWith(prefix));
  if(orphan.length)
   throw Error('Interrupted staging candidate found. Inspect and manually remove incomplete files before rebuilding; refusing to change existing output.');
  await rm(outputDir,{recursive:true,force:true});
  try{
   const result=await generate(pendingDir);
   await rename(pendingDir,outputDir);
   return result;
  }catch(error){
   await rm(pendingDir,{recursive:true,force:true});
   await rm(outputDir,{recursive:true,force:true});
   throw error;
  }
 }finally{
  try{await lock.close();}finally{await rm(lockPath,{force:true});}
 }
}
