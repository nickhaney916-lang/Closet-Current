/** Exact research module closure for disposable C52/C60/C61/C62 donors. */
import {readFile,writeFile,mkdir,realpath,lstat} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';
export const C52_MODULES86=Object.freeze([
 'research/mission2-source-length/actual-photo-contact-52.mjs',
 'research/mission2-source-length/upper-torso-clearance-trial60.mjs',
 'research/mission2-source-length/upper-torso-surface-quality61.mjs',
 'research/mission2-source-length/upper-torso-fit-pareto62.mjs',
 'research/mission2-p86/surface-metric.mjs',
 'research/mission2-p86/radial-fit.mjs'
]);
export async function installMeasurementModules86(sourceRoot,donorRoot){
 const source=await realpath(sourceRoot),donor=await realpath(donorRoot);
 if(source===donor||source.startsWith(donor+'/')||
  ['public','supabase'].some(p=>donor===resolve(source,p)||donor.startsWith(resolve(source,p)+'/')))
  throw Error('disposable research donor required');
 const snapshots=[];
 for(const path of C52_MODULES86){
  const bytes=await readFile(resolve(source,path));
  // Fail before writes if a future import is missing from the explicit closure.
  for(const m of bytes.toString().matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)){
   const dep=relative(source,resolve(source,dirname(path),m[1]));
   if(!C52_MODULES86.includes(dep))throw Error('measurement dependency missing: '+dep);
  }
  snapshots.push({path,bytes});
 }
 for(const {path,bytes} of snapshots){
  const target=resolve(donor,path);await mkdir(dirname(target),{recursive:true});
  // Never follow a pre-existing module symlink into the consumer tree.
  const parent=await realpath(dirname(target));if(!parent.startsWith(donor+'/'))throw Error('donor module path escaped');
  try{if((await lstat(target)).isSymbolicLink())throw Error('donor module symlink refused');}catch(e){if(e.code!=='ENOENT')throw e;}
  await writeFile(target,bytes);
  if(!(await readFile(target)).equals(bytes))throw Error('installed source byte mismatch');
 }
 return C52_MODULES86.slice();
}
