/**
 * M1 P831: build a self-contained, no-account STATIC recognition-only preview
 * from the actual vetted application output, with an allowlist of original
 * model/runtime files. This script never uploads, serves, signs users in,
 * deploys, changes cloud policies, or incorporates source JPEGs.
 */
import {mkdir,rm,readFile,writeFile,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export const TRIAL_FILES_831=Object.freeze([
 'phone-photo-check.html','phone-photo-check.mjs','phone-photo-benchmark.mjs',
 'photo-test-session.mjs','phone-photo-prep-832.mjs','phone-photo-run-recovery-833.mjs','phone-photo-subtype-guard-835.mjs','local-worker.mjs',
 'local-catalog.mjs','recognition-engine.mjs','scanner-errors.mjs',
 'vector-scorer.mjs','recognition-photo.mjs',
 'recognition-vectors.json','recognition-vectors.bin'
]);
export const sha256=x=>createHash('sha256').update(x).digest('hex');
const err=m=>{throw Error('M1_P831_NO_ACCOUNT_BUNDLE: '+m);};

export async function buildTrialBundle831({
 sourceDir='dist',outputDir='benchmark/m1-no-account-trial-831',
}={}){
 const source=resolve(sourceDir),target=resolve(outputDir);
 if(target===source||target.startsWith(source+'/')||source.startsWith(target+'/')||
    target===resolve('.')||!TRIAL_FILES_831.length)
  err('source and output must be distinct, non-nested directories');
 const index=await readFile(join(source,'phone-photo-check.html'),'utf8');
 const tag=index.match(/<meta name="closet-release" content="([a-f0-9]{12})">/);
 const recognition=index.match(/<meta name="recognition-index" content="([a-f0-9]{64})">/);
 const back='<a href="./">← Back to my closet</a>';
 if(!tag||!recognition||!index.includes(back))err('requires exact built recognition page and release/source digest');
 const replacement='<p class="fine"><strong>Private diagnostic preview:</strong> wardrobe, account and cloud pages are not included.</p>';
 // Do NOT link the tester out of this isolated no-account bundle.
 const isolated=index.replace(back,replacement);
 if(/__RELEASE__|__RECOGNITION_INDEX__/.test(isolated)||
    /<a\s+href=["']\.\//i.test(isolated))
  err('unbuilt release metadata or navigation outside recognition trial');
 await rm(target,{recursive:true,force:true});await mkdir(target,{recursive:true});
 const hashes={};
 for(const name of TRIAL_FILES_831){
  if(!/^[a-z0-9.-]+$/.test(name))err('unexpected asset path');
  const bytes=name==='phone-photo-check.html'?Buffer.from(isolated,'utf8'):await readFile(join(source,name));
  if(!bytes.length)err('empty required asset '+name);
  hashes[name]=sha256(bytes);await writeFile(join(target,name),bytes);
 }
 // Report artifact excludes photos, filenames, accounts and true user identities.
 const manifest={
  format:'closet-current-isolated-no-account-recognition-trial/v1',
  release:tag[1],recognitionIndex:recognition[1],
  familyAlpha:'HOLD',releaseAuthorized:false,hosted:false,
  privacyClaim:'recognition-only-no-user-photo-in-this-bundle',
  files:hashes
 };
 const help=[
  'CLOSET CURRENT — RECOGNITION-ONLY OWNER PREVIEW (NOT A RELEASE)',
  '',
  'Family Alpha HOLD #255 remains OPEN. This archive is generated',
  'for owner review; no hosted preview URL has been created.',
  'This bundle deliberately contains NO login/wardrobe/cloud or user photos.',
  'All original garments come from a tester selecting local photos at runtime.',
  'The recognizer uses the pinned external FashionCLIP model and may require',
  'a large download and internet access before inference.',
  '',
  'Local desktop owner check only: serve extracted files on localhost',
  'with a static server, then open /phone-photo-check.html in that browser.',
  'Do NOT open via file://. Physical phone access needs a separately',
  'authorized and protected HTTPS preview; that is NOT provisioned here.',
  '',
  'For a trial, label a handful of one-garment photos BEFORE clicking',
  'Check recognition. Primary color is optional; Unknown is not a match.',
  'Download results only with tester consent; do NOT post personal clothing',
  'photos, filenames, accounts, or other private data publicly.',
  'No account creation, wardrobe saves, cloud writes or deployment.',
  '',
  'Verify bundle-manifest.json and exact branch/CI before any handoff.'
 ].join('\n')+'\n';
 await writeFile(join(target,'TRIAL_README.txt'),help);
 await writeFile(join(target,'bundle-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 return {target,manifest};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const result=await buildTrialBundle831({sourceDir:process.argv[2]||'dist',
  outputDir:process.argv[3]||'benchmark/m1-no-account-trial-831'});
 console.log('M1_P831_CREATED_NO_ACCOUNT_NO_DEPLOY_ASSET_BUNDLE',JSON.stringify({
  release:result.manifest.release,assets:Object.keys(result.manifest.files).length,
  familyAlpha:result.manifest.familyAlpha,releaseAuthorized:false,
  recognitionIndex:result.manifest.recognitionIndex}));
}
