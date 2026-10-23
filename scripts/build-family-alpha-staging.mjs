/**
 * Family Alpha — NO DEPLOY / NO staging activation / NO cloud access.
 *
 * Compile an isolated, auditable, hard-off staging CANDIDATE folder without
 * changing the normal public build (dist/) or any Cloudflare/Supabase settings.
 * Do not use the candidate as an approved family build. Protected site access,
 * per-account allowlisting, actual RLS and four physical devices remain HOLD.
 */
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {cp,mkdir,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import {resolve,relative,dirname,sep,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const execFileAsync=promisify(execFile);
const SRC='dist',TARGET='dist-family-alpha-candidate';
export const ALPHA_RUNTIME_FILES=Object.freeze([
 'research/family-alpha-13/garment-photo-preparation.mjs',
 'research/family-alpha-16/source-mask-audit.mjs',
 'research/family-alpha-reviewed-photo/real-jpeg-review-provider.mjs',
 'research/family-alpha-reviewed-photo/preview-confirmation.mjs'
]);
export const PR257_PREPARER_GIT_BLOB='12ad1234b44d1257a1f1e697e61468f91595148c';
export const ORIGINAL_CONTROLLER_IMPORTS=Object.freeze([
 "../research/family-alpha-reviewed-photo/real-jpeg-review-provider.mjs",
 "../research/family-alpha-reviewed-photo/preview-confirmation.mjs"
]);
export const STAGED_CONTROLLER_IMPORTS=Object.freeze([
 "./__alpha_research/family-alpha-reviewed-photo/real-jpeg-review-provider.mjs",
 "./__alpha_research/family-alpha-reviewed-photo/preview-confirmation.mjs"
]);
const SAFE_OUTPUT=/^dist-family-alpha-candidate$/;
const sha256=x=>createHash('sha256').update(x).digest('hex');
export const gitBlobSha=x=>{
 const bytes=Buffer.isBuffer(x)?x:Buffer.from(x);
 return createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
};
function replaceOnce(source,from,to){
 const parts=source.split(from);
 if(parts.length!==2)throw Error('Expected exactly one audited import '+from);
 return parts.join(to);
}
export function stagedController(original){
 let source=original;
 for(let i=0;i<ORIGINAL_CONTROLLER_IMPORTS.length;i++)
  source=replaceOnce(source,"'"+ORIGINAL_CONTROLLER_IMPORTS[i]+"'",
   "'"+STAGED_CONTROLLER_IMPORTS[i]+"'");
 if(source.includes("'../research/"))throw Error('Unpackaged research import');
 return source;
}
export function stagedResearch(path,original){
 if(!ALPHA_RUNTIME_FILES.includes(path))throw Error('Unexpected research module');
 // These two modules import the PUBLIC root saved-board adapter.
 // In the isolated candidate, root /family-alpha-2d-* mirrors public/.
 if(path.endsWith('real-jpeg-review-provider.mjs')||path.endsWith('source-mask-audit.mjs'))
  return replaceOnce(original,
    "'../../public/family-alpha-2d-saved-board.mjs'",
    "'../../family-alpha-2d-saved-board.mjs'");
 return original;
}
export async function listFiles(dir,prefix=''){
 const entries=await readdir(dir,{withFileTypes:true});
 let result=[];
 for(const entry of entries){
  if(entry.isSymbolicLink())throw Error('Symlink not allowed in release candidate: '+entry.name);
  const name=prefix+entry.name;
  if(entry.isDirectory())result.push(...await listFiles(join(dir,entry.name),name+'/'));
  else if(entry.isFile())result.push(name);
  else throw Error('Unsupported file in candidate '+name);
 }
 return result.sort();
}
async function compareProduction(original,candidate){
 const files=await listFiles(original);
 for(const file of files){
  if(file==='family-alpha-preview-controller.mjs')continue;
  const [a,b]=await Promise.all([readFile(join(original,file)),readFile(join(candidate,file))]);
  if(!a.equals(b))throw Error('Normal production asset unexpectedly changed: '+file);
 }
 const originalFiles=new Set(files);
 for(const file of await listFiles(candidate)){
  if(file.startsWith('__alpha_research/')||file==='alpha-candidate-manifest.json')continue;
  if(!originalFiles.has(file))throw Error('Unexpected top-level candidate asset '+file);
 }
}
export async function writeCandidate({
 repositoryRoot=resolve('.'),productionDir=SRC,outputDir=TARGET
}={}){
 const root=resolve(repositoryRoot),source=resolve(root,productionDir),target=resolve(root,outputDir);
 if(relative(root,target)!==TARGET||!SAFE_OUTPUT.test(relative(root,target))||
  source===target||!source.startsWith(root+sep))
  throw Error('Refuse unsafe staging output path');
 const sourceController=await readFile(join(root,'public/family-alpha-preview-controller.mjs'),'utf8');
 const originalBuildController=await readFile(join(source,'family-alpha-preview-controller.mjs'),'utf8');
 if(originalBuildController!==sourceController)throw Error('Production dist source differs from public controller');
 const sourceBoot=await readFile(join(source,'family-alpha-preview-boot.js'),'utf8');
 const index=await readFile(join(source,'index.html'),'utf8');
 if(!sourceBoot.includes("host!=='localhost'&&host!=='127.0.0.1'")||
  !sourceBoot.includes('window.__CLOSET_CURRENT_FAMILY_ALPHA_LOCAL_PREVIEW__!==true')||
  !index.includes('id="familyAlphaLocalPreview" hidden')||
  !index.includes('id="familyAlphaPreviewStart"')||
  !index.includes('family-alpha-preview-boot.js'))
  throw Error('Development preview must remain disabled on all non-localhost hosts');
 const prep=await readFile(join(root,ALPHA_RUNTIME_FILES[0]));
 if(gitBlobSha(prep)!==PR257_PREPARER_GIT_BLOB)
  throw Error('Pinned original-photo mask preparer changed; require independent re-review');
 await rm(target,{recursive:true,force:true});
 await cp(source,target,{recursive:true});
 const staged=stagedController(sourceController);
 await writeFile(join(target,'family-alpha-preview-controller.mjs'),staged);
 const fingerprints=[];
 for(const path of ALPHA_RUNTIME_FILES){
  const bytes=await readFile(join(root,path));
  const transformed=stagedResearch(path,bytes.toString('utf8'));
  const stagedPath='__alpha_research/'+path.slice('research/'.length);
  await mkdir(dirname(join(target,stagedPath)),{recursive:true});
  await writeFile(join(target,stagedPath),transformed);
  fingerprints.push({source:path,artifact:stagedPath,sourceSha256:sha256(bytes),
   candidateSha256:sha256(transformed)});
 }
 await compareProduction(source,target);
 const allFiles=await listFiles(target);
 const manifest={
  schemaVersion:1,kind:'Family Alpha isolated packaging candidate — NOT deploy approval',
  releaseGate:'HOLD',
  stageAccess:'NOT VERIFIED; host gated off (localhost only)',
  runtimeActivation:'OFF on all non-localhost hosts',
  baseBuild:'normal production dist copied unchanged except candidate-only controller import resolution',
  noCloudOrPrivateData:true,
  sourceProcessorPinnedGitBlob:PR257_PREPARER_GIT_BLOB,
  includedModules:fingerprints,
  publicAssetCount:(await listFiles(source)).length,
  candidateArtifactCount:allFiles.length+1,
  requiredBeforeFamilyTest:['Approved protected staging distribution',
    'Actual Supabase Auth and row/storage level account isolation',
    'Explicit staging-only activation and allowlist',
    'Real device/photo quality and four-user smoke test']
 };
 await writeFile(join(target,'alpha-candidate-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 return manifest;
}
export async function assertCandidate({repositoryRoot=resolve('.')}={}){
 const root=resolve(repositoryRoot),dir=join(root,TARGET),production=join(root,SRC);
 const manifest=JSON.parse(await readFile(join(dir,'alpha-candidate-manifest.json'),'utf8'));
 if(manifest.releaseGate!=='HOLD'||manifest.runtimeActivation!=='OFF on all non-localhost hosts'||
  manifest.includedModules?.length!==ALPHA_RUNTIME_FILES.length)
  throw Error('Candidate accidentally marked approved');
 await compareProduction(production,dir);
 const controller=await readFile(join(dir,'family-alpha-preview-controller.mjs'),'utf8');
 if(controller!==stagedController(await readFile(join(root,'public/family-alpha-preview-controller.mjs'),'utf8')))
  throw Error('Staged controller changed after packaging');
 for(const entry of manifest.includedModules){
  const source=await readFile(join(root,entry.source));
  const built=await readFile(join(dir,entry.artifact));
  if(sha256(source)!==entry.sourceSha256||sha256(built)!==entry.candidateSha256||
   built.toString('utf8')!==stagedResearch(entry.source,source.toString('utf8')))
   throw Error('Staging module was modified: '+entry.source);
 }
 return manifest;
}
async function main(){
 await execFileAsync(process.execPath,['scripts/build.mjs'],{cwd:resolve('.')});
 const manifest=await writeCandidate();
 await assertCandidate();
 console.log('Family Alpha NO-DEPLOY candidate packaged, modules '+manifest.includedModules.length+
  '; standard dist byte-preserved; release HOLD.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 await main();
