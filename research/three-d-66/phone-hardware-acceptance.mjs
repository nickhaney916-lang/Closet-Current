/** Hardware acceptance is a separate HUMAN evidence gate. Browser mobile
 * viewport simulation, user-agent spoofing and even native Android emulators
 * MUST NOT set physicalPhoneAccepted. No account/photo data is transmitted.
 */
export const PHONE_QA_CASES=Object.freeze([
 'verified_original_photo_front',
 'three_quarter_side_back_neutral_source_truth',
 'female_male_anatomical_load',
 'pose_source_blend_relaxed_zero_sampled_contact',
 'garment_swap_no_leaked_textures',
 'portrait_landscape_touch_rotate_zoom',
 'app_background_resume_and_webgl_context',
 'memory_and_render_responsiveness',
 'relaunch_session_and_isolated_account',
 'camera_capture_original_no_gallery_leak'
]);
const validHash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/i.test(x);
const isRealDeviceName=x=>typeof x==='string'&&x.trim().length>=4&&x.length<=160;
export function assessPhysicalPhoneEvidence(report){
 const failure=[];
 if(!report||typeof report!=='object')return {status:'HOLD',physicalPhoneAccepted:false,reasons:['Missing real hardware report']};
 if(!['Android','iPhone'].includes(report.platform))failure.push('Actual Android or iPhone platform required');
 if(!isRealDeviceName(report.makeModel))failure.push('Actual physical phone make/model missing');
 if(!isRealDeviceName(report.osVersion))failure.push('Physical phone OS version missing');
 if(!['Chrome','Safari'].includes(report.browser))failure.push('Actual device browser unverified');
 if(report.platform==='Android'&&report.browser!=='Chrome'||report.platform==='iPhone'&&report.browser!=='Safari')
  failure.push('Android Chrome and iPhone Safari must be separately tested');
 if(report.runEnvironment!=='physical-device' || report.physicalDeviceObserved!==true)
  failure.push('Emulator, simulator, desktop viewport and unobserved devices cannot pass');
 if(report.localTestOriginVerified!==true)failure.push('Actual source-verified private testing origin not confirmed');
 if(!validHash(report.originalSourceScreenshotSHA256))failure.push('Real screenshot evidence SHA-256 missing');
 if(!validHash(report.actualDeviceRecordingSHA256))failure.push('Actual physical phone recording SHA-256 missing');
 if(!isRealDeviceName(report.gitCommitSHA)||!/^[a-f0-9]{40}$/i.test(report.gitCommitSHA))
  failure.push('Exact tested GitHub code commit missing');
 if(!Array.isArray(report.cases)||report.cases.length!==PHONE_QA_CASES.length)
  failure.push('Required hardware acceptance cases missing');
 else{
  for(const check of PHONE_QA_CASES){
   const records=report.cases.filter(x=>x?.id===check);
   if(records.length!==1||records[0].status!=='PASS')failure.push('Unpassed hardware case '+check);
  }
 }
 const perf=report.performance;
 if(!perf||typeof perf!=='object'||!Number.isFinite(perf.maxMemoryMiB)||
    perf.maxMemoryMiB<=0||!Number.isFinite(perf.p95RenderMs)||perf.p95RenderMs<=0)
  failure.push('Real device observed renderer latency and memory records missing');
 if(report.independentHumanReviewerSigned!==true)
  failure.push('Independent reviewer has not checked actual hardware screenshots and recording');
 if(!isRealDeviceName(report.reviewerNameOrHandle))
  failure.push('Independent human reviewer identity missing');
 // A SINGLE phone is not enough for a two-platform gate. This function only
 // validates one completed evidentiary record; family gate remains HOLD until
 // Android and iPhone records have been independently accepted and signed.
 return Object.freeze({status:failure.length===0?'EVIDENCE_READY_FOR_REVIEW':'HOLD',
  physicalPhoneAccepted:false,reasons:failure,
  gate:'Independent manual verification of two separate real phones required'});
}
export function phoneReleaseGate(reports){
 if(!Array.isArray(reports))return {status:'HOLD',releaseAuthorized:false,physicalPhoneAccepted:false,
  reasons:['Both actual device platforms required']};
 const android=reports.find(x=>x?.platform==='Android'),iphone=reports.find(x=>x?.platform==='iPhone');
 const reasons=[];
 if(!android||!iphone)reasons.push('Both physical Android Chrome and physical iPhone Safari evidence missing');
 for(const r of [android,iphone].filter(Boolean)){
  const check=assessPhysicalPhoneEvidence(r);
  if(check.status!=='EVIDENCE_READY_FOR_REVIEW')reasons.push(...check.reasons);
 }
 // Never self-certify acceptance based on untrusted browser-provided fields,
 // even if data is complete. A human/owner must review real files externally.
 return {status:reasons.length?'HOLD':'PENDING_INDEPENDENT_HARDWARE_SIGNOFF',
  releaseAuthorized:false,physicalPhoneAccepted:false,reasons};
}
