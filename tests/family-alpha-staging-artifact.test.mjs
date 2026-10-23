import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,cp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {
 ALPHA_RUNTIME_FILES,PR257_PREPARER_GIT_BLOB,gitBlobSha,
 stagedController,stagedResearch,writeCandidate,assertCandidate
} from '../scripts/build-family-alpha-staging.mjs';

test('upstream photo masking source matches pinned originally reviewed Git blob',async()=>{
 const actual=await readFile(ALPHA_RUNTIME_FILES[0]);
 assert.equal(gitBlobSha(actual),PR257_PREPARER_GIT_BLOB);
});
test('staged controller rewrites only the two audited research imports to artifact-local resolution',async()=>{
 const original=await readFile('public/family-alpha-preview-controller.mjs','utf8');
 const staged=stagedController(original);
 assert.equal(staged.includes('../research/family-alpha-reviewed-photo/'),false);
 assert.match(staged,/\.\/__alpha_research\/family-alpha-reviewed-photo\/real-jpeg-review-provider\.mjs/);
 assert.match(staged,/\.\/__alpha_research\/family-alpha-reviewed-photo\/preview-confirmation\.mjs/);
 assert.equal(staged.includes('verifyAlphaAuthUser'),true);
 assert.equal(staged.includes('readAlphaSavedWardrobe'),true);
 assert.equal(staged.includes('renderAlphaLiveSnapshot'),true);
 assert.throws(()=>stagedController(staged),/Expected exactly one/);
});
test('source auditor and reviewed-JPEG provider import only the packaged production-root source-check adapter',async()=>{
 for(const path of ALPHA_RUNTIME_FILES){
  const original=await readFile(path,'utf8');
  const built=stagedResearch(path,original);
  if(path.includes('source-mask-audit')||path.includes('real-jpeg-review-provider')){
   assert.equal(built.includes("'../../public/family-alpha-2d-saved-board.mjs'"),false);
   assert.match(built,/'\.\.\/\.\.\/family-alpha-2d-saved-board\.mjs'/);
  }else assert.equal(built,original);
 }
 assert.throws(()=>stagedResearch('research/non-reviewed-new-provider.mjs',''),/Unexpected/);
});
async function tempInput(){
 const root=await mkdtemp(join(tmpdir(),'alpha-staging-'));
 for(const name of ['public/family-alpha-preview-controller.mjs','public/family-alpha-preview-boot.js']){
  await mkdir(dirname(join(root,name)),{recursive:true});
  await cp(name,join(root,name));
 }
 for(const path of ALPHA_RUNTIME_FILES){
  await mkdir(dirname(join(root,path)),{recursive:true});
  await cp(path,join(root,path));
 }
 await mkdir(join(root,'dist'),{recursive:true});
 await cp('public/family-alpha-preview-controller.mjs',join(root,'dist/family-alpha-preview-controller.mjs'));
 await cp('public/family-alpha-preview-boot.js',join(root,'dist/family-alpha-preview-boot.js'));
 await writeFile(join(root,'dist/index.html'),'<section id="familyAlphaLocalPreview" hidden><button id="familyAlphaPreviewStart"></button></section><script src="family-alpha-preview-boot.js"></script>');
 return root;
}
test('builds a separate HOLD candidate without changing a single ordinary dist byte',async()=>{
 const root=await tempInput();
 try{
  const existing=await readFile(join(root,'dist/family-alpha-preview-controller.mjs'));
  const manifest=await writeCandidate({repositoryRoot:root});
  assert.equal(manifest.releaseGate,'HOLD');
  assert.equal(manifest.noCloudOrPrivateData,true);
  assert.equal(manifest.includedModules.length,4);
  assert.deepEqual(manifest.requiredBeforeFamilyTest.length,4);
  const finished=await assertCandidate({repositoryRoot:root});
  assert.equal(finished.candidateArtifactCount,manifest.candidateArtifactCount);
  assert.deepEqual(await readFile(join(root,'dist/family-alpha-preview-controller.mjs')),existing);
  assert.equal((await readFile(join(root,'dist-family-alpha-candidate/family-alpha-preview-controller.mjs'),'utf8'))
   .includes("'../research/"),false);
 }finally{await rm(root,{force:true,recursive:true});}
});
test('refuses candidate build if localhost-only hard-off gate was changed',async()=>{
 const root=await tempInput();
 try{
  await writeFile(join(root,'dist/family-alpha-preview-boot.js'),"window.__CLOSET_CURRENT_FAMILY_ALPHA_LOCAL_PREVIEW__=true;");
  await assert.rejects(writeCandidate({repositoryRoot:root}),/must remain disabled/);
 }finally{await rm(root,{force:true,recursive:true});}
});
test('refuses source tree tampering before publishing the four research modules',async()=>{
 const root=await tempInput();
 try{
  await writeFile(join(root,ALPHA_RUNTIME_FILES[0]),'// fabricated replacement mask');
  await assert.rejects(writeCandidate({repositoryRoot:root}),/Pinned original-photo mask preparer changed/);
 }finally{await rm(root,{force:true,recursive:true});}
});
