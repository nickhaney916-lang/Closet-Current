import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const candidate = 'ed340449514255c4bda84eb47f64187e5bd546c8';
export const branch = 'research/assignment1549-evidence-HOLD';
export const parent = '15ed37c35dfe0830e73d007bce64a090b0f53333';
export const workflow = '.github/workflows/main1054-assignment1549-no-deploy.yml';
export const steps = [
 'Verify candidate lineage', 'Focused closet regressions',
 'Owner photo privacy and backup regressions', 'Full available JavaScript suite',
];
const id = value => Number.isSafeInteger(value) && value > 0;
const sha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const succeeded = row => row?.status === 'completed' && row.conclusion === 'success';

export function verifyEvidence({ gateSha, candidateSha, candidateParent, run, jobs, claims }) {
 if (!sha(gateSha) || candidateSha !== candidate || candidateParent !== parent ||
     !id(run?.id) || run.head_sha !== gateSha || run.head_branch !== branch ||
     run.path !== workflow || run.event !== 'pull_request' || run.run_attempt !== 1) {
  return { status:'BLOCKED', reason:'Missing or mismatched first-attempt source identity' };
 }
 if (claims?.familyAlpha !== 'HOLD' || claims?.nativeRepair !== false ||
     claims?.originalOwnerFlow !== false || claims?.chromium !== false || claims?.webkit !== false) {
  return { status:'BLOCKED', reason:'Claim exceeds the scope of the application Node gate' };
 }
 if (run.status === 'completed' && run.conclusion === 'failure') {
  return { status:'FAIL', reason:'First-attempt workflow failed' };
 }
 if (!succeeded(run) || !Array.isArray(jobs) || jobs.length !== 1) {
  return { status:'BLOCKED', reason:'Workflow not complete or exact job evidence unavailable' };
 }
 const [job] = jobs;
 if (!succeeded(job) || !id(job.id) || job.run_id !== run.id || job.name !== 'application-node' ||
     !Array.isArray(job.steps) ||
     !steps.every(name => {
      const matching = job.steps.filter(step => step.name === name);
      return matching.length === 1 && succeeded(matching[0]);
     })) {
  return { status:'BLOCKED', reason:'Required successful steps missing or ambiguous' };
 }
 return { status:'PASS', candidateSha, runId:run.id, jobId:job.id,
  scope:'ordinary Node application tests', familyAlpha:'HOLD', nativeRepair:false };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
 try {
  const result = verifyEvidence(JSON.parse(readFileSync(process.argv[2], 'utf8')));
  console.log(JSON.stringify(result));
  if (result.status !== 'PASS') process.exitCode = 1;
 } catch {
  console.error('BLOCKED: supply the documented evidence JSON envelope');
  process.exitCode = 1;
 }
}
