/**
 * Family Alpha #70 — private, physical-phone manual QA kit. Offline by default.
 * No browser connection, credentials, photos, family names, or test-account IDs.
 * Output cannot approve a release. Never upload completed private worksheets.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export const PLAN_VERSION='closet-current-alpha70-qa-plan-v1';
export const REPORT_VERSION='closet-current-alpha70-local-worksheet-v1';
export const SUBJECTS=Object.freeze(['adult-a','adult-b','child-a','child-b']);
const STATUSES=Object.freeze(['NOT_RUN','PASS','FAIL','BLOCKED']);
const exact=(obj,fields,name)=>{
 assert.ok(obj&&typeof obj==='object'&&!Array.isArray(obj),name+' must be object');
 assert.deepEqual(Object.keys(obj).sort(),[...fields].sort(),name+' must contain only expected keys');
};
export function assertPlan(p){
 exact(p,['format','target','productionAccess','deployAuthorized','subjects','physicalCoverage','cases'],'QA plan');
 assert.equal(p.format,PLAN_VERSION);
 assert.equal(p.target,'CLOSET_CURRENT_STAGING_ONLY');
 assert.equal(p.productionAccess,false);
 assert.equal(p.deployAuthorized,false);
 assert.deepEqual(p.subjects,SUBJECTS);
 exact(p.physicalCoverage,['android','ios','others'],'physical coverage');
 assert.equal(p.physicalCoverage.android,'adult-a');
 assert.equal(p.physicalCoverage.ios,'adult-b');
 assert.equal(p.physicalCoverage.others,'guardian-supervised-physical-phone');
 assert.ok(Array.isArray(p.cases)&&p.cases.length===SUBJECTS.length*9+11,'All four individual QA and A/B negative cases required');
 const ids=new Set(),actorCounts=new Map(SUBJECTS.map(x=>[x,0]));
 let negative=0,cross=0;
 for(const c of p.cases){
  exact(c,['id','actors','group','expected','step'],'QA case');
  assert.match(c.id,/^(adult-a|adult-b|child-a|child-b)\/P0[1-9]$|^two-owner\/X(0[1-9]|10|11)$/);
  assert.ok(!ids.has(c.id),'Duplicate case '+c.id);ids.add(c.id);
  assert.ok(Array.isArray(c.actors)&&c.actors.length>=1&&c.actors.length<=2);
  for(const actor of c.actors)assert.ok(SUBJECTS.includes(actor),'Unknown test actor');
  if(c.id.startsWith('two-owner/')){
   assert.deepEqual(c.actors,['adult-a','adult-b']);
   cross++;
  }else{
   assert.deepEqual(c.actors,[c.id.split('/')[0]]);
   actorCounts.set(c.actors[0],actorCounts.get(c.actors[0])+1);
  }
  assert.ok(['ALLOW','DENY'].includes(c.expected));
  if(c.expected==='DENY')negative++;
  assert.match(c.group,/^[a-z-]{3,32}$/);
  assert.ok(typeof c.step==='string'&&c.step.length>=20&&c.step.length<=320);
 }
 assert.ok(negative>=8,'Negative privacy controls missing');
 assert.equal(cross,11,'Two-owner positive/negative control matrix incomplete');
 for(const n of actorCounts.values())assert.equal(n,9,'Every family test role must cover full phone workflow');
 return p;
}
export const blankWorksheet=p=>({
 format:REPORT_VERSION,source:PLAN_VERSION,scope:'LOCAL_PRIVATE_ONLY',
 results:assertPlan(p).cases.map(c=>({id:c.id,status:'NOT_RUN'}))
});
export function assessWorksheet(p,r){
 assertPlan(p);
 exact(r,['format','source','scope','results'],'worksheet');
 assert.equal(r.format,REPORT_VERSION);
 assert.equal(r.source,PLAN_VERSION);
 assert.equal(r.scope,'LOCAL_PRIVATE_ONLY');
 assert.ok(Array.isArray(r.results)&&r.results.length===p.cases.length,'No missing or extra checks');
 const counts={NOT_RUN:0,PASS:0,FAIL:0,BLOCKED:0};
 for(let i=0;i<r.results.length;i++){
  const x=r.results[i];
  exact(x,['id','status'],'private result');
  assert.equal(x.id,p.cases[i].id,'Case order and ID must match the trusted plan');
  assert.ok(STATUSES.includes(x.status),'Invalid result status');
  counts[x.status]++;
 }
 return Object.freeze({
  decision:'HOLD',
  releaseAuthorized:false,
  stagingModified:false,productionModified:false,
  reportType:'UNVERIFIED_LOCAL_SELF_REPORT',
  physicalDeviceEvidenceAcceptedByRepository:false,
  fourAccountLiveJwtEvidenceAcceptedByRepository:false,
  independentVisualApproval:false,
  total:p.cases.length,
  counts,
  allLocallyMarkedPass:counts.PASS===p.cases.length,
  next:'Retain local private evidence; human owner verifies physical devices and live sessions. No automatic release.'
 });
}
export function printPlan(p){
 assertPlan(p);
 const lines=['# Closet Current Family Alpha — private phone checklist','', '**STAGING ONLY — NO DEPLOY — NO FAMILY PHOTOS IN PUBLIC ISSUES**',''];
 for(const actor of SUBJECTS){
  const device=actor==='adult-a'?'Android (suggested)':actor==='adult-b'?'iPhone (suggested)':'Physical phone (guardian supervised)';
  lines.push('## '+actor+' — '+device);
  for(const c of p.cases.filter(c=>c.id.startsWith(actor+'/')))
   lines.push('- [ ] '+c.id+' ['+c.expected+'] '+c.step);
  lines.push('');
 }
 lines.push('## Two-owner verification (existing approved synthetic adult test accounts only)');
 for(const c of p.cases.filter(c=>c.id.startsWith('two-owner/')))
  lines.push('- [ ] '+c.id+' ['+c.expected+'] '+c.step);
 lines.push('','Expected ALLOW means legitimate action succeeds; DENY means requested access stays inaccessible.','Do not record credentials, JWTs, names, personal photos, account IDs, private URLs, raw responses, or minor details in the checklist.','This document never constitutes an invitation or release.');
 return lines.join('\n');
}
export async function readPlan(path=new URL('../research/family-alpha-70/device-qa-manifest.json',import.meta.url)){
 const data=await readFile(path,'utf8');
 assert.ok(data.length>0&&data.length<30000,'QA plan file size bound');
 return assertPlan(JSON.parse(data));
}
export async function readLocalWorksheet(path){
 const data=await readFile(path,'utf8');
 assert.ok(data.length>0&&data.length<18000,'Worksheet size bound');
 return JSON.parse(data);
}
const invoked=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(invoked){
 try{
  const p=await readPlan(),args=process.argv.slice(2);
  if(args.length===1&&args[0]==='--plan')console.log(printPlan(p));
  else if(args.length===1&&args[0]==='--template')console.log(JSON.stringify(blankWorksheet(p),null,2));
  else if(args.length===2&&args[0]==='--report'&&args[1]&&!args[1].startsWith('-'))
   console.log('ALPHA_70_LOCAL_HOLD',JSON.stringify(assessWorksheet(p,await readLocalWorksheet(args[1]))));
  else {
   console.log('ALPHA_70_LOCAL_HOLD',JSON.stringify(assessWorksheet(p,blankWorksheet(p))));
   console.log('Use --plan for manual steps, --template for empty local worksheet, or --report <local-only.json>.');
  }
 }catch{
  // Never print private worksheet contents or error payloads.
  console.error('ALPHA_70_LOCAL_HOLD: INVALID_OR_PRIVATE_REPORT_REFUSED');
  process.exitCode=1;
 }
}
