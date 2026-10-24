/**
 * Family Alpha v0.1 recognition-to-protected-staging bridge audit.
 *
 * Offline, pinned, read-only file-compatibility/provenance verifier. NEVER
 * produces a deployable combined build, never fetches photos/credentials.
 *
 * Both source refs MUST be fetched independently into the local git object
 * database. All reads use git show SHA:path; moving branch tips are ignored.
 * A normal CI checkout can import the pinned refs via git fetch --no-tags.
 */
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const STAGING_REF='879f1b92fb15f9bc9a7f0429c7ee178f7bbf1373'; // PR #277
export const RECOGNITION_REF='0586d08d9d40ce5da479f5ff656e03adf2c837e0'; // PR #282
export const STAGING_PROJECT='fbnplztkbsteuzrmbgib';
export const PRODUCTION_PROJECT='hlkgymugtfbirlpunsra';
export const AUDITED_ASSETS=Object.freeze([
 'public/app.js',
 'public/index.html',
 'public/recognition-engine.mjs',
 'public/local-worker.mjs',
 'public/photo-color.js',
 'public/clothing-details.js',
 'public/taxonomy.js',
 'public/outfit-board.js',
 'public/auth.js',
 'public/family-alpha-preview-boot.js'
]);
const sha256=s=>createHash('sha256').update(s).digest('hex');
const yes=(test,message)=>{if(!test)throw Error('Integration audit precondition failed: '+message);};
const unique=(value,sub)=>value.split(sub).length-1;

export function getPinnedBlob(commit,path,{git='git'}={}){
 yes([STAGING_REF,RECOGNITION_REF].includes(commit),'source SHA not pinned');
 yes(AUDITED_ASSETS.includes(path),'unapproved source path');
 try {
  return execFileSync(git,['show',commit+':'+path],
   {encoding:'utf8',maxBuffer:4*1024*1024,stdio:['ignore','pipe','ignore']});
 }catch(error){
  if(path==='public/family-alpha-preview-boot.js')return null;
  throw Error('Required pinned source unavailable: '+path+' at '+commit.slice(0,12)+
   '. Fetch exact PR commits; do not substitute branch heads. '+error.message);
 }
}

