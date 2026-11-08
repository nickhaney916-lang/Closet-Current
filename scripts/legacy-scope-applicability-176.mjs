/**
 * Closet Current P176: a strict applicability classifier for three OLDER
 * immutable, single-feature PR gates. It never changes those gates' historic
 * blocked paths or SHA pins. A stacked research PR modifying only the shared
 * native 3D bridge must be tested by the P176 integration jobs instead.
 *
 * Not a security bypass: any modification to a feature's own protected
 * source, test or recovery path still runs the original fail-closed benchmark.
 * workflow_dispatch always runs the original benchmark unconditionally.
 */
export const LEGACY_KINDS_176=Object.freeze(['index','restore','readiness']);
const pathMatches={
 index:[
  /^public\/app\.js$/,
  /^research\/native-consumer-board-04\/consumer-board-controller\.mjs$/,
  /^research\/native-index-live-07\/[^/]+$/,
  /^scripts\/(?:test-native-index-live-07-browser|audit-native-index-live-07)\.mjs$/,
  /^tests\/native-index-live-07(?:-[^/]+)?\.test\.mjs$/
 ],
 restore:[
  /^public\/outfit-board\.js$/,
  /^public\/cloud-backup(?:-bridge)?\.js$/,
  /^research\/restore-atomic-01\/[^/]+$/,
  /^research\/native-restore-3d-06\/[^/]+$/,
  /^scripts\/(?:test-native-restore-3d-06-browser|audit-native-restore-3d-06)\.mjs$/,
  /^tests\/(?:restore-atomic-01|native-restore-3d-06)[^/]*\.test\.mjs$/
 ],
 readiness:[
  /^public\/outfit-board\.js$/,
  /^research\/native-photo-readiness-08\/[^/]+$/,
  /^research\/user-photo-3d-01\/[^/]+$/,
  /^scripts\/(?:test-native-photo-readiness-08-browser|audit-native-photo-readiness-08|test-user-photo-3d-01-browser|audit-user-photo-3d-01)\.mjs$/,
  /^tests\/(?:native-photo-readiness-08|user-photo-3d-01)[^/]*\.test\.mjs$/
 ]
};
/**
 * A changed security-sensitive file is NOT whitelisted. If it is unrelated
 * to a particular historic isolated task, the historic task doesn't run;
 * the P176 cross-stream jobs check those interactions instead.
 */
export function decideLegacyRun176(kind,files,{event='pull_request'}={}){
 if(!LEGACY_KINDS_176.includes(kind))throw Error('Unknown legacy gate kind');
 if(event==='workflow_dispatch')return Object.freeze({
   run:true,reason:'explicit-manual-revalidation-always-runs',kind});
 if(event!=='pull_request'||!Array.isArray(files)||
    files.some(p=>typeof p!=='string'||p.includes('\0')||
     p.includes('\\')||p.startsWith('/')||p.split('/').includes('..')))
  throw Error('Legacy applicability cannot be determined safely');
 const relevant=files.filter(p=>pathMatches[kind].some(re=>re.test(p)));
 return Object.freeze({run:relevant.length>0,
  reason:relevant.length?'feature-specific-original-scope-changed':
   'stacked-research-bridge-changes-tested-by-current-cross-stream-integration',
  kind,relevantFiles:Object.freeze(relevant)});
}
async function ci(){
 const kind=process.argv[3],event=process.env.CI_EVENT||'pull_request';
 if(!LEGACY_KINDS_176.includes(kind))throw Error('P176 CI legacy kind must be explicit');
 let files=[];
 if(event==='pull_request'){
  const base=process.env.PR_BASE_SHA||'';
  if(!/^[a-f0-9]{40}$/.test(base))throw Error('P176 missing secure PR-base SHA');
  const {execFileSync}=await import('node:child_process');
  execFileSync('git',['cat-file','-e',base+'^{commit}'],{encoding:'utf8',timeout:12000});
  files=execFileSync('git',['diff','--name-only',base+'...HEAD'],{
   encoding:'utf8',timeout:15000,maxBuffer:1024*1024}).trim().split('\n').filter(Boolean);
 }
 const result=decideLegacyRun176(kind,files,{event});
 const {appendFileSync}=await import('node:fs');
 const out=process.env.GITHUB_OUTPUT;
 if(!out)throw Error('P176 CI GitHub output missing');
 appendFileSync(out,'run_legacy='+String(result.run)+'\n');
 console.log('P176_LEGACY_FEATURE_SCOPE_DECISION '+JSON.stringify(result));
}
if(process.argv[2]==='--ci')await ci();
