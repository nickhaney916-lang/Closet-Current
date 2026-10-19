'use strict';
let deviceCheckState=cleanDeviceCheck(null),deviceCheckInitialized=false,deviceCheckTimer=null,lastProgressKey='';
function saveDeviceCheck(){
 if(!db||!deviceCheckInitialized)return Promise.reject(Error('Local test storage is unavailable.'));
 const snapshot=cleanDeviceCheck(deviceCheckState);
 return queued(()=>new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put({id:'device-check',...snapshot});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);}));
}
function recordDeviceEvent(type,value={}){
 if(!deviceCheckInitialized||!deviceCheckState.enabled)return;
 const event=cleanDeviceEvent(type,value);if(!event)return;
 if(type==='scanner_progress'){const key=(event.stage||'')+':'+Math.floor((event.percent||0)/10);if(key===lastProgressKey)return;lastProgressKey=key;}
 deviceCheckState.events.push(event);deviceCheckState.events=deviceCheckState.events.slice(-40);renderDeviceCheckSummary();
 clearTimeout(deviceCheckTimer);deviceCheckTimer=setTimeout(()=>saveDeviceCheck().catch(()=>{$('deviceCheckStatus').textContent='Test results could not be saved. Keep this page open and download the report.';}),1000);
}
function renderDeviceCheckSummary(){
 const checked=Object.keys(deviceCheckState.steps).length,failed=Object.values(deviceCheckState.steps).filter(x=>x==='fail').length;
 const remaining=deviceCheckSteps.length-checked;
 $('deviceCheckSummary').textContent=checked+' of '+deviceCheckSteps.length+' checks completed'+
  (remaining?' · '+remaining+' still untested':'')+
  (failed?' · '+failed+' need attention':'')+'. '+
  (deviceCheckState.enabled?'Scan timing is being recorded on this device.':'Scan timing recording is off.')+
  ' This is your review, not automatic proof of real-phone accuracy.';
 const events=deviceCheckState.events,failures=events.filter(x=>['scanner_error','worker_start_failed','timeout','photo_check_failed','outfit_split_failed'].includes(x.type)).length,scans=events.filter(x=>x.type==='recognized_saved').length;
 $('deviceScanSummary').textContent=events.length?scans+' saved scan result'+(scans===1?'':'s')+' · '+failures+' scanner issue'+(failures===1?'':'s')+' recorded in this test.':'Start a test, then take a photo to record scanner timing.';
}
function renderDeviceCheck(){
 const grid=$('deviceCheckSteps');grid.replaceChildren();
 for(const [id,title,hint]of deviceCheckSteps){const row=node('div',null,'device-step');row.append(node('strong',title),node('p',hint));const actions=node('div',null,'actions');
  for(const [value,label]of [['pass','Works'],['fail','Needs help']]){const button=node('button',label,'secondary');button.type='button';button.setAttribute('aria-label',title+': '+label);button.setAttribute('aria-pressed',String(deviceCheckState.steps[id]===value));button.onclick=async()=>{deviceCheckState.steps[id]=value;renderDeviceCheck();try{await saveDeviceCheck();}catch{$('deviceCheckStatus').textContent='Could not save that check. Download the report before closing.';}};actions.append(button);}row.append(actions);grid.append(row);
 }
 $('startDeviceCheck').textContent=deviceCheckState.enabled?'Restart test':'Start device test';$('stopDeviceCheck').hidden=!deviceCheckState.enabled;renderDeviceCheckSummary();
}
$('startDeviceCheck').onclick=async()=>{
 if(deviceCheckState.enabled&&!confirm('Restart this test? The current test results will be cleared; your clothing and outfits stay unchanged.'))return;
 clearTimeout(deviceCheckTimer);deviceCheckState=cleanDeviceCheck({enabled:true});lastProgressKey='';renderDeviceCheck();
 try{await saveDeviceCheck();$('deviceCheckStatus').textContent='Test started. Use Add clothes to take one clear garment photo, then return here.';}catch{$('deviceCheckStatus').textContent='Recording for this open session. Download the report before closing.';}
};
$('stopDeviceCheck').onclick=async()=>{deviceCheckState.enabled=false;clearTimeout(deviceCheckTimer);renderDeviceCheck();try{await saveDeviceCheck();$('deviceCheckStatus').textContent='Test stopped. Your results are kept.';}catch{$('deviceCheckStatus').textContent='Download the report to keep your results.';}};
$('downloadDeviceCheck').onclick=()=>{
 const platform=/Android/i.test(navigator.userAgent)?'Android':/iPhone|iPad|iPod/i.test(navigator.userAgent)?'iPhone/iPad':/Windows|Macintosh|Linux/i.test(navigator.userAgent)?'Desktop':'Other';
 const report=deviceCheckReport(deviceCheckState,recognitionAssetVersion,platform),blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=node('a');link.href=url;link.download='closet-current-device-check.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 const outcome=report.summary;
 $('deviceCheckStatus').textContent='Private report downloaded. '+
  (outcome.locallyComplete?'All manual checks marked Works; independent device verification is still required.':
   outcome.missing.length+' checks remain untested and '+outcome.needsHelp.length+' need help.')+
  ' The file contains no photos or account identifiers. Share it only with someone helping review the pilot.';
};
$('deviceCheckAddClothes').onclick=()=>switchView('scan');
(async()=>{await closetReady;if(db){try{const saved=await new Promise((resolve,reject)=>{const r=db.transaction('state').objectStore('state').get('device-check');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});deviceCheckState=cleanDeviceCheck(saved);}catch{$('deviceCheckStatus').textContent='Previous test results could not be loaded.';}}deviceCheckInitialized=true;$('startDeviceCheck').disabled=false;renderDeviceCheck();})();
