// LOCAL evidence gate for two PRIVATELY exported device-check files.
// A completed checklist is NOT attestation that any physical camera was used.
import deviceCheckEngine from '../public/device-check-engine.js';
const {deviceCheckSteps,deviceEventTypes,deviceStages,deviceErrorCodes}=deviceCheckEngine;
const required=new Set(deviceCheckSteps.map(([id])=>id));
const eventTypes=new Set(deviceEventTypes),stages=new Set(deviceStages),codes=new Set(deviceErrorCodes);
const fields=new Set(['format','version','kind','appRelease','platform','steps','events','summary',
 'hardwareVerified','liveCameraVerified','sourcePhotoAccuracyMeasured','paidModelQualityVerified','sendAutomatically']);
const eventKeys=new Set(['type','stage','code','durationMs','percent']);
const summaryKeys=new Set(['checked','required','missing','needsHelp','scannerErrors','locallyComplete']);
const keysSubset=(x,allowed)=>x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).every(k=>allowed.has(k));
const exactArray=(a,b)=>Array.isArray(a)&&JSON.stringify(a)===JSON.stringify(b);
function review(report,platform){
 if(!keysSubset(report,fields)||Object.keys(report).length!==fields.size||
    report.format!=='closet-current-device-check'||report.version!==2||
    report.kind!=='self-reported-phone-check-not-hardware-certification'||
    !/^[a-f0-9]{12}$/.test(report.appRelease||'')||
    report.platform!==platform||report.hardwareVerified!==false||
    report.liveCameraVerified!==false||report.sourcePhotoAccuracyMeasured!==false||
    report.paidModelQualityVerified!==false||report.sendAutomatically!==false||
    !keysSubset(report.steps,required)||!Array.isArray(report.events)||
    report.events.length>40||!keysSubset(report.summary,summaryKeys)||
    Object.keys(report.summary).length!==summaryKeys.size)
  throw Error('Untrusted device diagnostic: only version 2 privately exported records accepted');
 for(const result of Object.values(report.steps))
  if(!['pass','fail'].includes(result))throw Error('Malformed device check answer');
 const num=Object.keys(report.steps).length, missing=[...required].filter(id=>!report.steps[id]),
  failed=[...required].filter(id=>report.steps[id]==='fail');
 let errors=0;
 for(const e of report.events){
  if(!keysSubset(e,eventKeys)||!eventTypes.has(e.type)||
     (Object.hasOwn(e,'stage')&&!stages.has(e.stage))||
     (Object.hasOwn(e,'code')&&!codes.has(e.code))||
     (Object.hasOwn(e,'durationMs')&&(!Number.isInteger(e.durationMs)||e.durationMs<0||e.durationMs>600000))||
     (Object.hasOwn(e,'percent')&&(!Number.isInteger(e.percent)||e.percent<0||e.percent>100)))
   throw Error('Device report contains unsanitized or fabricated scan events');
  if(['scanner_error','worker_start_failed','timeout','photo_check_failed','outfit_split_failed'].includes(e.type))errors++;
 }
 const validSummary=report.summary.checked===num&&report.summary.required===required.size&&
  exactArray(report.summary.missing,missing)&&exactArray(report.summary.needsHelp,failed)&&
  report.summary.scannerErrors===errors&&
  report.summary.locallyComplete===(missing.length===0&&failed.length===0&&errors===0);
 if(!validSummary)throw Error('Device report completion summary is inconsistent with recorded checks');
 return {platform,build:report.appRelease,checksCompleted:num,totalChecks:required.size,
  missing,needsHelp:failed,scannerErrors:errors,localSelfReportedComplete:report.summary.locallyComplete};
}
export function comparePrivatePhonePilotReports(android,ios){
 const a=review(android,'Android'),i=review(ios,'iPhone/iPad');
 const sameBuild=a.build===i.build;
 const blockers=[
  ...(!sameBuild?['different-app-builds']:[]),
  ...(!a.localSelfReportedComplete?['android-needs-review']:[]),
  ...(!i.localSelfReportedComplete?['ios-needs-review']:[])
 ];
 return {schemaVersion:1,status:blockers.length?'blocked-manual-checks-incomplete':'manual-human-evidence-review-required',
  branchOrDeploymentVerified:false,android:a,iphone:i,
  bothReportsSameBuild:sameBuild? a.build:null,
  blockers,independentPhysicalDevicesConfirmed:false,
  actualHardwareCameraVerified:null,actualOriginalPhotoFormAccuracy:null,
  actualLayeredItemRecall:null,realProviderFidelity:null,
  realSignupEmailDeliveryVerified:false,
  stagedDomainOwnershipVerified:false,paidProviderUsed:false,
  realCustomerPhotosStoredByThisTool:false,
  deploymentPerformed:false,productionReleaseApproved:false,
  limitations:'These are untrusted self-reported browser checklist records. User-agent platform can be spoofed, two independent physical testers are not proven, and only an authorized human can review private on-device evidence and staging provenance.'
 };
}
