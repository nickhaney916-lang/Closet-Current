/**
 * FAMILY-ALPHA-QUALITY-LEDGER-24 — read-only scientific release governance.
 *
 * This is not model inference, owner authorization, a security test, or a
 * deployment mechanism. It checks actual PR heads and dedicated NO DEPLOY
 * GitHub Actions evidence, preserves independent scientific failures, and
 * distinguishes an observable GitHub Work #29 handoff from an invisible Work
 * session. Never stores any original photo, tokens, user data, or session IDs.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {evaluateFamilyAlpha18,renderFamilyAlphaMarkdown18,fetchGithubResearch18,REQUIRED_GATES_18}
  from './family-alpha-evidence-gate-18.mjs';

const must=(condition,message)=>{
 if(!condition)throw Error('QUALITY-LEDGER-24 '+message);
};
const REQUIRED_REFS=Object.freeze([569,570,571,572,573,575,578,579,580]);
const SCIENTIFIC_UNSAFE=new Set([570,572,575,578,580]);
export function evaluateQualityLedger24(manifest,live,work29={candidatePRs:[],candidateBranches:[]}){
 must(manifest?.priority==='FAMILY-ALPHA-QUALITY-LEDGER-24','wrong priority');
 must(manifest?.sourceBase?.pr===574&&
  manifest.sourceBase.sha==='9012e01443f97f81b236a4f51afdbb6ad885aaaa',
  'untrusted initial research evidence gate baseline');
 must(manifest?.governance?.familyAlphaHold===true&&
  manifest.governance?.mergeAllowed===false&&
  manifest.governance?.productionDeployAllowed===false,
  'release authority may not be inferred from a research PR');
 must(Array.isArray(manifest.research)&&
  manifest.research.length===REQUIRED_REFS.length&&
  REQUIRED_REFS.every((id,i)=>manifest.research[i]?.pr===id),
  'expected immutable PR-scientific-evidence chain changed');
 must(Array.isArray(manifest.releaseRequirements)&&
  manifest.releaseRequirements.length===REQUIRED_GATES_18.length&&
  manifest.releaseRequirements.every((gate,i)=>gate.id===REQUIRED_GATES_18[i]&&
   gate.state==='UNVERIFIED'),
  'every mandatory pilot release gate must remain unverified');
 for(const e of manifest.research){
  if(SCIENTIFIC_UNSAFE.has(e.pr))must(e.scientificStatus==='NEEDS_REWORK',
   'known scientific failure cannot be declared accepted PR '+e.pr);
 }
 must(manifest.research.find(x=>x.pr===573)?.pinnedHead===null&&
  manifest.research.find(x=>x.pr===573)?.scientificStatus==='IN_PROGRESS',
  'superseded early #573 still cannot silently count as accepted science');
 must(manifest.research.find(x=>x.pr===579)?.scientificStatus==='NARROW_RESEARCH_VERIFIED',
  'PR579 is only a narrowly accepted color source-provenance fix');
 const color=manifest.scientificFacts?.color,seg=manifest.scientificFacts?.segmentation,
  provenance=manifest.scientificFacts?.colorProvenance,security=manifest.scientificFacts?.work29;
 must(color&&seg&&provenance&&security,'scientific facts absent');
 must(color.uniqueOriginals===49&&color.evaluable===45&&color.ambiguous===4&&
  color.evaluable+color.ambiguous===color.uniqueOriginals&&
  color.humanIndependentlyValidated===0&&color.crossEngineAutoDisagreements===3,
  'color benchmark evidence dimensions invalid');
 for(const engine of ['chromium','webkit']){
  const a=color[engine];
  must(Number.isInteger(a.previousCorrect)&&Number.isInteger(a.currentCorrect)&&
   Number.isInteger(a.accepted)&&Number.isInteger(a.correctAccepted)&&
   Number.isInteger(a.incorrectAccepted)&&a.accepted===a.correctAccepted+a.incorrectAccepted&&
   a.currentCorrect<=color.evaluable,
   'inconsistent color denominators: '+engine);
 }
 must(seg.uniqueOriginals===19&&seg.visibleTargets===35&&
  seg.directCorrectHits===8&&seg.reviewResizeHits===10&&seg.reviewResizeProposals===61&&
  seg.secondReviewerCount===0&&seg.maskIouGroundTruth===false,
  'segmentation quality limitations cannot be removed');
 must(provenance.pr===579&&provenance.nodeTestsPassed===468&&
  provenance.browserCases===12&&provenance.scientificColorAccuracyCertified===false&&
  provenance.followupBrowserAutoDecisionDisagreements===2,
  'color source provenance must not certify independently failed color science');
 must(security.signedIndependentAccountAandBHttpProof===false&&
  security.authTokenValidated===false&&security.externalSessionStateVisible===false&&
  security.commitSha===null,
  'Work29 signed account proof is missing: no GitHub candidate alone certifies it');
 must(manifest.projectWorkstreams?.find(w=>w.id==='work-29')?.releaseCertified===false,
  'invisible external session may not be certified by assignment');
 must(work29&&Array.isArray(work29.candidatePRs)&&Array.isArray(work29.candidateBranches),
  'GitHub Work29 handoff observations must be arrays');
 for(const x of [...work29.candidatePRs,...work29.candidateBranches])
  must(typeof x==='string'&&x.length>0&&x.length<300&&!/[\r\n<>]/.test(x),
   'untrusted external Work29 reference');
 const base=evaluateFamilyAlpha18(manifest,live);
 const byId=new Map(base.research.map(r=>[r.pr,r]));
 must(base.alphaIssueState==='open',
  'Family Alpha issue #255 no longer open; independent manual controller reconciliation required');
 must(base.releaseDecision==='HOLD'&&base.releaseGatesRemaining===9&&
  !base.deploymentAuthorized&&!base.mergeAuthorized,
  'research source cannot override Family Alpha HOLD');
 must(REQUIRED_REFS.every(pr=>byId.has(pr)),'missing independent PR evidence');
 const signedGate=base.releaseRequirements.find(r=>r.id==='signed-account-rls');
 must(signedGate?.state==='UNVERIFIED'&&signedGate.owner==='work-29',
  'Work29 privacy evidence release gate incorrectly assigned/accepted');
 const observed=work29.candidatePRs.length+work29.candidateBranches.length;
 const work29Status=observed?'GITHUB_CANDIDATE_OBSERVED_NOT_SECURITY_CERTIFIED':
  'NO_GITHUB_HANDOFF_OBSERVED_SESSION_STATUS_UNKNOWN';
 const falseAccept=base.research.filter(x=>SCIENTIFIC_UNSAFE.has(x.pr)&&
  x.status==='VERIFIED_NARROW_RESEARCH');
 must(falseAccept.length===0,'scientific NEEDS REWORK falsely reported safe');
 const scientificFailures=base.research.filter(x=>x.scientificStatus==='NEEDS_REWORK');
 const final={
  ...base,
  priority:'FAMILY-ALPHA-QUALITY-LEDGER-24',
  work29:{gitHubEvidence:work29Status,sessionIsRunning:null,
   genuineTwoSignedAccountsCertified:false,
   candidatePRs:[...new Set(work29.candidatePRs)].sort(),
   candidateBranches:[...new Set(work29.candidateBranches)].sort()},
  immutableScientificFacts:manifest.scientificFacts,
  knownScientificFailures:scientificFailures.map(x=>({
   pr:x.pr,head:x.currentHead,headMatchesPinned:x.exactHead,
   exactDedicatedCi:x.exactWorkflow,scienceVerdict:'NEEDS_REWORK',
   limitations:x.limitations})),
  decision:'HOLD',
  recommendations:[
   'Work #29: require real signed A/B owner-positive and cross-owner-negative HTTP tests; only a GitHub handoff is observable here.',
   'Work #28 PR #580: independently human-certify color labels and correct low color accuracy and browser auto-decisions; avoid claiming 95%.',
   'Parallel #26 PR #575: improve multi-garment precision and recall; independent mask/box annotation required.',
   'Work #27: source-true consumer integration and real device acceptance remain independent.',
   'No merge, staging change, production deploy, Family Alpha activation or pilot authorization.'
  ]
 };
 return final;
}
export function renderQualityLedger24(r){
 let s='# Closet Current — Independent Family Alpha scientific quality ledger #24\n\n';
 s+='**Verdict: HOLD — NO DEPLOY/MERGE — Family Alpha Issue #255 OPEN.**\n\n';
 s+='## Work #29 health / handoff\n\n';
 s+='GitHub evidence: **'+r.work29.gitHubEvidence+'**. This read-only audit cannot see whether a separate ChatGPT Work session is running or whether its unpublished work is proceeding. Genuine signed A/B HTTP security proof: **NOT CERTIFIED**. Work #29 owns this requirement.\n\n';
 s+='## Recent independent measured gaps\n\n';
 const c=r.immutableScientificFacts.color,g=r.immutableScientificFacts.segmentation;
 s+='- **Work #28, PR #580:** '+c.uniqueOriginals+' real original photographs, '+c.evaluable+' provisionally evaluable, '+c.ambiguous+' ambiguous, '+c.humanIndependentlyValidated+' independently human-certified labels. Updated Chromium correctness '+c.chromium.currentCorrect+'/'+c.evaluable+'; WebKit '+c.webkit.currentCorrect+'/'+c.evaluable+'. Automatic color acceptance: Chromium '+c.chromium.correctAccepted+'/'+c.chromium.accepted+' correct, WebKit '+c.webkit.correctAccepted+'/'+c.webkit.accepted+' correct on provisional labels; '+c.crossEngineAutoDisagreements+' cross-browser automatic disagreements. Scientific quality **NEEDS REWORK**.\n';
 s+='- **Parallel #26, PR #575:** '+g.uniqueOriginals+' SHA-locked originals, '+g.visibleTargets+' visible targets, '+g.directCorrectHits+'/'+g.visibleTargets+' direct-original recall, '+g.reviewResizeHits+'/'+g.reviewResizeProposals+' review-resize prediction precision. No independently reviewed pixel masks. Scientific quality **NEEDS REWORK**.\n';
 s+='- **PR #578 / PR #579:** prior six-photo color consistency was not general: independent later photos showed '+r.immutableScientificFacts.colorProvenance.followupBrowserAutoDecisionDisagreements+'/6 mismatched automatic browser decisions. PR #579 save-color provenance is narrowly tested but not color model acceptance.\n';
 s+='\n## Verified GitHub research receipts\n\n';
 s+=renderFamilyAlphaMarkdown18(r);
 s+='\n## Work #29 observable candidates, not proof\n\n';
 s+='Candidate PRs: '+(r.work29.candidatePRs.join(', ')||'none observed')+'. Candidate research branches: '+(r.work29.candidateBranches.join(', ')||'none observed')+'. These cannot certify signed identity, RLS, storage privacy, or a Work session state.\n\n';
 s+='## Action boundaries\n\n'+r.recommendations.map(x=>'- '+x).join('\n')+'\n';
 return s;
}
async function readOnlyGithubJson(url,token){
 must(token&&token.length>10,'read-only GitHub token needed to inspect unpublished branch/PR handoff');
 const response=await fetch(url,{
  headers:{Authorization:'Bearer '+token,'Accept':'application/vnd.github+json',
   'User-Agent':'ClosetCurrentIndependentQualityLedger24',
   'X-GitHub-Api-Version':'2022-11-28'},
  signal:AbortSignal.timeout(30000)
 });
 if(!response.ok)throw Error('QUALITY-LEDGER-24 read-only GitHub HTTP '+response.status);
 return response.json();
}
export async function inspectWork29Github24(repository,token=process.env.GITHUB_TOKEN||''){
 const base='https://api.github.com/repos/'+repository;
 const [prResults,...branchResults]=await Promise.all([
  readOnlyGithubJson('https://api.github.com/search/issues?q='+
   encodeURIComponent('repo:'+repository+' is:pr "SIGNED-OWNER-PRIVACY-25"')+'&per_page=20',token),
  readOnlyGithubJson(base+'/git/matching-refs/heads/research/signed-owner',token),
  readOnlyGithubJson(base+'/git/matching-refs/heads/work/signed-owner',token)
 ]);
 must(Number.isInteger(prResults.total_count),'invalid search result');
 must(branchResults.every(Array.isArray),'invalid branch evidence');
 return {
  candidatePRs:(prResults.items||[]).slice(0,20).map(x=>
   '#'+x.number+' '+(x.title||'').slice(0,160)),
  candidateBranches:branchResults.flat().map(x=>String(x.ref||'').replace('refs/heads/',''))
 };
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [manifestFile,outDir,...flags]=process.argv.slice(2);
 must(manifestFile&&outDir&&flags.includes('--live'),
  'usage: script research/family-alpha-quality-ledger-24/manifest.json benchmark/family-alpha-quality-24 --live');
 const manifest=JSON.parse(await readFile(manifestFile,'utf8'));
 const token=process.env.GITHUB_TOKEN||'';
 const [live,work29]=await Promise.all([
  fetchGithubResearch18(manifest,{token}),
  inspectWork29Github24(manifest.repository,token)
 ]);
 const report=evaluateQualityLedger24(manifest,live,work29);
 await mkdir(outDir,{recursive:true});
 await writeFile(resolve(outDir,'report.json'),JSON.stringify(report,null,2)+'\n');
 await writeFile(resolve(outDir,'report.md'),renderQualityLedger24(report));
 console.log('QUALITY-LEDGER-24 EXACT-GITHUB-EVIDENCE '+JSON.stringify({
  verdict:report.decision,issue:report.alphaIssueState,trackedPRs:report.totalResearchPRs,
  scientificFailures:report.knownScientificFailures.map(x=>x.pr),
  exactHeadQualityFailures:report.knownScientificFailures.filter(x=>
   x.headMatchesPinned&&x.exactDedicatedCi).map(x=>x.pr),
  work29:report.work29.gitHubEvidence,securityCertified:false,
  gatesRemaining:report.releaseGatesRemaining,
  mergeAllowed:false,deployAllowed:false
 }));
 must(report.decision==='HOLD'&&report.knownScientificFailures.length>=5,
  'known science failure ledger unexpectedly incomplete');
 // These two are already accepted only for narrow original-photo/source-provenance
 // research. A changed head or missing dedicated CI cannot be called passed.
 for(const id of [569,571,579]){
  const ref=report.research.find(x=>x.pr===id);
  must(ref&&ref.status==='VERIFIED_NARROW_RESEARCH',
   'narrow accepted PR '+id+' drifted or lost exact-head evidence');
 }
}