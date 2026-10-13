'use strict';
function setCaptureMode(mode){
 if(busy)return;
 if(stream||cameraOpening)stopCamera();
 const whole=mode==='outfit';
 $('scanner').hidden=whole;$('wholeOutfitCapture').hidden=!whole;
 $('captureSingle').setAttribute('aria-pressed',String(!whole));$('captureOutfit').setAttribute('aria-pressed',String(whole));
 $('captureSaveHint').textContent=whole?'Choose which outfit pieces to add':'Recognized single items save automatically';
}
$('captureSingle').onclick=()=>setCaptureMode('single');
$('captureOutfit').onclick=()=>setCaptureMode('outfit');
