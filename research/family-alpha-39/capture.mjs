import {assessPhoto} from './quality.mjs';
const $=s=>document.querySelector(s);const video=$('#video'),photo=$('#photo'),review=$('#review'),status=$('#status');
let stream=null,blob=null,url=null,series=false,timer=null,generation=0,accepted=[];
function clearPending(){generation++;if(url)URL.revokeObjectURL(url);url=null;blob=null;photo.removeAttribute('src');review.hidden=true;}
function stop(){generation++;series=false;clearTimeout(timer);timer=null;if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;video.hidden=true;$('#stop').hidden=true;$('#take').hidden=true;$('#series').hidden=true;}
async function inspect(file){
 clearTimeout(timer);timer=null;clearPending();const token=generation;blob=file;url=URL.createObjectURL(file);photo.src=url;review.hidden=false;$('#use').disabled=true;$('#retake').disabled=false;$('#notice').textContent='Checking photo…';
 try{
  await photo.decode();if(token!==generation)return;
  const w=photo.naturalWidth,h=photo.naturalHeight;if(!w||!h)throw Error();
  const scale=Math.min(1,128/Math.max(w,h));const canvas=document.createElement('canvas');canvas.width=Math.max(3,Math.round(w*scale));canvas.height=Math.max(3,Math.round(h*scale));
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error();ctx.drawImage(photo,0,0,canvas.width,canvas.height);
  const result=assessPhoto({width:w,height:h,sampleWidth:canvas.width,sampleHeight:canvas.height,rgba:ctx.getImageData(0,0,canvas.width,canvas.height).data});
  $('#notice').textContent=result.hint?.text||'No obvious lighting or resolution warning. Please check the photo yourself.';
 }catch{if(token!==generation)return;$('#notice').textContent='Could not assess this photo. You can still use it or retake it.';}
 if(token===generation)$('#use').disabled=false;
}
async function take(){
 if(!stream||!video.videoWidth||review.hidden===false)return;
 try{const token=generation;const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;const ctx=c.getContext('2d');if(!ctx)throw Error();ctx.drawImage(video,0,0);const b=await new Promise((resolve,reject)=>c.toBlob(v=>v?resolve(v):reject(Error()),'image/jpeg',.94));if(token!==generation)return;await inspect(b);}catch{status.textContent='Could not capture this frame. Try again.';}
}
$('#start').onclick=async()=>{try{stop();const token=generation;const acquired=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},audio:false});if(token!==generation){acquired.getTracks().forEach(t=>t.stop());return;}stream=acquired;video.srcObject=stream;await video.play();if(token!==generation)return;video.hidden=false;$('#stop').hidden=false;$('#take').hidden=false;$('#series').hidden=false;status.textContent='Hold steady and include the whole garment.';}catch{stop();status.textContent='Camera unavailable. Choose an existing photo instead.';}};
$('#stop').onclick=()=>{stop();status.textContent='Camera stopped.';};$('#take').onclick=take;
$('#series').onclick=()=>{series=true;status.textContent='Timed capture: reviewing each frame before the next.';take();};
$('#file').onchange=async e=>{const f=e.target.files?.[0];e.target.value='';if(f){series=false;await inspect(f);}};
$('#use').onclick=()=>{if(!blob)return;accepted.push(blob);clearPending();status.textContent=`${accepted.length} photo(s) held in this page only; not saved to your closet.`;if(series&&stream){status.textContent+=' Next photo in 3 seconds.';timer=setTimeout(take,3000);}};
$('#retake').onclick=()=>{clearPending();series=false;status.textContent='Retake when ready.';};
window.addEventListener('pagehide',()=>{stop();clearPending();accepted=[];});
