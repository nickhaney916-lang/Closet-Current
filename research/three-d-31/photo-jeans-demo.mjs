/** 3D31: local-only owner-review research preview. No photo is automatically
 * accepted, no camera, storage, accounts, backend or deployment. */
import {mountAnatomicalShowroom} from '../three-d-15/showroom.mjs';
import {PANTS_RESEARCH_SOURCE} from '../three-d-30/reviewed-photo-pants.mjs';
import {loadLicensedCutout} from '../three-d-02/reviewed-texture.mjs';
const $=id=>document.getElementById(id),urls=[],status=text=>{$('status').textContent=text;};
let app,pants,shirt,ready=false,closed=false;
const digest=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
async function imageFrom(url,sha,id){
 if(!/^\/benchmark\/(?:three-d-31\/(?:original-jeans\.jpg|cutout-proposal\.png)|work47\/assets\/commons-0003\.(?:jpg|png))$/.test(url))throw Error('Only original local research assets allowed');
 const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw Error('Original source unavailable: '+id);
 const ab=await res.arrayBuffer();if(ab.byteLength<1000||ab.byteLength>3e6||await digest(ab)!==sha)throw Error('Original image hash mismatch: '+id);
 const b=new Blob([ab],{type:url.endsWith('.png')?'image/png':'image/jpeg'}),u=URL.createObjectURL(b);urls.push(u);
 const img=new Image();img.src=u;await img.decode();return img;
}
function verifyVisibleRGB(original,cutout){
 if(original.naturalWidth!==cutout.naturalWidth||original.naturalHeight!==cutout.naturalHeight||original.naturalWidth!==435||original.naturalHeight!==650)throw Error('Original image dimensions changed');
 const w=original.naturalWidth,h=original.naturalHeight,read=img=>{const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);return ctx.getImageData(0,0,w,h).data;};
 const a=read(original),b=read(cutout);let n=0,violations=0;
 for(let i=0;i<a.length;i+=4)if(b[i+3]){n++;if(Math.abs(a[i]-b[i])>2||Math.abs(a[i+1]-b[i+1])>2||Math.abs(a[i+2]-b[i+2])>2)violations++;}
 if(n<60000||violations>0)throw Error('Visible jeans fabric RGB mismatch; preview blocked ('+violations+')');
 return n;
}
function update(){if(app)$('diagnostics').textContent=JSON.stringify(app.getState(),null,2);}
async function start(){
 if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname))throw Error('Research preview is localhost only');
 app=mountAnatomicalShowroom($('avatar'));app.start();
 const [original,cutout,m]=await Promise.all([
  imageFrom('/benchmark/three-d-31/original-jeans.jpg',PANTS_RESEARCH_SOURCE.originalSHA256,'source'),
  imageFrom('/benchmark/three-d-31/cutout-proposal.png',PANTS_RESEARCH_SOURCE.cutoutSHA256,'mask'),
  fetch('/benchmark/three-d-31/metrics.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Provenance missing');return r.json();})
 ]);
 if(m.originalSHA256!==PANTS_RESEARCH_SOURCE.originalSHA256||m.cutoutSHA256!==PANTS_RESEARCH_SOURCE.cutoutSHA256||m.ownerApproved!==false||m.releaseAuthorized!==false||m.humanVisualApproval!==false||m.imageOrientation!=='laid-flat-front')throw Error('Research proposal provenance mismatch');
 const pixels=verifyVisibleRGB(original,cutout);
 $('original').src=original.src;$('cutout').src=cutout.src;
 pants=Object.freeze({id:PANTS_RESEARCH_SOURCE.id,type:'pants',sourceSHA256:PANTS_RESEARCH_SOURCE.originalSHA256,cutoutSHA256:PANTS_RESEARCH_SOURCE.cutoutSHA256,
  cutout,original,originalVerified:true,cutoutVerified:true,visibleSourceRGBPreserved:true,frontOrientationReviewed:true,
  cropRect:[0,0,1,1],ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false,provisional:true});
 const manifest=await fetch('/benchmark/work47/manifest.json',{cache:'no-store'}).then(r=>r.json());
 shirt=await loadLicensedCutout('commons-0003',{manifest,reviewConfirmed:true});
 await app.load('female');ready=true;status('Original RGB verified at '+pixels+' visible pixels. Research image not owner-approved · HOLD');update();
 $('model').addEventListener('change',async()=>{if(closed)return;ready=false;$('review').checked=false;$('photo').disabled=true;$('full').disabled=true;await app.load($('model').value);ready=true;update();status('New original anatomical model · provisional photo requires fresh review');});
 $('review').addEventListener('change',()=>{$('photo').disabled=!ready||!$('review').checked;$('full').disabled=!ready||!$('review').checked;});
 for(const angle of ['front','side','back'])$(angle).addEventListener('click',()=>{app[angle]();update();});
 $('threequarter').addEventListener('click',()=>{app.rotate(30);update();});
 $('pose').addEventListener('change',()=>{app.setPose($('pose').value);update();});
 $('neutral').addEventListener('click',()=>{if(!ready)return;app.applyOutfit('pants');status('Original neutral anatomical research pants. No photographed cloth applied.');update();});
 $('photo').addEventListener('click',e=>{if(!ready||!e.isTrusted||!$('review').checked)return;app.applyOutfit('pants',null,{pantsCandidate:pants,pantsReviewed:true});status('Original denim front pixels on 3D pant mesh · unphotographed neutral back · HOLD');update();});
 $('full').addEventListener('click',e=>{if(!ready||!e.isTrusted||!$('review').checked)return;app.applyOutfit('shirt-pants',shirt,{reviewed:true,pantsCandidate:pants,pantsReviewed:true});status('Original AJ shirt plus original denim pixels on separate 3D pants · HOLD');update();});
 window.cc31Diagnostics=()=>app.getState();window.addEventListener('pagehide',()=>{closed=true;app.stop();urls.forEach(u=>URL.revokeObjectURL(u));});
}
start().catch(e=>{status('Provisional image preview blocked: '+e.message);$('review').disabled=true;$('photo').disabled=true;$('full').disabled=true;console.error(e);});
