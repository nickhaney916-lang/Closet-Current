// Fail-closed offline reproducibility and tamper proof for the staging ZIP source.
// This neither signs the bundle nor authorizes a Cloudflare deployment.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,readdir,lstat,cp,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {verifyStagingAssetSeal} from './staging-asset-seal.mjs';
import {checkStagingArtifactIntegrity} from './check-staging-artifact-integrity.mjs';
const [first,second]=process.argv.slice(2);
assert.ok(first&&second,'Usage: node scripts/test-staging-release-provenance.mjs FIRST_DIR SECOND_DIR');
const fingerprint='f514386e47f6';
async function scan(root){
 const entries=[];
 async function visit(dir,prefix=''){
  for(const f of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
   const name=prefix+f.name,full=join(dir,f.name);
   const st=await lstat(full);
   assert.ok(!st.isSymbolicLink(),'Linked candidate assets forbidden: '+name);
   if(st.isDirectory()){await visit(full,name+'/');continue;}
   assert.ok(st.isFile(),'Special candidate assets forbidden: '+name);
   const bytes=await readFile(full);
   entries.push({name,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
  }
 }
 await visit(root);
 return entries;
}
const [a,b]=await Promise.all([scan(first),scan(second)]);
assert.equal(a.length,93,'unexpected staging file count');
assert.deepEqual(a,b,'rebuilding identical source/environment must reproduce all package bytes');
const [seal,artifact]=await Promise.all([verifyStagingAssetSeal(second),checkStagingArtifactIntegrity(second)]);
assert.equal(seal.assetCount,92);
assert.equal(seal.signed,false,'hashed bundle is not cryptographically signed');
assert.equal(artifact.knownLiveServiceRefsAbsent,true);
assert.equal(artifact.permittedToDeploy,false);
const proof=JSON.parse(await readFile(join(second,'staging-preflight.json'),'utf8'));
assert.equal(proof.bundleFingerprint,fingerprint);
assert.equal(proof.backendProjectRef,'fbnplztkbsteuzrmbgib');
assert.equal(proof.stagingOrigin,'https://pilot-access-check.closet-current-staging.pages.dev/');
assert.equal(proof.paidAIHardBlocked,true);
assert.equal(proof.privateCloudflareAccessPolicyVerified,false);
assert.equal(proof.restrictedStagingDeployed,false);
assert.equal(proof.productionReleaseApproved,false);
for(const required of ['index.html','auth.js','cloud-backup.js','sw.js','pilot-data-notice.html','saved-closet-audit.html','phone-photo-check.html']){
 assert.ok(a.some(f=>f.name===required),'missing expected package root file '+required);
}
const root=await mkdtemp(join(tmpdir(),'cc-staging-provenance-'));
let tamperRejected=false,prodInjectionRejected=false;
try {
 const tampered=join(root,'tampered');
 await cp(second,tampered,{recursive:true,force:false,errorOnExist:true});
 const auth=await readFile(join(tampered,'auth.js'),'utf8');
 await writeFile(join(tampered,'auth.js'),auth+'\n// byte-tamper QA only\n');
 try{await verifyStagingAssetSeal(tampered);}catch(error){
  tamperRejected=/changed asset/.test(error.message);
 }
 assert.ok(tamperRejected,'modified staged Auth must fail SHA-256 integrity review');
 const injected=join(root,'injected');
 await cp(second,injected,{recursive:true,force:false,errorOnExist:true});
 const html=await readFile(join(injected,'index.html'),'utf8');
 await writeFile(join(injected,'index.html'),html+'<!-- hlkgymugtfbirlpunsra -->');
 try{await checkStagingArtifactIntegrity(injected);}catch(error){
  prodInjectionRejected=/live-service reference/.test(error.message);
 }
 assert.ok(prodInjectionRejected,'production backend reference must fail artifact inspection');
}finally{await rm(root,{recursive:true,force:true});}
console.log('STAGING_PACKAGE_PROVENANCE_PASS '+JSON.stringify({
 appSource:'425efe54cbcebffe54e8d32c209d6fb80a739dca',
 expectedBuildFingerprint:fingerprint,
 identicalRepeatedBuildFiles:a.length,sha256SealedAssets:seal.assetCount,
 tamperedAuthBlocked:tamperRejected,productionEndpointInjectionBlocked:prodInjectionRejected,
 packageSigned:false,previousHostedDeploymentIdVerified:false,
 rollbackActuallyPerformed:false,cloudflareAccessVerified:false,
 stagedDeploymentPerformed:false,productionReleaseApproved:false
}));
