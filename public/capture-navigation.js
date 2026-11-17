'use strict';
function setCaptureMode(mode){
 if(busy)return;
 if(stream||cameraOpening)stopCamera();
 const whole=mode==='outfit';
 $('scanner').hidden=whole;$('wholeOutfitCapture').hidden=!whole;
 $('captureSingle').setAttribute('aria-pressed',String(!whole));$('captureOutfit').setAttribute('aria-pressed',String(whole));
 $('captureSaveHint').textContent=whole?'Choose each separated piece, then review before saving':'Review each garment before adding it to My Closet. Unclear pieces stay here for review.';
}
$('captureSingle').onclick=()=>setCaptureMode('single');
$('captureOutfit').onclick=()=>setCaptureMode('outfit');
