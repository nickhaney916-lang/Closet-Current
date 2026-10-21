// Stage test assets outside the uploadable directory. A failed build must
// never leave a partially configured staging-dist/ ready for upload.
import {rm,rename} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';

export async function writeAtomicStagingBundle(outputDir,generate){
 if(typeof outputDir!=='string'||!outputDir.trim()||typeof generate!=='function')
  throw new TypeError('Expected staging output directory and generator callback');
 const pendingDir=outputDir+'.incomplete-'+process.pid+'-'+randomBytes(8).toString('hex');
 // Discard stale output before attempting a new build. A failed rebuild must
 // not leave a prior staging bundle looking current.
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
}
