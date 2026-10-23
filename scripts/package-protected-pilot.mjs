// Offline packaging only. Provenance stays OUTSIDE the immutable asset seal.
import assert from 'node:assert/strict';
import {cp,lstat,mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {verifyStagingAssetSeal} from './staging-asset-seal.mjs';
import {checkStagingArtifactIntegrity} from './check-staging-artifact-integrity.mjs';
export const APPLICATION='0f62e253c1fd0024a939cd401710dcd3784a9e77';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function inventory(dir,prefix=''){
 const rows=[];
 for(const entry of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name,'en'))){
  assert.ok(!entry.isSymbolicLink()&&(entry.isFile()||entry.isDirectory()),'Linked/special package entry');
  const path=prefix+entry.name;
  if(entry.isDirectory())rows.push(...await inventory(join(dir,entry.name),path+'/'));
  else if(path!=='package-sha256.json'){const b=await readFile(join(dir,entry.name));rows.push({path,bytes:b.length,sha256:sha(b)});}
 }
 return rows.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
}
async function checkBundle(dir){
 await checkStagingArtifactIntegrity(dir);const seal=await verifyStagingAssetSeal(dir);
 const proof=JSON.parse(await readFile(join(dir,'staging-preflight.json'),'utf8'));
 for(const key of ['privateCloudflareAccessPolicyVerified','restrictedStagingDeployed','productionReleaseApproved'])assert.equal(proof[key],false,key);
 assert.equal(proof.releasePromotion,'BLOCKED');assert.equal(proof.paidAIHardBlocked,true);
 assert.ok(['abcdefghijklmnopqrst','fbnplztkbsteuzrmbgib'].includes(proof.backendProjectRef),'Unapproved backend');
 return {seal,proof};
}
export async function verifyPilotPackage(dir){
 const root=await lstat(dir);assert.ok(root.isDirectory()&&!root.isSymbolicLink());
 const manifest=JSON.parse(await readFile(join(dir,'package-sha256.json'),'utf8'));
 assert.equal(manifest.format,'closet-current-offline-pilot-package');
 assert.equal(manifest.deployAuthorized,false);assert.equal(manifest.release,'BLOCKED');
 assert.deepEqual(await inventory(dir),manifest.files,'Package bytes or inventory changed');
 const bundle=await checkBundle(join(dir,'staging-dist'));
 const provenance=JSON.parse(await readFile(join(dir,'provenance.json'),'utf8'));
 assert.equal(provenance.applicationCommit,APPLICATION);assert.match(provenance.sourceCommit,/^[a-f0-9]{40}$/);
 assert.equal(provenance.applicationTreeSha,provenance.packagedApplicationTreeSha);
 assert.equal(provenance.deployAuthorized,false);assert.equal(provenance.customerPhotosPermitted,false);
 return {fileCount:manifest.files.length,sealedAssets:bundle.seal.assetCount,backendProjectRef:bundle.proof.backendProjectRef,
  sourceCommit:provenance.sourceCommit,applicationCommit:APPLICATION,deployAuthorized:false,release:'BLOCKED'};
}
export async function packageProtectedPilot(bundleDir,outputDir){
 const input=resolve(bundleDir),output=resolve(outputDir);
 assert.ok(!output.startsWith(input+'/')&&!input.startsWith(output+'/')&&output!==input,'Package and source must be disjoint');
 await checkBundle(input); // Reject PR222's post-seal additions before copying.
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
 git('diff','--exit-code',APPLICATION,'HEAD','--','public','supabase');
 git('diff','--exit-code','HEAD','--','public','supabase');
 const sourceCommit=git('rev-parse','HEAD'),applicationTreeSha=git('rev-parse',APPLICATION+':public');
 const provenance={format:'closet-current-pilot-source',sourceCommit,applicationCommit:APPLICATION,
  applicationTreeSha,packagedApplicationTreeSha:git('rev-parse','HEAD:public'),
  deployAuthorized:false,customerPhotosPermitted:false,physicalPhonesTested:0,release:'BLOCKED'};
 // A fresh directory prevents replacing earlier reviewed evidence.
 await mkdir(output,{recursive:false});
 await cp(input,join(output,'staging-dist'),{recursive:true,errorOnExist:true,force:false});
 await writeFile(join(output,'provenance.json'),JSON.stringify(provenance,null,2)+'\n',{flag:'wx'});
 await writeFile(join(output,'NEVER-DEPLOY.txt'),'OFFLINE REVIEW ONLY. No deployment approval. Synthetic packages must NEVER be hosted.\n',{flag:'wx'});
 await writeFile(join(output,'package-sha256.json'),JSON.stringify({format:'closet-current-offline-pilot-package',
  deployAuthorized:false,release:'BLOCKED',files:await inventory(output)},null,2)+'\n',{flag:'wx'});
 return verifyPilotPackage(output);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const args=process.argv.slice(2);assert.equal(args.length,3,'Usage: package-protected-pilot.mjs create|verify <bundle-or-package> <fresh-output-or-dash>');
  console.log(JSON.stringify(args[0]==='create'?await packageProtectedPilot(args[1],args[2]):
   args[0]==='verify'?await verifyPilotPackage(args[1]):assert.fail('Unknown operation')));
 }catch(error){console.error('PILOT_PACKAGE_REFUSED '+error.message);process.exitCode=1;}
}
