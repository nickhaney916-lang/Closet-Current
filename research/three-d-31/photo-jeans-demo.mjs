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
 // Source-derived neutral backing from only high-opacity original denim, never
 // fabricated texture/detail for the side or unphotographed rear.
 const colors=[[],[],[]];for(let i=0;i<a.length;i+=16)if(b[i+3]>=240&&b[i+2]>b[i]&&b[i+2]>b[i+1]){
  for(let k=0;k<3;k++)colors[k].push(b[i+k]);
 }
 if(colors.some(v=>v.length<100))throw Error('Cannot establish source-denim neutral color');
 const neutralRGB=colors.map(v=>{v.sort((x,y)=>x-y);return v[Math.floor(v.length/2)];});
 return {pixels:n,neutralRGB};
}
function update(){if(app)$('diagnostics').textContent=JSON.stringify(app.getState(),null,2);}
async function start(){
 if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname))throw Error('Research preview is localhost only');
 const independentGarments=new URLSearchParams(location.search).get('construction')==='after';
 const poseContactFactory=independentGarments?(await import('../three-d-42/posed-contact.mjs')).createPoseContact:null;
 app=mountAnatomicalShowroom($('avatar'),{independentGarments,poseContactFactory,poseConditionedSleeveDrape:independentGarments&&new URLSearchParams(location.search).get('move56')==='after',crispSourcePhotoClarity:independentGarments&&new URLSearchParams(location.search).get('crisp58')==='after',tailoredShoulderSleeves:independentGarments&&new URLSearchParams(location.search).get('sleeve44')==='after',independentShoulderCaps:independentGarments&&new URLSearchParams(location.search).get('sleeve44')==='after'&&new URLSearchParams(location.search).get('caps45')==='after',realisticShoulderContour:independentGarments&&new URLSearchParams(location.search).get('caps45')==='after'&&new URLSearchParams(location.search).get('contour46')==='after',upperArmFabricVolume:independentGarments&&new URLSearchParams(location.search).get('contour46')==='after'&&new URLSearchParams(location.search).get('volume47')==='after',sourceNeutralCollarRoll:independentGarments&&new URLSearchParams(location.search).get('volume47')==='after'&&new URLSearchParams(location.search).get('collar48')==='after',rearShirtFabricRelief:independentGarments&&new URLSearchParams(location.search).get('collar48')==='after'&&new URLSearchParams(location.search).get('rear53')==='after',naturalShoulderSleeveTransition:independentGarments&&new URLSearchParams(location.search).get('rear53')==='after'&&new URLSearchParams(location.search).get('round54')==='after',sourceMeasuredSleeveHang:independentGarments&&new URLSearchParams(location.search).get('rear53')==='after'&&new URLSearchParams(location.search).get('round54')==='after'&&new URLSearchParams(location.search).get('hang55')==='after',naturalPantsDrape:new URLSearchParams(location.search).get('pantsDrape')!=='before',posteriorJeansFairing:new URLSearchParams(location.search).get('seatFairing')!=='before',structuralPantsEnvelope:new URLSearchParams(location.search).get('envelope')!=='before',independentJeansLoft:new URLSearchParams(location.search).get('loft')!=='before',crotchSeatPanel:new URLSearchParams(location.search).get('crotchPanel')!=='before',sourceShirtWaistFit:new URLSearchParams(location.search).get('waistFit')!=='before',clothWaistContact:new URLSearchParams(location.search).get('waistContact')!=='before',shirtHangingSilhouette:new URLSearchParams(location.search).get('hanging')!=='before',denimHangingSilhouette:new URLSearchParams(location.search).get('hanging')!=='before',jeansPanelFall:new URLSearchParams(location.search).get('clothFall')==='after'});app.start();
 const [original,cutout,m]=await Promise.all([
  imageFrom('/benchmark/three-d-31/original-jeans.jpg',PANTS_RESEARCH_SOURCE.originalSHA256,'source'),
  imageFrom('/benchmark/three-d-31/cutout-proposal.png',PANTS_RESEARCH_SOURCE.cutoutSHA256,'mask'),
  fetch('/benchmark/three-d-31/metrics.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Provenance missing');return r.json();})
 ]);
 if(m.originalSHA256!==PANTS_RESEARCH_SOURCE.originalSHA256||m.cutoutSHA256!==PANTS_RESEARCH_SOURCE.cutoutSHA256||m.ownerApproved!==false||m.releaseAuthorized!==false||m.humanVisualApproval!==false||m.imageOrientation!=='laid-flat-front')throw Error('Research proposal provenance mismatch');
 const verified=verifyVisibleRGB(original,cutout);
 if(!Array.isArray(m.bbox)||m.bbox.length!==4||m.width!==435||m.height!==650)throw Error('Pinned silhouette bounds missing');
 const [l,t,r,b]=m.bbox;
 if(l<0||t<0||r>=m.width||b>=m.height||r-l<200||b-t<300)throw Error('Invalid verified pants alpha silhouette');
 // Cropping to the SOURCE alpha silhouette—not the JPEG background—keeps
 // original photographed waistband and hems aligned to the skinned pants.
 const cropRect=[l/m.width,t/m.height,(r-l+1)/m.width,(b-t+1)/m.height];
 $('original').src=original.src;$('cutout').src=cutout.src;
 pants=Object.freeze({id:PANTS_RESEARCH_SOURCE.id,type:'pants',sourceSHA256:PANTS_RESEARCH_SOURCE.originalSHA256,cutoutSHA256:PANTS_RESEARCH_SOURCE.cutoutSHA256,
  cutout,original,originalVerified:true,cutoutVerified:true,sourceAssetsVerified:true,visibleSourceRGBPreserved:true,frontOrientationReviewed:true,
  cropRect,neutralColorRGB:verified.neutralRGB,ownerApproved:false,humanVisualApproval:false,releaseAuthorized:false,provisional:true});
 const manifest=await fetch('/benchmark/work47/manifest.json',{cache:'no-store'}).then(r=>r.json());
 shirt=await loadLicensedCutout('commons-0003',{manifest,reviewConfirmed:true});
 await app.load('female');ready=true;status('Original RGB verified at '+verified.pixels+' visible pixels; source-dominant neutral backing and alpha silhouette registered. Research mask REVIEW · HOLD');update();
 $('model').addEventListener('change',async()=>{if(closed)return;ready=false;$('review').checked=false;$('photo').disabled=true;$('full').disabled=true;await app.load($('model').value);ready=true;update();status('New original anatomical model · provisional photo requires fresh review');});
 $('review').addEventListener('change',()=>{$('photo').disabled=!ready||!$('review').checked;$('full').disabled=!ready||!$('review').checked;});
 for(const angle of ['front','side','back'])$(angle).addEventListener('click',()=>{app[angle]();update();});
 $('threequarter').addEventListener('click',()=>{app.rotate(30);update();});
 $('pose').addEventListener('change',()=>{app.setPose($('pose').value);update();});
 $('neutral').addEventListener('click',()=>{if(!ready)return;app.applyOutfit('pants');status('Original neutral anatomical research pants. No photographed cloth applied.');update();});
 $('photo').addEventListener('click',e=>{if(!ready||!e.isTrusted||!$('review').checked)return;app.applyOutfit('pants',null,{pantsCandidate:pants,pantsReviewed:true});status('Original denim front pixels on 3D pant mesh · unphotographed neutral back · HOLD');update();});
 $('full').addEventListener('click',e=>{if(!ready||!e.isTrusted||!$('review').checked)return;app.applyOutfit('shirt-pants',shirt,{reviewed:true,pantsCandidate:pants,pantsReviewed:true});status('Original AJ shirt plus original denim pixels on separate 3D pants · HOLD');update();});
 window.cc31Diagnostics=()=>app.getState();
 if(new URLSearchParams(location.search).has('move56'))window.cc56InspectSleeves=(angle)=>{
  if(!ready||app.getState().outfit.mode!=='shirt-pants')throw Error('Reviewed real original outfit required');
  app.inspectSleeves(angle);update();return app.getState();
 };
 // Localhost, explicit research opt-in only. The source-photo review gate
 // and actual original garment/rig loading must already be completed.
 if(new URLSearchParams(location.search).get('sweep')==='after')window.cc43SetPose=(pose)=>{
  if(!ready||!['source','blend-25','blend-50','blend-75','relaxed'].includes(pose))throw Error('Original licensed outfit or approved research pose unavailable');
  const state=app.getState();if(state.outfit?.mode!=='shirt-pants'||!state.outfit?.shirt?.poseTriangleContact)throw Error('Original reviewed shirt/jeans with independent pose solver required');
  app.setPose(pose);update();return app.getState();
 };
window.addEventListener('pagehide',()=>{closed=true;app.stop();urls.forEach(u=>URL.revokeObjectURL(u));});
}
start().catch(e=>{status('Provisional image preview blocked: '+e.message);$('review').disabled=true;$('photo').disabled=true;$('full').disabled=true;console.error(e);});
