'use strict';
const deviceCheckSteps=[
 ['login','Log in','New testers: create an account and open the newest confirmation email first. Existing testers: log in.'],
 ['capture','Take a clothing photo','Use one garment in good light. Fill most of the frame.'],
 ['cameraModes','Try camera controls','Take a manual photo, then try hands-free photos at 5 seconds. Tap Done and confirm capturing stops.'],
 ['recognition','Check the result','Confirm the type and color are correct. Unknown details should stay unknown.'],
 ['adjust','Adjust a result','Use Adjust to correct one garment, save it, and confirm the correction appears in My closet.'],
 ['outfitCapture','Separate an outfit photo','Use Add clothes → Whole outfit. Check each cutout; add only pieces you own. Unclear pieces should allow Adjust.'],
 ['closet','Find it in My closet','Confirm the photo and corrected details are saved.'],
 ['outfit','Create an outfit','Choose Style → Everyday and check that it uses your own clothes.'],
 ['return','Close and reopen','Return to this same app and account. Check your clothes and outfit are still here.'],
 ['backup','Export a backup','Use My closet → Export backup and confirm the file downloads.']
];
const deviceEventTypes=['photo_queued','setup_start','setup_ready','scanner_progress','scanner_error','worker_start_failed','timeout','not_recognized','duplicate_review','blank_skipped','exact_duplicate_skipped','recognized_saved','photo_check_failed','outfit_split_start','outfit_split_ready','outfit_split_failed'];
const deviceErrorCodes=['network','memory','runtime','image','asset','unknown'];
const deviceStages=['idle','runtime','weights','runtime_import','model_download','ready','catalog_import','identify','details','photo_check'];
function cleanDeviceEvent(type,value={}){
 if(!deviceEventTypes.includes(type))return null;
 const result={type};
 if(deviceStages.includes(value.stage))result.stage=value.stage;
 if(deviceErrorCodes.includes(value.code))result.code=value.code;
 if(Number.isFinite(value.durationMs))result.durationMs=Math.max(0,Math.min(600000,Math.round(value.durationMs)));
 if(Number.isFinite(value.percent))result.percent=Math.max(0,Math.min(100,Math.round(value.percent)));
 return result;
}
function cleanDeviceCheck(value){
 const steps={};for(const [id]of deviceCheckSteps)if(['pass','fail'].includes(value?.steps?.[id]))steps[id]=value.steps[id];
 return {enabled:value?.enabled===true,steps,events:(Array.isArray(value?.events)?value.events:[]).map(x=>x&&typeof x==='object'?cleanDeviceEvent(x.type,x):null).filter(Boolean).slice(-40)};
}
function deviceCheckReport(state,release='',platform='Other'){
 const clean=cleanDeviceCheck(state);
 return {format:'closet-current-device-check',version:1,appRelease:/^[a-f0-9]{12}$/.test(release)?release:'unavailable',platform:['Android','iPhone/iPad','Desktop','Other'].includes(platform)?platform:'Other',steps:clean.steps,events:clean.events};
}
if(typeof module!=='undefined')module.exports={deviceCheckSteps,cleanDeviceEvent,cleanDeviceCheck,deviceCheckReport};
