/**
 * FAMILY-ALPHA-EVIDENCE-GATE-18.
 * Read-only main-controller research gate. Green test infrastructure is not an
 * automatic model-accuracy or pilot-authorization receipt. Never modifies a PR,
 * issue, environment, user account, deployment, or photo.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';

const HEX=/^[0-9a-f]{40}$/i;
const STATES=new Set(['UNVERIFIED','BLOCKED','VERIFIED_WITH_EXTERNAL_RECEIPT']);
const SCIENCE=new Set(['NARROW_RESEARCH_VERIFIED','NEEDS_REWORK','IN_PROGRESS']);
export const REQUIRED_GATES_18=Object.freeze([
 'recognition-category-color','multi-garment-generalization','end-to-end-consumer',
 'signed-account-rls','physical-phones','real-email','privacy-deletion',
 'photorealistic-source-3d','independent-release-signoff'
]);
const require18=(condition,message)=>{
 if(!condition)throw Error('FAMILY-ALPHA-18 '+message);
};
const noHtml=x=>String(x).replaceAll('|','/').replaceAll('\n',' ').replaceAll('\r',' ');
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
export function evaluateFamilyAlpha18(manifest,live){
 require18(manifest?.schemaVersion===1,'unsupported manifest');
 require18(manifest.repository==='nickhaney916-lang/Closet-Current','repository mismatch');
 require18(manifest.alphaIssue===255,'release hold issue must be pinned');
 require18(manifest.governance?.productionDeployAllowed===false&&
  manifest.governance?.mergeAllowed===false&&
  manifest.governance?.familyAlphaHold===true,'forbidden production/release permissions');
 require18(Array.isArray(manifest.research)&&manifest.research.length>=5,'missing research evidence sources');
 require18(Array.isArray(manifest.releaseRequirements)&&
  manifest.releaseRequirements.length===REQUIRED_GATES_18.length,'release requirements missing');
 const expectedGates=new Set(REQUIRED_GATES_18),gateSeen=new Set();
 for(const r of manifest.releaseRequirements){
  require18(r&&typeof r.id==='string'&&expectedGates.has(r.id)&&
   !gateSeen.has(r.id),'unknown/duplicate release gate');
  gateSeen.add(r.id);
  require18(STATES.has(r.state),'invalid release gate state '+r.id);
  require18(typeof r.label==='string'&&r.label.length>=12&&
   typeof r.evidence==='string'&&r.evidence.length>=5&&
   typeof r.owner==='string'&&r.owner.length>2,'missing release gate owner/evidence '+r.id);
  if(r.state==='VERIFIED_WITH_EXTERNAL_RECEIPT'){
   require18(r.receipt&&r.receipt.explicitAuthorization===true&&
    typeof r.receipt.evidenceUri==='string'&&r.receipt.evidenceUri.startsWith('https://')&&
    typeof r.receipt.reviewer==='string'&&r.receipt.reviewer.length>3,
    'cannot self-certify '+r.id+' without an external acceptance receipt');
  }
 }
 require18(gateSeen.size===expectedGates.size,'release gates incomplete');
 const pinned=new Set(),research=[];
 require18(live&&typeof live==='object'&&live.issue&&live.prs&&live.runs,'live GitHub evidence required');
 require18(live.issue.number===manifest.alphaIssue&&
  ['open','closed'].includes(live.issue.state),'unverified Family Alpha issue');
 for(const e of manifest.research){
  require18(Number.isInteger(e.pr)&&e.pr>=1&&!pinned.has(e.pr),'duplicate or missing PR');
  pinned.add(e.pr);
  require18(SCIENCE.has(e.scientificStatus),'scientific verdict is missing');
  require18(typeof e.workstream==='string'&&e.workstream.length>10&&
   typeof e.limitations==='string'&&e.limitations.length>=15,'scientific limitations missing');
  const p=live.prs[String(e.pr)];
  const pinnedHead=e.pinnedHead;
  require18(p&&p.number===e.pr&&p.base?.repo?.full_name===manifest.repository,'missing or untrusted PR identity '+e.pr);
  const currentHead=p.head?.sha||null;
  const draft=p.draft===true&&p.state==='open'&&p.merged!==true;
  if(pinnedHead!==null)require18(HEX.test(pinnedHead),'invalid pinned head '+e.pr);
  if(e.dedicatedRunId!==null)require18(Number.isInteger(e.dedicatedRunId),'invalid dedicated run id '+e.pr);
  if(pinnedHead===null)require18(e.scientificStatus==='IN_PROGRESS'&&
   e.dedicatedRunId===null,'unverified moving PR must remain IN_PROGRESS');
  const exactHead=pinnedHead!==null&&currentHead===pinnedHead;
  const workflow=e.dedicatedRunId===null?null:live.runs[String(e.dedicatedRunId)];
  const exactWorkflow=!!(workflow&&workflow.id===e.dedicatedRunId&&
    workflow.head_sha===pinnedHead&&workflow.head_repository?.full_name===manifest.repository&&
    workflow.status==='completed'&&workflow.conclusion==='success'&&
    /NO DEPLOY/i.test(workflow.name||'')&&
    ['pull_request','workflow_dispatch'].includes(workflow.event));
  const status=e.scientificStatus==='IN_PROGRESS'?'IN_PROGRESS':
   !draft?'NOT_SAFE_DRAFT':
   !exactHead?'STALE_HEAD':
   !exactWorkflow?'MISSING_EXACT_HEAD_CI':
   e.scientificStatus==='NEEDS_REWORK'?'TECHNICAL_PASS_SCIENTIFIC_FAIL':
   'VERIFIED_NARROW_RESEARCH';
  research.push({pr:e.pr,workstream:e.workstream,scientificStatus:e.scientificStatus,
   currentHead,pinnedHead,exactHead,exactWorkflow,draft,runId:e.dedicatedRunId,
   runUrl:workflow?.html_url||null,limitations:e.limitations,status});
 }
 require18(pinned.size===manifest.research.length,'PR list duplicates');
 require18([569,570,571,572,573].every(x=>pinned.has(x)),'critical research evidence chain incomplete');
 const blocking=manifest.releaseRequirements.filter(g=>g.state!=='VERIFIED_WITH_EXTERNAL_RECEIPT');
 const researchDefects=research.filter(e=>e.status!=='VERIFIED_NARROW_RESEARCH');
 const issueHold=live.issue.state==='open';
 const candidateForIndependentControllerReview=blocking.length===0&&researchDefects.length===0&&!issueHold;
 const status='HOLD';
 // This is a research evidence report, NOT an automated release action.
 return {priority:manifest.priority,checkedAt:live.checkedAt||null,
  repository:manifest.repository,alphaIssue:manifest.alphaIssue,
  alphaIssueState:live.issue.state,releaseDecision:status,
  candidateForIndependentControllerReview,
  deploymentAuthorized:false,mergeAuthorized:false,alphaActivationAuthorized:false,
  totalResearchPRs:research.length,
  verifiedNarrowResearch:research.filter(r=>r.status==='VERIFIED_NARROW_RESEARCH').length,
  technicalGreenWithScienceFail:research.filter(r=>r.status==='TECHNICAL_PASS_SCIENTIFIC_FAIL').length,
  researchNeedingFurtherWork:researchDefects.length,
  releaseGatesRemaining:blocking.length,
  research,releaseRequirements:manifest.releaseRequirements.map(g=>({
   id:g.id,label:g.label,state:g.state,owner:g.owner,evidence:g.evidence
  })),
  blockers:[
   ...(issueHold?['GitHub Family Alpha issue #255 is OPEN / HOLD']:[]),
   ...blocking.map(x=>'Release evidence missing: '+x.id),
   ...researchDefects.map(x=>'Research not independently accepted: PR #'+x.pr+' '+x.status)
  ]};
}
export function renderFamilyAlphaMarkdown18(r){
 let out='# Closet Current — Family Alpha independent evidence gate (research only)\n\n';
 out+='**Verdict: '+r.releaseDecision+'**. This is NOT pilot/production approval. GitHub Issue #255: '+r.alphaIssueState+'.\n\n';
 out+='| Evidence dimension | Status |\n| --- | --- |\n';
 out+='| Research PRs tracked | '+r.totalResearchPRs+' |\n';
 out+='| Technically and narrowly verified | '+r.verifiedNarrowResearch+' |\n';
 out+='| Dedicated CI green but scientific quality failed | '+r.technicalGreenWithScienceFail+' |\n';
 out+='| Research with open scientific/CI/draft gaps | '+r.researchNeedingFurtherWork+' |\n';
 out+='| Outstanding required release-evidence gates | '+r.releaseGatesRemaining+' |\n';
 out+='| Deployment/merge authorization | **NO** |\n\n';
 out+='## Immutable research PR evidence\n\n| PR | Verified research scope | Exact head CI | Scientific / controller status |\n| --- | --- | --- | --- |\n';
 for(const p of r.research)out+='| [#'+p.pr+'](https://github.com/'+r.repository+'/pull/'+p.pr+') | '+
  noHtml(p.workstream)+' | '+(p.exactWorkflow&&p.exactHead?'YES':'NO')+
  ' | **'+p.status+'** (`'+p.scientificStatus+'`) — '+noHtml(p.limitations)+' |\n';
 out+='\n## Mandatory pilot/Alpha evidence\n\n| Acceptance dimension | Status | Owner | Evidence/limitation |\n| --- | --- | --- | --- |\n';
 for(const x of r.releaseRequirements)out+='| '+noHtml(x.label)+' | **'+x.state+'** | '+
  noHtml(x.owner)+' | '+noHtml(x.evidence)+' |\n';
 out+='\n## Non-negotiable restrictions\n\nFamily Alpha issue #255 remains HOLD; the app is not deployed or merged by this audit. CI green is not a model precision, private-cloud auth, mobile physical-device, original-photo 3D realism, or release authorization receipt. A changing parallel draft PR must obtain a new pinned final SHA and its own dedicated exact-HEAD evidence before acceptance. The main controller must independently approve any future release.\n';
 return out;
}
export async function fetchGithubResearch18(manifest,{token=process.env.GITHUB_TOKEN||''}={}){
 require18(token.length>10,'read-only GitHub token is required for live proof');
 const [owner,repo]=manifest.repository.split('/');
 const base='https://api.github.com/repos/'+owner+'/'+repo;
 const read=async path=>{
  const response=await fetch(base+path,{headers:{
   'authorization':'Bearer '+token,'accept':'application/vnd.github+json',
   'user-agent':'ClosetCurrentFamilyAlphaResearchGate18','x-github-api-version':'2022-11-28'
  },signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('FAMILY-ALPHA-18 read-only GitHub status '+response.status+' '+path.split('?')[0]);
  return response.json();
 };
 const issue=await read('/issues/'+manifest.alphaIssue);
 const prs={},runs={};
 // Sequential: GitHub API rate limits are not bypassed or retried with writes.
 for(const ref of manifest.research){
  prs[String(ref.pr)]=await read('/pulls/'+ref.pr);
  if(ref.dedicatedRunId!==null)runs[String(ref.dedicatedRunId)]=await read('/actions/runs/'+ref.dedicatedRunId);
 }
 return {checkedAt:new Date().toISOString(),issue:{number:issue.number,state:issue.state},prs,runs};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [configPath,reportDir,...options]=process.argv.slice(2);
 require18(configPath&&reportDir&&options.includes('--live'),'usage: script manifest.json output/ --live');
 const m=JSON.parse(await readFile(configPath,'utf8'));
 const actual=await fetchGithubResearch18(m);
 const result=evaluateFamilyAlpha18(m,actual);
 await mkdir(reportDir,{recursive:true});
 await writeFile(resolve(reportDir,'report.json'),JSON.stringify(result,null,2)+'\n');
 await writeFile(resolve(reportDir,'report.md'),renderFamilyAlphaMarkdown18(result));
 console.log('FAMILY ALPHA READ-ONLY EVIDENCE CHECK '+JSON.stringify({
  verdict:result.releaseDecision,issueState:result.alphaIssueState,
  verifiedNarrowResearch:result.verifiedNarrowResearch,
  greenButScientificallyFailed:result.technicalGreenWithScienceFail,
  missingPilotGates:result.releaseGatesRemaining,notReadyResearch:result.researchNeedingFurtherWork,
  deploymentAuthorized:false,mergeAuthorized:false
 }));
 require18(result.releaseDecision==='HOLD'&&
  result.deploymentAuthorized===false&&result.mergeAuthorized===false,
  'unsafe release verdict');
 // A pinned, previously accepted research receipt must remain fresh. New moving
 // parallel PRs and known scientifically failed experiments are recorded as
 // blockers, but they do not falsely fail the evidence collection infrastructure.
 const pinnedAccepted=result.research.filter(x=>x.scientificStatus==='NARROW_RESEARCH_VERIFIED');
 require18(pinnedAccepted.length>=2&&
  pinnedAccepted.every(x=>x.status==='VERIFIED_NARROW_RESEARCH'),
  'a previously accepted research PR changed or its dedicated CI is no longer verifiable');
}