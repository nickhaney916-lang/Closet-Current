'use strict';
function setCaptureMode(mode){
 if(busy)return;
 if(stream||cameraOpening)stopCamera();
 const whole=mode==='outfit';
 $('scanner').hidden=whole;$('wholeOutfitCapture').hidden=!whole;
 $('captureSingle').setAttribute('aria-pressed',String(!whole));$('captureOutfit').setAttribute('aria-pressed',String(whole));
 $('captureSaveHint').textContent=whole?'Choose each separated piece, then review before saving':'Review and confirm each garment before it enters My Closet.';
}
$('captureSingle').onclick=()=>setCaptureMode('single');
$('captureOutfit').onclick=()=>setCaptureMode('outfit');
