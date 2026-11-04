/** Independent Work #29 receipt audit. GitHub GET only, no environment writes. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const must=(v,m)=>{if(!v)throw Error('SECURITY-RECEIPT-26 '+m)};
const SHA=/^[a-f0-9]{40}$/,HASH=/^[a-f0-9]{64}$/;
const getText=(zip,file)=>{
 must(/^[a-z0-9._-]+$/i.test(file),'unsafe zip entry');
 try{return execFileSync('unzip',['-p',zip,file],{maxBuffer:4000000,timeout:20000})}
 catch{throw Error('SECURITY-RECEIPT-26 zip entry missing '+file)}
};
const actorActions=['backup and outfit hidden','direct overwrite cannot target foreign row',
 'direct delete cannot target foreign row','forged owner insertion denied',
 'wrong backup revision cannot commit','foreign photo listing empty',
 'foreign photo GET','foreign photo PUT','foreign photo DELETE',
 'cannot issue a foreign signed photo URL','foreign photo upload denied'];
export function inspectSignedOwner26(manifest,meta,signed,browser,pngFiles){
 const m=manifest,w=m.work29;
 must(m.schemaVersion===1&&m.priority==='SIGNED-OWNER-EVIDENCE-26','manifest');
 must(m.repository==='nickhaney916-lang/Closet-Current','repository');
 must(m.sourceBase?.pr===582&&m.sourceBase.sha==='ed7abb0ada27501ad545975f13c8bc2ed59ffa90','parent');
 must(m.governance?.mergeAllowed===false&&m.governance?.productionDeploy===false&&
  m.governance?.stagingModify===false&&m.governance?.alphaActivationAllowed===false,'release guard');
 must(m.familyAlpha?.issue===255&&m.familyAlpha.decision==='HOLD'&&
  m.familyAlpha.releaseRequirementsUnverified===9,'pilot guard');
 must(w.pr===581&&w.sha==='2dd3ea96725aa1bcb797727ea31a7f99167ad3f5'&&
  w.runId===41888655925&&w.signedArtifactId===13351329641&&
  w.browserArtifactId===13352638055&&w.signedChecks===56&&w.browserCases===6,'Work29 pins');
 must(w.limitations?.hostedSignedEnvironment===false&&
  w.limitations?.physicalPhone===false&&
  w.limitations?.signedBrowserToCloudE2E===false&&
  w.limitations?.bearerRevokedImmediatelyOnLogout===false&&
  w.limitations?.browserAuthIsFixture===true,'auth limitations');
 const {pr,run,jobs,artifacts,issue}=meta;
 must(pr?.number===581&&pr.draft===true&&pr.state==='open'&&pr.merged!==true&&
  pr.head?.sha===w.sha&&pr.head?.repo?.full_name===m.repository&&
  pr.base?.repo?.full_name===m.repository&&
  pr.head?.ref==='research/signed-owner-privacy-25-work29-HOLD','exact Work29 PR');
 must(run?.id===w.runId&&run.head_sha===w.sha&&
  run.head_repository?.full_name===m.repository&&run.status==='completed'&&
  run.conclusion==='success'&&run.event==='pull_request'&&
  /SIGNED-OWNER-PRIVACY-25/i.test(run.name||'')&&
  /NO DEPLOY/i.test(run.name||''),'exact no-deploy work29 run');
 must(Array.isArray(jobs),'job metadata');
 for(const name of ['browser','signed-http']){
  const matching=jobs.filter(x=>x.name===name);
  must(matching.length===1&&matching[0].status==='completed'&&
   matching[0].conclusion==='success','independent '+name+' job not successful');
 }
 must(Array.isArray(artifacts),'artifact metadata');
 for(const [id,name] of [[w.signedArtifactId,w.signedArtifactName],
   [w.browserArtifactId,w.browserArtifactName]]){
  const matching=artifacts.filter(x=>x.id===id&&x.name===name);
  must(matching.length===1&&matching[0].expired===false&&
   matching[0].size_in_bytes>100,'artifact absent or expired '+name);
 }
 must(issue?.number===255&&issue.state==='open','hold issue changed');
 must(SHA.test(signed?.head||'')&&signed.head===w.sha&&
  signed.signedLocalSupabase===true&&
  signed.distinctAuthenticatedOwners===true&&
  signed.scope==='Disposable loopback; synthetic JPEGs; no hosted access',
  'no genuine disposable two-account signed report');
 must(signed.logoutAccessTokenRemainsUsable===true,'must disclose JWT remains valid until expiration');
 must(Array.isArray(signed.checks)&&signed.checks.length===56,'56 signed HTTP checks absent');
 const checks=new Map();
 for(const row of signed.checks){
  must(typeof row.name==='string'&&row.name.length>5&&
   Number.isInteger(row.status)&&row.status>=200&&row.status<500,'invalid check');
  if(!checks.has(row.name))checks.set(row.name,[]);
  checks.get(row.name).push(row.status);
 }
 for(const owner of ['A','B']){
  for(const title of ['signup','password login','server-authenticated identity',
   'owner creates private JPEG','owner creates backup',
   'owns unchanged original, outfit and backup','private JPEG hash',
   'owner can list photo'])
   must((checks.get(owner+' '+title)||[]).some(s=>s===200),
    'positive signed owner proof '+owner+' '+title);
  const anon=checks.get('Anonymous '+owner+' backup or photo denied')||[];
  must(anon.length===3&&anon.every(x=>x>=400),'anonymous privacy not tested '+owner);
 }
 for(const [actor,victim] of [['A','B'],['B','A']])
  for(const action of actorActions){
   const label=actor+' against '+victim+' '+action,statuses=checks.get(label)||[];
   must(statuses.length===1,'missing cross-owner negative '+label);
   if(/hidden|overwrite|delete cannot|wrong backup revision|listing empty/.test(action))
    must([200,401,403].includes(statuses[0]),'bad row-level status '+label);
   else must([400,401,403,404].includes(statuses[0]),'bad forbidden status '+label);
  }
 for(const title of ['Tampered signed credential denied','Refresh preserves signed owner',
  'Signed logout succeeds','Signed logout revokes refresh credential',
  'Naturally expired signed credential denied','Refresh after access expiry retains owner'])
  must((checks.get(title)||[]).length===1,'missing token lifecycle '+title);
 must(checks.get('Tampered signed credential denied')[0]===401&&
  checks.get('Naturally expired signed credential denied')[0]===401,
  'expired/tampered tokens not blocked');
 must(browser?.authScope==='Synthetic auth transport with real application and IndexedDB'&&
  Array.isArray(browser.results)&&browser.results.length===6,'real app browser with fixture auth');
 const cases=new Set();
 for(const item of browser.results){
  must(['chromium','webkit'].includes(item.engine)&&
   [320,390,430].includes(item.width),'browser engine/viewport');
  const id=item.engine+'-'+item.width;
  must(!cases.has(id),'duplicate browser case');
  cases.add(id);
  must(item.filename===id+'.png'&&HASH.test(item.sha256)&&
   item.realIndexedDB===true&&item.authFixture===true&&
   item.lateWriteRejected===true,'fixture auth / stale write not proven');
  const png=pngFiles[item.filename];
  must(Buffer.isBuffer(png)&&png.length>8000&&
   png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&
   png.readUInt32BE(16)===item.width&&png.readUInt32BE(20)>400,
   'screenshot missing/blank/wrong viewport '+id);
  must(createHash('sha256').update(png).digest('hex')===item.sha256,
   'screenshot byte SHA mismatch '+id);
 }
 must(cases.size===6,'mobile matrix missing');
 return {
  priority:'SIGNED-OWNER-EVIDENCE-26',verdict:'NARROW_DISPOSABLE_SIGNED_RESEARCH_VERIFIED',
  work29PR:581,commit:w.sha,dedicatedRun:w.runId,
  realSignedDisposableAccounts:2,signedHttpChecks:56,
  ownRecordsAndPhotosAccessible:true,otherAccountRecordsAndPhotosDenied:true,
  anonymousAccessDenied:true,tokenExpiryAndRefreshTested:true,
  accessJwtMayPersistAfterLogout:true,
  browserRuns:6,browserAuth:'SYNTHETIC_FIXTURE',
  realIndexedDB:true,staleWritesRejected:true,screenshotSha256Verified:6,
  hostedCloudSignedSecurityAccepted:false,realHandsetAccepted:false,
  realSignedBrowserToCloudAccepted:false,fullConsumerE2EAccepted:false,
  familyAlpha:'HOLD',pilotReleaseApproved:false,mergeAllowed:false,deployAllowed:false,
  limitations:[
   'Two real signed accounts were tested only in disposable loopback Supabase',
   'Actual browser used fixture auth, not signed browser-to-cloud login',
   'Unexpired JWT access token may work after logout until it expires',
   'Hosted staging, physical phones, original customer photos, and release remain unverified'
  ]
 };
}
export function renderSignedOwner26(out){
 return '# Closet Current — signed two-owner security receipt #26\n\n'+
  '**Narrow disposable signed research verified; Family Alpha HOLD. No merge or deploy.**\n\n'+
  'PR #'+out.work29PR+' exact '+out.commit+', dedicated NO DEPLOY Actions #'+out.dedicatedRun+
  ' independently verified from real GitHub PR, workflow, two jobs, ZIP artifacts, and screenshot hashes.\n\n'+
  '- Two genuinely signed account identities in disposable loopback Supabase: YES\n'+
  '- 56 genuine signed API checks; own access and denied cross-owner/anonymous access: YES\n'+
  '- Six actual Chromium/WebKit app+IndexedDB fixture-auth mobile cases: YES\n'+
  '- Six PNG screenshot SHA256 receipts: YES\n'+
  '- Existing hosted cloud signed accounts or real Android/iPhone: NOT VERIFIED\n'+
  '- Browser signed cloud end-to-end or Family Alpha readiness: NOT VERIFIED\n'+
  '- Logout still-valid JWT remains usable until expiry: DOCUMENTED\n\n'+
  'Scientific and release limitations:\n'+out.limitations.map(x=>'- '+x).join('\n')+'\n';
}
const getZipJson=(zip,name)=>JSON.parse(getText(zip,name).toString('utf8'));
async function githubJSON(path,token){
 const response=await fetch('https://api.github.com/repos/nickhaney916-lang/Closet-Current'+path,{
  headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json',
  'User-Agent':'ClosetCurrentOwnerReceipt26'},signal:AbortSignal.timeout(30000)});
 must(response.ok,'GitHub read-only HTTP '+response.status);
 return response.json();
}
export async function reviewGitHubSignedOwner26(manifest,token,signedZip,browserZip){
 must(token&&token.length>12,'read-only Actions token missing');
 const w=manifest.work29;
 const [pr,run,jobData,artifactData,issue]=await Promise.all([
  githubJSON('/pulls/581',token),githubJSON('/actions/runs/'+w.runId,token),
  githubJSON('/actions/runs/'+w.runId+'/jobs?per_page=100',token),
  githubJSON('/actions/runs/'+w.runId+'/artifacts?per_page=100',token),
  githubJSON('/issues/255',token)
 ]);
 const signed=getZipJson(signedZip,'signed.json'),browser=getZipJson(browserZip,'browser.json');
 const pngs={};
 for(const engine of ['chromium','webkit'])
  for(const width of [320,390,430]){
   const name=engine+'-'+width+'.png';
   pngs[name]=getText(browserZip,name);
  }
 return inspectSignedOwner26(manifest,{
  pr,run,jobs:jobData.jobs,artifacts:artifactData.artifacts,
  issue:{number:issue.number,state:issue.state}},signed,browser,pngs);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [manifestFile,dir,signedZip,browserZip,...flags]=process.argv.slice(2);
 must(manifestFile&&dir&&signedZip&&browserZip&&flags.includes('--live'),
  'usage: audit manifest.json outputDir signed.zip browser.zip --live');
 const m=JSON.parse(await readFile(manifestFile,'utf8'));
 const out=await reviewGitHubSignedOwner26(m,process.env.GITHUB_TOKEN,signedZip,browserZip);
 await mkdir(dir,{recursive:true});
 await writeFile(resolve(dir,'report.json'),JSON.stringify(out,null,2)+'\n');
 await writeFile(resolve(dir,'report.md'),renderSignedOwner26(out));
 console.log('SIGNED-OWNER-EVIDENCE-26 VERIFIED '+JSON.stringify({
  verdict:out.verdict,realSignedUsers:out.realSignedDisposableAccounts,
  HTTP:out.signedHttpChecks,appBrowserCases:out.browserRuns,
  screenshotHashes:out.screenshotSha256Verified,hostedCertified:false,FamilyAlpha:'HOLD'}));
}