export function computeIntegrationAudit(stage,recognition,stageArtifact=null){
 yes(stage&&recognition,'both independently pinned sources required');
 yes(Object.keys(stage).length===AUDITED_ASSETS.length&&
  Object.keys(recognition).length===AUDITED_ASSETS.length,'all allowed assets required');
 const mismatches=[],compatible=[];
 for(const path of AUDITED_ASSETS){
  const older=stage[path],newer=recognition[path];
  if(older===undefined||newer===undefined)throw Error('Missing source entry '+path);
  if(older===newer)compatible.push(path);
  else mismatches.push({path,
   stageSha256:older===null?null:sha256(older),
   recognitionSha256:newer===null?null:sha256(newer),
   reason:older===null?'stage-module-absent':newer===null?'recognition-module-absent':'divergent-implementation'});
 }
 const stageApp=stage['public/app.js'],newApp=recognition['public/app.js'];
 const stageIndex=stage['public/index.html'],newIndex=recognition['public/index.html'];
 const stageAuth=stage['public/auth.js'],newAuth=recognition['public/auth.js'];
 yes(typeof stageApp==='string'&&typeof newApp==='string'&&
  typeof stageIndex==='string'&&typeof newIndex==='string'&&
  typeof stageAuth==='string'&&typeof newAuth==='string','auth/app/index source missing');
 yes(unique(stageApp,'async function recognizeItem(item)')===1,'stage recognition handler moved');
 yes(unique(newApp,'async function recognizeItem(item)')===1,'new recognition handler moved');
 yes(unique(newApp,'const verifiedColorAdmission=new WeakMap()')===1,
  'new original/category/owner-backed proof contract missing');
 yes(unique(newApp,'function recognitionSourcePhoto(item)')===1,
  'new original source classification contract missing');
 yes(unique(newApp,'function canConfirmReviewedColor(item)')===1,
  'new human-confirmed color admission missing');
 yes(unique(newApp,'item.recognitionReviewRequired=false;')>=1,
  'new reviewed-admission completion missing');
 yes(!stageApp.includes('const verifiedColorAdmission=new WeakMap()')&&
  !stageApp.includes('function canConfirmReviewedColor(item)'),
  'stage has new recognition helper; refresh this intentionally frozen audit');
 yes(stageIndex.includes('family-alpha-preview-boot.js')&&
  typeof stage['public/family-alpha-preview-boot.js']==='string',
  'stage original-JPEG avatar local preview required');
 yes(!newIndex.includes('family-alpha-preview-boot.js')&&
  recognition['public/family-alpha-preview-boot.js']===null,
  'recognition tree unexpectedly includes staging-only local preview');
 yes(stageAuth.includes('https://'+PRODUCTION_PROJECT+'.supabase.co'),
  'staging source starts as production routed, so isolated Auth HOLD transform remains essential');
 yes(newAuth.includes('https://'+PRODUCTION_PROJECT+'.supabase.co'),
  'recognition branch Auth is NOT safe as a staging deployment source');
 yes(!stageApp.includes('function recognitionSourcePhoto(item)'),
  'stage app has acquired original-source handler: rebaseline required');
 yes(mismatches.some(x=>x.path==='public/recognition-engine.mjs')&&
  mismatches.some(x=>x.path==='public/local-worker.mjs')&&
  mismatches.some(x=>x.path==='public/app.js')&&
  mismatches.some(x=>x.path==='public/index.html')&&
  mismatches.some(x=>x.path==='public/auth.js'),
  'module dependencies unexpectedly identical: refresh compatibility decision');
 let artifactCheck=null;
 if(stageArtifact){
  const script=stageArtifact['app.js'],auth=stageArtifact['auth.js'],
   config=stageArtifact['alpha-stage-config.js'];
  yes(typeof script==='string'&&typeof auth==='string'&&typeof config==='string',
   'expected disabled stage Auth artifact files absent');
  yes(script===stageApp,'staging auth candidate changed app.js without source/audit review');
  yes(auth.includes('https://'+STAGING_PROJECT+'.supabase.co')&&
      !auth.includes('https://'+PRODUCTION_PROJECT+'.supabase.co'),
    'isolated staging Auth artifact routes to production');
  yes(config.includes('HOLD-NO-CALLBACK-OR-KEY')&&
      config.includes("releaseGate")&&config.includes("HOLD"),
    'staging Auth artifact is not in default blocked state');
  yes(!script.includes('const verifiedColorAdmission=new WeakMap()')&&
      !script.includes('function canConfirmReviewedColor(item)'),
    'staged candidate unexpectedly carries partial recognition patch; evaluate whole stack');
  artifactCheck={
   stagedAuthProject:STAGING_PROJECT,
   stagingAuthRuntime:'HOLD-NO-CALLBACK-OR-KEY',
   stagingAppSha256:sha256(script),
   latestHumanColorAdmissionInStage:false,
   stageAppUnchangedByAuthBuilder:true,
   credentialsRequired:false
  };
 }
 return {
  schemaVersion:1,
  references:{staging:STAGING_REF,recognition:RECOGNITION_REF},
  status:'INTEGRATION_BLOCKED_DO_NOT_DEPLOY',
  releaseGate:'HOLD',
  sourceTreesCompared:true,
  appParity:false,
  comparison:{identical:compatible,divergent:mismatches},
  stageAvatarPreviewStillPresent:true,
  pinnedOriginalSourceRecognitionInLatest:true,
  latestQuickColorEvidenceGatePresent:true,
  stageRecognitionMissing:true,
  recognitionBranchMissingStageBoot:true,
  rawRecognitionAuthUsesProduction:true,
  artifactCheck,
  blockers:[
   'Staging Family Alpha app.js predates original-photo recognition review and human color proof; direct cherry-pick of PR #282 only cannot produce consistent UI',
   'Recognizer, worker, photo-color, clothing-details and outfit-board dependencies diverge; never copy only app.js or let one branch silently overwrite the other',
   'Recognition index.html and Auth differ and do not include staged avatar boot; wholesale replacement would lose Family Alpha staging UX and route Auth to production',
   'Staging Auth HOLD builder must remain the only staging Auth/cloud transform with approved publishable key and callback; no production login fallback',
   'Reconcile a separate combined development branch and rerun original source, UI, security, browser and full-regression tests before requesting deployment approval',
   'No real staging JWT A/B Storage/RLS or consented physical-phone photo testing is proved by this offline source graph'
  ],
  safeNextStep:'Rebase/reconcile recognition module/API changes onto current Family Alpha candidate with tests and explicit security approval, without wholesale app.js or index.html replacement',
  proofScope:'Source identity, expected incompatibilities and OFF staging artifact; NOT actual integrated application functionality',
  dataAccess:'NO USER PHOTOS / NO SMTP / NO CLOUD / NO SECRETS / NO DEPLOY'
 };
}

export async function runIntegrationAudit({artifactRoot=null}={}){
 const stage={},recognition={};
 for(const path of AUDITED_ASSETS){
  stage[path]=getPinnedBlob(STAGING_REF,path);
  recognition[path]=getPinnedBlob(RECOGNITION_REF,path);
 }
 let artifact=null;
 if(artifactRoot){
  artifact={};
  for(const name of ['app.js','auth.js','alpha-stage-config.js']){
   artifact[name]=await readFile(resolve(artifactRoot,name),'utf8');
  }
 }
 return computeIntegrationAudit(stage,recognition,artifact);
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 if(args.length>1||args[0]&&!args[0].startsWith('--artifact-root='))
  throw Error('Only offline --artifact-root=<existing held build> is accepted');
 const result=await runIntegrationAudit({
  artifactRoot:args[0]?.slice('--artifact-root='.length)||null
 });
 if(result.releaseGate!=='HOLD'||result.status!=='INTEGRATION_BLOCKED_DO_NOT_DEPLOY')
  throw Error('Incompatible source revisions may not be marked deployable');
 console.log('FAMILY_ALPHA_RECOGNITION_SOURCE_INTEGRATION_HOLD '+JSON.stringify(result,null,2));
}
